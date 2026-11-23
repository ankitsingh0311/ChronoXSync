# ⓶ System Design, Architecture & Flowcharts — ChronoXSync

---

## 1. Decoupled 3-Tier Enterprise Architecture

ChronoXSync is engineered using a decoupled, highly cohesive 3-Tier Enterprise Architecture ensuring horizontal scalability, zero state coupling, and robust data integrity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: PRESENTATION TIER                       │
│  React 19 SPA • Vite Bundler • Tailwind CSS v4 • Framer Motion        │
│  Three.js WebGL Shaders • Cursor Tactile Design Tokens • Dual Themes  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST JSON / JWT Bearer
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 2: APPLICATION TIER                        │
│  FastAPI (Python 3.11+) ASGI Async Engine • Uvicorn Worker Pools       │
│  In-Memory TTL Caching Layer (cache.py) • Pydantic Schema Validation   │
│  Bcrypt 12-Round Password Hashing • HS256 JWT Token Dispatcher         │
│  NLP Sentiment Analysis (VADER/TextBlob) • OCR Pipeline (PyMuPDF)      │
│  APScheduler Background Cron Reminders • SIEM Audit Logger             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ACID Transactions / Parameterized SQL
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 3: PERSISTENCE TIER                        │
│  Strict 3NF Relational Database (SQLite Local / Azure SQL Cloud)        │
│  14 Normalized Relational Tables • Foreign Key Cascading Integrity     │
│  ACID Collision Trigger: trg_PreventExamClash                          │
│  Pre-Aggregated Optimized Views: vw_StudentDashboard                   │
│  B-Tree Clustered & Non-Clustered Indexes on (user_id, department_id)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Interactive Flowcharts & Sequence Diagrams

### A. Academic Conflict Prevention & Scheduling Sequence
This sequence details how a Faculty or CR deadline scheduling request is intercepted and validated against scheduled examinations:

```
Student / CR / Faculty              FastAPI Controller             SQLite / Azure SQL Database
         │                                   │                                    │
         │─── POST /api/deadlines ──────────>│                                    │
         │    {title, course_id, due_date}   │                                    │
         │                                   │─── BEGIN TRANSACTION ─────────────>│
         │                                   │                                    │
         │                                   │─── Check trg_PreventExamClash ────>│
         │                                   │    SELECT COUNT(*) FROM Exams      │
         │                                   │    WHERE dept_id = :dept_id        │
         │                                   │    AND ABS(due_date - exam_date)   │
         │                                   │        < 24 Hours                  │
         │                                   │                                    │
         │                                   │<── Result (Conflict Detected!) ───│
         │                                   │                                    │
         │                                   │─── ROLLBACK TRANSACTION ──────────>│
         │                                   │                                    │
         │<── 409 Conflict Response ─────────│                                    │
         │    "Exam Conflict: Midterm exists │                                    │
         │     within 24 hours on this date" │                                    │
         │                                   │                                    │
```

---

### B. Cryptographic Non-Repudiation Submission Sequence
How coursework files and submissions are sealed with an unforgeable HMAC SHA-256 digest:

```
Student Client                          FastAPI Server                    Database & Vault
      │                                       │                                   │
      │─── POST /api/submissions/upload ─────>│                                   │
      │    (PDF Deliverable File)             │                                   │
      │                                       │─── Store PDF in /uploads ────────>│
      │                                       │    Compute File SHA-256           │
      │                                       │                                   │
      │                                       │─── Calculate Digital Wax Seal ───>│
      │                                       │    timestamp_ms = UTC_NOW()       │
      │                                       │    data = student_id + deadline_id│
      │                                       │           + timestamp_ms + status │
      │                                       │    hash = HMAC_SHA256(data, SECRET│
      │                                       │                                   │
      │                                       │─── INSERT INTO Submissions ──────>│
      │                                       │    (hash, timestamp, file_path)   │
      │                                       │                                   │
      │<── 200 OK Response ───────────────────│                                   │
      │    {receipt_id: "REC-2026-8812",      │                                   │
      │     sha256_hash: "9f83a2c5...",       │                                   │
      │     server_timestamp: "2026-11-20..."}│                                   │
```

---

### C. Anonymous Grievance Sentiment Triage Flowchart

