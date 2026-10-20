// =============================================================================
// ChronoSync — Cursor Developer Dashboard (Dashboard.jsx)
// =============================================================================
// Real-time workload overview, 3D Workload Stress Orb telemetry,
// high-signal KPI metrics, and prioritized academic deadline queue.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, deadlineAPI, noticeAPI, panicAPI, examAPI, syllabusAPI, reminderAPI } from '../services/api';
import Navbar from '../components/Navbar';
import WorkloadDensityGraph from '../components/WorkloadDensityGraph';
import TaskCard from '../components/TaskCard';
import { AnimatePresence } from 'framer-motion';
import {
  Clock, AlertTriangle, CheckCircle2, ListTodo,
  TrendingUp, ArrowRight, ShieldCheck, Zap, Brain,
  Megaphone, ShieldAlert, Send, X, RefreshCw, Calendar, MapPin, Building2, Bell, BookOpen,
  Layers, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_deadlines: 0,
    pending_count: 0,
    due_soon: 0,
    completed: 0,
    critical_panics: 0,
    stress_level: 'LOW',
  });
  const [recentDeadlines, setRecentDeadlines] = useState([]);
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isScanningReminders, setIsScanningReminders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Anonymous Panic Modal State
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [panicMessage, setPanicMessage] = useState('');
  const [panicLoading, setPanicLoading] = useState(false);
  const [panicResult, setPanicResult] = useState(null);
  const [panicError, setPanicError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, deadlinesRes, noticeRes, examsRes, syllabusRes, reminderRes] = await Promise.all([
        dashboardAPI.getStats(),
        deadlineAPI.getAll(),
        noticeAPI.getAll(),
        examAPI.getAll(),
        syllabusAPI.getAll().catch(() => ({ data: { syllabi: [] } })),
        reminderAPI.getAll().catch(() => ({ data: { reminders: [] } })),
      ]);
      setStats(statsRes.data);
      setRecentDeadlines((deadlinesRes.data.deadlines || []).slice(0, 3));
      setNotices(noticeRes.data?.notices || []);
      setExams(examsRes.data?.exams || []);
      setSyllabi(syllabusRes.data?.syllabi || []);
      setReminders(reminderRes.data?.reminders || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleToggleStatus = async (deadlineId, newStatus) => {
    try {
      await deadlineAPI.toggle(deadlineId, newStatus);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSyncReminders = async () => {
    try {
      setIsScanningReminders(true);
      await reminderAPI.scan();
      await fetchDashboardData();
    } catch (err) {
      console.error('Scan reminders failed:', err);
    } finally {
      setIsScanningReminders(false);
    }
  };

  const handlePanicSubmit = async (e) => {
    e.preventDefault();
    if (panicMessage.trim().length < 10) {
      setPanicError('Please enter at least 10 characters describing the workload issue.');
      return;
    }
    try {
      setPanicLoading(true);
      setPanicError('');
      const res = await panicAPI.submit({
        message: panicMessage,
        department: user?.department,
        program: user?.program
      });
      setPanicResult(res.data);
      setPanicMessage('');
      await fetchDashboardData();
    } catch (err) {
      setPanicError(err.response?.data?.detail || 'Failed to dispatch anonymous alert.');
    } finally {
      setPanicLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Student Workload & Stress Portal"
        subtitle={`${user?.department} · Program: ${user?.program || 'Enrolled'} · ${user?.full_name}`}
      />

      {/* Official Department HOD Announcements & Exam Notices */}
      {notices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.35)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Megaphone size={16} color="#ec4899" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.18)' }}>
                  HOD Department Broadcast
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {notices[0].title}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                {notices[0].content}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {notices[0].created_at}
            </span>
            <Link
              to="/notices"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#f472b6',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '6px',
                padding: '4px 10px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              All Notices ({notices.length}) →
            </Link>
          </div>
        </motion.div>
      )}

      {/* Top Banner: Automated 24-Hour Urgent Reminders (Feature F3 Python Cron Alerts) */}
      {reminders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          {/* Header Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}>
                <Clock size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#ef4444', fontSize: '13.5px' }}>
                    Automated 24-Hour Deadline Alert
                  </strong>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    fontWeight: 700,
                  }}>
                    {reminders.length} Pending Submission{reminders.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Backend scheduler identified upcoming due dates within 24 hours. Complete submissions before cutoff.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleSyncReminders}
                disabled={isScanningReminders}
                title="Sync scheduler & scan upcoming deadlines"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={12} className={isScanningReminders ? 'animate-spin' : ''} />
                {isScanningReminders ? 'Scanning...' : 'Sync Scheduler'}
              </button>
              <Link
                to="/deadlines"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Open Feed →
              </Link>
            </div>
          </div>

          {/* Cards for Urgent Reminders */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
          }}>
            {reminders.map((rem) => {
              const isCrit = rem.hours_remaining <= 6;
              const badgeColor = isCrit ? '#ef4444' : (rem.hours_remaining <= 12 ? '#f97316' : '#eab308');

              return (
                <div
                  key={rem.reminder_id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${badgeColor}40`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: badgeColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <Clock size={12} /> {rem.time_remaining_str}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${badgeColor}18`,
                        color: badgeColor,
                        fontWeight: 700,
                      }}>
                        {rem.alert_level}
                      </span>
                    </div>

                    <h4 style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      lineHeight: '1.3',
                    }}>
                      {rem.title}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {rem.course_name}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 600 }}>
                      Submission Pending
                    </span>
                    <button
                      onClick={() => handleToggleStatus(rem.deadline_id, 'DONE')}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.color = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      <CheckCircle2 size={12} /> Mark Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : stats.due_soon > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '12px 20px',
            marginBottom: '24px',
            border: '1px solid var(--semantic-error-border)',
            background: 'var(--semantic-error-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--semantic-error)' }} />
            <div>
              <strong style={{ color: 'var(--semantic-error)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                Automated 24h Warning:
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', marginLeft: '6px' }}>
                {stats.due_soon} assignment{stats.due_soon > 1 ? 's' : ''} scheduled within the next 24 hours.
              </span>
            </div>
          </div>
          <Link
            to="/deadlines"
            className="btn btn-danger"
            style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
          >
            Review Deadlines
          </Link>
        </motion.div>
      ) : null}

      {/* Main Grid: 3D Workload Stress Orb + Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.15fr) 2fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Workload Density Trajectory Graph (Replaces Orb per DESIGN.md) */}
        <WorkloadDensityGraph
          stressLevel={stats.stress_level}
          pendingCount={stats.pending_count}
          deadlines={recentDeadlines}
        />


        {/* 4 Academic KPI Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Card 1: Pending */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pending Queue
                </span>
                <Clock size={16} style={{ color: 'var(--semantic-warning)' }} />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {stats.pending_count}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Open student deliverables
              </div>
            </div>

            {/* Card 2: Due <24h */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Imminent Window
                </span>
                <AlertTriangle size={16} style={{ color: 'var(--semantic-error)' }} />
              </div>
              <div style={{
                fontSize: '2.4rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
                color: stats.due_soon > 0 ? 'var(--semantic-error)' : 'inherit'
              }}>
                {stats.due_soon}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Due in &lt; 24 hours
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Completed
                </span>
                <CheckCircle2 size={16} style={{ color: 'var(--semantic-success)' }} />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                ACID audit log confirmed
              </div>
            </div>

            {/* Card 4: Total Feed Size */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Curated Catalog
                </span>
                <Zap size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {stats.total_deadlines}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                O(1) dictionary indexed
              </div>
            </div>

            {/* Card 5: Scheduled Department Exams */}
            <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #6366f1', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: '#818cf8' }} />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Scheduled Department Examinations
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <ShieldCheck size={12} /> Conflict Guard Trigger Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: '#818cf8' }}>
                  {exams.length}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  milestones scheduled by HOD / Faculty for {user?.department || 'Department'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13.5px', marginBottom: '2px' }}>
                Workload Management Shortcuts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Access neuro-ergonomic focus cycles or browse filtered semester tasks
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/ai-assistant" className="btn" style={{ fontSize: '12.5px', height: '34px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(147, 51, 234, 0.15))', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={14} />
                <span>AI Report Analyst</span>
              </Link>
              <button
                type="button"
                onClick={() => { setShowPanicModal(true); setPanicResult(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '12.5px', height: '34px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldAlert size={14} color="#ef4444" />
                <span>Panic Button</span>
              </button>
              <Link to="/timer" className="btn btn-secondary" style={{ fontSize: '12.5px', height: '34px' }}>
                <Clock size={14} />
                <span>Focus Timer</span>
              </Link>
              <Link to="/deadlines" className="btn btn-primary" style={{ fontSize: '12.5px', height: '34px' }}>
                <span>Academic Feed</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Upcoming Tasks Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
              Top Priority Academic Deadlines
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sorted chronologically via index scan on due_date
            </p>
          </div>
          <Link
            to="/deadlines"
            style={{
              fontSize: '12.5px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--primary)',
            }}
          >
            <span>View All ({stats.total_deadlines})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentDeadlines.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No pending deadlines in the queue. You are all caught up!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {recentDeadlines.map((dl) => (
              <TaskCard
                key={dl.deadline_id}
                deadline={dl}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Official Department Examination Schedules (Feature F2 Conflict Guard) */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#818cf8" />
              <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                Official Examination Schedules & Conflict Guard
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Scheduled by Department HOD & Faculty • Assignments within 24h locked automatically by SQL trigger
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={13} color="#10b981" />
            <span>{exams.length} Exams Active ({user?.department || 'Department'})</span>
          </span>
        </div>

        {exams.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Calendar size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div>No upcoming examinations currently scheduled for your department ({user?.department}).</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {exams.map((ex) => {
              const examDate = new Date(ex.exam_date);
              const formattedDate = isNaN(examDate.getTime()) ? ex.exam_date : examDate.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              const typeColor = ex.exam_type === 'FINAL' ? '#ef4444' : ex.exam_type === 'MIDTERM' ? '#f59e0b' : '#3b82f6';
              return (
                <div
                  key={ex.exam_id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    borderLeft: `4px solid ${typeColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${typeColor}20`,
                        color: typeColor,
                        border: `1px solid ${typeColor}40`
                      }}>
                        {ex.exam_type}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {ex.course_code}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {ex.course_name}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="var(--text-muted)" />
                        <span style={{ fontWeight: 500 }}>{formattedDate}</span>
                      </div>
                      {ex.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <MapPin size={13} />
                          <span>Venue: {ex.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>By: {ex.scheduled_by}</span>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldCheck size={11} /> Conflict Triggered
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Syllabus & Teaching Progress (Live Faculty Progress Sync) */}
      {syllabi.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#10b981" />
                <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Course Syllabus & Teaching Progress
                </h2>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Unit-wise curriculum coverage marked in real-time by your professors
              </p>
            </div>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {syllabi.length} Active Courses Synchronized
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {syllabi.map((s) => (
              <div
                key={s.syllabus_id}
                className="glass-card"
                style={{ padding: '18px 20px', borderTop: '3px solid #10b981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.course_code || 'COURSE'}
                    </span>
                    <h3 style={{ margin: '6px 0 2px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.course_name}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Faculty: {s.faculty_name} • {s.program}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      {s.coverage_pct}%
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {s.completed_units}/{s.total_units} Units
                    </div>
                  </div>
                </div>

                <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${s.coverage_pct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 0.4s ease' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {(s.units || []).map((u) => (
                    <div
                      key={u.unit_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: u.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${u.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                        fontSize: '11.5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.completed ? (
                          <CheckCircle size={13} color="#10b981" />
                        ) : (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                        )}
                        <span style={{ color: u.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          <strong style={{ color: '#f59e0b', marginRight: '4px' }}>{u.unit_label}:</strong>
                          {u.unit_title}
                        </span>
                      </div>
                      <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: u.completed ? '#10b981' : 'var(--text-muted)' }}>
                        {u.completed ? 'Covered' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Notices & Circulars */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="#ec4899" />
              <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                Department Notices & Announcements
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Official administrative directives and circulars broadcasted to your cohort
            </p>
          </div>
          <Link
            to="/notices"
            style={{
              fontSize: '12.5px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#ec4899',
              textDecoration: 'none'
            }}
          >
            <span>Notice Board ({notices.length})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {notices.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Megaphone size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div>No circulars or notices broadcasted for your program currently.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {notices.slice(0, 4).map((n) => (
              <div
                key={n.notice_id}
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  borderTop: '3px solid #ec4899',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: n.notice_type === 'URGENT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                      color: n.notice_type === 'URGENT' ? '#ef4444' : '#ec4899'
                    }}>
                      {n.notice_type}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {n.program || 'Campus-wide'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {n.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {n.content}
                  </p>
                </div>

                <div style={{
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <span>By: {n.posted_by_name || 'Department Chair'}</span>
                  <span>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anonymous Panic Button Modal */}
      <AnimatePresence>
        {showPanicModal && (
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
                padding: '26px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(239,68,68,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={22} color="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc', fontWeight: 600 }}>
                    Anonymous Workload Grievance Dispatch
                  </h3>
                </div>
                <button
                  onClick={() => setShowPanicModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: '6px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                color: '#34d399', fontSize: '12px', marginBottom: '16px', lineHeight: '1.45'
              }}>
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                <strong>100% Anonymous:</strong> Your name and user_id are stripped. This alert is routed strictly to the <strong>{user?.department} HOD</strong> dashboard with NLP sentiment classification.
              </div>

              {panicError && (
                <div style={{ padding: '9px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
                  {panicError}
                </div>
              )}

              {panicResult ? (
                <div style={{
                  padding: '16px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
                    ✓ Grievance Dispatched to HOD!
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                    NLP Sentiment Analysis: <strong style={{ color: panicResult.sentiment_label === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{panicResult.sentiment_label}</strong> (Polarity: {panicResult.sentiment_score})
                  </div>
                  <button
                    onClick={() => setShowPanicModal(false)}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 16px' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePanicSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Describe the deadline cluster / workload grievance:
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="e.g. We have 3 major submissions and a lab exam scheduled on the same day for AIML. We need an extension..."
                      value={panicMessage}
                      onChange={(e) => setPanicMessage(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowPanicModal(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={panicLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '6px', background: '#ef4444',
                        border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {panicLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                      Submit Anonymously
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
