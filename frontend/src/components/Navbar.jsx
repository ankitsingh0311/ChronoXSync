// =============================================================================
// ChronoSync — Cursor Editorial Navbar (Navbar.jsx)
// =============================================================================
// Displays current academic context, live Viva Mode Role Switcher,
// cloud database telemetry indicators, dual-theme switcher, and
// automated 24-hour deadline reminder alerts bell.
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { reminderAPI } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Sun, Moon, ShieldCheck, Bell, Clock, AlertTriangle,
  CheckCircle2, RefreshCw, ExternalLink, X, Calendar, Radio
} from 'lucide-react';
import CalendarSyncModal from './CalendarSyncModal';
import { getMediaUrl } from '../utils/media';

const ROLE_COLORS = {
  1: '#10b981',
  2: '#14b8a6',
  3: '#f59e0b',
  4: '#ec4899',
  STUDENT: '#10b981',
  Student: '#10b981',
  CR: '#14b8a6',
  FACULTY: '#f59e0b',
  Faculty: '#f59e0b',
  HOD: '#ec4899',
};

export default function Navbar({ title, subtitle }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [reminders, setReminders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [navAvatarFailed, setNavAvatarFailed] = useState(false);
  const dropdownRef = useRef(null);

  const roleColor = ROLE_COLORS[user?.role_id] || ROLE_COLORS[user?.role_name] || '#10b981';
  const roleName = user?.role_name || (user?.role_id === 4 ? 'HOD' : user?.role_id === 3 ? 'Faculty' : user?.role_id === 2 ? 'CR' : 'Student');

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const res = await reminderAPI.getAll();
      setReminders(res.data?.reminders || []);
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      // Graceful fallback for non-student roles or network lag
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleScanNow = async () => {
    try {
      setIsScanning(true);
      await reminderAPI.scan();
      await fetchReminders();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await reminderAPI.markAllRead();
      setUnreadCount(0);
      setReminders(prev => prev.map(r => ({ ...r, is_read: true })));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await reminderAPI.markRead(id);
      setReminders(prev => prev.map(r => r.reminder_id === id ? { ...r, is_read: true } : r));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Single mark read failed:', err);
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      marginBottom: '28px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      position: 'relative',
      zIndex: 30,
    }}>
      {/* Title & Academic Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{
            fontSize: '1.35rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}>
            {title || 'ChronoSync'}
          </h1>
        </div>
        {subtitle && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginTop: '3px',
            letterSpacing: '-0.01em',
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right controls: Calendar Sync + 24h Alerts Bell + User Profile Badge + Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        
        {/* Live Calendar Sync (.ics) Glowing Pill Button */}
        {user && (
          <button
            onClick={() => setShowCalendarModal(true)}
            title="Subscribe with Google Calendar, Apple Calendar, or Outlook (.ics)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 'var(--radius-pill)',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.18)',
              transition: 'all 0.25s ease',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(59, 130, 246, 0.38)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Calendar size={14} />
            <span>Sync Calendar (.ics)</span>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8',
              display: 'inline-block',
            }} />
          </button>
        )}

        {/* 24-Hour Automated Deadline Reminder Bell */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              title="Automated 24h Deadline Alerts"
              style={{
                background: showDropdown ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                border: `1px solid ${unreadCount > 0 ? '#ef4444' : 'var(--border-subtle)'}`,
                color: unreadCount > 0 ? '#ef4444' : 'var(--text-primary)',
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = unreadCount > 0 ? '#ef4444' : 'var(--border-subtle)';
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                  animation: 'pulse 2s infinite',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Modal */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '360px',
                maxHeight: '440px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Dropdown Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#ef4444" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      24h Deadline Alerts
                    </span>
                    {reminders.length > 0 && (
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: '#ef444420',
                        color: '#ef4444',
                        fontWeight: 700,
                      }}>
                        {reminders.length} Active
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handleScanNow}
                      disabled={isScanning}
                      title="Trigger Background Scheduler Scan Now"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                      }}
                    >
                      <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          padding: '2px 4px',
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown List */}
                <div style={{
                  padding: '10px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '340px',
                }}>
                  {reminders.length === 0 ? (
                    <div style={{
                      padding: '30px 16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12.5px',
                    }}>
                      <CheckCircle2 size={30} color="#10b981" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                        All Caught Up!
                      </p>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        No submissions due within the next 24 hours. Automated cron actively monitors upcoming due dates.
                      </p>
                    </div>
                  ) : (
                    reminders.map((rem) => {
                      const isCritical = rem.hours_remaining <= 6;
                      const badgeColor = isCritical ? '#ef4444' : (rem.hours_remaining <= 12 ? '#f97316' : '#eab308');

                      return (
                        <div
                          key={rem.reminder_id}
                          onClick={() => handleMarkSingleRead(rem.reminder_id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: rem.is_read ? 'var(--bg-secondary)' : `${badgeColor}0e`,
                            border: `1px solid ${rem.is_read ? 'var(--border-subtle)' : `${badgeColor}35`}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: badgeColor,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <Clock size={11} /> {rem.time_remaining_str}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: `${badgeColor}20`,
                              color: badgeColor,
                              fontWeight: 700,
                            }}>
                              {rem.alert_level || 'URGENT'}
                            </span>
                          </div>

                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            lineHeight: '1.3',
                          }}>
                            {rem.title}
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '2px',
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {rem.course_name}
                            </span>
                            <Link
                              to="/deadlines"
                              onClick={() => setShowDropdown(false)}
                              style={{
                                fontSize: '11px',
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 600,
                              }}
                            >
                              Submit <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  textAlign: 'center',
                }}>
                  <Link
                    to="/deadlines"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    View All Academic Deadlines &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verified User Identity Badge */}
        {user && (
          <Link
            to="/profile"
            title="View & Edit Profile"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = roleColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: `${roleColor}22`,
              color: roleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {user.avatar_url && !navAvatarFailed ? (
                <img
                  src={getMediaUrl(user.avatar_url)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setNavAvatarFailed(true)}
                />
              ) : (
                user.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '12px' }}>
              {user.full_name || 'User'}
            </span>
            <span style={{
              fontSize: '10.5px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: `${roleColor}18`,
              color: roleColor,
              fontWeight: 600,
              border: `1px solid ${roleColor}35`,
            }}>
              {roleName}
            </span>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch Theme (Current: ${theme})`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-accent)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-card)';
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Calendar Sync Studio Modal (RFC-5545 Live Engine) */}
      <CalendarSyncModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </header>
  );
}
