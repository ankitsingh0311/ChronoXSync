// =============================================================================
// ChronoSync — Official Department Notices & HOD Directives (NoticeBoard.jsx)
// =============================================================================
// Centralized, interactive notice portal for Students, Faculty, CRs, and HODs.
// Features: Real-time scoped feed, multi-type filtering, program isolation,
// live search, acknowledgement tracking, print/export, and HOD broadcasting.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { noticeAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Search, RefreshCw, Filter, Calendar, ShieldCheck,
  CheckCircle2, Copy, Check, Trash2, Plus, Sparkles, Building2,
  Clock, AlertTriangle, FileText, ChevronRight, Share2, Printer,
  Eye, BookmarkCheck, Globe, Compass, GraduationCap, Layers
} from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_COURSES_MAP, SEMESTER_PILLS } from './Login';

const NOTICE_TYPES = [
  { id: 'ALL', label: 'All Directives', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.3)' },
  { id: 'EXAM_MASTER', label: 'Exam Directives', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)' },
  { id: 'URGENT', label: 'Urgent Alerts', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.3)' },
  { id: 'NOTICE', label: 'Policy & Academic', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' },
  { id: 'EVENT', label: 'Events & Holidays', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)' },
];

const DEFAULT_PROGRAMS = [
  'ALL',
  'Core CSE',
  'AIML',
  'Data Science',
  'Cyber Security',
];

export default function NoticeBoard() {
  const { user } = useAuth();
  const isHOD = user?.role_id === 4 || user?.role_name === 'HOD';
  const isFaculty = user?.role_id === 3 || user?.role_name === 'FACULTY' || user?.role_name === 'Faculty';
  const canBroadcast = isHOD || isFaculty;

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compute dynamic programs for the active department
  const departmentPrograms = useMemo(() => {
    const set = new Set(['ALL']);
    const userDept = user?.department || 'School of Computer Science and Engineering';
    if (DEPARTMENT_COURSES_MAP[userDept]) {
      DEPARTMENT_COURSES_MAP[userDept].forEach(cat => {
        cat.items.forEach(item => set.add(item));
      });
    }
    if (user?.program && user.program !== 'ALL') {
      set.add(user.program);
    }
    notices.forEach(n => {
      if (n.program && n.program !== 'ALL') {
        set.add(n.program);
      }
    });
    DEFAULT_PROGRAMS.forEach(p => set.add(p));
    return Array.from(set);
  }, [user, notices]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chronosync_read_notices') || '[]');
    } catch {
      return [];
    }
  });

  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    notice_type: 'EXAM_MASTER',
    target_department: user?.department || 'School of Computer Science and Engineering',
    target_program: 'ALL',
    target_semester: 'ALL',
  });

  // Dynamic program list for chosen target department in broadcast modal
  const broadcastPrograms = useMemo(() => {
    if (broadcastForm.target_department === 'ALL') {
      return ['ALL'];
    }
    const deptCats = DEPARTMENT_COURSES_MAP[broadcastForm.target_department];
    if (deptCats && Array.isArray(deptCats)) {
      const items = deptCats.flatMap(c => c.items);
      return ['ALL', ...items];
    }
    return ['ALL', 'B.Tech Computer Science & Engineering', 'Core CSE', 'AIML', 'Data Science'];
  }, [broadcastForm.target_department]);

  // Fetch notices
  const loadNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (isHOD && selectedProgram !== 'ALL') {
        params.program = selectedProgram;
      }
      if (isHOD && selectedSemester !== 'ALL') {
        params.semester = selectedSemester;
      }
      const res = await noticeAPI.getAll(params);
      setNotices(res.data?.notices || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [selectedProgram, selectedSemester]);

  // Handle Mark Read / Acknowledged
  const toggleAcknowledge = (noticeId) => {
    let next;
    if (acknowledgedIds.includes(noticeId)) {
      next = acknowledgedIds.filter(id => id !== noticeId);
    } else {
      next = [...acknowledgedIds, noticeId];
      showToast('✓ Directive acknowledged as read');
    }
    setAcknowledgedIds(next);
    localStorage.setItem('chronosync_read_notices', JSON.stringify(next));
  };

  // Handle Copy Notice
  const handleCopy = (notice) => {
    const text = `📢 [OFFICIAL HOD DIRECTIVE]\n\nTitle: ${notice.title}\nDate: ${notice.created_at}\nProgram: ${notice.program}\nIssued By: ${notice.posted_by_name || 'HOD'}\n\n${notice.content}\n\n— ChronoSync Academic Synchronizer`;
    navigator.clipboard.writeText(text);
    setCopiedId(notice.notice_id);
    showToast('✓ Notice copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Delete (HOD only)
  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Delete this official department notice permanently?')) return;
    try {
      await noticeAPI.delete(noticeId);
      setNotices(prev => prev.filter(n => n.notice_id !== noticeId));
      showToast('✓ Notice removed from department bulletin.');
    } catch (err) {
      alert('Failed to delete notice: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Handle Broadcast Submission
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) return;

    try {
      setBroadcastLoading(true);
      await noticeAPI.create({
        title: broadcastForm.title.trim(),
        content: broadcastForm.content.trim(),
        notice_type: broadcastForm.notice_type,
        department: broadcastForm.target_department || user?.department || 'Computer Science',
        program: broadcastForm.target_program || 'ALL',
        semester: broadcastForm.target_semester || 'ALL',
      });
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: '',
        content: '',
        notice_type: 'EXAM_MASTER',
        target_department: user?.department || 'Computer Science & Engineering',
        target_program: 'ALL',
        target_semester: 'ALL',
      });
      showToast('✓ Official Directive broadcasted successfully!');
      await loadNotices();
    } catch (err) {
      alert('Broadcast failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setBroadcastLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      // Type filter
      if (selectedType !== 'ALL') {
        const nt = (n.notice_type || '').toUpperCase();
        if (selectedType === 'EXAM_MASTER' && !['EXAM_MASTER', 'EXAM_NOTICE'].includes(nt)) return false;
        if (selectedType === 'URGENT' && !['URGENT', 'ACADEMIC_ALERT'].includes(nt)) return false;
        if (selectedType === 'NOTICE' && !['NOTICE', 'DEADLINE_POLICY', 'GENERAL'].includes(nt)) return false;
        if (selectedType === 'EVENT' && !['EVENT', 'HOLIDAY'].includes(nt)) return false;
      }
      // Program filter (if viewing as HOD)
      if (isHOD && selectedProgram !== 'ALL') {
        if (n.program !== 'ALL' && n.program !== selectedProgram) return false;
      }
      // Semester filter (if viewing as HOD)
      if (isHOD && selectedSemester !== 'ALL') {
        if (n.semester !== 'ALL' && n.semester !== selectedSemester) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const contentMatch = (n.content || '').toLowerCase().includes(q);
        const posterMatch = (n.posted_by_name || '').toLowerCase().includes(q);
        const progMatch = (n.program || '').toLowerCase().includes(q);
        const semMatch = (n.semester || '').toLowerCase().includes(q);
        const deptMatch = (n.department || '').toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !posterMatch && !progMatch && !semMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [notices, selectedType, selectedProgram, selectedSemester, searchQuery, isHOD]);

  // Notice Type Styling helper
  const getTypeStyle = (rawType) => {
    const t = (rawType || '').toUpperCase();
    if (['EXAM_MASTER', 'EXAM_NOTICE'].includes(t)) {
      return {
        label: 'Exam Directive',
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.15)',
        border: 'rgba(192, 132, 252, 0.35)',
        badge: 'EXAM MASTER',
      };
    }
    if (['URGENT', 'ACADEMIC_ALERT'].includes(t)) {
      return {
        label: 'Urgent Directive',
        color: '#f87171',
        bg: 'rgba(248, 113, 113, 0.15)',
        border: 'rgba(248, 113, 113, 0.35)',
        badge: 'HIGH PRIORITY',
      };
    }
    if (['EVENT', 'HOLIDAY'].includes(t)) {
      return {
        label: 'Academic Event',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.35)',
        badge: 'CALENDAR',
      };
    }
    return {
      label: 'Department Notice',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.35)',
      badge: 'OFFICIAL POLICY',
    };
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Standard Navigation Header */}
      <Navbar
        title="Official Department Bulletins"
        subtitle={`Verified HOD & Academic Directives · ${user?.department || 'Computer Science & Engineering'}`}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: '#18181b',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(245,78,0,0.05) 50%, var(--bg-card) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '26px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f54e00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(236,72,153,0.35)',
              flexShrink: 0,
            }}
          >
            <Megaphone size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                HOD Department Notice Board
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '20px',
                  background: 'rgba(236,72,153,0.18)',
                  color: '#f472b6',
                  border: '1px solid rgba(236,72,153,0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <ShieldCheck size={13} />
                Official Authority Verified
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time administrative policies, exam schedules, and holiday announcements broadcasted directly by the Head of Department.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadNotices}
            disabled={loading}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            title="Refresh Feed"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {canBroadcast && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(236,72,153,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} /> Broadcast Directive
            </button>
          )}
        </div>
      </motion.div>

      {/* Program & Semester Scope Filter (for HOD or multi-batch inspection) */}
      {isHOD && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {/* Program Filter Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', minWidth: '95px' }}>
              Program Scope:
            </span>
            {departmentPrograms.map(prog => (
              <button
                key={prog}
                onClick={() => setSelectedProgram(prog)}
                style={{
                  background: selectedProgram === prog ? 'rgba(236,72,153,0.2)' : 'var(--bg-card)',
                  color: selectedProgram === prog ? '#f472b6' : 'var(--text-secondary)',
                  border: selectedProgram === prog ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '11.5px',
                  fontWeight: selectedProgram === prog ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {prog === 'ALL' ? '🌐 All Programs' : `🎓 ${prog}`}
              </button>
            ))}
          </div>

          {/* Semester Filter Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', minWidth: '95px' }}>
              Semester Scope:
            </span>
            <button
              onClick={() => setSelectedSemester('ALL')}
              style={{
                background: selectedSemester === 'ALL' ? 'rgba(99,102,241,0.2)' : 'var(--bg-card)',
                color: selectedSemester === 'ALL' ? '#818cf8' : 'var(--text-secondary)',
                border: selectedSemester === 'ALL' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: selectedSemester === 'ALL' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              🌐 All Semesters
            </button>
            {SEMESTER_PILLS.map(sem => (
              <button
                key={sem.id}
                onClick={() => setSelectedSemester(sem.id)}
                style={{
                  background: selectedSemester === sem.id ? 'rgba(99,102,241,0.2)' : 'var(--bg-card)',
                  color: selectedSemester === sem.id ? '#818cf8' : 'var(--text-secondary)',
                  border: selectedSemester === sem.id ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '4px 11px',
                  fontSize: '11.5px',
                  fontWeight: selectedSemester === sem.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                📅 {sem.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search circulars by title, directive keyword, or poster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '9px 12px 9px 36px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Notice Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
          {NOTICE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              style={{
                background: selectedType === t.id ? t.bg : 'transparent',
                color: selectedType === t.id ? t.color : 'var(--text-muted)',
                border: selectedType === t.id ? `1px solid ${t.border}` : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: selectedType === t.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid / Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: '#ec4899' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Retrieving verified department notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(236,72,153,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Megaphone size={26} color="#ec4899" />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 700 }}>
            No Notices Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            There are currently no circulars matching your selected filters for {selectedProgram === 'ALL' ? 'all programs' : selectedProgram}.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredNotices.map((notice, idx) => {
            const typeStyle = getTypeStyle(notice.notice_type);
            const isAcknowledged = acknowledgedIds.includes(notice.notice_id);

            return (
              <motion.article
                key={notice.notice_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                style={{
                  background: isAcknowledged ? 'var(--bg-card)' : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, var(--bg-card) 100%)',
                  border: isAcknowledged ? '1px solid var(--border-subtle)' : `1px solid ${typeStyle.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: isAcknowledged ? 'none' : '0 4px 20px rgba(0,0,0,0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s',
                }}
              >
                {/* Left Accent Stripe */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: typeStyle.color,
                  }}
                />

                {/* Card Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Notice Type Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        border: `1px solid ${typeStyle.border}`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {typeStyle.badge}
                    </span>

                    {/* Department Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: '#cbd5e1',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🏛️ {notice.department === 'ALL' ? 'Campus-Wide (All Depts)' : notice.department}
                    </span>

                    {/* Program Target Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: '#c084fc',
                        border: '1px solid rgba(192, 132, 252, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🎓 {notice.program === 'ALL' ? 'All Programs' : notice.program}
                    </span>

                    {/* Semester Target Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: notice.semester === 'ALL' ? 'var(--bg-secondary)' : 'rgba(99, 102, 241, 0.15)',
                        color: notice.semester === 'ALL' ? '#94a3b8' : '#818cf8',
                        border: notice.semester === 'ALL' ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      📅 {notice.semester === 'ALL' ? 'All Semesters' : notice.semester}
                    </span>
                  </div>

                  {/* Top Right: Date & HOD Seal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={13} />
                      {notice.created_at}
                    </div>

                    {(isHOD || user?.role_id === 3 || user?.role_id === 4) && (
                      <button
                        onClick={() => handleDeleteNotice(notice.notice_id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          borderRadius: '6px',
                          color: '#f87171',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Delete this notice"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Notice Title */}
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 12px 0',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.35,
                  }}
                >
                  {notice.title}
                </h3>

                {/* Notice Body Content with paragraph formatting */}
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    marginBottom: '18px',
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0,0,0,0.15)',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  {notice.content}
                </div>

                {/* Footer Authority Signature & Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Verified Authority Signature */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      H
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {notice.posted_by_name || 'Dr. Sanjay Desai'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#f472b6', marginLeft: '6px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        (Head of Department)
                      </span>
                    </div>
                  </div>

                  {/* Actions: Acknowledge & Share */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleCopy(notice)}
                      style={{
                        background: copiedId === notice.notice_id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                        border: copiedId === notice.notice_id ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: copiedId === notice.notice_id ? '#34d399' : 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                      }}
                      title="Copy Circular Text"
                    >
                      {copiedId === notice.notice_id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === notice.notice_id ? 'Copied' : 'Copy'}
                    </button>

                    <button
                      onClick={() => toggleAcknowledge(notice.notice_id)}
                      style={{
                        background: isAcknowledged ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-secondary)',
                        border: isAcknowledged ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        color: isAcknowledged ? '#34d399' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isAcknowledged ? <CheckCircle2 size={14} color="#34d399" /> : <BookmarkCheck size={14} />}
                      {isAcknowledged ? 'Acknowledged' : 'Mark as Read'}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Broadcast Modal for HOD / Faculty */}
      {showBroadcastModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowBroadcastModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            style={{
              background: '#18181b',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Megaphone size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                    Broadcast Official Notice
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>
                    Publish directives to student feeds, faculty consoles, and CR boards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Directive Title */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., End-Semester Examination Master Schedule & Project Evaluation"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#27272a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Row: Directive Category & Target Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                    Directive Category *
                  </label>
                  <select
                    value={broadcastForm.notice_type}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, notice_type: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#27272a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="EXAM_MASTER">📅 Exam Master Directive</option>
                    <option value="URGENT">🚨 Urgent / High Priority Alert</option>
                    <option value="NOTICE">📝 Academic Policy / Guidelines</option>
                    <option value="EVENT">🎉 Academic Calendar / Holiday</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                    Target Department *
                  </label>
                  <select
                    value={broadcastForm.target_department}
                    onChange={(e) => setBroadcastForm({
                      ...broadcastForm,
                      target_department: e.target.value,
                      target_program: 'ALL'
                    })}
                    style={{
                      width: '100%',
                      background: '#27272a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ALL">🌐 All Departments (Campus-Wide Broadcast)</option>
                    {user?.department && (
                      <option value={user.department}>🏛️ My Department ({user.department})</option>
                    )}
                    {DEPARTMENTS.filter(d => d !== user?.department).map(dept => (
                      <option key={dept} value={dept}>🏛️ {dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: Target Degree Program & Target Semester */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                    Target Degree Program *
                  </label>
                  <select
                    value={broadcastForm.target_program}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, target_program: e.target.value })}
                    disabled={broadcastForm.target_department === 'ALL'}
                    style={{
                      width: '100%',
                      background: broadcastForm.target_department === 'ALL' ? '#1f1f23' : '#27272a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: broadcastForm.target_department === 'ALL' ? '#71717a' : '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: broadcastForm.target_department === 'ALL' ? 'not-allowed' : 'default',
                    }}
                  >
                    {broadcastForm.target_department === 'ALL' ? (
                      <option value="ALL">🌐 All Programs (Entire Campus)</option>
                    ) : (
                      <>
                        <option value="ALL">🌐 All Programs in {broadcastForm.target_department}</option>
                        {broadcastPrograms.filter(p => p !== 'ALL').map(prog => (
                          <option key={prog} value={prog}>🎓 {prog}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                    Target Academic Semester *
                  </label>
                  <select
                    value={broadcastForm.target_semester}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, target_semester: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#27272a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ALL">🌐 All Semesters (Sem 1 to Sem 8 / Entire Program)</option>
                    {SEMESTER_PILLS.map(sem => (
                      <option key={sem.id} value={sem.id}>
                        📅 {sem.id} ({sem.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Interactive Scope Preview Callout */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(236,72,153,0.06)',
                  border: '1px solid rgba(236,72,153,0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div style={{ marginTop: '2px', color: '#f472b6' }}>
                  {broadcastForm.target_department === 'ALL' ? (
                    <Globe size={16} />
                  ) : broadcastForm.target_semester !== 'ALL' && broadcastForm.target_program !== 'ALL' ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <Building2 size={16} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Audience Scope & Delivery Target
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#e4e4e7', lineHeight: 1.4 }}>
                    {broadcastForm.target_department === 'ALL' && broadcastForm.target_program === 'ALL' && broadcastForm.target_semester === 'ALL' && (
                      <span><strong>🌐 Universal Broadcast:</strong> Visible to all students, CRs, and faculty across the entire college.</span>
                    )}
                    {broadcastForm.target_department !== 'ALL' && broadcastForm.target_program === 'ALL' && broadcastForm.target_semester === 'ALL' && (
                      <span><strong>🏛️ Department-Wide:</strong> Broadcasted to all degree programs and all semesters within <strong>{broadcastForm.target_department}</strong>.</span>
                    )}
                    {broadcastForm.target_department !== 'ALL' && broadcastForm.target_program !== 'ALL' && broadcastForm.target_semester === 'ALL' && (
                      <span><strong>🎓 Program-Wide:</strong> Delivered to all students enrolled in <strong>{broadcastForm.target_program}</strong> across all semesters (1 to 8).</span>
                    )}
                    {broadcastForm.target_department !== 'ALL' && broadcastForm.target_program !== 'ALL' && broadcastForm.target_semester !== 'ALL' && (
                      <span><strong>🎯 Micro-Targeted Directive:</strong> Strictly visible ONLY to students enrolled in <strong>{broadcastForm.target_program}</strong> in <strong>{broadcastForm.target_semester}</strong>. Students in other semesters or programs will NOT see this directive!</span>
                    )}
                    {broadcastForm.target_department !== 'ALL' && broadcastForm.target_program === 'ALL' && broadcastForm.target_semester !== 'ALL' && (
                      <span><strong>📅 Semester-Targeted:</strong> Visible to all programs in <strong>{broadcastForm.target_department}</strong> currently in <strong>{broadcastForm.target_semester}</strong>.</span>
                    )}
                    {broadcastForm.target_department === 'ALL' && (broadcastForm.target_program !== 'ALL' || broadcastForm.target_semester !== 'ALL') && (
                      <span><strong>🌐 Multi-Department Target:</strong> Scoped to all matching students across all departments.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Content */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                  Full Announcement Content *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide comprehensive details, guidelines, venue requirements, or deadline instructions..."
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#27272a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    color: '#a1a1aa',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 22px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(236,72,153,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {broadcastLoading ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
                  {broadcastLoading ? 'Broadcasting...' : 'Publish Directive'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
