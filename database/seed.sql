-- ============================================================================
-- EduTrack 3D — Seed Data (seed.sql)
-- ============================================================================
-- SUBJECT 4 (Cloud Security): All passwords are bcrypt-hashed with salt.
-- Pre-seeded accounts for all 4 roles for live viva demo & testing.
-- Default password for all seed accounts: "EduTrack@2024"
-- bcrypt hash generated with rounds=12
-- ============================================================================

-- ============================================================================
-- SEED: Roles (4 distinct roles per specification)
-- ============================================================================
INSERT INTO Roles (role_id, role_name) VALUES
(1, 'STUDENT'),
(2, 'CR'),
(3, 'FACULTY'),
(4, 'HOD');

-- ============================================================================
-- SEED: Users (Pre-hashed bcrypt passwords — Subject 4: Cloud Security)
-- Password: "EduTrack@2024"
-- Hash: $2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe
-- ============================================================================
INSERT INTO Users (full_name, email, password_hash, role_id, department, calendar_sync_token) VALUES
-- Students (role_id = 1)
('Ankit Singh',      'ankit.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science', 'c101010101010101010101010101010101010101010101010101010101010101'),
('Priya Sharma',     'priya.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science', 'c102020202020202020202020202020202020202020202020202020202020202'),
('Rahul Verma',      'rahul.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science', 'c103030303030303030303030303030303030303030303030303030303030303'),

