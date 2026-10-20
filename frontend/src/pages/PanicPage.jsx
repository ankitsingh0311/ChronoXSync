// =============================================================================
// ChronoSync — Real-Life Institutional Grievance & Distress Portal (PanicPage.jsx)
// =============================================================================
// Student workload grievance and academic distress redressal console.
// Features:
//   - Dynamic Department HOD Recipient card (Dr. Sanjay Desai & Department Chairs)
//   - Dual-Mode Identity: 100% Guaranteed Anonymous vs. Confidential Named Follow-up
//   - Grievance Category & Urgency Classification (Clashing, Exam Overload, Pacing)
//   - Evidence & Proof Attachment Support (Timetable / Rubric screenshots)
//   - Natural Language Processing (VADER / TextBlob) Sentiment Classification
//   - Direct Real-time Escalation to Respective Department HOD's Command Console
//   - Real-time Grievance Tracking with Official HOD Mitigation Notes
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { panicAPI } from '../services/api';
import {
  AlertTriangle, ShieldCheck, Send, CheckCircle2, User, UserX,
  Clock, FileText, Upload, RefreshCw, ChevronRight, MessageSquare,
  Building2, Mail, MapPin, Sparkles, AlertCircle, Eye, Paperclip,
  ExternalLink, Check, Tag, Info, ArrowRight, ShieldAlert, Award
} from 'lucide-react';

const GRIEVANCE_CATEGORIES = [
  { id: 'WORKLOAD_CLUSTER', label: 'Assignment & Lab Deadline Clustering', desc: 'Multiple heavy submissions due on the same date or within 24h' },
  { id: 'EXAM_CONFLICT', label: 'Exam / Midterm Clash with Deliverables', desc: 'Scheduled examination overlaps directly with project submissions' },
  { id: 'UNREASONABLE_DEADLINE', label: 'Short Notice / Unreasonable Timeline', desc: 'Faculty announced assignment with insufficient preparation time' },
  { id: 'FACULTY_PACING', label: 'Syllabus Pacing & Coordination Issue', desc: 'Lab sessions ahead of lecture theory or pacing is too rushed' },
  { id: 'LAB_INFRASTRUCTURE', label: 'Lab Systems & Resource Availability Bug', desc: 'College server, lab environment, or equipment downtime preventing work' },
  { id: 'EMERGENCY_WELLBEING', label: 'Emergency Academic Distress / Stress Relief', desc: 'Severe academic burnout, medical contingency, or personal emergency' },
  { id: 'OTHER', label: 'General Departmental Grievance', desc: 'Any other academic concern requiring HOD review' }
];

const SUGGESTION_CHIPS = [
  "3 Programming labs and viva due on the same Friday",
  "Midterm exam scheduled within 24 hours of major project submission",
  "Faculty announced surprise 10-page assignment with only 48 hours notice",
  "Lab machines down during normalization assignment week; need extension",
  "Consecutive deadlines causing extreme study stress across student cohort"
];

