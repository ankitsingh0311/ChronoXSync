<p align="center">
  <img src="https://img.shields.io/badge/ChronoXSync-Academic%20Orchestrator-f54e00?style=for-the-badge&logo=clockify&logoColor=white" alt="ChronoXSync Banner" />
</p>

<h1 align="center">⚡ ChronoXSync</h1>

<p align="center">
  <strong>Enterprise AI-Powered Academic Workload Orchestration & Multi-Department Synchronization Platform</strong>
</p>

<p align="center">
  <em>Architected with Spatial Glassmorphism, Three.js 3D Shaders, FastAPI, 3NF Relational SQLite, and NLP Sentiment AI.</em>
</p>

<p align="center">
  <a href="https://chronoxsync.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-chronoxsync.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo on Vercel" /></a>
  <a href="https://chronoxsync.onrender.com/docs"><img src="https://img.shields.io/badge/API%20Docs-Swagger%20UI-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Live API on Render" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/GitHub-ChronoXSync-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Three.js-0.186+-black?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/Database-SQLite%203NF-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Vite-8.3.4-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Security-bcrypt%20%2B%20JWT-red?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render" />
</p>

---

## 🌐 Live Production Deployments

| Component | Cloud Platform | Live Production URL | Description |
|---|:---:|---|---|
| 🖥️ **Web Application** | **Vercel** | **[https://chronoxsync.vercel.app](https://chronoxsync.vercel.app)** | Production React 19 + Vite SPA with 3D Three.js visualizer |
| 🌐 **Alternative Domain** | **Vercel** | **[https://chronosync-3d.vercel.app](https://chronosync-3d.vercel.app)** | Global alias mirror |
| ⚡ **RESTful API** | **Render** | **[https://chronoxsync.onrender.com](https://chronoxsync.onrender.com)** | High-throughput asynchronous FastAPI + Uvicorn backend |
| 📚 **API Documentation** | **Swagger UI** | **[https://chronoxsync.onrender.com/docs](https://chronoxsync.onrender.com/docs)** | Interactive OpenAPI endpoint explorer and testing sandbox |

> [!TIP]
> **Experience ChronoXSync Live:** Visit **[https://chronoxsync.vercel.app](https://chronoxsync.vercel.app)**, switch to **"Create Account (Register)"**, and enroll an account with your own Gmail/email under your designated role (**Student**, **CR**, **Faculty**, or **HOD**).

---

## 📌 Executive Summary

**ChronoXSync** is a unified full-stack academic platform engineered to eliminate deadline congestion, prevent exam clashes, and automate coursework delegation across higher education institutions. 

Built with **multi-tenant departmental isolation**, ChronoXSync guarantees that every department (**Computer Science**, **Engineering**, **Business**, **Computing**, etc.) maintains an autonomous operational sphere for its **Head of Department (HOD)**, **Faculty**, **Class Representatives (CRs)**, and **Students**.

---

## 🏛️ Academic Rubric Mapping (4 Core Disciplines)

| Subject | Discipline | Engineering Implementation & Code Artifacts |
| :--- | :--- | :--- |
| **Subject 1** | **RDBMS & SQL** | Strict **Third Normal Form (3NF)** relational schema (`database/schema.sql`). 11 relational entities, foreign key integrity, ACID atomic state toggles, pre-joined `vw_StudentDashboard` SQL views, and `trg_PreventExamClash` triggers. |
| **Subject 2** | **System Design & RBAC** | Decoupled 3-Tier Architecture (`React` ↔ `FastAPI` ↔ `SQLite/Azure SQL`). In-memory TTL caching layer (`backend/cache.py`), RESTful API standards, and strict departmental multi-tenancy. |
| **Subject 3** | **Cloud & Hybrid Data (DP-900)** | Hybrid architecture supporting local development with **SQLite** and cloud production with **Azure SQL** (`pyodbc`) and **Azure Blob Storage** (`azure-storage-blob`) for unstructured syllabi and PDF rubrics. |
| **Subject 4** | **Cloud Security Guard** | Salted **bcrypt (12 rounds)** password hashing, signed stateless **JWT Bearer tokens (HS256)**, 5-strike brute-force account lockout guard (429 Too Many Requests), input sanitization, and `@require_role` access barriers. |

---

## 🔐 Multi-Tenant Departmental Isolation Matrix

```
                       ┌─────────────────────────────────────────┐
                       │               ChronoXSync               │
                       │           Institutional Cloud           │
                       └────────────────────┬────────────────────┘
                                            │
         ┌────────────────────────┬─────────┴──────────────┬────────────────────────┐
         ▼                        ▼                        ▼                        ▼
 ┌───────────────┐        ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
 │ School of CS  │        │  Engineering  │        │    Business   │        │   Computing   │
 ├───────────────┤        ├───────────────┤        ├───────────────┤        ├───────────────┤
 │ • HOD Admin   │        │ • HOD Admin   │        │ • HOD Admin   │        │ • HOD Admin   │
 │ • Faculty     │        │ • Faculty     │        │ • Faculty     │        │ • Faculty     │
 │ • CR Sections │        │ • CR Sections │        │ • CR Sections │        │ • CR Sections │
 │ • Students    │        │ • Students    │        │ • Students    │        │ • Students    │
 └───────────────┘        └───────────────┘        └───────────────┘        └───────────────┘
```

- **🏛️ HOD Portal**: Administers exclusively their own department's curriculum, faculty syllabus milestones, department notices, and student grievance triage.
- **👨‍🏫 Faculty Portal**: Publishes official exam dates, builds unit-wise course syllabi, and delegates coursework directly to departmental CRs.
- **👥 CR Command Desk**: Converts faculty delegations into verified classroom deadlines with OCR parsing and manages submission completion.
- **🎓 Student Timeline**: Real-time personalized academic feed displaying only deadlines, exams, and notices pertinent to their enrolled section and degree.

---

## ⚡ Core Platform Capabilities

- **Live SQLite Database Synchronization**: Real accounts enrolled via the registration portal are persisted immediately into the `Users` database table with 12-round bcrypt hashes.
- **Cryptographic Submission Engine**: Generates SHA-256 verification receipts with microsecond server timestamps for verifiable proof of assignment hand-in.
- **Permanent Cascading Deletion**: Deleting any account cleanly cascades through foreign keys (submissions, delegations, notices, syllabus units) with zero orphan records.
- **Automated Conflict Prevention (SQL Trigger)**: Blocks scheduling any assignment within 24 hours of an official exam or exceeding 3 high-urgency deadlines in a 48-hour window.
- **Interactive Three.js Workload Stress Orb**: Real-time WebGL particle sphere dynamically shifts color (Emerald $\to$ Amber $\to$ Ruby) and distortion frequency matching user stress levels.
- **NLP Sentiment Grievance Portal**: Anonymously captures student workload grievances, calculates sentiment polarity via NLP, and tags urgency levels (CRITICAL, HIGH, MEDIUM) for departmental HODs.
- **Smart OCR Rubric Extractor**: Computer Vision pipeline using `pytesseract` to extract deadline dates, titles, and course codes directly from uploaded assignment PDF files.
- **AI Study Time Estimator & 3D Pomodoro Timer**: Predicts preparation hours from assignment complexity and integrates a spatial 3D focus timer.

---

## 👥 Personas & Role Matrix

| Persona | Role ID | Scope | Clearance & Permissions |
| :---: | :---: | :--- | :--- |
| **🎓 Student** | 1 | Degree Section | View personalized deadlines, toggle submissions with crypto receipts, 3D focus timer, anonymous grievance filing |
| **👥 CR** | 2 | Class Section | Student clearance + publish deadlines, OCR document parsing, review faculty delegations |
| **👨‍🏫 Faculty** | 3 | Department Courses | Schedule official exams, author multi-unit course syllabi, delegate coursework to CRs, verify submission receipts |
| **🏛️ HOD** | 4 | Department-Wide | Full department oversight, publish master notices, triage student grievances, view audit logs |

---

## 🚀 Local Development & Quickstart

### Automatic Launch (Windows)
Double-click the bundled scripts in the project root:
1. `start_backend.bat` — Launches FastAPI on `http://localhost:8000`
2. `start_frontend.bat` — Launches React Vite on `http://localhost:5173`

### Manual Launch

#### 1. Backend Service (FastAPI)
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```
*API docs available at: `http://localhost:8000/docs` (Swagger UI)*

#### 2. Frontend Application (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Web client accessible at: `http://localhost:5173`*

---

## 🧪 Automated Verification Suite

Run the full system test suite covering authentication, RBAC, conflict triggers, and grievance sentiment:
```bash
cd backend
python test_system.py
```

---

## 🌐 Production Architecture

```
                 ┌────────────────────────────────┐
                 │       User Web Browser         │
                 └──────────────┬─────────────────┘
                                │ HTTPS
                                ▼
         ┌────────────────────────────────────────────────┐
         │     Vercel Edge Network (React 19 + Vite)      │
         │         https://chronoxsync.vercel.app         │
         └──────────────────────┬─────────────────────────┘
                                │ RESTful API / JWT Auth
                                ▼
         ┌────────────────────────────────────────────────┐
         │       Render Cloud Service (FastAPI + ASGI)    │
         │         https://chronoxsync.onrender.com       │
         └──────────────────────┬─────────────────────────┘
                                │ SQLite / Azure SQL
                                ▼
         ┌────────────────────────────────────────────────┐
         │   Persistent Relational Store (ACID 3NF)       │
         │   B-Tree Indexes • Bcrypt Hashes • FK Integrity│
         └────────────────────────────────────────────────┘
```

---

## 🔄 Automatic GitHub Sync

To commit and push future updates with 1-click:
- Simply double-click [`sync_to_github.bat`](./sync_to_github.bat) in the project root.
- It will automatically stage all modified files, create a structured Git commit, and push directly to `origin main`, triggering automatic live re-deployments on both Vercel and Render.

---

<p align="center">
  <b>Developed & Maintained by <a href="https://github.com/ankitsingh0311">ankitsingh0311</a></b> & <b><a href="https://github.com/KrishnaKumar-0123">KrishnaKumar-0123</a></b>
  <br />
  <em>Academic Workload & Multi-Department Synchronization Platform</em>
</p>
