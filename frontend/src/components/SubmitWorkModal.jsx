// =============================================================================
// ChronoSync 3D — Student Assignment PDF Submission Modal (SubmitWorkModal.jsx)
// =============================================================================
// Allows students to submit assignments in PDF format or mark completed
// Generates millisecond-accurate server timestamp and SHA-256 digital proof
// =============================================================================

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, X, ShieldCheck,
  Sparkles, Loader2, Trash2, ArrowRight
} from 'lucide-react';
import { cryptoAPI } from '../services/api';

export default function SubmitWorkModal({ isOpen, onClose, deadline, onSubmissionSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen || !deadline) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Please upload an authentic PDF document (.pdf).');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('PDF file size exceeds maximum limit of 25MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await cryptoAPI.submitTask(deadline.deadline_id, file);
      onClose();
      if (onSubmissionSuccess) {
        onSubmissionSuccess(res.data);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(5, 5, 10, 0.75)',
          backdropFilter: 'blur(10px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '560px',
            background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.98) 0%, rgba(13, 17, 23, 0.98) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)',
            borderRadius: '18px',
            padding: '28px',
            color: '#f0f6fc',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b949e',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontSize: '11px',
              color: '#34d399',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              <ShieldCheck size={12} />
              CRYPTOGRAPHIC SUBMISSION VAULT
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#ffffff' }}>
              Submit Coursework Deliverable
            </h2>
            <p style={{ fontSize: '13px', color: '#8b949e', margin: 0 }}>
              Attach your completed work in PDF format. A tamper-proof SHA-256 digital receipt with server-side millisecond timestamp will be generated.
            </p>
          </div>

          {/* Task Info Pill */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '18px',
          }}>
            <div style={{ fontSize: '11px', color: '#8b949e', fontFamily: 'var(--font-mono, monospace)' }}>
              {deadline.course_code} · {deadline.course_name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f6fc', marginTop: '2px' }}>
              {deadline.title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#6e7681', marginTop: '4px' }}>
              Due: {deadline.due_date}
            </div>
          </div>

          {/* PDF Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: dragActive
                ? '2px dashed #10b981'
                : file
                  ? '1.5px solid rgba(16, 185, 129, 0.5)'
                  : '1.5px dashed rgba(255, 255, 255, 0.18)',
              borderRadius: '14px',
              padding: file ? '20px' : '32px 20px',
              textAlign: 'center',
              background: dragActive
                ? 'rgba(16, 185, 129, 0.08)'
                : file
                  ? 'rgba(16, 185, 129, 0.04)'
                  : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '16px',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', wordBreak: 'break-all' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#8b949e', marginTop: '2px' }}>
                      {formatFileSize(file.size)} · Authentic PDF Document Ready
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  margin: '0 auto 12px',
                }}>
                  <UploadCloud size={26} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Click to select or drag & drop Assignment PDF
                </div>
                <div style={{ fontSize: '12px', color: '#8b949e' }}>
                  Supports Adobe PDF format up to 25MB
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '12px',
              marginBottom: '16px',
            }}>
              <AlertCircle size={15} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          {/* Info note */}
          <div style={{
            fontSize: '11.5px',
            color: '#8b949e',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '20px',
          }}>
            <Sparkles size={13} color="#10b981" />
            <span>
              {file
                ? 'Your file will be cryptographically hashed and archived with zero loss.'
                : 'You can submit with or without PDF. Both will generate an official SHA-256 receipt.'}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#8b949e',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Recording Cryptographic Proof...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  {file ? 'Submit PDF & Generate Receipt' : 'Complete Task (ACID Receipt)'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
