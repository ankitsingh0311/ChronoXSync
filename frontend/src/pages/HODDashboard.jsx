// =============================================================================
// EduTrack 3D — HOD Executive Leadership & Governance Suite (HODDashboard.jsx)
// =============================================================================
// Top-tier institutional governance dashboard for Department Heads & Deans.
// Features:
//   - Branch-wide Workload & Burnout Heatmap telemetry
//   - Unrestricted Department "God View" with Program Filtering (ALL, Core CSE, AIML, DS)
//   - Real-time VADER/TextBlob NLP Student Panic / Grievance Anomaly Triage + Resolution
//   - Department-Wide Notice & Exam Broadcaster (Propagates to all Students, CRs & Faculty)
//   - Faculty & CR Activity Coordination Feed
//   - Clean Slate Database Wipe & Reset Control
// =============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  analyticsAPI, panicAPI, userAPI, examAPI, noticeAPI, deadlineAPI, adminAPI, historyAPI, courseAPI, authAPI
} from '../services/api';
import Navbar from '../components/Navbar';
import BurnoutHeatmap from '../components/BurnoutHeatmap';
import CryptoVerifierTerminal from '../components/CryptoVerifierTerminal';
import {
  Crown, ShieldAlert, BarChart3, Users, Calendar, AlertTriangle,
  CheckCircle, ArrowUpRight, TrendingUp, Sparkles, Filter, ChevronRight,
  ShieldCheck, RefreshCw, FileText, CheckCircle2, Megaphone, Trash2,
  Plus, X, Send, BookOpen, Layers, Building2, GraduationCap, History, Download, MapPin,
  Clock, RotateCcw, Search, UserX, Check, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEPARTMENTS, DEPARTMENT_COURSES_MAP, SEMESTER_PILLS, PROGRAMS as ALL_PROGRAMS } from './Login';

