// =============================================================================
// ChronoSync — CR Command Portal (CRCommandPortal.jsx)
// =============================================================================
// PDF Rubric OCR extraction via Tesseract, Azure Blob Storage streaming,
// and SQL trigger conflict protection (trg_PreventExamClash).
// =============================================================================

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ConflictModal from '../components/ConflictModal';
import { deadlineAPI, ocrAPI, courseAPI } from '../services/api';
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  Plus, Calendar, Layers, ShieldCheck, ArrowRight, Sparkles
} from 'lucide-react';

export default function CRCommandPortal() {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    due_date: '',
    urgency: 'MEDIUM',
    pdf_blob_url: '',
  });

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [conflictError, setConflictError] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    courseAPI.getAll().then(res => setCourses(res.data.courses || []));
  }, []);

  // Handle PDF upload & trigger OCR
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF document.');
      return;
    }

    setOcrLoading(true);
    setOcrStatus('Streaming to Azure Blob Storage and executing OCR engine...');
    setOcrSuccess(false);
    setSuccessMessage('');

    try {
      const res = await ocrAPI.extract(file);
      const { blob_url, extracted } = res.data;

      let matchedCourseId = '';
      if (extracted.course_code) {
        const found = courses.find(c =>
          c.course_code.toLowerCase().includes(extracted.course_code.toLowerCase()) ||
          extracted.course_code.toLowerCase().includes(c.course_code.toLowerCase())
        );
        if (found) matchedCourseId = found.course_id;
      }

      setFormData(prev => ({
        ...prev,
        course_id: matchedCourseId || prev.course_id || (courses[0]?.course_id || ''),
        title: extracted.title || prev.title || file.name.replace('.pdf', ''),
        description: `Extracted from assignment rubric: ${file.name}`,
        due_date: extracted.due_date ? convertToInputDate(extracted.due_date) : prev.due_date,
        pdf_blob_url: blob_url,
      }));

      setOcrStatus(`OCR Extracted: Course "${extracted.course_code || 'N/A'}", Title "${extracted.title || 'N/A'}"`);
      setOcrSuccess(true);
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrStatus('OCR extraction was unable to parse structured text. Please enter deadline details manually.');
      setOcrSuccess(false);
    } finally {
      setOcrLoading(false);
    }
  };

  const convertToInputDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 16);
      }
    } catch (_) {}
    return '';
  };

  // Submit deadline with SQL trigger conflict check
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMessage('');
    setConflictError(null);

    try {
      const payload = {
        ...formData,
        course_id: parseInt(formData.course_id),
        due_date: new Date(formData.due_date).toISOString().replace('T', ' ').substring(0, 19),
      };

      await deadlineAPI.create(payload);

      setSuccessMessage('Verified deadline published to class feed successfully.');
      setFormData({
        course_id: courses[0]?.course_id || '',
        title: '',
        description: '',
        due_date: '',
        urgency: 'MEDIUM',
        pdf_blob_url: '',
      });
      setOcrStatus('');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to publish deadline.';
      if (err.response?.status === 409 || detail.includes('CONFLICT') || detail.includes('OVERLOAD')) {
        setConflictError(detail);
        setShowConflictModal(true);
      } else {
        alert(detail);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="CR Publishing Portal"
        subtitle="Automated PDF rubric ingestion, OCR extraction, and ACID deadline publishing"
      />

      <ConflictModal
        isOpen={showConflictModal}
        errorDetails={conflictError}
        onClose={() => setShowConflictModal(false)}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 2fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left Column: Smart OCR PDF Upload Box */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
              Rubric OCR Parser
            </h2>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.45' }}>
            Upload assignment rubrics. ChronoSync streams the binary to <strong>Azure Blob Storage</strong> and executes OCR text extraction to prepopulate assignment fields.
          </p>

          {/* Upload Dropzone */}
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 18px',
            border: '1px dashed var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            cursor: ocrLoading ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-smooth)',
            textAlign: 'center',
          }}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={ocrLoading}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}>
              <Upload size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <span style={{ fontWeight: 500, fontSize: '13.5px', color: 'var(--text-primary)' }}>
              {ocrLoading ? 'Processing OCR & Cloud Storage...' : 'Upload Assignment PDF'}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              PDF rubrics, lab instructions, syllabus sheets
            </span>
          </label>

          {/* OCR Status banner */}
          {ocrStatus && (
            <div style={{
              marginTop: '14px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: ocrSuccess ? 'var(--semantic-success-bg)' : 'var(--bg-tertiary)',
              border: `1px solid ${ocrSuccess ? 'var(--semantic-success-border)' : 'var(--border-subtle)'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: ocrSuccess ? 'var(--semantic-success)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              {ocrSuccess ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} style={{ color: 'var(--semantic-warning)' }} />}
              <span>{ocrStatus}</span>
            </div>
          )}

          {/* Azure Blob URL display */}
          {formData.pdf_blob_url && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              Blob: {formData.pdf_blob_url}
            </div>
          )}

          {/* Academic Rubric note */}
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
            <div>Architecture: Azure Blob Store + Tesseract OCR</div>
            <div>Protection: SQL Trigger trg_PreventExamClash</div>
          </div>
        </div>

        {/* Right Column: Verified Deadline Creation Form */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 500, marginBottom: '6px' }}>
            Publish Verified Deadline
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Review parsed rubric parameters or enter deadline details before committing to the student catalog.
          </p>

          {successMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--semantic-success-bg)',
              border: '1px solid var(--semantic-success-border)',
              color: 'var(--semantic-success)',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Course Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                  Target Course *
                </label>
                <select
                  required
                  className="input-field"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} — {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency Level */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                  Urgency Level *
                </label>
                <select
                  required
                  className="input-field"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Assignment Title *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g., Lab 5: B-Tree Index Implementation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Verified by SQL trigger: blocks exam clashes (&lt;24h) and overload (&gt;3 tasks in 48h)
              </span>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Description & Instructions
              </label>
              <textarea
                className="input-field"
                placeholder="Specify submission platform, formatting rules, or code repository guidelines..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="btn btn-primary"
              style={{ height: '40px', justifyContent: 'center', marginTop: '6px' }}
            >
              {submitLoading ? (
                'Evaluating SQL Trigger Locks...'
              ) : (
                <>
                  <Plus size={16} />
                  <span>Publish to Class Feed</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
