// =============================================================================
// ChronoSync — Cursor Developer Task Card (TaskCard.jsx)
// =============================================================================
// Hairline card with micro-interaction hover, ACID submission toggle,
// course tagging, and AI study time estimation chip.
// =============================================================================

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, CheckCircle2, Clock, FileText,
  ExternalLink, Sparkles, Timer, Check, Trash2, Download, User,
  ShieldCheck, UploadCloud, FileCheck
} from 'lucide-react';
import CryptoReceiptModal from './CryptoReceiptModal';
import SubmitWorkModal from './SubmitWorkModal';

export default function TaskCard({ deadline, onToggleStatus, onDelete, canDelete = false, onRefresh }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Subtle 3D Perspective Tilt on Mouse Movement (Max 3.5deg for refined feel)
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = ((y - centerY) / centerY) * -3.5;
    const deltaY = ((x - centerX) / centerX) * 3.5;

    setRotateX(deltaX);
    setRotateY(deltaY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const isDone = deadline.submission_status === 'DONE' || deadline.submission_status === 'Completed';

  const handleToggle = () => {
    if (isDone) {
      // Cryptographically sealed submissions are immutable
      return;
    }
    // Clicking Mark as Done opens the PDF submission modal
    setShowSubmitModal(true);
  };

  const handleOpenReceipt = () => {
    // Build receipt object from deadline fields
    setActiveReceipt({
      receipt_hash: deadline.sha256_receipt_hash,
      server_timestamp_ms: deadline.server_timestamp_ms || deadline.completed_at,
      status: deadline.raw_status || (isDone ? 'Completed' : 'Pending'),
      is_on_time: (deadline.raw_status || '').toLowerCase() !== 'late',
      student_name: deadline.student_name,
      student_email: deadline.student_email,
      assignment_title: deadline.title,
      course_code: deadline.course_code,
      course_name: deadline.course_name,
      official_due_date: deadline.due_date,
      file_name: deadline.file_name,
      file_path: deadline.file_path,
      verification_count: deadline.verification_count || 0,
    });
    setShowReceiptModal(true);
  };

  const handleSubmissionSuccess = (receiptData) => {
    setActiveReceipt(receiptData);
    setShowReceiptModal(true);
    if (onRefresh) onRefresh();
  };

  // Format date
  const dueDateObj = new Date(deadline.due_date);
  const formattedDate = dueDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate hours remaining
  const now = new Date();
  const diffHours = Math.round((dueDateObj - now) / (1000 * 60 * 60));
  const isImminent = diffHours > 0 && diffHours <= 24;

  const urgencyClass = `badge badge-${deadline.urgency?.toLowerCase() || 'medium'}`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        background: 'var(--bg-card)',
        borderColor: isDone
          ? 'var(--semantic-success-border)'
          : isImminent
            ? 'var(--semantic-error-border)'
            : 'var(--border-subtle)',
      }}
    >
      {/* Imminent 24h Warning Ribbon */}
      {isImminent && !isDone && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'var(--semantic-error)',
          color: '#ffffff',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          padding: '2px 10px',
          borderBottomLeftRadius: 'var(--radius-sm)',
          borderTopRightRadius: 'var(--radius-lg)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Clock size={11} />
          <span>DUE &lt;24H</span>
        </div>
      )}

      {/* Header: Course Code & Urgency Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            padding: '2px 7px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
          }}>
            {deadline.course_code}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {deadline.course_name}
          </span>
        </div>
        <span className={urgencyClass}>
          {deadline.urgency}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
          marginBottom: '5px',
          letterSpacing: '-0.02em',
        }}>
          {deadline.title}
        </h3>
        {deadline.description && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.45',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {deadline.description}
          </p>
        )}
      </div>

      {/* AI Study Estimator Chip */}
      {deadline.study_estimate && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }}>
          <Sparkles size={12} style={{ color: 'var(--primary)' }} />
          <span>AI Est: <strong>{deadline.study_estimate.estimated_hours}h</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Timer size={11} /> {deadline.study_estimate.pomodoro_sessions} Cycles
          </span>
        </div>
      )}

      {/* Prominent Assignment Document Download Button */}
      {deadline.pdf_blob_url && (
        <a
          href={deadline.pdf_blob_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '9px 12px',
            background: 'rgba(20, 184, 166, 0.1)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#14b8a6',
            textDecoration: 'none',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <FileText size={14} />
            <span>Download Assignment File</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download size={13} />
            <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </div>
        </a>
      )}

      {/* Meta Footer: Due Date & Posted By Attribution */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '10px',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={13} />
          <span>Due: <strong>{formattedDate}</strong></span>
        </div>

        {deadline.posted_by_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <User size={12} color="var(--primary)" />
            <span>By: <strong>{deadline.posted_by_name}</strong></span>
          </div>
        )}
      </div>

      {/* Submitted PDF Attachment Chip (if student submitted a file) */}
      {deadline.file_path && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '7px 12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          color: '#34d399',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <FileCheck size={14} color="#10b981" flexShrink={0} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Submitted Work: <strong>{deadline.file_name || 'Assignment.pdf'}</strong>
            </span>
          </div>
          <a
            href={deadline.file_path}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
            }}
            title="Download your submitted file"
          >
            <Download size={11} /> PDF
          </a>
        </div>
      )}

      {/* Action Bar: Cryptographic Receipt + PDF Submit + ACID Toggle + Delete */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
        {isDone ? (
          <>
            {/* View SHA-256 Receipt Glowing Badge & Button */}
            <button
              onClick={handleOpenReceipt}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(245, 158, 11, 0.16) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.55)',
                color: '#34d399',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Open 3D Tamper-Proof Cryptographic Receipt Certificate"
            >
              <ShieldCheck size={15} color="#34d399" />
              <span>View SHA-256 Receipt</span>
            </button>

            {/* Permanent Sealed Indicator (Cannot be un-done or deselected) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                height: '34px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                userSelect: 'none',
              }}
              title="Cryptographically sealed with SHA-256 proof. Submission is immutable and cannot be deselected."
            >
              <CheckCircle2 size={13} color="#10b981" />
              <span>Sealed & Submitted</span>
            </div>
          </>
        ) : (
          /* Mark as Done: Prompts for assignment PDF upload & generates SHA-256 receipt */
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              height: '36px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(56, 189, 248, 0.18) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.55)',
              color: '#34d399',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
            }}
            title="Mark assignment as completed by uploading your coursework PDF and generating a cryptographic SHA-256 receipt"
          >
            <UploadCloud size={15} />
            <span>Mark as Done (Upload PDF)</span>
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(deadline.deadline_id)}
            style={{
              height: '34px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
            title="Delete Assignment"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* 3D Glassmorphic Cryptographic Proof of Submission Certificate Modal */}
      <CryptoReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={activeReceipt}
      />

      {/* Student PDF Assignment Submission Modal */}
      <SubmitWorkModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        deadline={deadline}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </motion.div>
  );
}
