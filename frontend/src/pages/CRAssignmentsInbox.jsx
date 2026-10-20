// =============================================================================
// ChronoSync — CR Faculty Assignments Inbox & Batch Publisher (CRAssignmentsInbox.jsx)
// =============================================================================
// Allows Class Representatives (CRs) to review coursework and documents assigned
// directly by faculty members, verify details, and broadcast them directly
// to the student dashboard with one click.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { delegationAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ConflictModal from '../components/ConflictModal';
import {
  Inbox, Send, CheckCircle2, Clock, AlertTriangle, FileText,
  Download, ArrowLeft, RefreshCw, Sparkles, Filter, Search,
  Calendar, Layers, CheckCircle, ExternalLink, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CRAssignmentsInbox() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, PUBLISHED
  const [searchQuery, setSearchQuery] = useState('');
  const [actionAlert, setActionAlert] = useState(null);

  // Conflict Modal State (if exam conflict triggers)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState('');

  const loadDelegations = async () => {
    try {
      setLoading(true);
      const res = await delegationAPI.getCRDelegations();
      setDelegations(res.data?.delegations || []);
    } catch (err) {
      console.error('Failed to load CR delegations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelegations();
  }, [user]);

  // Handle publishing delegation to student dashboard
  const handlePublishToStudents = async (delegationId) => {
    try {
      setPublishingId(delegationId);
      setActionAlert(null);
      const res = await delegationAPI.publishToStudents(delegationId);

      if (res.data?.success) {
        setActionAlert({
          type: 'success',
          message: '✓ Coursework successfully assigned and published to Student Dashboard!'
        });
        await loadDelegations();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to publish to student dashboard.';
      if (err.response?.status === 409 || msg.includes('CONFLICT') || msg.includes('Exam') || msg.includes('trigger')) {
        setConflictDetails(msg);
        setShowConflictModal(true);
      } else {
        setActionAlert({ type: 'error', message: msg });
      }
    } finally {
      setPublishingId(null);
    }
  };

  // Filtered delegations
  const filtered = delegations.filter((d) => {
    if (filterStatus === 'PENDING' && d.status !== 'PENDING') return false;
    if (filterStatus === 'PUBLISHED' && d.status !== 'PUBLISHED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title?.toLowerCase().includes(q);
      const matchSubject = d.subject?.toLowerCase().includes(q);
      const matchFaculty = d.faculty_name?.toLowerCase().includes(q);
      const matchProg = d.program?.toLowerCase().includes(q);
      return matchTitle || matchSubject || matchFaculty || matchProg;
    }
    return true;
  });

  const pendingCount = delegations.filter(d => d.status === 'PENDING').length;
  const publishedCount = delegations.filter(d => d.status === 'PUBLISHED').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Breadcrumb Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Link
                to="/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                <ArrowLeft size={13} /> Back to CR Command Hub
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/</span>
              <span style={{ fontSize: '12px', color: '#14b8a6', fontWeight: 600 }}>Faculty Delegations</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Inbox size={26} color="#14b8a6" />
              Faculty Coursework Delegations Inbox
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Coursework, problem sheets, and assignments delegated to you by professors. Review guidelines and assign directly to the student dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={loadDelegations}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh Inbox
            </button>
            <Link
              to="/deadlines"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Layers size={13} />
              View Batch Feed
            </Link>
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

        {/* Summary Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={22} color="#14b8a6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Delegations</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{delegations.length}</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Release</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{pendingCount}</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Published to Students</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{publishedCount}</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilterStatus('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterStatus === 'ALL' ? '#14b8a6' : 'rgba(255,255,255,0.06)',
                color: filterStatus === 'ALL' ? '#000' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              All Coursework ({delegations.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterStatus === 'PENDING' ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                color: filterStatus === 'PENDING' ? '#000' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              Pending Release ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('PUBLISHED')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterStatus === 'PUBLISHED' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: filterStatus === 'PUBLISHED' ? '#000' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              Published ({publishedCount})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by title, subject, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Delegated Items List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            Loading faculty coursework delegations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Inbox size={36} color="#94a3b8" style={{ margin: '0 auto 14px', opacity: 0.6 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#f8fafc' }}>
              No delegated coursework found
            </h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              {filterStatus === 'PENDING'
                ? 'All faculty assignments have already been published to the student dashboard.'
                : 'Faculty has not assigned any pending assignments to your batch yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map((del) => {
              const isPublished = del.status === 'PUBLISHED';
              const isPublishing = publishingId === del.delegation_id;

              return (
                <div
                  key={del.delegation_id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderLeft: `4px solid ${isPublished ? '#10b981' : '#f59e0b'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Top Bar: Faculty info & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13.5px'
                      }}>
                        {del.faculty_name?.split(' ').map(n => n[0]).join('') || 'FAC'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                            {del.faculty_name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({del.department})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Delegated to: <span style={{ color: '#14b8a6' }}>{del.cr_name}</span> • {del.created_at?.slice(0, 16)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.25)'
                      }}>
                        {del.program}
                      </span>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: 'rgba(168,85,247,0.12)', color: '#c084fc',
                        border: '1px solid rgba(168,85,247,0.25)'
                      }}>
                        {del.semester}
                      </span>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: del.urgency === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : del.urgency === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)',
                        color: del.urgency === 'CRITICAL' ? '#ef4444' : del.urgency === 'HIGH' ? '#f59e0b' : '#10b981',
                        border: '1px solid currentColor'
                      }}>
                        {del.urgency} PRIORITY
                      </span>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>
                      Subject: {del.subject}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {del.title}
                    </h3>
                  </div>

                  {/* Description Instructions */}
                  {del.description && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}>
                      {del.description}
                    </div>
                  )}

                  {/* Attached Document Card (if any) */}
                  {del.document_url && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(56,189,248,0.06)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#e0f2fe' }}>
                            {del.document_name || 'Assignment Material'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Official coursework document attached by faculty
                          </div>
                        </div>
                      </div>
                      <a
                        href={del.document_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(56,189,248,0.15)',
                          border: '1px solid rgba(56,189,248,0.3)',
                          color: '#38bdf8',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <Download size={13} /> Download File
                      </a>
                    </div>
                  )}

                  {/* Bottom Meta & Action Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Due: <strong style={{ color: '#f59e0b' }}>{del.due_date?.slice(0, 16)}</strong></span>
                      <span>Estimated Effort: <strong style={{ color: '#fff' }}>{del.estimated_hours} hrs</strong></span>
                    </div>

                    <div>
                      {isPublished ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12.5px', fontWeight: 600 }}>
                          <CheckCircle2 size={16} />
                          <span>Published to Student Dashboard ({del.published_at?.slice(0, 16) || 'Active'})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePublishToStudents(del.delegation_id)}
                          disabled={isPublishing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 20px',
                            borderRadius: '8px',
                            background: '#14b8a6',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '13px',
                            border: 'none',
                            cursor: isPublishing ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(20,184,166,0.3)',
                            opacity: isPublishing ? 0.7 : 1
                          }}
                        >
                          {isPublishing ? (
                            <>
                              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              Publishing to Students...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              Assign to Student Dashboard
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* SQL Conflict Prevention Trigger Modal */}
      <ConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflictDetails={conflictDetails}
      />
    </div>
  );
}
