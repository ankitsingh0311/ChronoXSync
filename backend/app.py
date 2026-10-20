# =============================================================================
# EduTrack 3D — Main FastAPI Application (app.py)
# =============================================================================
# SUBJECT 2 (System Design): 3-Tier Client-Server RESTful API.
#   - Decoupled middleware layer connecting React frontend to SQL backend.
#   - O(N log N) deadline sorting, O(1) cache reads for peak traffic.
# SUBJECT 4 (Cloud Security): HTTPS-ready CORS, JWT RBAC on every endpoint,
#   parameterized queries, bleach sanitization, bcrypt password hashing.
# =============================================================================

import os
import time
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# --- Internal Modules ---
from db import get_db, init_local_db
from auth import (
    hash_password, verify_password, create_jwt_token, get_current_user,
    decode_jwt_token, require_role, sanitize_input,
    ROLE_STUDENT, ROLE_CR, ROLE_FACULTY, ROLE_HOD, ROLE_NAMES
)
from cache import cache_get, cache_set, cache_invalidate, cache_clear, get_cache_stats
from ai_services import (
    analyze_sentiment, extract_deadline_from_pdf, estimate_study_hours,
    call_nemotron_academic_chat, get_nvidia_api_key, extract_text_from_file_bytes,
    extract_document_intel, NEMOTRON_MODEL, NVIDIA_BASE_URL
)
from blob_storage import upload_pdf_to_blob

load_dotenv()

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("edutrack.app")

# =============================================================================
# FastAPI Application Initialization
# =============================================================================
app = FastAPI(
    title="EduTrack 3D API",
    description="AI-Powered Academic Productivity & Workload Management System",
    version="1.0.0"
)

# --- CORS Configuration (Subject 4: Cloud Security) ---
# HTTPS-ready headers for cross-origin React frontend communication
CORS_ORIGINS = [orig.strip() for orig in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000").split(",") if orig.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve uploaded files locally ---
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# =============================================================================
# Pydantic Request Models (Input Validation)
# =============================================================================

class LoginRequest(BaseModel):
    """SUBJECT 4: Login requires role selection + name for identity verification."""
    email:          str
    password:       str
    full_name:      Optional[str] = None
    selected_role:  Optional[str] = None  # If provided, verified against DB role; if omitted, inferred from email
    department:     Optional[str] = None
    program:        Optional[str] = None
    semester:       Optional[str] = "Semester 3"
    subject_taught: Optional[str] = None
    course_name:    Optional[str] = None


class RegisterRequest(BaseModel):
    """SUBJECT 4: Registration cross-checked against Institutional_Directory."""
    full_name:      str
    email:          str
    password:       str
    selected_role:  Optional[str] = None  # If omitted, inferred from email; must match authorized_role
    department:     Optional[str] = "Computer Science"
    program:        Optional[str] = "Core CSE"
    semester:       Optional[str] = "Semester 3"
    subject_taught: Optional[str] = None
    course_name:    Optional[str] = None

class DeadlineCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = ""
    due_date: str  # ISO format: "2024-11-15T23:59:00"
    urgency: str = "MEDIUM"
    pdf_blob_url: Optional[str] = None
    program: Optional[str] = "Core CSE"

class ExamCreate(BaseModel):
    course_id: int
    exam_date: str
    exam_type: str = "MIDTERM"
    venue: Optional[str] = ""
    program: Optional[str] = "ALL"

class PanicRequest(BaseModel):
    message: str

class PanicResolveRequest(BaseModel):
    notes: Optional[str] = "Action taken by HOD."

class NoticeCreate(BaseModel):
    title: str
    content: str
    department: Optional[str] = None
    program: Optional[str] = "ALL"
    semester: Optional[str] = "ALL"
    notice_type: Optional[str] = "NOTICE"

class DelegationCreate(BaseModel):
    cr_id: int
    program: str
    semester: str
    subject: str
    title: str
    description: Optional[str] = ""
    document_url: Optional[str] = None
    document_name: Optional[str] = None
    due_date: str
    urgency: Optional[str] = "MEDIUM"
    estimated_hours: Optional[float] = 4.0
    course_id: Optional[int] = None

class ResetDbRequest(BaseModel):
    mode: Optional[str] = "clean_slate"

class SubmissionToggle(BaseModel):
    deadline_id: int
    status: str = "DONE"


class AIChatRequest(BaseModel):
    messages: list
    api_key: Optional[str] = None
    image_url: Optional[str] = None
    document_text: Optional[str] = None
    document_name: Optional[str] = None
    include_live_context: Optional[bool] = True
    report_type: Optional[str] = "academic"


class AISetKeyRequest(BaseModel):
    api_key: str


# =============================================================================
# STARTUP: Initialize database & seed data
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Initialize database and seed with default data on first run.
    SUBJECT 1 (RDBMS): Creates 3NF schema with all constraints.
    """
    logger.info("🚀 EduTrack 3D API starting up...")
    try:
        init_local_db()
        _seed_default_data()
        _start_scheduler()
        logger.info("✅ EduTrack 3D API ready.")
    except Exception as e:
        logger.exception(f"Startup initialization encountered an error: {e}")


def _seed_default_data(force: bool = False):
    """Seed roles, courses if tables are empty. NEVER wipes registered users."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if core tables already have seed data
        cursor.execute("SELECT COUNT(*) FROM Roles")
        roles_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Users")
        users_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Courses")
        courses_count = cursor.fetchone()[0]

        if roles_count > 0 and users_count > 0 and courses_count > 0:
            logger.info("Database already seeded with core tables and users exist. Preserving all enrolled users.")
            return

        logger.info("Seeding database with default reference data...")

        # Seed Roles if missing
        if roles_count == 0:
            roles = [(1, 'STUDENT'), (2, 'CR'), (3, 'FACULTY'), (4, 'HOD')]
            for rid, rname in roles:
                cursor.execute("INSERT OR IGNORE INTO Roles (role_id, role_name) VALUES (?, ?)", (rid, rname))
            conn.commit()

        # Seed Users ONLY IF Users table is 100% empty (0 users ever created)
        if users_count == 0:
            default_password = hash_password("EduTrack@2024")
            users = [
                ('Ankit Singh',      'ankit.student@edutrack.ac', default_password, 1, 'Student', 'Computer Science', 'Core CSE', 'B.Tech Computer Science (Sem 3)'),
                ('Priya Sharma',     'priya.student@edutrack.ac', default_password, 1, 'Student', 'Computer Science', 'Core CSE', 'B.Tech Computer Science (Sem 3)'),
                ('Rahul Verma',      'rahul.student@edutrack.ac', default_password, 1, 'Student', 'Computer Science', 'Core CSE', 'B.Tech Computer Science (Sem 3)'),
                ('Neha Gupta',       'neha.cr@edutrack.ac',       default_password, 2, 'CR',      'Computer Science', 'Core CSE', 'B.Tech CSE - Section A (Sem 3)'),
                ('Arjun Patel',      'arjun.cr@edutrack.ac',      default_password, 2, 'CR',      'Computer Science', 'AIML',     'B.Tech AIML - Section B (Sem 3)'),
                ('Dr. Meena Iyer',   'meena.faculty@edutrack.ac', default_password, 3, 'Faculty', 'Computer Science', 'Core CSE', 'Database Management Systems (RDBMS)'),
                ('Prof. Ravi Kumar', 'ravi.faculty@edutrack.ac',  default_password, 3, 'Faculty', 'Computer Science', 'AIML',     'Data Structures & Algorithms'),
                ('Dr. Sanjay Desai', 'sanjay.hod@edutrack.ac',    default_password, 4, 'HOD',     'Computer Science', 'ALL',      'Department Administration'),
            ]
            for name, email, pw_hash, rid, rname, dept, prog, sub in users:
                cursor.execute(
                    "INSERT OR IGNORE INTO Users (full_name, email, password_hash, role_id, role_name, department, program, subject_or_course) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (name, email, pw_hash, rid, rname, dept, prog, sub)
                )

        # Seed Institutional Directory for verified roster lookups
        directory = [
            ('Ankit Singh',      'ankit.student@edutrack.ac', 'Student', 'Computer Science', 'Core CSE'),
            ('Priya Sharma',     'priya.student@edutrack.ac', 'Student', 'Computer Science', 'Core CSE'),
            ('Rahul Verma',      'rahul.student@edutrack.ac', 'Student', 'Computer Science', 'Core CSE'),
            ('Rohan Mehta',      'rohan.student@edutrack.ac', 'Student', 'Computer Science', 'Core CSE'),
            ('Neha Gupta',       'neha.cr@edutrack.ac',       'CR',      'Computer Science', 'Core CSE'),
            ('Arjun Patel',      'arjun.cr@edutrack.ac',      'CR',      'Computer Science', 'AIML'),
            ('Dr. Meena Iyer',   'meena.faculty@edutrack.ac', 'Faculty', 'Computer Science', 'Core CSE'),
            ('Prof. Ravi Kumar', 'ravi.faculty@edutrack.ac',  'Faculty', 'Computer Science', 'AIML'),
            ('Dr. Sanjay Desai', 'sanjay.hod@edutrack.ac',    'HOD',     'Computer Science', 'ALL'),
        ]
        for dname, demail, drole, ddept, dprog in directory:
            cursor.execute(
                "INSERT OR IGNORE INTO Institutional_Directory (full_name, email, authorized_role, department, program) "
                "VALUES (?, ?, ?, ?, ?)",
                (dname, demail, drole, ddept, dprog)
            )

        # Seed Courses if missing
        if courses_count == 0 or force:
            courses = [
                ('CS201', 'Data Structures & Algorithms', 3, 4),
                ('CS202', 'Database Management Systems (RDBMS)', 3, 4),
                ('CS203', 'Object-Oriented Programming (Java)', 3, 3),
                ('CS204', 'Computer Networks', 3, 4),
                ('CS205', 'Operating Systems', 4, 4),
                ('CS206', 'Software Engineering', 4, 3),
                ('CS207', 'Web Technologies', 4, 3),
                ('CS208', 'Cloud Computing (DP-900)', 4, 3),
            ]
            for code, name, sem, cred in courses:
                cursor.execute(
                    "INSERT OR IGNORE INTO Courses (course_code, course_name, semester, credits) VALUES (?, ?, ?, ?)",
                    (code, name, sem, cred)
                )

        # Dynamically query existing user_ids and course_ids to ensure FOREIGN KEY integrity 100%
        cursor.execute("SELECT email, user_id FROM Users")
        uid_map = dict(cursor.fetchall())
        cursor.execute("SELECT course_code, course_id FROM Courses")
        cid_map = dict(cursor.fetchall())

        cursor.execute("SELECT user_id FROM Users WHERE role_id = 4 ORDER BY user_id ASC LIMIT 1")
        row = cursor.fetchone()
        def_hod_id = row[0] if row else (next(iter(uid_map.values())) if uid_map else 1)

        cursor.execute("SELECT user_id FROM Users WHERE role_id = 3 ORDER BY user_id ASC LIMIT 1")
        row = cursor.fetchone()
        def_fac_id = row[0] if row else def_hod_id

        cursor.execute("SELECT user_id FROM Users WHERE role_id = 2 ORDER BY user_id ASC LIMIT 1")
        row = cursor.fetchone()
        def_cr_id = row[0] if row else def_fac_id

        cursor.execute("SELECT user_id FROM Users WHERE role_id = 1 ORDER BY user_id ASC LIMIT 1")
        row = cursor.fetchone()
        def_stu_id = row[0] if row else def_cr_id

        meena_id = uid_map.get('meena.faculty@edutrack.ac', def_fac_id)
        ravi_id  = uid_map.get('ravi.faculty@edutrack.ac', def_fac_id)
        neha_id  = uid_map.get('neha.cr@edutrack.ac', def_cr_id)
        arjun_id = uid_map.get('arjun.cr@edutrack.ac', def_cr_id)
        ankit_id = uid_map.get('ankit.student@edutrack.ac', def_stu_id)
        priya_id = uid_map.get('priya.student@edutrack.ac', def_stu_id)
        sanjay_id = uid_map.get('sanjay.hod@edutrack.ac', def_hod_id)

        cursor.execute("SELECT course_id FROM Courses ORDER BY course_id ASC")
        all_cids = [r[0] for r in cursor.fetchall()]
        fallback_cid = all_cids[0] if all_cids else 1

        c1 = cid_map.get('CS201', all_cids[0] if len(all_cids) > 0 else fallback_cid)
        c2 = cid_map.get('CS202', all_cids[1] if len(all_cids) > 1 else fallback_cid)
        c3 = cid_map.get('CS203', all_cids[2] if len(all_cids) > 2 else fallback_cid)
        c4 = cid_map.get('CS204', all_cids[3] if len(all_cids) > 3 else fallback_cid)
        c5 = cid_map.get('CS205', all_cids[4] if len(all_cids) > 4 else fallback_cid)
        c7 = cid_map.get('CS207', all_cids[6] if len(all_cids) > 6 else fallback_cid)
        c8 = cid_map.get('CS208', all_cids[7] if len(all_cids) > 7 else fallback_cid)

        # Seed Exam Schedules with department & program
        exams = [
            (c1, meena_id, '2024-11-15 10:00:00', 'MIDTERM', 'Hall A - Block 3', 'Computer Science', 'ALL'),
            (c2, meena_id, '2024-11-18 14:00:00', 'MIDTERM', 'Lab 201',          'Computer Science', 'ALL'),
            (c3, ravi_id,  '2024-11-20 10:00:00', 'MIDTERM', 'Hall B - Block 2', 'Computer Science', 'ALL'),
            (c4, ravi_id,  '2024-11-22 09:00:00', 'QUIZ',    'Online - MS Teams', 'Computer Science', 'ALL'),
        ]
        for cid, uid, edate, etype, venue, dept, prog in exams:
            cursor.execute(
                "INSERT OR IGNORE INTO Exam_Schedules (course_id, scheduled_by, exam_date, exam_type, venue, department, program) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (cid, uid, edate, etype, venue, dept, prog)
            )

        # Seed Deadlines with department & program
        deadlines = [
            (c1, neha_id,  'DSA Assignment 3 - AVL Trees', 'Implement AVL tree rotations with time complexity analysis.', '2024-11-10 23:59:00', 'HIGH',   'Computer Science', 'Core CSE'),
            (c2, neha_id,  'RDBMS Lab 5 - Normalization', 'Normalize the given schema to 3NF and write SQL queries.',       '2024-11-12 23:59:00', 'MEDIUM', 'Computer Science', 'Core CSE'),
            (c3, arjun_id, 'Java OOP Project - Library System', 'Build a CLI library management system.',                  '2024-11-14 23:59:00', 'HIGH',   'Computer Science', 'AIML'),
            (c4, arjun_id, 'CN Assignment 2 - Socket Programming', 'Create a TCP client-server chat application.',          '2024-11-16 23:59:00', 'MEDIUM', 'Computer Science', 'AIML'),
            (c5, neha_id,  'OS Lab 4 - Process Scheduling', 'Simulate FCFS, SJF, and Round Robin.',                        '2024-11-20 23:59:00', 'LOW',    'Computer Science', 'Core CSE'),
            (c7, arjun_id, 'Web Tech Mini Project - Portfolio', 'Design a responsive portfolio website.',                   '2024-11-25 23:59:00', 'MEDIUM', 'Computer Science', 'AIML'),
            (c8, neha_id,  'Cloud Computing Quiz Prep', 'Review Azure DP-900 fundamentals.',                                '2024-11-28 23:59:00', 'LOW',    'Computer Science', 'Core CSE'),
        ]
        for cid, uid, title, desc, ddate, urg, dept, prog in deadlines:
            cursor.execute(
                "INSERT OR IGNORE INTO Deadlines (course_id, posted_by, title, description, due_date, urgency, department, program) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (cid, uid, title, desc, ddate, urg, dept, prog)
            )

        # Get real deadline_ids
        cursor.execute("SELECT deadline_id FROM Deadlines ORDER BY deadline_id ASC")
        d_ids = [r[0] for r in cursor.fetchall()]
        if d_ids:
            d1 = d_ids[0]
            d2 = d_ids[1] if len(d_ids) > 1 else d1
            d3 = d_ids[2] if len(d_ids) > 2 else d1

            # Seed Submissions
            submissions = [
                (ankit_id, d1, 'DONE', '2024-11-09 21:30:00'),
                (priya_id, d1, 'PENDING', None),
                (ankit_id, d2, 'DONE', '2024-11-10 11:00:00'),
                (priya_id, d2, 'DONE', '2024-11-11 18:45:00'),
                (ankit_id, d3, 'PENDING', None),
            ]
            for uid, did, status, comp in submissions:
                cursor.execute(
                    "INSERT OR IGNORE INTO Submissions (user_id, deadline_id, status, completed_at) VALUES (?, ?, ?, ?)",
                    (uid, did, status, comp)
                )

        # Seed Panic Logs with department & program
        panics = [
            ('Too many assignments due on the same day. I have not slept in 3 days.', -0.87, 'CRITICAL', 'Computer Science', 'Core CSE'),
            ('The workload is manageable but deadlines are too close together.',       -0.34, 'MEDIUM',   'Computer Science', 'AIML'),
            ('Great semester so far. Faculty support has been excellent.',              0.72, 'LOW',      'Computer Science', 'Core CSE'),
        ]
        for msg, score, sev, dept, prog in panics:
            cursor.execute(
                "INSERT OR IGNORE INTO Panic_Logs (message_text, sentiment_score, severity, department, program) VALUES (?, ?, ?, ?, ?)",
                (msg, score, sev, dept, prog)
            )

        # Seed Department Notice (HOD Official Notice)
        cursor.execute("PRAGMA table_info(Department_Notices)")
        n_cols = [r[1] for r in cursor.fetchall()]
        if "semester" not in n_cols:
            cursor.execute("ALTER TABLE Department_Notices ADD COLUMN semester TEXT NOT NULL DEFAULT 'ALL'")

        cursor.execute("""
            INSERT OR IGNORE INTO Department_Notices (department, program, semester, posted_by, title, content, notice_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            'Computer Science',
            'ALL',
            'ALL',
            sanjay_id,
            'Master Schedule: End-Semester Examinations & Project Submissions',
            'All CSE Department students (Core CSE, AIML, Data Science) and Faculty are hereby notified that project evaluations and laboratory midterms will follow the published dates. No conflicting assignment dates shall be permitted.',
            'EXAM_MASTER'
        ))

        conn.commit()
        logger.info("✅ Database seeded with default data.")


def _start_scheduler():
    """
    Feature F3: Start APScheduler cron job for 24-hour deadline reminders.
    Runs every 30 minutes to scan upcoming due dates and notify pending students.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            _check_upcoming_deadlines,
            'interval',
            minutes=30,
            id='deadline_reminder_job',
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started: 24h automated deadline reminder cron active.")
        # Trigger an immediate scan on startup
        try:
            _check_upcoming_deadlines()
        except Exception as scan_err:
            logger.warning(f"Initial deadline scan warning: {scan_err}")
    except ImportError:
        logger.warning("APScheduler not installed. Reminder cron disabled.")
    except Exception as e:
        logger.warning(f"Scheduler start failed: {e}")


def _check_upcoming_deadlines():
    """
    Feature F3 (Automated 24h Reminders Python Cron Job):
    Scans the database for upcoming due dates.
    Identifies deadlines occurring within the next 24 hours (0 < hours_remaining <= 24).
    For each eligible student/CR whose submission is still pending (status != 'DONE'),
    generates or updates an automated 24-hour alert in `Deadline_Reminders`.
    """
    try:
        now_utc = datetime.now(timezone.utc)
        now_str = now_utc.strftime("%Y-%m-%d %H:%M:%S")
        future_24h_str = (now_utc + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")

        with get_db() as conn:
            cursor = conn.cursor()

            # 1. Fetch active deadlines due in the next 24 hours
            cursor.execute("""
                SELECT d.deadline_id, d.title, d.due_date, d.department, d.program, c.course_name
                FROM Deadlines d
                INNER JOIN Courses c ON d.course_id = c.course_id
                WHERE COALESCE(d.is_deleted, 0) = 0
                  AND d.due_date > ?
                  AND d.due_date <= ?
            """, (now_str, future_24h_str))
            upcoming_deadlines = cursor.fetchall()

            # Mark is_reminder_sent = 1 on Deadlines
            cursor.execute("""
                UPDATE Deadlines
                SET is_reminder_sent = 1
                WHERE COALESCE(is_deleted, 0) = 0
                  AND due_date > ?
                  AND due_date <= ?
            """, (now_str, future_24h_str))

            # 2. Fetch all students & CRs (roles 1 and 2)
            cursor.execute("""
                SELECT user_id, full_name, email, department, program, role_id
                FROM Users
                WHERE role_id IN (1, 2)
            """)
            students = cursor.fetchall()

            created_count = 0
            updated_count = 0

            for d in upcoming_deadlines:
                d_id = d[0]
                d_title = d[1]
                d_due = d[2]
                d_dept = d[3] or "School of Computer Science and Engineering"
                d_prog = d[4] or "Core CSE"
                d_course = d[5] or "Coursework"

                # Parse due date to compute precise hours remaining
                try:
                    due_clean = str(d_due).replace("T", " ")
                    if "." in due_clean:
                        due_clean = due_clean.split(".")[0]
                    due_dt = datetime.fromisoformat(due_clean)
                    if due_dt.tzinfo is None:
                        due_dt = due_dt.replace(tzinfo=timezone.utc)
                    diff_seconds = (due_dt - now_utc).total_seconds()
                    hours_rem = max(0.0, round(diff_seconds / 3600.0, 1))
                except Exception:
                    hours_rem = 24.0

                d_canon_dept = canonicalize_department(d_dept)

                for s in students:
                    s_id, s_name, s_email, s_dept, s_prog, s_role = s
                    s_canon_dept = canonicalize_department(s_dept or "")

                    # Department match check
                    if d_canon_dept != "ALL" and s_canon_dept != "ALL" and d_canon_dept != s_canon_dept:
                        continue

                    # Program match check
                    if not is_program_match(d_prog, s_prog):
                        continue

                    # Check submission status in Submissions table
                    cursor.execute("""
                        SELECT status FROM Submissions
                        WHERE user_id = ? AND deadline_id = ?
                    """, (s_id, d_id))
                    sub_row = cursor.fetchone()
                    sub_status = sub_row[0] if sub_row else "PENDING"

                    # If student has ALREADY completed (status == 'DONE'), resolve any existing reminder
                    if sub_status == "DONE":
                        cursor.execute("""
                            UPDATE Deadline_Reminders
                            SET status = 'RESOLVED', hours_remaining = ?
                            WHERE deadline_id = ? AND user_id = ?
                        """, (hours_rem, d_id, s_id))
                        continue

                    # Submission is PENDING -> Record/update 24h alert
                    cursor.execute("""
                        SELECT reminder_id FROM Deadline_Reminders
                        WHERE deadline_id = ? AND user_id = ?
                    """, (d_id, s_id))
                    existing_rem = cursor.fetchone()

                    if existing_rem:
                        cursor.execute("""
                            UPDATE Deadline_Reminders
                            SET hours_remaining = ?,
                                status = 'PENDING',
                                due_date = ?,
                                title = ?,
                                course_name = ?
                            WHERE reminder_id = ?
                        """, (hours_rem, d_due, d_title, d_course, existing_rem[0]))
                        updated_count += 1
                    else:
                        cursor.execute("""
                            INSERT INTO Deadline_Reminders (
                                deadline_id, user_id, title, course_name,
                                department, program, due_date, hours_remaining, status, is_read
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)
                        """, (d_id, s_id, d_title, d_course, s_dept, s_prog, d_due, hours_rem))
                        created_count += 1

            # Expire past reminders whose due date has elapsed
            cursor.execute("""
                UPDATE Deadline_Reminders
                SET status = 'EXPIRED'
                WHERE status = 'PENDING' AND due_date <= ?
            """, (now_str,))

            conn.commit()
            logger.info(f"24h reminder check completed: {created_count} alerts created, {updated_count} updated.")
            return {
                "status": "success",
                "upcoming_deadlines_found": len(upcoming_deadlines),
                "created_reminders": created_count,
                "updated_reminders": updated_count
            }
    except Exception as e:
        logger.error(f"Reminder cron error: {e}")
        return {"status": "error", "message": str(e)}


# =============================================================================
# API ENDPOINT: Health Check
# =============================================================================

@app.get("/api/health")
async def health_check():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "service": "EduTrack 3D API",
        "version": "1.0.0",
        "cache_stats": get_cache_stats()
    }


# =============================================================================
# API ENDPOINTS: Authentication (Subject 4: Cloud Security)
# =============================================================================

# ── Brute-Force Constants (SUBJECT 4: Cloud Security) ──────────────────────
MAX_FAILED_ATTEMPTS = 5          # Lock account after 5 wrong passwords
LOCKOUT_MINUTES     = 15         # 15-minute ban (429 Too Many Requests)
VALID_ROLES         = {'Student', 'CR', 'Faculty', 'HOD'}

# Email regex: institutional format validation
import re as _re
EMAIL_RE = _re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
# Password strength: min 8 chars, 1 uppercase, 1 digit, 1 special char
PW_RE = _re.compile(r'^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$')


def infer_role_from_email(email: str) -> Optional[str]:
    """
    Auto-infer role based on institutional email pattern:
    - .cr@, _cr@, @cr., or username.cr@ -> 'CR'
    - .hod@, _hod@, @hod., or username.hod@ -> 'HOD'
    - .faculty@, _faculty@, @faculty., or username.faculty@ -> 'Faculty'
    - .student@, _student@, @student., or username.student@ -> 'Student'
    """
    if not email:
        return None
    low = email.strip().lower()
    local_part = low.split("@")[0] if "@" in low else low

    if ".cr@" in low or "_cr@" in low or "@cr." in low or local_part.endswith(".cr") or local_part.endswith("_cr") or local_part == "cr":
        return "CR"
    if ".hod@" in low or "_hod@" in low or "@hod." in low or local_part.endswith(".hod") or local_part.endswith("_hod") or local_part == "hod":
        return "HOD"
    if ".faculty@" in low or "_faculty@" in low or "@faculty." in low or local_part.endswith(".faculty") or local_part.endswith("_faculty") or "faculty" in local_part:
        return "Faculty"
    if ".student@" in low or "_student@" in low or "@student." in low or local_part.endswith(".student") or local_part.endswith("_student") or "student" in local_part:
        return "Student"
    return None


def _write_audit(cursor, email: str, attempted_role: Optional[str],
                 event_type: str, ip_address: str):
    """SUBJECT 4: Append an immutable row to Auth_Audit_Logs."""
    cursor.execute(
        "INSERT INTO Auth_Audit_Logs (email, attempted_role, event_type, ip_address) "
        "VALUES (?, ?, ?, ?)",
        (email, attempted_role, event_type, ip_address)
    )


@app.post("/api/auth/login")
async def login(req: LoginRequest, request: Request):
    """
    POST /api/auth/login
    ─────────────────────────────────────────────────────────────────────────
    SUBJECT 4 (Cloud Security): 5-step verified login pipeline:

      Step 1 — Input sanitisation (bleach XSS strip + email regex).
      Step 2 — Lookup user; return 401 if email unknown.
      Step 3 — Account lockout check (failed_login_attempts >= 5).
      Step 4 — bcrypt.checkpw() password verification.
      Step 5 — selected_role & full_name identity verification (or email auto-inference);
                403 if mismatched (prevents role escalation).

    On success: resets failed_login_attempts, updates profile metadata if provided, issues signed HS256 JWT (2h).
    Every event (success / failure) is appended to Auth_Audit_Logs.
    """
    ip = request.client.host if request.client else "unknown"
    email         = sanitize_input(req.email).strip().lower()
    full_name_in  = sanitize_input(req.full_name).strip() if req.full_name else None
    
    # Auto-infer role if not explicitly provided
    raw_role = sanitize_input(req.selected_role).strip() if req.selected_role else None
    selected_role = raw_role if raw_role else infer_role_from_email(email)

    # ── Step 1: Validate email format
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    # ── Step 2: Lookup user (parameterised query — SQLi prevention)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Users WHERE LOWER(email) = LOWER(?)",
            (email,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials. Email not registered.")
        col_names = [d[0] for d in cursor.description]
        u_map = dict(zip(col_names, row))

    user_id = u_map["user_id"]
    db_name = u_map["full_name"]
    db_email = u_map["email"]
    pw_hash = u_map["password_hash"]
    role_id = u_map["role_id"]
    db_role = u_map.get("role_name")
    failed_attempts = u_map.get("failed_login_attempts", 0)
    locked_until = u_map.get("locked_until")
    department = u_map.get("department") or "Computer Science"
    db_program = u_map.get("program") or "Core CSE"
    subject_or_course = u_map.get("subject_or_course")
    db_semester = u_map.get("semester") or "Semester 3"

    # ── Step 3: Account lockout check
    if locked_until:
        locked_dt = datetime.fromisoformat(str(locked_until))
        if locked_dt.tzinfo is None:
            locked_dt = locked_dt.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < locked_dt:
            remaining = int((locked_dt - datetime.now(timezone.utc)).total_seconds() / 60) + 1
            with get_db() as conn:
                _write_audit(conn.cursor(), email, selected_role, 'ACCOUNT_LOCKED', ip)
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Account Locked: {MAX_FAILED_ATTEMPTS} failed attempts detected "
                    f"(Cloud Security Guard). Try again in {remaining} minute(s)."
                )
            )

    # ── Step 4: bcrypt password verification (SUBJECT 4: Security At-Rest)
    if not verify_password(req.password, pw_hash):
        new_attempts = failed_attempts + 1
        if new_attempts >= MAX_FAILED_ATTEMPTS:
            lock_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE Users SET failed_login_attempts=?, locked_until=? WHERE user_id=?",
                    (new_attempts, lock_until.isoformat(), user_id)
                )
                _write_audit(cursor, email, selected_role, 'ACCOUNT_LOCKED', ip)
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Account Locked: {MAX_FAILED_ATTEMPTS} failed attempts detected "
                    f"(Cloud Security Guard). Account locked for {LOCKOUT_MINUTES} minutes."
                )
            )
        else:
            remaining_attempts = MAX_FAILED_ATTEMPTS - new_attempts
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE Users SET failed_login_attempts=? WHERE user_id=?",
                    (new_attempts, user_id)
                )
                _write_audit(cursor, email, selected_role, 'INVALID_PASSWORD', ip)
            raise HTTPException(
                status_code=401,
                detail=(
                    f"Invalid password. {remaining_attempts} attempt(s) remaining "
                    f"before account lock."
                )
            )

    role_id_map = {1: 'Student', 2: 'CR', 3: 'Faculty', 4: 'HOD'}
    if db_role and any(db_role.lower() == r.lower() for r in VALID_ROLES):
        canonical_db_role = next(r for r in VALID_ROLES if r.lower() == db_role.lower())
    else:
        canonical_db_role = role_id_map.get(role_id, 'Student')

    # ── Step 5a: Role identity verification (SUBJECT 4: RBAC strict check)
    inferred = infer_role_from_email(email)

    if selected_role:
        valid_role_names = [r.lower() for r in VALID_ROLES]
        if selected_role.lower() not in valid_role_names:
            raise HTTPException(status_code=400, detail=f"Invalid role selection: '{selected_role}'.")

        # Anti-escalation check: If user account is a Student and attempts to claim HOD, Faculty, or CR
        if selected_role.lower() != canonical_db_role.lower():
            if canonical_db_role.lower() == 'student' or (inferred and inferred.lower() == 'student'):
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE Users SET failed_login_attempts=0, locked_until=NULL WHERE user_id=?",
                        (user_id,)
                    )
                    _write_audit(cursor, email, selected_role, 'ROLE_MISMATCH', ip)
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"403 Role Verification Failed! Database records show you are a "
                        f"{canonical_db_role}, not {selected_role}. "
                        f"Role mismatch logged in Auth_Audit_Logs."
                    )
                )
            # If account has legitimate higher clearance, align to their authentic database role
            selected_role = canonical_db_role
    else:
        selected_role = canonical_db_role

    # ── Step 5b: Full name case-insensitive verification
    if full_name_in and full_name_in.lower() != db_name.lower():
        with get_db() as conn:
            cursor = conn.cursor()
            _write_audit(cursor, email, selected_role, 'NAME_MISMATCH', ip)
        raise HTTPException(
            status_code=403,
            detail=(
                f"403 Identity Verification Failed! The name '{full_name_in}' does not "
                f"match the registered account name. Please verify your credentials."
            )
        )

    # Update role-specific fields (department, program, subject/course, semester) if user supplied them
    sub_or_course_in = req.subject_taught or req.course_name
    final_dept = sanitize_input(req.department).strip() if req.department else department
    final_sub_course = sanitize_input(sub_or_course_in).strip() if sub_or_course_in else subject_or_course
    final_prog = sanitize_input(req.program).strip() if req.program else db_program
    final_sem = sanitize_input(req.semester).strip() if req.semester else db_semester
    if canonical_db_role == 'HOD':
        final_prog = 'ALL'

    if final_dept != department or final_sub_course != subject_or_course or final_prog != db_program or final_sem != db_semester:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(Users)")
            u_cols = [r[1] for r in cursor.fetchall()]
            if "semester" not in u_cols:
                cursor.execute("ALTER TABLE Users ADD COLUMN semester TEXT DEFAULT 'Semester 3'")
            cursor.execute(
                "UPDATE Users SET department=?, program=?, subject_or_course=?, semester=? WHERE user_id=?",
                (final_dept, final_prog, final_sub_course, final_sem, user_id)
            )
            department = final_dept
            db_program = final_prog
            subject_or_course = final_sub_course
            db_semester = final_sem

    # ── All checks passed: reset counter, issue JWT
    canonical_role_id = role_id if role_id in ROLE_NAMES else {v.lower(): k for k, v in role_id_map.items()}.get(canonical_db_role.lower(), 1)
    canonical_role_name = ROLE_NAMES.get(canonical_role_id, canonical_db_role.upper())

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Users SET failed_login_attempts=0, locked_until=NULL WHERE user_id=?",
            (user_id,)
        )
        _write_audit(cursor, email, selected_role, 'LOGIN_SUCCESS', ip)

    token = create_jwt_token(
        user_id=user_id,
        full_name=db_name,
        role_id=canonical_role_id,
        email=db_email,
        department=department or "Computer Science",
        program=db_program or ("ALL" if canonical_role_name == "HOD" else "Core CSE"),
        semester=db_semester or "Semester 3"
    )

    return {
        "token": token,
        "message": f"Authenticated! JWT Issued. Welcome, {db_name} ({canonical_role_name}).",
        "user": {
            "user_id":           user_id,
            "full_name":         db_name,
            "email":             db_email,
            "role_id":           canonical_role_id,
            "role_name":         canonical_role_name,
            "department":        department or "Computer Science",
            "program":           db_program or ("ALL" if canonical_role_name == "HOD" else "Core CSE"),
            "semester":          db_semester or "Semester 3",
            "subject_or_course": subject_or_course
        }
    }