-- Class Representatives (role_id = 2)
('Neha Gupta',       'neha.cr@edutrack.ac',         '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 2, 'Computer Science', 'c201010101010101010101010101010101010101010101010101010101010101'),
('Arjun Patel',      'arjun.cr@edutrack.ac',        '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 2, 'Computer Science', 'c202020202020202020202020202020202020202020202020202020202020202'),

-- Faculty (role_id = 3)
('Dr. Meena Iyer',   'meena.faculty@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 3, 'Computer Science', 'c301010101010101010101010101010101010101010101010101010101010101'),
('Prof. Ravi Kumar', 'ravi.faculty@edutrack.ac',     '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 3, 'Computer Science', 'c302020202020202020202020202020202020202020202020202020202020202'),

-- HOD / Admin (role_id = 4)
('Dr. Sanjay Desai', 'sanjay.hod@edutrack.ac',      '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 4, 'Computer Science', 'c401010101010101010101010101010101010101010101010101010101010101');

CREATE INDEX IF NOT EXISTS idx_calendar_token ON Users(calendar_sync_token);


-- ============================================================================
-- SEED: Courses (2nd Year CS curriculum — realistic data)
-- ============================================================================
INSERT INTO Courses (course_code, course_name, semester, credits) VALUES
('CS201', 'Data Structures & Algorithms',        3, 4),
('CS202', 'Database Management Systems (RDBMS)',  3, 4),
('CS203', 'Object-Oriented Programming (Java)',   3, 3),
('CS204', 'Computer Networks',                    3, 4),
('CS205', 'Operating Systems',                    4, 4),
('CS206', 'Software Engineering',                 4, 3),
('CS207', 'Web Technologies',                     4, 3),
('CS208', 'Cloud Computing (DP-900)',             4, 3);

-- ============================================================================
-- SEED: Exam_Schedules (Faculty-published — feeds trg_PreventExamClash)
-- ============================================================================
INSERT INTO Exam_Schedules (course_id, scheduled_by, exam_date, exam_type, venue) VALUES
(1, 6, '2024-11-15 10:00:00', 'MIDTERM', 'Hall A - Block 3'),
(2, 6, '2024-11-18 14:00:00', 'MIDTERM', 'Lab 201'),
(3, 7, '2024-11-20 10:00:00', 'MIDTERM', 'Hall B - Block 2'),
(4, 7, '2024-11-22 09:00:00', 'QUIZ',    'Online - MS Teams'),
(5, 6, '2024-12-10 10:00:00', 'FINAL',   'Auditorium'),
(6, 7, '2024-12-12 14:00:00', 'FINAL',   'Hall A - Block 3');

-- ============================================================================
-- SEED: Deadlines (CR-posted assignments — Feature F1)
-- ============================================================================
INSERT INTO Deadlines (course_id, posted_by, title, description, due_date, urgency) VALUES
(1, 4, 'DSA Assignment 3 - AVL Trees',          'Implement AVL tree rotations with time complexity analysis.',          '2024-11-10 23:59:00', 'HIGH'),
(2, 4, 'RDBMS Lab 5 - Normalization',           'Normalize the given schema to 3NF and write SQL queries.',             '2024-11-12 23:59:00', 'MEDIUM'),
(3, 5, 'Java OOP Project - Library System',      'Build a CLI library management system with inheritance and polymorphism.', '2024-11-14 23:59:00', 'HIGH'),
(4, 5, 'CN Assignment 2 - Socket Programming',  'Create a TCP client-server chat application in Python.',               '2024-11-16 23:59:00', 'MEDIUM'),
(5, 4, 'OS Lab 4 - Process Scheduling',         'Simulate FCFS, SJF, and Round Robin scheduling algorithms.',           '2024-11-20 23:59:00', 'LOW'),
(7, 5, 'Web Tech Mini Project - Portfolio',      'Design a responsive portfolio website using HTML/CSS/JS.',             '2024-11-25 23:59:00', 'MEDIUM'),
(8, 4, 'Cloud Computing Quiz Prep',              'Review Azure DP-900 fundamentals and submit practice answers.',        '2024-11-28 23:59:00', 'LOW');

-- ============================================================================
-- SEED: Submissions (Sample student task statuses with SHA-256 Cryptographic Receipts)
-- Formula: SHA256(student_id|student_email|deadline_id|server_timestamp_ms|status|SERVER_CRYPTO_SALT)
-- ============================================================================
INSERT INTO Submissions (
    deadline_id, student_id, user_id, student_email,
    status, server_timestamp_ms, sha256_receipt_hash, verification_count,
    file_name, file_path, completed_at
) VALUES
(1, 1, 1, 'ankit.student@edutrack.ac', 'Completed', '2024-11-09 21:30:00.124', '28e5ccab215ee60826b5966205cca2c810f60defe29287e9814a1f60ae66f0c2', 2, 'DSA_AVL_Trees_Ankit.pdf', '/uploads/submissions/DSA_AVL_Trees_Ankit.pdf', '2024-11-09 21:30:00'),
(2, 1, 1, 'ankit.student@edutrack.ac', 'Pending',   NULL,                        NULL,                                                               0, NULL, NULL, NULL),
(3, 1, 1, 'ankit.student@edutrack.ac', 'Pending',   NULL,                        NULL,                                                               0, NULL, NULL, NULL),
(5, 1, 1, 'ankit.student@edutrack.ac', 'Late',      '2024-11-21 09:15:30.882', '5937d80b18b561d065860375ab0f70426c005b4c3c7f1717d1dc3f99ec24e98e', 1, 'OS_Lab4_Scheduling_Late.pdf', '/uploads/submissions/OS_Lab4_Scheduling_Late.pdf', '2024-11-21 09:15:30'),
(1, 2, 2, 'priya.student@edutrack.ac', 'Completed', '2024-11-10 11:00:00.582', '0ea7216fe8e109e1556b7d9795afc9d82959601ca0d8eae2359484bf413eda4f', 3, 'DSA_AVL_Trees_Priya.pdf', '/uploads/submissions/DSA_AVL_Trees_Priya.pdf', '2024-11-10 11:00:00'),
(2, 2, 2, 'priya.student@edutrack.ac', 'Completed', '2024-11-11 18:45:00.910', '52f70c0152a19c1b2faaf34ba9c05b63ce5a0ae03bea44f6621cb130a02e7eff', 1, 'RDBMS_Lab5_Priya.pdf', '/uploads/submissions/RDBMS_Lab5_Priya.pdf', '2024-11-11 18:45:00'),
(1, 3, 3, 'rahul.student@edutrack.ac', 'Pending',   NULL,                        NULL,                                                               0, NULL, NULL, NULL),
(4, 3, 3, 'rahul.student@edutrack.ac', 'Completed', '2024-11-15 22:00:00.345', '93c4734bf4fdbf0f46376febc33117e48cc8bae979b11b8fcc2d26d2c54fd5f1', 0, 'CN_Socket_Programming_Rahul.pdf', '/uploads/submissions/CN_Socket_Programming_Rahul.pdf', '2024-11-15 22:00:00');

-- ============================================================================
-- SEED: Panic_Logs (Anonymous grievances — Feature F5)
-- ============================================================================
INSERT INTO Panic_Logs (message_text, sentiment_score, severity, department) VALUES
('Too many assignments due on the same day. I haven''t slept in 3 days. This is unbearable.',
 -0.87, 'CRITICAL', 'Computer Science'),
('The workload is manageable but the deadlines are too close together this week.',
 -0.34, 'MEDIUM', 'Computer Science'),
('Great semester so far. Faculty support has been excellent.',
  0.72, 'LOW', 'Computer Science');
