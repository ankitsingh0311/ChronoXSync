-- ============================================================================
-- EduTrack 3D — Azure SQL Database Schema (schema.sql)
-- ============================================================================
-- SUBJECT 1 (RDBMS): Strict Third Normal Form (3NF) relational schema
--   - 7 core tables with PK/FK referential integrity constraints
--   - B-Tree indexes for query optimization
--   - vw_StudentDashboard pre-joined SQL View for O(1) feed retrieval
--   - trg_PreventExamClash AFTER INSERT trigger for conflict detection
-- SUBJECT 4 (Cloud Security): Parameterized queries enforced at app layer;
--   schema uses CHECK constraints and NOT NULL for defense-in-depth.
-- ============================================================================

-- ============================================================================
-- TABLE 1: Roles (Lookup/Reference Table — 3NF: No transitive dependencies)
-- Maps role_id to role_name. Used for JWT RBAC across all 4 user tiers.
-- ============================================================================
CREATE TABLE Roles (
    role_id   INT PRIMARY KEY,                          -- PK: 1=STUDENT, 2=CR, 3=FACULTY, 4=HOD
    role_name VARCHAR(20) NOT NULL UNIQUE               -- Human-readable role label
);
GO

-- ============================================================================
-- TABLE 2: Users (3NF: role_id references Roles — no transitive dependency)
-- Stores all authenticated users with bcrypt-hashed passwords.
-- SUBJECT 4 (Cloud Security): password_hash stores bcrypt salted hash only.
-- ============================================================================
CREATE TABLE Users (
    user_id       INT IDENTITY(1,1) PRIMARY KEY,        -- PK: Auto-increment
    full_name     NVARCHAR(100)  NOT NULL,               -- Display name
    email         VARCHAR(150)   NOT NULL UNIQUE,         -- Login identifier
    password_hash VARCHAR(255)   NOT NULL,                -- bcrypt salted hash (Subject 4)
    role_id                 INT            NOT NULL,                -- FK → Roles
    department              VARCHAR(80)    DEFAULT 'Computer Science',
    calendar_sync_token     VARCHAR(64)    NOT NULL UNIQUE,         -- Dedicated revocable 64-char RFC-5545 calendar token
    calendar_last_polled_at DATETIME2      NULL,                    -- Timestamp when external calendar polled feed
    created_at              DATETIME2      DEFAULT GETDATE(),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);
CREATE INDEX idx_calendar_token ON Users(calendar_sync_token);
GO


-- ============================================================================
-- TABLE 3: Courses (3NF: Atomic attributes, no partial dependencies)
-- Master list of courses offered in the department.
-- ============================================================================
CREATE TABLE Courses (
    course_id   INT IDENTITY(1,1) PRIMARY KEY,          -- PK
    course_code VARCHAR(20)  NOT NULL UNIQUE,            -- e.g., 'CS201'
    course_name NVARCHAR(120) NOT NULL,                  -- Full course title
    semester    INT           NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits     INT           DEFAULT 4
);
GO

