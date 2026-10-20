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
  ExternalLink, Sparkles, Timer, Check, Trash2, Download, User
} from 'lucide-react';

export default function TaskCard({ deadline, onToggleStatus, onDelete, canDelete = false }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

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

  const isDone = deadline.submission_status === 'DONE';

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(deadline.deadline_id, isDone ? 'PENDING' : 'DONE');
    } finally {
      setIsToggling(false);
    }
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

      {/* Action Bar: ACID Done Toggle + CR Delete */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: isDone ? '1px solid var(--semantic-success-border)' : '1px solid var(--border-subtle)',
            background: isDone ? 'var(--semantic-success-bg)' : 'var(--bg-tertiary)',
            color: isDone ? 'var(--semantic-success)' : 'var(--text-primary)',
            fontSize: '12.5px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
          }}
        >
          {isDone ? (
            <>
              <Check size={14} /> Completed
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> Mark Done (ACID)
            </>
          )}
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(deadline.deadline_id)}
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Delete Assignment (Automatically removes from Student and CR Dashboards)"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
