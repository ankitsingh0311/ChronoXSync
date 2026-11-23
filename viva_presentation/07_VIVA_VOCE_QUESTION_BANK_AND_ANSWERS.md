# ⓻ Viva Voce Master Question Bank & Model Answers — ChronoXSync

---

## Section 1: Project Overview & Core Concept Questions

### Q1: What is ChronoXSync, and what fundamental problem does it solve?
**Model Answer**:
ChronoXSync is an autonomous, multi-tenant academic workload synchronizer and institutional governance operating system. It solves the critical problem of uncoordinated academic scheduling in universities, where different professors schedule assignments and exams concurrently without cross-subject awareness. This causes severe exam collisions, student burnout, and disputed submission timestamps. ChronoXSync automates conflict prevention via database triggers, tracks cognitive workload curves, guarantees tamper-proof submissions using HMAC SHA-256 seals, and provides role-adaptive governance consoles for Students, CRs, Faculty, and HODs.

### Q2: Why is ChronoXSync an "Operating System" rather than just a simple to-do list or calendar?
**Model Answer**:
A calendar or to-do list is passive—it records dates entered by users without enforcing constraints. ChronoXSync operates as an active governance system:
1. It enforces hard **ACID transaction barriers** (`trg_PreventExamClash`) preventing conflicting entries.
2. It implements **Role-Based Access Control (RBAC)** across 4 institutional clearance levels.
3. It provides **Cryptographic Non-Repudiation** through digital wax seals.
4. It actively models cognitive stress via dynamic spline interpolation and processes anonymous sentiment using NLP.

### Q3: Who are the target users, and how does the system adapt to them?
**Model Answer**:
ChronoXSync serves four primary academic stakeholders:
1. **Students**: Receive personalized timelines, cognitive load curves, safe attendance buffer calculations, and focus timers.
2. **Class Representatives (CRs)**: Extract rubrics via OCR, broadcast batch notices, and manage section directories.
3. **Faculty**: Track 5-unit curriculum velocity, test 48-hour collision slots, and grade submissions.
4. **HODs**: Maintain departmental oversight via a 16-week burnout heatmap, anonymous grievance triage, and faculty velocity audits.

---

## Section 2: Database & Architecture Questions

### Q4: Explain the database design. What normal form does it satisfy?
**Model Answer**:
The database is structured in strict **Third Normal Form (3NF)** across 14 normalized entities (`Universities`, `Departments`, `Roles`, `Users`, `Courses`, `Deadlines`, `Exams`, `Submissions`, `Delegations`, `SyllabusUnits`, `Grievances`, `Notices`, `AttendanceLogs`, `AuditLogs`). 
- **1NF**: Every table cell contains atomic, single-valued attributes, and each record is identified by an explicit primary key.
- **2NF**: It satisfies 1NF, and all non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies).
- **3NF**: It satisfies 2NF, and every non-key attribute depends *only* on the primary key, with zero transitive dependencies (for example, department details are stored in `Departments`, not duplicated inside `Users`).

### Q5: How is examination collision prevented at the database level?
**Model Answer**:
Collision prevention is enforced via the `trg_PreventExamClash` database trigger executed `BEFORE INSERT` on the `Deadlines` table. The trigger calculates the absolute timestamp difference between the proposed assignment `due_date` and all scheduled `Exams` in that department. If the difference is less than 86,400 seconds (24 hours), the trigger raises an ACID abort exception (`RAISE(ABORT, ...)`), terminating the transaction and returning an HTTP 409 Conflict error to the client.

### Q6: What is the difference between SQLite in development and Azure SQL in production?
**Model Answer**:
In local development, we use SQLite 3 because it is a zero-configuration, in-process ACID-compliant SQL engine that executes queries in sub-millisecond time without network overhead. In cloud production, the architecture seamlessly switches via `backend/database.py` to **Azure SQL / SQL Server** using `pyodbc`, providing enterprise high availability, connection pooling, and multi-region replication.

