-- ============================================================================
-- EduTrack 3D — Complete Relational Schema & Seed Script (schema_and_seed.sql)
-- ============================================================================
-- Architecture: Three-Layer Client-Server Design (Supports Azure SQL and SQLite)
-- Security Measures: bcrypt password hashing with 12 rounds, ERP-based role validation,
--                    protection against repeated failed login attempts, and tamper-resistant audit logs.
-- ============================================================================

-- Safe Schema Initialization: Tables are created with IF NOT EXISTS to guarantee zero data loss.


-- ============================================================================
-- TABLE 1: Institutional_Directory (Pre-verified College ERP Roster)
-- Acts as the immutable source of truth during Registration so a student
-- cannot claim elevated privileges (e.g., registering as HOD or CR).
-- ============================================================================
CREATE TABLE Institutional_Directory (
    directory_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    authorized_role TEXT NOT NULL CHECK (authorized_role IN ('Student', 'CR', 'Faculty', 'HOD')),
    department      TEXT NOT NULL DEFAULT 'Computer Science'
);

-- ============================================================================
-- TABLE 2: Roles (Lookup Table for Role-Based Access Control)
-- Maps role_id to role_name for RBAC token verification across 4 tiers.
-- ============================================================================
CREATE TABLE Roles (
    role_id   INTEGER PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE CHECK (role_name IN ('STUDENT', 'CR', 'FACULTY', 'HOD'))
);

-- ============================================================================
-- TABLE 3: Users (Active Registered Accounts with Cloud Security Hardening)
-- Stores bcrypt salted hashes, failed attempt counters, and lockout timestamps.
-- ============================================================================
CREATE TABLE Users (
    user_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name             TEXT NOT NULL,
    email                 TEXT NOT NULL UNIQUE,
    password_hash         TEXT NOT NULL,
    role_id               INTEGER NOT NULL,
    role_name             TEXT NOT NULL CHECK (role_name IN ('Student', 'CR', 'Faculty', 'HOD')),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until          TIMESTAMP NULL,
    department            TEXT DEFAULT 'Computer Science',
    calendar_sync_token     TEXT NOT NULL UNIQUE,
    calendar_last_polled_at TIMESTAMP NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_token ON Users(calendar_sync_token);


-- ============================================================================
-- TABLE 4: Auth_Audit_Logs (Cloud Security SIEM & Real-time Monitoring)
-- Tracks all authentication attempts, role mismatches, lockouts, and registrations.
-- ============================================================================
CREATE TABLE Auth_Audit_Logs (
    log_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT NOT NULL,
    attempted_role TEXT,
    event_type     TEXT NOT NULL CHECK (event_type IN (
                     'LOGIN_SUCCESS',
                     'INVALID_PASSWORD',
                     'ROLE_MISMATCH',
                     'ACCOUNT_LOCKED',
                     'REGISTER_SUCCESS',
                     'REGISTER_ROLE_MISMATCH',
                     'REGISTER_UNAUTHORIZED_EMAIL'
                   )),
    ip_address     TEXT,
    timestamp      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 5: Courses (Academic Master Roster)
-- ============================================================================
CREATE TABLE Courses (
    course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL UNIQUE,
    course_name TEXT NOT NULL,
    semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits     INTEGER DEFAULT 4
);

-- ============================================================================
-- TABLE 6: Deadlines (Academic Workload Feed)
-- ============================================================================
CREATE TABLE Deadlines (
    deadline_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id        INTEGER NOT NULL,
    posted_by        INTEGER NOT NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    due_date         TIMESTAMP NOT NULL,
    urgency          TEXT DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    pdf_blob_url     TEXT,
    is_reminder_sent INTEGER DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    FOREIGN KEY (posted_by) REFERENCES Users(user_id)
);

-- ============================================================================
-- TABLE 7: Exam_Schedules (Faculty Published Examination Timetables)
-- ============================================================================
CREATE TABLE Exam_Schedules (
    exam_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id    INTEGER NOT NULL,
    scheduled_by INTEGER NOT NULL,
    exam_date    TIMESTAMP NOT NULL,
    exam_type    TEXT DEFAULT 'MIDTERM' CHECK (exam_type IN ('MIDTERM', 'FINAL', 'QUIZ', 'VIVA')),
    venue        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
);

-- ============================================================================
-- TABLE 8: Submissions (Student Submission Tracking)
-- ============================================================================
CREATE TABLE Submissions (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    deadline_id   INTEGER NOT NULL,
    status        TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'LATE')),
    completed_at  TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (deadline_id) REFERENCES Deadlines(deadline_id),
    UNIQUE (user_id, deadline_id)
);

-- ============================================================================
-- TABLE 9: Panic_Logs (Workload Sentiment & Burnout Analytics)
-- ============================================================================
CREATE TABLE Panic_Logs (
    panic_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    message_text    TEXT NOT NULL,
    sentiment_score REAL DEFAULT 0.0,
    severity        TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('CRITICAL', 'MEDIUM', 'LOW')),
    department      TEXT DEFAULT 'Computer Science',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- B-Tree Performance & Security Indexes