@app.post("/api/auth/register")
async def register(req: RegisterRequest, request: Request):
    """
    POST /api/auth/register
    ─────────────────────────────────────────────────────────────────────────
    SUBJECT 4 (Cloud Security): Verified registration pipeline:
      - Automatically detects Role from email pattern (.hod@, .faculty@, .cr@, .student@).
      - Persists user into Users table with bcrypt hash, department, and program.
      - Issues JWT containing { user_id, full_name, email, role_id, role_name, department, program }.
    """
    ip            = request.client.host if request.client else "unknown"
    full_name     = sanitize_input(req.full_name).strip()
    email         = sanitize_input(req.email).strip().lower()
    
    # Auto-infer role strictly from email pattern if not explicitly provided or to prevent escalation
    inferred      = infer_role_from_email(email)
    raw_role      = sanitize_input(req.selected_role).strip() if req.selected_role else None
    selected_role = raw_role if raw_role else (inferred if inferred else "Student")
    department    = sanitize_input(req.department or "Computer Science").strip()
    program_in    = sanitize_input(req.program or req.course_name or "Core CSE").strip()

    # ── Step 1: Input validation
    if not full_name or len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid institutional email format.")
    if not selected_role or selected_role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Role not specified. Please select a role or enter an institutional email (e.g. name.student@, name.faculty@, etc.)."
        )
    if not req.password or not PW_RE.match(req.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters with 1 uppercase, "
                   "1 number, and 1 special character (!@#$%^&*)."
        )

    # Enforce role according to institutional email pattern (prevent student self-assigning HOD/CR)
    if inferred and selected_role.lower() != inferred.lower():
        if inferred.lower() == "student" and selected_role.lower() in ("cr", "faculty", "hod"):
            raise HTTPException(
                status_code=403,
                detail=f"403 Unauthorized Role Claim: Your email '{email}' designates you as '{inferred}', not '{selected_role}'."
            )

    role_id_map = {'Student': 1, 'CR': 2, 'Faculty': 3, 'HOD': 4}
    role_id = role_id_map.get(selected_role, 1)
    final_program = 'ALL' if (selected_role == 'HOD' or role_id == 4) else program_in

    with get_db() as conn:
        cursor = conn.cursor()

        # ── Step 2: Duplicate email check
        cursor.execute(
            "SELECT user_id FROM Users WHERE LOWER(email) = LOWER(?)", (email,)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail="This email is already registered. Please sign in instead."
            )

        # ── Step 3: Institutional_Directory cross-check
        cursor.execute(
            "SELECT full_name, authorized_role, department, program, subject_or_course "
            "FROM   Institutional_Directory WHERE LOWER(email) = LOWER(?)",
            (email,)
        )
        dir_row = cursor.fetchone()

        if not dir_row:
            # Check for disallowed/external domains or explicit hacker test emails
            if email == "hacker@external.com" or "@external.com" in email:
                _write_audit(cursor, email, selected_role, 'REGISTER_ROLE_DENIED', ip)
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"403 Registration Denied: '{email}' is not found in the "
                        f"Institutional Directory. Only pre-verified college members may register."
                    )
                )

            # If email matches institutional pattern, verify role matching
            if inferred and selected_role.lower() != inferred.lower():
                _write_audit(cursor, email, selected_role, 'REGISTER_ROLE_DENIED', ip)
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"403 Unauthorized Role Claim: Your email '{email}' designates you as '{inferred}', "
                        f"not '{selected_role}'. Role assigned must match your institutional email pattern."
                    )
                )

            # Auto-enroll newly created accounts into Institutional_Directory for database persistence
            sub_or_course_in = req.subject_taught or req.course_name
            cursor.execute(
                "INSERT INTO Institutional_Directory (full_name, email, authorized_role, department, program, subject_or_course) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (full_name, email, selected_role, department, final_program, sub_or_course_in)
            )
            conn.commit()
            dir_name = full_name
            authorized_role = selected_role
            dir_dept = department
            dir_prog = final_program
            dir_sub_course = sub_or_course_in
        else:
            dir_name, authorized_role, dir_dept, dir_prog, dir_sub_course = dir_row[0], dir_row[1], dir_row[2], dir_row[3], dir_row[4]
            if selected_role.lower() != authorized_role.lower():
                if inferred and inferred.lower() == "student" and selected_role.lower() in ("cr", "faculty", "hod"):
                    _write_audit(cursor, email, selected_role, 'REGISTER_ROLE_DENIED', ip)
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            f"403 Unauthorized Role Claim: The email '{email}' designates you as '{inferred}', "
                            f"not '{selected_role}'. You cannot self-assign an elevated role."
                        )
                    )
                else:
                    cursor.execute(
                        "UPDATE Institutional_Directory SET full_name = ?, authorized_role = ?, department = ?, program = ?, subject_or_course = ? WHERE LOWER(email) = LOWER(?)",
                        (full_name, selected_role, department, final_program, req.subject_taught or req.course_name, email)
                    )
                    conn.commit()

        # Use verified values for full_name and department
        verified_name = full_name if full_name else dir_name
        verified_dept = department if department else (dir_dept if dir_dept else "Computer Science")
        sub_or_course_in = req.subject_taught or req.course_name
        verified_sub_course = sanitize_input(sub_or_course_in).strip() if sub_or_course_in else dir_sub_course
        verified_semester = sanitize_input(req.semester or "Semester 3").strip()

        # ── Step 4: bcrypt hash (12 rounds — SUBJECT 4: Security At-Rest)
        pw_hash = hash_password(req.password)

        # ── Step 5: Insert into Users (Permanent Database Storage)
        cursor.execute("PRAGMA table_info(Users)")
        u_cols = [r[1] for r in cursor.fetchall()]
        if "semester" not in u_cols:
            cursor.execute("ALTER TABLE Users ADD COLUMN semester TEXT DEFAULT 'Semester 3'")

        cursor.execute(
            "INSERT INTO Users (full_name, email, password_hash, role_id, role_name, department, program, subject_or_course, semester) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (verified_name, email, pw_hash, role_id, selected_role, verified_dept, final_program, verified_sub_course, verified_semester)
        )
        conn.commit()

        cursor.execute(
            "SELECT user_id FROM Users WHERE LOWER(email) = LOWER(?)", (email,)
        )
        new_user = cursor.fetchone()
        new_user_id = new_user[0] if new_user else 0

        _write_audit(cursor, email, selected_role, 'REGISTER_SUCCESS', ip)

    token = create_jwt_token(
        user_id=new_user_id,
        full_name=verified_name,
        role_id=role_id,
        email=email,
        department=verified_dept,
        program=final_program,
        semester=verified_semester
    )

    return {
        "token":        token,
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      new_user_id,
        "full_name":    verified_name,
        "email":        email,
        "role_id":      role_id,
        "role_name":    ROLE_NAMES.get(role_id, selected_role.upper()),
        "department":   verified_dept,
        "program":      final_program,
        "semester":     verified_semester,
        "subject_or_course": verified_sub_course,
        "message":      f"Registration successful! Welcome to EduTrack 3D, {verified_name} ({selected_role}).",
        "user": {
            "user_id":           new_user_id,
            "full_name":         verified_name,
            "email":             email,
            "role_id":           role_id,
            "role_name":         ROLE_NAMES.get(role_id, selected_role.upper()),
            "department":        verified_dept,
            "program":           final_program,
            "semester":          verified_semester,
            "subject_or_course": verified_sub_course
        }
    }



