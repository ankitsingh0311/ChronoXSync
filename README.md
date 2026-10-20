<p align="center">
  <h1 align="center">⚡ ChronoXSync</h1>
  <p align="center">
    <strong>AI-Powered Academic Workload Orchestration & Multi-Department Synchronization Platform</strong>
  </p>
  <p align="center">
    <em>Architected with Spatial Glassmorphism, Three.js 3D Shaders, FastAPI, 3NF Relational SQL, and NLP Sentiment AI.</em>
  </p>
</p>

<p align="center">
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Database-SQLite%20%2F%20Azure%20SQL-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="Database" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Vite-8.3.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Security-bcrypt%20%2B%20JWT-red?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="Security" /></a>
  <a href="https://github.com/ankitsingh0311/ChronoXSync"><img src="https://img.shields.io/badge/Author-ankitsingh0311-blue?style=for-the-badge&logo=github" alt="Author" /></a>
</p>

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

- **HOD Portal**: Administers exclusively their own department's curriculum, faculty syllabus milestones, department notices, and student grievance triage.
- **Faculty Portal**: Publishes official exam dates, builds unit-wise course syllabi, and delegates coursework directly to departmental CRs.
- **CR Command Desk**: Converts faculty delegations into verified classroom deadlines with OCR parsing and manages submission completion.
- **Student Timeline**: Real-time personalized academic feed displaying only deadlines, exams, and notices pertinent to their enrolled section and degree.

---

## ⚡ Core Platform Capabilities

- **Live SQLite Database Synchronization**: Real accounts enrolled via the registration portal are persisted immediately into the `Users` database table and reflected dynamically in the Quick Test Roster.
- **Permanent Cascading Deletion**: Deleting any account cleanly cascades through foreign keys (submissions, delegations, notices, syllabus units) with zero orphan records.
- **Automated Conflict Prevention (SQL Trigger)**: Blocks scheduling any assignment within 24 hours of an official exam or exceeding 3 high-urgency deadlines in a 48-hour window.
- **Interactive Three.js Workload Stress Orb**: Real-time WebGL particle sphere dynamically shifts color (Emerald $\to$ Amber $\to$ Ruby) and distortion frequency matching user stress levels.
- **NLP Sentiment Grievance Portal**: Anonymously captures student workload grievances, calculates sentiment polarity via NLP, and tags urgency levels (CRITICAL, HIGH, MEDIUM) for departmental HODs.
- **Smart OCR Rubric Extractor**: Computer Vision pipeline using `pytesseract` to extract deadline dates, titles, and course codes directly from uploaded assignment PDF files.
- **AI Study Time Estimator & 3D Pomodoro Timer**: Predicts preparation hours from assignment complexity and integrates a spatial 3D focus timer.

---

## 👥 Personas & Pre-Configured Test Accounts

**Standard Test Password:** `EduTrack@2024`

| Persona | Role ID | Scope | Clearance & Permissions |
| :---: | :---: | :--- | :--- |
| **Student** | 1 | Degree Section | View deadlines, toggle atomic submissions, 3D focus timer, anonymous grievance filing |
| **CR** | 2 | Class Section | Student clearance + publish deadlines, OCR document parsing, review faculty delegations |
| **Faculty** | 3 | Department Courses | Schedule official exams, author multi-unit course syllabi, delegate coursework to CRs |
| **HOD** | 4 | Department-Wide | Full department oversight, publish master notices, triage student grievances, view audit logs |

---

## 🚀 Quickstart & Setup Guide

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

## 🌐 Production Deployment

### Backend (e.g., Render, Railway, Fly.io)
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Environment:** Populate variables from `backend/.env.example`

### Frontend (e.g., Vercel, Netlify, Cloudflare Pages)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment:** Set `VITE_API_URL` to your production backend URL

---

## 🔄 Automatic GitHub Sync

To commit and push future updates with 1-click:
- Simply double-click [`sync_to_github.bat`](file:///c:/Users/ankit%20singh/Downloads/chrono_sync_new/chrono_sync/sync_to_github.bat) in the project root.
- It will automatically stage all modified files, create a structured Git commit, and push directly to `origin main`.

---

<p align="center">
  <b>Developed & Maintained by <a href="https://github.com/ankitsingh0311">ankitsingh0311</a></b><br>
  Academic Workload & Multi-Department Synchronization Platform
</p>
