-- =============================================================================
-- EduTrack 3D — Complete Schema & Seed Script (schema_and_seed.sql)
-- =============================================================================
-- Compatible with: SQLite (local dev) | Azure SQL (production)
-- SUBJECT 1 (RDBMS): 3NF normalised schema, B-Tree indexes, SQL View.
-- SUBJECT 4 (Cloud Security): Institutional whitelist, audit logs, lockout.
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: Institutional_Directory (Official College ERP Records)
-- Stores verified institutional details used during user registration.
-- Validates user identity and prevents unauthorized role claims such as HOD, CR, or Faculty.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Institutional_Directory (
    directory_id    INTEGER      PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT         NOT NULL,
    email           TEXT         NOT NULL UNIQUE,
    authorized_role TEXT         NOT NULL CHECK (authorized_role IN ('Student', 'CR', 'Faculty', 'HOD')),
    department      TEXT         NOT NULL DEFAULT 'Computer Science'
);
CREATE INDEX IF NOT EXISTS idx_directory_email ON Institutional_Directory(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: Roles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Roles (
    role_id   INTEGER PRIMARY KEY,
    role_name TEXT    NOT NULL UNIQUE CHECK (role_name IN ('Student', 'CR', 'Faculty', 'HOD'))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: Users  (Active Registered Accounts)
-- Security columns:
--   password_hash         VARCHAR(255) → bcrypt $ digest (60 chars)
--   failed_login_attempts INT DEFAULT 0 → incremented on wrong password
--   locked_until          DATETIME NULL → NULL = unlocked; set for 15-min ban
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Users (
    user_id               INTEGER      PRIMARY KEY AUTOINCREMENT,
    full_name             TEXT         NOT NULL,
    email                 TEXT         NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    role_id               INTEGER      NOT NULL,
    role_name             TEXT         NOT NULL CHECK (role_name IN ('Student', 'CR', 'Faculty', 'HOD')),
    failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
    locked_until          DATETIME     NULL,
    department            TEXT         DEFAULT 'Computer Science',
    program               TEXT         DEFAULT 'Core CSE',
    semester              TEXT         DEFAULT 'Semester 3',
    subject_or_course     TEXT         NULL,
    phone                 TEXT         NULL,
    university_id         TEXT         NULL,
    avatar_url            TEXT         NULL,
    github_url            TEXT         NULL,
    linkedin_url          TEXT         NULL,
    portfolio_url         TEXT         NULL,
    bio                   TEXT         NULL,
    calendar_sync_token     TEXT         NOT NULL UNIQUE,
    calendar_last_polled_at DATETIME     NULL,
    created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON Users(role_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_token ON Users(calendar_sync_token);

CREATE INDEX IF NOT EXISTS idx_users_locked ON Users(locked_until);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3B: Student_Certificates (Permanent Academic & Professional Credentials)
-- ─────────────────────────────────────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS idx_cert_user ON Student_Certificates(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4: Auth_Audit_Logs  (Cloud Security / SIEM Telemetry)
-- Immutable append-only event stream for every authentication event.
-- ─────────────────────────────────────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS idx_audit_email_time ON Auth_Audit_Logs(email, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON Auth_Audit_Logs(event_type, timestamp DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5: Courses
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Courses (
    course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT    NOT NULL UNIQUE,
    course_name TEXT    NOT NULL,
    semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits     INTEGER DEFAULT 4
);

-- TABLE 6: Deadlines | TABLE 7: Exam_Schedules | TABLE 8: Submissions | TABLE 9: Panic_Logs
CREATE TABLE IF NOT EXISTS Deadlines (
    deadline_id      INTEGER  PRIMARY KEY AUTOINCREMENT,
    course_id        INTEGER  NOT NULL,
    posted_by        INTEGER  NOT NULL,
    title            TEXT     NOT NULL,
    description      TEXT,
    due_date         DATETIME NOT NULL,
    urgency          TEXT     DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    pdf_blob_url     TEXT,
    is_reminder_sent INTEGER  DEFAULT 0,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    FOREIGN KEY (posted_by) REFERENCES Users(user_id)
);
CREATE INDEX IF NOT EXISTS idx_deadlines_duedate ON Deadlines(due_date ASC);

CREATE TABLE IF NOT EXISTS Exam_Schedules (
    exam_id      INTEGER  PRIMARY KEY AUTOINCREMENT,
    course_id    INTEGER  NOT NULL,
    scheduled_by INTEGER  NOT NULL,
    exam_date    DATETIME NOT NULL,
    exam_type    TEXT     DEFAULT 'MIDTERM' CHECK (exam_type IN ('MIDTERM','FINAL','QUIZ','VIVA')),
    venue        TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)    REFERENCES Courses(course_id),
    FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Submissions (
    submission_id       INTEGER  PRIMARY KEY AUTOINCREMENT,
    deadline_id         INTEGER  NOT NULL,
    student_id          INTEGER  NOT NULL,
    user_id             INTEGER  NULL,
    student_email       TEXT     NOT NULL,
    status              TEXT     DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Late','PENDING','DONE','LATE')),
    server_timestamp_ms TEXT     NULL,
    sha256_receipt_hash TEXT     UNIQUE NULL,
    verification_count  INTEGER  DEFAULT 0,
    file_path           TEXT     NULL,
    file_name           TEXT     NULL,
    completed_at        DATETIME,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id)  REFERENCES Users(user_id),
    FOREIGN KEY (user_id)     REFERENCES Users(user_id),
    FOREIGN KEY (deadline_id) REFERENCES Deadlines(deadline_id) ON DELETE CASCADE,
    UNIQUE (deadline_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON Submissions(student_id, deadline_id);
CREATE INDEX IF NOT EXISTS idx_receipt_hash ON Submissions(sha256_receipt_hash);

CREATE TABLE IF NOT EXISTS Crypto_Verification_Logs (
    log_id              INTEGER  PRIMARY KEY AUTOINCREMENT,
    receipt_hash        TEXT     NOT NULL,
    submission_id       INTEGER  NULL,
    verified_by_user_id INTEGER  NOT NULL,
    verified_by_role    TEXT     NOT NULL,
    verification_result TEXT     NOT NULL CHECK (verification_result IN ('SUCCESS','FAILED','TAMPERED')),
    tamper_details      TEXT     NULL,
    verified_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address          TEXT     NULL,
    FOREIGN KEY (verified_by_user_id) REFERENCES Users(user_id)
);
CREATE INDEX IF NOT EXISTS idx_cryptolog_hash ON Crypto_Verification_Logs(receipt_hash);

CREATE TABLE IF NOT EXISTS Panic_Logs (
    panic_id        INTEGER  PRIMARY KEY AUTOINCREMENT,
    message_text    TEXT     NOT NULL,
    sentiment_score REAL     DEFAULT 0.0,
    severity        TEXT     DEFAULT 'MEDIUM' CHECK (severity IN ('CRITICAL','MEDIUM','LOW')),
    department      TEXT     DEFAULT 'Computer Science',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SQL VIEW: vw_StudentDashboard
-- ─────────────────────────────────────────────────────────────────────────────
CREATE VIEW IF NOT EXISTS vw_StudentDashboard AS
    SELECT d.deadline_id, d.title, d.description, d.due_date, d.urgency,
           d.pdf_blob_url, d.is_reminder_sent, d.created_at,
           c.course_id, c.course_code, c.course_name,
           u.full_name AS posted_by_name, u.role_name AS posted_by_role
    FROM  Deadlines d
    JOIN  Courses   c ON d.course_id = c.course_id
    JOIN  Users     u ON d.posted_by  = u.user_id
    ORDER BY d.due_date ASC;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT OR IGNORE INTO Roles (role_id, role_name) VALUES
    (1, 'Student'), (2, 'CR'), (3, 'Faculty'), (4, 'HOD');

INSERT OR IGNORE INTO Institutional_Directory (full_name, email, authorized_role, department) VALUES
    ('Dr. Sanjay Desai',  'sanjay.hod@edutrack.ac',     'HOD',     'Computer Science'),
    ('Dr. Meena Iyer',    'meena.faculty@edutrack.ac',  'Faculty', 'Computer Science'),
    ('Prof. Ravi Kumar',  'ravi.faculty@edutrack.ac',   'Faculty', 'Computer Science'),
    ('Dr. Kavita Rao',    'kavita.faculty@edutrack.ac', 'Faculty', 'Artificial Intelligence'),
    ('Neha Gupta',        'neha.cr@edutrack.ac',        'CR',      'Computer Science'),
    ('Arjun Patel',       'arjun.cr@edutrack.ac',       'CR',      'Computer Science'),
    ('Ankit Singh',       'ankit.student@edutrack.ac',  'Student', 'Computer Science'),
    ('Priya Sharma',      'priya.student@edutrack.ac',  'Student', 'Computer Science'),
    ('Rahul Verma',       'rahul.student@edutrack.ac',  'Student', 'Computer Science'),
    ('Rohan Mehta',       'rohan.student@edutrack.ac',  'Student', 'Information Technology');

-- NOTE:
-- PASSWORD HASHING NOTE:
-- Secure password hashes are created automatically by the init_db.py initialization script.
-- The sample user records provided below are intended only to demonstrate the database structure.
-- These placeholder entries should not be treated as valid login credentials.
-- Execute init_db.py to initialize the database and populate user records with properly
-- generated bcrypt password hashes before testing the authentication functionality.
-- This process helps maintain consistent password storage and supports secure user authentication.



INSERT OR IGNORE INTO Auth_Audit_Logs (email, attempted_role, event_type, ip_address) VALUES
    ('sanjay.hod@edutrack.ac',    'HOD',     'LOGIN_SUCCESS',  '127.0.0.1'),
    ('neha.cr@edutrack.ac',       'CR',      'LOGIN_SUCCESS',  '127.0.0.1'),
    ('ankit.student@edutrack.ac', 'HOD',     'ROLE_MISMATCH',  '192.168.1.104'),
    ('ankit.student@edutrack.ac', 'Student', 'LOGIN_SUCCESS',  '127.0.0.1');

INSERT OR IGNORE INTO Courses (course_code, course_name, semester, credits) VALUES
    ('CS201', 'Data Structures & Algorithms',        3, 4),
    ('CS202', 'Database Management Systems (RDBMS)', 3, 4),
    ('CS203', 'Object-Oriented Programming (Java)',  3, 3),
    ('CS204', 'Computer Networks',                   3, 4),
    ('CS205', 'Operating Systems',                   4, 4),
    ('CS206', 'Software Engineering',                4, 3),
    ('CS207', 'Web Technologies',                    4, 3),
    ('CS208', 'Cloud Security & Computing',          4, 3);

-- ✅ Schema + seed complete. Run python init_db.py for real bcrypt hashes.
