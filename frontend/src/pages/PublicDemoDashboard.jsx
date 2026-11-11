// =============================================================================
// ChronoXSync — Autonomous Academic Temporal Synchronizer & Governance Engine
// =============================================================================
// High-Fidelity Public Interactive Platform Tour & Role-Adaptive Workspace
// Features genuine in-app components (WorkloadDensityGraph, TaskCard, ConflictModal,
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
  Sliders, UserX, Eye
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Role Profiles
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
    title: 'Operating Systems — Virtual Memory Paging Simulator (C++)',
    description: 'Implement LRU, FIFO, and Optimal page replacement algorithms with TLB miss rate analysis.',
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
    title: 'Database Management Systems — B+ Tree Indexing & Query Tuning',
    description: 'Construct multi-level index structures and optimize EXPLAIN query plans for complex JOINs.',
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
    title: 'Computer Networks — TCP 3-Way Handshake Wireshark PCAP Analysis',
    description: 'Capture live TCP SYN/ACK handshakes, analyze sliding window buffer sizes, and document retransmissions.',
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
    title: 'Design & Analysis of Algorithms — Dynamic Programming DP-Knapsack',
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
  const [activeTab, setActiveTab] = useState('deadlines');
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
  const [timerMode, setTimerMode] = useState('FOCUS'); // 'FOCUS' | 'BREAK'

  // Student Search query in CR Roster
  const [studentSearch, setStudentSearch] = useState('');

  // HOD NLP Triage resolved list
  const [resolvedGrievances, setResolvedGrievances] = useState([]);

  // Toast feedback helper
  const triggerToast = (title, detail = 'Action successfully executed in interactive preview mode!') => {
    setToastMessage({ title, detail });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 5000);
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
      triggerToast('Focus Interval Complete', 'Great work! Take a 5-minute breather.');
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
        background: isDark ? '#0a0e17' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        paddingBottom: '90px',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP INSTITUTIONAL PLATFORM HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '62px',
          width: '100%',
          background: isDark ? 'rgba(10, 14, 23, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* Brandmark + Public Exploration Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f54e00 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: '0 2px 10px rgba(245, 78, 0, 0.35)',
              }}
            >
              CX
            </div>
            <div>
              <span style={{ fontSize: '16.5px', fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' }}>
                Chrono<span style={{ color: '#f54e00' }}>X</span>Sync
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            LIVE INSTITUTIONAL PLATFORM TOUR
          </div>
        </div>

        {/* Global CTAs & Authentication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login?mode=signin')}
            style={{
              padding: '7px 15px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lock size={13} />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #f54e00 0%, #ea580c 100%)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(245, 78, 0, 0.35)',
            }}
          >
            <Sparkles size={13} />
            Create Account
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. INTRODUCTION & LIVE ROLE SELECTOR BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 12px 24px' }}>
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
            borderRadius: '16px',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f54e00', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>
                  Autonomous Academic Command Center
                </span>
                <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>•</span>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Explore all 4 real role consoles</span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' }}>
                ChronoSync Real Feature Explorer &amp; Interactive Workspace
              </h1>
              <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '6px 0 0 0', maxWidth: '820px', lineHeight: 1.5 }}>
                Interact with the actual production components built for ChronoSync. Switch between the 4 institutional personas below to test deadline collision guards, SVG workload spline curves, 5-unit syllabus milestone tracking, and cryptographic submission verifiers.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Register Institutional Account
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 4 Primary Role Persona Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '18px',
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
            }}
          >
            {[
              { id: 'student', label: '1. Student Scholar Console', roleName: 'Student', icon: GraduationCap, color: '#3b82f6', desc: 'Deadlines, Spline Curve & Attendance' },
              { id: 'cr', label: '2. Class Representative (CR) Hub', roleName: 'Class Representative', icon: Users, color: '#14b8a6', desc: 'Batch Scheduling & OCR Scanner' },
              { id: 'faculty', label: '3. Faculty Academic Suite', roleName: 'Faculty Member', icon: BookOpen, color: '#f59e0b', desc: '5-Unit Syllabus & 48h Conflict Guard' },
              { id: 'hod', label: '4. HOD Executive Governance', roleName: 'Department Head', icon: Crown, color: '#ec4899', desc: '16-Week Burnout Matrix & NLP Triage' },
            ].map((roleTab) => {
              const isSelected = activeRole === roleTab.id;
              const Icon = roleTab.icon;
              return (
                <button
                  key={roleTab.id}
                  type="button"
                  onClick={() => {
                    setActiveRole(roleTab.id);
                    setActiveTab(roleTab.id === 'student' ? 'deadlines' : roleTab.id === 'faculty' ? 'syllabus' : roleTab.id === 'cr' ? 'batch' : 'heatmap');
                    triggerToast(`Switched to ${roleTab.label}`, 'Previewing genuine in-app workflow for this institutional role.');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected
                      ? `2px solid ${roleTab.color}`
                      : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    background: isSelected
                      ? (isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff')
                      : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${roleTab.color}15`,
                      color: roleTab.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155') }}>
                      {roleTab.label}
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {roleTab.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. REAL CHRONOSYNC INTERACTIVE WORKSPACE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {/* Real In-App Executive Profile Header */}
        <ExecutiveProfileHeader
          overrideUser={activeProfile}
          roleLabel={activeProfile.designation}
          roleAccent={activeRole === 'student' ? '#3b82f6' : activeRole === 'cr' ? '#14b8a6' : activeRole === 'faculty' ? '#f59e0b' : '#ec4899'}
        />

        {/* ── A. STUDENT INTERACTIVE CONSOLE ── */}
        {activeRole === 'student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Real Feature F9: SVG Workload Density Spline Graph */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} style={{ color: '#f54e00' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Feature F9: Precision SVG Workload Density Spline Graph
                  </h2>
                </div>
                <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                  7-Day Trajectory Telemetry
                </span>
              </div>
              <WorkloadDensityGraph
                stressLevel="LOW"
                pendingCount={3}
                deadlines={deadlines}
                exams={exams}
              />
            </div>

            {/* Real Feature F1: Priority Task Cards with 3D Tilt & Cryptographic Submissions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Feature F1: Academic Deadline Queue &amp; Task Cards
                  </h2>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                    Micro-interaction 3D tilt, AI study hours estimation, and tamper-proof submission seal.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConflictErrorText('Collision Detected with Operating Systems Midterm Examination (<24h constraint violation)!');
                      setShowConflictModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
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
              {/* Interactive Attendance Compliance & Safe Margin Calculator */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Attendance &amp; Safe Buffer Calculator
                    </h3>
                    <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                      Predictive compliance against mandatory 75% institutional threshold.
                    </p>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: attendedClasses / totalClasses >= 0.75 ? '#10b981' : '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                    {Math.round((attendedClasses / totalClasses) * 100)}%
                  </div>
                </div>

                <div style={{ height: '8px', borderRadius: '9999px', background: isDark ? '#1e293b' : '#e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((attendedClasses / totalClasses) * 100))}%`,
                      background: attendedClasses / totalClasses >= 0.75 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : '#ef4444',
                      borderRadius: '9999px',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: isDark ? '#0f172a' : '#f8fafc', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {attendedClasses} Attended of {totalClasses} Total Lectures
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                      {attendedClasses / totalClasses >= 0.75 ? 'Safe Buffer: You can miss up to 2 lectures safely.' : 'Critical: Must attend next 3 lectures!'}
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
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Attended
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTotalClasses((t) => t + 1);
                        triggerToast('Absence Logged (+0 Attended, +1 Total)');
                      }}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Missed
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { sub: 'CS-301 Database Systems', att: '32 / 36', pct: '88.9%' },
                    { sub: 'CS-302 Operating Systems', att: '34 / 38', pct: '89.5%' },
                    { sub: 'CS-304 Computer Networks', att: '28 / 34', pct: '82.4%' },
                  ].map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', padding: '6px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}` }}>
                      <span style={{ color: isDark ? '#cbd5e1' : '#334155' }}>{s.sub}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10b981' }}>{s.att} ({s.pct})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature F11: Focus Pomodoro Work Engine */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Timer size={16} style={{ color: '#f54e00' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Feature F11: Focus Pomodoro Engine
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(245, 78, 0, 0.12)', color: '#f54e00' }}>
                    {timerMode}
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '54px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.04em', color: isDark ? '#ffffff' : '#0f172a' }}>
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 16px 0' }}>
                    Target: Operating Systems Paging Simulator Implementation
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
                        display: 'flex',
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

            {/* Feature F4: Cryptographic Receipt Verifier Terminal */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Terminal size={16} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Feature F4: Cryptographic Proof of Submission Verifier Terminal
                </h3>
              </div>
              <CryptoVerifierTerminal embedded={true} />
            </div>
          </div>
        )}

        {/* ── B. FACULTY INTERACTIVE CONSOLE ── */}
        {activeRole === 'faculty' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Feature F15: 5-Unit Progressive Syllabus Milestone Tracker */}
            <div
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Feature F15: 5-Unit Progressive Syllabus Milestone Tracker
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                    Click unit checkboxes to toggle teaching completion milestones and verify live syllabus velocity.
                  </p>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>
                  {syllabusProgress}% Completed
                </div>
              </div>

              {/* Velocity Bar */}
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

              {/* Units Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {syllabusUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSyllabusUnits((prev) =>
                        prev.map((item) => (item.id === u.id ? { ...item, done: !item.done } : item))
                      );
                      triggerToast('Syllabus Unit Toggled', `Milestone status updated for Unit ${u.id}.`);
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
                        {u.done ? '✓ Verified Taught & Completed' : 'Pending Teaching Schedule'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature F2 & F12: 48-Hour Exam Publisher & Student Evaluation Queue */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* 48-Hour Exam Conflict Mitigation Simulator */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={16} style={{ color: '#f59e0b' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Feature F2/F12: 48-Hour Exam Conflict Engine
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 16px 0' }}>
                  Verify whether a proposed examination slot violates the institutional 48-hour collision policy.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConflictErrorText('48-Hour Collision: Operating Systems Midterm is already scheduled within 24 hours of this window!');
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

              {/* Student Submission Evaluation Queue */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Student Submissions &amp; Grading Queue
                  </h3>
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
                    14 Pending
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

        {/* ── C. CLASS REPRESENTATIVE (CR) INTERACTIVE CONSOLE ── */}
        {activeRole === 'cr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Feature F6: OCR Schedule Extractor & Batch Command Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* Feature F6 OCR Extractor */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} style={{ color: '#14b8a6' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Feature F6: OCR Timetable &amp; Schedule Extractor
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 16px 0' }}>
                  Optical character recognition engine parsing classroom schedules into structured deadlines.
                </p>

                <div
                  onClick={() => triggerToast('OCR Schedule Parsed', 'Successfully extracted 5 lectures and 2 lab milestones!')}
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
                    Click to Simulate OCR Timetable Upload
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
                    Processes JPEG, PNG, or PDF rosters into calendar events.
                  </div>
                </div>
              </div>

              {/* Class Broadcast Announcement */}
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Megaphone size={16} style={{ color: '#14b8a6' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Batch Broadcast &amp; Grievance Relay
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 14px 0' }}>
                  Broadcast announcements directly to Section A (64 scholars).
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
                  onClick={() => triggerToast('Broadcast Sent to Section A', 'Delivered to all 64 enrolled scholars via in-app notification.')}
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
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                borderRadius: '16px',
                padding: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
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
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#14b8a6' }}>
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
                        <span style={{ fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>{st.att}</span>
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

        {/* ── D. HEAD OF DEPARTMENT (HOD) INTERACTIVE CONSOLE ── */}
        {activeRole === 'hod' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Feature F7: 16-Week Burnout Stress Heatmap Preview */}
            <div
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={16} style={{ color: '#ec4899' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Feature F7: Branch-Wide 16-Week Burnout Stress Heatmap
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                    16-week semester matrix aggregating deadline density and exam preparation hours across all programs.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  HOD God-View Mode
                </span>
              </div>

              {/* 16-Week Heatmap Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {Array.from({ length: 16 }, (_, i) => {
                  const weekNum = i + 1;
                  const isPeak = weekNum === 8 || weekNum === 15;
                  const isModerate = weekNum === 7 || weekNum === 9 || weekNum === 14;
                  return (
                    <div
                      key={weekNum}
                      onClick={() => triggerToast(`Inspected Week ${weekNum}`, `Total estimated study load: ${isPeak ? '48.5 hrs (Peak)' : isModerate ? '28.0 hrs' : '14.5 hrs'}`)}
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

            {/* Feature F5: Real-Time NLP Panic & Grievance Anomaly Triage */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Feature F5: NLP Grievance &amp; Distress Triage
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 14px 0' }}>
                  VADER/TextBlob sentiment NLP engine detecting student workload burnout signals.
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
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Faculty Fleet Velocity
                  </h3>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>28 Professors Active</span>
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
                      <span style={{ fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>{f.progress} Velocity</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. REAL 3D CONFLICT MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ConflictModal
        isOpen={showConflictModal}
        errorDetails={conflictErrorText}
        onClose={() => setShowConflictModal(false)}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. FLOATING BOTTOM DOCK WITH DIRECT ACCOUNT CREATION */}
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
          <span>Role View:</span>
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
                triggerToast(`Role set to ${r.label}`);
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
      {/* 6. TOAST NOTIFICATION */}
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
                  Register Permanent Account
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
