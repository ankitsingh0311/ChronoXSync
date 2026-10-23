// =============================================================================
// ChronoSync 3D — Calendar Sync Studio Modal (CalendarSyncModal.jsx)
// =============================================================================
// SUBJECT 1 (RDBMS): Scoped calendar feed powered by indexed calendar_sync_token.
// SUBJECT 2 (System Design): RFC-5545 iCalendar stream with < 2ms cache layer.
// SUBJECT 4 (Cloud Security): Zero-Trust Read-Only token with 1-click rotation.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar, Copy, Check, ExternalLink, Download,
  RefreshCw, ShieldCheck, Key, Lock, BellRing,
  Sparkles, AlertTriangle, CheckCircle2, X, Radio
} from 'lucide-react';
import { calendarAPI, examAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getGoogleCalendarExamUrl, openGoogleCalendarImportPage } from '../utils/googleCalendar';

export default function CalendarSyncModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showConfirmRotate, setShowConfirmRotate] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeExams, setActiveExams] = useState([]);

  // Fetch token, telemetry & exams
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [tokenRes, examRes] = await Promise.allSettled([
        calendarAPI.getToken(),
        examAPI.getAll()
      ]);
      if (tokenRes.status === 'fulfilled' && tokenRes.value.data?.status === 'success') {
        setTokenData(tokenRes.value.data);
      }
      if (examRes.status === 'fulfilled' && examRes.value.data?.exams) {
        setActiveExams(examRes.value.data.exams);
      }
    } catch (err) {
      console.error('Failed to load calendar sync token:', err);
      // Fallback if network issue
      if (user?.calendar_sync_token) {
        const origin = window.location.origin;
        const host = window.location.host;
        setTokenData({
          calendar_sync_token: user.calendar_sync_token,
          calendar_last_polled_at: user.calendar_last_polled_at,
          feed_url: `${origin}/api/v1/calendar/feed/${user.calendar_sync_token}.ics`,
          webcal_url: `webcal://${host}/api/v1/calendar/feed/${user.calendar_sync_token}.ics`,
          scope: {
            department: user.department || 'School of Computer Science',
            program: user.program || 'Core CSE',
            semester: user.semester || 'Semester 3',
            role: user.role_name || 'Student'
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCalendarData();
      setCopied(false);
      setShowConfirmRotate(false);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute feed URL and webcal URL
  const token = tokenData?.calendar_sync_token || user?.calendar_sync_token || '';
  
  // Construct dynamic absolute URL pointing to backend
  // If Vite dev server is on port 5173, backend is on 8000 (or 5000)
  const isViteDev = window.location.port === '5173';
  const customApiUrl = import.meta.env.VITE_API_URL;
  let defaultHost = isViteDev ? '127.0.0.1:8000' : window.location.host;
  let defaultProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  if (customApiUrl) {
    try {
      const parsed = new URL(customApiUrl, window.location.origin);
      defaultHost = parsed.host;
      defaultProtocol = parsed.protocol;
    } catch (_) {}
  }
  const displayFeedUrl = tokenData?.feed_url || `${defaultProtocol}//${defaultHost}/api/v1/calendar/feed/${token}.ics`;
  const displayWebcalUrl = tokenData?.webcal_url || `webcal://${defaultHost}/api/v1/calendar/feed/${token}.ics`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(displayFeedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = displayFeedUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRotateToken = async () => {
    try {
      setRotating(true);
      setStatusMessage(null);
      const res = await calendarAPI.rotateToken();
      if (res.data && res.data.status === 'success') {
        setStatusMessage({
          type: 'success',
          text: '✓ Secret token rotated! Previous URLs have been permanently revoked.'
        });
        await loadCalendarData();
        setShowConfirmRotate(false);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to rotate token: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setRotating(false);
    }
  };

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const handleDownloadSnapshot = () => {
    if (!token) return;
    calendarAPI.downloadSnapshot(token);
  };

  const handleImportToGoogleCalendar = () => {
    handleDownloadSnapshot();
    openGoogleCalendarImportPage();
  };

  const handleGoogleCalendarSubscribe = () => {
    if (isLocalHost) {
      handleImportToGoogleCalendar();
    } else {
      const googleAddUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(displayFeedUrl)}`;
      window.open(googleAddUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAppleOutlookSubscribe = () => {
    // webcal:// triggers native OS Calendar app on Windows, macOS, and iOS
    window.location.href = displayWebcalUrl;
  };

  const formatLastPolled = (dt) => {
    if (!dt) return 'Never polled yet • Ready to sync';
    try {
      const d = new Date(dt);
      if (isNaN(d.getTime())) return String(dt);
      return `Last polled: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(dt);
    }
  };

  const scope = tokenData?.scope || {
    department: user?.department || 'Computer Science',
    program: user?.program || 'Core CSE',
    semester: user?.semester || 'Semester 3',
    role: user?.role_name || 'Student'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 7, 15, 0.78)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '20px',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)',
        borderRadius: '24px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        color: '#f8fafc',
        position: 'relative',
        padding: '30px',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}>
        
        {/* Glow corner accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '24px'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)',
              color: '#60a5fa'
            }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Live Calendar Sync Studio
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Radio size={10} style={{ animation: 'pulse 1.5s infinite' }} /> RFC-5545 Live
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
                Zero-app background sync for Google Calendar, Apple Calendar & Outlook
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: statusMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Section 1: Live Subscription URL Terminal */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={13} /> Tokenized Academic iCalendar Feed URL
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Read-Only • Auto-Refreshes Hourly
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 12px'
          }}>
            <div style={{
              flex: 1,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.82rem',
              color: '#38bdf8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {loading ? 'Generating encrypted feed URL...' : displayFeedUrl}
            </div>

            <button
              onClick={handleCopyUrl}
              disabled={loading || !token}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: copied ? '#10b981' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: copied ? '0 0 14px rgba(16, 185, 129, 0.4)' : '0 0 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy URL
                </>
              )}
            </button>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            🔒 Contains a dedicated 64-char read-only token. Never share with untrusted parties.
          </p>
        </div>

        {/* Section 2: 3 Instant Action Launchers */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Instant One-Click Subscription Launchers
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {/* Launcher 1: Apple / Outlook Sync (webcal://) */}
            <button
              onClick={handleAppleOutlookSubscribe}
              disabled={loading || !token}
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={18} />
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  webcal://
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                Apple / Outlook
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.3 }}>
                Opens Windows Calendar, Mac or iPhone calendar app instantly
              </div>
            </button>

            {/* Launcher 2: Google Calendar */}
            <button
              onClick={handleGoogleCalendarSubscribe}
              disabled={loading || !token}
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#34d399';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ExternalLink size={18} />
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {isLocalHost ? 'Instant Import' : 'Cloud Web'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                Google Calendar
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.3 }}>
                {isLocalHost ? 'Downloads .ics & opens Google Calendar import in 1 click' : 'Opens Google Calendar live subscription feed'}
              </div>
            </button>

            {/* Launcher 3: Localhost Viva Demo (.ics snapshot download) */}
            <button
              onClick={handleDownloadSnapshot}
              disabled={loading || !token}
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Download size={18} />
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  Viva Demo
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                Download .ics Snapshot
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.3 }}>
                Instant offline evaluation: Double-click to open in calendar in 2s
              </div>
            </button>
          </div>


          {/* Active Scheduled Examinations with 1-Click Direct Sync */}
          {activeExams.length > 0 && (
            <div style={{
              marginTop: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> Active Scheduled Exams (1-Click Add to Google Calendar)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeExams.map((ex) => (
                  <div
                    key={ex.exam_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#090d16',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>
                        [{ex.exam_type}] {ex.course_code}: {ex.course_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        📅 {new Date(ex.exam_date).toLocaleString()} • Venue: {ex.venue}
                      </div>
                    </div>
                    <a
                      href={getGoogleCalendarExamUrl(ex)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      <Calendar size={12} /> + Google Calendar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Cloud Security Telemetry & Key Rotation */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10b981" /> Cloud Security Telemetry & Cryptographic Scope
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <BellRing size={12} /> Embedded VALARM: 24h & 2h Push Active
            </span>
          </div>

          {/* Telemetry Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '0.8rem'
          }}>
            {/* Scope Locked */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase' }}>
                Strict Scope Isolation
              </div>
              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                {scope.department}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                {scope.program} • {scope.semester} ({scope.role})
              </div>
            </div>

            {/* Last Polled Status */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase' }}>
                Last Synced Telemetry
              </div>
              <div style={{ fontWeight: 600, color: tokenData?.calendar_last_polled_at ? '#38bdf8' : '#94a3b8' }}>
                {formatLastPolled(tokenData?.calendar_last_polled_at)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                Client server polling frequency: 1 hour (PT1H)
              </div>
            </div>
          </div>

          {/* Key Rotation Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} color="#f59e0b" /> Need to revoke access?
              </div>
              <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                Rotating token generates a new 64-char hex key and voids previous links across all devices.
              </div>
            </div>

            {showConfirmRotate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleRotateToken}
                  disabled={rotating}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: rotating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 12px rgba(220, 38, 38, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} style={{ animation: rotating ? 'spin 1s linear infinite' : 'none' }} />
                  {rotating ? 'Rotating...' : 'Confirm Revoke & Rotate'}
                </button>
                <button
                  onClick={() => setShowConfirmRotate(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmRotate(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <RefreshCw size={13} /> Revoke & Rotate Secret Token
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
