// =============================================================================
// ChronoXSync — Public Interactive Demo Dashboard & Landing Experience
// =============================================================================
// High-fidelity public landing portal allowing visitors to experience all 4
// institutional role dashboards (Student, Faculty, CR, HOD) with realistic,
// completely isolated dummy data. Provides seamless pathways to Login & Signup.
// =============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap, BookOpen, Users, Crown, ShieldCheck, CheckCircle2,
  Calendar, Clock, AlertTriangle, ArrowRight, Sparkles, Activity,
  BarChart2, FileText, CheckCircle, RefreshCw, Zap, Megaphone,
  Layers, Building2, MapPin, Search, ChevronRight, Award, Lock,
  Sun, Moon, ExternalLink, Send, CheckSquare, Square, Flame,
  TrendingUp, Laptop, ShieldAlert, UserCheck, MessageSquare, Info,
  Bell, Check
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Role Configuration & Theming
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_ROLES = [
  {
    id: 'student',
    title: 'Student Scholar',
    shortLabel: 'Student',
    icon: GraduationCap,
    badge: 'Scholar Console',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.28)',
    accent: '#34d399',
    description: 'Autonomous workload tracking, 48h deadline conflict mitigation, and attendance buffer intelligence.',
  },
  {
    id: 'faculty',
    title: 'Faculty Member',
    shortLabel: 'Faculty',
    icon: BookOpen,
    badge: 'Professor Suite',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.28)',
    accent: '#fbbf24',
    description: 'Coursework orchestration, 5-unit syllabus milestone tracking, and automated exam collision checks.',
  },
  {
    id: 'cr',
    title: 'Class Representative',
    shortLabel: 'CR Rep',
    icon: Users,
    badge: 'Coordinator Hub',
    color: '#14b8a6',
    bgLight: 'rgba(20, 184, 166, 0.08)',
    border: 'rgba(20, 184, 166, 0.28)',
    accent: '#2dd4bf',
    description: 'Batch schedule management, class broadcast announcements, and student grievance relay dispatch.',
  },
  {
    id: 'hod',
    title: 'Head of Department',
    shortLabel: 'HOD Executive',
    icon: Crown,
    badge: 'Executive Governance',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.28)',
    accent: '#f472b6',
    description: 'Department-wide 16-week burnout heatmaps, faculty fleet velocity, and real-time NLP stress triage.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PublicDemoDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [activeRole, setActiveRole] = useState('student');
  const [toastMessage, setToastMessage] = useState(null);

  // ── Simulated Interactive States ──
  // Student Attendance Simulator
  const [attendedClasses, setAttendedClasses] = useState(38);
  const [totalClasses, setTotalClasses] = useState(44);

  // Faculty 5-Unit Syllabus Interactive Checkmarks
  const [syllabusUnits, setSyllabusUnits] = useState([
    { id: 1, title: 'Unit 1: Relational Data Model & Normalization (1NF to BCNF)', done: true },
    { id: 2, title: 'Unit 2: Advanced SQL, Window Functions & Triggers', done: true },
    { id: 3, title: 'Unit 3: Indexing Structures (B+ Trees) & Query Optimizers', done: true },
    { id: 4, title: 'Unit 4: ACID Concurrency Control & Distributed MVCC', done: false },
    { id: 5, title: 'Unit 5: NoSQL Document Stores & Distributed Sharding', done: false },
  ]);

  // Exam Conflict Checker State (Faculty / CR)
  const [examCheckDate, setExamCheckDate] = useState('2026-11-18');
  const [conflictResult, setConflictResult] = useState(null);

  // Student Search in CR Roster
  const [crStudentQuery, setCrStudentQuery] = useState('');

  // HOD NLP Triage resolved tickets
  const [resolvedTickets, setResolvedTickets] = useState([]);

  // Trigger feedback toast for simulated actions
  const triggerSimulatedAction = (actionTitle) => {
    setToastMessage({
      title: actionTitle,
      detail: 'Simulated in Public Demo Mode. Create an institutional account to persist permanently to the live database!',
    });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === actionTitle ? null : prev));
    }, 5500);
  };

  // Calculate live syllabus percentage
  const syllabusProgress = useMemo(() => {
    const completed = syllabusUnits.filter((u) => u.done).length;
    return Math.round((completed / syllabusUnits.length) * 100);
  }, [syllabusUnits]);

  // Toggle syllabus unit
  const handleToggleUnit = (id) => {
    setSyllabusUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, done: !u.done } : u))
    );
    triggerSimulatedAction('Syllabus Unit Milestone Updated');
  };

  // Run mock 48h exam collision check
  const handleCheckConflict = () => {
    if (examCheckDate === '2026-11-18' || examCheckDate === '2026-11-19') {
      setConflictResult({
        hasConflict: true,
        message: '⚠️ 48-Hour Collision Detected! Operating Systems Midterm is already scheduled for Semester 3 on Nov 19. Suggested alternate window: Nov 22 or Nov 23.',
      });
    } else {
      setConflictResult({
        hasConflict: false,
        message: '✓ No Conflicts Detected! Academic calendar slot is 100% clear with zero 48-hour deadline overlaps.',
      });
    }
    triggerSimulatedAction('48h Conflict Detection Engine Run');
  };

  const activeRoleData = DEMO_ROLES.find((r) => r.id === activeRole) || DEMO_ROLES[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0a0e17' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        transition: 'background 0.2s ease, color 0.2s ease',
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP PUBLIC NAVIGATION BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '64px',
          width: '100%',
          background: isDark ? 'rgba(10, 14, 23, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* Brand & Live Demo Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                fontSize: '15px',
                boxShadow: '0 2px 10px rgba(245, 78, 0, 0.28)',
              }}
            >
              CX
            </div>
            <div>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
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
              border: '1px solid rgba(37, 99, 235, 0.3)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            LIVE DEMO DASHBOARD
          </div>
        </div>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
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
              transition: 'all 0.15s ease',
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Institutional Sign In */}
          <button
            type="button"
            onClick={() => navigate('/login?mode=signin')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Lock size={14} />
            Sign In
          </button>

          {/* Create Account / Register */}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} />
            Create Account
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO WELCOME & PLATFORM INTRODUCTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '40px 24px 24px 24px',
        }}
      >
        <div
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(245, 78, 0, 0.06) 100%)'
              : 'linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%)',
            borderRadius: '18px',
            border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.25)' : '#bfdbfe'}`,
            padding: '36px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            {/* Tagline */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.1)',
                color: isDark ? '#93c5fd' : '#1d4ed8',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              <Zap size={13} />
              Interactive Institutional Previews
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 3.8vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.18,
                margin: '0 0 14px 0',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              Autonomous Academic Workload, Attendance &amp; Governance Command Center
            </h1>

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: isDark ? '#94a3b8' : '#475569',
                margin: '0 0 24px 0',
              }}
            >
              Welcome to the public interactive preview of <strong>ChronoXSync</strong>. Explore all four institutional
              roles below using 100% isolated, realistic dummy records. Test attendance margin calculators, 5-unit syllabus milestone tracking, 48-hour exam collision mitigation, and NLP grievance anomaly triage before signing up.
            </p>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  padding: '11px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                }}
              >
                Get Started Free
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login?mode=signin')}
                style={{
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={15} />
                Sign In With Existing Account
              </button>
            </div>
          </div>

          {/* Platform Highlight Badges */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {[
              { label: 'Role-Based Architecture', val: '4 Dedicated Portals', desc: 'Student, CR, Faculty & HOD' },
              { label: 'Collision Mitigation', val: '48h Conflict Guard', desc: 'Zero deadline overlap policy' },
              { label: 'Permanent Persistence', val: 'Permanent Database', desc: 'Secure 12-round bcrypt auth' },
              { label: 'Cryptographic Security', val: 'SHA-256 Receipts', desc: 'Tamper-proof assignment audit' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', marginTop: '2px' }}>
                  {stat.val}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. FOUR ROLE-SWITCHER TABS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '0 24px 20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
              Select Role Dashboard Preview:
            </h2>
            <p style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
              Switch seamlessly between all 4 institutional perspectives. All dummy data is isolated.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          {DEMO_ROLES.map((r) => {
            const isSelected = activeRole === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRole(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isSelected
                    ? `2px solid ${r.color}`
                    : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  background: isSelected
                    ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff')
                    : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc'),
                  boxShadow: isSelected ? `0 4px 18px ${r.bgLight}` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: r.bgLight,
                    border: `1px solid ${r.border}`,
                    color: r.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155'),
                      }}
                    >
                      {r.title}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: r.color,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {r.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. ACTIVE ROLE DASHBOARD PREVIEW CONTAINER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Executive Profile Header Preview (Matching Real Application) */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: activeRoleData.bgLight,
                border: `2px solid ${activeRoleData.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeRoleData.color,
                fontWeight: 800,
                fontSize: '18px',
              }}
            >
              {activeRole === 'student' && 'AS'}
              {activeRole === 'faculty' && 'VS'}
              {activeRole === 'cr' && 'PP'}
              {activeRole === 'hod' && 'RK'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  {activeRole === 'student' && 'Aarav Sharma'}
                  {activeRole === 'faculty' && 'Dr. Vikramaditya Sen'}
                  {activeRole === 'cr' && 'Priya Patel'}
                  {activeRole === 'hod' && 'Dr. Rajesh Khanna'}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: activeRoleData.bgLight,
                    color: activeRoleData.color,
                    border: `1px solid ${activeRoleData.border}`,
                  }}
                >
                  {activeRoleData.shortLabel}
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span>Apex Institute of Science &amp; Technology</span>
                <span>•</span>
                <span>School of Computer Science &amp; Engineering</span>
                <span>•</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {activeRole === 'student' && 'UID: CS24-B1089 (Sem 3)'}
                  {activeRole === 'faculty' && 'Course: CS-301 (DBMS)'}
                  {activeRole === 'cr' && 'Section: B.Tech CSE - Sec A'}
                  {activeRole === 'hod' && 'Governance: Dean / Executive HOD'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                color: isDark ? '#94a3b8' : '#64748b',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Mode: Sample Data Only
            </span>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Create Real Account
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* ── ROLE-SPECIFIC DASHBOARD RENDERER ── */}
        <AnimatePresence mode="wait">
          {activeRole === 'student' && (
            <motion.div
              key="student-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <StudentDashboardPreview
                isDark={isDark}
                attended={attendedClasses}
                total={totalClasses}
                setAttended={setAttendedClasses}
                setTotal={setTotalClasses}
                onAction={triggerSimulatedAction}
                onNavigate={navigate}
              />
            </motion.div>
          )}

          {activeRole === 'faculty' && (
            <motion.div
              key="faculty-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <FacultyDashboardPreview
                isDark={isDark}
                syllabusUnits={syllabusUnits}
                syllabusProgress={syllabusProgress}
                onToggleUnit={handleToggleUnit}
                examDate={examCheckDate}
                setExamDate={setExamCheckDate}
                conflictResult={conflictResult}
                onCheckConflict={handleCheckConflict}
                onAction={triggerSimulatedAction}
                onNavigate={navigate}
              />
            </motion.div>
          )}

          {activeRole === 'cr' && (
            <motion.div
              key="cr-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <CRDashboardPreview
                isDark={isDark}
                studentQuery={crStudentQuery}
                setStudentQuery={setCrStudentQuery}
                onAction={triggerSimulatedAction}
                onNavigate={navigate}
              />
            </motion.div>
          )}

          {activeRole === 'hod' && (
            <motion.div
              key="hod-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <HODDashboardPreview
                isDark={isDark}
                resolvedTickets={resolvedTickets}
                setResolvedTickets={setResolvedTickets}
                onAction={triggerSimulatedAction}
                onNavigate={navigate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. FLOATING ROLE SWITCHER DOCK (BOTTOM PINNED) */}
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
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
          borderRadius: '9999px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: isDark ? '#94a3b8' : '#64748b',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Laptop size={13} />
          <span>Switch View:</span>
        </div>

        {DEMO_ROLES.map((r) => {
          const isSelected = activeRole === r.id;
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRole(r.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: isSelected ? r.color : 'transparent',
                color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} />
              <span>{r.shortLabel}</span>
            </button>
          );
        })}

        <div style={{ width: '1px', height: '20px', background: isDark ? '#334155' : '#cbd5e1', margin: '0 4px' }} />

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
          <Sparkles size={13} />
          <span>Sign Up</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. SIMULATION FEEDBACK TOAST */}
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

// ─────────────────────────────────────────────────────────────────────────────
// A. STUDENT DASHBOARD PREVIEW SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboardPreview({ isDark, attended, total, setAttended, setTotal, onAction, onNavigate }) {
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const attendanceRate = Math.round((attended / total) * 100);
  const isSafe = attendanceRate >= 75;

  const mockDeadlines = [
    {
      id: 1,
      title: 'Operating Systems — Virtual Memory Paging Simulator (C++)',
      course: 'Operating Systems (CS-302)',
      dueDate: 'Tomorrow at 11:59 PM (in 18 hrs)',
      urgency: 'CRITICAL',
      points: 100,
      status: 'PENDING',
    },
    {
      id: 2,
      title: 'Database Management Systems — B+ Tree Indexing & Query Tuning',
      course: 'Database Systems (CS-301)',
      dueDate: 'In 3 days (Nov 15, 2026)',
      urgency: 'HIGH',
      points: 100,
      status: 'PENDING',
    },
    {
      id: 3,
      title: 'Computer Networks — TCP 3-Way Handshake Wireshark PCAP Analysis',
      course: 'Computer Networks (CS-304)',
      dueDate: 'In 5 days (Nov 17, 2026)',
      urgency: 'MEDIUM',
      points: 50,
      status: 'PENDING',
    },
    {
      id: 4,
      title: 'Design & Analysis of Algorithms — Dynamic Programming DP-Knapsack',
      course: 'Algorithms (CS-303)',
      dueDate: 'Submitted on Nov 08',
      urgency: 'COMPLETED',
      points: 100,
      status: 'GRADED',
      grade: '98 / 100',
    },
  ];

  const filteredDeadlines = mockDeadlines.filter((d) => {
    if (selectedUrgency === 'ALL') return true;
    if (selectedUrgency === 'PENDING') return d.status === 'PENDING';
    if (selectedUrgency === 'COMPLETED') return d.status === 'GRADED';
    return d.urgency === selectedUrgency;
  });

  return (
    <div>
      {/* High-Signal KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {[
          { label: 'Active Deadlines', val: '3 Pending', sub: '1 Due in <24h', icon: Clock, color: '#f59e0b' },
          { label: 'Overall Attendance', val: `${attendanceRate}%`, sub: isSafe ? 'Above 75% Threshold' : '⚠️ Below Mandatory 75%', icon: CheckCircle2, color: isSafe ? '#10b981' : '#ef4444' },
          { label: 'Cumulative GPA', val: '8.94 CGPA', sub: 'Top 5% of Batch', icon: Award, color: '#3b82f6' },
          { label: 'Workload Stress', val: 'LOW (24%)', sub: 'Zero 48h Conflicts', icon: Activity, color: '#10b981' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${kpi.color}15`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                {kpi.val}
              </div>
              <div style={{ fontSize: '11px', color: kpi.color, marginTop: '3px', fontWeight: 600 }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 2-Column Student Section: Priority Deadlines & Timetable/Attendance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left Column: Priority Academic Deadline Queue */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                Academic Deadline Queue
              </h3>
              <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                Automated 48-hour collision mitigation &amp; submission queue.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'CRITICAL', 'PENDING', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedUrgency(f)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedUrgency === f ? '#2563eb' : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                    color: selectedUrgency === f ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDeadlines.map((item) => (
              <div
                key={item.id}
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          item.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' :
                          item.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.15)' :
                          item.urgency === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color:
                          item.urgency === 'CRITICAL' ? '#ef4444' :
                          item.urgency === 'HIGH' ? '#f59e0b' :
                          item.urgency === 'COMPLETED' ? '#10b981' : '#3b82f6',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.urgency}
                    </span>
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {item.course}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '3px' }}>
                    Due: {item.dueDate}
                  </div>
                </div>

                <div>
                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => onAction(`Simulated Submission: ${item.title}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Submit
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#10b981',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.grade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Attendance Buffer Intelligence & Today's Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Interactive Attendance Calculator */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Attendance &amp; Safe Buffer Calculator
                </h3>
                <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                  Simulate upcoming lectures to forecast your 75% institutional compliance.
                </p>
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: isSafe ? '#10b981' : '#ef4444',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {attendanceRate}%
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div
              style={{
                height: '10px',
                borderRadius: '9999px',
                background: isDark ? '#1e293b' : '#e2e8f0',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, attendanceRate)}%`,
                  background: isSafe
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Interactive Attendance Simulator Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: isDark ? '#0f172a' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                marginBottom: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                  Attended: {attended} / {total} Total Lectures
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                  {isSafe
                    ? `Safe margin: You can miss up to 2 more classes and still remain above 75%.`
                    : `Warning: You must attend the next 3 consecutive lectures to regain 75%!`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAttended((prev) => prev + 1);
                    setTotal((prev) => prev + 1);
                    onAction('Simulated Lecture Attended (+1)');
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Attended
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTotal((prev) => prev + 1);
                    onAction('Simulated Lecture Missed (+0 / Total +1)');
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Missed
                </button>
              </div>
            </div>
          </div>

          {/* Today's Schedule Feed */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              Today's Lecture Schedule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { time: '09:00 - 10:15 AM', subject: 'Database Management Systems', room: 'Lab 402', faculty: 'Dr. Sen', status: 'Attended' },
                { time: '10:30 - 11:45 AM', subject: 'Operating Systems Architecture', room: 'Hall 3', faculty: 'Prof. Rao', status: 'Attended' },
                { time: '01:00 - 02:15 PM', subject: 'Design & Analysis of Algorithms', room: 'Hall B', faculty: 'Dr. Raman', status: 'Upcoming' },
                { time: '02:30 - 04:30 PM', subject: 'Computer Networks Lab', room: 'Networking Lab 2', faculty: 'Prof. Mehta', status: 'Upcoming' },
              ].map((slot, i) => (
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
                    <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{slot.subject}</span>
                    <div style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                      {slot.time} • {slot.room} • {slot.faculty}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: slot.status === 'Attended' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: slot.status === 'Attended' ? '#10b981' : '#3b82f6',
                    }}
                  >
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Enrolled Courses & Institutional Bulletins */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Enrolled Subjects & Courses */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Enrolled Courses &amp; Syllabus Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { code: 'CS-301', name: 'Database Management Systems', prof: 'Dr. Vikramaditya Sen', credits: 4, progress: 74, att: '88.9%' },
              { code: 'CS-302', name: 'Operating Systems Architecture', prof: 'Prof. Sunita Rao', credits: 4, progress: 80, att: '89.5%' },
              { code: 'CS-303', name: 'Design & Analysis of Algorithms', prof: 'Dr. S. K. Raman', credits: 4, progress: 68, att: '91.7%' },
              { code: 'CS-304', name: 'Computer Networks', prof: 'Prof. A. Mehta', credits: 3, progress: 62, att: '82.4%' },
            ].map((course, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(37,99,235,0.15)', color: '#2563eb', fontFamily: "'JetBrains Mono', monospace" }}>
                      {course.code}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {course.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>
                    Att: {course.att}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>
                  <span>{course.prof} • {course.credits} Credits</span>
                  <span>{course.progress}% Syllabus</span>
                </div>
                <div style={{ height: '6px', borderRadius: '9999px', background: isDark ? '#1e293b' : '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${course.progress}%`, background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', borderRadius: '9999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Notices Feed */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
              Academic Notices &amp; Bulletins
            </h3>
            <span style={{ fontSize: '11px', color: '#f54e00', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bell size={12} />
              3 New
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { tag: 'EXAMINATION', title: 'Midterm Examination Schedule for Semester 3 Released', date: 'Today at 09:30 AM', sender: 'Office of Dean Academics' },
              { tag: 'TECH CLUB', title: 'Apex Annual AI Hackathon & Innovation Challenge Registrations', date: 'Yesterday', sender: 'Computing Society' },
              { tag: 'LIBRARY', title: 'Semester 3 Reference Book Return Grace Period Extended to Friday', date: '2 days ago', sender: 'Central University Library' },
            ].map((n, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(245,78,0,0.15)', color: '#f54e00', fontFamily: "'JetBrains Mono', monospace" }}>
                    {n.tag}
                  </span>
                  <span style={{ fontSize: '10.5px', color: isDark ? '#64748b' : '#94a3b8' }}>
                    {n.date}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.3 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
                  Dispatched by: {n.sender}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// B. FACULTY DASHBOARD PREVIEW SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function FacultyDashboardPreview({
  isDark, syllabusUnits, syllabusProgress, onToggleUnit,
  examDate, setExamDate, conflictResult, onCheckConflict, onAction, onNavigate
}) {
  return (
    <div>
      {/* High-Signal Faculty KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {[
          { label: 'Assigned Course', val: 'CS-301 DBMS', sub: 'Dept of Computer Science', icon: BookOpen, color: '#f59e0b' },
          { label: 'Enrolled Students', val: '128 Scholars', sub: 'Sec A & B Combined', icon: Users, color: '#3b82f6' },
          { label: '5-Unit Syllabus Velocity', val: `${syllabusProgress}% Completed`, sub: 'On Schedule for Midterm', icon: CheckCircle2, color: '#10b981' },
          { label: 'Submissions to Evaluate', val: '14 Pending', sub: 'Average Score: 87.2%', icon: FileText, color: '#ec4899' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${kpi.color}15`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                {kpi.val}
              </div>
              <div style={{ fontSize: '11px', color: kpi.color, marginTop: '3px', fontWeight: 600 }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Faculty Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left Column: 5-Unit Interactive Syllabus Milestone Tracker */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                5-Unit Syllabus Milestone Tracker
              </h3>
              <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                Click unit milestones to update real-time completion velocity.
              </p>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#f59e0b',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {syllabusProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '8px',
              borderRadius: '9999px',
              background: isDark ? '#1e293b' : '#e2e8f0',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${syllabusProgress}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Checkable Syllabus Units */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {syllabusUnits.map((u) => (
              <div
                key={u.id}
                onClick={() => onToggleUnit(u.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${u.done ? 'rgba(245, 158, 11, 0.3)' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ color: u.done ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }}>
                  {u.done ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: u.done ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                      textDecoration: u.done ? 'none' : 'none',
                    }}
                  >
                    {u.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                    Status: {u.done ? 'Verified Completed & Taught' : 'Pending / Currently Scheduled'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 48-Hour Exam Publisher & Student Evaluation Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Exam Conflict Guard Simulator */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              48-Hour Exam Conflict Mitigation Engine
            </h3>
            <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 14px 0' }}>
              Test schedule dates to verify zero 48-hour collisions across all departments.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                  background: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={onCheckConflict}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Check Conflict
              </button>
            </div>

            {conflictResult && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: conflictResult.hasConflict ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${conflictResult.hasConflict ? '#ef4444' : '#10b981'}`,
                  color: conflictResult.hasConflict ? '#ef4444' : '#10b981',
                  fontSize: '12px',
                  lineHeight: 1.4,
                }}
              >
                {conflictResult.message}
              </div>
            )}
          </div>

          {/* Student Evaluation Queue */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              Student Submissions Queue
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Rohan Mehta', uid: 'CS24-B1012', task: 'B+ Tree Indexing Code', status: 'Needs Grading' },
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
                    <span style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '6px' }}>
                      ({sub.uid}) • {sub.task}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAction(`Grade Evaluated for ${sub.name}`)}
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
                    {sub.status.includes('Needs') ? 'Review & Grade' : '✓ Verified'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Management Overview & Academic Bulletins */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Attendance Management Preview */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                Course Attendance Management (CS-301)
              </h3>
              <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                128 enrolled students • 6 scholars below 75% warning flag.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAction('Attendance Warning Email Triggered to 6 At-Risk Scholars')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Alert At-Risk
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { roll: 'CS-01', name: 'Aarav Sharma', attended: '32 / 36', pct: '88.9%', status: 'Normal' },
              { roll: 'CS-03', name: 'Arjun Singhania', attended: '26 / 36', pct: '72.2%', status: 'Below 75%' },
              { roll: 'CS-08', name: 'Pooja Nair', attended: '35 / 36', pct: '97.2%', status: 'Normal' },
              { roll: 'CS-14', name: 'Siddharth Roy', attended: '25 / 36', pct: '69.4%', status: 'Below 75%' },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{st.name}</span>
                  <span style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '6px' }}>
                    ({st.roll}) • {st.attended} classes
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: st.status === 'Normal' ? '#10b981' : '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                    {st.pct}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: st.status === 'Normal' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: st.status === 'Normal' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {st.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Notices & Circulars */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Faculty Directives &amp; Department Notices
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Final Midterm Question Bank Submission Deadline: Nov 20', date: 'Dean of Engineering' },
              { title: 'Continuous Assessment & Lab Rubrics Approval for RDBMS', date: 'Curriculum Committee' },
              { title: 'Faculty Development Program on Distributed Systems & Cloud', date: 'Research & Training Cell' },
            ].map((n, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
                  Issuer: {n.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// C. CLASS REPRESENTATIVE (CR) DASHBOARD PREVIEW SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function CRDashboardPreview({ isDark, studentQuery, setStudentQuery, onAction, onNavigate }) {
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const mockStudents = [
    { roll: '01', name: 'Aarav Sharma', email: 'aarav.stu@college.ac', attendance: '88.5%', status: 'Regular' },
    { roll: '02', name: 'Aditi Deshmukh', email: 'aditi.stu@college.ac', attendance: '92.0%', status: 'Honors' },
    { roll: '03', name: 'Arjun Singhania', email: 'arjun.stu@college.ac', attendance: '76.4%', status: 'Borderline' },
    { roll: '04', name: 'Divya Iyer', email: 'divya.stu@college.ac', attendance: '94.2%', status: 'Honors' },
    { roll: '05', name: 'Harsh Vardhan', email: 'harsh.stu@college.ac', attendance: '81.8%', status: 'Regular' },
  ];

  const filteredStudents = mockStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
      s.roll.includes(studentQuery)
  );

  return (
    <div>
      {/* High-Signal CR KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {[
          { label: 'Assigned Batch', val: 'B.Tech CSE - Sec A', sub: '64 Registered Students', icon: Users, color: '#14b8a6' },
          { label: 'Batch Deadlines', val: '3 Active Tasks', sub: 'Synchronized with Faculty', icon: Calendar, color: '#3b82f6' },
          { label: 'Grievance Relays', val: '4 Resolved', sub: '0 Pending Escalations', icon: ShieldCheck, color: '#10b981' },
          { label: 'Timetable Sync', val: '100% Up to Date', sub: 'OCR Parsed & Verified', icon: Sparkles, color: '#f59e0b' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${kpi.color}15`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                {kpi.val}
              </div>
              <div style={{ fontSize: '11px', color: kpi.color, marginTop: '3px', fontWeight: 600 }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 2-Column CR Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left Column: Section A Student Directory (Dummy Data) */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                Batch Roster (Section A)
              </h3>
              <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                Isolated dummy scholar records for CR coordination.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: isDark ? '#94a3b8' : '#64748b' }} />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredStudents.map((st) => (
              <div
                key={st.roll}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#14b8a6' }}>
                      #{st.roll}
                    </span>
                    <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{st.name}</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                    {st.email}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                    {st.attendance}
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: st.status === 'Honors' ? 'rgba(16, 185, 129, 0.15)' : st.status === 'Borderline' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: st.status === 'Honors' ? '#10b981' : st.status === 'Borderline' ? '#ef4444' : '#3b82f6',
                    }}
                  >
                    {st.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Broadcast Class Announcement & OCR Scanner Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Class Announcement Composer */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              Broadcast Batch Announcement
            </h3>
            <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 12px 0' }}>
              Instant notifications delivered to all Section A scholars.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Tomorrow's Networks lab has been relocated to Hall 401..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12.5px',
                resize: 'none',
                marginBottom: '10px',
              }}
            />

            <button
              type="button"
              onClick={() => {
                onAction('Class Announcement Broadcast Sent to Section A');
                setBroadcastMessage('');
              }}
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Send size={13} />
              Broadcast to 64 Scholars
            </button>
          </div>

          {/* OCR Schedule Scanner Preview */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              OCR Timetable &amp; Schedule Extractor (F6)
            </h3>
            <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 12px 0' }}>
              Upload any college timetable image or PDF to auto-generate weekly schedules.
            </p>

            <div
              onClick={() => onAction('Simulated OCR Timetable Scan Completed')}
              style={{
                border: `2px dashed ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
              }}
            >
              <Sparkles size={24} style={{ color: '#14b8a6', marginBottom: '8px' }} />
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                Click to Test Sample OCR Scan
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                Simulates automatic optical parsing into structured lecture slots.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Batch Timetable & Activity Statistics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Section A Timetable */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Section A Weekly Timetable Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { day: 'Mon', slots: '09:00 DBMS • 11:00 OS Lab • 02:00 Algorithms' },
              { day: 'Tue', slots: '09:00 Networks • 10:30 DBMS • 01:00 OS' },
              { day: 'Wed', slots: '10:00 Networks Lab • 01:00 Discrete Math • 03:00 Algorithms' },
              { day: 'Thu', slots: '09:00 OS • 11:00 DBMS Lab • 02:30 Networks' },
              { day: 'Fri', slots: '09:30 Discrete Math • 11:30 Algorithms Lab' },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  fontSize: '12px',
                }}
              >
                <span style={{ fontWeight: 800, color: '#14b8a6', width: '40px' }}>{d.day}</span>
                <span style={{ flex: 1, color: isDark ? '#ffffff' : '#0f172a' }}>{d.slots}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Activity & Grievance Dispatch Telemetry */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Class Activity &amp; Grievance Relays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Relayed: Lab 402 Workstation Display Replacement Request', target: 'Faculty HOD', status: 'Approved' },
              { title: 'Conflict Rescheduled: OS Midterm 48h Overlap with Networks', target: 'Prof. Rao', status: 'Shifted +48h' },
              { title: 'Study Notes & PCAP Sample Captures Distributed to Batch', target: 'Section A Scholars', status: 'Shared (64)' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                    Recipient: {item.target}
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', whiteSpace: 'nowrap' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// D. HEAD OF DEPARTMENT (HOD) DASHBOARD PREVIEW SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function HODDashboardPreview({ isDark, resolvedTickets, setResolvedTickets, onAction, onNavigate }) {
  const mockTickets = [
    {
      id: 1,
      student: 'Anonymous Scholar',
      program: 'B.Tech CSE (Sem 3)',
      issue: 'Simultaneous midterms on Nov 19 & 20 causing acute burnout anomaly',
      sentiment: -0.74,
      severity: 'CRITICAL',
    },
    {
      id: 2,
      student: 'Anonymous Scholar',
      program: 'AI & Data Science (Sem 5)',
      issue: 'Lab 402 workstation GPU drivers failing during deep learning coursework',
      sentiment: -0.42,
      severity: 'MODERATE',
    },
  ];

  return (
    <div>
      {/* High-Signal HOD KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {[
          { label: 'Department Faculty', val: '28 Professors', sub: 'School of Computing', icon: BookOpen, color: '#ec4899' },
          { label: 'Total Scholars', val: '480 Enrolled', sub: 'Across 4 Degree Programs', icon: Users, color: '#3b82f6' },
          { label: 'Branch Avg Attendance', val: '87.4%', sub: 'Institutional Target: 75%', icon: CheckCircle2, color: '#10b981' },
          { label: 'Syllabus Velocity', val: '74% Average', sub: 'Target Velocity on Track', icon: Activity, color: '#f59e0b' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${kpi.color}15`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                {kpi.val}
              </div>
              <div style={{ fontSize: '11px', color: kpi.color, marginTop: '3px', fontWeight: 600 }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column HOD Section: Burnout Matrix & NLP Triage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left Column: 16-Week Burnout & Stress Telemetry Heatmap Preview */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                Branch-Wide 16-Week Stress Heatmap
              </h3>
              <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                Predictive burnout detection matrix across all 16 semester weeks.
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
              }}
            >
              Executive View
            </span>
          </div>

          {/* 16-Week Heatmap Matrix Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {Array.from({ length: 16 }, (_, i) => {
              const weekNum = i + 1;
              const isPeak = weekNum === 8 || weekNum === 15;
              const isModerate = weekNum === 7 || weekNum === 9 || weekNum === 14;
              return (
                <div
                  key={weekNum}
                  onClick={() => onAction(`Inspected Week ${weekNum} Workload Density`)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    background: isPeak
                      ? 'rgba(239, 68, 68, 0.22)'
                      : isModerate
                      ? 'rgba(245, 158, 11, 0.18)'
                      : (isDark ? '#0f172a' : '#f1f5f9'),
                    border: `1px solid ${isPeak ? '#ef4444' : isModerate ? '#f59e0b' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b' }}>W{weekNum}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isPeak ? '#ef4444' : isModerate ? '#f59e0b' : (isDark ? '#ffffff' : '#0f172a'),
                      marginTop: '2px',
                    }}
                  >
                    {isPeak ? 'HIGH' : isModerate ? 'MOD' : 'LOW'}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              fontSize: '11px',
              color: isDark ? '#94a3b8' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              justifyContent: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
              Balanced (Weeks 1-6)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} />
              Moderate (Midterms)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
              Critical Peak (Finals)
            </span>
          </div>
        </div>

        {/* Right Column: Real-Time NLP Student Panic & Grievance Anomaly Triage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                  NLP Grievance &amp; Panic Triage
                </h3>
                <p style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                  VADER &amp; TextBlob sentiment analysis flags student distress signals.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mockTickets.map((t) => {
                const isResolved = resolvedTickets.includes(t.id);
                return (
                  <div
                    key={t.id}
                    style={{
                      background: isDark ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: t.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: t.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                        }}
                      >
                        {t.severity} ANOMALY (Score: {t.sentiment})
                      </span>
                      <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {t.program}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: isDark ? '#ffffff' : '#0f172a', fontWeight: 600, lineHeight: 1.4 }}>
                      "{t.issue}"
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                      {isResolved ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                          ✓ Resolved &amp; Workload Dispatched
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setResolvedTickets((prev) => [...prev, t.id]);
                            onAction(`Intervention Dispatched for Ticket #${t.id}`);
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#ec4899',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve &amp; Dispatch Relief
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faculty Fleet Velocity */}
          <div
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              Faculty Fleet Syllabus Velocity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Dr. Vikramaditya Sen', subject: 'DBMS (CS-301)', progress: '74%', onTrack: true },
                { name: 'Prof. Sunita Rao', subject: 'Operating Systems (CS-302)', progress: '80%', onTrack: true },
                { name: 'Dr. S. K. Raman', subject: 'Algorithms (CS-303)', progress: '68%', onTrack: true },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isDark ? '#0f172a' : '#f8fafc',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{f.name}</span>
                    <span style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '6px' }}>
                      ({f.subject})
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>
                    {f.progress} Velocity
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Attendance Reports & Announcements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Attendance Reports Across Programs */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Department Attendance &amp; Compliance Audit
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { prog: 'B.Tech Computer Science & Engineering', enrolled: 180, avgAtt: '88.2%', compliance: '94%' },
              { prog: 'B.Tech AI & Machine Learning', enrolled: 120, avgAtt: '89.5%', compliance: '96%' },
              { prog: 'B.Tech Data Science & Analytics', enrolled: 100, avgAtt: '85.4%', compliance: '90%' },
              { prog: 'B.Tech Cyber Security & Forensics', enrolled: 80, avgAtt: '86.1%', compliance: '92%' },
            ].map((p, i) => (
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
                  <div style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{p.prog}</div>
                  <div style={{ fontSize: '10.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                    {p.enrolled} Scholars Enrolled
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>
                    {p.avgAtt} Avg
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
                    {p.compliance} Compliance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Announcements Broadcaster */}
        <div
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
            Executive Department Announcements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Mandatory 48-Hour Exam Gap Protocol Enacted for Semester 3 & 5', audience: 'All Faculty & CRs', date: 'Active Directive' },
              { title: 'Accreditation Review Audit: Syllabus Units to be locked by Nov 30', audience: 'School of Computing Faculty', date: 'Executive Order' },
              { title: 'Mental Health & Student Grievance Anomaly Relays Monitored Weekly', audience: 'Dean & HOD Council', date: 'Standing Policy' },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                  {d.title}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
                  Scope: {d.audience} • Status: {d.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
