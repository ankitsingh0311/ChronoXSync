// =============================================================================
// ChronoSync — Faculty Exam Manager (ExamManager.jsx)
// =============================================================================
// Publishes official Exam Schedules (MIDTERM / FINAL / QUIZ / VIVA).
// These schedules feed the Azure SQL conflict trigger (trg_PreventExamClash),
// ensuring no student deadline can be set within 24 hours of these dates.
// =============================================================================

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { examAPI, courseAPI } from '../services/api';
import { Calendar, Plus, MapPin, CheckCircle2, ShieldCheck, Clock, Trash2 } from 'lucide-react';

export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: '',
    exam_date: '',
    exam_type: 'MIDTERM',
    venue: '',
  });
  const [courseMode, setCourseMode] = useState('select'); // 'select' | 'custom'
  const [customCourseName, setCustomCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [examsRes, coursesRes] = await Promise.all([
        examAPI.getAll(),
        courseAPI.getAll(),
      ]);
      setExams(examsRes.data.exams || []);
      setCourses(coursesRes.data.courses || []);
      if (coursesRes.data.courses?.length > 0 && !formData.course_id) {
        setFormData(prev => ({ ...prev, course_id: coursesRes.data.courses[0].course_id }));
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (examId, courseName) => {
    if (!window.confirm(`Delete the scheduled exam for "${courseName || 'this course'}"?\n\nThis will remove the schedule from all dashboards and lift the 24-hour conflict lock.`)) {
      return;
    }

    try {
      await examAPI.delete(examId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete exam schedule.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      const payload = {
        exam_type: formData.exam_type,
        venue: formData.venue,
        exam_date: new Date(formData.exam_date).toISOString().replace('T', ' ').substring(0, 19),
      };

      if (courseMode === 'custom') {
        if (!customCourseName.trim()) {
          alert('Please enter a course or subject name.');
          setLoading(false);
          return;
        }
        payload.subject_name = customCourseName.trim();
      } else {
        payload.course_id = parseInt(formData.course_id);
      }

      await examAPI.create(payload);
      setSuccess('Official exam schedule published. Conflict trigger lock is now active.');
      setFormData(prev => ({
        ...prev,
        exam_date: '',
        venue: '',
      }));
      setCustomCourseName('');
      setCourseMode('select');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create exam schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Faculty Exam Scheduler"
        subtitle="Manage official examination calendar slots enforced by SQL conflict triggers"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.8fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Exam Creation Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--semantic-warning)' }} />
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
              Publish Examination
            </h2>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Deadlines submitted within 24 hours of this schedule will be automatically rejected by the database trigger.
          </p>

          {success && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--semantic-success-bg)',
              border: '1px solid var(--semantic-success-border)',
              color: 'var(--semantic-success)',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500 }}>
                  Course / Subject *
                </label>
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setCourseMode('select')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: courseMode === 'select' ? 'var(--primary)' : 'transparent',
                      color: courseMode === 'select' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: courseMode === 'select' ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Choose from list
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseMode('custom')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: courseMode === 'custom' ? 'var(--primary)' : 'transparent',
                      color: courseMode === 'custom' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: courseMode === 'custom' ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✍️ Write Subject
                  </button>
                </div>
              </div>

              {courseMode === 'select' ? (
                <div>
                  <select
                    required
                    className="input-field"
                    value={formData.course_id}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCourseMode('custom');
                      } else {
                        setFormData({ ...formData, course_id: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card, #1c1b18)',
                      color: 'var(--text-primary, #f7f7f4)'
                    }}
                  >
                    {courses.map(c => (
                      <option
                        key={c.course_id}
                        value={c.course_id}
                        style={{ background: '#1c1b18', color: '#f7f7f4' }}
                      >
                        {c.course_code}: {c.course_name}
                      </option>
                    ))}
                    <option
                      value="__custom__"
                      style={{ background: '#23221e', color: 'var(--primary, #f54e00)', fontWeight: 600 }}
                    >
                      ✍️ Other: Write custom subject name...
                    </option>
                  </select>
                  <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setCourseMode('custom')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Subject not in list? Write it here
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className="input-field"
                    required={courseMode === 'custom'}
                    value={customCourseName}
                    onChange={e => setCustomCourseName(e.target.value)}
                    placeholder="e.g. CS202: Database Management Systems (RDBMS) or Custom Subject"
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'var(--bg-card, #1c1b18)',
                      color: 'var(--text-primary, #f7f7f4)'
                    }}
                  />
                  <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Type custom subject name.
                    </span>
                    <button
                      type="button"
                      onClick={() => setCourseMode('select')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      ← Choose from existing list
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Exam Classification *
              </label>
              <select
                className="input-field"
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
              >
                <option value="MIDTERM">MIDTERM</option>
                <option value="FINAL">FINAL</option>
                <option value="QUIZ">QUIZ</option>
                <option value="VIVA">VIVA</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Venue / Delivery Channel
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Auditorium B, Lab 4, or MS Teams"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '6px',
                height: '40px',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} />
              <span>{loading ? 'Locking Schedule...' : 'Publish Exam Window'}</span>
            </button>
          </form>

          {/* Academic Info Box */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>Target Table: Exam_Schedules</div>
            <div>Enforcement: trg_PreventExamClash</div>
          </div>
        </div>

        {/* Exam Schedule List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 500, marginBottom: '16px' }}>
            Official Examination Schedule ({exams.length} Events)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exams.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active exam schedules posted yet.
              </div>
            ) : (
              exams.map((ex) => {
                const examDate = new Date(ex.exam_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ex.exam_id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--semantic-warning-bg)',
                        color: 'var(--semantic-warning)',
                        border: '1px solid var(--semantic-warning-border)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '11px',
                        textAlign: 'center',
                        minWidth: '68px',
                      }}>
                        {ex.exam_type}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em' }}>
                          {ex.course_code}: {ex.course_name}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {examDate}
                          </span>
                          {ex.venue && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {ex.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--semantic-success)',
                        background: 'var(--semantic-success-bg)',
                        border: '1px solid var(--semantic-success-border)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: 500,
                      }}>
                        Trigger Engaged
                      </div>
                      <button
                        onClick={() => handleDelete(ex.exam_id, ex.course_code)}
                        title="Delete Exam Schedule"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