export default function HODDashboard() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState('ALL');

  const scopePrograms = useMemo(() => {
    const dept = user?.department || 'School of Computer Science and Engineering';
    const catList = DEPARTMENT_COURSES_MAP?.[dept];
    if (catList && Array.isArray(catList)) {
      const items = catList.flatMap(c => c.items || []);
      return ['ALL', ...items];
    }
    return ['ALL', 'B.Tech Computer Science & Engineering'];
  }, [user?.department]);
  const [heatmap, setHeatmap] = useState([]);
  const [panicLogs, setPanicLogs] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [historyDelegations, setHistoryDelegations] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exam Scheduling Modal State
  const [showExamModal, setShowExamModal] = useState(false);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examError, setExamError] = useState('');
  const [examForm, setExamForm] = useState({
    course_id: '',
    exam_date: '',
    exam_type: 'MIDTERM',
    venue: '',
    program: 'ALL',
  });

  // Broadcast Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    notice_type: 'EXAM_NOTICE',
    target_department: user?.department || 'Computer Science & Engineering',
    target_program: 'ALL',
    target_semester: 'ALL'
  });
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Resolve Panic Modal State
  const [resolveModalPanic, setResolveModalPanic] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  // Clean Slate Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Department Roster Filter State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterRoleFilter, setRosterRoleFilter] = useState('ALL');

  const deptName = user?.department || 'Computer Science & Engineering';

  const loadData = async (prog = selectedProgram) => {
    try {
      setLoading(true);
      const queryParams = prog === 'ALL' ? {} : { program: prog };
      const [heatRes, panicRes, userRes, examRes, noticeRes, dlRes, histRes, crsRes] = await Promise.all([
        analyticsAPI.getHeatmap(queryParams),
        panicAPI.getLogs(queryParams),
        userAPI.getAll(),
        examAPI.getAll(queryParams),
        noticeAPI.getAll(queryParams),
        deadlineAPI.getAll(queryParams),
        historyAPI.getHistory().catch(() => ({ data: { tasks: [], delegations: [], stats: null } })),
        courseAPI.getAll().catch(() => ({ data: { courses: [] } }))
      ]);

      setHeatmap(heatRes.data.heatmap || []);
      setPanicLogs(panicRes.data.logs || []);
      setFacultyUsers(userRes.data.users || []);
      setExams(examRes.data.exams || []);
      setCourses(crsRes.data?.courses || []);
      if (crsRes.data?.courses?.length > 0) {
        setExamForm(prev => prev.course_id ? prev : ({ ...prev, course_id: crsRes.data.courses[0].course_id }));
      }
      setNotices(noticeRes.data.notices || []);
      setDeadlines(dlRes.data.deadlines || []);
      if (histRes?.data) {
        setHistoryTasks(histRes.data.tasks || []);
        setHistoryDelegations(histRes.data.delegations || []);
        setHistoryStats(histRes.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load HOD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = async (e) => {
    e.preventDefault();
    if (!examForm.course_id || !examForm.exam_date) {
      setExamError('Please select a course and specify the exam date & time.');
      return;
    }
    try {
      setExamSubmitting(true);
      setExamError('');
      await examAPI.create({
        course_id: parseInt(examForm.course_id),
        exam_date: new Date(examForm.exam_date).toISOString().replace('T', ' ').substring(0, 19),
        exam_type: examForm.exam_type,
        venue: examForm.venue,
        program: examForm.program,
        department: deptName,
      });
      setShowExamModal(false);
      setExamForm({
        course_id: courses[0]?.course_id || '',
        exam_date: '',
        exam_type: 'MIDTERM',
        venue: '',
        program: 'ALL',
      });
      await loadData();
    } catch (err) {
      setExamError(err.response?.data?.detail || 'Failed to publish exam schedule.');
    } finally {
      setExamSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId, courseName) => {
    if (!window.confirm(`Permanently delete the scheduled exam for "${courseName || 'this course'}" from the database?\n\n• It will immediately be removed from all student, faculty, and HOD dashboards.\n• The 24-hour SQL exam conflict lock for this date will be lifted.`)) {
      return;
    }

    try {
      await examAPI.delete(examId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete exam schedule.');
    }
  };

  useEffect(() => {
    loadData(selectedProgram);
  }, [user, selectedProgram]);

  const handleProgramChange = (prog) => {
    setSelectedProgram(prog);
  };

  const availableProgramsForNotice = useMemo(() => {
    if (!noticeForm.target_department || noticeForm.target_department === 'ALL') {
      return [];
    }
    const catList = DEPARTMENT_COURSES_MAP?.[noticeForm.target_department];
    if (catList && Array.isArray(catList)) {
      return catList.flatMap(c => c.items || []);
    }
    return ALL_PROGRAMS.filter(p => p !== 'ALL');
  }, [noticeForm.target_department]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;
    try {
      setNoticeLoading(true);
      await noticeAPI.create({
        title: noticeForm.title,
        content: noticeForm.content,
        notice_type: noticeForm.notice_type,
        department: noticeForm.target_department || deptName,
        program: noticeForm.target_program || 'ALL',
        semester: noticeForm.target_semester || 'ALL',
      });
      setShowNoticeModal(false);
      setNoticeForm({
        title: '',
        content: '',
        notice_type: 'EXAM_NOTICE',
        target_department: deptName,
        target_program: 'ALL',
        target_semester: 'ALL'
      });
      setActionAlert({ type: 'success', message: '✓ Announcement broadcasted successfully with audience targeting!' });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Broadcast failed: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Delete this department notice?')) return;
    try {
      await noticeAPI.delete(noticeId);
      setActionAlert({ type: 'success', message: 'Notice removed from department feed.' });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to delete notice.' });
    }
  };

  const handleResolvePanic = async (e) => {
    e.preventDefault();
    if (!resolveModalPanic) return;
    const pId = resolveModalPanic.panic_id || resolveModalPanic.log_id;
    try {
      setResolveLoading(true);
      await panicAPI.resolve(
        pId,
        resolutionNotes || 'Reviewed by HOD. Academic workload schedule adjusted.'
      );
      setResolveModalPanic(null);
      setResolutionNotes('');
      setActionAlert({ type: 'success', message: `✓ Grievance #${resolveModalPanic.ticket_number || pId} marked as Resolved.` });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to resolve grievance: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setResolveLoading(false);
    }
  };

  const handleUnsolvePanic = async (panic) => {
    const pId = panic.panic_id || panic.log_id;
    try {
      await panicAPI.unresolve(pId);
      setActionAlert({ type: 'success', message: `↺ Grievance #${panic.ticket_number || pId} marked as Unsolved (Pending status).` });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to unsolve grievance: ' + (err.response?.data?.detail || err.message) });
    }
  };

  const handleDeletePanic = async (panic) => {
    const pId = panic.panic_id || panic.log_id;
    if (!window.confirm(`Permanently delete grievance #${panic.ticket_number || pId}?\n\nThis will remove the record from the database with 100% accuracy. This cannot be undone.`)) {
      return;
    }
    try {
      await panicAPI.delete(pId);
      setActionAlert({ type: 'success', message: `✓ Grievance #${panic.ticket_number || pId} permanently deleted.` });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to delete grievance: ' + (err.response?.data?.detail || err.message) });
    }
  };

  const handleResetDb = async () => {
    try {
      setResetLoading(true);
      await adminAPI.resetDb('clean_slate');
      setShowResetModal(false);
      setActionAlert({ type: 'success', message: '✓ Clean Slate: Database successfully wiped and reset to baseline!' });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Reset failed: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName, roleName) => {
    if (!window.confirm(`Permanently delete ${roleName || 'user'} "${userName || ''}" (ID: #${userId}) from the database?\n\n• User credentials will be revoked immediately.\n• Related records and submissions will be unlinked.\n• Action is committed directly to SQLite.`)) {
      return;
    }
    try {
      await authAPI.deleteUser(userId);
      setActionAlert({ type: 'success', message: `✓ Account for "${userName}" successfully purged from database.` });
      await loadData();
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to delete user: ' + (err.response?.data?.detail || err.message) });
    }
  };

  // Derived stats
  const criticalPanics = panicLogs.filter(p => p.sentiment_label === 'CRITICAL');
  const facultyMembers = facultyUsers.filter(u => u.role_id === 3 || u.role_name === 'Faculty' || u.role_name === 'FACULTY');
  const avgBurnout = heatmap.length > 0
    ? Math.round(heatmap.reduce((acc, h) => acc + (h.burnout_index || 0), 0) / heatmap.length)
    : 42;

  const burnoutBadge = avgBurnout > 70
    ? { label: 'CRITICAL OVERLOAD', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
    : avgBurnout > 40
      ? { label: 'MODERATE INTENSITY', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
      : { label: 'NORMAL THRESHOLD', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };

  // Department Roster Derived Subsets (Faculty, Students, CRs strictly from HOD's department)
  const rosterFacultyMembers = useMemo(() => {
    return (facultyUsers || []).filter(u => u.role_id === 3 || u.role_name?.toUpperCase() === 'FACULTY');
  }, [facultyUsers]);

  const rosterStudentMembers = useMemo(() => {
    return (facultyUsers || []).filter(u => u.role_id === 1 || u.role_name?.toUpperCase() === 'STUDENT');
  }, [facultyUsers]);

  const rosterCRMembers = useMemo(() => {
    return (facultyUsers || []).filter(u => u.role_id === 2 || u.role_name?.toUpperCase() === 'CR');
  }, [facultyUsers]);

  const filteredDepartmentRoster = useMemo(() => {
    return (facultyUsers || []).filter((u) => {
      // Role filter
      if (rosterRoleFilter === 'FACULTY' && u.role_id !== 3 && u.role_name?.toUpperCase() !== 'FACULTY') return false;
      if (rosterRoleFilter === 'STUDENT' && u.role_id !== 1 && u.role_name?.toUpperCase() !== 'STUDENT') return false;
      if (rosterRoleFilter === 'CR' && u.role_id !== 2 && u.role_name?.toUpperCase() !== 'CR') return false;

      // Program filter from HOD scope selector if active and not 'ALL'
      if (selectedProgram !== 'ALL' && u.program && u.program !== 'ALL') {
        const uProg = (u.program || '').toLowerCase();
        const selProg = selectedProgram.toLowerCase();
        if (!uProg.includes(selProg) && !selProg.includes(uProg)) {
          return false;
        }
      }

      // Search query
      if (!rosterSearch.trim()) return true;
      const q = rosterSearch.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.program?.toLowerCase().includes(q) ||
        u.role_name?.toLowerCase().includes(q) ||
        u.subject_or_course?.toLowerCase().includes(q)
      );
    });
  }, [facultyUsers, rosterRoleFilter, selectedProgram, rosterSearch]);

  return (
    <div>
      <Navbar
        title="HOD Executive Leadership Suite"
        subtitle={`Department Governance · ${deptName}`}
      />

      {/* Action Notification Alert */}
      <AnimatePresence>
        {actionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              background: actionAlert.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${actionAlert.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: actionAlert.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{actionAlert.message}</span>
            <button
              onClick={() => setActionAlert(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOD Executive Hero Banner with Program Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '24px 28px',
          marginBottom: '26px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.14) 0%, rgba(99, 102, 241, 0.10) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)'
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.45)',
              flexShrink: 0
            }}>
              <Crown size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(236, 72, 153, 0.25)',
                  color: '#ec4899',
                  fontWeight: 700
                }}>
                  Department Head · Academic Governance
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Office of the HOD
                </span>
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2
              }}>
                {user?.full_name || 'Dr. Department Head'}
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Dean & Executive Chair of <strong>{deptName}</strong></span>
                <span>•</span>
                <span style={{ color: '#f472b6', fontWeight: 600 }}>Unrestricted Department Jurisdiction</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                borderColor: '#ec4899',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                padding: '10px 18px',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
              }}
            >
              <Megaphone size={16} /> Broadcast Notice
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.08)'
              }}
            >
              <Trash2 size={15} /> Wipe & Reset
            </button>
            <Link
              to="/analytics"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BarChart3 size={15} /> Power BI Heatmap
            </Link>
            <Link
              to="/history"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                background: 'rgba(236, 72, 153, 0.1)',
                color: '#fbcfe8',
                fontWeight: 600
              }}
            >
              <History size={15} /> Proof & Audit History ({historyStats?.total_tasks || historyTasks.length || 0})
            </Link>
          </div>
        </div>

        {/* Program Filter Tabs ("God Mode" Scope Selector) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginRight: '6px'
          }}>
            <Filter size={12} color="#ec4899" />
            <span>Scope Filter:</span>
          </div>
          {scopePrograms.map((prog) => {
            const active = selectedProgram === prog;
            return (
              <button
                key={prog}
                onClick={() => handleProgramChange(prog)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: active ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(236, 72, 153, 0.22)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#f472b6' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {prog === 'ALL' ? '🌐 All Programs (Omniscience)' : prog}
              </button>
            );
          })}
          {loading && (
            <span style={{ fontSize: '11px', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Filtering...
            </span>
          )}
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '26px'
      }}>
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #ec4899' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Scope Stress Index
            </span>
            <TrendingUp size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {avgBurnout}%
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: '6px',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            background: burnoutBadge.bg,
            color: burnoutBadge.color
          }}>
            {burnoutBadge.label}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Filtered for {selectedProgram}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #14b8a6' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Deadlines
            </span>
            <Layers size={16} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {deadlines.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            CR & Faculty Uploads
          </div>
          <div style={{ fontSize: '11px', color: '#14b8a6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> ACID Scope Isolated
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #ef4444' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Anonymous Grievances
            </span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {panicLogs.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <strong style={{ color: '#ef4444' }}>{criticalPanics.length} Critical</strong> Anomaly Alerts
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Routed exclusively to {deptName}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #6366f1' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Exam Schedules
            </span>
            <Calendar size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {exams.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Official Milestones
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Conflict Guard Trigger Active
          </div>
        </motion.div>
      </div>

      {/* Burnout Heatmap (Power BI & Executive Telemetry) */}
      <div style={{ marginBottom: '26px' }}>
        <BurnoutHeatmap initialProgram={selectedProgram} />
      </div>

      {/* SHA-256 Tamper-Proof Cryptographic Receipt Verifier Terminal */}
      <div style={{ marginBottom: '26px' }}>
        <CryptoVerifierTerminal embedded={true} />
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '22px', marginBottom: '26px' }}>

        {/* Section 1: Official Department Notices & Broadcaster Feed */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={17} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Department Notices & Announcements
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Broadcasted across all programs, CRs & faculty in {deptName}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/notices"
                style={{
                  fontSize: '12px',
                  color: '#f472b6',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                Full Bulletin →
              </Link>
              <button
                onClick={() => setShowNoticeModal(true)}
                className="btn btn-sm btn-primary"
                style={{ background: '#ec4899', borderColor: '#ec4899', fontSize: '12px' }}
              >
                <Plus size={13} /> New Notice
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            {notices.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No active department notices. Click "New Notice" to broadcast an official announcement.
              </div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.notice_id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '9.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: n.notice_type === 'EXAM_NOTICE' ? 'rgba(99,102,241,0.2)' : 'rgba(236,72,153,0.2)',
                        color: n.notice_type === 'EXAM_NOTICE' ? '#818cf8' : '#ec4899'
                      }}>
                        {n.notice_type}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteNotice(n.notice_id)}
                      title="Delete Notice"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {n.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(236,72,153,0.12)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.2)' }}>
                        Dept: {n.department || 'Campus-wide'}
                      </span>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                        Prog: {n.program || 'ALL'}
                      </span>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                        Sem: {n.semester || 'ALL'}
                      </span>
                    </div>
                    <span>{n.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Student Panic & Grievance Anomaly Feed with Resolve Action */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={17} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Student Grievance & Panic Inbox
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  NLP-analyzed student reports from {deptName}
                </span>
              </div>
            </div>
            <Link to="/panic-logs" className="btn btn-sm btn-secondary" style={{ fontSize: '12px' }}>
              Full Triage <ChevronRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            {panicLogs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No active student panic reports for this scope.
              </div>
            ) : (
              panicLogs.map((p) => {
                const isCrit = (p.sentiment_label || p.severity) === 'CRITICAL';
                const pId = p.panic_id || p.log_id;
                const isResolved = p.resolved || p.resolved_at;
                return (
                  <div
                    key={pId}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isCrit ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {p.ticket_number && (
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b'
                          }}>
                            {p.ticket_number}
                          </span>
                        )}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: isCrit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isCrit ? '#ef4444' : '#f59e0b'
                        }}>
                          {p.sentiment_label || p.severity || 'ANOMALY'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {p.student_display || `Program: ${p.program || 'ALL'}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isResolved ? (
                          <>
                            <span style={{ fontSize: '10.5px', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Solved
                            </span>
                            <button
                              onClick={() => handleUnsolvePanic(p)}
                              title="Mark as Unsolved (Pending)"
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                background: 'rgba(245,158,11,0.15)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                color: '#f59e0b',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <RotateCcw size={11} /> Unsolve
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setResolveModalPanic(p)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '5px',
                              background: 'rgba(16,185,129,0.15)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: '#34d399',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Resolve Grievance
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePanic(p)}
                          title="Permanently Delete Grievance"
                          style={{
                            padding: '3px 7px',
                            borderRadius: '5px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10.5px'
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                    {p.subject && (
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {p.subject}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "{p.message || p.message_text}"
                    </p>
                    {p.file_attachment && (
                      <div>
                        <a
                          href={p.file_attachment}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: '#60a5fa',
                            textDecoration: 'none'
                          }}
                        >
                          📎 View Attached Student Proof Document
                        </a>
                      </div>
                    )}
                    {p.resolution_notes && (
                      <div style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.08)', padding: '5px 8px', borderRadius: '4px' }}>
                        <strong>Action Taken:</strong> {p.resolution_notes}
                      </div>
                    )}
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Polarity Score: {p.sentiment_score ?? -0.85}</span>
                      <span>•</span>
                      <span>{p.timestamp || p.created_at}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Section: Official Department Examination Schedules & Milestones */}
      <div className="glass-card" style={{ padding: '22px', marginBottom: '26px', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Official Examination Schedules & Conflict Guard
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Enforced by SQL 24h Conflict Trigger • Visible to Faculty, CRs, and Students across {deptName}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/exams"
              style={{
                fontSize: '12px',
                color: '#818cf8',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '6px',
                padding: '6px 12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              Calendar Console →
            </Link>
            <button
              onClick={() => setShowExamModal(true)}
              className="btn btn-sm btn-primary"
              style={{ background: '#6366f1', borderColor: '#6366f1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={13} /> Schedule Exam
            </button>
          </div>
        </div>

        {exams.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            No exams scheduled. Click "Schedule Exam" to broadcast an official examination window.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Course / Classification</th>
                  <th style={{ padding: '10px 12px' }}>Target Scope</th>
                  <th style={{ padding: '10px 12px' }}>Exam Date & Time</th>
                  <th style={{ padding: '10px 12px' }}>Venue / Hall</th>
                  <th style={{ padding: '10px 12px' }}>Scheduled By</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => {
                  const examDate = new Date(ex.exam_date);
                  const formattedDate = isNaN(examDate.getTime()) ? ex.exam_date : examDate.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const typeColor = ex.exam_type === 'FINAL' ? '#ef4444' : ex.exam_type === 'MIDTERM' ? '#f59e0b' : '#3b82f6';
                  return (
                    <tr key={ex.exam_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ex.course_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span>{ex.course_code}</span>
                          <span>•</span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            background: `${typeColor}20`,
                            color: typeColor
                          }}>
                            {ex.exam_type}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {ex.program || 'ALL'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {ex.venue || 'TBA'}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {ex.scheduled_by}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldCheck size={11} /> Conflict Lock Active
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteExam(ex.exam_id, ex.course_code || ex.course_name)}
                          title="Delete scheduled examination"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(el) => {
                            el.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                          }}
                          onMouseLeave={(el) => {
                            el.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Scope Activity Stream (CR & Faculty Deadlines in Department) */}
      <div className="glass-card" style={{ padding: '22px', marginBottom: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Scope Workload Stream ({selectedProgram})
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Active tasks, assignments, and exam schedules posted by CRs and Faculty
              </span>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#ec4899', fontWeight: 600 }}>
            {deadlines.length} Course Deadlines Tracked
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Course / Title</th>
                <th style={{ padding: '10px 12px' }}>Program Scope</th>
                <th style={{ padding: '10px 12px' }}>Due Date</th>
                <th style={{ padding: '10px 12px' }}>Urgency</th>
                <th style={{ padding: '10px 12px' }}>Isolation Status</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No deadlines found for selected program scope.
                  </td>
                </tr>
              ) : (
                deadlines.map((dl) => (
                  <tr key={dl.deadline_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dl.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dl.course_name} ({dl.course_code})</div>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                      {dl.program || 'ALL'}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {dl.due_date}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: dl.urgency === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: dl.urgency === 'HIGH' ? '#ef4444' : '#f59e0b'
                      }}>
                        {dl.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#10b981', fontSize: '11px' }}>
                      ✓ Strictly Scoped to {deptName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Department Personnel & Enrolled Accounts Roster (Faculty & Students) */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="#ec4899" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Department Personnel & Enrolled Accounts Roster
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                background: 'rgba(236, 72, 153, 0.12)',
                color: '#ec4899',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}>
                <ShieldCheck size={12} /> Isolated to {deptName}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Official roster of Faculty, Students, and Class Representatives enrolled in <strong>{deptName}</strong>. Faculty and other departments cannot view this roster.
            </p>
          </div>

          {/* Quick Roster Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
              padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              {rosterFacultyMembers.length} Faculty
            </span>
            <span style={{
              fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
              padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              {rosterStudentMembers.length} Students
            </span>
            <span style={{
              fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 600,
              background: 'rgba(20, 184, 166, 0.12)', color: '#14b8a6',
              padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(20, 184, 166, 0.25)'
            }}>
              {rosterCRMembers.length} CRs
            </span>
          </div>
        </div>

        {/* Filter Controls: Search & Role Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* All Personnel */}
            <button
              onClick={() => setRosterRoleFilter('ALL')}
              className="btn btn-sm"
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                borderRadius: '16px',
                border: rosterRoleFilter === 'ALL' ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
                background: rosterRoleFilter === 'ALL' ? 'rgba(236, 72, 153, 0.22)' : 'transparent',
                color: rosterRoleFilter === 'ALL' ? '#f472b6' : 'var(--text-secondary)',
                fontWeight: rosterRoleFilter === 'ALL' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={13} />
              <span>All Personnel</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                {facultyUsers.length}
              </span>
            </button>

            {/* Faculty Only */}
            <button
              onClick={() => setRosterRoleFilter('FACULTY')}
              className="btn btn-sm"
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                borderRadius: '16px',
                border: rosterRoleFilter === 'FACULTY' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                background: rosterRoleFilter === 'FACULTY' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                color: rosterRoleFilter === 'FACULTY' ? '#fbbf24' : 'var(--text-secondary)',
                fontWeight: rosterRoleFilter === 'FACULTY' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <BookOpen size={13} />
              <span>Faculty Only</span>
              <span style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#fbbf24' }}>
                {rosterFacultyMembers.length}
              </span>
            </button>

            {/* Students Only */}
            <button
              onClick={() => setRosterRoleFilter('STUDENT')}
              className="btn btn-sm"
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                borderRadius: '16px',
                border: rosterRoleFilter === 'STUDENT' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: rosterRoleFilter === 'STUDENT' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: rosterRoleFilter === 'STUDENT' ? '#34d399' : 'var(--text-secondary)',
                fontWeight: rosterRoleFilter === 'STUDENT' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <GraduationCap size={13} />
              <span>Students Only</span>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#34d399' }}>
                {rosterStudentMembers.length}
              </span>
            </button>

            {/* CRs Only */}
            <button
              onClick={() => setRosterRoleFilter('CR')}
              className="btn btn-sm"
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                borderRadius: '16px',
                border: rosterRoleFilter === 'CR' ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
                background: rosterRoleFilter === 'CR' ? 'rgba(20, 184, 166, 0.22)' : 'transparent',
                color: rosterRoleFilter === 'CR' ? '#2dd4bf' : 'var(--text-secondary)',
                fontWeight: rosterRoleFilter === 'CR' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Award size={13} />
              <span>Class Reps (CR)</span>
              <span style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#2dd4bf' }}>
                {rosterCRMembers.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '12px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search faculty or student..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '210px'
              }}
            />
          </div>
        </div>

        {/* Table of Enrolled Department Users */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Name & Email</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Academic Programme</th>
                <th style={{ padding: '10px 12px' }}>Department</th>
                <th style={{ padding: '10px 12px' }}>Subject / Semester</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartmentRoster.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>No personnel found matching filters.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px' }}>All registered accounts under {deptName} will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredDepartmentRoster.map((u) => {
                  const isFaculty = u.role_id === 3 || u.role_name?.toUpperCase() === 'FACULTY';
                  const isStudent = u.role_id === 1 || u.role_name?.toUpperCase() === 'STUDENT';
                  const isCR = u.role_id === 2 || u.role_name?.toUpperCase() === 'CR';
                  const isSelfHOD = u.role_id === 4 || u.role_name?.toUpperCase() === 'HOD';

                  const roleBadgeColor = isFaculty
                    ? '#f59e0b'
                    : isCR
                      ? '#14b8a6'
                      : isStudent
                        ? '#10b981'
                        : '#ec4899';

                  return (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: `${roleBadgeColor}22`,
                            color: roleBadgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {u.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.full_name}</div>
                            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: `${roleBadgeColor}18`,
                          color: roleBadgeColor,
                          border: `1px solid ${roleBadgeColor}35`
                        }}>
                          {u.role_name || (isFaculty ? 'Faculty' : isCR ? 'CR' : isStudent ? 'Student' : 'HOD')}
                        </span>
                      </td>

                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          fontSize: '11.5px',
                          color: 'var(--text-primary)'
                        }}>
                          {u.program || 'Core Academic Stream'}
                        </span>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#10b981'
                        }}>
                          <ShieldCheck size={12} /> {u.department || deptName}
                        </span>
                      </td>

                      <td style={{ padding: '12px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {u.subject_or_course || (u.semester ? `Semester ${u.semester}` : 'Enrolled')}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {!isSelfHOD ? (
                          <button
                            onClick={() => handleDeleteUser(u.user_id, u.full_name, u.role_name)}
                            title="Purge user account from database"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(el) => {
                              el.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                            }}
                            onMouseLeave={(el) => {
                              el.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            Executive Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Assignment & Upload Audit History (Proof of Work) */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} color="#ec4899" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Department Assignment & Upload Audit History (Proof of Work)
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <ShieldCheck size={12} /> Institutional Proof Enforced
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Complete institutional proof of all coursework, materials, notices, and exam schedules uploaded across {deptName}. Fully persisted in database.
            </p>
          </div>
          <Link
            to="/history"
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#fbcfe8',
              borderColor: 'rgba(236, 72, 153, 0.4)'
            }}
          >
            Open Full Department History <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Audit Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL TASKS ISSUED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
              {historyStats?.total_tasks || historyTasks.length || deadlines.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OFFICIAL NOTICES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ec4899', marginTop: '2px' }}>
              {historyStats?.total_notices || notices.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SCHEDULED EXAMS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1', marginTop: '2px' }}>
              {historyStats?.total_exams || exams.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DATABASE PERSISTENCE</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> SQLite Permanent Storage
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '10px 12px' }}>PROOF ID</th>
                <th style={{ padding: '10px 12px' }}>ITEM & TOPIC</th>
                <th style={{ padding: '10px 12px' }}>SCOPE / AUDIENCE</th>
                <th style={{ padding: '10px 12px' }}>DATE / DEADLINE</th>
                <th style={{ padding: '10px 12px' }}>COMPLETION STATUS</th>
                <th style={{ padding: '10px 12px' }}>FILE EVIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {historyTasks.slice(0, 4).map((t) => (
                <tr key={`hod-hist-task-${t.task_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      TASK #{t.task_id}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.course_name || t.course_code}</div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {t.target_program || t.department}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {t.due_date}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                      background: 'rgba(16, 185, 129, 0.12)', color: '#10b981'
                    }}>
                      {t.completed_count || 0}/{t.total_students || 0} Submissions
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {t.file_attachment ? (
                      <a
                        href={t.file_attachment}
                        download
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '11px', color: '#60a5fa' }}
                      >
                        <Download size={12} /> Download
                      </a>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Instruction Log</span>
                    )}
                  </td>
                </tr>
              ))}
              {notices.slice(0, 3).map((n) => (
                <tr key={`hod-hist-notice-${n.notice_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                      NOTICE #{n.notice_id}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.notice_type}</div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {n.target_program || 'Campus-wide'}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Broadcasted'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                      Delivered
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Verified Bulletin
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Notice Modal */}
      <AnimatePresence>
        {showNoticeModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1b1a17',
                border: '1px solid rgba(236,72,153,0.4)',
                borderRadius: '12px',
                padding: '26px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(236,72,153,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Megaphone size={20} color="#ec4899" />
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc', fontWeight: 600 }}>
                    Broadcast Department Notice
                  </h3>
                </div>
                <button onClick={() => setShowNoticeModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateNotice}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Notice Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mandatory Midterm Exam Window Announcement"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Notice Category
                    </label>
                    <select
                      value={noticeForm.notice_type}
                      onChange={(e) => setNoticeForm({ ...noticeForm, notice_type: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    >
                      <option value="EXAM_NOTICE">Official Exam Schedule</option>
                      <option value="ACADEMIC_ALERT">Academic Alert</option>
                      <option value="GENERAL">General Notice</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Target Department
                    </label>
                    <select
                      value={noticeForm.target_department}
                      onChange={(e) => setNoticeForm({
                        ...noticeForm,
                        target_department: e.target.value,
                        target_program: 'ALL'
                      })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    >
                      <option value="ALL">🌐 ALL Departments (Campus-wide)</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Target Program / Degree
                    </label>
                    <select
                      value={noticeForm.target_program}
                      onChange={(e) => setNoticeForm({ ...noticeForm, target_program: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    >
                      <option value="ALL">📚 ALL Programs (Entire Department)</option>
                      {availableProgramsForNotice.map((prog) => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Target Semester
                    </label>
                    <select
                      value={noticeForm.target_semester}
                      onChange={(e) => setNoticeForm({ ...noticeForm, target_semester: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    >
                      <option value="ALL">🎯 ALL Semesters (Entire Batch)</option>
                      {SEMESTER_PILLS.map((sem) => (
                        <option key={sem.id} value={sem.id}>{sem.id} ({sem.year})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Real-time Audience Scope Preview */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(236,72,153,0.06)',
                  border: '1px dashed rgba(236,72,153,0.3)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Sparkles size={15} color="#ec4899" />
                  <div style={{ fontSize: '12px', color: '#fbcfe8' }}>
                    {noticeForm.target_department === 'ALL' && noticeForm.target_program === 'ALL' && noticeForm.target_semester === 'ALL' ? (
                      <span><strong>Audience Scope:</strong> Campus-wide! Visible to all students, CRs, and faculty across every department.</span>
                    ) : (
                      <span>
                        <strong>Audience Scope:</strong> Visible only to{' '}
                        <span style={{ color: '#fff', fontWeight: 600 }}>{noticeForm.target_department || 'Department'}</span> &rarr;{' '}
                        <span style={{ color: '#fff', fontWeight: 600 }}>{noticeForm.target_program === 'ALL' ? 'All Programs' : noticeForm.target_program}</span> &rarr;{' '}
                        <span style={{ color: '#fff', fontWeight: 600 }}>{noticeForm.target_semester === 'ALL' ? 'All Semesters' : noticeForm.target_semester}</span>.
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Notice Content & Instructions
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter official schedule instructions, dates, or guidelines..."
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowNoticeModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={noticeLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 18px', borderRadius: '6px', background: '#ec4899',
                      border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {noticeLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                    Broadcast Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resolve Panic Grievance Modal */}
      <AnimatePresence>
        {resolveModalPanic && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1b1a17',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '12px',
                padding: '26px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(16,185,129,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={20} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc', fontWeight: 600 }}>
                    Resolve Student Grievance #{resolveModalPanic.log_id}
                  </h3>
                </div>
                <button onClick={() => setResolveModalPanic(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Anonymous Student Report:</div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', fontStyle: 'italic' }}>"{resolveModalPanic.message}"</div>
              </div>

              <form onSubmit={handleResolvePanic}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Action Taken / Resolution Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Contacted Faculty to postpone lab submission by 4 days."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setResolveModalPanic(null)}
                    style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolveLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 18px', borderRadius: '6px', background: '#10b981',
                      border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {resolveLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clean Slate Database Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1b1a17',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '28px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(239,68,68,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={22} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    Clean Slate Database Reset
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Purge all dummy deadlines, notices, panics & custom entries
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '20px' }}>
                This executes <code>POST /api/admin/reset-db</code>. All active deadlines, student panic reports, exam records, and notices will be deleted.
                Baseline test directory accounts remain preserved.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDb}
                  disabled={resetLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', borderRadius: '8px', background: '#ef4444',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600
                  }}
                >
                  {resetLoading ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Wiping Database...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Confirm Wipe & Reset
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Exam Modal */}
      <AnimatePresence>
        {showExamModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1b1a17',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                padding: '26px',
                maxWidth: '540px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#818cf8" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc', fontWeight: 600 }}>
                      Schedule Department Examination
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                      Enforced across {deptName} • Visible on Student & CR Dashboards
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExamModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {examError && (
                <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', marginBottom: '14px' }}>
                  {examError}
                </div>
              )}

              <form onSubmit={handleScheduleExam}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                    Course *
                  </label>
                  <select
                    required
                    value={examForm.course_id}
                    onChange={(e) => setExamForm({ ...examForm, course_id: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px'
                    }}
                  >
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code}: {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Exam Classification *
                    </label>
                    <select
                      value={examForm.exam_type}
                      onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px'
                      }}
                    >
                      <option value="MIDTERM">MIDTERM (Mid-Semester Exam)</option>
                      <option value="FINAL">FINAL (End-Semester Exam)</option>
                      <option value="QUIZ">QUIZ (Evaluated Quiz)</option>
                      <option value="VIVA">VIVA (Practical / Lab Viva)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Target Cohort / Program *
                    </label>
                    <select
                      value={examForm.program}
                      onChange={(e) => setExamForm({ ...examForm, program: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px'
                      }}
                    >
                      {PROGRAMS.map(p => (
                        <option key={p} value={p}>{p === 'ALL' ? 'Entire Department (All Programs)' : p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Exam Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={examForm.exam_date}
                      onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Venue / Hall
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hall #402, Lab 3"
                      value={examForm.venue}
                      onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px', borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#818cf8', fontSize: '11.5px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Once scheduled, student and CR deadlines within 24 hours of this exam are prevented automatically by SQL triggers.</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={examSubmitting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 20px', borderRadius: '6px', background: '#6366f1',
                      border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {examSubmitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={14} />}
                    Publish Exam Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
