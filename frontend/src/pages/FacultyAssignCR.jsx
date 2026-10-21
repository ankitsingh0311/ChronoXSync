// =============================================================================
// ChronoSync — Faculty Coursework Delegation to CR (FacultyAssignCR.jsx)
// =============================================================================
// Enables Professors & Faculty to target a specific Program & Semester,
// identify the designated Class Representative (CR), attach assignments/documents,
// and delegate coursework for batch dispatch.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { delegationAPI, courseAPI } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Send, Users, BookOpen, Calendar, Clock, AlertTriangle, CheckCircle,
  FileText, Upload, Sparkles, ChevronRight, RefreshCw, Trash2, ArrowLeft,
  CheckCircle2, Paperclip, ExternalLink, ShieldCheck, Layers, HelpCircle,
  Download, Eye, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEPARTMENTS, DEPARTMENT_COURSES_MAP, SEMESTER_PILLS } from './Login';

export default function FacultyAssignCR() {
  const { user } = useAuth();
  const deptName = user?.department || 'Computer Science & Engineering';

  // Target Cohort State
  const [selectedDept, setSelectedDept] = useState(deptName);
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('Semester 3');

  // CR State
  const [crs, setCrs] = useState([]);
  const [allDeptCrs, setAllDeptCrs] = useState([]);
  const [selectedCR, setSelectedCR] = useState(null);
  const [crLoading, setCrLoading] = useState(false);

  // Form State
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(user?.subject_or_course || '');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState('4.0');

  // Attachment State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Delegations History State
  const [delegations, setDelegations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Available programs for chosen department
  const availablePrograms = useMemo(() => {
    if (!selectedDept || selectedDept === 'ALL') {
      return ['Core CSE', 'AIML', 'Data Science', 'Cyber Security'];
    }
    const catList = DEPARTMENT_COURSES_MAP[selectedDept];
    if (catList && Array.isArray(catList)) {
      return catList.flatMap((c) => c.items);
    }
    return ['Core CSE', 'AIML', 'Data Science', 'Cyber Security'];
  }, [selectedDept]);

  // Load initial courses and faculty delegations history
  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, dRes] = await Promise.all([
          courseAPI.getAll(),
          delegationAPI.getFacultyDelegations()
        ]);
        setCourses(cRes.data?.courses || []);
        setDelegations(dRes.data?.delegations || []);
        if (cRes.data?.courses?.length > 0 && !subject) {
          setSubject(cRes.data.courses[0].course_name);
          setSelectedCourseId(cRes.data.courses[0].course_id);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    init();
  }, []);

  // Fetch CRs whenever Program, Semester, or Department changes
  useEffect(() => {
    const fetchCRs = async () => {
      try {
        setCrLoading(true);
        const res = await delegationAPI.getCRs({
          department: selectedDept,
          program: selectedProgram,
          semester: selectedSemester
        });
        const matched = res.data?.crs || [];
        const all = res.data?.all_crs || [];
        setCrs(matched);
        setAllDeptCrs(all);

        // Auto-select first matching CR if available, otherwise clear
        if (matched.length > 0) {
          setSelectedCR(matched[0]);
        } else if (all.length > 0) {
          // If no exact match, fallback to first department CR
          setSelectedCR(all[0]);
        } else {
          setSelectedCR(null);
        }
      } catch (err) {
        console.error('Failed to fetch CRs:', err);
      } finally {
        setCrLoading(false);
      }
    };
    fetchCRs();
  }, [selectedDept, selectedProgram, selectedSemester]);

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      setUploadedFile(file);
      const res = await delegationAPI.uploadDocument(file);
      if (res.data?.success) {
        setUploadedDocUrl(res.data.url);
        setUploadedDocName(res.data.filename);
        setActionAlert({ type: 'success', message: `✓ Document "${file.name}" uploaded and attached.` });
      }
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to upload document: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setUploadingDoc(false);
    }
  };

  // Submit delegation to CR
  const handleAssignToCR = async (e) => {
    e.preventDefault();
    if (!selectedCR) {
      setActionAlert({ type: 'error', message: 'Please select a Class Representative (CR) before dispatching work.' });
      return;
    }
    if (!title || !dueDate) {
      setActionAlert({ type: 'error', message: 'Please enter assignment title and scheduled due date.' });
      return;
    }

    try {
      setSubmitting(true);
      setActionAlert(null);
      await delegationAPI.create({
        cr_id: selectedCR.user_id,
        program: selectedProgram === 'ALL' ? (selectedCR.program || 'Core CSE') : selectedProgram,
        semester: selectedSemester,
        subject: subject || 'Academic Coursework',
        course_id: selectedCourseId ? parseInt(selectedCourseId) : null,
        title,
        description,
        document_url: uploadedDocUrl || null,
        document_name: uploadedDocName || null,
        due_date: dueDate,
        urgency,
        estimated_hours: parseFloat(estimatedHours) || 4.0
      });

      setActionAlert({
        type: 'success',
        message: `✓ Assignment successfully delegated to CR ${selectedCR.full_name}! CR has been notified to broadcast it to students.`
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setUploadedFile(null);
      setUploadedDocUrl('');
      setUploadedDocName('');

      // Refresh delegation history
      const dRes = await delegationAPI.getFacultyDelegations();
      setDelegations(dRes.data?.delegations || []);
    } catch (err) {
      setActionAlert({
        type: 'error',
        message: 'Failed to delegate coursework: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete delegation
  const handleDeleteDelegation = async (delId) => {
    if (!window.confirm('Cancel this pending coursework delegation?')) return;
    try {
      await delegationAPI.delete(delId);
      setDelegations(prev => prev.filter(d => d.delegation_id !== delId));
      setActionAlert({ type: 'success', message: 'Delegated assignment removed.' });
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to remove assignment delegation.' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Header Breadcrumb & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Link
                to="/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                <ArrowLeft size={13} /> Back to Dashboard
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/</span>
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>Faculty Delegation Console</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Send size={24} color="#f59e0b" />
              Assign Coursework to Class Representative (CR)
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Select target degree program and semester, hand off syllabus materials to the designated CR, and authorize batch publication.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.25)'
            }}>
              Department: {deptName}
            </span>
          </div>
        </div>

        {/* Global Feedback Alert */}
        <AnimatePresence>
          {actionAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: actionAlert.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${actionAlert.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: actionAlert.type === 'success' ? '#34d399' : '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{actionAlert.message}</span>
              <button
                onClick={() => setActionAlert(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.95fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT: Assignment Delegation Workspace Form */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <form onSubmit={handleAssignToCR}>

              {/* STEP 1: Select Target Cohort (Program & Semester) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    1
                  </div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Target Program & Semester Cohort
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Degree Program / Course
                    </label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    >
                      <option value="ALL">All Programs (Core CSE / AIML / DS)</option>
                      {availablePrograms.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '6px' }}>
                      Academic Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    >
                      {SEMESTER_PILLS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id} ({s.year})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 2: Selected Class Representative (CR) Card */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                      2
                    </div>
                    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Select Designated Class Representative (CR)
                    </h3>
                  </div>
                  {crLoading && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />}
                </div>

                {crs.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {crs.map((cr) => {
                      const isSelected = selectedCR?.user_id === cr.user_id;
                      return (
                        <div
                          key={cr.user_id}
                          onClick={() => setSelectedCR(cr)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1.5px solid ${isSelected ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: isSelected ? '0 0 16px rgba(245,158,11,0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: isSelected ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                              color: isSelected ? '#000' : '#f59e0b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '13px'
                            }}>
                              {cr.full_name?.split(' ').map(n => n[0]).join('') || 'CR'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                                {cr.full_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {cr.email}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>
                                {cr.subject_or_course || `${cr.program} • ${cr.semester}`}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={18} color="#f59e0b" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px dashed rgba(245,158,11,0.3)',
                    fontSize: '12.5px',
                    color: '#fde68a'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertTriangle size={16} color="#f59e0b" />
                      <strong>No CR strictly assigned to {selectedProgram} ({selectedSemester})</strong>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#cbd5e1' }}>
                      You can select from active Department CRs to delegate this coursework:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '8px' }}>
                      {allDeptCrs.map((cr) => {
                        const isSelected = selectedCR?.user_id === cr.user_id;
                        return (
                          <div
                            key={cr.user_id}
                            onClick={() => setSelectedCR(cr)}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${isSelected ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{cr.full_name} ({cr.program || 'CR'})</span>
                            {isSelected && <CheckCircle size={15} color="#f59e0b" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Assignment & Deliverables Form */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    3
                  </div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Assignment Information & Material
                  </h3>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                    Assignment / Milestone Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab Assignment 4: Relational Query Optimization & B-Tree Indexing"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>

                {/* Course/Subject and Due Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Subject / Course Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Database Management Systems (CS202)"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Scheduled Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Urgency and Estimated Hours */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Urgency Level
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    >
                      <option value="LOW">Low (Minor Homework)</option>
                      <option value="MEDIUM">Medium (Standard Lab Exercise)</option>
                      <option value="HIGH">High (Major Continuous Assessment)</option>
                      <option value="CRITICAL">Critical (Mandatory Capstone Submission)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                      Estimated Study Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="40"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '12.5px', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Instructions / Description */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '5px' }}>
                    Instructions & Deliverables for Students
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific guidelines, evaluation criteria, or submission format for the CR to relay..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      background: '#141311', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '12.5px', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                {/* File Attachment / Document Upload */}
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Paperclip size={16} color="#f59e0b" />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                        Attach Problem Sheet / Syllabus PDF
                      </span>
                    </div>
                    {uploadingDoc && <span style={{ fontSize: '11px', color: '#f59e0b' }}>Uploading document...</span>}
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.zip,.png,.jpg"
                    onChange={handleFileUpload}
                    style={{ fontSize: '12px', color: '#94a3b8' }}
                  />

                  {uploadedDocName && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#34d399' }}>
                      <CheckCircle2 size={13} /> Attached: {uploadedDocName}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={submitting || !selectedCR}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: submitting || !selectedCR ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
                    opacity: submitting || !selectedCR ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Delegating to CR...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Delegate Work to CR ({selectedCR?.full_name || 'Select CR'})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Architecture Info & Delegated Assignments History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Architecture Explainer Card */}
            <div className="glass-card" style={{ padding: '18px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Sparkles size={18} color="#f59e0b" />
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                  CR Delegation Pipeline Workflow
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                When you assign coursework here, it is directly routed to the designated Class Representative's dashboard.
                The CR inspects the instructions, checks for timetable conflicts, and clicks <strong>"Assign to Student Dashboard"</strong> to broadcast it to the entire enrolled batch.
              </p>
            </div>

            {/* Delegation History Table */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={17} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Your Delegated Assignments ({delegations.length})
                  </h3>
                </div>
                <button
                  onClick={async () => {
                    const res = await delegationAPI.getFacultyDelegations();
                    setDelegations(res.data?.delegations || []);
                  }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  title="Refresh delegations"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  Loading delegation records...
                </div>
              ) : delegations.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No assignments delegated yet. Use the workspace on the left to assign coursework to your CR.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                  {delegations.map((del) => {
                    const isPublished = del.status === 'PUBLISHED';
                    return (
                      <div
                        key={del.delegation_id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isPublished ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                background: isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                color: isPublished ? '#34d399' : '#f59e0b',
                                border: `1px solid ${isPublished ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                              }}>
                                {isPublished ? '✓ RELEASED TO STUDENTS' : '⏳ PENDING CR RELEASE'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                CR: <strong style={{ color: '#fff' }}>{del.cr_name}</strong>
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
                              {del.title}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteDelegation(del.delegation_id)}
                            title="Permanently delete delegation and revoke from students"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span>Subject: <strong style={{ color: '#cbd5e1' }}>{del.subject}</strong></span>
                          <span>•</span>
                          <span>{del.program} ({del.semester})</span>
                          <span>•</span>
                          <span>Due: <strong style={{ color: '#f59e0b' }}>{del.due_date?.slice(0, 16)}</strong></span>
                        </div>

                        {del.document_url && (
                          <div style={{ marginTop: '4px' }}>
                            <a
                              href={del.document_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#38bdf8',
                                textDecoration: 'none'
                              }}
                            >
                              <FileText size={12} /> {del.document_name || 'Download Attached Document'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