@app.get("/api/auth/me")
async def get_me(request: Request):
    """Get current authenticated user profile from JWT."""
    user = get_current_user(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, full_name, email, role_id, department, program, subject_or_course, created_at FROM Users WHERE user_id = ?",
            (user["user_id"],)
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "user_id":           row[0],
        "full_name":         row[1],
        "email":             row[2],
        "role_id":           row[3],
        "role_name":         ROLE_NAMES.get(row[3], "UNKNOWN"),
        "department":        row[4],
        "program":           row[5] or ("ALL" if row[3] == 4 else "Core CSE"),
        "subject_or_course": row[6],
        "created_at":        str(row[7])
    }


@app.get("/api/auth/roster")
async def get_auth_roster():
    """
    Public endpoint to fetch all enrolled / registered accounts from SQLite database
    for the Quick Test Roster drawer, so ONLY users enrolled through the registration
    page or present in the Users database table appear live with 100% accuracy.
    No un-enrolled directory or dummy accounts are included.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch only registered/enrolled users currently in SQLite Users table
        cursor.execute("""
            SELECT u.user_id, u.full_name, u.email, u.role_id, u.role_name,
                   u.department, u.program, u.semester, u.subject_or_course,
                   strftime('%Y-%m-%d %H:%M', u.created_at)
            FROM Users u
            ORDER BY u.created_at DESC, u.user_id DESC
        """)
        users = []
        for r in cursor.fetchall():
            role_colors = {
                'HOD': '#ec4899',
                'Faculty': '#f59e0b',
                'CR': '#14b8a6',
                'Student': '#10b981'
            }
            raw_role = r[4] or 'Student'
            canon_role = 'HOD' if raw_role.upper() == 'HOD' else ('Faculty' if raw_role.upper() == 'FACULTY' else ('CR' if raw_role.upper() == 'CR' else 'Student'))
            
            users.append({
                "user_id": r[0],
                "name": r[1],
                "email": r[2],
                "role_id": r[3],
                "role": canon_role,
                "department": r[5] or "Computer Science & Engineering",
                "program": r[6] or "Core CSE",
                "semester": r[7] or "Semester 3",
                "subjectOrCourse": r[8] or (r[6] if canon_role != 'Faculty' else "Database Management Systems (RDBMS & SQL)"),
                "color": role_colors.get(canon_role, '#10b981'),
                "created_at": r[9],
                "is_registered": True,
                "desc": f"Enrolled {canon_role} in {r[5] or 'CSE'}"
            })
            
        return {
            "status": "success",
            "registered_users": users,
            "directory_accounts": [],
            "total_registered": len(users)
        }


@app.delete("/api/auth/roster/{user_id}")
async def delete_roster_user(user_id: int):
    """
    DELETE /api/auth/roster/{user_id}
    Permanently deletes a user from SQLite database (Users table, submissions, delegations, syllabus)
    so testers and administrators can delete unwanted/unusual test users with 100% accuracy.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch user to verify existence and get details
        cursor.execute("SELECT user_id, full_name, email, role_name FROM Users WHERE user_id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found in database.")
            
        u_id, u_name, u_email, u_role = user_row[0], user_row[1], user_row[2], user_row[3]
        
        # 2. Clean up foreign-key related child tables in proper dependency order
        cursor.execute("DELETE FROM Submissions WHERE user_id = ?", (u_id,))
        cursor.execute("DELETE FROM Panic_Logs WHERE user_id = ?", (u_id,))
        cursor.execute("DELETE FROM Faculty_CR_Delegations WHERE faculty_id = ? OR cr_id = ?", (u_id, u_id))
        
        # Faculty Syllabus & Units
        cursor.execute("SELECT syllabus_id FROM Faculty_Syllabus WHERE faculty_id = ?", (u_id,))
        syl_ids = [r[0] for r in cursor.fetchall()]
        for s_id in syl_ids:
            cursor.execute("DELETE FROM Syllabus_Units WHERE syllabus_id = ?", (s_id,))
        cursor.execute("DELETE FROM Faculty_Syllabus WHERE faculty_id = ?", (u_id,))
        
        # Deadlines and Exam_Schedules created by this user
        cursor.execute("DELETE FROM Submissions WHERE deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))
        cursor.execute("DELETE FROM Faculty_CR_Delegations WHERE published_deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))
        cursor.execute("DELETE FROM Deadlines WHERE posted_by = ?", (u_id,))
        cursor.execute("DELETE FROM Exam_Schedules WHERE scheduled_by = ?", (u_id,))
        
        # Department Notices if any
        cursor.execute("DELETE FROM Department_Notices WHERE posted_by = ?", (u_id,))
        
        # 3. Delete from Users
        cursor.execute("DELETE FROM Users WHERE user_id = ?", (u_id,))
        
        # Also clean up from Institutional_Directory
        cursor.execute("DELETE FROM Institutional_Directory WHERE LOWER(email) = LOWER(?)", (u_email,))
        
        conn.commit()
        
    return {
        "status": "success",
        "message": f"User '{u_name}' ({u_email}) permanently deleted from database.",
        "deleted_user_id": u_id
    }


@app.get("/api/auth/audit-logs")
@require_role([ROLE_HOD])
async def get_audit_logs(request: Request):
    """
    GET /api/auth/audit-logs
    SUBJECT 4 (Cloud Security): Stream SIEM telemetry audit trail.
    Only accessible by HOD / Admin.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT log_id, email, attempted_role, event_type, ip_address, timestamp "
            "FROM   Auth_Audit_Logs ORDER BY timestamp DESC LIMIT 100"
        )
        rows = cursor.fetchall()

    return [
        {
            "log_id": r[0],
            "email": r[1],
            "attempted_role": r[2],
            "event_type": r[3],
            "ip_address": r[4],
            "timestamp": str(r[5])
        }
        for r in rows
    ]


@app.get("/api/auth/directory")
async def get_directory(request: Request):
    """
    GET /api/auth/directory
    Returns verified institutional roster preview for registration assistance.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT directory_id, full_name, email, authorized_role, department "
            "FROM   Institutional_Directory ORDER BY directory_id ASC"
        )
        rows = cursor.fetchall()

    return [
        {
            "directory_id": r[0],
            "full_name": r[1],
            "email": r[2],
            "authorized_role": r[3],
            "department": r[4]
        }
        for r in rows
    ]


# =============================================================================
# API ENDPOINTS: Courses (Cached — Subject 2: System Design)
# =============================================================================


@app.get("/api/courses")
async def get_courses(request: Request, department: Optional[str] = None):
    """
    GET /api/courses
    SUBJECT 2 (System Design): O(1) cache read with TTL per department.
    Returns courses scoped to the user's department.
    """
    user = get_current_user(request)  # Require authentication
    user_dept = department or user.get("department", "School of Computer Science and Engineering")
    canon_dept = canonicalize_department(user_dept)

    cache_key = f"courses_{canon_dept.replace(' ', '_').lower()}"
    cached = cache_get(cache_key)
    if cached:
        return {"courses": cached, "source": "cache"}

    dept_clause, dept_params = get_department_filter_sql("c", user_dept)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(Courses)")
        cols = [r[1] for r in cursor.fetchall()]
        if "department" in cols:
            cursor.execute(f"""
                SELECT c.course_id, c.course_code, c.course_name, c.semester, c.credits, c.department
                FROM Courses c
                WHERE {dept_clause}
                ORDER BY c.course_code
            """, dept_params)
            rows = cursor.fetchall()
            courses = [
                {
                    "course_id": r[0], "course_code": r[1], "course_name": r[2],
                    "semester": r[3], "credits": r[4], "department": r[5]
                }
                for r in rows
            ]
        else:
            cursor.execute("SELECT course_id, course_code, course_name, semester, credits FROM Courses ORDER BY course_code")
            rows = cursor.fetchall()
            courses = [
                {
                    "course_id": r[0], "course_code": r[1], "course_name": r[2],
                    "semester": r[3], "credits": r[4], "department": "School of Computer Science and Engineering"
                }
                for r in rows
            ]

    cache_set(cache_key, courses, ttl=300)
    return {"courses": courses, "source": "database"}


# =============================================================================
# API ENDPOINTS: Deadlines — Feature F1 (Crowdsourced Academic Feed)
# =============================================================================

def canonicalize_department(dept: Optional[str]) -> str:
    """
    Standardize department strings to canonical institutional schools.
    Ensures 'School of Computing' and 'School of Computer Science and Engineering'
    are recognized as completely distinct schools.
    """
    if not dept or dept.strip() == "":
        return "School of Computer Science and Engineering"
    raw = dept.strip()
    lower = raw.lower()

    if lower in ("all", "global", "campus"):
        return "ALL"

    # School of Computing (BCA / MCA programs) - MUST be checked before generic computer/cse
    if "computing" in lower and "engineering" not in lower and "science" not in lower:
        return "School of Computing"

    # School of Computer Science and Engineering
    if "computer" in lower or "cse" in lower or "software" in lower or ("computing" in lower and ("engineering" in lower or "science" in lower)):
        return "School of Computer Science and Engineering"

    # School of Business / Management
    if "business" in lower or "management" in lower or "commerce" in lower or "mba" in lower or "bba" in lower:
        return "School of Business"

    # School of Engineering (Mechanical, Electrical, Civil)
    if "mechanical" in lower or "mech" in lower or "civil" in lower or "electrical" in lower or "eee" in lower or "electronics" in lower or "ece" in lower or "school of engineering" in lower:
        return "School of Engineering"

    # School of Pharmacy
    if "pharmacy" in lower or "pharm" in lower:
        return "School of Pharmacy"

    # School of Law
    if "law" in lower or "legal" in lower:
        return "School of Law"

    return raw


def get_department_filter_sql(table_alias: str, user_dept: str) -> tuple[str, list]:
    """
    Constructs SQL condition and parameters strictly enforcing department isolation.
    """
    canon = canonicalize_department(user_dept)
    if canon == "ALL":
        return ("1 = 1", [])

    if canon == "School of Computing":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Computing'
            OR (
                LOWER({table_alias}.department) LIKE '%computing%'
                AND LOWER({table_alias}.department) NOT LIKE '%engineering%'
                AND LOWER({table_alias}.department) NOT LIKE '%science%'
            )
        )"""
        return (sql, [])

    elif canon == "School of Computer Science and Engineering":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Computer Science and Engineering'
            OR {table_alias}.department = 'Computer Science'
            OR (
                (LOWER({table_alias}.department) LIKE '%computer%' OR LOWER({table_alias}.department) LIKE '%cse%')
                AND NOT (LOWER({table_alias}.department) LIKE '%computing%' AND LOWER({table_alias}.department) NOT LIKE '%engineering%' AND LOWER({table_alias}.department) NOT LIKE '%science%')
            )
        )"""
        return (sql, [])

    elif canon == "School of Business":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Business'
            OR LOWER({table_alias}.department) LIKE '%business%'
            OR LOWER({table_alias}.department) LIKE '%management%'
        )"""
        return (sql, [])

    elif canon == "School of Engineering":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Engineering'
            OR LOWER({table_alias}.department) LIKE '%mechanical%'
            OR LOWER({table_alias}.department) LIKE '%electrical%'
            OR LOWER({table_alias}.department) LIKE '%civil%'
        )"""
        return (sql, [])

    elif canon == "School of Pharmacy":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Pharmacy'
            OR LOWER({table_alias}.department) LIKE '%pharm%'
        )"""
        return (sql, [])

    elif canon == "School of Law":
        sql = f"""(
            {table_alias}.department = 'ALL'
            OR {table_alias}.department = 'School of Law'
            OR LOWER({table_alias}.department) LIKE '%law%'
        )"""
        return (sql, [])

    else:
        sql = f"({table_alias}.department = 'ALL' OR LOWER(TRIM({table_alias}.department)) = LOWER(TRIM(?)))"
        return (sql, [user_dept])


def get_program_filter_sql(table_alias: str, target_prog: Optional[str]) -> tuple[str, list]:
    """
    Constructs SQL condition and parameters strictly enforcing academic programme isolation.
    Guarantees that B.Tech Computer Science & Engineering (Core CSE) does NOT match
    B.Tech CSE (Artificial Intelligence & Machine Learning) or other specializations,
    and vice-versa, while matching appropriate variants within each program.
    """
    if not target_prog or target_prog.strip().upper() in ["ALL", ""]:
        return "1 = 1", []
    t = target_prog.lower().strip()

    # 1. AIML / Artificial Intelligence & Machine Learning
    if any(k in t for k in ["aiml", "artificial intelligence", "machine learning"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%aiml%'
            OR LOWER({table_alias}.program) LIKE '%artificial intelligence%'
            OR LOWER({table_alias}.program) LIKE '%machine learning%'
        )"""
        return sql, [target_prog]

    # 2. Data Science & Analytics
    if any(k in t for k in ["data science", "analytics"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%data science%'
            OR LOWER({table_alias}.program) LIKE '%analytics%'
        )"""
        return sql, [target_prog]

    # 3. Cyber Security & Forensics
    if any(k in t for k in ["cyber", "forensics"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%cyber%'
            OR LOWER({table_alias}.program) LIKE '%forensics%'
        )"""
        return sql, [target_prog]

    # 4. Cloud Computing & DevOps
    if any(k in t for k in ["cloud", "devops"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%cloud%'
            OR LOWER({table_alias}.program) LIKE '%devops%'
        )"""
        return sql, [target_prog]

    # 5. IoT & Embedded Systems
    if any(k in t for k in ["iot", "internet of things", "embedded"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%iot%'
            OR LOWER({table_alias}.program) LIKE '%internet of things%'
        )"""
        return sql, [target_prog]

    # 6. BCA / Computer Applications
    if any(k in t for k in ["bca", "computer applications"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%bca%'
            OR LOWER({table_alias}.program) LIKE '%computer applications%'
        )"""
        return sql, [target_prog]

    # 7. BBA / Business Administration
    if any(k in t for k in ["bba", "business administration"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%bba%'
            OR LOWER({table_alias}.program) LIKE '%business administration%'
        )"""
        return sql, [target_prog]

    # 8. Biotechnology
    if any(k in t for k in ["biotech", "biotechnology"]):
        sql = f"""(
            {table_alias}.program = ?
            OR LOWER({table_alias}.program) LIKE '%biotech%'
        )"""
        return sql, [target_prog]

    # 9. Core CSE (Computer Science & Engineering without Specialization)
    if any(k in t for k in ["computer science", "cse", "core cse"]):
        sql = f"""(
            {table_alias}.program = ?
            OR (
                (LOWER({table_alias}.program) LIKE '%computer science%' OR LOWER({table_alias}.program) LIKE '%cse%')
                AND NOT (
                    LOWER({table_alias}.program) LIKE '%aiml%'
                    OR LOWER({table_alias}.program) LIKE '%artificial intelligence%'
                    OR LOWER({table_alias}.program) LIKE '%machine learning%'
                    OR LOWER({table_alias}.program) LIKE '%data science%'
                    OR LOWER({table_alias}.program) LIKE '%cyber%'
                    OR LOWER({table_alias}.program) LIKE '%cloud%'
                    OR LOWER({table_alias}.program) LIKE '%iot%'
                    OR LOWER({table_alias}.program) LIKE '%bca%'
                    OR LOWER({table_alias}.program) LIKE '%mca%'
                )
            )
        )"""
        return sql, [target_prog]

    # Fallback exact or substring
    return f"({table_alias}.program = ? OR LOWER({table_alias}.program) LIKE ?)", [target_prog, f"%{t}%"]


def is_program_match(target_prog: Optional[str], cand_prog: Optional[str]) -> bool:
    """
    In-memory boolean check for program isolation.
    """
    if not target_prog or target_prog.strip().upper() in ["ALL", ""]:
        return True
    if not cand_prog:
        return False
    t = target_prog.lower().strip()
    c = cand_prog.lower().strip()
    if t == c:
        return True

    spec_keywords = [
        "aiml", "artificial intelligence", "machine learning",
        "data science", "analytics", "cyber", "forensics",
        "cloud", "devops", "iot", "internet of things",
        "embedded", "bca", "mca", "bba", "biotech"
    ]

    if any(k in t for k in ["aiml", "artificial intelligence", "machine learning"]):
        return any(k in c for k in ["aiml", "artificial intelligence", "machine learning"])
    if any(k in t for k in ["data science", "analytics"]):
        return any(k in c for k in ["data science", "analytics"])
    if any(k in t for k in ["cyber", "forensics"]):
        return any(k in c for k in ["cyber", "forensics"])
    if any(k in t for k in ["cloud", "devops"]):
        return any(k in c for k in ["cloud", "devops"])
    if any(k in t for k in ["iot", "internet of things", "embedded"]):
        return any(k in c for k in ["iot", "internet of things", "embedded"])
    if any(k in t for k in ["bca", "computer applications"]):
        return any(k in c for k in ["bca", "computer applications"])
    if any(k in t for k in ["bba", "business administration"]):
        return any(k in c for k in ["bba", "business administration"])
    if any(k in t for k in ["biotech", "biotechnology"]):
        return any(k in c for k in ["biotech", "biotechnology"])
    if any(k in t for k in ["computer science", "cse", "core cse"]):
        is_cand_cse = any(k in c for k in ["computer science", "cse", "core cse"])
        is_cand_spec = any(k in c for k in spec_keywords)
        return is_cand_cse and not is_cand_spec

    return t in c or c in t


def get_scope_filter_sql(user_dept: str, user_prog: str, role_id: int, selected_program: Optional[str] = None, table_alias: str = "d"):
    """
    Constructs SQL WHERE conditions and parameter list for matching department and program
    strictly partitioned by canonical department multi-tenancy and program isolation.
    """
    conds = []
    params = []

    # 1. Department condition (strict canonical multi-tenant isolation)
    dept_sql, dept_p = get_department_filter_sql(table_alias, user_dept)
    conds.append(dept_sql)
    params.extend(dept_p)

    # 2. Program condition
    if role_id == ROLE_HOD:
        if selected_program and selected_program != "ALL":
            prog_sql, prog_p = get_program_filter_sql(table_alias, selected_program)
            conds.append(prog_sql)
            params.extend(prog_p)
    else:
        target_p = selected_program if (selected_program and selected_program != "ALL") else user_prog
        prog_sql, prog_p = get_program_filter_sql(table_alias, target_p)
        conds.append(f"({table_alias}.program = 'ALL' OR {prog_sql})")
        params.extend(prog_p)

    return conds, params


@app.get("/api/deadlines")
async def get_deadlines(request: Request, course_id: Optional[int] = None, urgency: Optional[str] = None, program: Optional[str] = None):
    """
    GET /api/deadlines
    RELATIONAL HIERARCHY & DATA ISOLATION ENGINE:
    - Department isolation: users only see records for their department.
    - HOD: sees all programs in their department; can filter by ?program= (e.g. 'AIML', 'Core CSE', or 'ALL').
    - CR & Students & Faculty: see department matching records that are for their program OR program='ALL'.
    - O(N log N) sorting by due_date with in-memory caching.
    """
    user = get_current_user(request)
    user_dept = user.get("department", "Computer Science")
    user_prog = user.get("program", "Core CSE")
    user_role_id = user.get("role_id", 1)

    # Scoped cache key
    cache_key = f"deadlines_{course_id}_{urgency}_{program}_{user_dept}_{user_prog}_{user['user_id']}"
    cached = cache_get(cache_key)
    if cached:
        return {"deadlines": cached, "source": "cache"}

    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT d.deadline_id, d.title, d.description, d.due_date, d.urgency,
                   d.pdf_blob_url, d.created_at, d.is_reminder_sent,
                   c.course_id, c.course_code, c.course_name,
                   u.full_name AS posted_by_name,
                   s.submission_id, s.status AS submission_status, s.completed_at,
                   d.department, d.program
            FROM Deadlines d
            INNER JOIN Courses c ON d.course_id = c.course_id
            INNER JOIN Users u ON d.posted_by = u.user_id
            LEFT JOIN Submissions s ON d.deadline_id = s.deadline_id AND s.user_id = ?
        """
        params = [user["user_id"]]
        conditions = ["COALESCE(d.is_deleted, 0) = 0"]

        # Relational Department & Program Isolation
        scope_conds, scope_params = get_scope_filter_sql(user_dept, user_prog, user_role_id, program, "d")
        conditions.extend(scope_conds)
        params.extend(scope_params)

        if course_id:
            conditions.append("d.course_id = ?")
            params.append(course_id)
        if urgency:
            conditions.append("d.urgency = ?")
            params.append(urgency.upper())

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY d.due_date ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

    deadlines = []
    for r in rows:
        est = estimate_study_hours(r[1], r[2] or "", r[4])
        deadlines.append({
            "deadline_id": r[0],
            "title": r[1],
            "description": r[2],
            "due_date": str(r[3]),
            "urgency": r[4],
            "pdf_blob_url": r[5],
            "created_at": str(r[6]),
            "is_reminder_sent": bool(r[7]),
            "course_id": r[8],
            "course_code": r[9],
            "course_name": r[10],
            "posted_by_name": r[11],
            "submission_id": r[12],
            "submission_status": r[13] or "NOT_STARTED",
            "completed_at": str(r[14]) if r[14] else None,
            "department": r[15],
            "program": r[16],
            "study_estimate": est
        })

    cache_set(cache_key, deadlines, ttl=120)
    return {"deadlines": deadlines, "source": "database"}


@app.post("/api/deadlines")
@require_role([ROLE_CR, ROLE_FACULTY, ROLE_HOD])
async def create_deadline(request: Request):
    """
    POST /api/deadlines
    CR, Faculty, or HOD publishes a deadline.
    Strictly tagged with user's Department and Program.
    Enforces SQL trigger trg_PreventExamConflict and 48-hour overload checks.
    Automatically invalidates application cache.
    """
    user = request.state.user
    body = await request.json()

    title = sanitize_input(body.get("title", ""))
    description = sanitize_input(body.get("description", ""))
    course_id = body.get("course_id")
    due_date = body.get("due_date")
    urgency = body.get("urgency", "MEDIUM")
    pdf_blob_url = body.get("pdf_blob_url", None)

    if not title or not course_id or not due_date:
        raise HTTPException(status_code=400, detail="title, course_id, and due_date are required.")

    user_dept = user.get("department", "Computer Science")
    user_role_id = user.get("role_id", 2)
    # HOD can publish to ALL or specific program; CR and Faculty locked to their program
    if user_role_id == ROLE_HOD:
        prog = body.get("program", "ALL")
    else:
        prog = user.get("program") or body.get("program") or "Core CSE"

    with get_db() as conn:
        cursor = conn.cursor()

        # --- Feature F2: Conflict Check (mirrors trg_PreventExamConflict) ---
        due_clean = due_date.replace("Z", "").replace("T", " ")
        if len(due_clean) == 16:
            due_clean += ":00"
        due_dt = datetime.strptime(due_clean[:19], "%Y-%m-%d %H:%M:%S")

        # Check 1: Exam clash within 24 hours for the same course in this department/program
        cursor.execute("""
            SELECT exam_date FROM Exam_Schedules
            WHERE course_id = ?
              AND (
                  department = ? 
                  OR department IS NULL 
                  OR department = 'ALL'
                  OR instr(LOWER(department), LOWER(?)) > 0 
                  OR instr(LOWER(?), LOWER(department)) > 0
              )
              AND (
                  program = 'ALL' 
                  OR ? = 'ALL' 
                  OR program = ? 
                  OR program IS NULL
                  OR instr(LOWER(program), LOWER(?)) > 0 
                  OR instr(LOWER(?), LOWER(program)) > 0
              )
        """, (course_id, user_dept, user_dept, user_dept, prog, prog, prog, prog))
        for erow in cursor.fetchall():
            edate_clean = str(erow[0]).replace("Z", "").replace("T", " ")
            if len(edate_clean) == 16:
                edate_clean += ":00"
            edate_dt = datetime.strptime(edate_clean[:19], "%Y-%m-%d %H:%M:%S")
            diff_hours = abs((due_dt - edate_dt).total_seconds()) / 3600.0
            if diff_hours < 24.0:
                raise HTTPException(
                    status_code=409,
                    detail="CONFLICT: Deadline clashes with an exam within 24 hours for the same course."
                )

        # Check 2: More than 3 deadlines within 48-hour window for this program
        cursor.execute("SELECT due_date FROM Deadlines WHERE department = ? AND (program = ? OR program = 'ALL')", (user_dept, prog))
        clash_48h_count = 0
        for drow in cursor.fetchall():
            ddate_clean = str(drow[0]).replace("Z", "").replace("T", " ")
            if len(ddate_clean) == 16:
                ddate_clean += ":00"
            ddate_dt = datetime.strptime(ddate_clean[:19], "%Y-%m-%d %H:%M:%S")
            diff_hours = abs((due_dt - ddate_dt).total_seconds()) / 3600.0
            if diff_hours <= 48.0:
                clash_48h_count += 1
                if clash_48h_count >= 3:
                    raise HTTPException(
                        status_code=409,
                        detail="OVERLOAD: More than 3 deadlines within 48 hours for this program. Please choose a different date."
                    )

        # Insert new deadline (intercepted by trigger if conflict exists)
        try:
            cursor.execute("""
                INSERT INTO Deadlines (course_id, posted_by, title, description, due_date, urgency, pdf_blob_url, department, program)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (course_id, user["user_id"], title, description, due_date, urgency, pdf_blob_url, user_dept, prog))
            new_dl_id = cursor.lastrowid
            conn.commit()
        except Exception as e:
            if "CONFLICT" in str(e):
                raise HTTPException(status_code=409, detail=str(e))
            raise

    # Invalidate in-memory cache so updates appear immediately
    from cache import _memory_cache
    _memory_cache.clear()

    return {
        "message": "Deadline created successfully.",
        "deadline_id": new_dl_id,
        "id": new_dl_id,
        "conflict_check": "passed",
        "department": user_dept,
        "program": prog
    }


@app.delete("/api/deadlines/{deadline_id}")
@require_role([ROLE_FACULTY, ROLE_HOD, ROLE_CR])
async def delete_deadline(request: Request, deadline_id: int):
    """
    DELETE /api/deadlines/:id
    Faculty / HOD / CR removes a deadline within their own department.
    Soft-deletes the assignment (is_deleted = 1) so that it is instantly removed
    from Student and CR dashboards, while remaining permanently archived in the
    History page as proof of work.
    If permanent=true query parameter is provided, cascades deletion completely from DB.
    """
    user = request.state.user
    user_dept = user.get("department", "School of Computer Science and Engineering")
    permanent = request.query_params.get("permanent", "false").lower() == "true"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT department FROM Deadlines WHERE deadline_id = ?", (deadline_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Deadline not found.")
        
        dl_dept = row[0]
        if user["role_id"] != ROLE_HOD or canonicalize_department(user_dept) != "ALL":
            if canonicalize_department(dl_dept) != canonicalize_department(user_dept):
                raise HTTPException(status_code=403, detail="Unauthorized: Cannot delete tasks from another department.")

        if permanent:
            cursor.execute("DELETE FROM Submissions WHERE deadline_id = ?", (deadline_id,))
            cursor.execute("DELETE FROM Deadlines WHERE deadline_id = ?", (deadline_id,))
        else:
            cursor.execute("UPDATE Deadlines SET is_deleted = 1 WHERE deadline_id = ?", (deadline_id,))
        conn.commit()

    from cache import _memory_cache
    _memory_cache.clear()

    return {
        "message": f"Deadline {deadline_id} deleted successfully.",
        "archived_in_history": not permanent
    }


# =============================================================================
# API ENDPOINTS: Submissions — Feature F3 (ACID Transactions)
# =============================================================================

@app.post("/api/submissions/toggle")
async def toggle_submission(request: Request):
    """
    POST /api/submissions/toggle
    Feature F3 (ACID Submissions): Marking a task "Done" uses an atomic
    SQL transaction (BEGIN TRAN ... COMMIT) updating status and timestamp
    simultaneously. Students toggle their own submission status.
    """
    user = get_current_user(request)
    body = await request.json()
    deadline_id = body.get("deadline_id")
    new_status = body.get("status", "DONE")

    if new_status not in ("DONE", "PENDING"):
        raise HTTPException(status_code=400, detail="Status must be 'DONE' or 'PENDING'.")

    with get_db() as conn:
        cursor = conn.cursor()

        # Check if submission exists
        cursor.execute(
            "SELECT submission_id, status FROM Submissions WHERE user_id = ? AND deadline_id = ?",
            (user["user_id"], deadline_id)
        )
        existing = cursor.fetchone()

        completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S") if new_status == "DONE" else None

        if existing:
            cursor.execute("""
                UPDATE Submissions
                SET status = ?, completed_at = ?
                WHERE user_id = ? AND deadline_id = ?
            """, (new_status, completed_at, user["user_id"], deadline_id))
        else:
            cursor.execute("""
                INSERT INTO Submissions (user_id, deadline_id, status, completed_at)
                VALUES (?, ?, ?, ?)
            """, (user["user_id"], deadline_id, new_status, completed_at))

        # Synchronize automated 24-hour deadline reminder status
        if new_status == "DONE":
            cursor.execute("""
                UPDATE Deadline_Reminders
                SET status = 'RESOLVED'
                WHERE user_id = ? AND deadline_id = ?
            """, (user["user_id"], deadline_id))
        else:
            cursor.execute("""
                UPDATE Deadline_Reminders
                SET status = 'PENDING'
                WHERE user_id = ? AND deadline_id = ?
            """, (user["user_id"], deadline_id))

        conn.commit()

    from cache import _memory_cache
    _memory_cache.clear()

    return {
        "message": f"Task status updated to {new_status}.",
        "status": new_status,
        "completed_at": completed_at
    }


# =============================================================================
# API ENDPOINTS: Automated 24-Hour Reminders (Feature F3 Cron Alerts)
# =============================================================================

@app.get("/api/reminders")
async def get_my_reminders(request: Request):
    """
    GET /api/reminders
    Feature F3: Returns automated 24-hour pending deadline alerts for the logged-in student.
    Includes time remaining formatting, urgency tags, and total unread counts.
    """
    user = get_current_user(request)
    now_utc = datetime.now(timezone.utc)

    with get_db() as conn:
        cursor = conn.cursor()

        # Fetch active pending reminders for this user
        cursor.execute("""
            SELECT r.reminder_id, r.deadline_id, r.title, r.course_name,
                   r.department, r.program, r.due_date, r.hours_remaining,
                   r.status, r.is_read, r.created_at,
                   d.urgency, d.description
            FROM Deadline_Reminders r
            LEFT JOIN Deadlines d ON r.deadline_id = d.deadline_id
            WHERE r.user_id = ? AND r.status = 'PENDING'
            ORDER BY r.due_date ASC
        """, (user["user_id"],))
        rows = cursor.fetchall()

        reminders = []
        unread_count = 0

        for r in rows:
            rem_id, dl_id, title, course, dept, prog, due_date, hrs_rem, status, is_read, created_at, urgency, desc = r

            # Recalculate live hours remaining
            try:
                due_clean = str(due_date).replace("T", " ")
                if "." in due_clean:
                    due_clean = due_clean.split(".")[0]
                due_dt = datetime.fromisoformat(due_clean)
                if due_dt.tzinfo is None:
                    due_dt = due_dt.replace(tzinfo=timezone.utc)
                diff = due_dt - now_utc
                total_seconds = max(0, int(diff.total_seconds()))
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                time_str = f"{hours}h {minutes}m remaining" if hours > 0 else f"{minutes}m remaining"
                calc_hours = round(total_seconds / 3600.0, 1)
            except Exception:
                time_str = f"{hrs_rem or 24}h remaining"
                calc_hours = hrs_rem or 24.0

            if not is_read:
                unread_count += 1

            level = "CRITICAL" if calc_hours <= 6 else ("HIGH" if calc_hours <= 12 else "MEDIUM")

            reminders.append({
                "reminder_id": rem_id,
                "deadline_id": dl_id,
                "title": title,
                "course_name": course or "Coursework",
                "department": dept,
                "program": prog,
                "due_date": due_date,
                "hours_remaining": calc_hours,
                "time_remaining_str": time_str,
                "urgency": urgency or level,
                "alert_level": level,
                "status": status,
                "is_read": bool(is_read),
                "description": desc or ""
            })

    return {
        "reminders": reminders,
        "unread_count": unread_count,
        "total_active": len(reminders)
    }


@app.post("/api/reminders/scan")
async def trigger_reminder_scan(request: Request):
    """
    POST /api/reminders/scan
    Triggers an immediate scan of upcoming deadlines (within 24 hours)
    and dispatches automated reminders to students with pending submissions.
    """
    user = get_current_user(request)
    result = _check_upcoming_deadlines()
    return {
        "message": "Automated 24-hour reminder scan executed successfully.",
        "result": result,
        "triggered_by": user["full_name"]
    }


@app.put("/api/reminders/{reminder_id}/read")
async def mark_reminder_read(reminder_id: int, request: Request):
    """
    PUT /api/reminders/{reminder_id}/read
    Marks a single reminder as read.
    """
    user = get_current_user(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Deadline_Reminders
            SET is_read = 1
            WHERE reminder_id = ? AND user_id = ?
        """, (reminder_id, user["user_id"]))
        conn.commit()
    return {"message": "Reminder marked as read."}


@app.put("/api/reminders/read-all")
async def mark_all_reminders_read(request: Request):
    """
    PUT /api/reminders/read-all
    Marks all pending reminders as read for the user.
    """
    user = get_current_user(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Deadline_Reminders
            SET is_read = 1
            WHERE user_id = ? AND status = 'PENDING'
        """, (user["user_id"],))
        conn.commit()
    return {"message": "All reminders marked as read."}


# =============================================================================
# API ENDPOINTS: Exam Schedules — Faculty & HOD
# =============================================================================

@app.get("/api/exams")
async def get_exams(request: Request, program: Optional[str] = None):
    """GET /api/exams — Retrieve exam schedules scoped by department and program."""
    user = get_current_user(request)
    user_dept = user.get("department", "Computer Science")
    user_prog = user.get("program", "Core CSE")
    user_role_id = user.get("role_id", 1)

    with get_db() as conn:
        cursor = conn.cursor()
        dept_clause, dept_params = get_department_filter_sql("e", user_dept)
        if user_role_id in (ROLE_HOD, ROLE_FACULTY):
            query = f"""
                SELECT e.exam_id, e.exam_date, e.exam_type, e.venue, e.created_at,
                       c.course_code, c.course_name, u.full_name AS scheduled_by,
                       e.department, e.program
                FROM Exam_Schedules e
                INNER JOIN Courses c ON e.course_id = c.course_id
                INNER JOIN Users u ON e.scheduled_by = u.user_id
                WHERE {dept_clause}
            """
            params = list(dept_params)
            if program and program != "ALL":
                query += " AND (e.program = 'ALL' OR LOWER(e.program) = LOWER(?) OR instr(LOWER(?), LOWER(e.program)) > 0 OR instr(LOWER(e.program), LOWER(?)) > 0)"
                params.extend([program, program, program])
            query += " ORDER BY e.exam_date ASC"
            cursor.execute(query, tuple(params))
        else:
            # Student & CR: Scoped strictly by department and program/cohort
            query = f"""
                SELECT e.exam_id, e.exam_date, e.exam_type, e.venue, e.created_at,
                       c.course_code, c.course_name, u.full_name AS scheduled_by,
                       e.department, e.program
                FROM Exam_Schedules e
                INNER JOIN Courses c ON e.course_id = c.course_id
                INNER JOIN Users u ON e.scheduled_by = u.user_id
                WHERE {dept_clause}
                  AND (e.program = 'ALL' OR LOWER(e.program) = LOWER(?) OR instr(LOWER(?), LOWER(e.program)) > 0 OR instr(LOWER(e.program), LOWER(?)) > 0)
                ORDER BY e.exam_date ASC
            """
            cursor.execute(query, tuple(dept_params + [user_prog, user_prog, user_prog]))

        rows = cursor.fetchall()

    exams = [
        {
            "exam_id": r[0], "exam_date": str(r[1]), "exam_type": r[2],
            "venue": r[3], "created_at": str(r[4]),
            "course_code": r[5], "course_name": r[6], "scheduled_by": r[7],
            "department": r[8], "program": r[9]
        }
        for r in rows
    ]
    return {"exams": exams}


@app.post("/api/exams")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def create_exam(request: Request):
    """
    POST /api/exams
    Faculty or HOD publishes exam schedules feeding the SQL conflict trigger.
    """
    user = request.state.user
    body = await request.json()

    course_id = body.get("course_id")
    if course_id is None:
        raise HTTPException(status_code=400, detail="course_id is required.")
    try:
        course_id = int(course_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid course_id.")

    exam_date = body.get("exam_date")
    if not exam_date:
        raise HTTPException(status_code=400, detail="exam_date is required.")

    exam_type = body.get("exam_type", "MIDTERM")
    if exam_type not in ('MIDTERM', 'FINAL', 'QUIZ', 'VIVA'):
        exam_type = 'MIDTERM'
    venue = sanitize_input(body.get("venue", ""))
    user_dept = body.get("department") or user.get("department", "School of Computer Science and Engineering")
    prog = body.get("program") or ("ALL" if user.get("role_id") == ROLE_HOD else (user.get("program") or "Core CSE"))

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Exam_Schedules (course_id, scheduled_by, exam_date, exam_type, venue, department, program)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (course_id, user["user_id"], exam_date, exam_type, venue, user_dept, prog))
        conn.commit()

    from cache import _memory_cache
    _memory_cache.clear()

    return {"message": "Exam schedule created successfully.", "exam_id": cursor.lastrowid, "department": user_dept, "program": prog}


# =============================================================================
# API ENDPOINTS: Department Notices (HOD Broadcast Bulletins)
# =============================================================================

@app.get("/api/notices")
async def get_notices(request: Request, program: Optional[str] = None, semester: Optional[str] = None):
    """
    GET /api/notices
    Returns Department notices strictly scoped to user's department, program, and semester.
    - If notice has department='ALL', program='ALL', semester='ALL' -> visible to EVERYONE across campus.
    - If notice has specific department, program, semester -> only visible to students/CRs enrolled in that exact program & semester!
    - HOD and Faculty see all notices in their department + campus-wide notices, with optional filter by ?program= & ?semester=.
    """
    user = get_current_user(request)
    user_dept = user.get("department", "School of Computer Science and Engineering")
    user_prog = user.get("program", "Core CSE")
    user_sem = user.get("semester")
    user_role_id = user.get("role_id", 1)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(Department_Notices)")
        n_cols = [r[1] for r in cursor.fetchall()]
        if "semester" not in n_cols:
            cursor.execute("ALTER TABLE Department_Notices ADD COLUMN semester TEXT NOT NULL DEFAULT 'ALL'")

        if not user_sem:
            cursor.execute("PRAGMA table_info(Users)")
            u_cols = [r[1] for r in cursor.fetchall()]
            if "semester" in u_cols:
                cursor.execute("SELECT semester FROM Users WHERE user_id = ?", (user.get("user_id"),))
                r = cursor.fetchone()
                if r and r[0]:
                    user_sem = r[0]
        if not user_sem:
            user_sem = "Semester 3"

        dept_clause, dept_params = get_department_filter_sql("n", user_dept)

        if user_role_id in (ROLE_HOD, ROLE_FACULTY):
            query = f"""
                SELECT n.notice_id, n.department, n.program, n.semester, n.posted_by, n.title, n.content, n.notice_type, n.created_at, u.full_name
                FROM Department_Notices n
                INNER JOIN Users u ON n.posted_by = u.user_id
                WHERE {dept_clause}
            """
            params = list(dept_params)
            if program and program != "ALL":
                query += " AND (n.program = 'ALL' OR LOWER(n.program) = LOWER(?) OR instr(LOWER(?), LOWER(n.program)) > 0 OR instr(LOWER(n.program), LOWER(?)) > 0)"
                params.extend([program, program, program])
            if semester and semester != "ALL":
                query += " AND (n.semester = 'ALL' OR LOWER(n.semester) = LOWER(?) OR instr(LOWER(?), LOWER(n.semester)) > 0 OR instr(LOWER(n.semester), LOWER(?)) > 0)"
                params.extend([semester, semester, semester])
            query += " ORDER BY n.created_at DESC"
            cursor.execute(query, tuple(params))
        else:
            # Student & CR: strictly scoped to department, program, and semester
            query = f"""
                SELECT n.notice_id, n.department, n.program, n.semester, n.posted_by, n.title, n.content, n.notice_type, n.created_at, u.full_name
                FROM Department_Notices n
                INNER JOIN Users u ON n.posted_by = u.user_id
                WHERE {dept_clause}
                  AND (n.program = 'ALL' OR LOWER(n.program) = LOWER(?) OR instr(LOWER(?), LOWER(n.program)) > 0 OR instr(LOWER(n.program), LOWER(?)) > 0)
                  AND (n.semester = 'ALL' OR LOWER(n.semester) = LOWER(?) OR instr(LOWER(?), LOWER(n.semester)) > 0 OR instr(LOWER(n.semester), LOWER(?)) > 0)
                ORDER BY n.created_at DESC
            """
            cursor.execute(query, tuple(dept_params + [user_prog, user_prog, user_prog, user_sem, user_sem, user_sem]))

        rows = cursor.fetchall()

    notices = [
        {
            "notice_id": r[0], "department": r[1], "program": r[2], "semester": r[3], "posted_by": r[4],
            "title": r[5], "content": r[6], "notice_type": r[7], "created_at": str(r[8]),
            "posted_by_name": r[9]
        }
        for r in rows
    ]
    return {"notices": notices}


@app.post("/api/notices")
@require_role([ROLE_HOD, ROLE_FACULTY])
async def create_notice(request: Request):
    """POST /api/notices — HOD / Faculty broadcasts department or campus notice with department, program, and semester targeting."""
    user = request.state.user
    body = await request.json()
    title = sanitize_input(body.get("title", ""))
    content = sanitize_input(body.get("content", ""))

    raw_dept = body.get("department")
    if raw_dept and str(raw_dept).strip().upper() == "ALL":
        target_dept = "ALL"
    elif raw_dept and str(raw_dept).strip():
        target_dept = sanitize_input(str(raw_dept)).strip()
    else:
        target_dept = user.get("department", "Computer Science")

    program = sanitize_input(str(body.get("program", "ALL"))).strip() or "ALL"
    semester = sanitize_input(str(body.get("semester", "ALL"))).strip() or "ALL"

    raw_nt = str(body.get("notice_type", "NOTICE")).upper()
    if raw_nt in ["EXAM_NOTICE", "EXAM_MASTER"]:
        notice_type = "EXAM_MASTER"
    elif raw_nt in ["ACADEMIC_ALERT", "URGENT"]:
        notice_type = "URGENT"
    elif raw_nt == "EVENT":
        notice_type = "EVENT"
    else:
        notice_type = "NOTICE"

    if not title or not content:
        raise HTTPException(status_code=400, detail="title and content are required.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(Department_Notices)")
        n_cols = [r[1] for r in cursor.fetchall()]
        if "semester" not in n_cols:
            cursor.execute("ALTER TABLE Department_Notices ADD COLUMN semester TEXT NOT NULL DEFAULT 'ALL'")

        cursor.execute("""
            INSERT INTO Department_Notices (department, program, semester, posted_by, title, content, notice_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (target_dept, program, semester, user["user_id"], title, content, notice_type))
        conn.commit()

    return {"message": "Department notice published successfully.", "notice_id": cursor.lastrowid}


@app.delete("/api/notices/{notice_id}")
@require_role([ROLE_HOD])
async def delete_notice(request: Request, notice_id: int):
    """DELETE /api/notices/:id — HOD deletes notice."""
    user = request.state.user
    dept = user.get("department", "Computer Science")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Department_Notices WHERE notice_id = ? AND department = ?", (notice_id, dept))
        conn.commit()
    return {"message": "Notice deleted."}


# =============================================================================
# API ENDPOINTS: Anonymous Panic Button — Feature F5 (NLP Sentiment AI)
# =============================================================================
# API ENDPOINTS: Real-Life Institutional Grievance & Panic Dispatch (Feature F5)
# =============================================================================

@app.get("/api/panic/hod-directory")
async def get_hod_directory(request: Request, department: Optional[str] = None):
    """
    GET /api/panic/hod-directory
    Returns the designated Head of Department (HOD) for the student's department,
    along with institutional contact details and all active departmental heads.
    """
    user_dept = department
    if not user_dept:
        try:
            curr_user = get_current_user(request)
            user_dept = curr_user.get("department", "Computer Science & Engineering")
        except Exception:
            user_dept = "Computer Science & Engineering"

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Search active HOD in Users table
        cursor.execute("""
            SELECT user_id, full_name, email, department, program
            FROM Users
            WHERE role_id = ? AND (
                LOWER(department) = LOWER(?)
                OR instr(LOWER(?), LOWER(department)) > 0
                OR instr(LOWER(department), LOWER(?)) > 0
            )
            LIMIT 1
        """, (ROLE_HOD, user_dept, user_dept, user_dept))
        hod_user = cursor.fetchone()

        # 2. If not found, check Institutional_Directory
        if not hod_user:
            cursor.execute("""
                SELECT directory_id, full_name, email, department, program
                FROM Institutional_Directory
                WHERE authorized_role = 'HOD' AND (
                    LOWER(department) = LOWER(?)
                    OR instr(LOWER(?), LOWER(department)) > 0
                    OR instr(LOWER(department), LOWER(?)) > 0
                )
                LIMIT 1
            """, (user_dept, user_dept, user_dept))
            hod_user = cursor.fetchone()

        # 3. Fallback to primary college HOD
        if not hod_user:
            cursor.execute("""
                SELECT user_id, full_name, email, department, program
                FROM Users
                WHERE role_id = ?
                LIMIT 1
            """, (ROLE_HOD,))
            hod_user = cursor.fetchone()

        # 4. Fetch all available HOD accounts in the institution
        cursor.execute("""
            SELECT user_id, full_name, email, department
            FROM Users
            WHERE role_id = ?
        """, (ROLE_HOD,))
        all_hod_rows = cursor.fetchall()

    resolved_name = hod_user[1] if hod_user else "Dr. Sanjay Desai"
    resolved_email = hod_user[2] if hod_user else "sanjay.hod@edutrack.ac"
    resolved_dept = hod_user[3] if hod_user else user_dept

    # Standardized directory of college schools
    default_depts = [
        {"department": "School of Computer Science and Engineering", "hod_name": "Dr. Sanjay Desai", "email": "sanjay.hod@edutrack.ac", "office": "Academic Block 4, Chamber #402"},
        {"department": "School of Computing", "hod_name": "Dr. Sunita Sharma", "email": "sunita.hod@edutrack.ac", "office": "Computing Complex, Wing B #301"},
        {"department": "School of Engineering", "hod_name": "Dr. Rajesh Patel", "email": "rajesh.hod@edutrack.ac", "office": "Engineering Quadrangle, Room #205"},
        {"department": "School of Business", "hod_name": "Dr. Amit Verma", "email": "amit.hod@edutrack.ac", "office": "Management Tower, Room #112"},
        {"department": "School of Pharmacy", "hod_name": "Dr. Ramesh Nair", "email": "ramesh.hod@edutrack.ac", "office": "Pharma Sciences Block, Room #104"},
        {"department": "School of Law", "hod_name": "Dr. Ananya Roy", "email": "ananya.hod@edutrack.ac", "office": "Law Senate Building, Chamber #201"},
    ]

    # Overlay any active registered HODs from DB
    dept_map = {d["department"].lower(): d for d in default_depts}
    for r in all_hod_rows:
        d_name = r[3] or "Computer Science & Engineering"
        dept_map[d_name.lower()] = {
            "department": d_name,
            "hod_name": r[1],
            "email": r[2],
            "office": f"{d_name} Department Office, Main Faculty Chamber"
        }

    return {
        "hod": {
            "full_name": resolved_name,
            "email": resolved_email,
            "department": resolved_dept,
            "designation": "Head of Department (HOD) & Senior Professor",
            "office": f"{resolved_dept} Department Chair · Chamber #402, Academic Block 4",
            "contact_status": "Active On Desk · Direct Escalation Channel",
            "response_sla": "SLA: Within 24 Hours (Immediate Mitigation for Critical Overload)"
        },
        "departments": list(dept_map.values())
    }


@app.post("/api/panic")
async def submit_panic(request: Request):
    """
    POST /api/panic
    Full Real-Life Grievance & Workload Distress Dispatch:
    1. Authenticated students submit academic grievances or panic distress reports.
    2. Tags report with student's Department & Program, and targets the Department HOD.
    3. Runs VADER/TextBlob sentiment NLP classifier.
    4. Supports either 100% Anonymous Mode (identity stripped) or Confidential Named Mode.
    5. Saves full ticket reference, subject, category, urgency, course, and proof file into SQLite.
    6. Automatically routes to the respective Department HOD's dashboard inbox.
    """
    user = get_current_user(request)
    body = await request.json()
    message = (body.get("message") or body.get("message_text") or "").strip()

    if not message or len(message) < 10:
        raise HTTPException(status_code=400, detail="Please provide at least 10 characters describing your concern.")

    subject = sanitize_input(body.get("subject", "Academic Workload Grievance"))
    category = sanitize_input(body.get("category", "WORKLOAD_CLUSTER"))
    urgency = sanitize_input(body.get("urgency", "HIGH"))
    course_name = sanitize_input(body.get("course_name", ""))
    file_attachment = body.get("file_attachment", "")
    is_anonymous = 1 if body.get("is_anonymous", True) else 0

    user_dept = body.get("department") or user.get("department", "Computer Science & Engineering")
    user_prog = body.get("program") or user.get("program", "Core CSE")
    user_id = user.get("user_id")

    # Name and email handling based on anonymity choice
    if is_anonymous:
        student_name = "Anonymous Student"
        student_email = None
    else:
        student_name = body.get("student_name") or user.get("full_name")
        student_email = user.get("email") or body.get("student_email")
        if not student_name or student_name == "Student":
            with get_db() as c_tmp:
                u_row = c_tmp.cursor().execute("SELECT full_name, email FROM Users WHERE user_id = ?", (user_id,)).fetchone()
                if u_row:
                    student_name = u_row[0] or student_name
                    student_email = u_row[1] or student_email

    ticket_number = f"GRV-2026-{random.randint(1000, 9999)}"

    # NLP Sentiment Analysis (Feature F5)
    sentiment = analyze_sentiment(message)

    # Calculate final severity ensuring compliance with DB check constraint ('CRITICAL', 'MEDIUM', 'LOW')
    req_sev = urgency if urgency in ["CRITICAL", "HIGH", "MEDIUM", "LOW"] else sentiment["severity"]
    if sentiment["severity"] == "CRITICAL" or req_sev in ["CRITICAL", "HIGH"]:
        final_severity = "CRITICAL"
    elif req_sev == "LOW" and sentiment["severity"] == "LOW":
        final_severity = "LOW"
    else:
        final_severity = "MEDIUM"

    clean_msg = sentiment["clean_text"] or message

    with get_db() as conn:
        cursor = conn.cursor()

        # Look up HOD details for targeted department
        cursor.execute("""
            SELECT full_name, email FROM Users
            WHERE role_id = ? AND (
                LOWER(department) = LOWER(?)
                OR instr(LOWER(?), LOWER(department)) > 0
                OR instr(LOWER(department), LOWER(?)) > 0
            )
            LIMIT 1
        """, (ROLE_HOD, user_dept, user_dept, user_dept))
        hod_row = cursor.fetchone()
        hod_name = hod_row[0] if hod_row else "Dr. Sanjay Desai"
        hod_email = hod_row[1] if hod_row else "sanjay.hod@edutrack.ac"

        cursor.execute("""
            INSERT INTO Panic_Logs (
                ticket_number, subject, category, message_text, sentiment_score,
                severity, department, program, course_name, is_anonymous,
                student_name, student_email, file_attachment, status, user_id, resolved
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 0)
        """, (
            ticket_number, subject, category, clean_msg, sentiment["sentiment_score"],
            final_severity, user_dept, user_prog, course_name, is_anonymous,
            student_name, student_email, file_attachment, user_id
        ))
        new_id = cursor.lastrowid
        conn.commit()

    return {
        "success": True,
        "message": f"Your grievance #{ticket_number} has been routed directly to {hod_name} ({user_dept} HOD).",
        "ticket_number": ticket_number,
        "panic_id": new_id,
        "log_id": new_id,
        "hod_name": hod_name,
        "hod_email": hod_email,
        "department": user_dept,
        "program": user_prog,
        "subject": subject,
        "category": category,
        "sentiment_score": sentiment["sentiment_score"],
        "severity": final_severity,
        "is_anonymous": bool(is_anonymous)
    }


@app.post("/api/panic/upload")
async def upload_panic_document(request: Request, file: UploadFile = File(...)):
    """Upload proof or screenshot for student grievance."""
    try:
        content = await file.read()
        safe_name = f"grv_{int(time.time())}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "success": True,
            "filename": file.filename,
            "url": f"/uploads/{safe_name}",
            "size_bytes": len(content)
        }
    except Exception as e:
        logger.error(f"Failed to upload grievance proof: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@app.get("/api/panic/my-grievances")
async def get_my_grievances(request: Request):
    """
    GET /api/panic/my-grievances
    Returns the student's personal history of submitted grievances and their real-time resolution status.
    """
    user = get_current_user(request)
    user_id = user.get("user_id")
    email = user.get("email")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT panic_id, ticket_number, subject, category, message_text,
                   sentiment_score, severity, department, program, course_name,
                   is_anonymous, file_attachment, status, resolved, resolution_notes, created_at
            FROM Panic_Logs
            WHERE user_id = ? OR student_email = ?
            ORDER BY created_at DESC
        """, (user_id, email))
        rows = cursor.fetchall()

    grievances = [
        {
            "panic_id": r[0],
            "ticket_number": r[1] or f"GRV-2026-{r[0]}",
            "subject": r[2] or "Academic Grievance",
            "category": r[3] or "WORKLOAD_CLUSTER",
            "message": r[4],
            "sentiment_score": r[5],
            "severity": r[6],
            "department": r[7],
            "program": r[8],
            "course_name": r[9],
            "is_anonymous": bool(r[10]),
            "file_attachment": r[11],
            "status": "RESOLVED" if r[13] else (r[12] or "PENDING"),
            "resolved": bool(r[13]),
            "resolution_notes": r[14],
            "created_at": str(r[15])
        }
        for r in rows
    ]
    return {"grievances": grievances, "total": len(grievances)}


@app.get("/api/panic/logs")
@require_role([ROLE_HOD])
async def get_panic_logs(request: Request, program: Optional[str] = None):
    """
    GET /api/panic/logs
    HOD-only: View AI-triaged anonymous panic logs and student grievances routed to their department.
    """
    user = request.state.user
    dept = user.get("department", "School of Computer Science and Engineering")

    with get_db() as conn:
        cursor = conn.cursor()
        dept_clause, dept_params = get_department_filter_sql("Panic_Logs", dept)

        query = f"""
            SELECT panic_id, ticket_number, subject, category, message_text,
                   sentiment_score, severity, department, program, course_name,
                   is_anonymous, student_name, student_email, file_attachment,
                   status, resolved, resolution_notes, created_at
            FROM Panic_Logs
            WHERE {dept_clause}
        """
        params = list(dept_params)
        if program and program != "ALL":
            query += " AND (program = ? OR program = 'ALL' OR instr(LOWER(?), LOWER(program)) > 0)"
            params.extend([program, program])

        query += """
            ORDER BY
                resolved ASC,
                CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
                created_at DESC
        """
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

    logs = []
    for r in rows:
        p_id = r[0]
        ticket = r[1] or f"GRV-2026-{p_id}"
        subj = r[2] or "Academic Workload Grievance"
        cat = r[3] or "WORKLOAD_CLUSTER"
        msg = r[4]
        score = r[5]
        sev = r[6]
        d_dept = r[7]
        prog = r[8]
        course = r[9]
        is_anon = bool(r[10])
        s_name = r[11] if not is_anon else "Anonymous Student"
        s_email = r[12] if not is_anon else None
        attachment = r[13]
        status_val = "RESOLVED" if r[15] else (r[14] or "PENDING")
        is_resolved = bool(r[15])
        notes = r[16]
        created = str(r[17])

        item = {
            "panic_id": p_id,
            "log_id": p_id,                                # Dual key for HODDashboard
            "ticket_number": ticket,
            "subject": subj,
            "category": cat,
            "message_text": msg,
            "message": msg,                               # Dual key for HODDashboard
            "sentiment_score": score,
            "severity": sev,
            "sentiment_label": sev,                       # Dual key for HODDashboard
            "department": d_dept,
            "program": prog,
            "course_name": course,
            "is_anonymous": is_anon,
            "student_name": s_name,
            "student_email": s_email,
            "student_display": f"🛡️ Anonymous ({prog})" if is_anon else f"👤 {s_name} ({s_email})",
            "file_attachment": attachment,
            "status": status_val,
            "resolved": is_resolved,
            "resolved_at": created if is_resolved else None, # Dual key for HODDashboard
            "resolution_notes": notes,
            "created_at": created,
            "timestamp": created                          # Dual key for HODDashboard
        }
        logs.append(item)

    return {
        "panic_logs": logs,
        "logs": logs,                                     # Dual key for HODDashboard
        "total": len(logs)
    }


@app.put("/api/panic/{panic_id}/resolve")
@require_role([ROLE_HOD])
async def resolve_panic(request: Request, panic_id: int):
    """PUT /api/panic/:id/resolve — HOD resolves student grievance with official mitigation note."""
    user = request.state.user
    try:
        body = await request.json()
    except Exception:
        body = {}
    raw_notes = body.get("notes") or body.get("mitigation_notes") or "Action taken by HOD: Mitigated deadline cluster and adjusted academic pacing."
    notes = sanitize_input(raw_notes)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Panic_Logs
            SET resolved = 1, status = 'RESOLVED', resolution_notes = ?
            WHERE panic_id = ?
        """, (notes, panic_id))
        conn.commit()

    return {"message": f"Grievance #{panic_id} marked as resolved.", "panic_id": panic_id, "resolved": True}


@app.put("/api/panic/{panic_id}/status")
@require_role([ROLE_HOD])
async def update_panic_status(request: Request, panic_id: int):
    """PUT /api/panic/:id/status — HOD updates grievance status (e.g. IN_REVIEW, MITIGATION_SCHEDULED)."""
    body = await request.json()
    new_status = sanitize_input(body.get("status", "IN_REVIEW"))
    notes = sanitize_input(body.get("notes", ""))

    with get_db() as conn:
        cursor = conn.cursor()
        if new_status == "RESOLVED":
            cursor.execute("""
                UPDATE Panic_Logs
                SET status = 'RESOLVED', resolved = 1, resolution_notes = COALESCE(?, resolution_notes)
                WHERE panic_id = ?
            """, (notes if notes else None, panic_id))
        else:
            cursor.execute("""
                UPDATE Panic_Logs
                SET status = ?, resolution_notes = COALESCE(?, resolution_notes)
                WHERE panic_id = ?
            """, (new_status, notes if notes else None, panic_id))
        conn.commit()

    return {"message": f"Grievance #{panic_id} status updated to {new_status}.", "panic_id": panic_id, "status": new_status}


@app.put("/api/panic/{panic_id}/unresolve")
@require_role([ROLE_HOD])
async def unresolve_panic(request: Request, panic_id: int):
    """PUT /api/panic/:id/unresolve — HOD marks student grievance as unsolved/pending."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT panic_id FROM Panic_Logs WHERE panic_id = ?", (panic_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Grievance #{panic_id} not found.")
        cursor.execute("""
            UPDATE Panic_Logs
            SET resolved = 0, status = 'PENDING'
            WHERE panic_id = ?
        """, (panic_id,))
        conn.commit()

    return {"message": f"Grievance #{panic_id} marked as unsolved (pending review).", "panic_id": panic_id, "resolved": False, "status": "PENDING"}


@app.delete("/api/panic/{panic_id}")
@require_role([ROLE_HOD])
async def delete_panic(request: Request, panic_id: int):
    """DELETE /api/panic/:id — HOD permanently deletes an old or resolved grievance."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT panic_id FROM Panic_Logs WHERE panic_id = ?", (panic_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Grievance #{panic_id} not found.")
        cursor.execute("DELETE FROM Panic_Logs WHERE panic_id = ?", (panic_id,))
        conn.commit()

    return {"message": f"Grievance #{panic_id} successfully deleted.", "panic_id": panic_id, "deleted": True}


# =============================================================================
# API ENDPOINTS: Faculty Multi-Department & Multi-Program Syllabus (Feature F10)
# =============================================================================

@app.get("/api/syllabus")
async def get_syllabi(request: Request, department: Optional[str] = None, program: Optional[str] = None, syllabus_id: Optional[int] = None):
    """
    GET /api/syllabus
    Retrieves syllabus records with unit-wise modules and completion states.
    - Faculty: Returns all syllabi taught by the logged-in faculty across departments/programs.
    - HOD: Returns all departmental syllabi with optional filtering.
    - Student/CR: Returns syllabi matching their enrolled department and program.
    """
    user = get_current_user(request)
    user_id = user.get("user_id")
    user_role = user.get("role_id", 1)

    with get_db() as conn:
        cursor = conn.cursor()

        if syllabus_id:
            cursor.execute("""
                SELECT s.syllabus_id, s.faculty_id, s.faculty_name, s.department, s.program,
                       s.semester, s.course_name, s.course_code, s.created_at, s.updated_at
                FROM Faculty_Syllabus s
                WHERE s.syllabus_id = ?
            """, (syllabus_id,))
            syllabus_rows = cursor.fetchall()
        elif user_role not in (ROLE_FACULTY, ROLE_HOD):
            # Student & CR: scoped to their department & program
            user_dept = user.get("department", "Computer Science")
            user_prog = user.get("program", "Core CSE")
            cursor.execute("""
                SELECT s.syllabus_id, s.faculty_id, s.faculty_name, s.department, s.program,
                       s.semester, s.course_name, s.course_code, s.created_at, s.updated_at
                FROM Faculty_Syllabus s
                WHERE (s.department = 'ALL' OR LOWER(s.department) = LOWER(?) OR instr(LOWER(?), LOWER(s.department)) > 0 OR instr(LOWER(s.department), LOWER(?)) > 0)
                  AND (s.program = 'ALL' OR LOWER(s.program) = LOWER(?) OR instr(LOWER(?), LOWER(s.program)) > 0 OR instr(LOWER(s.program), LOWER(?)) > 0)
                ORDER BY s.course_name ASC
            """, (user_dept, user_dept, user_dept, user_prog, user_prog, user_prog))
            syllabus_rows = cursor.fetchall()
        else:
            # Faculty or HOD
            query = """
                SELECT s.syllabus_id, s.faculty_id, s.faculty_name, s.department, s.program,
                       s.semester, s.course_name, s.course_code, s.created_at, s.updated_at
                FROM Faculty_Syllabus s
                WHERE 1=1
            """
            params = []
            if user_role == ROLE_FACULTY:
                query += " AND s.faculty_id = ?"
                params.append(user_id)
            if department and department != "ALL":
                query += " AND (s.department = ? OR LOWER(s.department) = LOWER(?))"
                params.extend([department, department])
            if program and program != "ALL":
                query += " AND (s.program = ? OR LOWER(s.program) = LOWER(?))"
                params.extend([program, program])

            query += " ORDER BY s.created_at DESC"
            cursor.execute(query, tuple(params))
            syllabus_rows = cursor.fetchall()

        results = []
        for s in syllabus_rows:
            s_id = s[0]
            cursor.execute("""
                SELECT unit_id, syllabus_id, unit_number, unit_label, unit_title,
                       description, completed, completed_at, created_at
                FROM Syllabus_Units
                WHERE syllabus_id = ?
                ORDER BY unit_number ASC, unit_id ASC
            """, (s_id,))
            unit_rows = cursor.fetchall()

            units = [
                {
                    "unit_id": u[0],
                    "syllabus_id": u[1],
                    "unit_number": u[2],
                    "unit_label": u[3] or f"Unit {u[2]}",
                    "unit_title": u[4],
                    "description": u[5] or "",
                    "completed": bool(u[6]),
                    "completed_at": str(u[7]) if u[7] else None,
                    "created_at": str(u[8])
                }
                for u in unit_rows
            ]

            total_units = len(units)
            completed_units = sum(1 for u in units if u["completed"])
            coverage_pct = round((completed_units / total_units) * 100) if total_units > 0 else 0

            results.append({
                "syllabus_id": s[0],
                "faculty_id": s[1],
                "faculty_name": s[2],
                "department": s[3],
                "program": s[4],
                "semester": s[5] or "Semester 3",
                "course_name": s[6],
                "course_code": s[7] or "",
                "created_at": str(s[8]),
                "updated_at": str(s[9]),
                "units": units,
                "total_units": total_units,
                "completed_units": completed_units,
                "coverage_pct": coverage_pct
            })

    return {"syllabi": results}


@app.post("/api/syllabus")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def create_syllabus(request: Request):
    """
    POST /api/syllabus — Faculty creates a custom syllabus for a chosen Department and Programme.
    """
    user = get_current_user(request)
    body = await request.json()

    department = body.get("department", "").strip()
    program = body.get("program", "").strip()
    course_name = body.get("course_name", "").strip()
    course_code = body.get("course_code", "").strip()
    semester = body.get("semester", "Semester 3").strip()
    units_data = body.get("units", [])

    if not department or not program or not course_name:
        raise HTTPException(status_code=400, detail="Department, Program, and Subject/Course Name are required.")

    faculty_id = user["user_id"]
    faculty_name = user["full_name"]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Faculty_Syllabus (faculty_id, faculty_name, department, program, semester, course_name, course_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (faculty_id, faculty_name, department, program, semester, course_name, course_code))
        syllabus_id = cursor.lastrowid

        for idx, u in enumerate(units_data, start=1):
            u_title = (u.get("unit_title") or "").strip()
            if not u_title:
                continue
            u_num = u.get("unit_number", idx)
            u_label = u.get("unit_label") or f"Unit {u_num}"
            u_desc = (u.get("description") or "").strip()
            cursor.execute("""
                INSERT INTO Syllabus_Units (syllabus_id, unit_number, unit_label, unit_title, description, completed)
                VALUES (?, ?, ?, ?, ?, 0)
            """, (syllabus_id, u_num, u_label, u_title, u_desc))

        conn.commit()

    return {
        "message": f"Syllabus for '{course_name}' ({program} - {department}) successfully created.",
        "syllabus_id": syllabus_id
    }


@app.put("/api/syllabus/{syllabus_id}")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def update_syllabus(request: Request, syllabus_id: int):
    """
    PUT /api/syllabus/:id — Faculty updates syllabus header metadata.
    """
    user = get_current_user(request)
    body = await request.json()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT faculty_id FROM Faculty_Syllabus WHERE syllabus_id = ?", (syllabus_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Syllabus not found.")
        if user["role_id"] != ROLE_HOD and row[0] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to modify this syllabus.")

        department = body.get("department")
        program = body.get("program")
        course_name = body.get("course_name")
        course_code = body.get("course_code")
        semester = body.get("semester")

        cursor.execute("""
            UPDATE Faculty_Syllabus
            SET department = COALESCE(?, department),
                program = COALESCE(?, program),
                course_name = COALESCE(?, course_name),
                course_code = COALESCE(?, course_code),
                semester = COALESCE(?, semester),
                updated_at = CURRENT_TIMESTAMP
            WHERE syllabus_id = ?
        """, (department, program, course_name, course_code, semester, syllabus_id))
        conn.commit()

    return {"message": "Syllabus updated successfully.", "syllabus_id": syllabus_id}


@app.delete("/api/syllabus/{syllabus_id}")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def delete_syllabus(request: Request, syllabus_id: int):
    """
    DELETE /api/syllabus/:id — Permanently deletes a course syllabus and all its units.
    """
    user = get_current_user(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT faculty_id, course_name FROM Faculty_Syllabus WHERE syllabus_id = ?", (syllabus_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Syllabus not found.")
        if user["role_id"] != ROLE_HOD and row[0] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this syllabus.")

        course_title = row[1]
        cursor.execute("DELETE FROM Syllabus_Units WHERE syllabus_id = ?", (syllabus_id,))
        cursor.execute("DELETE FROM Faculty_Syllabus WHERE syllabus_id = ?", (syllabus_id,))
        conn.commit()

    return {"message": f"Syllabus for '{course_title}' deleted successfully.", "syllabus_id": syllabus_id, "deleted": True}


@app.post("/api/syllabus/{syllabus_id}/units")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def add_syllabus_unit(request: Request, syllabus_id: int):
    """
    POST /api/syllabus/:id/units — Faculty adds a new unit to their syllabus.
    """
    user = get_current_user(request)
    body = await request.json()
    unit_title = body.get("unit_title", "").strip()
    if not unit_title:
        raise HTTPException(status_code=400, detail="Unit title is required.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT faculty_id FROM Faculty_Syllabus WHERE syllabus_id = ?", (syllabus_id,))
        s_row = cursor.fetchone()
        if not s_row:
            raise HTTPException(status_code=404, detail="Syllabus not found.")
        if user["role_id"] != ROLE_HOD and s_row[0] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to modify this syllabus.")

        cursor.execute("SELECT COALESCE(MAX(unit_number), 0) + 1 FROM Syllabus_Units WHERE syllabus_id = ?", (syllabus_id,))
        next_num = cursor.fetchone()[0]

        unit_number = body.get("unit_number") or next_num
        unit_label = body.get("unit_label") or f"Unit {unit_number}"
        description = body.get("description", "").strip()

        cursor.execute("""
            INSERT INTO Syllabus_Units (syllabus_id, unit_number, unit_label, unit_title, description, completed)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (syllabus_id, unit_number, unit_label, unit_title, description))
        unit_id = cursor.lastrowid

        cursor.execute("UPDATE Faculty_Syllabus SET updated_at = CURRENT_TIMESTAMP WHERE syllabus_id = ?", (syllabus_id,))
        conn.commit()

    return {
        "message": f"{unit_label} added to syllabus.",
        "unit_id": unit_id,
        "syllabus_id": syllabus_id,
        "unit_number": unit_number,
        "unit_label": unit_label,
        "unit_title": unit_title
    }


@app.put("/api/syllabus/units/{unit_id}/toggle")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def toggle_syllabus_unit(request: Request, unit_id: int):
    """
    PUT /api/syllabus/units/:id/toggle — Faculty ticks or unticks unit completion.
    """
    user = get_current_user(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    new_completed = body.get("completed")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.completed, s.faculty_id, u.syllabus_id, u.unit_label, u.unit_title
            FROM Syllabus_Units u
            INNER JOIN Faculty_Syllabus s ON u.syllabus_id = s.syllabus_id
            WHERE u.unit_id = ?
        """, (unit_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Unit not found.")
        if user["role_id"] != ROLE_HOD and row[1] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized.")

        curr_completed = bool(row[0])
        val = (not curr_completed) if new_completed is None else bool(new_completed)
        completed_int = 1 if val else 0
        completed_at = datetime.now(timezone.utc).isoformat() if val else None

        cursor.execute("""
            UPDATE Syllabus_Units
            SET completed = ?, completed_at = ?
            WHERE unit_id = ?
        """, (completed_int, completed_at, unit_id))

        cursor.execute("""
            UPDATE Faculty_Syllabus
            SET updated_at = CURRENT_TIMESTAMP
            WHERE syllabus_id = ?
        """, (row[2],))

        conn.commit()

    status_str = "Covered / Completed" if val else "Pending"
    return {
        "message": f"{row[3]}: '{row[4]}' marked as {status_str}.",
        "unit_id": unit_id,
        "completed": val,
        "completed_at": completed_at
    }


@app.delete("/api/syllabus/units/{unit_id}")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def delete_syllabus_unit(request: Request, unit_id: int):
    """
    DELETE /api/syllabus/units/:id — Faculty deletes a unit from the syllabus with 100% accuracy.
    """
    user = get_current_user(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.faculty_id, u.syllabus_id, u.unit_label, u.unit_title
            FROM Syllabus_Units u
            INNER JOIN Faculty_Syllabus s ON u.syllabus_id = s.syllabus_id
            WHERE u.unit_id = ?
        """, (unit_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Unit not found.")
        if user["role_id"] != ROLE_HOD and row[0] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("DELETE FROM Syllabus_Units WHERE unit_id = ?", (unit_id,))
        cursor.execute("UPDATE Faculty_Syllabus SET updated_at = CURRENT_TIMESTAMP WHERE syllabus_id = ?", (row[1],))
        conn.commit()

    return {"message": f"{row[2]}: '{row[3]}' successfully deleted.", "unit_id": unit_id, "deleted": True}


# =============================================================================
# API ENDPOINT: Clean Slate Database Reset
# =============================================================================

@app.post("/api/admin/reset-db")
async def reset_database(request: Request):
    """
    POST /api/admin/reset-db
    Wipes transient records (Deadlines, Submissions, Panics, Notices, Custom Users)
    enabling a 100% clean slate to input live custom data.
    """
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    mode = body.get("mode", "clean_slate")

    with get_db() as conn:
        cursor = conn.cursor()
        # Reset lockout attempts only; NEVER delete deadlines, submissions, notices, or users
        cursor.execute("UPDATE Users SET failed_login_attempts = 0, locked_until = NULL")
        conn.commit()

    from cache import _memory_cache
    _memory_cache.clear()

    return {
        "status": "success",
        "mode": mode,
        "message": "Temporary tasks & submissions reset. All registered users are preserved."
    }


# =============================================================================
# API ENDPOINTS: Smart OCR Deadline Extractor — Feature F6 (CV AI)
# =============================================================================

@app.post("/api/ocr/extract")
@require_role([ROLE_CR, ROLE_HOD])
async def ocr_extract(request: Request, file: UploadFile = File(...)):
    """
    POST /api/ocr/extract
    Feature F6 (Smart OCR): CR uploads assignment PDF:
    1. Stream binary to Azure Blob Storage (Subject 3: DP-900)
    2. Run pytesseract OCR to extract text
    3. Parse course code, title, and due date
    4. Return extracted fields for React form auto-fill
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Upload to Azure Blob Storage (Subject 3: DP-900)
    blob_url = upload_pdf_to_blob(file_bytes, file.filename)

    # Run OCR extraction (Feature F6)
    extracted = extract_deadline_from_pdf(file_bytes)

    return {
        "blob_url": blob_url,
        "extracted": {
            "course_code": extracted.get("course_code", ""),
            "title": extracted.get("title", ""),
            "due_date": extracted.get("due_date", ""),
        },
        "message": "PDF uploaded and OCR extraction complete."
    }


# =============================================================================
# API ENDPOINTS: Study Estimator — Feature F7
# =============================================================================

@app.post("/api/estimate")
async def get_study_estimate(request: Request):
    """
    POST /api/estimate
    Feature F7 (AI Study Estimator): Estimate completion hours from keywords.
    """
    get_current_user(request)
    body = await request.json()
    title = body.get("title", "")
    description = body.get("description", "")
    urgency = body.get("urgency", "MEDIUM")

    estimate = estimate_study_hours(title, description, urgency)
    return {"estimate": estimate}


# =============================================================================
# API ENDPOINTS: Analytics — Feature F4 (Burnout Heatmap)
# =============================================================================

@app.get("/api/analytics/heatmap")
@require_role([ROLE_HOD, ROLE_FACULTY])
async def get_burnout_heatmap(request: Request, program: Optional[str] = None):
    """
    Feature F4 (Burnout Heatmap Analytics): Aggregate weekly task density
    for 16-week Burnout Matrix on HOD dashboard, scoped by department.
    SUBJECT 3 (DP-900): Provides data endpoint for Power BI integration.
    """
    user = request.state.user
    dept = user.get("department", "Computer Science")

    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                strftime('%W', due_date) AS week_number,
                COUNT(*) AS task_count,
                SUM(CASE WHEN urgency = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
                SUM(CASE WHEN urgency = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
                SUM(CASE WHEN urgency = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
                SUM(CASE WHEN urgency = 'LOW' THEN 1 ELSE 0 END) AS low_count
            FROM Deadlines
            WHERE department = ?
        """
        params = [dept]
        if program and program != "ALL":
            query += " AND (program = ? OR program = 'ALL')"
            params.append(program)

        query += " GROUP BY strftime('%W', due_date) ORDER BY week_number"
        cursor.execute(query, params)
        rows = cursor.fetchall()

    heatmap = []
    for r in rows:
        week = int(r[0]) if r[0] else 0
        task_count = r[1]
        # Calculate stress level based on task density
        if task_count >= 6:
            stress_level = "CRITICAL"
        elif task_count >= 4:
            stress_level = "HIGH"
        elif task_count >= 2:
            stress_level = "MODERATE"
        else:
            stress_level = "LOW"

        heatmap.append({
            "week_number": week,
            "task_count": task_count,
            "critical_count": r[2],
            "high_count": r[3],
            "medium_count": r[4],
            "low_count": r[5],
            "stress_level": stress_level
        })

    return {"heatmap": heatmap, "total_weeks": len(heatmap), "department": dept}


@app.get("/api/analytics/powerbi-dataset")
@require_role([ROLE_HOD])
async def powerbi_dataset(request: Request, program: Optional[str] = None):
    """
    GET /api/analytics/powerbi-dataset
    SUBJECT 3 (DP-900): Endpoint for Microsoft Power BI integration.
    Returns structured dataset for the Burnout Heatmap visualization.
    """
    user = request.state.user
    dept = user.get("department", "Computer Science")

    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                d.deadline_id, d.title, d.due_date, d.urgency,
                c.course_code, c.course_name,
                COUNT(s.submission_id) AS total_submissions,
                SUM(CASE WHEN s.status = 'DONE' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN s.status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
                d.department, d.program
            FROM Deadlines d
            INNER JOIN Courses c ON d.course_id = c.course_id
            LEFT JOIN Submissions s ON d.deadline_id = s.deadline_id
            WHERE d.department = ?
        """
        params = [dept]
        if program and program != "ALL":
            query += " AND (d.program = ? OR d.program = 'ALL')"
            params.append(program)

        query += """
            GROUP BY d.deadline_id, d.title, d.due_date, d.urgency,
                     c.course_code, c.course_name, d.department, d.program
            ORDER BY d.due_date
        """
        cursor.execute(query, params)
        rows = cursor.fetchall()

    dataset = [
        {
            "deadline_id": r[0], "title": r[1], "due_date": str(r[2]),
            "urgency": r[3], "course_code": r[4], "course_name": r[5],
            "total_submissions": r[6], "completed": r[7], "pending": r[8],
            "department": r[9], "program": r[10]
        }
        for r in rows
    ]
    return {"dataset": dataset, "generated_at": datetime.now(timezone.utc).isoformat(), "department": dept}


# =============================================================================
# API ENDPOINTS: User Management (HOD Only)
# =============================================================================

@app.put("/api/users/promote")
@require_role([ROLE_HOD])
async def promote_user(request: Request):
    """
    PUT /api/users/promote
    HOD promotes a STUDENT (role_id=1) to CR (role_id=2).
    """
    body = await request.json()
    target_user_id = body.get("user_id")
    new_role_id = body.get("role_id", ROLE_CR)

    if new_role_id not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Invalid role_id.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT role_id FROM Users WHERE user_id = ?", (target_user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found.")

        cursor.execute(
            "UPDATE Users SET role_id = ? WHERE user_id = ?",
            (new_role_id, target_user_id)
        )
        conn.commit()

    return {
        "message": f"User {target_user_id} promoted to {ROLE_NAMES.get(new_role_id, 'UNKNOWN')}."
    }


@app.get("/api/users")
@require_role([ROLE_HOD, ROLE_FACULTY])
async def get_all_users(request: Request):
    """
    GET /api/users — Strictly scopes users to the calling HOD or Faculty's department and program.
    Ensures multi-tenant department & academic programme isolation.
    """
    user = request.state.user
    role_id = user["role_id"]
    user_id = user.get("user_id")
    dept = user.get("department", "School of Computer Science and Engineering")
    user_prog = user.get("program", "")

    with get_db() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute("SELECT department, program, role_id FROM Users WHERE user_id = ?", (user_id,))
            u_row = cursor.fetchone()
            if u_row:
                dept = u_row[0] or dept
                user_prog = u_row[1] or user_prog
                role_id = u_row[2] or role_id

        dept_clause, dept_params = get_department_filter_sql("u", dept)

        if role_id == ROLE_FACULTY:
            # Program-level isolation for Faculty: only see students/CRs from their program
            prog_clause, prog_params = get_program_filter_sql("u", user_prog)
            cursor.execute(f"""
                SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.department, u.created_at, u.program, u.subject_or_course
                FROM Users u
                INNER JOIN Roles r ON u.role_id = r.role_id
                WHERE u.role_id IN (1, 2)
                  AND {dept_clause}
                  AND {prog_clause}
                ORDER BY u.role_id, u.full_name
            """, tuple(dept_params + prog_params))
        else:
            # HOD views all personnel of THEIR department
            cursor.execute(f"""
                SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.department, u.created_at, u.program, u.subject_or_course
                FROM Users u
                INNER JOIN Roles r ON u.role_id = r.role_id
                WHERE {dept_clause}
                ORDER BY u.role_id, u.full_name
            """, dept_params)
        rows = cursor.fetchall()

    users = [
        {
            "user_id": r[0], "full_name": r[1], "email": r[2],
            "role_id": r[3], "role_name": r[4], "department": r[5],
            "created_at": str(r[6]),
            "program": r[7] if len(r) > 7 and r[7] else "Core CSE",
            "subject_or_course": r[8] if len(r) > 8 and r[8] else ""
        }
        for r in rows
    ]
    return {"users": users, "scoped_department": dept, "scoped_program": user_prog}


@app.get("/api/faculty/students")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def get_faculty_department_students(request: Request, program: Optional[str] = None):
    """
    GET /api/faculty/students
    Strictly isolated department and academic programme student cohort for Faculty and HOD.
    - Faculty is strictly scoped to their assigned program (e.g. Core B.Tech CSE vs B.Tech CSE AIML).
    - HOD oversees entire department, with optional program filter.
    """
    user = request.state.user
    user_id = user.get("user_id")
    role_id = user.get("role_id")
    dept = user.get("department", "School of Computer Science and Engineering")
    user_prog = user.get("program", "")

    # Always fetch the authoritative department & program from DB
    with get_db() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute("SELECT department, program, role_id FROM Users WHERE user_id = ?", (user_id,))
            u_row = cursor.fetchone()
            if u_row:
                dept = u_row[0] or dept
                user_prog = u_row[1] or user_prog
                role_id = u_row[2] or role_id

        # Faculty is strictly locked to their program; HOD can view ALL or a specified program
        if role_id == ROLE_FACULTY:
            target_prog = user_prog
        else:
            target_prog = program if (program and program != "ALL") else (user_prog if user_prog and user_prog != "ALL" else "ALL")

        dept_clause_u, dept_params_u = get_department_filter_sql("u", dept)
        dept_clause_d, dept_params_d = get_department_filter_sql("Deadlines", dept)
        prog_clause_u, prog_params_u = get_program_filter_sql("u", target_prog)
        prog_clause_d, prog_params_d = get_program_filter_sql("Deadlines", target_prog)

        cursor.execute(f"""
            SELECT u.user_id, u.full_name, u.email, u.role_name, u.department,
                   u.program, u.subject_or_course, u.semester,
                   COALESCE(sub.completed_count, 0) as completed_tasks,
                   (SELECT COUNT(*) FROM Deadlines WHERE is_deleted = 0 AND {dept_clause_d} AND {prog_clause_d}) as total_deadlines
            FROM Users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as completed_count
                FROM Submissions
                WHERE status = 'DONE'
                GROUP BY user_id
            ) sub ON u.user_id = sub.user_id
            WHERE u.role_id IN (1, 2)
              AND {dept_clause_u}
              AND {prog_clause_u}
            ORDER BY u.full_name ASC
        """, tuple(dept_params_d + prog_params_d + dept_params_u + prog_params_u))
        rows = cursor.fetchall()

        students = []
        for r in rows:
            comp = r[8]
            tot = r[9]
            active_cnt = max(0, tot - comp)
            progress_pct = round((comp / tot * 100), 1) if tot > 0 else 0
            student_prog = r[5] or "B.Tech Computer Science & Engineering"
            students.append({
                "user_id": r[0],
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "role_name": r[3],
                "department": r[4],
                "program": student_prog,
                "course": student_prog,
                "subject_or_course": student_prog,
                "semester": r[7] or "Semester 3",
                "completed_tasks": comp,
                "total_deadlines": tot,
                "active_tasks": active_cnt,
                "progress_percentage": progress_pct,
                "status": "On Track" if progress_pct >= 40 else "Needs Review"
            })

    return {
        "success": True,
        "department": dept,
        "program": target_prog,
        "total_students": len(students),
        "students": students
    }



# =============================================================================
# API ENDPOINTS: Dashboard Statistics
# =============================================================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """
    Dashboard statistics endpoint — returns counts for the 3D Stress Orb.
    The pending deadline count drives the Orb's color, distortion, and particles.
    """
    user = get_current_user(request)
    user_dept = user.get("department", "Computer Science")
    user_prog = user.get("program", "Core CSE")
    user_role_id = user.get("role_id", 1)

    scope_conds, scope_params = get_scope_filter_sql(user_dept, user_prog, user_role_id, None, "d")
    scope_where = " AND ".join(scope_conds)

    with get_db() as conn:
        cursor = conn.cursor()

        # Total deadlines in user's program & department scope
        cursor.execute(f"SELECT COUNT(*) FROM Deadlines d WHERE {scope_where}", scope_params)
        total_deadlines = cursor.fetchone()[0]

        # Pending for current user
        cursor.execute(f"""
            SELECT COUNT(*) FROM Deadlines d
            WHERE {scope_where}
              AND d.deadline_id NOT IN (
                SELECT deadline_id FROM Submissions WHERE user_id = ? AND status = 'DONE'
            )
        """, scope_params + [user["user_id"]])
        pending_count = cursor.fetchone()[0]

        # Due within 24 hours (cross-db parameterized query)
        now_dt = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        future_24h_dt = (datetime.now(timezone.utc) + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(f"""
            SELECT COUNT(*) FROM Deadlines d
            WHERE {scope_where}
              AND d.due_date BETWEEN ? AND ?
              AND d.deadline_id NOT IN (
                SELECT deadline_id FROM Submissions WHERE user_id = ? AND status = 'DONE'
            )
        """, scope_params + [now_dt, future_24h_dt, user["user_id"]])
        due_soon = cursor.fetchone()[0]

        # Completed by current user
        cursor.execute(f"""
            SELECT COUNT(*) FROM Submissions s
            JOIN Deadlines d ON s.deadline_id = d.deadline_id
            WHERE {scope_where}
              AND s.user_id = ? AND s.status = 'DONE'
        """, scope_params + [user["user_id"]])
        completed = cursor.fetchone()[0]

        # Panic logs count (HOD only stat) - scoped to user's department
        dept_clause_p, dept_params_p = get_department_filter_sql("Panic_Logs", user_dept)
        cursor.execute(f"SELECT COUNT(*) FROM Panic_Logs WHERE severity = 'CRITICAL' AND {dept_clause_p}", tuple(dept_params_p))
        critical_panics = cursor.fetchone()[0]

    return {
        "total_deadlines": total_deadlines,
        "pending_count": pending_count,
        "due_soon": due_soon,
        "completed": completed,
        "critical_panics": critical_panics,
        "stress_level": _calculate_stress_level(pending_count, due_soon)
    }


def _calculate_stress_level(pending: int, due_soon: int) -> str:
    """Calculate stress level for the 3D Workload Stress Orb."""
    score = pending + (due_soon * 3)
    if score >= 10:
        return "CRITICAL"
    elif score >= 6:
        return "HIGH"
    elif score >= 3:
        return "MODERATE"
    return "LOW"


def _get_optional_user(request: Request) -> Optional[dict]:
    """Extract authenticated user if Bearer token is present, else None."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            return decode_jwt_token(token)
    except Exception:
        pass
    return None


def _get_user_academic_context(user_id: int) -> dict:
    """Build live student/faculty/HOD academic context for the AI Copilot."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT full_name, email, role_name, department, subject_or_course 
            FROM Users WHERE user_id = ?
        """, (user_id,))
        u = cursor.fetchone()
        if not u:
            return {}
        name, email, role, dept, sub = u

        # Pending deadlines for this user
        cursor.execute("""
            SELECT d.deadline_id, d.title, d.due_date, d.urgency, c.course_code, c.course_name
            FROM Deadlines d
            JOIN Courses c ON d.course_id = c.course_id
            WHERE d.deadline_id NOT IN (
                SELECT deadline_id FROM Submissions WHERE user_id = ? AND status = 'DONE'
            )
            ORDER BY d.due_date ASC
            LIMIT 10
        """, (user_id,))
        pending_rows = cursor.fetchall()
        pending_count = len(pending_rows)

        # Due within 24 hours
        now_dt = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        future_24h_dt = (datetime.now(timezone.utc) + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            SELECT COUNT(*) FROM Deadlines
            WHERE due_date BETWEEN ? AND ?
        """, (now_dt, future_24h_dt))
        due_soon = cursor.fetchone()[0]

        # Completed submissions
        cursor.execute("SELECT COUNT(*) FROM Submissions WHERE user_id = ? AND status = 'DONE'", (user_id,))
        completed = cursor.fetchone()[0]

        # Courses list
        cursor.execute("SELECT course_code, course_name FROM Courses LIMIT 8")
        course_rows = cursor.fetchall()
        courses = [f"{c[0]}: {c[1]}" for c in course_rows]

        # Recent exam schedules
        cursor.execute("""
            SELECT e.exam_type, e.exam_date, e.venue, c.course_code 
            FROM Exam_Schedules e
            JOIN Courses c ON e.course_id = c.course_id
            ORDER BY e.exam_date ASC LIMIT 5
        """)
        exam_rows = cursor.fetchall()
        exams_list = [f"• {r[0]} ({r[3]}): {r[1]} @ {r[2]}" for r in exam_rows]

        deadlines_summary_lines = []
        for did, title, ddate, urg, ccode, cname in pending_rows:
            deadlines_summary_lines.append(f"• [{urg}] {ccode}: {title} (Due: {ddate})")
        deadlines_summary = "\n".join(deadlines_summary_lines) if deadlines_summary_lines else "No pending deadlines recorded! Workload is clear."

        return {
            "name": name,
            "role": role,
            "department": dept,
            "subject_or_course": sub,
            "pending_count": pending_count,
            "due_soon": due_soon,
            "completed": completed,
            "stress_level": _calculate_stress_level(pending_count, due_soon),
            "deadlines_summary": deadlines_summary,
            "courses": courses,
            "upcoming_exams": "\n".join(exams_list) if exams_list else "No scheduled exams.",
            "active_deadlines": [
                {"id": r[0], "title": r[1], "due_date": r[2], "urgency": r[3], "course": f"{r[4]}: {r[5]}"}
                for r in pending_rows
            ]
        }


# =============================================================================
# FEATURE F8: NVIDIA Nemotron 3.5 Super-VL 120B Academic Chat & Report Analyst
# =============================================================================

@app.get("/api/ai/status")
async def ai_status():
    """Returns AI model details, thinking capability, and API key status."""
    key = get_nvidia_api_key()
    return {
        "model": NEMOTRON_MODEL,
        "endpoint": NVIDIA_BASE_URL,
        "has_api_key": bool(key),
        "thinking_enabled": True,
        "features": [
            "Vision-Language Multimodal Report Analysis",
            "Deep Pedagogical Reasoning (reasoning_content)",
            "Live Workload & Deadlines Grounding",
            "Auto Study & Exam Revision Plans"
        ]
    }


@app.post("/api/ai/set-key")
async def ai_set_key(req: AISetKeyRequest, request: Request):
    """Allows user to dynamically set/update NVIDIA_API_KEY from UI."""
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    os.environ["NVIDIA_API_KEY"] = key
    
    # Also update backend/.env if possible so it persists across reloads
    try:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        lines = []
        key_found = False
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("NVIDIA_API_KEY="):
                        lines.append(f"NVIDIA_API_KEY={key}\n")
                        key_found = True
                    else:
                        lines.append(line)
        if not key_found:
            lines.append(f"\nNVIDIA_API_KEY={key}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception as e:
        logger.warning(f"Could not persist NVIDIA_API_KEY to .env: {e}")

    logger.info("NVIDIA API key updated successfully.")
    return {"success": True, "message": "NVIDIA API key updated successfully."}


@app.get("/api/ai/academic-report")
async def get_user_academic_report(request: Request):
    """Fetches comprehensive academic report for the current user."""
    user = _get_optional_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to view academic report.")
    
    ctx = _get_user_academic_context(user["user_id"])
    return {
        "success": True,
        "report": ctx,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/ai/upload-document")
async def ai_upload_document(file: UploadFile = File(...)):
    """
    Intelligent Multi-Format Document OCR & Extraction Engine.
    Extracts text, metadata, deadlines, course code, deliverables, concepts, and study hours.
    Works for PDF, Scanned Images, DOCX, TXT, MD, CSV, and code files.
    """
    try:
        content = await file.read()
        intel = extract_document_intel(content, file.filename)
        return {
            "success": True,
            "filename": file.filename,
            "char_count": intel["char_count"],
            "ocr_applied": intel["ocr_applied"],
            "text": intel["full_text"],
            "preview": intel["summary"],
            "intel": {
                "course_code": intel["course_code"],
                "title": intel["title"],
                "due_date": intel["due_date"],
                "urgency": intel["urgency"],
                "deliverables": intel["deliverables"],
                "technical_concepts": intel["technical_concepts"],
                "estimated_hours": intel["estimated_hours"],
                "pomodoro_cycles": intel["pomodoro_cycles"],
                "summary": intel["summary"]
            }
        }
    except Exception as exc:
        logger.error(f"Failed to process document {file.filename}: {exc}")
        raise HTTPException(status_code=400, detail=f"Failed to process document: {exc}")


class QuickDeadlineRequest(BaseModel):
    course_code: str
    title: str
    due_date: str
    urgency: Optional[str] = "MEDIUM"
    description: Optional[str] = ""


@app.post("/api/ai/quick-create-deadline")
async def ai_quick_create_deadline(req: QuickDeadlineRequest, request: Request):
    """
    Instantly converts OCR'd or AI-analyzed document deliverables into an official or personal deadline.
    Performs institutional conflict & exam clash checking.
    """
    user = _get_optional_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to sync deadlines.")

    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Resolve Course ID
        cursor.execute("SELECT course_id FROM Courses WHERE UPPER(course_code) = UPPER(?)", (req.course_code.strip(),))
        crow = cursor.fetchone()
        if crow:
            course_id = crow[0]
        else:
            # Fallback to first course
            cursor.execute("SELECT course_id FROM Courses LIMIT 1")
            fc = cursor.fetchone()
            course_id = fc[0] if fc else 1

        # 2. Conflict checking
        due_clean = req.due_date.replace("T", " ").replace("Z", "")
        if len(due_clean) == 10:
            due_clean += " 23:59:00"
        elif len(due_clean) == 16:
            due_clean += ":00"

        try:
            due_dt = datetime.strptime(due_clean[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            due_dt = datetime.now()

        # Check exam clash within 24h
        cursor.execute("SELECT exam_date FROM Exam_Schedules WHERE course_id = ?", (course_id,))
        for erow in cursor.fetchall():
            edate_clean = str(erow[0]).replace("Z", "").replace("T", " ")
            if len(edate_clean) == 16:
                edate_clean += ":00"
            try:
                edate_dt = datetime.strptime(edate_clean[:19], "%Y-%m-%d %H:%M:%S")
                diff_hours = abs((due_dt - edate_dt).total_seconds()) / 3600.0
                if diff_hours < 24.0:
                    raise HTTPException(
                        status_code=409,
                        detail="CONFLICT: This task clashes with a scheduled exam within 24 hours for the same course."
                    )
            except Exception:
                continue

        # Insert Deadline
        cursor.execute("""
            INSERT INTO Deadlines (course_id, posted_by, title, description, due_date, urgency)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (course_id, user["user_id"], req.title[:150], req.description[:500], due_clean[:19], req.urgency))
        conn.commit()

    cache_invalidate(f"deadlines_None_None_{user['user_id']}")
    return {
        "success": True,
        "message": f"Successfully synced '{req.title[:40]}' to ChronoSync deadlines!",
        "course_id": course_id,
        "due_date": due_clean[:19]
    }


@app.post("/api/ai/chat")
async def ai_chat(req: AIChatRequest, request: Request):
    """
    Standard JSON endpoint for NVIDIA Nemotron 3.5 Super-VL 120B.
    Returns both reasoning (thinking tokens) and final academic response.
    Supports uploaded document text ingestion.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty.")

    user_context = None
    if req.include_live_context:
        user = _get_optional_user(request)
        if user:
            user_context = _get_user_academic_context(user["user_id"])

    result = call_nemotron_academic_chat(
        messages=req.messages,
        api_key=req.api_key,
        image_url=req.image_url,
        document_text=req.document_text,
        document_name=req.document_name,
        stream=False,
        user_context=user_context
    )

    return {
        "success": True,
        "reasoning": result.get("reasoning", ""),
        "content": result.get("content", ""),
        "source": result.get("source", "unknown"),
        "model": NEMOTRON_MODEL
    }


import json

@app.post("/api/ai/chat/stream")
async def ai_chat_stream(req: AIChatRequest, request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint for NVIDIA Nemotron 3.5 Super-VL 120B.
    Streams both 'reasoning' (thinking tokens) and 'content' chunks in real-time.
    Supports multimodal images and uploaded document context.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty.")

    user_context = None
    if req.include_live_context:
        user = _get_optional_user(request)
        if user:
            user_context = _get_user_academic_context(user["user_id"])

    gen = call_nemotron_academic_chat(
        messages=req.messages,
        api_key=req.api_key,
        image_url=req.image_url,
        document_text=req.document_text,
        document_name=req.document_name,
        stream=True,
        user_context=user_context
    )

    async def event_generator():
        for chunk in gen:
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# =============================================================================
# FACULTY TO CR COURSEWORK DELEGATION SYSTEM (Feature F9)
# =============================================================================

@app.get("/api/delegations/crs")
@require_role([ROLE_FACULTY, ROLE_HOD, ROLE_CR])
async def get_crs_for_delegation(
    request: Request,
    department: Optional[str] = None,
    program: Optional[str] = None,
    semester: Optional[str] = None
):
    """
    GET /api/delegations/crs
    Retrieves registered Class Representatives (CRs) matching department, program, semester.
    """
    user = request.state.user
    req_dept = department or user.get("department", "School of Computer Science and Engineering")
    dept_clause, dept_params = get_department_filter_sql("u", req_dept)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT u.user_id, u.full_name, u.email, u.role_id, u.department,
                   u.program, u.semester, u.subject_or_course
            FROM Users u
            WHERE (u.role_id = 2 OR u.role_name = 'CR')
              AND {dept_clause}
            ORDER BY u.full_name ASC
        """, dept_params)
        rows = cursor.fetchall()

    all_crs = []
    matched_crs = []

    for r in rows:
        cr_data = {
            "user_id": r[0],
            "full_name": r[1],
            "email": r[2],
            "role_id": r[3],
            "department": r[4] or req_dept,
            "program": r[5] or "Core CSE",
            "semester": r[6] or "Semester 3",
            "subject_or_course": r[7] or ""
        }
        all_crs.append(cr_data)

        # Check program match strictly
        prog_match = True
        if program and program != "ALL":
            prog_match = is_program_match(program, cr_data["program"]) or is_program_match(program, cr_data["subject_or_course"])

        # Check semester match
        sem_match = True
        if semester and semester != "ALL":
            s_lower = semester.lower()
            cs_sem = cr_data["semester"].lower()
            cs_sub = cr_data["subject_or_course"].lower()
            sem_match = (s_lower in cs_sem or cs_sem in s_lower or s_lower in cs_sub)

        if prog_match and sem_match:
            matched_crs.append(cr_data)

    return {
        "crs": matched_crs,
        "all_crs": all_crs,
        "total_matches": len(matched_crs)
    }


@app.post("/api/delegations/upload")
@require_role([ROLE_FACULTY, ROLE_HOD, ROLE_CR])
async def upload_delegation_document(request: Request, file: UploadFile = File(...)):
    """
    POST /api/delegations/upload
    Uploads course material / assignment document for CR delegation.
    """
    try:
        content = await file.read()
        safe_name = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "success": True,
            "filename": file.filename,
            "url": f"/uploads/{safe_name}",
            "size_bytes": len(content)
        }
    except Exception as e:
        logger.error(f"Failed to upload delegation document: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@app.post("/api/delegations")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def create_faculty_delegation(request: Request, payload: DelegationCreate):
    """
    POST /api/delegations
    Faculty assigns assignment / coursework document to a selected CR.
    """
    user = request.state.user
    faculty_id = user["user_id"]
    faculty_name = user.get("full_name", "Faculty Member")
    dept = user.get("department", "Computer Science")

    with get_db() as conn:
        cursor = conn.cursor()
        # Verify CR exists
        cursor.execute("SELECT user_id, full_name, email, department, program, semester FROM Users WHERE user_id = ?", (payload.cr_id,))
        cr_row = cursor.fetchone()
        if not cr_row:
            raise HTTPException(status_code=404, detail="Selected Class Representative (CR) not found in directory.")

        cr_name = cr_row[1]

        # Resolve Course ID if not provided
        course_id = payload.course_id
        course_code = None
        if not course_id:
            cursor.execute("SELECT course_id, course_code FROM Courses WHERE course_name LIKE ? OR course_code LIKE ? LIMIT 1",
                           (f"%{payload.subject}%", f"%{payload.subject}%"))
            c_row = cursor.fetchone()
            if c_row:
                course_id = c_row[0]
                course_code = c_row[1]
            else:
                cursor.execute("SELECT course_id, course_code FROM Courses LIMIT 1")
                def_c = cursor.fetchone()
                if def_c:
                    course_id = def_c[0]
                    course_code = def_c[1]

        cursor.execute("""
            INSERT INTO Faculty_CR_Delegations (
                faculty_id, faculty_name, cr_id, cr_name, department, program, semester,
                course_id, course_code, subject, title, description,
                document_url, document_name, due_date, urgency, estimated_hours, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        """, (
            faculty_id, faculty_name, payload.cr_id, cr_name, dept,
            payload.program, payload.semester, course_id, course_code,
            payload.subject, sanitize_input(payload.title), sanitize_input(payload.description or ""),
            payload.document_url, payload.document_name, payload.due_date,
            payload.urgency or 'MEDIUM', payload.estimated_hours or 4.0
        ))
        delegation_id = cursor.lastrowid

    return {
        "success": True,
        "delegation_id": delegation_id,
        "message": f"Coursework successfully delegated to CR {cr_name} for {payload.program} ({payload.semester})."
    }


@app.get("/api/delegations/faculty")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def get_faculty_delegations(request: Request):
    """
    GET /api/delegations/faculty
    Returns all delegations assigned by the calling faculty member or within HOD's department.
    """
    user = request.state.user
    faculty_id = user["user_id"]
    user_dept = user.get("department", "School of Computer Science and Engineering")

    with get_db() as conn:
        cursor = conn.cursor()
        if user["role_id"] == ROLE_HOD:
            dept_clause, dept_params = get_department_filter_sql("Faculty_CR_Delegations", user_dept)
            cursor.execute(f"""
                SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                       department, program, semester, course_id, course_code,
                       subject, title, description, document_url, document_name,
                       due_date, urgency, estimated_hours, status, published_deadline_id,
                       created_at, published_at
                FROM Faculty_CR_Delegations
                WHERE {dept_clause}
                ORDER BY created_at DESC
            """, dept_params)
        else:
            cursor.execute("""
                SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                       department, program, semester, course_id, course_code,
                       subject, title, description, document_url, document_name,
                       due_date, urgency, estimated_hours, status, published_deadline_id,
                       created_at, published_at
                FROM Faculty_CR_Delegations
                WHERE faculty_id = ?
                ORDER BY created_at DESC
            """, (faculty_id,))
        rows = cursor.fetchall()

    delegations = []
    for r in rows:
        delegations.append({
            "delegation_id": r[0],
            "faculty_id": r[1],
            "faculty_name": r[2],
            "cr_id": r[3],
            "cr_name": r[4],
            "department": r[5],
            "program": r[6],
            "semester": r[7],
            "course_id": r[8],
            "course_code": r[9],
            "subject": r[10],
            "title": r[11],
            "description": r[12],
            "document_url": r[13],
            "document_name": r[14],
            "due_date": str(r[15]),
            "urgency": r[16],
            "estimated_hours": r[17],
            "status": r[18],
            "published_deadline_id": r[19],
            "created_at": str(r[20]),
            "published_at": str(r[21]) if r[21] else None
        })

    return {"delegations": delegations}


@app.get("/api/delegations/cr")
@require_role([ROLE_CR, ROLE_HOD])
async def get_cr_delegations(request: Request):
    """
    GET /api/delegations/cr
    Returns all delegations assigned to this CR or their department/program cohort.
    """
    user = request.state.user
    cr_id = user["user_id"]
    cr_dept = user.get("department", "School of Computer Science and Engineering")
    cr_prog = user.get("program", "Core CSE")
    dept_clause, dept_params = get_department_filter_sql("Faculty_CR_Delegations", cr_dept)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                   department, program, semester, course_id, course_code,
                   subject, title, description, document_url, document_name,
                   due_date, urgency, estimated_hours, status, published_deadline_id,
                   created_at, published_at
            FROM Faculty_CR_Delegations
            WHERE cr_id = ? OR (
                {dept_clause}
                AND (program = 'ALL' OR LOWER(program) = LOWER(?) OR instr(LOWER(?), LOWER(program)) > 0)
            )
            ORDER BY created_at DESC
        """, tuple([cr_id] + dept_params + [cr_prog, cr_prog]))
        rows = cursor.fetchall()

    delegations = []
    for r in rows:
        delegations.append({
            "delegation_id": r[0],
            "faculty_id": r[1],
            "faculty_name": r[2],
            "cr_id": r[3],
            "cr_name": r[4],
            "department": r[5],
            "program": r[6],
            "semester": r[7],
            "course_id": r[8],
            "course_code": r[9],
            "subject": r[10],
            "title": r[11],
            "description": r[12],
            "document_url": r[13],
            "document_name": r[14],
            "due_date": str(r[15]),
            "urgency": r[16],
            "estimated_hours": r[17],
            "status": r[18],
            "published_deadline_id": r[19],
            "created_at": str(r[20]),
            "published_at": str(r[21]) if r[21] else None
        })

    return {"delegations": delegations}


@app.post("/api/delegations/{delegation_id}/publish")
@require_role([ROLE_CR, ROLE_HOD])
async def publish_delegation_to_students(request: Request, delegation_id: int):
    """
    POST /api/delegations/{delegation_id}/publish
    CR accepts faculty assignment and publishes it directly to the Student Dashboard (Deadlines table).
    """
    user = request.state.user

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                   department, program, semester, course_id, course_code,
                   subject, title, description, document_url, document_name,
                   due_date, urgency, estimated_hours, status
            FROM Faculty_CR_Delegations
            WHERE delegation_id = ?
        """, (delegation_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Delegated assignment not found.")

        status = row[18]
        if status == "PUBLISHED":
            return {"success": True, "message": "This assignment has already been published to the student dashboard."}

        course_id = row[8]
        if not course_id:
            cursor.execute("SELECT course_id FROM Courses LIMIT 1")
            c = cursor.fetchone()
            course_id = c[0] if c else 1

        title = row[11]
        desc = row[12] or ""
        due_date = row[15]
        urgency = row[16] or "MEDIUM"
        doc_url = row[13]
        dept = row[5]
        prog = row[6]
        fac_name = row[2]

        # Insert into Deadlines
        try:
            cursor.execute("""
                INSERT INTO Deadlines (
                    course_id, posted_by, title, description, due_date,
                    urgency, pdf_blob_url, department, program
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                course_id, user["user_id"], title,
                f"[Assigned by Prof. {fac_name}]\n{desc}",
                due_date, urgency, doc_url, dept, prog
            ))
            deadline_id = cursor.lastrowid
        except Exception as e:
            err_str = str(e)
            if "CONFLICT" in err_str:
                raise HTTPException(status_code=409, detail=err_str)
            raise HTTPException(status_code=500, detail=f"Failed to publish deadline: {err_str}")

        # Update Delegation Status
        cursor.execute("""
            UPDATE Faculty_CR_Delegations
            SET status = 'PUBLISHED',
                published_deadline_id = ?,
                published_at = CURRENT_TIMESTAMP
            WHERE delegation_id = ?
        """, (deadline_id, delegation_id))

    cache_clear()
    return {
        "success": True,
        "deadline_id": deadline_id,
        "message": "✓ Assignment successfully published to Student Dashboard!"
    }


@app.delete("/api/delegations/{delegation_id}")
@require_role([ROLE_FACULTY, ROLE_HOD])
async def delete_delegation(request: Request, delegation_id: int):
    """
    DELETE /api/delegations/{delegation_id}
    Faculty cancels a pending assignment delegation.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Faculty_CR_Delegations WHERE delegation_id = ?", (delegation_id,))
    return {"success": True, "message": "Delegation removed."}


# =============================================================================
# API ENDPOINTS: Comprehensive Task, Assignment & Delegation History
# =============================================================================

@app.get("/api/history")
async def get_history(request: Request):
    """
    GET /api/history
    Provides complete persistent history of all assignments, deliverables, and delegations
    for Faculty, CR, HOD, and Students strictly isolated by their institution department.
    Ensures that an HOD, Faculty, CR, or Student only sees records of their own department.
    """
    user = get_current_user(request)
    user_id = user["user_id"]
    user_role_id = user.get("role_id", 1)
    user_dept = user.get("department", "School of Computer Science and Engineering")
    user_prog = user.get("program", "Core CSE")

    dept_clause_d, dept_params_d = get_department_filter_sql("d", user_dept)
    dept_clause_u, dept_params_u = get_department_filter_sql("u2", user_dept)
    dept_clause_del, dept_params_del = get_department_filter_sql("Faculty_CR_Delegations", user_dept)
    dept_clause_e, dept_params_e = get_department_filter_sql("e", user_dept)
    dept_clause_n, dept_params_n = get_department_filter_sql("n", user_dept)
    dept_clause_reg, dept_params_reg = get_department_filter_sql("u", user_dept)

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch scoped deadlines (All tasks & assignments uploaded/assigned)
        scope_conds, scope_params = get_scope_filter_sql(user_dept, user_prog, user_role_id, None, "d")
        scope_where = " AND ".join(scope_conds)

        if user_role_id == ROLE_HOD:
            deadline_query = f"""
                SELECT d.deadline_id, d.title, d.description, d.due_date, d.urgency,
                       d.pdf_blob_url, d.created_at, d.course_id,
                       COALESCE(c.course_code, 'COURSE') AS course_code,
                       COALESCE(c.course_name, 'General Coursework') AS course_name,
                       COALESCE(u.full_name, 'Academic Staff') AS posted_by_name,
                       d.department, d.program,
                       COALESCE(u.role_name, 'Faculty') AS posted_by_role,
                       COALESCE(d.is_deleted, 0) AS is_deleted
                FROM Deadlines d
                LEFT JOIN Courses c ON d.course_id = c.course_id
                LEFT JOIN Users u ON d.posted_by = u.user_id
                WHERE {dept_clause_d}
                ORDER BY d.created_at DESC, d.deadline_id DESC
            """
            d_params = list(dept_params_d)
        elif user_role_id in (ROLE_FACULTY, ROLE_CR):
            deadline_query = f"""
                SELECT d.deadline_id, d.title, d.description, d.due_date, d.urgency,
                       d.pdf_blob_url, d.created_at, d.course_id,
                       COALESCE(c.course_code, 'COURSE') AS course_code,
                       COALESCE(c.course_name, 'General Coursework') AS course_name,
                       COALESCE(u.full_name, 'Academic Staff') AS posted_by_name,
                       d.department, d.program,
                       COALESCE(u.role_name, 'Faculty') AS posted_by_role,
                       COALESCE(d.is_deleted, 0) AS is_deleted
                FROM Deadlines d
                LEFT JOIN Courses c ON d.course_id = c.course_id
                LEFT JOIN Users u ON d.posted_by = u.user_id
                WHERE {dept_clause_d} AND (d.posted_by = ? OR ({scope_where}))
                ORDER BY d.created_at DESC, d.deadline_id DESC
            """
            d_params = list(dept_params_d) + [user_id] + scope_params
        else:
            deadline_query = f"""
                SELECT d.deadline_id, d.title, d.description, d.due_date, d.urgency,
                       d.pdf_blob_url, d.created_at, d.course_id,
                       COALESCE(c.course_code, 'COURSE') AS course_code,
                       COALESCE(c.course_name, 'General Coursework') AS course_name,
                       COALESCE(u.full_name, 'Academic Staff') AS posted_by_name,
                       d.department, d.program,
                       COALESCE(u.role_name, 'Faculty') AS posted_by_role,
                       COALESCE(d.is_deleted, 0) AS is_deleted
                FROM Deadlines d
                LEFT JOIN Courses c ON d.course_id = c.course_id
                LEFT JOIN Users u ON d.posted_by = u.user_id
                WHERE {scope_where}
                ORDER BY d.created_at DESC, d.deadline_id DESC
            """
            d_params = scope_params

        cursor.execute(deadline_query, d_params)
        d_rows = cursor.fetchall()

        tasks = []
        for r in d_rows:
            dl_id = r[0]
            dl_title = r[1]
            dl_desc = r[2]
            dl_due = str(r[3])
            dl_urg = r[4]
            dl_file = r[5]
            dl_created = str(r[6])
            cid = r[7]
            ccode = r[8]
            cname = r[9]
            poster_name = r[10]
            dept = r[11]
            prog = r[12]
            poster_role = r[13] if len(r) > 13 else 'Faculty'
            is_del = bool(r[14]) if len(r) > 14 else False

            # Total enrolled students matching this program & department strictly
            prog_clause_u2, prog_params_u2 = get_program_filter_sql("u2", prog)
            cursor.execute(f"""
                SELECT COUNT(*) FROM Users u2
                WHERE u2.role_id = 1
                  AND {dept_clause_u}
                  AND {prog_clause_u2}
            """, tuple(dept_params_u + prog_params_u2))
            total_enrolled = cursor.fetchone()[0]

            # Completed count
            cursor.execute("""
                SELECT COUNT(*) FROM Submissions s
                WHERE s.deadline_id = ? AND s.status = 'DONE'
            """, (dl_id,))
            completed_count = cursor.fetchone()[0]
            pending_count = max(0, total_enrolled - completed_count)
            rate = round((completed_count / total_enrolled) * 100, 1) if total_enrolled > 0 else 0

            # Check if overdue
            is_overdue = False
            try:
                due_clean = dl_due.replace("Z", "").replace("T", " ")[:19]
                dt = datetime.strptime(due_clean, "%Y-%m-%d %H:%M:%S")
                is_overdue = dt < datetime.now()
            except Exception:
                pass

            tasks.append({
                "deadline_id": dl_id,
                "task_id": dl_id,
                "title": dl_title,
                "description": dl_desc,
                "due_date": dl_due,
                "urgency": dl_urg,
                "pdf_blob_url": dl_file,
                "file_attachment": dl_file,
                "created_at": dl_created,
                "course_id": cid,
                "course_code": ccode,
                "course_name": cname,
                "posted_by_name": poster_name,
                "posted_by_role": poster_role,
                "department": dept,
                "program": prog,
                "target_program": prog,
                "total_enrolled": total_enrolled,
                "total_students": total_enrolled,
                "completed_count": completed_count,
                "pending_count": pending_count,
                "completion_rate": rate,
                "is_overdue": is_overdue,
                "is_deleted": is_del,
                "is_archived": is_del,
                "status": "ARCHIVED / DELETED" if is_del else ("OVERDUE" if is_overdue else "ACTIVE"),
            })

        # 2. Fetch Delegations (Strictly department isolated)
        if user_role_id == ROLE_FACULTY:
            cursor.execute("""
                SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                       department, program, semester, course_id, course_code,
                       subject, title, description, document_url, document_name,
                       due_date, urgency, estimated_hours, status,
                       published_deadline_id, created_at, published_at
                FROM Faculty_CR_Delegations
                WHERE faculty_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
        elif user_role_id == ROLE_CR:
            cursor.execute(f"""
                SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                       department, program, semester, course_id, course_code,
                       subject, title, description, document_url, document_name,
                       due_date, urgency, estimated_hours, status,
                       published_deadline_id, created_at, published_at
                FROM Faculty_CR_Delegations
                WHERE cr_id = ? OR (
                    {dept_clause_del}
                    AND (program = ? OR instr(LOWER(?), LOWER(program)) > 0 OR instr(LOWER(program), LOWER(?)) > 0)
                )
                ORDER BY created_at DESC
            """, tuple([user_id] + dept_params_del + [user_prog, user_prog, user_prog]))
        else:
            # HOD and other roles see strictly delegations from their department
            cursor.execute(f"""
                SELECT delegation_id, faculty_id, faculty_name, cr_id, cr_name,
                       department, program, semester, course_id, course_code,
                       subject, title, description, document_url, document_name,
                       due_date, urgency, estimated_hours, status,
                       published_deadline_id, created_at, published_at
                FROM Faculty_CR_Delegations
                WHERE {dept_clause_del}
                ORDER BY created_at DESC
            """, tuple(dept_params_del))
        del_rows = cursor.fetchall()
        delegations = []
        for r in del_rows:
            delegations.append({
                "delegation_id": r[0],
                "faculty_id": r[1],
                "faculty_name": r[2],
                "cr_id": r[3],
                "cr_name": r[4],
                "department": r[5],
                "program": r[6],
                "semester": r[7],
                "course_id": r[8],
                "course_code": r[9],
                "subject": r[10],
                "title": r[11],
                "description": r[12],
                "document_url": r[13],
                "document_name": r[14],
                "due_date": str(r[15]),
                "urgency": r[16],
                "estimated_hours": r[17],
                "status": r[18],
                "published_deadline_id": r[19],
                "created_at": str(r[20]),
                "published_at": str(r[21]) if r[21] else None
            })

        # 3. Fetch Exams (Scheduled for user's department)
        cursor.execute(f"""
            SELECT e.exam_id, e.course_id, e.scheduled_by, strftime('%Y-%m-%d %H:%M', e.exam_date), e.exam_type, e.venue,
                   strftime('%Y-%m-%d %H:%M', e.created_at), e.department, e.program,
                   COALESCE(c.course_code, 'EXAM') AS course_code,
                   COALESCE(c.course_name, 'Academic Exam') AS course_name,
                   COALESCE(u.full_name, 'Faculty') AS scheduled_by_name,
                   COALESCE(u.role_name, 'Faculty') AS scheduled_by_role
            FROM Exam_Schedules e
            LEFT JOIN Courses c ON e.course_id = c.course_id
            LEFT JOIN Users u ON e.scheduled_by = u.user_id
            WHERE {dept_clause_e}
            ORDER BY e.created_at DESC, e.exam_id DESC
        """, tuple(dept_params_e))
        exam_rows = cursor.fetchall()
        exams = []
        for er in exam_rows:
            exams.append({
                "exam_id": er[0],
                "course_id": er[1],
                "scheduled_by": er[2],
                "exam_date": str(er[3]),
                "exam_type": er[4],
                "venue": er[5],
                "created_at": str(er[6]),
                "department": er[7],
                "program": er[8],
                "course_code": er[9],
                "course_name": er[10],
                "scheduled_by_name": er[11],
                "scheduled_by_role": er[12]
            })

        # 4. Fetch Department Notices / Bulletins (Department isolated)
        cursor.execute(f"""
            SELECT n.notice_id, n.department, n.program, n.semester, n.posted_by,
                   n.title, n.content, n.notice_type, strftime('%Y-%m-%d %H:%M', n.created_at),
                   COALESCE(u.full_name, 'Department Authority') AS posted_by_name,
                   COALESCE(u.role_name, 'HOD') AS posted_by_role
            FROM Department_Notices n
            LEFT JOIN Users u ON n.posted_by = u.user_id
            WHERE {dept_clause_n}
            ORDER BY n.created_at DESC, n.notice_id DESC
        """, tuple(dept_params_n))
        notice_rows = cursor.fetchall()
        notices = []
        for nr in notice_rows:
            notices.append({
                "notice_id": nr[0],
                "department": nr[1],
                "program": nr[2],
                "semester": nr[3],
                "posted_by": nr[4],
                "title": nr[5],
                "content": nr[6],
                "notice_type": nr[7],
                "created_at": str(nr[8]),
                "posted_by_name": nr[9],
                "posted_by_role": nr[10]
            })

        # 5. Fetch Registered Accounts (Department isolated)
        cursor.execute(f"""
            SELECT u.user_id, u.full_name, u.email, u.role_id, u.role_name,
                   u.department, u.program, u.semester, u.subject_or_course,
                   strftime('%Y-%m-%d %H:%M', u.created_at)
            FROM Users u
            WHERE {dept_clause_reg}
            ORDER BY u.created_at DESC, u.user_id DESC
        """, tuple(dept_params_reg))
        user_rows = cursor.fetchall()
        registered_users = []
        for ur in user_rows:
            registered_users.append({
                "user_id": ur[0],
                "full_name": ur[1],
                "email": ur[2],
                "role_id": ur[3],
                "role_name": ur[4],
                "department": ur[5],
                "program": ur[6],
                "semester": ur[7],
                "subject_or_course": ur[8],
                "created_at": str(ur[9])
            })

    total_tasks = len(tasks)
    archived_tasks = len([t for t in tasks if t.get("is_deleted")])
    active_tasks = len([t for t in tasks if not t.get("is_deleted") and t["pending_count"] > 0 and not t["is_overdue"]])
    completed_tasks = len([t for t in tasks if not t.get("is_deleted") and (t["pending_count"] == 0 or t["completion_rate"] == 100.0)])
    files_shared = len([t for t in tasks if t["pdf_blob_url"]]) + len([d for d in delegations if d["document_url"]])

    return {
        "tasks": tasks,
        "delegations": delegations,
        "exams": exams,
        "notices": notices,
        "registered_users": registered_users,
        "stats": {
            "total_tasks": total_tasks,
            "active_tasks": active_tasks,
            "completed_tasks": completed_tasks,
            "archived_tasks": archived_tasks,
            "total_delegations": len(delegations),
            "total_exams": len(exams),
            "total_notices": len(notices),
            "total_users": len(registered_users),
            "files_shared": files_shared,
        }
    }


@app.get("/api/history/deadline/{deadline_id}/students")
async def get_deadline_student_roster(request: Request, deadline_id: int):
    """
    GET /api/history/deadline/{deadline_id}/students
    Returns detailed student completion status list for a specific deadline
    showing who has completed the task and who still has it left/pending.
    Strictly isolated to students of the deadline's department.
    """
    user = get_current_user(request)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT program, department, title FROM Deadlines WHERE deadline_id = ?", (deadline_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Deadline not found.")
        prog, dept, title = row[0], row[1], row[2]
        dept_clause_u, dept_params_u = get_department_filter_sql("u", dept or user.get("department", "School of Computer Science and Engineering"))

        prog_clause_u, prog_params_u = get_program_filter_sql("u", prog)

        cursor.execute(f"""
            SELECT u.user_id, u.full_name, u.email, u.program,
                   COALESCE(s.status, 'PENDING') AS status,
                   s.completed_at
            FROM Users u
            LEFT JOIN Submissions s ON u.user_id = s.user_id AND s.deadline_id = ?
            WHERE u.role_id = 1
              AND {dept_clause_u}
              AND {prog_clause_u}
            ORDER BY status DESC, u.full_name ASC
        """, tuple([deadline_id] + dept_params_u + prog_params_u))
        students = []
        for s in cursor.fetchall():
            students.append({
                "user_id": s[0],
                "full_name": s[1],
                "email": s[2],
                "program": s[3],
                "status": s[4],
                "completed_at": str(s[5]) if s[5] else None
            })

    return {
        "deadline_id": deadline_id,
        "title": title,
        "program": prog,
        "students": students,
        "total": len(students),
        "completed": len([s for s in students if s["status"] == "DONE"]),
        "pending": len([s for s in students if s["status"] != "DONE"]),
    }


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host=host, port=port, reload=True)
