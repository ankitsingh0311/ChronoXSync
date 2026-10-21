// =============================================================================
// EduTrack 3D — CR Command Hub & Batch Dashboard (CRDashboard.jsx)
// =============================================================================
// Dedicated command console for Class Representatives (CRs).
// Features:
//   - Batch / Section Overview (e.g. B.Tech CSE - Section A)
//   - Broadcast Batch Deadline with automated 48-hour conflict check
//   - OCR Timetable & Syllabus Schedule Scanner (Feature F6)
//   - Class Deadlines & Task Coordination Feed
//   - Student Grievance Dispatch Relay to Faculty / HOD
// =============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { deadlineAPI, courseAPI, ocrAPI, noticeAPI, delegationAPI, historyAPI, examAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StudentProfileBanner from '../components/StudentProfileBanner';
import ConflictModal from '../components/ConflictModal';
import TaskCard from '../components/TaskCard';
import {
  Users, Upload, Calendar, Clock, Plus, AlertTriangle,
  CheckCircle2, FileText, ChevronRight, Sparkles, ShieldAlert,
  Layers, ShieldCheck, CheckCircle, RefreshCw, Zap, Megaphone, Inbox, Paperclip, Download,
  History, ArrowUpRight, MapPin, Building2, BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CRDashboard() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [historyDelegations, setHistoryDelegations] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deadlineTab, setDeadlineTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  // Broadcast Deadline Modal
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    course_id: 1,
    title: '',
    description: '',
    due_date: '',
    urgency: 'HIGH',
    pdf_blob_url: '',
    attachment_name: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deadlineAlert, setDeadlineAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Department Notices & SQL Conflict Engine
  const [notices, setNotices] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState('');

  const batchName = user?.subject_or_course || 'B.Tech CSE - Section A (Sem 3)';
  const deptName = user?.department || 'Computer Science & Engineering';

  const loadData = async () => {
    try {
      setLoading(true);
      const [dlRes, crsRes, noticeRes, histRes, examRes] = await Promise.all([
        deadlineAPI.getAll(),
        courseAPI.getAll(),
        noticeAPI.getAll(),
        historyAPI.getHistory().catch(() => ({ data: { tasks: [], delegations: [], stats: null } })),
        examAPI.getAll(),
      ]);
      setDeadlines(dlRes.data.deadlines || []);
      setCourses(crsRes.data.courses || []);
      setNotices(noticeRes.data?.notices || []);
      setExams(examRes.data?.exams || []);
      if (histRes?.data) {
        setHistoryTasks(histRes.data.tasks || []);
        setHistoryDelegations(histRes.data.delegations || []);
        setHistoryStats(histRes.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load CR dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleStatus = async (deadlineId, newStatus) => {
    try {
      const res = await deadlineAPI.toggle(deadlineId, newStatus);
      await loadData();
      return res;
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (!window.confirm('Delete this deadline? It will be removed from the class schedule.')) return;
    try {
      await deadlineAPI.delete(deadlineId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete deadline:', err);
    }
  };

  const pendingDeadlines = deadlines.filter(d => d.submission_status !== 'DONE' && d.submission_status !== 'Completed');
  const completedDeadlines = deadlines.filter(d => d.submission_status === 'DONE' || d.submission_status === 'Completed');

  const displayedDeadlines = deadlineTab === 'PENDING'
    ? pendingDeadlines
    : deadlineTab === 'COMPLETED'
    ? completedDeadlines
    : deadlines;

  const handleAssignmentFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      const res = await delegationAPI.uploadDocument(file);
      setDeadlineForm(prev => ({
        ...prev,
        pdf_blob_url: res.data.file_url,
        attachment_name: res.data.original_name || file.name,
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleBroadcastDeadline = async (e) => {
    e.preventDefault();
    setDeadlineAlert(null);
    setSubmitting(true);
    try {
      await deadlineAPI.create({
        course_id: parseInt(deadlineForm.course_id),
        title: deadlineForm.title,
        description: deadlineForm.description,
        due_date: deadlineForm.due_date,
        urgency: deadlineForm.urgency,
        pdf_blob_url: deadlineForm.pdf_blob_url || null,
        department: user?.department || 'Computer Science & Engineering',
        program: user?.program || 'Core CSE',
      });
      setDeadlineAlert({ type: 'success', message: '✓ Class assignment broadcasted successfully to all program students!' });
      setShowDeadlineModal(false);
      setDeadlineForm({ course_id: courses[0]?.course_id || 1, title: '', description: '', due_date: '', urgency: 'HIGH', pdf_blob_url: '', attachment_name: '' });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to post deadline.';
      if (err.response?.status === 409 || msg.includes('CONFLICT') || msg.includes('Exam') || msg.includes('trigger')) {
        setConflictDetails(msg);
        setShowConflictModal(true);
        setShowDeadlineModal(false);
      } else {
        setDeadlineAlert({ type: 'error', message: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const res = await ocrAPI.extract(file);
      setOcrResult(res.data);
      if (res.data.detected_deadlines?.length > 0) {
        const first = res.data.detected_deadlines[0];
        setDeadlineForm(prev => ({
          ...prev,
          title: first.title || prev.title,
          description: first.description || prev.description,
          due_date: first.due_date || prev.due_date,
        }));
        setShowDeadlineModal(true);
      }
    } catch (err) {
      console.error('OCR failed:', err);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Class Representative (CR) Command Hub"
        subtitle={`${deptName} · Assigned Batch: ${batchName}`}
      />

      {/* CR & Student Profile, Social Links & Avatar Overview Banner */}
      <StudentProfileBanner />

      {/* Official Department Notices from HOD */}
      {notices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={16} color="#ec4899" />
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', marginRight: '8px' }}>
                HOD Official Notice:
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {notices[0].title}
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                — {notices[0].content}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
            {notices[0].created_at}
          </span>
        </motion.div>
      )}

      {/* CR Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '22px 26px',
          marginBottom: '26px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.14) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.35)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(20, 184, 166, 0.4)',
            flexShrink: 0
          }}>
            <Users size={26} />
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
                background: 'rgba(20, 184, 166, 0.2)',
                color: '#14b8a6',
                fontWeight: 700
              }}>
                Class Representative (CR) · Academic Officer
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                ID: CR-{user?.user_id || '2'}
              </span>
            </div>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2
            }}>
              {user?.full_name || 'Class Representative'}
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Coordinator for <strong>{batchName}</strong></span>
              <span>•</span>
              <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{deptName}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/cr/faculty-assignments"
            className="btn btn-primary"
            style={{
              background: '#14b8a6',
              borderColor: '#14b8a6',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              padding: '10px 18px',
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
            }}
          >
            <Inbox size={15} /> Faculty Delegations Inbox
          </Link>
          <button
            onClick={() => setShowDeadlineModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              padding: '10px 18px'
            }}
          >
            <Plus size={16} /> Broadcast Batch Deadline
          </button>
          <Link
            to="/cr-portal"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={15} /> OCR Timetable Scanner
          </Link>
          <Link
            to="/history"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(20, 184, 166, 0.4)',
              background: 'rgba(20, 184, 166, 0.1)',
              color: '#5eead4',
              fontWeight: 600
            }}
          >
            <History size={15} /> Proof & History ({historyStats?.total_tasks || historyTasks.length || 0})
          </Link>
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
          style={{ padding: '18px 20px', borderLeft: '3px solid #14b8a6' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Batch Student Strength
            </span>
            <Users size={16} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            64
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Registered Section Cohort
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Sync active across batch
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #6366f1' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Batch Deadlines
            </span>
            <FileText size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {deadlines.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Course Assignments & Lab Deadlines
          </div>
          <div style={{ fontSize: '11px', color: '#2dd4bf', marginTop: '4px' }}>
            Broadcasted to all students
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #10b981' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Conflict Guard Status
            </span>
            <ShieldCheck size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#10b981', marginTop: '6px' }}>
            PROTECTED
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            SQL 48h Clash Trigger Active
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Blocks overlapping exams & tasks
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #f59e0b' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Timetable OCR Scanner
            </span>
            <Upload size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '6px' }}>
            F6 ENGINE
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tesseract / OpenCV Ready
          </div>
          <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px' }}>
            Auto-extracts schedules from images
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #6366f1' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Scheduled Exams
            </span>
            <Calendar size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#818cf8', marginTop: '6px' }}>
            {exams.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Official Milestones
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Conflict Lock Active
          </div>
        </motion.div>
      </div>

      {/* Section 1: Class Deadlines & My Coursework Submissions */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#14b8a6" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Class Deadlines & My Coursework Submissions
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  CR Student Submissions Active
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                As CR, you can submit your coursework with SHA-256 cryptographic proofs or broadcast new deadlines across {batchName}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/deadlines"
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Full Deadlines Feed <ArrowUpRight size={13} />
            </Link>
            <button
              onClick={() => setShowDeadlineModal(true)}
              className="btn btn-sm btn-primary"
              style={{ background: '#14b8a6', borderColor: '#14b8a6', color: '#fff', fontSize: '12px' }}
            >
              <Plus size={13} /> Broadcast New Deadline
            </button>
          </div>
        </div>

        {/* Tab Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDeadlineTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              border: deadlineTab === 'ALL' ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
              background: deadlineTab === 'ALL' ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
              color: deadlineTab === 'ALL' ? '#5eead4' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            All Deliverables ({deadlines.length})
          </button>
          <button
            onClick={() => setDeadlineTab('PENDING')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              border: deadlineTab === 'PENDING' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: deadlineTab === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: deadlineTab === 'PENDING' ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Pending Submissions ({pendingDeadlines.length})
          </button>
          <button
            onClick={() => setDeadlineTab('COMPLETED')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              border: deadlineTab === 'COMPLETED' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: deadlineTab === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: deadlineTab === 'COMPLETED' ? '#34d399' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Completed / Sealed ({completedDeadlines.length})
          </button>
        </div>

        {displayedDeadlines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.01)',
            color: 'var(--text-muted)'
          }}>
            <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {deadlineTab === 'COMPLETED' ? 'No completed coursework yet' : 'Zero pending deadlines! All caught up.'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {deadlineTab === 'COMPLETED' ? 'Submit your coursework using the "Mark as Done" button on any pending assignment.' : 'No coursework requires immediate action.'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px'
          }}>
            {displayedDeadlines.map(dl => (
              <TaskCard
                key={dl.deadline_id}
                deadline={dl}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteDeadline}
                canDelete={Number(dl.posted_by) === Number(user?.user_id)}
                onRefresh={loadData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Layout (OCR Tools) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>

        {/* Section 2: Quick OCR Timetable Scanner */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={17} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Schedule Photo (OCR F6)
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Auto-extracts date, title, and course from timetable image
                </span>
              </div>
            </div>
            <Link to="/cr-portal" className="btn btn-sm btn-secondary" style={{ fontSize: '12px' }}>
              Full Portal <ChevronRight size={13} />
            </Link>
          </div>

          <div
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border-subtle)',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              marginBottom: '14px'
            }}
            onClick={() => document.getElementById('cr-ocr-input')?.click()}
          >
            <input
              id="cr-ocr-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleOcrUpload}
            />
            {ocrLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={24} color="#14b8a6" className="spin" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Extracting timetable text via OCR...</span>
              </div>
            ) : (
              <div>
                <Upload size={28} color="#14b8a6" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Click to upload timetable or syllabus snapshot
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports PNG, JPG, or screenshot files
                </div>
              </div>
            )}
          </div>

          {ocrResult && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              fontSize: '12px'
            }}>
              <strong style={{ color: '#14b8a6' }}>✓ OCR Extracted:</strong>
              <span style={{ marginLeft: '6px', color: 'var(--text-primary)' }}>
                {ocrResult.detected_deadlines?.length || 0} deadline items detected!
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Section 3: Official Department Examination Schedules (Conflict Guard Active) */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '28px', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#818cf8" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Official Examination Schedules & Conflict Guard
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '10px',
                fontSize: '10.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <ShieldCheck size={12} /> SQL Trigger Active
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Published by Department HOD & Faculty • Assignments scheduled within 24 hours of an exam will trigger an automatic SQL clash block.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600 }}>
            {exams.length} Exams Tracked for {deptName}
          </span>
        </div>

        {exams.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            No exams currently scheduled by HOD / Faculty for your cohort.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '14px',
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
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${typeColor}`,
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

                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {ex.course_name}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>{formattedDate}</span>
                      </div>
                      {ex.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <MapPin size={12} />
                          <span>Venue: {ex.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Scheduled by: {ex.scheduled_by}</span>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldCheck size={11} /> 24h Lock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: Department Notices & Announcements */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '24px', borderLeft: '4px solid #ec4899' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={18} color="#ec4899" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Department Notices & Circulars
              </h3>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Official circulars and announcements broadcasted by HOD and faculty for your cohort
            </p>
          </div>
          <Link
            to="/notices"
            style={{
              fontSize: '12px',
              color: '#ec4899',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: '6px',
              padding: '6px 12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
          >
            Notice Board ({notices.length}) <ChevronRight size={13} />
          </Link>
        </div>

        {notices.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            No active department notices broadcasted.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '14px',
          }}>
            {notices.slice(0, 4).map((n) => (
              <div
                key={n.notice_id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
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

                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {n.title}
                  </div>

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
                  fontSize: '10.5px',
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

      {/* Batch Task & Upload History (Proof of Work) */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '28px', border: '1px solid rgba(20, 184, 166, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} color="#14b8a6" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Batch Task & Upload History (Proof of Work)
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
                <ShieldCheck size={12} /> CR Verified Proof
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Complete record of all deadlines broadcasted by CR, uploaded syllabus/timetables, and delegations received from faculty. Persisted permanently in database.
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
              color: '#5eead4',
              borderColor: 'rgba(20, 184, 166, 0.4)'
            }}
          >
            Open Full History Console <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Audit Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BROADCASTED TASKS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14b8a6', marginTop: '2px' }}>
              {historyStats?.total_tasks || historyTasks.length || deadlines.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FACULTY DELEGATIONS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6', marginTop: '2px' }}>
              {historyStats?.total_delegations || historyDelegations.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>STORED PROOFS & FILES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
              {historyStats?.files_shared || 0} Files
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DATABASE SYNC</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Active SQLite Ledger
            </div>
          </div>
        </div>

        {/* History Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '10px 12px' }}>PROOF ID</th>
                <th style={{ padding: '10px 12px' }}>TITLE & DETAILS</th>
                <th style={{ padding: '10px 12px' }}>COURSE</th>
                <th style={{ padding: '10px 12px' }}>DUE DATE</th>
                <th style={{ padding: '10px 12px' }}>BATCH PROGRESS</th>
                <th style={{ padding: '10px 12px' }}>ATTACHED FILE</th>
              </tr>
            </thead>
            <tbody>
              {historyTasks.slice(0, 4).map((t) => (
                <tr key={`cr-hist-task-${t.task_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(20, 184, 166, 0.1)', color: '#2dd4bf', border: '1px solid rgba(20, 184, 166, 0.25)' }}>
                      TASK #{t.task_id}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created by {t.created_by_name || 'CR'}</div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {t.course_name || t.course_code || 'General'}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {t.due_date}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                      background: 'rgba(16, 185, 129, 0.12)', color: '#10b981'
                    }}>
                      {t.completed_count || 0}/{t.total_students || 0} ({t.completion_rate || 0}%)
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
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text Instruction</span>
                    )}
                  </td>
                </tr>
              ))}
              {historyDelegations.slice(0, 3).map((d) => (
                <tr key={`cr-hist-delegation-${d.delegation_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                      FACULTY #{d.delegation_id}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {d.faculty_name}</div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {d.course_name || 'Department Course'}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Active'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                      background: d.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: d.status === 'PUBLISHED' ? '#10b981' : '#f59e0b'
                    }}>
                      {d.status || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {d.document_url ? (
                      <a
                        href={d.document_url}
                        download
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '11px', color: '#a78bfa' }}
                      >
                        <Download size={12} /> View Document
                      </a>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No File Attached</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Deadline Modal */}
      <AnimatePresence>
        {showDeadlineModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '26px',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Broadcast Batch Deadline
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Guarded by SQL Conflict Engine against exam clashes within 24-48 hours.
              </p>

              {deadlineAlert && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  background: deadlineAlert.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: deadlineAlert.type === 'error' ? '#ef4444' : '#10b981',
                  border: `1px solid ${deadlineAlert.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}>
                  {deadlineAlert.message}
                </div>
              )}

              <form onSubmit={handleBroadcastDeadline} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    COURSE
                  </label>
                  <select
                    className="input"
                    value={deadlineForm.course_id}
                    onChange={e => setDeadlineForm({ ...deadlineForm, course_id: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code}: {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ASSIGNMENT TITLE
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Assignment 2 - Database Architecture"
                    value={deadlineForm.title}
                    onChange={e => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    SUBMISSION DUE DATE
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    required
                    value={deadlineForm.due_date}
                    onChange={e => setDeadlineForm({ ...deadlineForm, due_date: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ASSIGNMENT DETAILS / INSTRUCTIONS (OPTIONAL)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Provide assignment guidelines, questions, or submission instructions..."
                    value={deadlineForm.description}
                    onChange={e => setDeadlineForm({ ...deadlineForm, description: e.target.value })}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ATTACH ASSIGNMENT DOCUMENT / RUBRIC (PDF, DOCX, ZIP)
                  </label>
                  <div style={{
                    border: '1px dashed rgba(20, 184, 166, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    background: 'rgba(20, 184, 166, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <input
                      type="file"
                      id="crAssignmentFile"
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.zip,.png,.jpg"
                      onChange={handleAssignmentFileUpload}
                    />
                    <label
                      htmlFor="crAssignmentFile"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      <Paperclip size={14} color="#14b8a6" />
                      <span>{uploadingDoc ? 'Uploading Document...' : 'Choose Assignment File to Upload'}</span>
                    </label>

                    {deadlineForm.pdf_blob_url && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        color: '#10b981',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '4px'
                      }}>
                        <CheckCircle size={13} />
                        <span>Attached: <strong>{deadlineForm.attachment_name || 'Assignment Document'}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    PRIORITY / URGENCY
                  </label>
                  <select
                    className="input"
                    value={deadlineForm.urgency}
                    onChange={e => setDeadlineForm({ ...deadlineForm, urgency: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="HIGH">HIGH (Urgent Submission)</option>
                    <option value="MEDIUM">MEDIUM (Regular Homework)</option>
                    <option value="LOW">LOW (Extended Reading)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDeadlineModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ background: '#14b8a6', borderColor: '#14b8a6', color: '#fff' }}
                  >
                    {submitting ? 'Checking Conflicts...' : 'Broadcast to Batch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3D SQL Trigger Conflict Warning Modal */}
      <ConflictModal
        isOpen={showConflictModal}
        errorDetails={conflictDetails}
        onClose={() => setShowConflictModal(false)}
      />
    </div>
  );
}
