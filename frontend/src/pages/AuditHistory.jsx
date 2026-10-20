// =============================================================================
// ChronoSync — Task, Assignment & Account History Console (AuditHistory.jsx)
// =============================================================================
// Comprehensive persistent history of all assignments, tasks, coursework delegations,
// scheduled exams, department notices, and registered user accounts for Faculty,
// CR, HOD, and Students. Features live student completion rosters,
// progress metrics (completed vs left), and direct document downloads.
// 100% committed to SQLite database — persists across user logouts & browser sessions.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { historyAPI, deadlineAPI, examAPI, authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import {
  History, CheckCircle2, Clock, FileText, Download,
  ExternalLink, Search, RefreshCw, Users, AlertCircle,
  Layers, Database, ArrowRight, ShieldCheck, Filter,
  Send, Inbox, Calendar, UserCheck, UserX, X, Sparkles,
  Megaphone, MapPin, Check, Award, Trash2, GraduationCap, BookOpen
} from 'lucide-react';

export default function AuditHistory() {
  const { user } = useAuth();
  const isHOD = user?.role_id === 4 || user?.role_name === 'HOD';
  const [tasks, setTasks] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    active_tasks: 0,
    completed_tasks: 0,
    total_delegations: 0,
    total_exams: 0,
    total_notices: 0,
    total_users: 0,
    files_shared: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'DELEGATIONS' | 'EXAMS' | 'NOTICES' | 'USERS' | 'FILES'
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | 'FACULTY' | 'STUDENT' | 'CR'

  useEffect(() => {
    if (!isHOD && activeTab === 'USERS') {
      setActiveTab('ALL');
    }
  }, [isHOD, activeTab]);

  // Student Roster Modal State
  const [rosterModal, setRosterModal] = useState({
    isOpen: false,
    loading: false,
    taskTitle: '',
    deadlineId: null,
    students: [],
    total: 0,
    completed: 0,
    pending: 0,
  });

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await historyAPI.getHistory();
      setTasks(res.data.tasks || []);
      setDelegations(res.data.delegations || []);
      setExams(res.data.exams || []);
      setNotices(res.data.notices || []);
      setRegisteredUsers(res.data.registered_users || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleDeleteTask = async (taskId, title, isDeleted = false) => {
    const isPermanent = !!isDeleted;
    const promptMsg = isPermanent
      ? `Permanently purge "${title || 'this assignment'}" from database history? This cannot be undone.`
      : `Delete "${title || 'this assignment'}"?\n\n• It will immediately be removed from Student and CR dashboards.\n• It will remain in this History page as archived proof of work.`;

    if (!window.confirm(promptMsg)) return;

    try {
      await deadlineAPI.delete(taskId, isPermanent ? { permanent: true } : {});
      loadHistory();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.response?.data?.detail || 'Failed to delete task.');
    }
  };

  const handleDeleteExam = async (examId, courseCode, examType) => {
    if (!window.confirm(`Permanently delete the scheduled ${examType || ''} examination for "${courseCode || 'this course'}" from the database?\n\n• It will immediately be removed from all student, faculty, and HOD dashboards.\n• The 24-hour SQL exam conflict lock for this date will be lifted.`)) {
      return;
    }

    try {
      await examAPI.delete(examId);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete exam schedule:', err);
      alert(err.response?.data?.detail || 'Failed to delete exam schedule.');
    }
  };

  const handleDeleteUser = async (userId, userName, roleName) => {
    if (!window.confirm(`Permanently delete ${roleName || 'user'} "${userName || ''}" (ID: #${userId}) from the database?\n\n• User credentials will be revoked immediately.\n• Related records and submissions will be unlinked.\n• Action is committed directly to SQLite.`)) {
      return;
    }

    try {
      await authAPI.deleteUser(userId);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  // Open Student Roster Modal
  const openStudentRoster = async (task) => {
    setRosterModal({
      isOpen: true,
      loading: true,
      taskTitle: task.title,
      deadlineId: task.deadline_id,
      students: [],
      total: task.total_enrolled,
      completed: task.completed_count,
      pending: task.pending_count,
    });

    try {
      const res = await historyAPI.getDeadlineStudents(task.deadline_id);
      setRosterModal(prev => ({
        ...prev,
        loading: false,
        students: res.data.students || [],
        total: res.data.total,
        completed: res.data.completed,
        pending: res.data.pending,
      }));
    } catch (err) {
      console.error('Failed to load student roster:', err);
      setRosterModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Tab filter
      if (activeTab === 'ACTIVE' && t.pending_count === 0 && !t.is_overdue) return false;
      if (activeTab === 'COMPLETED' && t.pending_count > 0) return false;
      if (activeTab === 'FILES' && !t.pdf_blob_url) return false;

      // Urgency filter
      if (urgencyFilter && t.urgency !== urgencyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const text = `${t.title} ${t.course_code} ${t.course_name} ${t.description || ''} ${t.posted_by_name || ''} ${t.program || ''}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  }, [tasks, activeTab, urgencyFilter, searchQuery]);

  // Filtered Delegations
  const filteredDelegations = useMemo(() => {
    return delegations.filter(d => {
      if (searchQuery.trim()) {
        const text = `${d.title} ${d.faculty_name} ${d.cr_name} ${d.subject} ${d.program || ''}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [delegations, searchQuery]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      if (searchQuery.trim()) {
        const text = `${e.course_code} ${e.course_name} ${e.exam_type} ${e.venue} ${e.scheduled_by_name}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [exams, searchQuery]);

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      if (searchQuery.trim()) {
        const text = `${n.title} ${n.content} ${n.notice_type} ${n.posted_by_name} ${n.department} ${n.program}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [notices, searchQuery]);

  // Role Counts for Department Roster
  const rosterFacultyCount = useMemo(() => {
    return registeredUsers.filter(u => u.role_id === 3 || u.role_name?.toUpperCase() === 'FACULTY').length;
  }, [registeredUsers]);

  const rosterStudentCount = useMemo(() => {
    return registeredUsers.filter(u => u.role_id === 1 || u.role_name?.toUpperCase() === 'STUDENT').length;
  }, [registeredUsers]);

  const rosterCRCount = useMemo(() => {
    return registeredUsers.filter(u => u.role_id === 2 || u.role_name?.toUpperCase() === 'CR').length;
  }, [registeredUsers]);

  // Filtered Users (Search + Faculty/Student/CR Role Filter)
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter(u => {
      // Role filter (Faculty vs Student vs CR vs ALL)
      if (userRoleFilter === 'FACULTY' && u.role_id !== 3 && u.role_name?.toUpperCase() !== 'FACULTY') {
        return false;
      }
      if (userRoleFilter === 'STUDENT' && u.role_id !== 1 && u.role_name?.toUpperCase() !== 'STUDENT') {
        return false;
      }
      if (userRoleFilter === 'CR' && u.role_id !== 2 && u.role_name?.toUpperCase() !== 'CR') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const text = `${u.full_name} ${u.email} ${u.role_name} ${u.department || ''} ${u.program || ''} ${u.subject_or_course || ''}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [registeredUsers, userRoleFilter, searchQuery]);

  return (
    <div>
      <Navbar
        title="Assignment & Governance History"
        subtitle="Permanent database record of all deliverables, delegations, exams, notices, and user accounts"
      />

      {/* Database Session Persistence Banner */}
      <div style={{
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
              100% Persistent SQLite Database Storage
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              All uploaded assignments, coursework delegations, exams, notices, and created accounts are permanently written to SQLite at-rest. Proof remains valid even if you log out or restart your browser.
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#34d399',
          background: 'rgba(16, 185, 129, 0.15)',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <span>Role: <strong>{user?.role_name}</strong></span>
          <span>·</span>
          <span>{user?.program || user?.department}</span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Total Tasks */}
        <div
          onClick={() => setActiveTab('ALL')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
            background: activeTab === 'ALL' ? 'rgba(245, 78, 0, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ASSIGNED TASKS</span>
            <History size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {stats.total_tasks || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total assigned history
          </div>
        </div>

        {/* Ongoing / In-Progress */}
        <div
          onClick={() => setActiveTab('ACTIVE')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'ACTIVE' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
            background: activeTab === 'ACTIVE' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TASKS LEFT / DUE</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#f59e0b', marginTop: '4px' }}>
            {stats.active_tasks || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Students still working
          </div>
        </div>

        {/* Fully Completed */}
        <div
          onClick={() => setActiveTab('COMPLETED')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'COMPLETED' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            background: activeTab === 'COMPLETED' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>100% COMPLETED</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#10b981', marginTop: '4px' }}>
            {stats.completed_tasks || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Submissions verified
          </div>
        </div>

        {/* Coursework Delegations */}
        <div
          onClick={() => setActiveTab('DELEGATIONS')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'DELEGATIONS' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
            background: activeTab === 'DELEGATIONS' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CR DELEGATIONS</span>
            <Send size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#6366f1', marginTop: '4px' }}>
            {stats.total_delegations || delegations.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Faculty ➔ CR workflows
          </div>
        </div>

        {/* Scheduled Exams */}
        <div
          onClick={() => setActiveTab('EXAMS')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'EXAMS' ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
            background: activeTab === 'EXAMS' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>EXAM SCHEDULES</span>
            <Calendar size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#3b82f6', marginTop: '4px' }}>
            {stats.total_exams || exams.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Midterms & Finals
          </div>
        </div>

        {/* Registered User Accounts — Exclusively visible to HOD */}
        {isHOD && (
          <div
            onClick={() => setActiveTab('USERS')}
            className="glass-card"
            style={{
              padding: '16px 18px',
              cursor: 'pointer',
              border: activeTab === 'USERS' ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
              background: activeTab === 'USERS' ? 'rgba(236, 72, 153, 0.08)' : 'var(--bg-card)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DEPARTMENT ROSTER</span>
              <Users size={16} color="#ec4899" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ec4899', marginTop: '4px' }}>
              {stats.total_users || registeredUsers.length || 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Faculty & Student Accounts
            </div>
          </div>
        )}

        {/* Files & Documents Shared */}
        <div
          onClick={() => setActiveTab('FILES')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: activeTab === 'FILES' ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
            background: activeTab === 'FILES' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ATTACHED FILES</span>
            <Download size={16} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#14b8a6', marginTop: '4px' }}>
            {stats.files_shared || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Downloadable PDFs/Docs
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '22px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('ALL')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'ALL' ? 'var(--primary)' : 'var(--bg-secondary)',
              color: activeTab === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'ALL' ? 'var(--primary)' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <History size={13} />
            <span>All Assigned Tasks</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'ACTIVE' ? '#f59e0b' : 'var(--bg-secondary)',
              color: activeTab === 'ACTIVE' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'ACTIVE' ? '#f59e0b' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} />
            <span>Ongoing / Pending</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'COMPLETED' ? '#10b981' : 'var(--bg-secondary)',
              color: activeTab === 'COMPLETED' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'COMPLETED' ? '#10b981' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={13} />
            <span>100% Completed</span>
          </button>

          <button
            onClick={() => setActiveTab('DELEGATIONS')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'DELEGATIONS' ? '#6366f1' : 'var(--bg-secondary)',
              color: activeTab === 'DELEGATIONS' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'DELEGATIONS' ? '#6366f1' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={13} />
            <span>Faculty ➔ CR Delegations</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {delegations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EXAMS')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'EXAMS' ? '#3b82f6' : 'var(--bg-secondary)',
              color: activeTab === 'EXAMS' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'EXAMS' ? '#3b82f6' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={13} />
            <span>Exam Schedules</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {exams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('NOTICES')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'NOTICES' ? '#f43f5e' : 'var(--bg-secondary)',
              color: activeTab === 'NOTICES' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'NOTICES' ? '#f43f5e' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Megaphone size={13} />
            <span>Notices & Bulletins</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {notices.length}
            </span>
          </button>

          {isHOD && (
            <button
              onClick={() => setActiveTab('USERS')}
              className="btn btn-sm"
              style={{
                background: activeTab === 'USERS' ? '#ec4899' : 'var(--bg-secondary)',
                color: activeTab === 'USERS' ? '#ffffff' : 'var(--text-secondary)',
                borderColor: activeTab === 'USERS' ? '#ec4899' : 'var(--border-subtle)',
                fontSize: '12px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={13} />
              <span>Registered Accounts Roster</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                {registeredUsers.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('FILES')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'FILES' ? '#14b8a6' : 'var(--bg-secondary)',
              color: activeTab === 'FILES' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activeTab === 'FILES' ? '#14b8a6' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} />
            <span>Attached Files ({stats.files_shared || 0})</span>
          </button>
        </div>

        {/* Search & Urgency Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr auto',
          gap: '12px',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              placeholder="Search historical assignments, exams, accounts, programs, or authors..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            className="input-field"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="">All Urgency Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={loadHistory}
            className="btn btn-secondary"
            title="Refresh History from Database"
            style={{ width: '40px', padding: 0 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}

      {/* ─── 1. DELEGATIONS VIEW ─── */}
      {activeTab === 'DELEGATIONS' && (
        <div>
          {filteredDelegations.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Inbox size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#6366f1' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No faculty-to-CR delegations recorded yet</p>
              <p style={{ fontSize: '13px' }}>Faculty assignments delegated to Class Representatives will be logged here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredDelegations.map((d) => (
                <div
                  key={d.delegation_id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: d.status === 'PUBLISHED' ? '3px solid #10b981' : '3px solid #6366f1'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#6366f1',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {d.course_code || 'COURSE'}
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {d.subject} · {d.program} ({d.semester})
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        <ShieldCheck size={11} /> Database Verified Proof
                      </span>
                    </div>

                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: d.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: d.status === 'PUBLISHED' ? '#10b981' : '#6366f1',
                      border: `1px solid ${d.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                    }}>
                      {d.status === 'PUBLISHED' ? '✓ PUBLISHED TO STUDENTS' : '⏳ AWAITING CR ACCEPTANCE'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.title}
                    </h3>
                    {d.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {d.description}
                      </p>
                    )}
                  </div>

                  {/* Document Attachment Button if present */}
                  {d.document_url && (
                    <a
                      href={d.document_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#14b8a6',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        width: 'fit-content'
                      }}
                    >
                      <FileText size={14} />
                      <span>Download Attached Assignment: <strong>{d.document_name || 'Assignment File'}</strong></span>
                      <Download size={13} />
                    </a>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      <span>From: <strong style={{ color: 'var(--text-primary)' }}>Prof. {d.faculty_name}</strong></span>
                      <span style={{ margin: '0 8px' }}>➔</span>
                      <span>Assigned to CR: <strong style={{ color: 'var(--text-primary)' }}>{d.cr_name}</strong></span>
                    </div>
                    <div>
                      <span>Due: <strong>{d.due_date}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 2. EXAM SCHEDULES VIEW ─── */}
      {activeTab === 'EXAMS' && (
        <div>
          {filteredExams.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#3b82f6' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No exams scheduled in database</p>
              <p style={{ fontSize: '13px' }}>Exams published by Faculty or HOD will appear here permanently.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredExams.map((e) => (
                <div
                  key={e.exam_id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: '3px solid #3b82f6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {e.course_code}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {e.course_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {e.exam_type}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        <ShieldCheck size={11} /> Database Record
                      </span>

                      {(user?.role_id === 3 || user?.role_id === 4 || user?.role === 'Faculty' || user?.role === 'HOD') && (
                        <button
                          onClick={() => handleDeleteExam(e.exam_id, e.course_code, e.exam_type)}
                          title="Delete scheduled exam permanently"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            padding: '3px 9px',
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
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      <Clock size={15} color="#3b82f6" />
                      <span>Exam Date: <strong>{e.exam_date}</strong></span>
                    </div>
                    {e.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <MapPin size={15} color="#10b981" />
                        <span>Venue: <strong>{e.venue}</strong></span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      <span>Scheduled By: <strong style={{ color: 'var(--text-primary)' }}>{e.scheduled_by_name}</strong> ({e.scheduled_by_role})</span>
                      <span style={{ margin: '0 8px' }}>·</span>
                      <span>Target: {e.department} · {e.program}</span>
                    </div>
                    <div>
                      <span>Created: <strong>{e.created_at}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 3. DEPARTMENT NOTICES VIEW ─── */}
      {activeTab === 'NOTICES' && (
        <div>
          {filteredNotices.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Megaphone size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#f43f5e' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No notices broadcast yet</p>
              <p style={{ fontSize: '13px' }}>Department announcements broadcast by HOD or Faculty are archived here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredNotices.map((n) => (
                <div
                  key={n.notice_id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: '3px solid #f43f5e'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#f43f5e',
                        border: '1px solid rgba(244, 63, 94, 0.3)'
                      }}>
                        {n.notice_type}
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Audience: {n.department} · {n.program} ({n.semester})
                      </span>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      <ShieldCheck size={11} /> Published Notice
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {n.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      {n.content}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      <span>Author: <strong style={{ color: 'var(--text-primary)' }}>{n.posted_by_name}</strong> ({n.posted_by_role})</span>
                    </div>
                    <div>
                      <span>Broadcast Date: <strong>{n.created_at}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. REGISTERED ACCOUNTS VIEW (Department Isolated for HOD) ─── */}
      {activeTab === 'USERS' && isHOD && (
        <div>
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(236, 72, 153, 0.08)',
            border: '1px solid rgba(236, 72, 153, 0.25)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="#ec4899" />
              <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                <strong>Department Personnel & Enrolled Accounts Roster:</strong> Strictly isolated to enrolled Faculty, CRs, and Students of <strong>{user?.department || 'your department'}</strong>. Persisted directly in SQLite database table <code style={{ color: '#f472b6' }}>Users</code>.
              </div>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f472b6', background: 'rgba(236, 72, 153, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              {registeredUsers.length} Live Accounts in DB
            </span>
          </div>

          {/* Role Filter Selector Toolbar (Faculty vs Student vs CR vs All) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={12} color="#ec4899" /> Filter Category:
              </span>

              {/* All Personnel */}
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className="btn btn-sm"
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: userRoleFilter === 'ALL' ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
                  background: userRoleFilter === 'ALL' ? 'rgba(236, 72, 153, 0.22)' : 'transparent',
                  color: userRoleFilter === 'ALL' ? '#f472b6' : 'var(--text-secondary)',
                  fontWeight: userRoleFilter === 'ALL' ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Users size={13} />
                <span>All Personnel</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                  {registeredUsers.length}
                </span>
              </button>

              {/* Faculty Only */}
              <button
                onClick={() => setUserRoleFilter('FACULTY')}
                className="btn btn-sm"
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: userRoleFilter === 'FACULTY' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  background: userRoleFilter === 'FACULTY' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  color: userRoleFilter === 'FACULTY' ? '#fbbf24' : 'var(--text-secondary)',
                  fontWeight: userRoleFilter === 'FACULTY' ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BookOpen size={13} />
                <span>Faculty Only</span>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#fbbf24' }}>
                  {rosterFacultyCount}
                </span>
              </button>

              {/* Students Only */}
              <button
                onClick={() => setUserRoleFilter('STUDENT')}
                className="btn btn-sm"
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: userRoleFilter === 'STUDENT' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: userRoleFilter === 'STUDENT' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  color: userRoleFilter === 'STUDENT' ? '#34d399' : 'var(--text-secondary)',
                  fontWeight: userRoleFilter === 'STUDENT' ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <GraduationCap size={13} />
                <span>Students Only</span>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#34d399' }}>
                  {rosterStudentCount}
                </span>
              </button>

              {/* CRs Only */}
              <button
                onClick={() => setUserRoleFilter('CR')}
                className="btn btn-sm"
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: userRoleFilter === 'CR' ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
                  background: userRoleFilter === 'CR' ? 'rgba(20, 184, 166, 0.22)' : 'transparent',
                  color: userRoleFilter === 'CR' ? '#2dd4bf' : 'var(--text-secondary)',
                  fontWeight: userRoleFilter === 'CR' ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Award size={13} />
                <span>Class Reps (CR)</span>
                <span style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px', color: '#2dd4bf' }}>
                  {rosterCRCount}
                </span>
              </button>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Displaying <strong>{filteredUsers.length}</strong> of {registeredUsers.length} enrolled
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#ec4899' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No accounts found</p>
              <p style={{ fontSize: '13px' }}>Create an account via the Register page to see it logged here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {filteredUsers.map((u) => {
                const roleColor = {
                  HOD: '#ec4899',
                  Faculty: '#f59e0b',
                  CR: '#14b8a6',
                  Student: '#10b981',
                }[u.role_name] || 'var(--primary)';

                return (
                  <div
                    key={u.user_id}
                    className="glass-card"
                    style={{
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      borderLeft: `3px solid ${roleColor}`,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.full_name}
                        </div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {u.email}
                        </div>
                      </div>

                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: `${roleColor}22`,
                        color: roleColor,
                        border: `1px solid ${roleColor}44`
                      }}>
                        {u.role_name}
                      </span>
                    </div>

                    <div style={{
                      padding: '8px 10px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div><strong>Department:</strong> {u.department || 'Computer Science & Engineering'}</div>
                      {u.program && <div><strong>Program:</strong> {u.program}</div>}
                      {u.subject_or_course && <div><strong>Subject/Course:</strong> {u.subject_or_course}</div>}
                      {u.semester && <div><strong>Semester:</strong> {u.semester}</div>}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '11px',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}>
                        <Check size={12} /> Active in SQLite DB
                      </span>
                      {u.user_id !== user?.user_id && isHOD && (
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
                            padding: '2px 7px',
                            borderRadius: '4px',
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
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 5. ALL / ACTIVE / COMPLETED / FILES TASKS VIEW ─── */}
      {(activeTab === 'ALL' || activeTab === 'ACTIVE' || activeTab === 'COMPLETED' || activeTab === 'FILES') && (
        <div>
          {filteredTasks.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--primary)' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No task history matching filters</p>
              <p style={{ fontSize: '13px' }}>Adjust search terms or select a different filter tab.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredTasks.map((t) => (
                <div
                  key={t.deadline_id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: t.pending_count === 0 && t.total_enrolled > 0
                      ? '3px solid #10b981'
                      : t.is_overdue
                        ? '3px solid #ef4444'
                        : '3px solid var(--primary)'
                  }}
                >
                  {/* Top Bar: Subject, Program & Urgency */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        {t.course_code}
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {t.course_name} · <strong>{t.program}</strong>
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        <ShieldCheck size={11} /> Database Verified Proof
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t.is_deleted ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}>
                          ARCHIVED (DELETED FROM ACTIVE FEEDS)
                        </span>
                      ) : null}
                      <span className={`badge badge-${t.urgency?.toLowerCase() || 'medium'}`}>
                        {t.urgency}
                      </span>
                      {t.is_overdue && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.title}
                    </h3>
                    {t.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar & Completion Stats */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Student Completion Proof: </span>
                        <strong style={{ color: '#10b981' }}>{t.completed_count} Submitted</strong>
                        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
                        <strong style={{ color: t.pending_count > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                          {t.pending_count} Left (Pending)
                        </strong>
                        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Total: {t.total_enrolled} enrolled students</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.completion_rate === 100 ? '#10b981' : 'var(--text-primary)' }}>
                        {t.completion_rate}%
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div style={{
                      height: '7px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, t.completion_rate)}%`,
                        background: t.completion_rate === 100
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, var(--primary), #f59e0b)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>

                  {/* Prominent Assignment File Download Button */}
                  {t.pdf_blob_url && (
                    <a
                      href={t.pdf_blob_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '9px 14px',
                        background: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#14b8a6',
                        textDecoration: 'none',
                        fontSize: '12.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        width: 'fit-content'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={15} />
                        <span>Download Attached Assignment File / Document</span>
                      </div>
                      <Download size={14} />
                    </a>
                  )}

                  {/* Footer Action Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} />
                        <span>Due: <strong style={{ color: 'var(--text-primary)' }}>{t.due_date}</strong></span>
                      </div>
                      <div>
                        <span>Assigned By: <strong style={{ color: 'var(--text-primary)' }}>{t.posted_by_name}</strong> ({t.posted_by_role || 'Faculty'})</span>
                      </div>
                      <div>
                        <span>Created: <strong>{t.created_at}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* View Individual Student Submission Breakdown */}
                      <button
                        onClick={() => openStudentRoster(t)}
                        className="btn btn-sm btn-secondary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '5px 12px'
                        }}
                      >
                        <Users size={13} color="var(--primary)" />
                        <span>Student Roster ({t.completed_count}/{t.total_enrolled})</span>
                      </button>

                      {/* Faculty / HOD Delete or Purge Action */}
                      {(user?.role_id === 3 || user?.role_id === 4) && (
                        t.is_deleted ? (
                          <button
                            onClick={() => handleDeleteTask(t.deadline_id, t.title, true)}
                            className="btn btn-sm"
                            title="Permanently remove from database history"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              padding: '5px 12px',
                              background: 'rgba(239, 68, 68, 0.18)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Purge Record</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteTask(t.deadline_id, t.title, false)}
                            className="btn btn-sm"
                            title="Delete from active Student & CR dashboards (archives in history)"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              padding: '5px 12px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Progress Roster Modal */}
      <AnimatePresence>
        {rosterModal.isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>
                      Student Completion Proof & Roster
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Task: <strong>{rosterModal.taskTitle}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setRosterModal(prev => ({ ...prev, isOpen: false }))}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Metrics Bar */}
              <div style={{
                padding: '12px 24px',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                gap: '20px',
                fontSize: '12.5px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} color="#10b981" />
                  <span>Completed: <strong style={{ color: '#10b981' }}>{rosterModal.completed}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserX size={15} color="#f59e0b" />
                  <span>Left (Pending): <strong style={{ color: '#f59e0b' }}>{rosterModal.pending}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="var(--text-muted)" />
                  <span>Total Enrolled: <strong>{rosterModal.total}</strong></span>
                </div>
              </div>

              {/* Students List */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                {rosterModal.loading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '13px' }}>Loading real-time student completion records from database...</p>
                  </div>
                ) : rosterModal.students.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>No enrolled students found in this course program.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rosterModal.students.map((s) => (
                      <div
                        key={s.user_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: s.status === 'DONE' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                          border: s.status === 'DONE' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {s.full_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {s.email} · {s.program}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {s.status === 'DONE' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)'
                            }}>
                              <CheckCircle2 size={12} /> COMPLETED
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)'
                            }}>
                              <Clock size={12} /> PENDING
                            </span>
                          )}

                          {s.completed_at && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {s.completed_at.slice(0, 16)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setRosterModal(prev => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  Close Proof Roster
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
