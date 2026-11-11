// =============================================================================
// ChronoXSync — Autonomous Academic Workload Synchronizer & Governance Engine
// =============================================================================
// Public Institutional Introduction Page & Interactive Multi-Role Platform Tour
// Showcases genuine in-app components (WorkloadDensityGraph, TaskCard, ConflictModal,
// CryptoVerifierTerminal, ExecutiveProfileHeader) with 100% isolated sample datasets.
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Real ChronoSync In-App Components
import ExecutiveProfileHeader from '../components/ExecutiveProfileHeader';
import WorkloadDensityGraph from '../components/WorkloadDensityGraph';
import TaskCard from '../components/TaskCard';
import ConflictModal from '../components/ConflictModal';
import CryptoVerifierTerminal from '../components/CryptoVerifierTerminal';

import {
  GraduationCap, BookOpen, Users, Crown, ShieldCheck, CheckCircle2,
  Calendar, Clock, AlertTriangle, ArrowRight, Sparkles, Activity,
  BarChart2, FileText, CheckCircle, RefreshCw, Zap, Megaphone,
  Layers, Building2, MapPin, Search, ChevronRight, Award, Lock,
  Sun, Moon, ExternalLink, Send, CheckSquare, Square, Flame,
  TrendingUp, Laptop, ShieldAlert, UserCheck, MessageSquare, Info,
  Bell, Check, Timer, Play, Pause, RotateCcw, Upload, Terminal,
  Sliders, UserX, Eye, Code2, Database, Server, Cpu, Shield,
  Share2, ArrowUpRight, HelpCircle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Role Profiles (Sample Isolated Data)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_PROFILES = {
  student: {
    user_id: 101,
    full_name: 'Aarav Sharma',
    email: 'aarav.student@chronosync.ac',
    role_id: 1,
    role_name: 'STUDENT',
    designation: 'Scholar (B.Tech CSE)',
    department: 'School of Computer Science & Engineering',
    program: 'B.Tech Computer Science & Engineering',
    semester: 'Semester 3',
    university_name: 'Apex Institute of Science & Technology',
    university_logo_url: null,
    avatar_url: null,
    github_url: 'github.com/aarav-sharma-cse',
    linkedin_url: 'linkedin.com/in/aarav-sharma',
    gpa: '8.94',
    attendance: '88.5%',
  },
  faculty: {
    user_id: 202,
    full_name: 'Dr. Vikramaditya Sen',
    email: 'vikramaditya.faculty@chronosync.ac',
    role_id: 3,
    role_name: 'FACULTY',
    designation: 'Professor & Academic Coordinator',
    department: 'School of Computer Science & Engineering',
    program: 'Core CSE & Distributed Systems',
    semester: 'Semester 3 & 5',
    university_name: 'Apex Institute of Science & Technology',
    university_logo_url: null,
    avatar_url: null,
    github_url: 'github.com/dr-v-sen-dbms',
    linkedin_url: 'linkedin.com/in/dr-vikramaditya-sen',
    course_name: 'Database Management Systems (RDBMS & SQL)',
    course_code: 'CS-301',
  },
  cr: {
    user_id: 303,
    full_name: 'Priya Patel',
    email: 'priya.cr@chronosync.ac',
    role_id: 2,
    role_name: 'CR',
    designation: 'Class Representative (Section A)',
    department: 'School of Computer Science & Engineering',
    program: 'B.Tech Computer Science & Engineering',
    semester: 'Semester 3 - Sec A',
    university_name: 'Apex Institute of Science & Technology',
    university_logo_url: null,
    avatar_url: null,
    github_url: 'github.com/priya-patel-cr',
    linkedin_url: 'linkedin.com/in/priya-patel-cse',
    batch_size: 64,
  },
  hod: {
    user_id: 404,
    full_name: 'Dr. Rajesh Khanna',
    email: 'rajesh.hod@chronosync.ac',
    role_id: 4,
    role_name: 'HOD',
    designation: 'Head of Department & Dean of Computing',
    department: 'School of Computer Science & Engineering',
    program: 'All Computing Disciplines (Core, AIML, DS, Cyber)',
    semester: 'All Semesters (1 to 8)',
    university_name: 'Apex Institute of Science & Technology',
    university_logo_url: null,
    avatar_url: null,
    github_url: 'github.com/hod-computing-apex',
    linkedin_url: 'linkedin.com/in/dr-rajesh-khanna-hod',
    faculty_count: 28,
    student_count: 480,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Real Deadlines Sample Dataset
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_DEMO_DEADLINES = [
  {
    deadline_id: 1,
    title: 'Operating Systems: Virtual Memory Paging Simulator (C++)',
    description: 'Implement LRU, FIFO, and Optimal page replacement algorithms with TLB miss rate telemetry.',
    course_name: 'Operating Systems (CS-302)',
    course_code: 'CS-302',
    course_id: 2,
    due_date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    urgency: 'CRITICAL',
    submission_status: 'PENDING',
    study_hours: 6.5,
    assignment_points: 100,
    proof_of_submission_hash: null,
    author_role: 'Faculty',
    author_name: 'Prof. Sunita Rao',
  },
  {
    deadline_id: 2,
    title: 'Database Systems: B+ Tree Indexing & Query Execution Plans',
    description: 'Construct multi-level index structures and optimize EXPLAIN cost metrics for relational joins.',
    course_name: 'Database Management Systems (CS-301)',
    course_code: 'CS-301',
    course_id: 1,
    due_date: new Date(Date.now() + 68 * 3600 * 1000).toISOString(),
    urgency: 'HIGH',
    submission_status: 'PENDING',
    study_hours: 4.5,
    assignment_points: 100,
    proof_of_submission_hash: null,
    author_role: 'Faculty',
    author_name: 'Dr. Vikramaditya Sen',
  },
  {
    deadline_id: 3,
    title: 'Computer Networks: TCP 3-Way Handshake Wireshark PCAP',
    description: 'Capture TCP SYN/ACK traces, analyze sliding window buffer sizes, and document retransmissions.',
    course_name: 'Computer Networks (CS-304)',
    course_code: 'CS-304',
    course_id: 4,
    due_date: new Date(Date.now() + 118 * 3600 * 1000).toISOString(),
    urgency: 'MEDIUM',
    submission_status: 'PENDING',
    study_hours: 3.0,
    assignment_points: 50,
    proof_of_submission_hash: null,
    author_role: 'CR',
    author_name: 'Priya Patel (CR)',
  },
  {
    deadline_id: 4,
    title: 'Design & Analysis of Algorithms: Dynamic Programming Knapsack',
    description: 'Solve 0/1 Knapsack and Matrix Chain Multiplication with asymptotic time/space proofs.',
    course_name: 'Design & Analysis of Algorithms (CS-303)',
    course_code: 'CS-303',
    course_id: 3,
    due_date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    urgency: 'BALANCED',
    submission_status: 'DONE',
    study_hours: 4.0,
    assignment_points: 100,
    proof_of_submission_hash: '9f83a2c5b8e4d1f703a6c9e2b5d8f1a4e7c0b3d6a9f2e5c8b1d4a7f0e3c6b9a2',
    author_role: 'Faculty',
    author_name: 'Dr. S. K. Raman',
    submitted_filename: 'Aarav_Sharma_CS24B1089_DP_Knapsack.pdf',
    submission_receipt: {
      receipt_id: 'REC-2026-8812',
      sha256: '9f83a2c5b8e4d1f703a6c9e2b5d8f1a4e7c0b3d6a9f2e5c8b1d4a7f0e3c6b9a2',
      timestamp: '2026-11-08T18:24:12Z',
      verified: true,
      grade: '98 / 100',
    },
  },
];

const INITIAL_DEMO_EXAMS = [
  {
    exam_id: 1,
    title: 'Operating Systems Midterm Theory Examination',
    course_name: 'Operating Systems (CS-302)',
    exam_date: new Date(Date.now() + 80 * 3600 * 1000).toISOString(),
    exam_type: 'MIDTERM',
    room_number: 'Auditorium Hall B',
    prep_hours: 6.0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Interactive Explorer Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PublicDemoDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [activeRole, setActiveRole] = useState('student');
  const [toastMessage, setToastMessage] = useState(null);

  // Real Component States
  const [deadlines, setDeadlines] = useState(INITIAL_DEMO_DEADLINES);
  const [exams, setExams] = useState(INITIAL_DEMO_EXAMS);

  // 3D Conflict Modal Simulator State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictErrorText, setConflictErrorText] = useState('');

  // Attendance Margin Simulator
  const [attendedClasses, setAttendedClasses] = useState(38);
  const [totalClasses, setTotalClasses] = useState(44);

  // 5-Unit Syllabus Tracker State
  const [syllabusUnits, setSyllabusUnits] = useState([
    { id: 1, title: 'Unit 1: Relational Data Model, ER Diagrams & Normalization (1NF to BCNF)', done: true },
    { id: 2, title: 'Unit 2: Advanced SQL, Window Functions, Triggers & CTEs', done: true },
    { id: 3, title: 'Unit 3: Indexing Mechanisms (B+ Trees) & Query Execution Plans', done: true },
    { id: 4, title: 'Unit 4: ACID Concurrency Control, 2PL & Multi-Version Concurrency (MVCC)', done: false },
    { id: 5, title: 'Unit 5: Distributed Databases, NoSQL Models & CAP Theorem Applications', done: false },
  ]);

  // Pomodoro Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('FOCUS');

  // Student Search query in CR Roster
  const [studentSearch, setStudentSearch] = useState('');

  // HOD NLP Triage resolved list
  const [resolvedGrievances, setResolvedGrievances] = useState([]);

  // Toast feedback helper
  const triggerToast = (title, detail = 'Action successfully executed in interactive preview mode.') => {
    setToastMessage({ title, detail });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      triggerToast('Focus Interval Complete', 'Great work! Take a 5-minute restorative break.');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Toggle Task Status (ACID Simulation)
  const handleToggleTaskStatus = (deadlineId) => {
    setDeadlines((prev) =>
      prev.map((d) => {
        if (d.deadline_id === deadlineId) {
          const newStatus = d.submission_status === 'DONE' ? 'PENDING' : 'DONE';
          const mockHash = '4b82e1c9f0a7d3b5e8c2a1f9e6b4d7c0a3f8e2b5d1c4a7f9e3c6b8a1d5f2e7c0';
          return {
            ...d,
            submission_status: newStatus,
            proof_of_submission_hash: newStatus === 'DONE' ? mockHash : null,
          };
        }
        return d;
      })
    );
    triggerToast('Submission State Updated', 'Cryptographic SHA-256 seal recalculated and logged.');
  };

  // Syllabus Progress Calculator
  const syllabusProgress = useMemo(() => {
    const doneCount = syllabusUnits.filter((u) => u.done).length;
    return Math.round((doneCount / syllabusUnits.length) * 100);
  }, [syllabusUnits]);

  const activeProfile = DEMO_PROFILES[activeRole];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0b0f19' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        paddingBottom: '90px',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP INSTITUTIONAL NAVIGATION BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '64px',
          width: '100%',
          background: isDark ? 'rgba(11, 15, 25, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}
      >
        {/* Brandmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f54e00 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: '0 2px 10px rgba(245, 78, 0, 0.3)',
              }}
            >
              CX
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' }}>
              Chrono<span style={{ color: '#f54e00' }}>X</span>Sync
            </span>
          </div>

          {/* Quick Section Links (Desktop) */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '18px' }} className="md-nav-links">
            <a href="#roles" style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>
              Role Consoles
            </a>
            <a href="#core-features" style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>
              Platform Systems
            </a>
            <a href="#architecture" style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>
              Architecture
            </a>
          </nav>
        </div>

        {/* Action Controls & Authentication CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: isDark ? '#f8fafc' : '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login?mode=signin')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Lock size={13} />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #f54e00 0%, #ea580c 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(245, 78, 0, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Sparkles size={13} />
            Create Account
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PRODUCT HERO & VALUE PROPOSITION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 24px 36px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '9999px', background: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff', border: '1px solid rgba(37, 99, 235, 0.25)', color: '#2563eb', fontSize: '12px', fontWeight: 600, marginBottom: '20px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          Academic Workload Orchestration &amp; Governance
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 auto 20px auto',
            maxWidth: '920px',
            color: isDark ? '#ffffff' : '#0f172a',
          }}
        >
          The Zero-Conflict Operating System for Higher Education
        </h1>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: isDark ? '#94a3b8' : '#475569',
            maxWidth: '780px',
            margin: '0 auto 32px auto',
            lineHeight: 1.6,
          }}
        >
          Eliminate assignment collisions before exams, prevent student burnout, and guarantee tamper-proof coursework verification across Students, Faculty, Class Representatives, and Department Heads.
        </p>

        {/* Primary Hero Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '44px' }}>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('roles');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            Launch Interactive Tour
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Create Permanent Account
          </button>
        </div>

        {/* Key Platform Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '20px 24px',
            borderRadius: '14px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
            textAlign: 'left',
          }}
        >
          {[
            { label: 'Role-Based Consoles', val: '4 Personas', sub: 'Student, CR, Faculty, HOD' },
            { label: 'Exam Collision Guard', val: 'Zero Clashes', sub: 'Automated 24h & 48h locks' },
            { label: 'Submission Integrity', val: 'SHA-256 Proofs', sub: 'Tamper-proof digital receipts' },
            { label: 'Data Isolation', val: '100% Isolated Demo', sub: 'Zero private data exposed' },
          ].map((m, idx) => (
            <div key={idx} style={{ padding: '4px 8px' }}>
              <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: '3px 0' }}>{m.val}</div>
              <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE ROLE-ADAPTIVE WORKSPACES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="roles" style={{ maxWidth: '1340px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f54e00', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Interactive Workspace Preview
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
            Explore the Platform Through All Four Institutional Roles
          </h2>
          <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', margin: '6px 0 0 0', maxWidth: '750px' }}>
            Select any persona below to interact with their real dashboard tools, test conflict detection, view workload curves, and audit course milestones.
          </p>
        </div>

        {/* 4 Primary Role Persona Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { id: 'student', label: 'Student Scholar', roleName: 'Student', icon: GraduationCap, color: '#3b82f6', desc: 'Deadlines, Spline Curve, Focus Timer' },
            { id: 'cr', label: 'Class Representative', roleName: 'Class Representative', icon: Users, color: '#14b8a6', desc: 'Batch Scheduling, Student Roster, OCR' },
            { id: 'faculty', label: 'Course Faculty', roleName: 'Faculty Member', icon: BookOpen, color: '#f59e0b', desc: 'Syllabus Tracker, Exam Conflict Guard' },
            { id: 'hod', label: 'Department Head', roleName: 'Department Head', icon: Crown, color: '#ec4899', desc: '16-Week Burnout Matrix, AI Grievance Triage' },
          ].map((roleTab) => {
            const isSelected = activeRole === roleTab.id;
            const Icon = roleTab.icon;
            return (
              <button
                key={roleTab.id}
                type="button"
                onClick={() => {
                  setActiveRole(roleTab.id);
                  triggerToast(`Viewing ${roleTab.label} Console`, 'Active tools and data populated for this role.');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isSelected
                    ? `2px solid ${roleTab.color}`
                    : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  background: isSelected
                    ? (isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff')
                    : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 4px 14px ${roleTab.color}25` : 'none',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${roleTab.color}15`,
                    color: roleTab.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155') }}>
                    {roleTab.label}
                  </div>
                  <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {roleTab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Real In-App Executive Profile Header */}
        <ExecutiveProfileHeader
          overrideUser={activeProfile}
          roleLabel={activeProfile.designation}
          roleAccent={activeRole === 'student' ? '#3b82f6' : activeRole === 'cr' ? '#14b8a6' : activeRole === 'faculty' ? '#f59e0b' : '#ec4899'}
        />

        {/* ── A. STUDENT CONSOLE ── */}
        {activeRole === 'student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '20px' }}>
            {/* Workload Density Spline Graph */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Workload Density Telemetry
                  </h3>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '2px 0 0 0' }}>
                    Continuous 7-day spline curve calculating cognitive load from upcoming deadlines and exams.
                  </p>
                </div>
                <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700 }}>
                  ● Healthy Workload Pace
                </span>
              </div>
              <WorkloadDensityGraph
                stressLevel="LOW"
                pendingCount={3}
                deadlines={deadlines}
                exams={exams}
              />
            </div>

            {/* Priority Coursework Queue (TaskCards) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Coursework Deliverables &amp; Submissions
                  </h3>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '2px 0 0 0' }}>
                    Click "Mark Done" or "Submit Work" on any card below to test the cryptographic hash generator.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConflictErrorText('Exam Conflict Guard Triggered: Operating Systems Midterm is already scheduled on this date!');
                      setShowConflictModal(true);
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={13} />
                    Test 3D Conflict Crystal
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {deadlines.map((d) => (
                  <TaskCard
                    key={d.deadline_id}
                    deadline={d}
                    onToggleStatus={handleToggleTaskStatus}
                    onRefresh={() => triggerToast('Task Feed Refreshed')}
                  />
                ))}
              </div>
            </div>

            {/* Attendance & Focus Work Engine Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* Attendance Compliance & Safe Margin Calculator */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Attendance Compliance &amp; Buffer Calculator
                    </h3>
                    <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '2px 0 0 0' }}>
                      Enforces mandatory 75% institutional threshold.
                    </p>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: attendedClasses / totalClasses >= 0.75 ? '#10b981' : '#ef4444' }}>
                    {Math.round((attendedClasses / totalClasses) * 100)}%
                  </div>
                </div>

                <div style={{ height: '8px', borderRadius: '9999px', background: isDark ? '#1e293b' : '#e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((attendedClasses / totalClasses) * 100))}%`,
                      background: attendedClasses / totalClasses >= 0.75 ? '#10b981' : '#ef4444',
                      borderRadius: '9999px',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: isDark ? '#0f172a' : '#f8fafc', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {attendedClasses} Attended of {totalClasses} Total Lectures
                    </div>
                    <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                      {attendedClasses / totalClasses >= 0.75 ? 'Safe Buffer: You can miss up to 2 lectures safely.' : 'Attention: Must attend next 3 lectures to stay compliant.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendedClasses((c) => c + 1);
                        setTotalClasses((t) => t + 1);
                        triggerToast('Attendance Logged (+1 Attended)');
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Attended
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTotalClasses((t) => t + 1);
                        triggerToast('Absence Logged (+1 Total)');
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: '#ef4444', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Missed
                    </button>
                  </div>
                </div>
              </div>

              {/* Focus Pomodoro Work Engine */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Timer size={16} style={{ color: '#f54e00' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Spatial Focus Engine
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: 'rgba(245, 78, 0, 0.12)', color: '#f54e00' }}>
                    {timerMode} INTERVAL
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.04em', color: isDark ? '#ffffff' : '#0f172a' }}>
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 16px 0' }}>
                    Target: Operating Systems Virtual Memory Paging Simulator
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      style={{
                        padding: '9px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: timerRunning ? '#f54e00' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                      {timerRunning ? 'Pause' : 'Start Focus'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimerSeconds(25 * 60);
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        background: 'transparent',
                        color: isDark ? '#cbd5e1' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Submission Verifier */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Terminal size={16} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Cryptographic Submission Verifier
                </h3>
              </div>
              <CryptoVerifierTerminal embedded={true} />
            </div>
          </div>
        )}

        {/* ── B. FACULTY CONSOLE ── */}
        {activeRole === 'faculty' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '20px' }}>
            {/* 5-Unit Progressive Syllabus Tracker */}
            <div
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      5-Unit Curriculum Milestone Tracker
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                    Click any module checkbox to toggle teaching completion and see syllabus velocity update in real time.
                  </p>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>
                  {syllabusProgress}% Completed
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', borderRadius: '9999px', background: isDark ? '#1e293b' : '#e2e8f0', overflow: 'hidden', marginBottom: '18px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${syllabusProgress}%`,
                    background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {syllabusUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSyllabusUnits((prev) =>
                        prev.map((item) => (item.id === u.id ? { ...item, done: !item.done } : item))
                      );
                      triggerToast('Syllabus Unit Toggled', `Status updated for Unit ${u.id}.`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isDark ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${u.done ? 'rgba(245, 158, 11, 0.35)' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: u.done ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }}>
                      {u.done ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: u.done ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b') }}>
                        {u.title}
                      </div>
                      <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                        {u.done ? '✓ Verified Taught & Covered' : 'Scheduled for upcoming lecture series'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Conflict Guard & Student Grading Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* 48-Hour Exam Conflict Engine */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={16} style={{ color: '#f59e0b' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Exam Conflict Mitigation Engine
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 16px 0' }}>
                  Test whether an assignment or midterm violates the 48-hour collision policy.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConflictErrorText('48-Hour Collision: Operating Systems Midterm is already scheduled on this day!');
                      setShowConflictModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Simulate Collision Date
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerToast('Slot Verified Clear', 'No schedule conflicts detected in this 48-hour window.')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Simulate Clear Date
                  </button>
                </div>
              </div>

              {/* Student Evaluation Queue */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Student Submissions &amp; Grading Queue
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#f59e0b', fontWeight: 700 }}>
                    14 Pending Evaluation
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Rohan Mehta', uid: 'CS24-B1012', task: 'B+ Tree Indexing C++', status: 'Needs Grading' },
                    { name: 'Ananya Rao', uid: 'CS24-B1045', task: 'SQL Window Functions', status: 'Graded (96/100)' },
                    { name: 'Kabir Verma', uid: 'CS24-B1088', task: 'Query Cost Optimizer', status: 'Needs Grading' },
                  ].map((sub, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isDark ? '#0f172a' : '#f8fafc',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{sub.name}</span>
                        <div style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                          {sub.uid} • {sub.task}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerToast(`Evaluation Published for ${sub.name}`, 'Grade 95/100 and feedback recorded.')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: sub.status.includes('Needs') ? '#2563eb' : 'rgba(16, 185, 129, 0.15)',
                          color: sub.status.includes('Needs') ? '#ffffff' : '#10b981',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {sub.status.includes('Needs') ? 'Grade (95)' : '✓ Verified'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── C. CLASS REPRESENTATIVE CONSOLE ── */}
        {activeRole === 'cr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* OCR Timetable Extractor */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} style={{ color: '#14b8a6' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Document OCR Parser
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 16px 0' }}>
                  Extracts assignment deadlines, syllabus points, and weights directly from rubrics.
                </p>

                <div
                  onClick={() => triggerToast('OCR Schedule Parsed', 'Extracted 5 lectures and 2 lab milestones!')}
                  style={{
                    border: `2px dashed ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  }}
                >
                  <Upload size={24} style={{ color: '#14b8a6', marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Click to Simulate OCR Rubric Upload
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
                    Parses PDF problem sheets into calendar events.
                  </div>
                </div>
              </div>

              {/* Batch Broadcast Announcement */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Megaphone size={16} style={{ color: '#14b8a6' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Batch Broadcast
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 14px 0' }}>
                  Broadcast instant announcements directly to Section A (64 scholars).
                </p>

                <textarea
                  rows={2}
                  placeholder="e.g. Operating Systems Lab shifted to 02:00 PM in Lab 402..."
                  defaultValue="Lab 402 workstation displays replaced. Practice session starting at 02:00 PM."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    marginBottom: '10px',
                    resize: 'none',
                  }}
                />

                <button
                  type="button"
                  onClick={() => triggerToast('Broadcast Sent to Section A', 'Delivered to all 64 enrolled scholars via notification bell.')}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={13} />
                  Send to 64 Scholars
                </button>
              </div>
            </div>

            {/* Section A Student Directory Roster */}
            <div
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Section A Student Directory
                  </h3>
                  <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                    64 Registered Scholars • Section A Batch Management.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '11.5px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { roll: '01', name: 'Aarav Sharma', email: 'aarav.stu@chronosync.ac', att: '88.5%', status: 'Honors' },
                  { roll: '02', name: 'Aditi Deshmukh', email: 'aditi.stu@chronosync.ac', att: '92.0%', status: 'Honors' },
                  { roll: '03', name: 'Arjun Singhania', email: 'arjun.stu@chronosync.ac', att: '76.4%', status: 'Borderline' },
                  { roll: '04', name: 'Divya Iyer', email: 'divya.stu@chronosync.ac', att: '94.2%', status: 'Honors' },
                  { roll: '05', name: 'Harsh Vardhan', email: 'harsh.stu@chronosync.ac', att: '81.8%', status: 'Regular' },
                ]
                  .filter((st) => st.name.toLowerCase().includes(studentSearch.toLowerCase()))
                  .map((st) => (
                    <div
                      key={st.roll}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isDark ? '#0f172a' : '#f8fafc',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#14b8a6' }}>
                          #{st.roll}
                        </span>
                        <div>
                          <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{st.name}</span>
                          <span style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '6px' }}>
                            ({st.email})
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{st.att}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6' }}>
                          {st.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── D. HEAD OF DEPARTMENT CONSOLE ── */}
        {activeRole === 'hod' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '20px' }}>
            {/* 16-Week Burnout Stress Heatmap */}
            <div
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={16} style={{ color: '#ec4899' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Branch-Wide 16-Week Burnout Stress Heatmap
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                    16-week semester matrix aggregating deadline density and exam preparation hours across all programs.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  Department Oversight Mode
                </span>
              </div>

              {/* 16-Week Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {Array.from({ length: 16 }, (_, i) => {
                  const weekNum = i + 1;
                  const isPeak = weekNum === 8 || weekNum === 15;
                  const isModerate = weekNum === 7 || weekNum === 9 || weekNum === 14;
                  return (
                    <div
                      key={weekNum}
                      onClick={() => triggerToast(`Inspected Week ${weekNum}`, `Total estimated load: ${isPeak ? '48.5 hrs (Peak Exam Clash)' : isModerate ? '28.0 hrs' : '14.5 hrs'}`)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '8px',
                        background: isPeak ? 'rgba(239, 68, 68, 0.22)' : isModerate ? 'rgba(245, 158, 11, 0.18)' : (isDark ? '#0f172a' : '#f1f5f9'),
                        border: `1px solid ${isPeak ? '#ef4444' : isModerate ? '#f59e0b' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')}`,
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b' }}>W{weekNum}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isPeak ? '#ef4444' : isModerate ? '#f59e0b' : (isDark ? '#ffffff' : '#0f172a'), marginTop: '2px' }}>
                        {isPeak ? 'PEAK' : isModerate ? 'MOD' : 'LOW'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NLP Grievance Triage & Faculty Velocity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Anonymous Student Grievance Triage
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 14px 0' }}>
                  VADER/TextBlob sentiment NLP engine classifying anonymous student workload distress signals.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 1, title: 'Simultaneous midterms on Nov 19 & 20 causing acute stress', score: -0.74, severity: 'CRITICAL', prog: 'B.Tech CSE Sem 3' },
                    { id: 2, title: 'Lab 402 workstation displays causing practical exam delay', score: -0.42, severity: 'MODERATE', prog: 'AIML Sem 5' },
                  ].map((ticket) => {
                    const isDone = resolvedGrievances.includes(ticket.id);
                    return (
                      <div key={ticket.id} style={{ padding: '12px', borderRadius: '8px', background: isDark ? '#0f172a' : '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            {ticket.severity} (Score: {ticket.score})
                          </span>
                          <span style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b' }}>{ticket.prog}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>
                          "{ticket.title}"
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                          {isDone ? (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>✓ Relief Dispatched</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvedGrievances((g) => [...g, ticket.id]);
                                triggerToast('Intervention Dispatched', 'Exam schedule shifted +48 hours to eliminate burnout clash.');
                              }}
                              style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#ec4899', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Dispatch Relief
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Faculty Fleet Performance Table */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Faculty Fleet Velocity
                  </h3>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>28 Active Instructors</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Dr. Vikramaditya Sen', course: 'DBMS (CS-301)', progress: '74%' },
                    { name: 'Prof. Sunita Rao', course: 'Operating Systems (CS-302)', progress: '80%' },
                    { name: 'Dr. S. K. Raman', course: 'Algorithms (CS-303)', progress: '68%' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: isDark ? '#0f172a' : '#f8fafc', fontSize: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{f.name}</span>
                        <div style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b' }}>{f.course}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{f.progress} Velocity</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MASTER FEATURE DIRECTORY — ALL VERIFIED PLATFORM SYSTEMS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="core-features" style={{ maxWidth: '1340px', margin: '0 auto', padding: '24px 24px 56px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Engineered Capabilities
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
            Complete Master Platform Feature Directory
          </h2>
          <p style={{ fontSize: '14.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '8px auto 0 auto', maxWidth: '780px', lineHeight: 1.6 }}>
            Every capability built for real institutional users is showcased below. From automated database collision guards to live RFC-5545 iCalendar synchronization and 5-strike brute force SIEM defense.
          </p>
        </div>

        {/* 6 High-Fidelity Feature Clusters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '22px' }}>
          {/* Cluster 1: Conflict Prevention & Workload Distribution */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Collision &amp; Conflict Prevention Engine
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Automated ACID Database Constraint</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              The database trigger <code style={{ fontFamily: 'monospace', color: '#f54e00' }}>trg_PreventExamClash</code> intercepts any assignment submission scheduled within 24 hours of an examination, automatically aborting scheduling overlap.
            </p>
            <button
              type="button"
              onClick={() => {
                setConflictErrorText('Simulated Exam Collision: An official midterm exists within 24 hours on this date.');
                setShowConflictModal(true);
              }}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={14} />
              Open 3D WebGL Collision Crystal
            </button>
          </div>

          {/* Cluster 2: Cryptographic Submission & PDF Receipts */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Terminal size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Cryptographic Non-Repudiation Receipts
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>HMAC SHA-256 Verification Digests</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Every completed assignment generates an immutable 64-character SHA-256 digital wax seal binding user ID, deadline ID, microsecond timestamp, and server signature.
            </p>
            <button
              type="button"
              onClick={() => {
                triggerToast('Sample Digest Verified', 'Receipt REC-2026-8812 verified with status 200 OK.');
              }}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={14} />
              Test Sample Receipt Validation
            </button>
          </div>

          {/* Cluster 3: AI Document Intelligence & NLP Triage */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.12)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Document OCR &amp; NLP Sentiment Triage
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>PyMuPDF + VADER Polarity Scoring</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Extract course rubrics instantly via computer vision OCR while routing student distress signals anonymously without recording user ID or IP addresses.
            </p>
            <button
              type="button"
              onClick={() => triggerToast('OCR Extractor Active', 'Extracted: Course CS-301, 4 Milestones, Due in 68 hours.')}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                background: 'rgba(20, 184, 166, 0.08)',
                color: '#14b8a6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Upload size={14} />
              Simulate Document Extraction
            </button>
          </div>

          {/* Cluster 4: Dynamic iCalendar Feed (RFC 5545) */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Live RFC-5545 iCalendar Subscription
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Google, Apple &amp; Outlook Sync</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Each registered scholar receives an authenticated 64-character token generating a live webcal subscription feed with built-in VALARM notifications.
            </p>
            <button
              type="button"
              onClick={() => triggerToast('Calendar Token Generated', 'webcal://chronoxsync.onrender.com/api/v1/calendar/feed/7f9a2e...ics')}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={14} />
              Simulate Calendar Token Generation
            </button>
          </div>

          {/* Cluster 5: Multi-Tenant RBAC & Universal User Roster */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Institutional RBAC &amp; Administration
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Multi-Department Governance</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Full institutional administration allowing HODs to manage faculty, promote scholars to Class Representatives, and purge records with cascading integrity.
            </p>
            <button
              type="button"
              onClick={() => triggerToast('Roster Loaded', 'Viewing 480 enrolled students and 28 faculty members.')}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                background: 'rgba(236, 72, 153, 0.08)',
                color: '#ec4899',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserCheck size={14} />
              Preview Department Directory
            </button>
          </div>

          {/* Cluster 6: SIEM Security & Permanent Persistence */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 78, 0, 0.12)', color: '#f54e00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Enterprise SIEM Security &amp; Persistence
                </h3>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>5-Strike Account Lockout + Cloud Sync</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              All auth events are logged to the SIEM audit stream. Failed password attempts trigger automated account lockout, and records persist across server boots.
            </p>
            <button
              type="button"
              onClick={() => triggerToast('SIEM Security Active', '5-Strike lockout guard enabled; 12-round bcrypt hash at rest.')}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 78, 0, 0.3)',
                background: 'rgba(245, 78, 0, 0.08)',
                color: '#f54e00',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} />
              Inspect Security Audit Status
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. SYSTEM ARCHITECTURE & TECHNICAL FOUNDATIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="architecture" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 56px 24px' }}>
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '36px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f54e00', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Decoupled Distributed Architecture
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
              Engineered with 3-Tier Enterprise Specifications
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Presentation Tier */}
            <div style={{ padding: '18px', borderRadius: '12px', background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Laptop size={18} style={{ color: '#3b82f6' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Presentation Tier
                </h4>
              </div>
              <ul style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#475569', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                <li>React 19 SPA with Vite bundler</li>
                <li>Three.js &amp; React-Three-Fiber WebGL shaders</li>
                <li>Tailwind CSS &amp; Framer Motion physics</li>
                <li>Dynamic dual-theme engine (Light / Dark)</li>
              </ul>
            </div>

            {/* Application Tier */}
            <div style={{ padding: '18px', borderRadius: '12px', background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Server size={18} style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Application Tier
                </h4>
              </div>
              <ul style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#475569', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                <li>FastAPI ASGI asynchronous engine (Python 3.11+)</li>
                <li>Stateless JWT Token authentication with RBAC</li>
                <li>VADER &amp; TextBlob natural language triage</li>
                <li>APScheduler background reminder daemon</li>
              </ul>
            </div>

            {/* Persistence Tier */}
            <div style={{ padding: '18px', borderRadius: '12px', background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Database size={18} style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Persistence Tier
                </h4>
              </div>
              <ul style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#475569', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                <li>Strict Third Normal Form (3NF) relational schema</li>
                <li>14 Normalized entities with B-Tree indexes</li>
                <li>ACID trigger <code style={{ fontFamily: 'monospace' }}>trg_PreventExamClash</code></li>
                <li>Automated cloud registry hydration on boot</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CALL TO ACTION & GETTING STARTED */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 78, 0, 0.12) 0%, rgba(37, 99, 235, 0.12) 100%)',
            border: `1px solid ${isDark ? 'rgba(245, 78, 0, 0.3)' : 'rgba(37, 99, 235, 0.25)'}`,
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' }}>
            Ready to Synchronize Your Academic Institution?
          </h2>
          <p style={{ fontSize: '15px', color: isDark ? '#94a3b8' : '#475569', maxWidth: '640px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
            Join faculty and students already organizing coursework, eliminating exam conflicts, and securing assignment proofs.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f54e00 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(245, 78, 0, 0.35)',
              }}
            >
              <Sparkles size={16} />
              Create Free Account
            </button>
            <button
              type="button"
              onClick={() => navigate('/login?mode=signin')}
              style={{
                padding: '12px 26px',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1'}`,
                background: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Lock size={15} />
              Sign In to Existing Portal
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. INSTITUTIONAL FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          padding: '36px 28px',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #f54e00 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            CX
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
              ChronoXSync
            </div>
            <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>
              Autonomous Academic Temporal Synchronizer
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12.5px', color: isDark ? '#94a3b8' : '#64748b' }}>
          <a
            href="https://github.com/ankitsingh0311/ChronoXSync"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            GitHub Repository
            <ArrowUpRight size={13} />
          </a>
          <a
            href="https://chronoxsync.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            FastAPI OpenAPI Docs
            <ArrowUpRight size={13} />
          </a>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Portal Login
          </button>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. REAL 3D CONFLICT MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ConflictModal
        isOpen={showConflictModal}
        errorDetails={conflictErrorText}
        onClose={() => setShowConflictModal(false)}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. FLOATING BOTTOM ROLE TOGGLE DOCK */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 45,
          background: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
          borderRadius: '9999px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Laptop size={13} />
          <span>Console:</span>
        </div>

        {[
          { id: 'student', label: 'Student', color: '#3b82f6' },
          { id: 'cr', label: 'CR Rep', color: '#14b8a6' },
          { id: 'faculty', label: 'Faculty', color: '#f59e0b' },
          { id: 'hod', label: 'HOD', color: '#ec4899' },
        ].map((r) => {
          const isSelected = activeRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setActiveRole(r.id);
                triggerToast(`Viewing ${r.label} Console`);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: isSelected ? r.color : 'transparent',
                color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                fontSize: '11.5px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          );
        })}

        <div style={{ width: '1px', height: '18px', background: isDark ? '#334155' : '#cbd5e1', margin: '0 2px' }} />

        <button
          type="button"
          onClick={() => navigate('/signup')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: 'linear-gradient(135deg, #f54e00 0%, #ea580c 100%)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245, 78, 0, 0.35)',
          }}
        >
          <Sparkles size={12} />
          <span>Create Account</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. TOAST NOTIFICATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '24px',
              zIndex: 60,
              maxWidth: '380px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#3b82f6' : '#bfdbfe'}`,
              borderRadius: '12px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Zap size={14} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                  {toastMessage.title}
                </div>
                <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                  {toastMessage.detail}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{
                    marginTop: '8px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Create Permanent Account
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
