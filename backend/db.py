# =============================================================================
# EduTrack 3D — Database Connection & Initialization Module (db.py)
# =============================================================================
# SUBJECT 3 (DP-900 Azure Data): Hybrid storage — Azure SQL for relational
#   data, SQLite fallback for local development.
# SUBJECT 4 (Cloud Security): Parameterized queries via SQLAlchemy ORM.
# SUBJECT 2 (System Design): Connection pooling for scalability.
# =============================================================================

import os
import sqlite3
import logging
import secrets
from datetime import datetime, timezone
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("edutrack.db")

DATABASE_MODE = os.getenv("DATABASE_MODE", "local")
_default_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "edutrack.db"))
SQLITE_PATH = os.getenv("SQLITE_DATABASE_PATH", _default_db)
if not os.path.isabs(SQLITE_PATH):
    SQLITE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), SQLITE_PATH))


def get_azure_connection():
    """
    SUBJECT 3 (DP-900): Connect to Azure SQL Database via pyodbc.
    Uses parameterized connection string from environment variables.
    """
    import importlib
    try:
        pyodbc = importlib.import_module("pyodbc")
    except ImportError:
        raise ImportError(
            "pyodbc is not installed. To connect to Azure SQL Database, "
            "install it via: pip install pyodbc"
        )
    conn_str = os.getenv("AZURE_SQL_CONNECTION_STRING")
    if not conn_str:
        raise ValueError("AZURE_SQL_CONNECTION_STRING not configured in .env")
    return pyodbc.connect(conn_str)


def get_sqlite_connection():
    """
    Local development fallback using SQLite.
    Returns a connection with Row factory for dict-like access.
    """
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")       # Write-Ahead Logging for concurrency
    conn.execute("PRAGMA foreign_keys=ON")          # Enforce FK constraints
    return conn


@contextmanager
def get_db():
    """
    Context manager for database connections.
    SUBJECT 2 (System Design): Ensures proper connection lifecycle management.
    Automatically commits on success, rolls back on error.
    """
    conn = None
    try:
        if DATABASE_MODE == "azure":
            conn = get_azure_connection()
        else:
            conn = get_sqlite_connection()
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        if conn:
            conn.close()


