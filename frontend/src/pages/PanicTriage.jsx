// =============================================================================
// ChronoSync — HOD Panic Triage Dashboard (PanicTriage.jsx)
// =============================================================================
// Natural Language Processing (VADER / TextBlob) stress classification
// for anonymous student grievances with guaranteed database privacy.
// Includes Solve/Unsolve status management and permanent grievance deletion.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { panicAPI } from '../services/api';
import {
  ShieldCheck, Filter, AlertTriangle, CheckCircle, CheckCircle2,
  RotateCcw, Trash2, Search, MessageSquare, Clock, X, Paperclip,
  Check, RefreshCw, Sparkles, AlertOctagon
} from 'lucide-react';

export default function PanicTriage() {
  const [logs, setLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);

  // Modal State for custom resolution notes
  const [solvingItem, setSolvingItem] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await panicAPI.getLogs();
      setLogs(res.data.panic_logs || res.data.logs || []);
    } catch (err) {
      console.error('Failed to load panic logs:', err);
      setActionAlert({ type: 'error', message: 'Failed to load grievances from server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter & Search Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Severity Filter
      if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) {
        return false;
      }
      // Status Filter (Solve / Unsolve)
      const isResolved = Boolean(log.resolved || log.status === 'RESOLVED');
      if (filterStatus === 'PENDING' && isResolved) return false;
      if (filterStatus === 'RESOLVED' && !isResolved) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msg = (log.message_text || log.message || '').toLowerCase();
        const ticket = (log.ticket_number || '').toLowerCase();
        const subj = (log.subject || '').toLowerCase();
        const dept = (log.department || '').toLowerCase();
        return msg.includes(q) || ticket.includes(q) || subj.includes(q) || dept.includes(q);
      }

      return true;
    });
  }, [logs, filterSeverity, filterStatus, searchQuery]);

  // Counts for KPI strips
  const criticalCount = logs.filter(l => l.severity === 'CRITICAL').length;
  const unsolvedCount = logs.filter(l => !l.resolved && l.status !== 'RESOLVED').length;
  const solvedCount = logs.filter(l => Boolean(l.resolved || l.status === 'RESOLVED')).length;

  // Handle Mark as Solved (with custom note or default)
  const handleConfirmSolve = async (e) => {
    if (e) e.preventDefault();
    if (!solvingItem) return;
    const pId = solvingItem.panic_id || solvingItem.log_id;
    const noteToSend = resolutionNote.trim() || 'Reviewed & resolved by HOD. Academic workload schedule mitigated.';

    try {
      setActionLoadingId(pId);
      await panicAPI.resolve(pId, noteToSend);
      setLogs(prev => prev.map(item => {
        if ((item.panic_id || item.log_id) === pId) {
          return {
            ...item,
            resolved: true,
            status: 'RESOLVED',
            resolution_notes: noteToSend,
            resolved_at: new Date().toISOString()
          };
        }
        return item;
      }));
      setSolvingItem(null);
      setResolutionNote('');
      setActionAlert({
        type: 'success',
        message: `✓ Grievance #${solvingItem.ticket_number || pId} marked as Solved / Resolved.`
      });
    } catch (err) {
      console.error('Failed to resolve grievance:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to mark as solved: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Solve without modal
  const handleQuickSolve = async (log) => {
    const pId = log.panic_id || log.log_id;
    const defaultNote = 'Reviewed by HOD. Academic intervention and relief applied.';
    try {
      setActionLoadingId(pId);
      await panicAPI.resolve(pId, defaultNote);
      setLogs(prev => prev.map(item => {
        if ((item.panic_id || item.log_id) === pId) {
          return {
            ...item,
            resolved: true,
            status: 'RESOLVED',
            resolution_notes: defaultNote,
            resolved_at: new Date().toISOString()
          };
        }
        return item;
      }));
      setActionAlert({
        type: 'success',
        message: `✓ Grievance #${log.ticket_number || pId} marked as Solved.`
      });
    } catch (err) {
      setActionAlert({
        type: 'error',
        message: 'Failed to mark as solved: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Mark as Unsolved (Re-open)
  const handleUnsolve = async (log) => {
    const pId = log.panic_id || log.log_id;
    try {
      setActionLoadingId(pId);
      await panicAPI.unresolve(pId);
      setLogs(prev => prev.map(item => {
        if ((item.panic_id || item.log_id) === pId) {
          return {
            ...item,
            resolved: false,
            status: 'PENDING',
            resolution_notes: null,
            resolved_at: null
          };
        }
        return item;
      }));
      setActionAlert({
        type: 'info',
        message: `↺ Grievance #${log.ticket_number || pId} returned to Unsolved (Pending status).`
      });
    } catch (err) {
      console.error('Failed to unresolve grievance:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to mark as unsolved: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Complaint with confirmation
  const handleDelete = async (log) => {
    const pId = log.panic_id || log.log_id;
    const confirmMessage = `Permanently delete grievance #${log.ticket_number || pId}?\n\nThis will remove the complaint from the database with 100% accuracy. This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoadingId(pId);
      await panicAPI.delete(pId);
      setLogs(prev => prev.filter(item => (item.panic_id || item.log_id) !== pId));
      setActionAlert({
        type: 'success',
        message: `✓ Grievance #${log.ticket_number || pId} has been permanently deleted from database.`
      });
    } catch (err) {
      console.error('Failed to delete grievance:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to delete grievance: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <Navbar
        title="Anonymous Grievance Triage"
        subtitle="VADER / TextBlob NLP stress analysis for departmental intervention"
      />

      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            background: actionAlert.type === 'success'
              ? 'rgba(16,185,129,0.12)'
              : actionAlert.type === 'info'
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(239,68,68,0.12)',
            border: `1px solid ${
              actionAlert.type === 'success'
                ? 'rgba(16,185,129,0.35)'
                : actionAlert.type === 'info'
                  ? 'rgba(245,158,11,0.35)'
                  : 'rgba(239,68,68,0.35)'
            }`,
            color: actionAlert.type === 'success'
              ? '#34d399'
              : actionAlert.type === 'info'
                ? '#fbbf24'
                : '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}
        >
          <span>{actionAlert.message}</span>
          <button
            onClick={() => setActionAlert(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPI Severity & Status Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Critical Card */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '3px solid var(--semantic-error)' }}>
          <div style={{ fontSize: '11px', color: 'var(--semantic-error)', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Critical Triage
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Polarity &le; -0.6 (Immediate review)
          </div>
        </div>

        {/* Unsolved / Pending Card */}
        <div
          className="glass-card"
          onClick={() => setFilterStatus(filterStatus === 'PENDING' ? 'ALL' : 'PENDING')}
          style={{
            padding: '20px',
            borderLeft: '3px solid #f59e0b',
            cursor: 'pointer',
            background: filterStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : undefined,
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Unsolved / Pending</span>
            <Clock size={13} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
            {unsolvedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filterStatus === 'PENDING' ? 'Active Filter: Showing Pending' : 'Click to filter unsolved only'}
          </div>
        </div>

        {/* Solved / Resolved Card */}
        <div
          className="glass-card"
          onClick={() => setFilterStatus(filterStatus === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          style={{
            padding: '20px',
            borderLeft: '3px solid #10b981',
            cursor: 'pointer',
            background: filterStatus === 'RESOLVED' ? 'rgba(16, 185, 129, 0.08)' : undefined,
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Solved / Mitigated</span>
            <CheckCircle2 size={13} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
            {solvedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filterStatus === 'RESOLVED' ? 'Active Filter: Showing Solved' : 'Click to filter solved only'}
          </div>
        </div>

        {/* Total Registered Card */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Grievances
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {logs.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Department Triage Pool
          </div>
        </div>
      </div>

      {/* Filter, Search and Controls Bar */}
      <div className="glass-card" style={{
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search complaint, ticket #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', width: '100%' }}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11.5px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Status & Severity Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ height: '34px', padding: '0 28px 0 10px', fontSize: '12px', width: 'auto' }}
            >
              <option value="ALL">All Statuses ({logs.length})</option>
              <option value="PENDING">⏳ Unsolved Only ({unsolvedCount})</option>
              <option value="RESOLVED">✓ Solved Only ({solvedCount})</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Severity:</span>
            <select
              className="input-field"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ height: '34px', padding: '0 28px 0 10px', fontSize: '12px', width: 'auto' }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only ({criticalCount})</option>
              <option value="MEDIUM">Elevated Only</option>
              <option value="LOW">Manageable Only</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            className="btn btn-secondary"
            title="Refresh Complaints"
            style={{ height: '34px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Logs Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isLoading && logs.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            Loading Department Grievance Telemetry...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No complaints found matching the current filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const pId = log.panic_id || log.log_id;
            const dateStr = log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent';
            const badgeClass = `badge badge-${log.severity?.toLowerCase() || 'medium'}`;
            const isResolved = Boolean(log.resolved || log.status === 'RESOLVED');
            const isCritical = log.severity === 'CRITICAL';
            const isBusy = actionLoadingId === pId;

            return (
              <div
                key={pId}
                className="glass-card"
                style={{
                  padding: '20px 22px',
                  borderLeft: isResolved
                    ? '4px solid #10b981'
                    : isCritical
                      ? '4px solid var(--semantic-error)'
                      : '4px solid #f59e0b',
                  background: isResolved ? 'rgba(16, 185, 129, 0.02)' : isCritical ? 'rgba(239, 68, 68, 0.03)' : undefined,
                  transition: 'var(--transition-smooth)'
                }}
              >
                {/* Card Top: Ticket, Severity, Status Badge, Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Ticket Number */}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-primary)'
                    }}>
                      #{log.ticket_number || `GRV-${pId}`}
                    </span>

                    {/* Severity Badge */}
                    <span className={badgeClass}>{log.severity}</span>

                    {/* Solve / Unsolve Status Indicator Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 9px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isResolved ? '#10b981' : '#f59e0b',
                      border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {isResolved ? (
                        <>
                          <CheckCircle size={12} /> SOLVED
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> UNSOLVED (PENDING)
                        </>
                      )}
                    </span>

                    {/* Polarity Score */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Sentiment: <strong>{log.sentiment_score ?? 0}</strong>
                    </span>
                  </div>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {dateStr}
                  </span>
                </div>

                {/* Complaint Subject (if given) */}
                {log.subject && (
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {log.subject}
                  </div>
                )}

                {/* Complaint Message Body */}
                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.55',
                  marginBottom: '14px',
                  fontStyle: 'italic',
                  background: 'var(--bg-tertiary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  "{log.message_text || log.message}"
                </p>

                {/* File Attachment Proof if uploaded by student */}
                {log.file_attachment && (
                  <div style={{ marginBottom: '12px' }}>
                    <a
                      href={log.file_attachment}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        background: 'rgba(96, 165, 250, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(96, 165, 250, 0.25)'
                      }}
                    >
                      <Paperclip size={13} />
                      Download Attached Student Proof Document
                    </a>
                  </div>
                )}

                {/* Resolution Notes Banner (when Solved) */}
                {isResolved && log.resolution_notes && (
                  <div style={{
                    fontSize: '12px',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Official HOD Mitigation Note:</strong> {log.resolution_notes}
                    </div>
                  </div>
                )}

                {/* Card Footer: Metadata (Left) & Actions: Solve/Unsolve & Delete (Right) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {/* Left Metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                      Dept: <strong style={{ color: 'var(--text-secondary)' }}>{log.department || 'Campus'}</strong>
                    </span>
                    {log.program && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                        Prog: <strong style={{ color: 'var(--text-secondary)' }}>{log.program}</strong>
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      bleach.clean() sanitized
                    </span>
                  </div>

                  {/* Right Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 1. SOLVE / UNSOLVE BUTTON */}
                    {isResolved ? (
                      <button
                        onClick={() => handleUnsolve(log)}
                        disabled={isBusy}
                        title="Mark grievance as Unsolved (re-open for review)"
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '6px 12px',
                          borderColor: 'rgba(245, 158, 11, 0.35)',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.08)'
                        }}
                      >
                        <RotateCcw size={13} style={{ animation: isBusy ? 'spin 1s linear infinite' : 'none' }} />
                        Mark Unsolved
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleQuickSolve(log)}
                          disabled={isBusy}
                          title="Quick Solve with default mitigation note"
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.08)'
                          }}
                        >
                          <Check size={13} style={{ animation: isBusy ? 'spin 1s linear infinite' : 'none' }} />
                          Quick Solve
                        </button>
                        <button
                          onClick={() => {
                            setSolvingItem(log);
                            setResolutionNote('');
                          }}
                          disabled={isBusy}
                          title="Resolve with custom mitigation notes"
                          className="btn btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            padding: '6px 14px',
                            background: '#10b981',
                            borderColor: '#10b981',
                            color: '#fff',
                            fontWeight: 600
                          }}
                        >
                          <CheckCircle size={13} />
                          Solve & Add Note
                        </button>
                      </>
                    )}

                    {/* 2. DELETE BUTTON */}
                    <button
                      onClick={() => handleDelete(log)}
                      disabled={isBusy}
                      title="Permanently delete this grievance"
                      className="btn btn-ghost"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        background: 'rgba(239, 68, 68, 0.06)'
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Custom Resolution Note for Solved Grievance */}
      {solvingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '26px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 12px 40px rgba(16, 185, 129, 0.18)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Mark Grievance #{solvingItem.ticket_number || solvingItem.panic_id} as Solved
                </h3>
              </div>
              <button
                onClick={() => setSolvingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Student Grievance Message:</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{solvingItem.message_text || solvingItem.message}"
              </div>
            </div>

            <form onSubmit={handleConfirmSolve}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Official HOD Mitigation Note:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Adjusted overlapping lab submission deadlines by 4 days to relieve workload pressure."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', resize: 'vertical' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Leaving this blank will automatically apply standard institutional mitigation pacing notes.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSolvingItem(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12.5px', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    padding: '8px 18px',
                    background: '#10b981',
                    borderColor: '#10b981',
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {actionLoadingId !== null ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                  Confirm & Mark Solved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
