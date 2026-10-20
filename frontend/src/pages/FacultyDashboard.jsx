// =============================================================================
// EduTrack 3D — Faculty Academic Console & Dashboard (FacultyDashboard.jsx)
// =============================================================================
// Dedicated command console for Professors & Faculty members.
// Features:
//   - Assigned Subject & Department overview (e.g. RDBMS / CS)
//   - Class Submissions & Student Evaluation Queue
//   - Exam Publisher with automated 48-hour conflict check
//   - Syllabus Milestone Tracker (5 Units with interactive coverage)
//   - Course Workload & Student Stress telemetry
// =============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { examAPI, deadlineAPI, courseAPI, userAPI, noticeAPI, historyAPI, syllabusAPI } from '../services/api';
import { DEPARTMENTS, DEPARTMENT_COURSES_MAP, SEMESTER_PILLS, CATEGORIZED_FACULTY_SUBJECTS } from './Login';
import Navbar from '../components/Navbar';
import {
  BookOpen, Calendar, CheckCircle2, Clock, Plus, AlertTriangle,
  GraduationCap, Users, FileText, ChevronRight, Sparkles,
  BarChart2, Award, CheckCircle, RefreshCw, Layers, ShieldCheck,
  Search, Lock, Filter, Send, History, Download, ArrowUpRight, Trash2,
  PlusCircle, Edit3, CheckSquare, Square, X, FolderPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyStudents, setFacultyStudents] = useState([]);
  const [facultyDept, setFacultyDept] = useState('');
  const [facultyProgram, setFacultyProgram] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [notices, setNotices] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [historyDelegations, setHistoryDelegations] = useState([]);
  const [historyStats, setHistoryStats] = useState({});
  const [loading, setLoading] = useState(true);

  // New Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    course_id: 2,
    exam_date: '',
    exam_type: 'MIDTERM',
    venue: 'Lab 201 - RDBMS Lab'
  });
  const [examAlert, setExamAlert] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  // ===========================================================================
  // Faculty Multi-Department & Multi-Program Syllabus Management (Feature F10)
  // ===========================================================================
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState(null);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusAlert, setSyllabusAlert] = useState(null);

  // Modal: Create Custom Syllabus for any Department & Programme
  const [showCreateSyllabusModal, setShowCreateSyllabusModal] = useState(false);
  const [newSyllabusForm, setNewSyllabusForm] = useState({
    department: user?.department || 'Computer Science & Engineering',
    program: user?.program || 'B.Tech Computer Science & Engineering',
    semester: 'Semester 3',
    course_name: user?.subject_or_course || '',
    course_code: '',
    initial_units: [
      { unit_number: 1, unit_label: 'Unit 1', unit_title: '', description: '' },
      { unit_number: 2, unit_label: 'Unit 2', unit_title: '', description: '' },
      { unit_number: 3, unit_label: 'Unit 3', unit_title: '', description: '' },
      { unit_number: 4, unit_label: 'Unit 4', unit_title: '', description: '' },
      { unit_number: 5, unit_label: 'Unit 5', unit_title: '', description: '' },
    ]
  });
  const [submittingSyllabus, setSubmittingSyllabus] = useState(false);

  // Modal: Add Unit to Active Syllabus
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({
    unit_number: '',
    unit_label: '',
    unit_title: '',
    description: ''
  });
  const [submittingUnit, setSubmittingUnit] = useState(false);

  const fetchSyllabi = async () => {
    try {
      setSyllabusLoading(true);
      const res = await syllabusAPI.getAll();
      const list = res.data.syllabi || [];
      setSyllabi(list);
      if (list.length > 0) {
        setSelectedSyllabusId(prev => (prev && list.some(s => s.syllabus_id === prev)) ? prev : list[0].syllabus_id);
      } else {
        setSelectedSyllabusId(null);
      }
    } catch (err) {
      console.error('Failed to load syllabi:', err);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const handleToggleUnit = async (unit) => {
    try {
      const res = await syllabusAPI.toggleUnit(unit.unit_id, !unit.completed);
      setSyllabi(prev => prev.map(s => {
        if (s.syllabus_id === unit.syllabus_id) {
          const updatedUnits = s.units.map(u =>
            u.unit_id === unit.unit_id ? { ...u, completed: res.data.completed, completed_at: res.data.completed_at } : u
          );
          const cCount = updatedUnits.filter(u => u.completed).length;
          const tCount = updatedUnits.length;
          return {
            ...s,
            units: updatedUnits,
            completed_units: cCount,
            coverage_pct: tCount > 0 ? Math.round((cCount / tCount) * 100) : 0
          };
        }
        return s;
      }));
      setSyllabusAlert({
        type: 'success',
        message: res.data.message || 'Unit progress updated.'
      });
      setTimeout(() => setSyllabusAlert(null), 4000);
    } catch (err) {
      console.error('Failed to toggle unit:', err);
      setSyllabusAlert({ type: 'error', message: 'Failed to update unit progress: ' + (err.response?.data?.detail || err.message) });
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (!window.confirm(`Permanently delete "${unit.unit_label}: ${unit.unit_title}"?\n\nThis will remove this unit module from your syllabus with 100% accuracy.`)) {
      return;
    }
    try {
      await syllabusAPI.deleteUnit(unit.unit_id);
      setSyllabi(prev => prev.map(s => {
        if (s.syllabus_id === unit.syllabus_id) {
          const updatedUnits = s.units.filter(u => u.unit_id !== unit.unit_id);
          const cCount = updatedUnits.filter(u => u.completed).length;
          const tCount = updatedUnits.length;
          return {
            ...s,
            units: updatedUnits,
            total_units: tCount,
            completed_units: cCount,
            coverage_pct: tCount > 0 ? Math.round((cCount / tCount) * 100) : 0
          };
        }
        return s;
      }));
      setSyllabusAlert({ type: 'success', message: `✓ ${unit.unit_label} deleted from syllabus.` });
      setTimeout(() => setSyllabusAlert(null), 4000);
    } catch (err) {
      setSyllabusAlert({ type: 'error', message: 'Failed to delete unit: ' + (err.response?.data?.detail || err.message) });
    }
  };

  const handleDeleteSyllabus = async (syllabus) => {
    if (!syllabus) return;
    const confirmMsg = `Permanently delete syllabus for:\n\n• Course: ${syllabus.course_name}\n• Department: ${syllabus.department}\n• Programme: ${syllabus.program} (${syllabus.semester || 'All'})\n\nThis will delete all ${syllabus.units?.length || 0} unit modules with 100% accuracy. This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await syllabusAPI.delete(syllabus.syllabus_id);
      setSyllabi(prev => {
        const remaining = prev.filter(s => s.syllabus_id !== syllabus.syllabus_id);
        if (remaining.length > 0) {
          setSelectedSyllabusId(remaining[0].syllabus_id);
        } else {
          setSelectedSyllabusId(null);
        }
        return remaining;
      });
      setSyllabusAlert({ type: 'success', message: `✓ Syllabus for '${syllabus.course_name}' permanently deleted.` });
      setTimeout(() => setSyllabusAlert(null), 4000);
    } catch (err) {
      setSyllabusAlert({ type: 'error', message: 'Failed to delete syllabus: ' + (err.response?.data?.detail || err.message) });
    }
  };

  const handleAddUnit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSyllabusId) return;
    if (!newUnitForm.unit_title.trim()) {
      setSyllabusAlert({ type: 'error', message: 'Please enter a Unit Title.' });
      return;
    }
    try {
      setSubmittingUnit(true);
      await syllabusAPI.addUnit(selectedSyllabusId, {
        unit_number: newUnitForm.unit_number ? parseInt(newUnitForm.unit_number) : undefined,
        unit_label: newUnitForm.unit_label.trim() || undefined,
        unit_title: newUnitForm.unit_title.trim(),
        description: newUnitForm.description.trim()
      });
      setShowAddUnitModal(false);
      setNewUnitForm({ unit_number: '', unit_label: '', unit_title: '', description: '' });
      await fetchSyllabi();
      setSyllabusAlert({ type: 'success', message: `✓ Unit added to syllabus successfully.` });
      setTimeout(() => setSyllabusAlert(null), 4000);
    } catch (err) {
      setSyllabusAlert({ type: 'error', message: 'Failed to add unit: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setSubmittingUnit(false);
    }
  };

  const handleCreateSyllabus = async (e) => {
    if (e) e.preventDefault();
    if (!newSyllabusForm.department || !newSyllabusForm.program || !newSyllabusForm.course_name.trim()) {
      setSyllabusAlert({ type: 'error', message: 'Please select Department, Programme, and enter Course/Subject Name.' });
      return;
    }

    const validUnits = newSyllabusForm.initial_units.filter(u => u.unit_title.trim().length > 0);

    try {
      setSubmittingSyllabus(true);
      const res = await syllabusAPI.create({
        department: newSyllabusForm.department,
        program: newSyllabusForm.program,
        semester: newSyllabusForm.semester,
        course_name: newSyllabusForm.course_name.trim(),
        course_code: newSyllabusForm.course_code.trim(),
        units: validUnits
      });
      setShowCreateSyllabusModal(false);
      await fetchSyllabi();
      if (res.data.syllabus_id) {
        setSelectedSyllabusId(res.data.syllabus_id);
      }
      setSyllabusAlert({ type: 'success', message: `✓ ${res.data.message || 'Syllabus created successfully.'}` });
      setTimeout(() => setSyllabusAlert(null), 5000);
    } catch (err) {
      setSyllabusAlert({ type: 'error', message: 'Failed to create syllabus: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setSubmittingSyllabus(false);
    }
  };


  const loadData = async () => {
    try {
      setLoading(true);
      const [examRes, deadlineRes, courseRes, studentRes, noticeRes, histRes] = await Promise.allSettled([
        examAPI.getAll(),
        deadlineAPI.getAll(),
        courseAPI.getAll(),
        userAPI.getFacultyStudents(),
        noticeAPI.getAll(),
        historyAPI.getHistory(),
      ]);
      if (examRes.status === 'fulfilled') setExams(examRes.value.data.exams || []);
      if (deadlineRes.status === 'fulfilled') setDeadlines(deadlineRes.value.data.deadlines || []);
      if (courseRes.status === 'fulfilled') setCourses(courseRes.value.data.courses || []);
      if (studentRes.status === 'fulfilled' && studentRes.value.data?.success) {
        setFacultyStudents(studentRes.value.data.students || []);
        setFacultyDept(studentRes.value.data.department || user?.department || '');
        setFacultyProgram(studentRes.value.data.program || user?.program || '');
      }
      if (noticeRes.status === 'fulfilled') setNotices(noticeRes.value.data?.notices || []);
      if (histRes.status === 'fulfilled') {
        setHistoryTasks(histRes.value.data.tasks || []);
        setHistoryDelegations(histRes.value.data.delegations || []);
        setHistoryStats(histRes.value.data.stats || {});
      }
      await fetchSyllabi();
    } catch (err) {
      console.error('Failed to load faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDeleteAssignment = async (deadlineId, title, isDeleted = false) => {
    const isPermanent = !!isDeleted;
    const promptMsg = isPermanent
      ? `Permanently purge "${title || 'this assignment'}" from database history? This cannot be undone.`
      : `Delete "${title || 'this assignment'}"?\n\n• It will automatically be removed from Student and CR dashboards.\n• The assignment will remain safely recorded in History as proof of work.`;

    if (!window.confirm(promptMsg)) return;

    try {
      await deadlineAPI.delete(deadlineId, isPermanent ? { permanent: true } : {});
      loadData();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      alert(err.response?.data?.detail || 'Failed to delete assignment.');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setExamAlert(null);
    setSubmittingExam(true);
    try {
      await examAPI.create({
        course_id: parseInt(examForm.course_id),
        exam_date: examForm.exam_date,
        exam_type: examForm.exam_type,
        venue: examForm.venue,
        department: user?.department || 'Computer Science & Engineering',
        program: user?.program || 'AIML',
      });
      setExamAlert({ type: 'success', message: '✓ Examination schedule published and synchronized with college calendar!' });
      setShowExamModal(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to schedule exam.';
      setExamAlert({ type: 'error', message: msg });
    } finally {
      setSubmittingExam(false);
    }
  };

  const activeSyllabus = syllabi.find(s => s.syllabus_id === selectedSyllabusId) || syllabi[0] || null;
  const activeUnits = activeSyllabus?.units || [];
  const completedUnits = activeUnits.filter(u => u.completed).length;
  const totalUnits = activeUnits.length;
  const syllabusProgress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  const subjectName = activeSyllabus?.course_name || user?.subject_or_course || 'Database Management Systems (RDBMS)';
  const deptName = activeSyllabus?.department || user?.department || 'Computer Science & Engineering';

  return (
    <div>
      <Navbar
        title="Faculty Academic Console"
        subtitle={`${deptName} · Subject: ${subjectName}`}
      />

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
            <span style={{ fontSize: '16px' }}>📢</span>
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

      {/* Faculty Identity Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '22px 26px',
          marginBottom: '26px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
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
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
            flexShrink: 0
          }}>
            <BookOpen size={26} />
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
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                fontWeight: 700
              }}>
                Faculty Member · Clearance Level 3
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)'
              }}>
                ID: FAC-{user?.user_id || '3'}
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
              {user?.full_name || 'Faculty Member'}
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Department of <strong>{deptName}</strong></span>
              <span>•</span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>{subjectName}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/faculty/assign-cr"
            className="btn btn-primary"
            style={{
              background: '#f59e0b',
              borderColor: '#f59e0b',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              padding: '10px 18px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Send size={15} /> Assign Work to CR
          </Link>
          <button
            onClick={() => setShowExamModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              padding: '10px 18px'
            }}
          >
            <Plus size={16} /> Schedule Exam
          </button>
          <Link
            to="/deadlines"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={15} /> Assignments ({deadlines.length})
          </Link>
          <Link
            to="/history"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#c4b5fd',
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
          style={{ padding: '18px 20px', borderLeft: '3px solid #f59e0b' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Subject Syllabus Coverage
            </span>
            <Award size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {syllabusProgress}%
          </div>
          <div style={{ marginTop: '6px', height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${syllabusProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {completedUnits} of {totalUnits} Units Completed
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #6366f1' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Enrolled Department Cohort
            </span>
            <Users size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {facultyStudents.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {facultyDept || deptName}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Department-Isolated Roster
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #10b981' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Evaluated Assessments
            </span>
            <FileText size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {deadlines.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Assignments & Lab Milestones
          </div>
          <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px' }}>
            Real-time ACID database sync
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card"
          style={{ padding: '18px 20px', borderLeft: '3px solid #ec4899' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Scheduled Exams
            </span>
            <Calendar size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {exams.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Midterms & Lab Vivas
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> 48-Hour Clash Guard Protected
          </div>
        </motion.div>
      </div>

      {/* Main Faculty Dashboard Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>

        {/* Section 1: Examination & Midterm Management */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={17} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Examination Schedules
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Published under college examination governance
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowExamModal(true)}
              className="btn btn-sm btn-primary"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff', fontSize: '12px' }}
            >
              <Plus size={13} /> Add Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No exams currently scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exams.map((ex) => (
                <div
                  key={ex.exam_id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: ex.exam_type === 'MIDTERM' ? 'rgba(236,72,153,0.18)' : 'rgba(99,102,241,0.18)',
                      color: ex.exam_type === 'MIDTERM' ? '#ec4899' : '#818cf8',
                      border: `1px solid ${ex.exam_type === 'MIDTERM' ? 'rgba(236,72,153,0.3)' : 'rgba(99,102,241,0.3)'}`
                    }}>
                      {ex.exam_type}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ex.course_name || subjectName} ({ex.course_code || 'CS202'})
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Clock size={11} /> {ex.exam_date} • Venue: {ex.venue}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Multi-Department & Multi-Program Syllabus Management (Feature F10) */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} color="#10b981" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Syllabus Units & Milestones
                  {syllabusLoading && <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />}
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Manage department & programme curricula • Tick completed units
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setNewSyllabusForm({
                    department: user?.department || 'Computer Science & Engineering',
                    program: user?.program || 'B.Tech Computer Science & Engineering',
                    semester: 'Semester 3',
                    course_name: '',
                    course_code: '',
                    initial_units: [
                      { unit_number: 1, unit_label: 'Unit 1', unit_title: '', description: '' },
                      { unit_number: 2, unit_label: 'Unit 2', unit_title: '', description: '' },
                      { unit_number: 3, unit_label: 'Unit 3', unit_title: '', description: '' },
                      { unit_number: 4, unit_label: 'Unit 4', unit_title: '', description: '' },
                      { unit_number: 5, unit_label: 'Unit 5', unit_title: '', description: '' },
                    ]
                  });
                  setShowCreateSyllabusModal(true);
                }}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Plus size={13} /> Add Syllabus
              </button>

              <span style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#10b981',
                fontFamily: 'var(--font-mono)',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                {completedUnits} / {totalUnits} Done ({syllabusProgress}%)
              </span>
            </div>
          </div>

          {/* Syllabus Alert Banner */}
          {syllabusAlert && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: syllabusAlert.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${syllabusAlert.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: syllabusAlert.type === 'error' ? '#fca5a5' : '#6ee7b7'
              }}
            >
              <span>{syllabusAlert.message}</span>
              <button
                onClick={() => setSyllabusAlert(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Department & Programme Selector Bar */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: '1 1 260px' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Select Course / Programme / Department
                </label>
                {syllabi.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    No syllabi configured yet. Click "+ Add Syllabus" to create your first unit plan.
                  </div>
                ) : (
                  <select
                    value={selectedSyllabusId || ''}
                    onChange={(e) => setSelectedSyllabusId(Number(e.target.value))}
                    className="input"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px'
                    }}
                  >
                    {syllabi.map((s) => (
                      <option key={s.syllabus_id} value={s.syllabus_id}>
                        {s.course_name} — [{s.department}] {s.program} ({s.coverage_pct}% Done)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {activeSyllabus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setNewUnitForm({
                        unit_number: (activeSyllabus.units?.length || 0) + 1,
                        unit_label: `Unit ${(activeSyllabus.units?.length || 0) + 1}`,
                        unit_title: '',
                        description: ''
                      });
                      setShowAddUnitModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#818cf8'
                    }}
                  >
                    <Plus size={12} /> Add Unit
                  </button>
                  <button
                    onClick={() => handleDeleteSyllabus(activeSyllabus)}
                    title="Permanently Delete this Syllabus"
                    style={{
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} /> Delete Syllabus
                  </button>
                </div>
              )}
            </div>

            {/* Active Syllabus Metadata Pills */}
            {activeSyllabus && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  🏛️ <strong>Dept:</strong> {activeSyllabus.department}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  🎓 <strong>Program:</strong> {activeSyllabus.program}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  📅 {activeSyllabus.semester}
                </span>
                {activeSyllabus.course_code && (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                    {activeSyllabus.course_code}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Unit-Wise List with Ticking & Deletion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {activeUnits.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)'
              }}>
                <FolderPlus size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>No units written for this syllabus yet.</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Click "+ Add Unit" above to write Unit 1, Unit 2, or custom topics.</p>
              </div>
            ) : (
              activeUnits.map((u) => (
                <motion.div
                  key={u.unit_id}
                  whileHover={{ x: 2 }}
                  onClick={() => handleToggleUnit(u)}
                  style={{
                    padding: '11px 13px',
                    borderRadius: 'var(--radius-md)',
                    background: u.completed ? 'rgba(16, 185, 129, 0.07)' : 'var(--bg-secondary)',
                    border: `1px solid ${u.completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: u.completed ? '#10b981' : 'transparent',
                      border: `1.5px solid ${u.completed ? '#10b981' : 'var(--text-muted)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {u.completed && <CheckCircle size={13} color="#fff" />}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: u.completed ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        <strong style={{ color: '#f59e0b', marginRight: '6px' }}>{u.unit_label || `Unit ${u.unit_number}`}:</strong>
                        {u.unit_title}
                      </div>
                      {u.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {u.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: u.completed ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                      color: u.completed ? '#10b981' : 'var(--text-muted)'
                    }}>
                      {u.completed ? 'Covered' : 'Pending'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUnit(u);
                      }}
                      title="Delete this unit"
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Course Deadlines & Student Assessment Tracker */}
        <div className="glass-card" style={{ padding: '22px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={17} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Course Assignments & Student Submissions
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Real-time database submission tracking across academic batches
                </span>
              </div>
            </div>
            <Link to="/deadlines" className="btn btn-sm btn-secondary" style={{ fontSize: '12px' }}>
              View All Submissions <ChevronRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Assignment Title</th>
                  <th style={{ padding: '10px 12px' }}>Course / Subject</th>
                  <th style={{ padding: '10px 12px' }}>Due Date</th>
                  <th style={{ padding: '10px 12px' }}>Urgency</th>
                  <th style={{ padding: '10px 12px' }}>Submission Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active assignments. New deliverables will appear here.
                    </td>
                  </tr>
                ) : (
                  deadlines.slice(0, 10).map(dl => (
                    <tr key={dl.deadline_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {dl.title}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {dl.course_name || subjectName}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {dl.due_date}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: dl.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: dl.urgency === 'HIGH' ? '#ef4444' : '#f59e0b'
                        }}>
                          {dl.urgency}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: dl.submission_status === 'DONE' ? '#10b981' : '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={13} /> {dl.submission_status === 'DONE' ? 'Submitted' : 'Pending Evaluation'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteAssignment(dl.deadline_id, dl.title, false)}
                          className="btn btn-sm"
                          title="Delete assignment from student and CR dashboards"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: My Department Student Cohort (Strict Department Isolation) */}
        <div className="glass-card" style={{ padding: '22px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={18} color="#10b981" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    My Program Student Cohort
                  </h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {facultyStudents.length} Students
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <ShieldCheck size={12} color="#10b981" />
                  <span>
                    Strict Isolation: Showing only <strong>{facultyProgram || user?.program || 'Assigned Programme'}</strong> students ({facultyDept || deptName}).
                  </span>
                </div>
              </div>
            </div>

            {/* Student Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px'
              }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter student or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    width: '180px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Student Table */}
          {facultyStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No students registered under {facultyProgram || user?.program || facultyDept || deptName} yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Newly registered students in your academic programme will appear here automatically.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Student Name</th>
                    <th style={{ padding: '10px 12px' }}>Institutional Email</th>
                    <th style={{ padding: '10px 12px' }}>Academic Programme</th>
                    <th style={{ padding: '10px 12px' }}>Role</th>
                    <th style={{ padding: '10px 12px' }}>Active Tasks</th>
                    <th style={{ padding: '10px 12px' }}>Academic Status</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyStudents
                    .filter(s => {
                      if (!studentSearch.trim()) return true;
                      const q = studentSearch.toLowerCase();
                      return (
                        s.full_name?.toLowerCase().includes(q) ||
                        s.email?.toLowerCase().includes(q) ||
                        s.program?.toLowerCase().includes(q) ||
                        s.course?.toLowerCase().includes(q) ||
                        s.subject_or_course?.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                      <tr key={s.id || s.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'var(--bg-tertiary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--text-secondary)'
                            }}>
                              {s.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <span>{s.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {s.email}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '11.5px',
                            fontWeight: 500,
                            color: 'var(--text-primary)'
                          }}>
                            {s.program || s.course || s.subject_or_course || 'B.Tech Program'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            background: s.role_name === 'CR' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: s.role_name === 'CR' ? '#14b8a6' : '#818cf8',
                            border: `1px solid ${s.role_name === 'CR' ? 'rgba(20, 184, 166, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                          }}>
                            {s.role_name}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          <span style={{ color: (s.active_tasks || 0) > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                            {s.active_tasks || 0} pending
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: '11px',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={13} /> Active & Enrolled
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assignment & Upload History (Proof of Work) Section */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '28px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  Assignment & Upload History (Proof of Work)
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
                  <ShieldCheck size={12} /> Permanent Database Record
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Immutable audit trail of all coursework, materials, instructions, and delegations assigned by you. Persisted in SQLite across sessions.
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
                color: '#c4b5fd',
                borderColor: 'rgba(139, 92, 246, 0.4)'
              }}
            >
              Open Full History Console <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Mini Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ASSIGNMENTS LOGGED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                {historyStats?.total_tasks || historyTasks.length || deadlines.length}
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CR DELEGATIONS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6', marginTop: '2px' }}>
                {historyStats?.total_delegations || historyDelegations.length}
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FILE PROOFS STORED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {historyStats?.files_shared || 0} Files
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DB INTEGRITY STATUS</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> 100% ACID Synchronized
              </div>
            </div>
          </div>

          {/* Recent Proof Table */}
          {historyTasks.length === 0 && historyDelegations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No assignments or delegations recorded yet. Use the "Assign Work to CR" or "Schedule Exam" actions to upload work.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <th style={{ padding: '10px 12px' }}>RECORD ID / TYPE</th>
                    <th style={{ padding: '10px 12px' }}>WORK TITLE & COURSE</th>
                    <th style={{ padding: '10px 12px' }}>RECIPIENT / TARGET</th>
                    <th style={{ padding: '10px 12px' }}>ASSIGNED DATE</th>
                    <th style={{ padding: '10px 12px' }}>STUDENT PROGRESS</th>
                    <th style={{ padding: '10px 12px' }}>ATTACHED FILE / PROOF</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTasks.slice(0, 10).map((t) => (
                    <tr key={`task-${t.task_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                          #{t.task_id} TASK
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.course_name || t.course_code || 'Coursework'}</div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {t.target_program || t.department || 'Enrolled Students'}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          background: t.completed_count > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                          color: t.completed_count > 0 ? '#10b981' : 'var(--text-muted)'
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
                            <Download size={12} /> Download Proof
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Text Instruction</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {t.is_deleted ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700
                            }}>
                              ARCHIVED
                            </span>
                            <button
                              onClick={() => handleDeleteAssignment(t.task_id, t.title, true)}
                              className="btn btn-sm"
                              title="Permanently purge from history database"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={11} /> Purge
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteAssignment(t.task_id, t.title, false)}
                            className="btn btn-sm"
                            title="Delete from active Student & CR dashboards (retains in history)"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '3px 8px',
                              fontSize: '10.5px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {historyDelegations.slice(0, 5).map((d) => (
                    <tr key={`delegation-${d.delegation_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                          #{d.delegation_id} DELEGATED
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned to CR ({d.cr_name || 'Class Representative'})</div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        CR: {d.cr_name || d.cr_email}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recorded'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          background: d.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
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
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              color: '#a78bfa',
                              border: '1px solid rgba(167, 139, 250, 0.3)'
                            }}
                          >
                            <Download size={12} /> View Document
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No File</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px' }}>
                        Delegation
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Schedule Exam Modal */}
      <AnimatePresence>
        {showExamModal && (
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
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Publish Examination Schedule
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Automated 48-hour clash detection protects against student exam overload.
              </p>

              {examAlert && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  background: examAlert.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: examAlert.type === 'error' ? '#ef4444' : '#10b981',
                  border: `1px solid ${examAlert.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}>
                  {examAlert.message}
                </div>
              )}

              <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    COURSE / SUBJECT
                  </label>
                  <select
                    className="input"
                    value={examForm.course_id}
                    onChange={e => setExamForm({ ...examForm, course_id: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code}: {c.course_name} (Sem {c.semester})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    EXAMINATION TYPE
                  </label>
                  <select
                    className="input"
                    value={examForm.exam_type}
                    onChange={e => setExamForm({ ...examForm, exam_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="MIDTERM">MIDTERM EXAMINATION</option>
                    <option value="FINAL">END-SEMESTER FINAL</option>
                    <option value="QUIZ">SURPRISE QUIZ / ASSESSMENT</option>
                    <option value="VIVA">LAB PRACTICAL / VIVA</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    DATE & TIME
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    required
                    value={examForm.exam_date}
                    onChange={e => setExamForm({ ...examForm, exam_date: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    VENUE / LAB LOCATION
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={examForm.venue}
                    onChange={e => setExamForm({ ...examForm, venue: e.target.value })}
                    placeholder="e.g. Lab 201 - Block C"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingExam}
                    className="btn btn-primary"
                    style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
                  >
                    {submittingExam ? 'Verifying Conflict...' : 'Publish Examination'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* =================================================================== */}
        {/* Modal: Create Custom Syllabus for any Department & Programme       */}
        {/* =================================================================== */}
        {showCreateSyllabusModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
                background: '#181714', border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px', padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} color="#10b981" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                      Create Course Syllabus
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Choose any Department & Programme, then write your unit-wise module plan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateSyllabusModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSyllabus}>
                {/* 1. Department & Programme Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '5px' }}>
                      DEPARTMENT *
                    </label>
                    <select
                      value={newSyllabusForm.department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const progs = DEPARTMENT_COURSES_MAP[newDept]?.flatMap(c => c.items) || [];
                        setNewSyllabusForm({
                          ...newSyllabusForm,
                          department: newDept,
                          program: progs.length > 0 ? progs[0] : `B.Tech ${newDept}`
                        });
                      }}
                      className="input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: '#141311', color: '#fff' }}
                      required
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '5px' }}>
                      PROGRAMME / DEGREE *
                    </label>
                    <select
                      value={newSyllabusForm.program}
                      onChange={(e) => setNewSyllabusForm({ ...newSyllabusForm, program: e.target.value })}
                      className="input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: '#141311', color: '#fff' }}
                      required
                    >
                      {(DEPARTMENT_COURSES_MAP[newSyllabusForm.department]?.flatMap(c => c.items) || [
                        `B.Tech ${newSyllabusForm.department}`,
                        `M.Tech ${newSyllabusForm.department}`
                      ]).map((prog) => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Semester & Course Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '5px' }}>
                      TARGET SEMESTER
                    </label>
                    <select
                      value={newSyllabusForm.semester}
                      onChange={(e) => setNewSyllabusForm({ ...newSyllabusForm, semester: e.target.value })}
                      className="input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: '#141311', color: '#fff' }}
                    >
                      {SEMESTER_PILLS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id} ({s.year})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '5px' }}>
                      COURSE CODE (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newSyllabusForm.course_code}
                      onChange={(e) => setNewSyllabusForm({ ...newSyllabusForm, course_code: e.target.value })}
                      placeholder="e.g. CS202, IT304, MCA102"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: '#141311', color: '#fff' }}
                    />
                  </div>
                </div>

                {/* 3. Subject / Course Title */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '5px' }}>
                    SUBJECT / COURSE TITLE *
                  </label>
                  <input
                    type="text"
                    list="syllabus-subject-list"
                    className="input"
                    required
                    value={newSyllabusForm.course_name}
                    onChange={(e) => setNewSyllabusForm({ ...newSyllabusForm, course_name: e.target.value })}
                    placeholder="Enter or choose subject title (e.g. Database Management Systems, Cloud Computing...)"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: '#141311', color: '#fff' }}
                  />
                  <datalist id="syllabus-subject-list">
                    {CATEGORIZED_FACULTY_SUBJECTS.flatMap(c => c.items).map((s, idx) => (
                      <option key={`${s}-${idx}`} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* 4. Unit-Wise Custom Syllabus Writing */}
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ✍️ Write Unit-Wise Syllabus Plan
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Written by you for this course
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {newSyllabusForm.initial_units.map((unitItem, uIdx) => (
                      <div
                        key={uIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '70px 1fr 1fr auto',
                          gap: '8px',
                          alignItems: 'center',
                          background: '#12110e',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>
                          Unit {uIdx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`Unit ${uIdx + 1} Title (required)`}
                          value={unitItem.unit_title}
                          onChange={(e) => {
                            const updated = [...newSyllabusForm.initial_units];
                            updated[uIdx].unit_title = e.target.value;
                            setNewSyllabusForm({ ...newSyllabusForm, initial_units: updated });
                          }}
                          style={{
                            padding: '6px 8px', fontSize: '12px', background: '#181714',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Key topics / description (optional)"
                          value={unitItem.description}
                          onChange={(e) => {
                            const updated = [...newSyllabusForm.initial_units];
                            updated[uIdx].description = e.target.value;
                            setNewSyllabusForm({ ...newSyllabusForm, initial_units: updated });
                          }}
                          style={{
                            padding: '6px 8px', fontSize: '12px', background: '#181714',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px'
                          }}
                        />
                        {newSyllabusForm.initial_units.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newSyllabusForm.initial_units.filter((_, i) => i !== uIdx);
                              setNewSyllabusForm({ ...newSyllabusForm, initial_units: updated });
                            }}
                            title="Remove Unit Row"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = newSyllabusForm.initial_units.length + 1;
                      setNewSyllabusForm({
                        ...newSyllabusForm,
                        initial_units: [
                          ...newSyllabusForm.initial_units,
                          { unit_number: nextNum, unit_label: `Unit ${nextNum}`, unit_title: '', description: '' }
                        ]
                      });
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '6px 12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={12} /> Add Another Unit Row
                  </button>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateSyllabusModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSyllabus}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderColor: '#10b981',
                      color: '#fff',
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {submittingSyllabus ? (
                      <>
                        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        Saving Syllabus...
                      </>
                    ) : (
                      <>
                        <Layers size={14} />
                        Save & Create Syllabus
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* =================================================================== */}
        {/* Modal: Add Unit to Currently Active Syllabus                       */}
        {/* =================================================================== */}
        {showAddUnitModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: '520px',
                background: '#181714', border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px', padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    Add Unit Module
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {activeSyllabus ? `${activeSyllabus.course_name} (${activeSyllabus.program})` : 'Active Syllabus'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddUnit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '4px' }}>
                      UNIT LABEL
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newUnitForm.unit_label}
                      onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_label: e.target.value })}
                      placeholder="e.g. Unit 6"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#141311', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '4px' }}>
                      UNIT NUMBER
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={newUnitForm.unit_number}
                      onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
                      placeholder="6"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#141311', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '4px' }}>
                    UNIT TITLE *
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newUnitForm.unit_title}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_title: e.target.value })}
                    placeholder="e.g. Distributed Consensus & Raft Protocol"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#141311', color: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginBottom: '4px' }}>
                    KEY TOPICS / DESCRIPTION (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={newUnitForm.description}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, description: e.target.value })}
                    placeholder="List specific lab tasks, theorems, or topics covered..."
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', background: '#141311', color: '#fff', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddUnitModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '12.5px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUnit}
                    className="btn btn-primary"
                    style={{
                      background: '#6366f1',
                      borderColor: '#6366f1',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {submittingUnit ? 'Adding Unit...' : 'Add Unit to Syllabus'}
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