def init_local_db():
    """
    Initialize SQLite database with schema for local development.
    SUBJECT 1 (RDBMS): Creates all tables in 3NF with constraints.
    """
    conn = sqlite3.connect(SQLITE_PATH)
    conn.execute("PRAGMA foreign_keys=ON")
    cursor = conn.cursor()

    # --- TABLE 0: Institutional_Directory (ERP Roster — Registration whitelist) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Institutional_Directory (
            directory_id    INTEGER      PRIMARY KEY AUTOINCREMENT,
            full_name       TEXT         NOT NULL,
            email           TEXT         NOT NULL UNIQUE,
            authorized_role TEXT         NOT NULL CHECK (authorized_role IN
                                ('Student', 'CR', 'Faculty', 'HOD')),
            department      TEXT         NOT NULL DEFAULT 'Computer Science',
            program         TEXT         NOT NULL DEFAULT 'Core CSE',
            subject_or_course TEXT       NULL
        )
    """)

    # --- TABLE 1: Roles ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Roles (
            role_id   INTEGER PRIMARY KEY,
            role_name TEXT    NOT NULL UNIQUE
        )
    """)

    # --- TABLE 2: Users (with brute-force lockout columns) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            user_id               INTEGER      PRIMARY KEY AUTOINCREMENT,
            full_name             TEXT         NOT NULL,
            email                 TEXT         NOT NULL UNIQUE,
            password_hash         VARCHAR(255) NOT NULL,
            role_id               INTEGER      NOT NULL,
            role_name             TEXT         NOT NULL DEFAULT 'Student',
            failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
            locked_until          DATETIME     NULL,
            department            TEXT         DEFAULT 'Computer Science',
            program               TEXT         DEFAULT 'Core CSE',
            subject_or_course     TEXT         NULL,
            semester              TEXT         DEFAULT 'Semester 3',
            created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
            calendar_sync_token   TEXT         NULL,
            calendar_last_polled_at DATETIME   NULL,
            FOREIGN KEY (role_id) REFERENCES Roles(role_id)
        )
    """)

    # Safe migration for existing Users table
    cursor.execute("PRAGMA table_info(Users)")
    existing_users_cols = [r[1] for r in cursor.fetchall()]
    if "program" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN program TEXT DEFAULT 'Core CSE'")
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
    if "university_name" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN university_name TEXT NULL")
    if "university_logo" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN university_logo TEXT NULL")
    if "section" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN section TEXT NULL")
    if "personal_email" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN personal_email TEXT NULL")
    if "blood_group" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN blood_group TEXT NULL")
    if "dob" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN dob TEXT NULL")
    if "emergency_contact" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN emergency_contact TEXT NULL")
    if "address" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN address TEXT NULL")
    if "leetcode_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN leetcode_url TEXT NULL")
    if "twitter_url" not in existing_users_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN twitter_url TEXT NULL")
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
    if "program" not in existing_dir_cols:
        cursor.execute("ALTER TABLE Institutional_Directory ADD COLUMN program TEXT DEFAULT 'Core CSE'")
    if "subject_or_course" not in existing_dir_cols:
        cursor.execute("ALTER TABLE Institutional_Directory ADD COLUMN subject_or_course TEXT NULL")



    # --- TABLE 3: Auth_Audit_Logs (SIEM telemetry) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Auth_Audit_Logs (
            log_id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            email          TEXT     NOT NULL,
            attempted_role TEXT,
            event_type     TEXT     NOT NULL,
            ip_address     TEXT,
            timestamp      DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- TABLE: Password_Resets (Cloud Security: Secure OTP & Token-based password recovery) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Password_Resets (
            reset_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT NOT NULL,
            otp_code   TEXT NOT NULL,
            token      TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used       INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pw_reset_email ON Password_Resets(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pw_reset_token ON Password_Resets(token)")

    # --- TABLE 4: Courses ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Courses (
            course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            course_code TEXT NOT NULL UNIQUE,
            course_name TEXT NOT NULL,
            semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
            credits     INTEGER DEFAULT 4,
            department  TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering'
        )
    """)

    # --- TABLE 4: Deadlines ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Deadlines (
            deadline_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id      INTEGER NOT NULL,
            posted_by      INTEGER NOT NULL,
            title          TEXT NOT NULL,
            description    TEXT,
            due_date       TIMESTAMP NOT NULL,
            urgency        TEXT DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW','MEDIUM','HIGH','CRITICAL')),
            pdf_blob_url   TEXT,
            is_reminder_sent INTEGER DEFAULT 0,
            department     TEXT DEFAULT 'Computer Science',
            program        TEXT DEFAULT 'Core CSE',
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES Courses(course_id),
            FOREIGN KEY (posted_by) REFERENCES Users(user_id)
        )
    """)

    # --- TABLE 5: Exam_Schedules ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Exam_Schedules (
            exam_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id    INTEGER NOT NULL,
            scheduled_by INTEGER NOT NULL,
            exam_date    TIMESTAMP NOT NULL,
            exam_type    TEXT DEFAULT 'MIDTERM' CHECK (exam_type IN ('MIDTERM','FINAL','QUIZ','VIVA')),
            venue        TEXT,
            department   TEXT DEFAULT 'Computer Science',
            program      TEXT DEFAULT 'ALL',
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES Courses(course_id),
            FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
        )
    """)

    # --- TABLE 6: Submissions (Production-Grade Cryptographic Proof of Submission) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Submissions (
            submission_id       INTEGER PRIMARY KEY AUTOINCREMENT,
            deadline_id         INTEGER NOT NULL,
            student_id          INTEGER NOT NULL,
            user_id             INTEGER NULL,
            student_email       TEXT NOT NULL,
            status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Late','PENDING','DONE','LATE')),
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
        )
    """)

    # --- TABLE 6B: Crypto_Verification_Logs (Faculty/HOD Verification Audit Trail) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Crypto_Verification_Logs (
            log_id              INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_hash        TEXT NOT NULL,
            submission_id       INTEGER NULL,
            verified_by_user_id INTEGER NOT NULL,
            verified_by_role    TEXT NOT NULL,
            verification_result TEXT NOT NULL CHECK (verification_result IN ('SUCCESS','FAILED','TAMPERED')),
            tamper_details      TEXT NULL,
            verified_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address          TEXT NULL,
            FOREIGN KEY (verified_by_user_id) REFERENCES Users(user_id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cryptolog_hash ON Crypto_Verification_Logs(receipt_hash)")

    # --- TABLE 7: Panic_Logs ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Panic_Logs (
            panic_id         INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number    TEXT NULL,
            subject          TEXT DEFAULT 'Academic Workload Grievance',
            category         TEXT DEFAULT 'WORKLOAD_CLUSTER',
            message_text     TEXT NOT NULL,
            sentiment_score  REAL DEFAULT 0.0,
            severity         TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
            department       TEXT DEFAULT 'Computer Science',
            program          TEXT DEFAULT 'Core CSE',
            course_name      TEXT NULL,
            is_anonymous     INTEGER DEFAULT 1,
            student_name     TEXT NULL,
            student_email    TEXT NULL,
            file_attachment  TEXT NULL,
            status           TEXT DEFAULT 'PENDING',
            user_id          INTEGER NULL,
            resolved         INTEGER DEFAULT 0,
            resolution_notes TEXT NULL,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- TABLE 8: Department_Notices (HOD Official Bulletins & Master Schedule) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Department_Notices (
            notice_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            department   TEXT NOT NULL,
            program      TEXT NOT NULL DEFAULT 'ALL',
            semester     TEXT NOT NULL DEFAULT 'ALL',
            posted_by    INTEGER NOT NULL,
            title        TEXT NOT NULL,
            content      TEXT NOT NULL,
            notice_type  TEXT DEFAULT 'NOTICE' CHECK (notice_type IN ('NOTICE', 'EXAM_MASTER', 'URGENT', 'EVENT')),
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (posted_by) REFERENCES Users(user_id)
        )
    """)

    # --- TABLE 9: Faculty_CR_Delegations (Faculty Coursework Assigned to CR) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Faculty_CR_Delegations (
            delegation_id           INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id              INTEGER NOT NULL,
            faculty_name            TEXT NOT NULL,
            cr_id                   INTEGER NOT NULL,
            cr_name                 TEXT NOT NULL,
            department              TEXT NOT NULL,
            program                 TEXT NOT NULL,
            semester                TEXT NOT NULL,
            course_id               INTEGER NULL,
            course_code             TEXT NULL,
            subject                 TEXT NOT NULL,
            title                   TEXT NOT NULL,
            description             TEXT,
            document_url            TEXT,
            document_name           TEXT,
            due_date                TIMESTAMP NOT NULL,
            urgency                 TEXT DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW','MEDIUM','HIGH','CRITICAL')),
            estimated_hours         REAL DEFAULT 4.0,
            status                  TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED')),
            published_deadline_id   INTEGER NULL,
            created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            published_at            TIMESTAMP NULL,
            FOREIGN KEY (faculty_id) REFERENCES Users(user_id),
            FOREIGN KEY (cr_id) REFERENCES Users(user_id),
            FOREIGN KEY (published_deadline_id) REFERENCES Deadlines(deadline_id)
        )
    """)

    # --- TABLE 10: Faculty_Syllabus (Multi-Department & Program Syllabus Architecture) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Faculty_Syllabus (
            syllabus_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id    INTEGER NOT NULL,
            faculty_name  TEXT NOT NULL,
            department    TEXT NOT NULL,
            program       TEXT NOT NULL,
            semester      TEXT DEFAULT 'Semester 3',
            course_name   TEXT NOT NULL,
            course_code   TEXT DEFAULT '',
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (faculty_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
    """)

    # --- TABLE 11: Syllabus_Units (Faculty Unit-Wise Modules & Ticked Milestones) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Syllabus_Units (
            unit_id       INTEGER PRIMARY KEY AUTOINCREMENT,
            syllabus_id   INTEGER NOT NULL,
            unit_number   INTEGER NOT NULL,
            unit_label    TEXT DEFAULT 'Unit',
            unit_title    TEXT NOT NULL,
            description   TEXT DEFAULT '',
            completed     INTEGER DEFAULT 0,
            completed_at  TIMESTAMP NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (syllabus_id) REFERENCES Faculty_Syllabus(syllabus_id) ON DELETE CASCADE
        )
    """)

    # --- TABLE 12: Deadline_Reminders (Automated 24-Hour Student Alerts) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Deadline_Reminders (
            reminder_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            deadline_id     INTEGER NOT NULL,
            user_id         INTEGER NOT NULL,
            title           TEXT NOT NULL,
            course_name     TEXT,
            department      TEXT,
            program         TEXT,
            due_date        TIMESTAMP NOT NULL,
            hours_remaining REAL,
            status          TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'EXPIRED')),
            is_read         INTEGER DEFAULT 0,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (deadline_id) REFERENCES Deadlines(deadline_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
            UNIQUE (deadline_id, user_id)
        )
    """)

    # --- TABLE 13: Student_Certificates (Permanent Academic & Professional Certificates) ---
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
        )
    """)

    # Purge any orphaned syllabus records not belonging to active registered faculty in Users table
    cursor.execute("""
        DELETE FROM Syllabus_Units 
        WHERE syllabus_id IN (
            SELECT syllabus_id FROM Faculty_Syllabus 
            WHERE faculty_id NOT IN (SELECT user_id FROM Users WHERE role_id = 3)
        )
    """)
    cursor.execute("""
        DELETE FROM Faculty_Syllabus 
        WHERE faculty_id NOT IN (SELECT user_id FROM Users WHERE role_id = 3)
    """)

    # Seed initial syllabus for existing registered faculty if table is empty
    cursor.execute("SELECT COUNT(*) FROM Faculty_Syllabus")
    if cursor.fetchone()[0] == 0:
        cursor.execute("SELECT user_id, full_name, department, program, subject_or_course FROM Users WHERE role_id = 3")
        faculty_users = cursor.fetchall()
        for f in faculty_users:
            f_id, f_name, f_dept, f_prog, f_subj = f
            f_dept = f_dept or 'Computer Science & Engineering'
            f_prog = f_prog or 'B.Tech Computer Science & Engineering'
            f_subj = f_subj or 'Database Management Systems (RDBMS & SQL)'
            cursor.execute("""
                INSERT INTO Faculty_Syllabus (faculty_id, faculty_name, department, program, semester, course_name, course_code)
                VALUES (?, ?, ?, ?, 'Semester 3', ?, 'CS202')
            """, (f_id, f_name, f_dept, f_prog, f_subj))
            new_s_id = cursor.lastrowid
            
            default_units = [
                (1, 'Unit 1', 'Relational Model, ER Diagrams & Schema Design', 'Entity-Relationship modeling, relational algebra, and relational schema optimization.', 0),
                (2, 'Unit 2', 'Advanced SQL, Subqueries, Joins & Triggers', 'Complex subqueries, window functions, stored procedures, triggers, and DDL/DML.', 0),
                (3, 'Unit 3', 'Normalization (1NF, 2NF, 3NF, BCNF) & Dependencies', 'Functional dependencies, lossless join decomposition, multi-valued dependencies.', 0),
                (4, 'Unit 4', 'Transaction Processing, ACID Properties & Concurrency', 'Serializability, two-phase locking (2PL), deadlock prevention, and recovery techniques.', 0),
                (5, 'Unit 5', 'NoSQL Databases & Distributed Query Processing', 'CAP theorem, document stores, key-value engines, sharding, and replication.', 0)
            ]
            for u_num, u_label, u_title, u_desc, u_comp in default_units:
                cursor.execute("""
                    INSERT INTO Syllabus_Units (syllabus_id, unit_number, unit_label, unit_title, description, completed, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (new_s_id, u_num, u_label, u_title, u_desc, u_comp, datetime.now(timezone.utc).isoformat() if u_comp else None))


    # Safe migrations for columns
    cursor.execute("PRAGMA table_info(Users)")
    u_cols = [r[1] for r in cursor.fetchall()]
    if "program" not in u_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN program TEXT DEFAULT 'Core CSE'")
    if "semester" not in u_cols:
        cursor.execute("ALTER TABLE Users ADD COLUMN semester TEXT DEFAULT 'Semester 3'")

    cursor.execute("PRAGMA table_info(Department_Notices)")
    n_cols = [r[1] for r in cursor.fetchall()]
    if "semester" not in n_cols:
        cursor.execute("ALTER TABLE Department_Notices ADD COLUMN semester TEXT NOT NULL DEFAULT 'ALL'")

    cursor.execute("PRAGMA table_info(Courses)")
    c_cols = [r[1] for r in cursor.fetchall()]
    if "department" not in c_cols:
        cursor.execute("ALTER TABLE Courses ADD COLUMN department TEXT NOT NULL DEFAULT 'School of Computer Science and Engineering'")

    cursor.execute("PRAGMA table_info(Deadlines)")
    d_cols = [r[1] for r in cursor.fetchall()]
    if "department" not in d_cols:
        cursor.execute("ALTER TABLE Deadlines ADD COLUMN department TEXT DEFAULT 'Computer Science'")
    if "program" not in d_cols:
        cursor.execute("ALTER TABLE Deadlines ADD COLUMN program TEXT DEFAULT 'Core CSE'")
    if "is_deleted" not in d_cols:
        cursor.execute("ALTER TABLE Deadlines ADD COLUMN is_deleted INTEGER DEFAULT 0")

    cursor.execute("PRAGMA table_info(Exam_Schedules)")
    e_cols = [r[1] for r in cursor.fetchall()]
    if "department" not in e_cols:
        cursor.execute("ALTER TABLE Exam_Schedules ADD COLUMN department TEXT DEFAULT 'Computer Science'")
    if "program" not in e_cols:
        cursor.execute("ALTER TABLE Exam_Schedules ADD COLUMN program TEXT DEFAULT 'ALL'")

    cursor.execute("PRAGMA table_info(Panic_Logs)")
    p_cols = [r[1] for r in cursor.fetchall()]
    if "program" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN program TEXT DEFAULT 'Core CSE'")
    if "resolved" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN resolved INTEGER DEFAULT 0")
    if "resolution_notes" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN resolution_notes TEXT NULL")
    if "ticket_number" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN ticket_number TEXT NULL")
    if "subject" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN subject TEXT DEFAULT 'Academic Workload Grievance'")
    if "category" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN category TEXT DEFAULT 'WORKLOAD_CLUSTER'")
    if "course_name" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN course_name TEXT NULL")
    if "is_anonymous" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN is_anonymous INTEGER DEFAULT 1")
    if "student_name" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN student_name TEXT NULL")
    if "student_email" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN student_email TEXT NULL")
    if "file_attachment" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN file_attachment TEXT NULL")
    if "status" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN status TEXT DEFAULT 'PENDING'")
    if "user_id" not in p_cols:
        cursor.execute("ALTER TABLE Panic_Logs ADD COLUMN user_id INTEGER NULL")

    cursor.execute("PRAGMA table_info(Institutional_Directory)")
    id_cols = [r[1] for r in cursor.fetchall()]
    if "program" not in id_cols:
        cursor.execute("ALTER TABLE Institutional_Directory ADD COLUMN program TEXT DEFAULT 'Core CSE'")

    # --- SAFE MIGRATIONS: Submissions (Production-Grade Cryptographic Proof Schema) ---
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='Submissions'")
    t_row = cursor.fetchone()
    if t_row and ("Completed" not in t_row[0] or "sha256_receipt_hash" not in t_row[0]):
        try:
            cursor.execute("PRAGMA foreign_keys = OFF")
            cursor.execute("ALTER TABLE Submissions RENAME TO Submissions_old")
            cursor.execute("""
                CREATE TABLE Submissions (
                    submission_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    deadline_id         INTEGER NOT NULL,
                    student_id          INTEGER NOT NULL,
                    user_id             INTEGER NULL,
                    student_email       TEXT NOT NULL,
                    status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Late','PENDING','DONE','LATE')),
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
                )
            """)
            cursor.execute("PRAGMA table_info(Submissions_old)")
            old_c = [r[1] for r in cursor.fetchall()]
            s_id_expr = "student_id" if "student_id" in old_c else "user_id"
            s_email_expr = "student_email" if "student_email" in old_c else "(SELECT email FROM Users WHERE Users.user_id = Submissions_old.user_id)"
            st_ms_expr = "server_timestamp_ms" if "server_timestamp_ms" in old_c else "NULL"
            h_expr = "sha256_receipt_hash" if "sha256_receipt_hash" in old_c else "NULL"
            vc_expr = "verification_count" if "verification_count" in old_c else "0"
            fp_expr = "file_path" if "file_path" in old_c else "NULL"
            fn_expr = "file_name" if "file_name" in old_c else "NULL"

            cursor.execute(f"""
                INSERT OR IGNORE INTO Submissions (
                    submission_id, deadline_id, student_id, user_id, student_email,
                    status, server_timestamp_ms, sha256_receipt_hash, verification_count,
                    file_path, file_name, completed_at, created_at
                )
                SELECT
                    submission_id, deadline_id, {s_id_expr}, user_id, COALESCE({s_email_expr}, 'student@edutrack.ac'),
                    CASE WHEN status = 'DONE' THEN 'Completed' WHEN status = 'PENDING' THEN 'Pending' ELSE status END,
                    {st_ms_expr}, {h_expr}, {vc_expr}, {fp_expr}, {fn_expr}, completed_at, created_at
                FROM Submissions_old
            """)
            cursor.execute("DROP TABLE Submissions_old")
            cursor.execute("PRAGMA foreign_keys = ON")
        except Exception as mig_err:
            logger.warning(f"Submissions table migration warning: {mig_err}")
            cursor.execute("PRAGMA foreign_keys = ON")

    # Compute genuine SHA-256 hashes for legacy completed rows
    import hashlib
    SALT = os.getenv("SERVER_CRYPTO_SALT", "CHRONOSYNC_SHA256_MASTER_VAULT_2026")
    cursor.execute("""
        SELECT submission_id, student_id, user_id, student_email, deadline_id, status, server_timestamp_ms, completed_at
        FROM Submissions
        WHERE (sha256_receipt_hash IS NULL OR sha256_receipt_hash = '')
          AND status IN ('DONE', 'Completed', 'Late')
    """)
    legacy_rows = cursor.fetchall()
    for l_sub in legacy_rows:
        l_sid, l_stuid, l_uid, l_email, l_dlid, l_status, l_ts, l_comp = l_sub
        act_uid = l_stuid or l_uid
        act_ts = l_ts or (str(l_comp) if l_comp else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.000"))
        norm_status = "Completed" if l_status in ("DONE", "Completed") else ("Late" if l_status == "Late" else "Pending")
        if not l_email:
            cursor.execute("SELECT email FROM Users WHERE user_id = ?", (act_uid,))
            e_row = cursor.fetchone()
            l_email = e_row[0] if e_row else f"student_{act_uid}@edutrack.ac"
        raw_p = f"{act_uid}|{l_email}|{l_dlid}|{act_ts}|{norm_status}|{SALT}"
        h = hashlib.sha256(raw_p.encode('utf-8')).hexdigest()
        cursor.execute("""
            UPDATE Submissions
            SET student_id = ?, student_email = ?, status = ?, server_timestamp_ms = ?, sha256_receipt_hash = ?
            WHERE submission_id = ?
        """, (act_uid, l_email, norm_status, act_ts, h, l_sid))

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_student ON Submissions(student_id, deadline_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_receipt_hash ON Submissions(sha256_receipt_hash)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cryptolog_hash ON Crypto_Verification_Logs(receipt_hash)")

    # --- SQL VIEW: vw_ScopedFeed (SUBJECT 1: RDBMS View abstraction) ---
    cursor.execute("DROP VIEW IF EXISTS vw_ScopedFeed")
    cursor.execute("""
        CREATE VIEW vw_ScopedFeed AS
        SELECT
            d.deadline_id,
            d.title,
            d.description,
            d.due_date,
            d.urgency,
            d.pdf_blob_url,
            d.department,
            d.program,
            d.created_at,
            d.is_reminder_sent,
            d.is_deleted,
            c.course_id,
            c.course_code,
            c.course_name,
            u.user_id AS posted_by_id,
            u.full_name AS posted_by_name,
            u.role_name AS posted_by_role
        FROM Deadlines d
        INNER JOIN Courses c ON d.course_id = c.course_id
        INNER JOIN Users u ON d.posted_by = u.user_id
        WHERE COALESCE(d.is_deleted, 0) = 0
    """)

    # --- SQL TRIGGER: trg_PreventExamConflict (SUBJECT 1: RDBMS Conflict Prevention Trigger) ---
    cursor.execute("DROP TRIGGER IF EXISTS trg_PreventExamConflict")
    cursor.execute("""
        CREATE TRIGGER trg_PreventExamConflict
        BEFORE INSERT ON Deadlines
        FOR EACH ROW
        WHEN EXISTS (
            SELECT 1 FROM Exam_Schedules e
            WHERE e.course_id = NEW.course_id
              AND (e.department = NEW.department OR e.department IS NULL OR NEW.department IS NULL)
              AND (e.program = 'ALL' OR NEW.program = 'ALL' OR e.program = NEW.program)
              AND ABS(strftime('%s', NEW.due_date) - strftime('%s', e.exam_date)) < 86400
        )
        BEGIN
            SELECT RAISE(ABORT, 'CONFLICT: Deadline clashes with an exam within 24 hours for the same course and department/program.');
        END;
    """)

    # --- B-Tree Indexes (Subject 1: RDBMS + Subject 4: Cloud Security) ---
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email       ON Users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_locked      ON Users(locked_until)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_dept_prog   ON Users(department, program)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_directory_email   ON Institutional_Directory(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_email_time  ON Auth_Audit_Logs(email, timestamp DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deadlines_duedate ON Deadlines(due_date ASC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deadlines_scoped  ON Deadlines(department, program, due_date ASC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deadlines_reminder ON Deadlines(is_reminder_sent, due_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_user  ON Submissions(user_id, deadline_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_panic_severity    ON Panic_Logs(severity, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_panic_dept_prog   ON Panic_Logs(department, program, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notices_dept      ON Department_Notices(department, program, semester, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_delegations_cr    ON Faculty_CR_Delegations(cr_id, status, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_delegations_fac   ON Faculty_CR_Delegations(faculty_id, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_syllabus_fac      ON Faculty_Syllabus(faculty_id, department, program)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_syllabus_units    ON Syllabus_Units(syllabus_id, unit_number ASC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_user    ON Deadline_Reminders(user_id, status, is_read, due_date ASC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_dl      ON Deadline_Reminders(deadline_id)")

    conn.commit()
    conn.close()
    logger.info("Local SQLite database initialized with 3NF schema, triggers, and views.")


init_db = init_local_db