export default function PanicPage() {
  const { user } = useAuth();

  // Active Tab: 'SUBMIT' | 'TRACKING'
  const [activeTab, setActiveTab] = useState('SUBMIT');

  // Form State
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('WORKLOAD_CLUSTER');
  const [courseName, setCourseName] = useState(user?.subject_or_course || '');
  const [urgency, setUrgency] = useState('HIGH');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [message, setMessage] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Submission Status & Result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // HOD Directory & Recipient Info
  const [hodInfo, setHodInfo] = useState(null);
  const [allDepts, setAllDepts] = useState([]);
  const [loadingHod, setLoadingHod] = useState(true);

  // My Grievances History
  const [myGrievances, setMyGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);

  // Load HOD info for selected department
  const loadHodInfo = async (deptName) => {
    try {
      setLoadingHod(true);
      const res = await panicAPI.getHodDirectory({ department: deptName });
      setHodInfo(res.data.hod || null);
      if (res.data.departments) {
        setAllDepts(res.data.departments);
      }
    } catch (err) {
      console.error('Failed to load HOD info:', err);
    } finally {
      setLoadingHod(false);
    }
  };

  // Load Student's previous grievances
  const loadMyGrievances = async () => {
    try {
      setLoadingGrievances(true);
      const res = await panicAPI.getMyGrievances();
      setMyGrievances(res.data.grievances || []);
    } catch (err) {
      console.error('Failed to load my grievances:', err);
    } finally {
      setLoadingGrievances(false);
    }
  };

  useEffect(() => {
    const dept = user?.department || 'Computer Science & Engineering';
    setDepartment(dept);
    loadHodInfo(dept);
    loadMyGrievances();
  }, [user]);

  const handleDepartmentChange = (newDept) => {
    setDepartment(newDept);
    loadHodInfo(newDept);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Proof attachment file size must be less than 10MB.');
      return;
    }

    try {
      setUploadingFile(true);
      setError('');
      const res = await panicAPI.uploadProof(file);
      setUploadedUrl(res.data.url);
      setProofFile(file.name);
    } catch (err) {
      console.error('File upload failed:', err);
      setError('Failed to upload proof document. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Grievance
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError('Please provide at least 10 characters detailing your workload or academic concern.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        message: message.trim(),
        subject: subject.trim() || 'Academic Workload Grievance',
        category,
        urgency,
        department,
        program: user?.program || 'Core CSE',
        course_name: courseName.trim(),
        is_anonymous: isAnonymous,
        file_attachment: uploadedUrl
      };

      const res = await panicAPI.submit(payload);
      setResult(res.data);
      setMessage('');
      setSubject('');
      setProofFile(null);
      setUploadedUrl('');

      // Refresh student's grievance list
      loadMyGrievances();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch grievance to HOD desk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Workload Grievance Dispatch"
        subtitle="Confidential institutional escalation portal analyzed with VADER/TextBlob sentiment NLP"
      />

      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ─── 1. RECIPIENT HOD INSTITUTIONAL CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '22px 26px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(239, 68, 68, 0.4)',
                flexShrink: 0
              }}>
                <Building2 size={26} color="#ffffff" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em'
                  }}>
                    Direct Escalation Desk
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={12} /> Active Department Authority
                  </span>
                </div>

                <h2 style={{
                  margin: '6px 0 2px',
                  fontSize: '1.45rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                  fontWeight: 700
                }}>
                  {loadingHod ? 'Loading Department Head...' : (hodInfo?.full_name || 'Dr. Sanjay Desai')}
                </h2>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{hodInfo?.designation || 'Head of Department (HOD) & Senior Professor'}</strong>
                  <span>•</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{department}</span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} color="#ef4444" />
                    <code style={{ color: 'var(--text-primary)' }}>{hodInfo?.email || 'sanjay.hod@edutrack.ac'}</code>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="#6366f1" />
                    <span>{hodInfo?.office || 'Academic Block 4, Chamber #402'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#10b981" />
                    <span>HOD Review SLA &lt; 24h</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Department Scope Selector */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              minWidth: '220px'
            }}>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
                Recipient Department:
              </label>
              <select
                className="input-field"
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                style={{ fontSize: '12.5px', padding: '6px 10px', width: '100%', background: 'var(--bg-tertiary)' }}
              >
                {allDepts.length > 0 ? (
                  allDepts.map(d => (
                    <option key={d.department} value={d.department}>
                      {d.department} ({d.hod_name})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (Dr. Sanjay Desai)</option>
                    <option value="Information Technology">Information Technology (Dr. Sunita Sharma)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication (Dr. Rajesh Patel)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (Dr. Amit Verma)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </motion.div>

        {/* ─── 2. TAB CONTROLLER ─── */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('SUBMIT')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'SUBMIT' ? 'var(--primary)' : 'var(--bg-secondary)',
              color: activeTab === 'SUBMIT' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'SUBMIT' ? 'var(--primary)' : 'var(--border-subtle)',
              fontSize: '13px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}
          >
            <Send size={14} />
            <span>Submit Grievance / Workload Alert</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('TRACKING');
              loadMyGrievances();
            }}
            className="btn btn-sm"
            style={{
              background: activeTab === 'TRACKING' ? '#6366f1' : 'var(--bg-secondary)',
              color: activeTab === 'TRACKING' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'TRACKING' ? '#6366f1' : 'var(--border-subtle)',
              fontSize: '13px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}
          >
            <Clock size={14} />
            <span>My Submitted Grievances & HOD Responses</span>
            {myGrievances.length > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                {myGrievances.length}
              </span>
            )}
          </button>
        </div>

        {/* ─── TAB 1: SUBMIT GRIEVANCE FORM ─── */}
        {activeTab === 'SUBMIT' && (
          <div className="glass-card" style={{ padding: '28px' }}>

            {/* Privacy & Security Mode Indicator */}
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: isAnonymous ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
              border: `1px solid ${isAnonymous ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
              marginBottom: '22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: isAnonymous ? 'rgba(16, 185, 129, 0.18)' : 'rgba(99, 102, 241, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isAnonymous ? <ShieldCheck size={18} color="#10b981" /> : <User size={18} color="#6366f1" />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isAnonymous ? '100% Anonymous Mode Active' : 'Confidential Named Follow-Up Mode Active'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isAnonymous ? (
                      <span>Identity stripped: HOD will only see your department and cohort program.</span>
                    ) : (
                      <span>HOD can view your name (<code>{user?.full_name || 'Student'}</code>) to provide personalized relief.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Anonymity Mode Switcher */}
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: isAnonymous ? '#10b981' : 'transparent',
                    color: isAnonymous ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  🛡️ True Anonymous
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: !isAnonymous ? '#6366f1' : 'transparent',
                    color: !isAnonymous ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  👤 Named Follow-up
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', fontWeight: 700 }}>
                  <CheckCircle2 size={18} />
                  <span>Grievance Dispatched to HOD Desk Successfully!</span>
                </div>
                <p style={{ margin: '6px 0 10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {result.message}
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  <span>Ticket Reference: <strong style={{ color: '#f59e0b' }}>{result.ticket_number}</strong></span>
                  <span>Target Authority: <strong>{result.hod_name}</strong></span>
                  <span>NLP Polarity: <strong>{result.sentiment_score}</strong></span>
                  <span>Triage Severity: <strong style={{ color: result.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{result.severity}</strong></span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => {
                      setActiveTab('TRACKING');
                      loadMyGrievances();
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px' }}
                  >
                    View Status in My Grievances Tab <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Banner */}
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            {/* Grievance Form */}
            <form onSubmit={handleSubmit}>

              {/* Category Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Select Grievance Category:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                  {GRIEVANCE_CATEGORIES.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: category === cat.id ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                        border: category === cat.id ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '12.5px', color: category === cat.id ? '#ef4444' : 'var(--text-primary)' }}>
                        <Tag size={13} />
                        <span>{cat.label}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {cat.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Title & Involved Course Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Grievance Subject / Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 programming labs & midterm exam scheduled on Friday"
                    className="input-field"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Concerned Course / Subject (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS202 - RDBMS / CS201 - Data Structures"
                    className="input-field"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>
              </div>

              {/* Urgency Level Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Academic Distress / Urgency Level:
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'CRITICAL', label: 'Critical Distress', desc: 'Deadlines overlap within 24h', color: '#ef4444' },
                    { id: 'HIGH', label: 'High Priority', desc: 'Heavy stress & multiple submissions', color: '#f59e0b' },
                    { id: 'MEDIUM', label: 'Medium Priority', desc: 'Standard pacing adjustment', color: '#6366f1' },
                    { id: 'LOW', label: 'Low / Feedback', desc: 'General constructive suggestion', color: '#10b981' }
                  ].map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id)}
                      style={{
                        flex: '1 1 180px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: urgency === u.id ? `1.5px solid ${u.color}` : '1px solid var(--border-subtle)',
                        background: urgency === u.id ? `${u.color}1a` : 'var(--bg-secondary)',
                        color: urgency === u.id ? u.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{u.label}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{u.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  QUICK FILL SUGGESTIONS:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMessage(prev => prev ? `${prev} ${chip}` : chip);
                        if (!subject) setSubject(chip.slice(0, 50));
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Detailed Statement of Concern & Workload Conflict:
                  </label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: message.length >= 10 ? '#10b981' : 'var(--text-muted)' }}>
                    {message.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  className="input-field"
                  rows={5}
                  required
                  placeholder="Explain the specific conflict, overlapping dates, submission deadlines, or syllabus difficulties you and your peers are facing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ lineHeight: '1.5' }}
                />
              </div>

              {/* Proof / Document Attachment */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="#f59e0b" />
                    <span>Attach Timetable / Rubric Proof Document (Optional)</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Upload screenshot of date-sheet conflict, assignment rubric, or PDF document (Max 10MB)
                  </div>
                  {proofFile && (
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} />
                      <span>Attached: <strong>{proofFile}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setProofFile(null);
                          setUploadedUrl('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', marginLeft: '6px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="btn btn-sm btn-secondary"
                    style={{
                      cursor: uploadingFile ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <Upload size={13} />
                    <span>{uploadingFile ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || uploadingFile}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderColor: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(239, 68, 68, 0.4)'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Running VADER NLP Sentiment Classifier & Routing to HOD...</span>
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Dispatch Official Grievance to {hodInfo?.full_name || 'HOD'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Academic Rubric Footer */}
            <div style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span>Security Guard: Bleach HTML Sanitization &amp; Identity Token Stripper</span>
              <span>NLP Engine: VADER Sentiment Polarity Analysis</span>
              <span>Governance: Direct HOD Escalation Desk</span>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MY SUBMITTED GRIEVANCES & HOD RESOLUTIONS ─── */}
        {activeTab === 'TRACKING' && (
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  My Departmental Grievance History
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Live tracking of academic distress submissions and official HOD resolution actions
                </p>
              </div>

              <button
                onClick={loadMyGrievances}
                className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <RefreshCw size={13} className={loadingGrievances ? 'animate-spin' : ''} />
                <span>Refresh Status</span>
              </button>
            </div>

            {loadingGrievances ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Fetching your grievance records from database...
              </div>
            ) : myGrievances.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#10b981' }} />
                <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '15px' }}>
                  No grievances currently filed
                </h4>
                <p style={{ fontSize: '12.5px', margin: 0 }}>
                  Any workload complaints or panic alerts you dispatch will appear here with live HOD response notes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myGrievances.map((g) => {
                  const isResolved = g.resolved || g.status === 'RESOLVED';
                  const isCrit = g.severity === 'CRITICAL';
                  return (
                    <motion.div
                      key={g.panic_id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.3)' : (isCrit ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)')}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}>
                            {g.ticket_number}
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: isCrit ? '#ef4444' : '#818cf8',
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}>
                            {g.severity}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {g.department} · {g.program}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isResolved ? '#10b981' : '#f59e0b',
                          border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {isResolved ? '✓ MITIGATION RESOLVED' : '⏳ UNDER HOD INVESTIGATION'}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {g.subject}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.45' }}>
                          "{g.message}"
                        </p>
                      </div>

                      {/* Official Action Taken & Resolution Note */}
                      {g.resolution_notes && (
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: '12.5px',
                          color: '#34d399'
                        }}>
                          <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={13} /> Official HOD Mitigation Action Taken:
                          </div>
                          <div>{g.resolution_notes}</div>
                        </div>
                      )}

                      {/* Attached File Proof */}
                      {g.file_attachment && (
                        <div>
                          <a
                            href={g.file_attachment}
                            download
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              color: '#60a5fa',
                              border: '1px solid rgba(96, 165, 250, 0.3)'
                            }}
                          >
                            <Paperclip size={12} /> View Attached Proof Document
                          </a>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <span>Filed: {g.created_at}</span>
                        <span>Mode: {g.is_anonymous ? '🛡️ Anonymous' : '👤 Confidential Named'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
