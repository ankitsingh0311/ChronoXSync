# ⓸ Functionality & Working Module Demonstration — ChronoXSync

---

## 1. Master Demonstration Script for Viva Voce & Presentation

When presenting ChronoXSync to examiners or evaluation committees, follow this systematic demonstration sequence to showcase the depth of working features across all four roles:

```
[Step 1: Public Tour & Telemetry] ➔ [Step 2: Student Console] ➔ [Step 3: Faculty Console]
        ➔ [Step 4: CR Console] ➔ [Step 5: HOD Console] ➔ [Step 6: Cryptographic Verifier]
        ➔ [Step 7: Real Authentication & Database Persistence]
```

---

## 2. Working Module Walkthrough & Feature Breakdown

### Module 1: Public Landing Experience & Academic Telemetry
* **Direct URL**: `https://chronoxsync.vercel.app/`
* **Features to Demonstrate**:
  1. **Live Local Academic Term Clock**: Displays exact system time in IST/UTC along with current semester week (`Semester 3 Week 8`).
  2. **Zero-Conflict Value Proposition**: Explains how ChronoXSync prevents deadline collisions before exams.
  3. **High-Contrast Light Theme Canvas**: Showcases clean `#ffffff` surfaces, `#e2e8f0` hairline dividers, and `#0f172a` deep slate typography.
  4. **Isolated Sample Dataset**: Demonstrates that external visitors can explore every feature safely without exposing registered students' private records.

---

### Module 2: Student Scholar Workspace
* **Direct URL**: `https://chronoxsync.vercel.app/?role=student`
* **Features to Demonstrate**:
  1. **Dynamic SVG Workload Density Spline Graph**:
     - Hover over days (Mon, Tue, ..., Sun) to see cumulative study load hours.
     - Switch between **Spline** curve mode and **Load Heat** breakdown.
     - Explain how high-urgency tasks automatically elevate the curve toward critical strain thresholds.
  2. **Coursework Deliverable Task Cards**:
     - Display course codes (`CS-302`, `CS-301`, `CS-304`), urgency tags (`CRITICAL`, `HIGH`, `BALANCED`), and due dates.
     - Click **"Mark as Done (Upload PDF)"** to simulate assignment submission.
     - Show the resulting **Immutable SHA-256 Digital Wax Seal** and microsecond server timestamp.
  3. **Attendance Compliance & Safe Buffer Calculator**:
     - Displays current percentage (e.g., `86%` — 38 attended of 44 total).
     - Click **"+ Attended"** or **"+ Missed"** to see the attendance bar and safe cut buffer dynamically recalculate in real time.
     - Demonstrates enforcement of the mandatory 75% institutional threshold.
  4. **Spatial Focus Pomodoro Engine**:
     - Demonstrates the 25-minute focus interval timer with Start, Pause, and Reset controls.

---

### Module 3: Course Faculty Workspace
* **Direct URL**: `https://chronoxsync.vercel.app/?role=faculty`
* **Features to Demonstrate**:
  1. **5-Unit Curriculum Milestone Tracker**:
     - Displays 5 academic units for *Database Management Systems (CS-301)*.
     - Click on any unit checkbox (e.g., Unit 4: ACID Concurrency Control) to toggle taught status.
     - Watch the curriculum completion velocity progress bar update dynamically from 60% to 80%.
  2. **48-Hour Exam Conflict Mitigation Engine**:
     - Click **"Simulate Collision Date"**: triggers the 3D WebGL conflict crystal and error alert: *"48-Hour Collision: Operating Systems Midterm is already scheduled on this day!"*
     - Click **"Simulate Clear Date"**: confirms slot verified clear with zero collisions.
  3. **Student Submissions & Grading Queue**:
     - Displays pending student submissions (Rohan Mehta, Kabir Verma).
     - Click **"Grade (95)"** to simulate instant grade and feedback publication.

---

### Module 4: Class Representative (CR) Command Desk
* **Direct URL**: `https://chronoxsync.vercel.app/?role=cr`
* **Features to Demonstrate**:
  1. **Document OCR Parser**:
     - Click the simulated OCR rubric upload box to demonstrate automated PDF schedule extraction.
     - Triggers toast notification confirming parsing of 5 lectures and 2 lab milestones.
  2. **Section A Batch Broadcast Messenger**:
     - Edit announcement text in the message field.
     - Click **"Send to 64 Scholars"** to demonstrate instant notification delivery to all enrolled section members.
  3. **Section A Student Directory Roster**:
     - Interactive directory showing roll numbers, names, emails, attendance rates, and academic honors status.
     - Use the live search filter box to instantly find students by name.

---

### Module 5: Head of Department (HOD) Governance Desk
* **Direct URL**: `https://chronoxsync.vercel.app/?role=hod`
* **Features to Demonstrate**:
  1. **Branch-Wide 16-Week Burnout Stress Heatmap**:
     - Visual grid of all 16 semester weeks with color-coded severity:
       - Green/Cyan (`LOW`): Regular coursework cadence.
       - Amber (`MOD`): Pre-exam review ramp.
       - Crimson (`PEAK`): Weeks 8 & 15 midterm and final examination clusters.
     - Click on **Week 8 (PEAK)** to view telemetry summary: 3 major lab projects + 2 theory exams (48.5 hours load) with automated conflict triggers locking slots.
  2. **Anonymous Student Grievance NLP Triage**:
     - Ingests student workload feedback without user ID or IP exposure.
     - Displays sentiment score (e.g., `-0.74` CRITICAL distress on simultaneous midterms).
     - Click **"Dispatch Relief"** to simulate an administrative +48h exam shift intervention.
  3. **Faculty Fleet Velocity Table**:
     - Monitors syllabus coverage progress across all 28 department instructors.

---

### Module 6: Cryptographic Submission Verifier Terminal
* **Direct URL**: Available inside the Student Console or via direct audit.
* **Features to Demonstrate**:
  1. **Instant Verification Test**:
     - Click on the pre-filled sample digest button: `REC-2026-8812 (Knapsack Proof)`.
     - Click **"Verify Receipt"**.
     - Display full verified metadata: Student Name (Aarav Sharma), Course (CS-303), Deliverable Verdict (**ON-TIME**), and Exact Server Timestamp in UTC/IST milliseconds.
  2. **Tampered Hash / Viva Defense Demo**:
     - Click **"Test Tampered Hash (Viva Demo)"**.
     - Shows the **Avalanche Effect Forensic Diagnostic**: demonstrates that altering even a single character or timestamp millisecond invalidates the 256-bit cryptographic seal.

---

### Module 7: Real Authentication & Database Persistence
* **Direct URLs**:
  - Sign In: `https://chronoxsync.vercel.app/login?mode=signin`
  - Register: `https://chronoxsync.vercel.app/signup`
* **Features to Demonstrate**:
  1. **Permanent Database Storage**: Every newly enrolled user is inserted into the `Users` table with a 12-round bcrypt hash.
  2. **Input Validation**: Client and server-side verification of email structure, password complexity, and role selection.
  3. **5-Strike Brute-Force Lockout**: Demonstrates rate limiting and SIEM security logging on repeated incorrect password attempts.