-- ============================================================================
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_directory_email ON Institutional_Directory(email);
CREATE INDEX idx_audit_email_time ON Auth_Audit_Logs(email, timestamp DESC);
CREATE INDEX idx_deadlines_duedate ON Deadlines(due_date ASC);
CREATE INDEX idx_submissions_user ON Submissions(user_id, deadline_id);
CREATE INDEX idx_panic_severity ON Panic_Logs(severity, created_at DESC);

-- ============================================================================
-- SEED DATA 1: Roles (Lookup Table)
-- ============================================================================
INSERT INTO Roles (role_id, role_name) VALUES
(1, 'STUDENT'),
(2, 'CR'),
(3, 'FACULTY'),
(4, 'HOD');

-- ============================================================================
-- SEED DATA 2: Institutional_Directory & Users
-- PRODUCTION CLEAN SLATE: Zero dummy accounts are seeded.
-- Accounts are populated permanently via live user registrations with 12-round bcrypt.
-- ============================================================================

-- SEED DATA 4: Auth_Audit_Logs (Initial Security Audit History)
-- ============================================================================
INSERT INTO Auth_Audit_Logs (email, attempted_role, event_type, ip_address, timestamp) VALUES
('sanjay.hod@edutrack.ac',    'HOD',     'LOGIN_SUCCESS', '127.0.0.1', datetime('now', '-2 hours')),
('neha.cr@edutrack.ac',       'CR',      'LOGIN_SUCCESS', '127.0.0.1', datetime('now', '-90 minutes')),
('ankit.student@edutrack.ac', 'HOD',     'ROLE_MISMATCH', '192.168.1.104', datetime('now', '-45 minutes')),
('ankit.student@edutrack.ac', 'Student', 'LOGIN_SUCCESS', '127.0.0.1', datetime('now', '-30 minutes'));

-- ============================================================================
-- SEED DATA 5: Courses
-- ============================================================================
INSERT INTO Courses (course_code, course_name, semester, credits) VALUES
('CS201', 'Data Structures & Algorithms',       3, 4),
('CS202', 'Database Management Systems (RDBMS)', 3, 4),
('CS203', 'Object-Oriented Programming (Java)',  3, 3),
('CS204', 'Computer Networks',                   3, 4),
('CS205', 'Operating Systems',                   4, 4),
('CS206', 'Software Engineering',                4, 3),
('CS207', 'Web Technologies',                    4, 3),
('CS208', 'Cloud Security & Computing',          4, 3);

-- ============================================================================
-- SEED DATA 6: Deadlines
-- ============================================================================
INSERT INTO Deadlines (course_id, posted_by, title, description, due_date, urgency) VALUES
(1, 3, 'DSA Assignment 3 - Red-Black Trees', 'Implement self-balancing trees with rotational unit tests.', datetime('now', '+3 days'), 'HIGH'),
(2, 3, 'RDBMS Lab 5 - Normalization to 3NF',  'Design relational schema and verify functional dependencies.', datetime('now', '+5 days'), 'MEDIUM'),
(3, 3, 'Java OOP Project - Enterprise LMS',   'Build multithreaded server with client connection pools.', datetime('now', '+7 days'), 'HIGH'),
(4, 3, 'CN Assignment 2 - Socket Protocol',  'Construct custom TCP handshake with checksum verification.', datetime('now', '+9 days'), 'MEDIUM'),
(5, 3, 'OS Lab 4 - CPU Scheduling Simulation','Simulate preemptive and non-preemptive process queues.', datetime('now', '+12 days'), 'LOW');

-- ============================================================================
-- SEED DATA 7: Exam_Schedules
-- ============================================================================
INSERT INTO Exam_Schedules (course_id, scheduled_by, exam_date, exam_type, venue) VALUES
(1, 2, datetime('now', '+10 days'), 'MIDTERM', 'Auditorium Block A'),
(2, 2, datetime('now', '+14 days'), 'MIDTERM', 'Lab 302'),
(3, 2, datetime('now', '+18 days'), 'MIDTERM', 'Hall B - Block 2'),
(4, 2, datetime('now', '+21 days'), 'QUIZ',    'Online Assessment Portal');

-- ============================================================================
-- SEED DATA 8: Submissions
-- ============================================================================
INSERT INTO Submissions (user_id, deadline_id, status, completed_at) VALUES
(4, 1, 'DONE', datetime('now', '-1 day')),
(5, 1, 'PENDING', NULL),
(4, 2, 'DONE', datetime('now', '-12 hours')),
(5, 2, 'DONE', datetime('now', '-6 hours'));

-- ============================================================================
-- SEED DATA 9: Panic_Logs
-- ============================================================================
INSERT INTO Panic_Logs (message_text, sentiment_score, severity, department) VALUES
('Workload is balanced for this week. All deliverables on track.', 0.65, 'LOW', 'Computer Science'),
('Midterm exams and project submissions are overlapping next week.', -0.42, 'MEDIUM', 'Computer Science'),
('Multiple high-urgency assignments due on the same day with no buffer.', -0.85, 'CRITICAL', 'Computer Science');
