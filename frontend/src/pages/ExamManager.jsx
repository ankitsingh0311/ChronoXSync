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
import { Calendar, Plus, MapPin, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: '',
    exam_date: '',
    exam_type: 'MIDTERM',
    venue: '',
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      const payload = {
        ...formData,
        course_id: parseInt(formData.course_id),
        exam_date: new Date(formData.exam_date).toISOString().replace('T', ' ').substring(0, 19),
      };

      await examAPI.create(payload);
      setSuccess('Official exam schedule published. Conflict trigger lock is now active.');
      setFormData(prev => ({
        ...prev,
        exam_date: '',
        venue: '',
      }));
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Course *
              </label>
              <select
                required
                className="input-field"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              >
                {courses.map(c => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_code}: {c.course_name}
                  </option>
                ))}
              </select>
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