```
┌─────────────────────────────────┐
│ Student Submits Grievance Text  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Identity Stripping Middleware   │
│ (Removes IP address & user_id)  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ NLP Sentiment Evaluation Engine │
│ (Calculates Compound Score:     │
│  -1.0 Highly Negative to +1.0)  │
└────────────────┬────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
Score < -0.6           Score between
(Extreme Distress)     -0.6 and -0.2
       │                   │
       ▼                   ▼
[CRITICAL SEVERITY]    [MODERATE ALERT]
       │                   │
       └─────────┬─────────┘
                 ▼
┌─────────────────────────────────┐
│ Dispatched to HOD Live Console  │
│ with One-Click Relief Actions   │
│ (+48h Exam Shift Intervention)  │
└─────────────────────────────────┘
```

---

## 3. Database Schema Architecture (14 Relational Entities in 3NF)

ChronoXSync adheres strictly to **Third Normal Form (3NF)** principles: every non-key column is fully functionally dependent solely on the primary key, with zero transitive dependencies.

```
       ┌───────────────────────────┐
       │        Universities       │
       ├───────────────────────────┤
       │ PK  university_id         │
       │     name, code, logo_url  │
       └─────────────┬─────────────┘
                     │ 1:N
       ┌─────────────▼─────────────┐
       │        Departments        │
       ├───────────────────────────┤
       │ PK  department_id         │
       │ FK  university_id         │
       │     name, code            │
       └──────┬─────────────┬──────┘
          1:N │             │ 1:N
              ▼             ▼
   ┌──────────────┐    ┌──────────────┐
   │   Courses    │    │    Users     │
   ├──────────────┤    ├──────────────┤
   │ PK course_id │    │ PK user_id   │
   │ FK dept_id   │    │ FK dept_id   │
   │    name,code │    │ FK role_id   │
   └──────┬───────┘    │    full_name │
          │ 1:N        │    email     │
          ▼            │    password  │
   ┌──────────────┐    └──────┬───────┘
   │  Deadlines   │           │ 1:N
   ├──────────────┤           │
   │ PK deadl_id  │           │
   │ FK course_id │           │
   │    title     │           ▼
   │    due_date  │    ┌──────────────┐
   │    urgency   │    │ Submissions  │
   └──────┬───────┘    ├──────────────┤
          │ 1:N        │ PK sub_id    │
          └───────────>│ FK deadl_id  │
                       │ FK user_id   │
                       │    sha256    │
                       │    status    │
                       │    timestamp │
                       └──────────────┘
```

### Relational Schema Entity Breakdown:
1. `Roles`: Institutional clearance levels (1=Student, 2=CR, 3=Faculty, 4=HOD).
2. `Universities`: Root multi-tenant institutions.
3. `Departments`: Autonomous departmental silos.
4. `Users`: Core credentials, bcrypt salted password hashes, designations.
5. `Courses`: Academic subjects tagged to specific departments.
6. `Deadlines`: Assignments, lab submissions, and capstone milestones.
7. `Exams`: Midterms, finals, practical tests used by the collision trigger.
8. `Submissions`: Completed work with SHA-256 wax seals, microsecond timestamps, PDF paths.
9. `Delegations`: Faculty-to-CR coursework directives.
10. `SyllabusUnits`: 5-unit curriculum tracking with completion booleans.
11. `Grievances`: Anonymous student feedback with VADER NLP polarity scores.
12. `Notices`: Departmental broadcasts dispatched by HODs and CRs.
13. `AttendanceLogs`: Cumulative lecture counts and attended records.
14. `AuditLogs`: Security stream tracking authentication and 5-strike lockouts.

---

## 4. UI/UX Design Approach (Human-Crafted vs. Generic AI)

ChronoXSync deliberately rejects generic "vibe-coded" AI aesthetics (such as oversaturated purples, blurred blob backgrounds, and flat buttons):

1. **High-Visibility Light Canvas**: Modern radiant slate-50 (`#f8fafc`) with a subtle ambient radial glow (`radial-gradient(1200px 600px at 50% -100px, rgba(37, 99, 235, 0.05), transparent 70%)`).
2. **Hairline Precision Borders**: High-contrast, 1px solid slate dividers (`#e2e8f0` and `#cbd5e1`) instead of blurry floating shadows.
3. **Tactile Mechanical Buttons**:
   * `.btn-tactile-orange`: `#f54e00` cursor orange with 1px mechanical depression on `:active`.
   * `.btn-tactile-blue`: `#2563eb` cobalt blue for primary navigation.
   * `.btn-tactile-secondary`: Clean slate-bordered button with natural press feedback.
4. **JetBrains Mono Typography**: Used exclusively for mission-critical metrics: server timestamps, SHA-256 digests, academic term clocks, and percentage buffers.
5. **Interactive Spline Kinematics**: Workload density visualized using pure SVG cubic Bézier spline interpolation rather than rigid bar charts.
