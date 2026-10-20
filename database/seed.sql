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
INSERT INTO Users (full_name, email, password_hash, role_id, department) VALUES
-- Students (role_id = 1)
('Ankit Singh',      'ankit.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science'),
('Priya Sharma',     'priya.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science'),
('Rahul Verma',      'rahul.student@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 1, 'Computer Science'),

-- Class Representatives (role_id = 2)
('Neha Gupta',       'neha.cr@edutrack.ac',         '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 2, 'Computer Science'),
('Arjun Patel',      'arjun.cr@edutrack.ac',        '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 2, 'Computer Science'),

-- Faculty (role_id = 3)
('Dr. Meena Iyer',   'meena.faculty@edutrack.ac',   '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 3, 'Computer Science'),
('Prof. Ravi Kumar', 'ravi.faculty@edutrack.ac',     '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 3, 'Computer Science'),

-- HOD / Admin (role_id = 4)
('Dr. Sanjay Desai', 'sanjay.hod@edutrack.ac',      '$2b$12$LJ3m4ys3GZxKNFXvf8z5aeY8VQ3jBt5v6Kx2w9D7hR1nM4pC6gXSe', 4, 'Computer Science');

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
-- SEED: Submissions (Sample student task statuses)
-- ============================================================================
INSERT INTO Submissions (user_id, deadline_id, status, completed_at) VALUES
(1, 1, 'DONE',    '2024-11-09 21:30:00'),
(1, 2, 'PENDING', NULL),
(1, 3, 'PENDING', NULL),
(2, 1, 'DONE',    '2024-11-10 11:00:00'),
(2, 2, 'DONE',    '2024-11-11 18:45:00'),
(3, 1, 'PENDING', NULL),
(3, 4, 'DONE',    '2024-11-15 22:00:00');

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