-- ============================================================================
-- TABLE 4: Deadlines (3NF: Each column depends on PK only)
-- CR-posted assignment deadlines. Core entity for the academic feed (F1).
-- SUBJECT 2 (System Design): Indexed for O(N log N) sorting by due_date.
-- ============================================================================
CREATE TABLE Deadlines (
    deadline_id   INT IDENTITY(1,1) PRIMARY KEY,        -- PK
    course_id     INT            NOT NULL,               -- FK → Courses
    posted_by     INT            NOT NULL,               -- FK → Users (must be CR/role_id=2)
    title         NVARCHAR(200)  NOT NULL,               -- Assignment title
    description   NVARCHAR(MAX)  NULL,                   -- Detailed instructions
    due_date      DATETIME2      NOT NULL,               -- Submission deadline
    urgency       VARCHAR(10)    DEFAULT 'MEDIUM'        -- LOW / MEDIUM / HIGH / CRITICAL
                                 CHECK (urgency IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    pdf_blob_url  VARCHAR(500)   NULL,                   -- Azure Blob URL (Subject 3: DP-900)
    is_reminder_sent BIT         DEFAULT 0,              -- Flag for 24h APScheduler cron (F3)
    created_at    DATETIME2      DEFAULT GETDATE(),
    CONSTRAINT fk_deadlines_course FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    CONSTRAINT fk_deadlines_user   FOREIGN KEY (posted_by) REFERENCES Users(user_id)
);
GO

-- ============================================================================
-- TABLE 5: Exam_Schedules (3NF: Separate entity for faculty exam dates)
-- Faculty-published exam dates used by trg_PreventExamClash trigger (F2).
-- ============================================================================
CREATE TABLE Exam_Schedules (
    exam_id     INT IDENTITY(1,1) PRIMARY KEY,          -- PK
    course_id   INT            NOT NULL,                 -- FK → Courses
    scheduled_by INT           NOT NULL,                 -- FK → Users (must be FACULTY/role_id=3)
    exam_date   DATETIME2      NOT NULL,                 -- Exam date & time
    exam_type   VARCHAR(20)    DEFAULT 'MIDTERM'         -- MIDTERM / FINAL / QUIZ / VIVA
                               CHECK (exam_type IN ('MIDTERM','FINAL','QUIZ','VIVA')),
    venue       NVARCHAR(100)  NULL,
    created_at  DATETIME2      DEFAULT GETDATE(),
    CONSTRAINT fk_exams_course FOREIGN KEY (course_id)   REFERENCES Courses(course_id),
    CONSTRAINT fk_exams_user   FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
);
GO

-- ============================================================================
-- TABLE 6: Submissions (3NF: Junction table linking Users ↔ Deadlines)
-- Tracks per-student completion status. ACID transactions enforced (F3).
-- SUBJECT 1 (RDBMS): Composite unique constraint prevents duplicate entries.
-- ============================================================================
CREATE TABLE Submissions (
    submission_id       INT IDENTITY(1,1) PRIMARY KEY,        -- PK
    deadline_id         INT          NOT NULL,                 -- FK → Deadlines
    student_id          INT          NOT NULL,                 -- FK → Users (student)
    user_id             INT          NULL,                     -- Backward-compatibility alias
    student_email       VARCHAR(120) NOT NULL,                 -- Non-repudiation binding
    status              VARCHAR(20)  DEFAULT 'Pending'         -- Pending / Completed / Late
                        CHECK (status IN ('Pending','Completed','Late','PENDING','DONE','LATE')),
    server_timestamp_ms VARCHAR(35)  NULL,                     -- Exact server UTC/IST ms timestamp
    sha256_receipt_hash VARCHAR(64)  UNIQUE NULL,              -- 64-character SHA-256 digital receipt
    verification_count  INT          DEFAULT 0,                -- Verified counter by Faculty/HOD
    file_path           VARCHAR(255) NULL,                     -- Optional submitted assignment PDF path
    file_name           VARCHAR(255) NULL,                     -- Original PDF file name
    completed_at        DATETIME2    NULL,                     -- Timestamp when marked completed
    created_at          DATETIME2    DEFAULT GETDATE(),
    CONSTRAINT fk_sub_deadline FOREIGN KEY (deadline_id) REFERENCES Deadlines(deadline_id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student  FOREIGN KEY (student_id)  REFERENCES Users(user_id),
    CONSTRAINT uq_sub_student_deadline UNIQUE (deadline_id, student_id)
);
GO

-- ============================================================================
-- TABLE 6B: Crypto_Verification_Logs (Audit trail for Faculty/HOD verifications)
-- ============================================================================
CREATE TABLE Crypto_Verification_Logs (
    log_id              INT IDENTITY(1,1) PRIMARY KEY,
    receipt_hash        VARCHAR(64)  NOT NULL,
    submission_id       INT          NULL,
    verified_by_user_id INT          NOT NULL,
    verified_by_role    VARCHAR(20)  NOT NULL,
    verification_result VARCHAR(20)  NOT NULL CHECK (verification_result IN ('SUCCESS','FAILED','TAMPERED')),
    tamper_details      VARCHAR(255) NULL,
    verified_at         DATETIME2    DEFAULT GETDATE(),
    ip_address          VARCHAR(50)  NULL,
    CONSTRAINT fk_cryptolog_user FOREIGN KEY (verified_by_user_id) REFERENCES Users(user_id)
);
GO

-- ============================================================================
-- TABLE 7: Panic_Logs (3NF: Independent entity for anonymous grievances — F5)
-- SUBJECT 4 (Security): user_id is stripped before storage for anonymity.
-- NLP sentiment score and severity tag stored for HOD triage.
-- ============================================================================
CREATE TABLE Panic_Logs (
    panic_id       INT IDENTITY(1,1) PRIMARY KEY,       -- PK
    message_text   NVARCHAR(MAX)  NOT NULL,              -- Sanitized grievance text
    sentiment_score FLOAT         DEFAULT 0.0,           -- VADER compound score (-1 to +1)
    severity       VARCHAR(10)    DEFAULT 'MEDIUM'       -- CRITICAL / MEDIUM / LOW
                                  CHECK (severity IN ('CRITICAL','MEDIUM','LOW')),
    department     VARCHAR(80)    DEFAULT 'Computer Science',
    created_at     DATETIME2      DEFAULT GETDATE()
    -- NOTE: No user_id FK — anonymity by design (Subject 4: Cloud Security)
);
GO

-- ============================================================================
-- B-TREE INDEXES (Subject 1: RDBMS — Query Optimization)
-- ============================================================================
-- Index on Deadlines.due_date for O(N log N) chronological sorting (Subject 2)
CREATE INDEX idx_deadlines_duedate ON Deadlines(due_date ASC);

-- Index for 24h reminder cron job lookups (F3)
CREATE INDEX idx_deadlines_reminder ON Deadlines(is_reminder_sent, due_date);

-- Index on Submissions for per-student status lookups
CREATE INDEX idx_submissions_student ON Submissions(student_id, deadline_id);

-- Index on Submissions.sha256_receipt_hash for O(1) instant cryptographic verification
CREATE INDEX idx_receipt_hash ON Submissions(sha256_receipt_hash);

-- Index on Crypto_Verification_Logs for audit lookup
CREATE INDEX idx_cryptolog_hash ON Crypto_Verification_Logs(receipt_hash);

-- Index on Panic_Logs for severity-based HOD triage
CREATE INDEX idx_panic_severity ON Panic_Logs(severity, created_at DESC);
GO

-- ============================================================================
-- VIEW: vw_StudentDashboard (Subject 1: RDBMS — Pre-joined SQL View)
-- Feature F1: Crowdsourced Academic Feed — pre-joins Deadlines, Courses,
-- Users (poster info), and Submissions for O(1) retrieval via Python cache.
-- ============================================================================
CREATE VIEW vw_StudentDashboard AS
SELECT
    d.deadline_id,
    d.title           AS deadline_title,
    d.description,
    d.due_date,
    d.urgency,
    d.pdf_blob_url,
    d.created_at      AS posted_at,
    c.course_id,
    c.course_code,
    c.course_name,
    u.user_id         AS posted_by_id,
    u.full_name       AS posted_by_name,
    s.submission_id,
    s.user_id         AS student_id,
    s.status          AS submission_status,
    s.completed_at
FROM Deadlines d
INNER JOIN Courses c ON d.course_id = c.course_id
INNER JOIN Users u   ON d.posted_by = u.user_id
LEFT  JOIN Submissions s ON d.deadline_id = s.deadline_id;
GO

-- ============================================================================
-- TRIGGER: trg_PreventExamClash (Subject 1: RDBMS — Feature F2)
-- AFTER INSERT on Deadlines: Checks for conflicts with Exam_Schedules
-- (same course, within 24h) OR more than 3 deadlines within a 48h window.
-- If conflict detected → ROLLBACK + RAISERROR for React 3D warning modal.
-- ============================================================================
CREATE TRIGGER trg_PreventExamClash
ON Deadlines
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- CONFLICT CHECK 1: Exam clash within 24 hours for the same course
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN Exam_Schedules es ON i.course_id = es.course_id
        WHERE ABS(DATEDIFF(HOUR, i.due_date, es.exam_date)) < 24
    )
    BEGIN
        RAISERROR('CONFLICT: Deadline clashes with an exam within 24 hours for the same course. Transaction rolled back.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- CONFLICT CHECK 2: More than 3 deadlines within a 48-hour window
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE (
            SELECT COUNT(*)
            FROM Deadlines d
            WHERE ABS(DATEDIFF(HOUR, d.due_date, i.due_date)) <= 48
              AND d.deadline_id != i.deadline_id
        ) >= 3
    )
    BEGIN
        RAISERROR('OVERLOAD: More than 3 deadlines within 48 hours. Transaction rolled back.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