### Q7: What are the pre-joined SQL views, and why did you use them?
**Model Answer**:
We created views such as `vw_StudentDashboard` to pre-join `Deadlines`, `Courses`, `Submissions`, and `Exams`. This eliminates redundant multi-table joins on frequent student read requests, optimizing query performance and reducing database I/O latency.

---

## Section 3: Security & Cryptography Questions

### Q8: How does the Cryptographic Non-Repudiation system work?
**Model Answer**:
When a student submits coursework, the server generates an immutable HMAC SHA-256 digital wax seal:
$$\text{Seal} = \text{HMAC-SHA256}(\text{student\_id} \parallel \text{deadline\_id} \parallel \text{timestamp\_ms} \parallel \text{status}, \text{SECRET})$$
The student receives a digital receipt (e.g., `REC-2026-8812`). In case of any dispute, faculty or examiners enter the hash into the **Cryptographic Verifier Terminal**. The terminal recomputes the HMAC digest using the server vault secret. If authentic, it displays the student's name, assignment, deliverable verdict (ON-TIME vs. LATE), and exact millisecond server timestamp.

### Q9: What is the "Avalanche Effect" in cryptographic hashing?
**Model Answer**:
The avalanche effect is a fundamental property of cryptographic hash functions (such as SHA-256) where changing even a single bit in the input (e.g., altering a timestamp by 1 millisecond or changing a character in the student's name) causes an unpredictable and drastic change in more than 50% of the output hash bits. In ChronoXSync, this prevents students from forging or altering digital submission receipts.

### Q10: How are passwords stored and authenticated?
**Model Answer**:
Passwords are never stored in plaintext. They are salted and hashed using **Bcrypt with 12 computational rounds** (`bcrypt.hashpw` / `bcrypt.checkpw`). Bcrypt incorporates a random 128-bit salt and an adaptive key derivation work factor, making brute-force attacks computationally infeasible even with modern GPU clusters.

### Q11: Explain the JWT authentication flow.
**Model Answer**:
Upon successful credentials verification, the server issues a signed, stateless **JSON Web Token (JWT)** using the HMAC-SHA256 (HS256) algorithm. The payload contains the user's `user_id`, `email`, `role_id`, and `exp` (expiration claim). On protected routes, the frontend includes this token in the `Authorization: Bearer <token>` header. The `@require_role` middleware validates the signature and enforces role clearance before allowing execution.

### Q12: How does the system defend against brute-force attacks?
**Model Answer**:
The backend implements a **5-Strike Account Lockout Guard**. If 5 failed password attempts occur within a rolling 15-minute window for an account or IP address, the system triggers an automatic lockout returning `HTTP 429 Too Many Requests` and logs an incident to the SIEM security stream.

---

## Section 4: Frontend & UI/UX Engineering Questions

### Q13: What frontend technologies are used, and why React 19?
**Model Answer**:
The frontend is built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Three.js**, and **Framer Motion**. React 19 provides concurrent rendering optimizations, improved form actions, and robust component lifecycle management. Vite provides sub-second Hot Module Replacement (HMR) and optimized Rollup tree-shaken production bundles.

### Q14: How does the dynamic Workload Density Spline Graph calculate its curve?
**Model Answer**:
Instead of rigid bar charts, `WorkloadDensityGraph.jsx` aggregates pending assignments and exams across a 7-day rolling window. Each item contributes cognitive load hours based on urgency (e.g., Critical = 6 hrs, High = 4 hrs). The system maps these coordinates into a continuous, smooth curve using pure SVG **cubic Bézier spline interpolation** (`C cp1x cp1y, cp2x cp2y, x y`), calculating tangent control points to visually represent cognitive acceleration.

### Q15: Explain the attendance compliance algorithm.
**Model Answer**:
University regulations mandate 75% minimum attendance. The calculator computes:
$$\text{Safe Cuts Remaining} = \max\left(0, \left\lfloor \frac{\text{Attended} - 0.75 \times \text{Total}}{0.75} \right\rfloor\right)$$
If attendance drops below 75%, it calculates:
$$\text{Lectures to Recover} = \max\left(0, \lceil 3 \times \text{Total} - 4 \times \text{Attended} \rceil\right)$$
This gives students immediate, actionable clarity on how many classes they can afford to miss or must attend.

### Q16: Why did you choose a high-visibility Light Theme over a dark theme?
**Model Answer**:
While dark mode looks stylized, high-stakes academic administration, grading, and reading require high contrast and legibility under varying ambient lighting conditions. We engineered a radiant light canvas (`#f8fafc`) with pure white surface cards (`#ffffff`), hairline slate borders (`#e2e8f0`), and deep ink text (`#0f172a`), while providing a theme toggle for users who prefer dark mode.

---

## Section 5: NLP, Computer Vision & Advanced Features

### Q17: How does the anonymous student grievance triage work?
**Model Answer**:
To ensure authentic student feedback, the grievance portal strips IP addresses and user IDs upon submission. The text is analyzed using the **VADER (Valence Aware Dictionary and sEntiment Reasoner)** NLP library, calculating a compound polarity score between $-1.0$ (extreme distress) and $+1.0$ (positive). Scores below $-0.6$ are flagged as **CRITICAL**, alerting the Department Head to intervene before exams.

### Q18: How does the OCR rubric parser work?
**Model Answer**:
The OCR pipeline uses **PyMuPDF** and **pytesseract** to parse uploaded course PDF rubrics. It performs computer vision contour detection and regex pattern matching to extract deadline dates, assignment titles, course codes, and weight percentages, converting unstructured documents into structured calendar events.

### Q19: What is RFC-5545 iCalendar synchronization?
**Model Answer**:
RFC-5545 is the universal Internet Calendaring and Scheduling standard. ChronoXSync generates unique, authenticated `webcal://` subscription feeds. When subscribed in Google Calendar, Apple Calendar, or Outlook, deadlines and exams sync automatically to the student's mobile phone with built-in `VALARM` reminder alerts.

---

## Section 6: "Why Did You Choose X Over Y?" Defense Questions

### Q20: Why FastAPI instead of Django or Flask?
**Model Answer**:
FastAPI is built on ASGI (Asynchronous Server Gateway Interface) and Starlette, providing native Python `async/await` concurrency capable of handling thousands of simultaneous connections with low latency. It provides automatic Pydantic request validation and generates interactive OpenAPI (Swagger) documentation automatically. Django was too heavy and monolithic for our decoupled architecture, while Flask lacked native async support and built-in type validation.

### Q21: Why Relational 3NF SQL instead of MongoDB (NoSQL)?
**Model Answer**:
Academic scheduling requires strict **ACID transactional integrity** (Atomicity, Consistency, Isolation, Durability). If an exam is scheduled, the conflict trigger must execute synchronously before any conflicting deadline is saved. Relational foreign key constraints guarantee cascading deletions with zero orphan records. NoSQL document stores (like MongoDB) sacrifice multi-document ACID constraints and require manual consistency management.

### Q22: What were the major technical challenges you faced, and how did you resolve them?
**Model Answer**:
1. **Mathematical Spline Smoothing**: Standard linear charts looked robotic. Resolved by implementing cubic Bézier control point calculations in pure SVG.
2. **ACID Trigger Execution**: Ensuring SQLite and Azure SQL both adhered to strict 24-hour clash detection without timing discrepancies across timezones. Resolved by standardizing all timestamps to UTC milliseconds (`%s`).
3. **Public Demo Data Isolation**: Allowing public visitors to explore real tools without exposing registered users' private records. Resolved by creating an isolated demonstration harness with sample academic personas.
