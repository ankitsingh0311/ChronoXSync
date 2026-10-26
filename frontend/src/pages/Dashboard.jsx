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
import ExecutiveProfileHeader from '../components/ExecutiveProfileHeader';
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
import { getGoogleCalendarExamUrl, getGoogleCalendarDeadlineUrl } from '../utils/googleCalendar';

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
  const [allDeadlines, setAllDeadlines] = useState([]);
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
      const fetchedDeadlines = deadlinesRes.data.deadlines || [];
      setAllDeadlines(fetchedDeadlines);
      setRecentDeadlines(fetchedDeadlines.slice(0, 3));
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
      const res = await deadlineAPI.toggle(deadlineId, newStatus);
      await fetchDashboardData();
      return res;
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Pure Personal Information Header */}
      <ExecutiveProfileHeader
        roleAccent="var(--primary)"
        roleLabel="Student"
        roleBg="var(--semantic-success-bg)"
        roleBorder="var(--semantic-success-border)"
        designationText="Student"
      />

      {/* Academic Productivity Tools Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Academic Productivity Tools
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/timer"
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '12.5px' }}
          >
            <Clock size={14} style={{ color: 'var(--primary)' }} />
            <span>Focus Timer</span>
          </Link>
          <Link
            to="/ai-assistant"
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '12.5px' }}
          >
            <Brain size={14} style={{ color: '#8b5cf6' }} />
            <span>Study AI</span>
          </Link>
          <button
            type="button"
            onClick={() => { setShowPanicModal(true); setPanicResult(null); }}
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '12.5px', color: 'var(--semantic-error)', borderColor: 'var(--semantic-error-border)' }}
          >
            <ShieldAlert size={14} />
            <span>Grievance Dispatch</span>
          </button>
        </div>
      </div>

      {/* 2. Urgent Imminent Cutoff Alert (Only appears if pending soon) */}
      {reminders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 18px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--semantic-error-bg)',
            border: '1px solid var(--semantic-error-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--semantic-error)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--semantic-error)', fontSize: '13px' }}>
                {reminders.length} Assignment{reminders.length > 1 ? 's' : ''} Due Within 24 Hours
              </strong>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Next cutoff: <strong>{reminders[0]?.title}</strong> ({reminders[0]?.time_remaining_str || 'due soon'}).
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSyncReminders}
              disabled={isScanningReminders}
              className="btn btn-secondary"
              style={{ height: '30px', padding: '0 10px', fontSize: '11.5px' }}
            >
              <RefreshCw size={12} className={isScanningReminders ? 'animate-spin' : ''} />
              {isScanningReminders ? 'Syncing...' : 'Sync'}
            </button>
            <Link
              to="/deadlines"
              className="btn btn-danger"
              style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
            >
              Submit Now
            </Link>
          </div>
        </motion.div>
      ) : null}

      {/* 3. Four Quiet Luxury Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Metric 1 */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pending Deliverables
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: 'var(--text-primary)' }}>
            {stats.pending_count}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Active tasks to complete
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Due in &lt; 24 Hours
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stats.due_soon > 0 ? 'var(--semantic-error)' : 'var(--semantic-success)' }}></span>
          </div>
          <div style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            color: stats.due_soon > 0 ? 'var(--semantic-error)' : 'var(--text-primary)'
          }}>
            {stats.due_soon}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Immediate cutoffs
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Scheduled Exams
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: 'var(--text-primary)' }}>
            {exams.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Midterms & finals on calendar
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Completed Work
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--semantic-success)' }}></span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: 'var(--semantic-success)' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Verified submissions
          </div>
        </div>
      </div>

      {/* 4. Main High-Signal Split: Primary Stream (65%) & Focus Panel (35%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(300px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Deadlines & Exams */}
        <div>
          {/* Active Deadlines Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                  Active Deadlines & Submissions
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Your prioritized course deliverables and milestones
                </p>
              </div>
              <Link
                to="/deadlines"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View All ({stats.total_deadlines})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recentDeadlines.length === 0 ? (
              <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: 'var(--semantic-success)', opacity: 0.8 }} />
                <div>All academic submissions are up to date. Excellent pacing!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentDeadlines.map((dl) => (
                  <TaskCard
                    key={dl.deadline_id}
                    deadline={dl}
                    onToggleStatus={handleToggleStatus}
                    onRefresh={fetchDashboardData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Examinations */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                  Scheduled Examinations
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Official dates published by department faculty & HOD
                </p>
              </div>
            </div>

            {exams.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active exam schedules published for {user?.department || 'your department'}.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {exams.slice(0, 4).map((ex) => {
                  const examDate = new Date(ex.exam_date);
                  const formattedDate = isNaN(examDate.getTime()) ? ex.exam_date : examDate.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const isFinal = ex.exam_type === 'FINAL';

                  return (
                    <div
                      key={ex.exam_id}
                      className="glass-card"
                      style={{
                        padding: '16px 18px',
                        borderLeft: `3px solid ${isFinal ? 'var(--semantic-error)' : 'var(--primary)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isFinal ? 'var(--semantic-error-bg)' : 'var(--primary-subtle)',
                          color: isFinal ? 'var(--semantic-error)' : 'var(--primary)'
                        }}>
                          {ex.exam_type}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {ex.course_code || 'Exam'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', fontWeight: 600 }}>
                        {ex.course_name || ex.subject_name || 'Department Exam'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{formattedDate}</span>
                      </div>
                      {ex.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <MapPin size={12} />
                          <span>{ex.venue}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workload Telemetry & Department Bulletins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Workload Status Card */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Academic Workload Load
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: stats.stress_level === 'CRITICAL' ? 'var(--semantic-error-bg)' : (stats.stress_level === 'HIGH' ? 'var(--semantic-warning-bg)' : 'var(--semantic-success-bg)'),
                color: stats.stress_level === 'CRITICAL' ? 'var(--semantic-error)' : (stats.stress_level === 'HIGH' ? 'var(--semantic-warning)' : 'var(--semantic-success)')
              }}>
                {stats.stress_level || 'BALANCED'}
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 16px' }}>
              {stats.stress_level === 'CRITICAL'
                ? 'High submission clustering detected. Use Pomodoro pacing or submit a workload grievance.'
                : 'Your deadline distribution is manageable. Keep regular study cycles.'}
            </p>

            <div style={{
              height: '6px',
              borderRadius: '999px',
              background: 'var(--bg-tertiary)',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                height: '100%',
                width: stats.stress_level === 'CRITICAL' ? '90%' : (stats.stress_level === 'HIGH' ? '65%' : '30%'),
                background: stats.stress_level === 'CRITICAL' ? 'var(--semantic-error)' : (stats.stress_level === 'HIGH' ? 'var(--semantic-warning)' : 'var(--semantic-success)'),
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <Link
              to="/timer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '36px', fontSize: '12.5px' }}
            >
              <Clock size={14} />
              <span>Launch 25-Min Focus Session</span>
            </Link>
          </div>

          {/* Department Notices */}
          {notices.length > 0 && (
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={15} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Department Notices</span>
                </div>
                <Link to="/notices" style={{ fontSize: '12px', color: 'var(--primary)' }}>
                  View All
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notices.slice(0, 3).map((notice) => (
                  <div
                    key={notice.notice_id}
                    style={{
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {notice.title}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {notice.content ? (notice.content.length > 90 ? notice.content.substring(0, 90) + '...' : notice.content) : ''}
                    </p>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Official'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
