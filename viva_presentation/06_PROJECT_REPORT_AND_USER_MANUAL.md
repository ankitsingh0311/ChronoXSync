# ⓺ Project Report Summary & User Manual — ChronoXSync

---

## Part 1: Academic Project Report Summary

### 1. Title of the Project
**ChronoXSync**: Autonomous Academic Workload Synchronizer & Multi-Department Governance Engine.

### 2. Abstract
Higher education institutions routinely experience unsynchronized scheduling where multiple academic departments independently assign coursework, laboratory deadlines, and examinations to the same student cohort. This lack of horizontal visibility leads to deadline clustering, examination collisions, cognitive fatigue, elevated cheating rates, and disputed submission timestamps. 

ChronoXSync introduces an enterprise-grade academic operating system featuring:
1. An **ACID database trigger** (`trg_PreventExamClash`) preventing coursework placement within 24–48 hours of examinations.
2. A **cryptographic non-repudiation protocol** using HMAC SHA-256 digital seals to ensure tamper-proof assignment verification.
3. Four dedicated, role-adaptive workspaces for **Students**, **Class Representatives**, **Course Faculty**, and **Department Heads (HODs)**.
4. An **NLP-driven anonymous grievance triage engine** scoring student distress sentiment.
Built on React 19, FastAPI, Three.js, and SQLite/Azure SQL in Third Normal Form (3NF), ChronoXSync provides a comprehensive solution for modern academic temporal management.

### 3. Objectives
* Eliminate examination collisions through automated database constraints.
* Provide students with real-time cognitive workload modeling and attendance compliance margins.
* Streamline curriculum progress tracking for faculty members through 5-unit milestone velocity telemetry.
* Enable Class Representatives to extract deadline rubrics via OCR and broadcast emergency batch announcements.
* Equip HODs with high-level department oversight through a 16-week burnout stress heatmap and grievance triage.
* Guarantee non-repudiation of student deliverables using cryptographic hashes.

### 4. System Specifications
* **Frontend**: React 19 SPA, Vite 8.3.4, Tailwind CSS v4, Three.js 0.186.1, Framer Motion 14.3.0.
* **Backend**: FastAPI 0.104+, Python 3.11+, Uvicorn ASGI Server, Pydantic, PyJWT, Bcrypt.
* **Database**: SQLite 3 (Development/Local) & Azure SQL (Cloud Production) in strict 3NF.
* **NLP & CV**: VADER/TextBlob sentiment analysis, PyMuPDF OCR parsing.
* **Hosting**: Vercel Global Edge Network (Frontend) + Render Cloud Container (Backend).

---

## Part 2: Role-by-Role User Manual

### 1. Student User Guide
1. **Accessing the Timeline**: Navigate to `https://chronoxsync.vercel.app/` or sign in with your credentials.
2. **Reviewing Workload**: View the 7-day spline curve. Days with peaks indicate high study hours required.
3. **Submitting Coursework**:
   - Locate the task card under *Coursework Deliverables*.
   - Click **"Mark as Done (Upload PDF)"**.
   - Review your generated **SHA-256 Digital Wax Seal** and save the receipt ID for your records.
4. **Monitoring Attendance**: Check your attendance buffer. Ensure the percentage remains strictly above **75%**.
5. **Focus Sessions**: Launch the **Spatial Focus Engine** for dedicated 25-minute Pomodoro intervals.

### 2. Faculty User Guide
1. **Curriculum Tracking**: Check the 5-unit syllabus checklist. Check off modules as lectures are delivered to update department velocity.
2. **Scheduling Exams & Deadlines**:
   - Select a candidate date for an exam or deadline.
   - The conflict engine verifies whether any exam or high-urgency deadline is within 24–48 hours.
   - If a collision occurs, choose an alternative date recommended by the system.
3. **Verifying Submissions**: Enter a student's receipt hash in the **Cryptographic Verifier Terminal** to verify on-time submission status and timestamp.

### 3. Class Representative (CR) User Guide
1. **OCR Rubric Upload**: Drag and drop course syllabi or problem sheets into the OCR parser to auto-extract milestones.
2. **Batch Announcements**: Type urgent class notices (e.g., room change or lab rescheduling) and click **"Send to 64 Scholars"**.
3. **Class Directory**: Review the student roster to identify peers requiring attendance support.

### 4. Head of Department (HOD) User Guide
1. **Burnout Heatmap**: Inspect the 16-week semester grid. Focus on peak weeks (Weeks 8 & 15) to ensure exam slots are locked.
2. **Grievance Triage**: Review incoming anonymous sentiment tickets. Click **"Dispatch Relief"** to shift schedules if clusters cause excessive student strain.
3. **Faculty Velocity**: Audit syllabus completion across instructors to ensure university curriculum deadlines are met.
