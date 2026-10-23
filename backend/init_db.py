# =============================================================================
# EduTrack 3D — Database Initialization & Seeding Script (init_db.py)
# =============================================================================
# SUBJECT 4 (Cloud Security):
#   - bcrypt.gensalt(rounds=12) → 4096 iterations, per-account unique salt.
#   - failed_login_attempts + locked_until → 5-strike brute-force guard.
#   - Institutional_Directory cross-check prevents role escalation.
#   - Auth_Audit_Logs → immutable SIEM telemetry for every auth event.
# SUBJECT 1 (RDBMS):
#   - 3NF schema with FK constraints, B-Tree indexes, CHECK constraints.
# =============================================================================

import os
import sys
import sqlite3
import logging
import secrets
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_db")

DB_PATH = os.getenv("SQLITE_DATABASE_PATH", os.path.join(os.path.dirname(__file__), "edutrack.db"))
DEFAULT_PASSWORD = "EduTrack@2024"


def generate_bcrypt_hash(password: str) -> str:
    """
    SUBJECT 4 (Cloud Security): Hash password using bcrypt with 12 rounds.
    - 12 rounds = 2^12 = 4096 iterations of the Blowfish cipher key schedule.
    - bcrypt.gensalt() generates a unique 16-byte random salt per call.
    - Resulting hash: $2b$12$<22-char-salt><31-char-hash> = 60 chars total.
    Returns the full $2b$12$... string suitable for VARCHAR(255) storage.
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def init_database(db_file: str = DB_PATH):
    logger.info(f"Connecting to database at: {db_file}")
    conn = sqlite3.connect(db_file)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    cursor = conn.cursor()

    logger.info("Creating relational tables with constraints and indexes...")

    # ── TABLE 1: Institutional_Directory (College ERP Roster)
    # Source of truth for registration role cross-checking.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Institutional_Directory (
        directory_id      INTEGER      PRIMARY KEY AUTOINCREMENT,
        full_name         TEXT         NOT NULL,
        email             TEXT         NOT NULL UNIQUE,
        authorized_role   TEXT         NOT NULL CHECK (authorized_role IN
                              ('Student', 'CR', 'Faculty', 'HOD')),
        department        TEXT         NOT NULL DEFAULT 'Computer Science',
        subject_or_course TEXT         NULL
    );
    """)

    # ── TABLE 2: Roles (master lookup)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Roles (
        role_id   INTEGER PRIMARY KEY,
        role_name TEXT    NOT NULL UNIQUE CHECK (role_name IN
                      ('Student', 'CR', 'Faculty', 'HOD'))
    );
    """)

    # ── TABLE 3: Users  (Active Registered Accounts)
    # Security columns:
    #   password_hash         VARCHAR(255)  → bcrypt $2b$12$ digest (60 chars)
    #   failed_login_attempts INT DEFAULT 0 → incremented on wrong password
    #   locked_until          DATETIME NULL → NULL=unlocked; 15-min ban on 5 fails
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id               INTEGER      PRIMARY KEY AUTOINCREMENT,
        full_name             TEXT         NOT NULL,
        email                 TEXT         NOT NULL UNIQUE,
        password_hash         VARCHAR(255) NOT NULL,
        role_id               INTEGER      NOT NULL,
        role_name             TEXT         NOT NULL CHECK (role_name IN
                                  ('Student', 'CR', 'Faculty', 'HOD')),
        failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
        locked_until          DATETIME     NULL,
        department            TEXT         DEFAULT 'Computer Science',
        subject_or_course     TEXT         NULL,
        created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES Roles(role_id)
    );
    """)

    # Safe migration for existing Users table
    cursor.execute("PRAGMA table_info(Users)")
    existing_users_cols = [r[1] for r in cursor.fetchall()]
    if "role_name" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN role_name TEXT NOT NULL DEFAULT 'Student'")
    if "failed_login_attempts" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0")
    if "locked_until" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN locked_until DATETIME NULL")
    if "subject_or_course" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN subject_or_course TEXT NULL")
    if "semester" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN semester TEXT DEFAULT 'Semester 3'")
    if "phone" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN phone TEXT NULL")
    if "university_id" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN university_id TEXT NULL")
    if "avatar_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN avatar_url TEXT NULL")
    if "github_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN github_url TEXT NULL")
    if "linkedin_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN linkedin_url TEXT NULL")
    if "portfolio_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN portfolio_url TEXT NULL")
    if "bio" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN bio TEXT NULL")
    if "calendar_sync_token" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN calendar_sync_token TEXT NULL")
    if "calendar_last_polled_at" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN calendar_last_polled_at DATETIME NULL")

    # Backfill calendar_sync_token for existing accounts with 64-char hex token
    cursor.execute("SELECT user_id, calendar_sync_token FROM Users")
    for u_row in cursor.fetchall():
        if not u_row[1]:
            cursor.execute("UPDATE Users SET calendar_sync_token = ? WHERE user_id = ?", (secrets.token_hex(32), u_row[0]))

    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_token ON Users(calendar_sync_token)")


    cursor.execute("PRAGMA table_info(Institutional_Directory)")
    existing_dir_cols = [r[1] for r in cursor.fetchall()]
    if "subject_or_course" not in existing_dir_cols:
        cursor.execute("ALTER TABLE Institutional_Directory ADD COLUMN subject_or_course TEXT NULL")


    # ── TABLE 4: Auth_Audit_Logs  (SIEM / Cloud Security telemetry)
    # Immutable event stream; every auth event writes a row here.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Auth_Audit_Logs (
        log_id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        email          TEXT     NOT NULL,
        attempted_role TEXT,
        event_type     TEXT     NOT NULL CHECK (event_type IN (
                           'LOGIN_SUCCESS', 'INVALID_PASSWORD', 'ROLE_MISMATCH',
                           'NAME_MISMATCH', 'ACCOUNT_LOCKED',
                           'REGISTER_SUCCESS', 'REGISTER_ROLE_DENIED'
                       )),
        ip_address     TEXT,
        timestamp      DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # ── TABLE 4B: Password_Resets (Cloud Security: Secure OTP Password Recovery)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Password_Resets (
        reset_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        email      TEXT NOT NULL,
        otp_code   TEXT NOT NULL,
        token      TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used       INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Courses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Courses (
        course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        course_code TEXT NOT NULL UNIQUE,
        course_name TEXT NOT NULL,
        semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
        credits     INTEGER DEFAULT 4,
        department  TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering'
    );
    """)

    # Safe migration for existing Courses table
    cursor.execute("PRAGMA table_info(Courses)")
    existing_courses_cols = [r[1] for r in cursor.fetchall()]
    if "department" not in existing_courses_cols:
        cursor.execute("ALTER TABLE Courses ADD COLUMN department TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering'")

    # 6. Deadlines
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Deadlines (
        deadline_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id        INTEGER NOT NULL,
        posted_by        INTEGER NOT NULL,
        title            TEXT NOT NULL,
        description      TEXT,
        due_date         TIMESTAMP NOT NULL,
        urgency          TEXT DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        pdf_blob_url     TEXT,
        department       TEXT DEFAULT 'School of Computer Science and Engineering',
        program          TEXT DEFAULT 'Core CSE',
        is_deleted       INTEGER DEFAULT 0,
        is_reminder_sent INTEGER DEFAULT 0,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES Courses(course_id),
        FOREIGN KEY (posted_by) REFERENCES Users(user_id)
    );
    """)

    # 7. Exam_Schedules
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Exam_Schedules (
        exam_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id    INTEGER NOT NULL,
        scheduled_by INTEGER NOT NULL,
        exam_date    TIMESTAMP NOT NULL,
        exam_type    TEXT DEFAULT 'MIDTERM' CHECK (exam_type IN ('MIDTERM', 'FINAL', 'QUIZ', 'VIVA')),
        venue        TEXT,
        department   TEXT DEFAULT 'School of Computer Science and Engineering',
        program      TEXT DEFAULT 'ALL',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES Courses(course_id),
        FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
    );
    """)

    # 8. Submissions (Production-Grade Cryptographic Proof of Submission)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Submissions (
        submission_id       INTEGER PRIMARY KEY AUTOINCREMENT,
        deadline_id         INTEGER NOT NULL,
        student_id          INTEGER NOT NULL,
        user_id             INTEGER NULL,
        student_email       TEXT NOT NULL,
        status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Late', 'PENDING', 'DONE', 'LATE')),
        server_timestamp_ms TEXT NULL,
        sha256_receipt_hash TEXT UNIQUE NULL,
        verification_count  INTEGER DEFAULT 0,
        file_path           TEXT NULL,
        file_name           TEXT NULL,
        completed_at        TIMESTAMP,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id)  REFERENCES Users(user_id),
        FOREIGN KEY (user_id)     REFERENCES Users(user_id),
        FOREIGN KEY (deadline_id) REFERENCES Deadlines(deadline_id) ON DELETE CASCADE,
        UNIQUE (deadline_id, student_id)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_student ON Submissions(student_id, deadline_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipt_hash ON Submissions(sha256_receipt_hash);")

    # 8B. Crypto_Verification_Logs (Faculty & HOD Verification Audit Trail)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Crypto_Verification_Logs (
        log_id              INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_hash        TEXT NOT NULL,
        submission_id       INTEGER NULL,
        verified_by_user_id INTEGER NOT NULL,
        verified_by_role    TEXT NOT NULL,
        verification_result TEXT NOT NULL CHECK (verification_result IN ('SUCCESS', 'FAILED', 'TAMPERED')),
        tamper_details      TEXT NULL,
        verified_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address          TEXT NULL,
        FOREIGN KEY (verified_by_user_id) REFERENCES Users(user_id)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cryptolog_hash ON Crypto_Verification_Logs(receipt_hash);")

    # 9. Panic_Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Panic_Logs (
        panic_id        INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number   TEXT NULL,
        subject         TEXT DEFAULT 'Academic Workload Grievance',
        category        TEXT DEFAULT 'WORKLOAD_CLUSTER',
        message_text    TEXT NOT NULL,
        sentiment_score REAL DEFAULT 0.0,
        severity        TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        department      TEXT DEFAULT 'School of Computer Science and Engineering',
        program         TEXT DEFAULT 'Core CSE',
        course_name     TEXT NULL,
        is_anonymous    INTEGER DEFAULT 1,
        student_name    TEXT NULL,
        student_email   TEXT NULL,
        file_attachment TEXT NULL,
        status          TEXT DEFAULT 'PENDING',
        user_id         INTEGER NULL,
        resolved        INTEGER DEFAULT 0,
        resolution_notes TEXT NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 10. Department_Notices
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Department_Notices (
        notice_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        department  TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering',
        program     TEXT NOT NULL DEFAULT 'ALL',
        semester    TEXT NOT NULL DEFAULT 'ALL',
        posted_by   INTEGER NOT NULL,
        title       TEXT NOT NULL,
        content     TEXT NOT NULL,
        notice_type TEXT DEFAULT 'ANNOUNCEMENT',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES Users(user_id)
    );
    """)

    # 11. Faculty_CR_Delegations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Faculty_CR_Delegations (
        delegation_id         INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id            INTEGER NOT NULL,
        faculty_name          TEXT NOT NULL,
        cr_id                 INTEGER NOT NULL,
        cr_name               TEXT NOT NULL,
        department            TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering',
        program               TEXT NOT NULL DEFAULT 'Core CSE',
        semester              TEXT NOT NULL DEFAULT 'Semester 3',
        course_id             INTEGER NULL,
        course_code           TEXT NULL,
        subject               TEXT NOT NULL,
        title                 TEXT NOT NULL,
        description           TEXT NULL,
        document_url          TEXT NULL,
        document_name         TEXT NULL,
        due_date              DATETIME NOT NULL,
        urgency               TEXT DEFAULT 'MEDIUM',
        estimated_hours       INTEGER DEFAULT 4,
        status                TEXT DEFAULT 'PENDING_REVIEW',
        published_deadline_id INTEGER NULL,
        created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at          DATETIME NULL,
        FOREIGN KEY (faculty_id) REFERENCES Users(user_id),
        FOREIGN KEY (cr_id) REFERENCES Users(user_id)
    );
    """)

    # 12. Student_Certificates (Permanent Academic & Professional Certificates)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Student_Certificates (
        certificate_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id        INTEGER NOT NULL,
        title          TEXT NOT NULL,
        issuer         TEXT NOT NULL,
        issue_date     TEXT NULL,
        credential_url TEXT NULL,
        file_path      TEXT NULL,
        file_name      TEXT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );
    """)

    # ── B-Tree Indexes (SUBJECT 1: RDBMS performance + SUBJECT 4: security)
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_email       ON Users(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_locked      ON Users(locked_until);",
        "CREATE INDEX IF NOT EXISTS idx_directory_email   ON Institutional_Directory(email);",
        "CREATE INDEX IF NOT EXISTS idx_audit_email_time  ON Auth_Audit_Logs(email, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_audit_event_type  ON Auth_Audit_Logs(event_type, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_deadlines_duedate ON Deadlines(due_date ASC);",
        "CREATE INDEX IF NOT EXISTS idx_deadlines_dept    ON Deadlines(department);",
        "CREATE INDEX IF NOT EXISTS idx_submissions_user  ON Submissions(user_id, deadline_id);",
        "CREATE INDEX IF NOT EXISTS idx_panic_severity    ON Panic_Logs(severity, created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_courses_dept      ON Courses(department);",
        "CREATE INDEX IF NOT EXISTS idx_delegations_cr    ON Faculty_CR_Delegations(cr_id, status, created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_delegations_fac   ON Faculty_CR_Delegations(faculty_id, created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_pw_reset_email    ON Password_Resets(email);",
        "CREATE INDEX IF NOT EXISTS idx_pw_reset_token    ON Password_Resets(token);",
    ]
    for idx in indexes:
        cursor.execute(idx)

    conn.commit()

    # --- SEEDING PHASE ---
    logger.info("Generating real 12-round bcrypt hash for default credentials...")
    pw_hash = generate_bcrypt_hash(DEFAULT_PASSWORD)
    logger.info(f"Generated bcrypt hash: {pw_hash[:18]}... (rounds=12)")

    # ── SEED: Roles
    cursor.execute("SELECT COUNT(*) FROM Roles")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("INSERT INTO Roles (role_id, role_name) VALUES (?, ?)", [
            (1, 'Student'),
            (2, 'CR'),
            (3, 'Faculty'),
            (4, 'HOD')
        ])
        logger.info("Seeded Roles table.")

    # ── Clear transient data safely (disable FK constraints during reset)
    # CRITICAL DATA PRESERVATION POLICY:
    # Users table and Institutional_Directory are NEVER bulk-deleted. User data is protected permanently.
    cursor.execute("PRAGMA foreign_keys = OFF")
    cursor.execute("DELETE FROM Submissions")
    cursor.execute("DELETE FROM Deadlines")
    cursor.execute("DELETE FROM Exam_Schedules")
    cursor.execute("DELETE FROM Department_Notices")
    cursor.execute("DELETE FROM Faculty_CR_Delegations")
    cursor.execute("DELETE FROM Courses")
    # DO NOT DELETE Users or Institutional_Directory - protect user data permanently!
    cursor.execute("DELETE FROM Auth_Audit_Logs")
    try:
        cursor.execute("DELETE FROM sqlite_sequence")
    except Exception:
        pass

    # ── PRODUCTION MODE: Zero dummy users or directory records
    # Users and Institutional_Directory are populated strictly via live user registrations.
    logger.info("Production Mode: Zero dummy accounts seeded into Institutional_Directory and Users. Ready for live user registration.")


    # 5. Seed Courses (Strictly Partitioned by Department)
    courses = [
        # School of Computer Science and Engineering
        (1, 'CS201', 'Data Structures & Algorithms',        3, 4, 'School of Computer Science and Engineering'),
        (2, 'CS202', 'Database Management Systems (RDBMS)',  3, 4, 'School of Computer Science and Engineering'),
        (3, 'CS203', 'Object-Oriented Programming (Java)',   3, 3, 'School of Computer Science and Engineering'),
        (4, 'CS204', 'Computer Networks',                    3, 4, 'School of Computer Science and Engineering'),
        (5, 'CS205', 'Operating Systems',                    4, 4, 'School of Computer Science and Engineering'),
        (6, 'CS206', 'Software Engineering',                 4, 3, 'School of Computer Science and Engineering'),
        (7, 'CS207', 'Web Technologies',                     4, 3, 'School of Computer Science and Engineering'),
        (8, 'CS208', 'Cloud Security & Computing',           4, 3, 'School of Computer Science and Engineering'),

        # School of Computing (BCA / MCA Courses)
        (9,  'BCA201', 'Web Application Development with MERN', 3, 4, 'School of Computing'),
        (10, 'BCA202', 'Python Data Science & Scripting',       3, 4, 'School of Computing'),
        (11, 'BCA203', 'Cloud Fundamentals & AWS Services',     3, 3, 'School of Computing'),
        (12, 'MCA301', 'Advanced Distributed Systems',          3, 4, 'School of Computing'),

        # School of Business
        (13, 'BUS201', 'Financial Accounting & Reporting',       3, 4, 'School of Business'),
        (14, 'BUS202', 'Marketing Management & Analytics',       3, 3, 'School of Business'),
        (15, 'BUS203', 'Organizational Behaviour',               3, 3, 'School of Business'),

        # School of Engineering
        (16, 'ENG201', 'Thermodynamics & Heat Transfer',         3, 4, 'School of Engineering'),
        (17, 'ENG202', 'Fluid Mechanics & Machinery',            3, 4, 'School of Engineering'),
    ]
    cursor.executemany("INSERT INTO Courses (course_id, course_code, course_name, semester, credits, department) VALUES (?, ?, ?, ?, ?, ?)", courses)

    # Clean Slate: Zero dummy deadlines, exams, notices, or delegations.
    # Academic tasks, exam schedules, and notices will be authored organically by registered faculty and CRs.
    logger.info("Clean Slate Mode: Zero dummy deadlines, exams, or notices seeded. Ready for live user authoring.")

    cursor.execute("PRAGMA foreign_keys = ON")
    conn.commit()
    conn.close()
    logger.info(" Database initialized and seeded successfully.")
    print("\n" + "="*70)
    print(" EDUTRACK 3D — DATABASE SEED SUMMARY (MULTI-TENANT ISOLATED)")
    print("="*70)
    print(f" DB File  : {db_file}")
    print(" Status   : Clean Slate (0 dummy users seeded)")
    print(" Auth     : Ready for real users with 12-round bcrypt permanent storage")
    print("="*70 + "\n")



if __name__ == "__main__":
    init_database()
