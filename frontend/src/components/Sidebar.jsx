// =============================================================================
// ChronoSync — Slide-Out Drawer Navigation (Sidebar.jsx)
// =============================================================================
// Luxury slide-out navigation drawer triggered by the 3-line hamburger menu.
// Auto-closes on route changes, outside clicks, or Escape key.
// =============================================================================

import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../utils/media';
import { authAPI } from '../services/api';
import {
  LayoutDashboard, ListTodo, Upload, Calendar, AlertTriangle,
  BarChart3, Users, Sun, Moon, LogOut, Clock, Layers, BookOpen, Crown, Brain, Sparkles, Megaphone,
  Send, Inbox, History, ShieldCheck, User, Trash2, X, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';

// --- Role-Based Navigation Configuration with Groups ---
const NAV_GROUPS = {
  1: [ // STUDENT
    {
      title: 'WORKSPACE',
      items: [
        { path: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
        { path: '/profile', label: 'Student Profile', icon: User },
        { path: '/deadlines', label: 'Tasks & Deadlines', icon: ListTodo },
      ],
    },
    {
      title: 'ACADEMIC TOOLS',
      items: [
        { path: '/notices', label: 'Department Notices', icon: Megaphone },
        { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
        { path: '/timer', label: 'Focus Timer', icon: Clock },
      ],
    },
    {
      title: 'RECORDS & SUPPORT',
      items: [
        { path: '/history', label: 'Audit History', icon: History },
        { path: '/panic', label: 'Grievance Dispatch', icon: AlertTriangle },
      ],
    },
  ],
  2: [ // CR
    {
      title: 'COORDINATION WORKSPACE',
      items: [
        { path: '/dashboard', label: 'Class Rep Dashboard', icon: LayoutDashboard },
        { path: '/profile', label: 'CR Profile', icon: User },
        { path: '/deadlines', label: 'Batch Deadlines', icon: ListTodo },
        { path: '/cr/faculty-assignments', label: 'Faculty Assignments', icon: Inbox },
      ],
    },
    {
      title: 'ACADEMIC TOOLS',
      items: [
        { path: '/cr-portal', label: 'Timetable OCR Scanner', icon: Upload },
        { path: '/notices', label: 'Department Notices', icon: Megaphone },
        { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
        { path: '/timer', label: 'Focus Timer', icon: Clock },
      ],
    },
    {
      title: 'RECORDS & SUPPORT',
      items: [
        { path: '/history', label: 'Audit History', icon: History },
        { path: '/panic', label: 'Grievance Relay', icon: AlertTriangle },
      ],
    },
  ],
  3: [ // FACULTY
    {
      title: 'FACULTY WORKSPACE',
      items: [
        { path: '/dashboard', label: 'Faculty Console', icon: BookOpen },
        { path: '/profile', label: 'Faculty Profile', icon: User },
        { path: '/deadlines', label: 'Assignments & Labs', icon: ListTodo },
        { path: '/faculty/assign-cr', label: 'Delegate to CR', icon: Send },
      ],
    },
    {
      title: 'ACADEMIC TOOLS',
      items: [
        { path: '/verify-receipt', label: 'Verify Submission Receipt', icon: ShieldCheck },
        { path: '/exams', label: 'Exam Schedules', icon: Calendar },
        { path: '/notices', label: 'Department Notices', icon: Megaphone },
        { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
      ],
    },
    {
      title: 'ANALYTICS & AUDIT',
      items: [
        { path: '/analytics', label: 'Workload Analytics', icon: BarChart3 },
        { path: '/history', label: 'Audit History', icon: History },
      ],
    },
  ],
  4: [ // HOD
    {
      title: 'EXECUTIVE GOVERNANCE',
      items: [
        { path: '/dashboard', label: 'Executive Governance', icon: Crown },
        { path: '/verify-receipt', label: 'Verify Submission Receipt', icon: ShieldCheck },
        { path: '/notices', label: 'Department Bulletins', icon: Megaphone },
        { path: '/users', label: 'User Governance', icon: Users },
      ],
    },
    {
      title: 'COORDINATION & ANALYTICS',
      items: [
        { path: '/faculty/assign-cr', label: 'Assign to CR', icon: Send },
        { path: '/cr/faculty-assignments', label: 'CR Delegations', icon: Inbox },
        { path: '/analytics', label: 'Burnout & Workload', icon: BarChart3 },
        { path: '/panic-logs', label: 'Panic Triage', icon: AlertTriangle },
        { path: '/exams', label: 'Exam Schedules', icon: Calendar },
      ],
    },
    {
      title: 'INTELLIGENCE & AUDIT',
      items: [
        { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
        { path: '/history', label: 'Audit History', icon: History },
      ],
    },
  ],
};

const ROLE_BADGE = {
  1: { bg: 'var(--semantic-success-bg, #ecfdf5)', color: 'var(--semantic-success, #047857)', border: 'var(--semantic-success-border, #a7f3d0)' },
  2: { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' },
  3: { bg: 'var(--semantic-warning-bg, #fffbeb)', color: 'var(--semantic-warning, #b45309)', border: 'var(--semantic-warning-border, #fde68a)' },
  4: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, themeName, toggleTheme } = useTheme();
  const { isOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isDark = theme === 'dark';
  const roleId = user?.role_id || 1;
  const navGroups = NAV_GROUPS[roleId] || NAV_GROUPS[1];
  const roleStyle = ROLE_BADGE[roleId] || ROLE_BADGE[1];

  const handleLogout = () => {
    closeSidebar();
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      await authAPI.deleteMyAccount();
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('chronosync_vault_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
      closeSidebar();
      logout();
      navigate('/login?deleted=true');
    } catch (err) {
      console.error('Failed to delete account:', err);
      if (err.response?.status === 404) {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('chronosync_vault_')) {
              localStorage.removeItem(key);
            }
          });
        } catch {}
        closeSidebar();
        logout();
        navigate('/login?deleted=true');
        return;
      }
      setDeleteError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />

          {/* Slide-out Drawer Panel */}
          <motion.aside
            key="sidebar-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '320px',
              maxWidth: '85vw',
              background: isDark ? '#0c121e' : '#ffffff',
              borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-subtle, #cbd5e1)'}`,
              padding: '20px 18px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 25px rgba(0, 0, 0, 0.15)',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header: Logo + Close 'X' Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: isDark ? '#ffffff' : '#0f172a',
                    color: isDark ? '#0f172a' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    fontSize: '15px',
                  }}
                >
                  C
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ChronoSync
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginTop: '2px',
                    }}
                  >
                    Workload v2.4
                  </div>
                </div>
              </div>

              {/* Close Button ('X') */}
              <button
                type="button"
                onClick={closeSidebar}
                title="Close navigation (Esc)"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* User Profile Card */}
            <Link
              to="/profile"
              onClick={closeSidebar}
              title="View & Edit Personal Profile"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '18px',
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1'}`,
                borderRadius: '10px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary, #2563eb)';
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.07)' : '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1';
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary, #e2e8f0)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {user?.avatar_url && !avatarFailed ? (
                  <img
                    src={getMediaUrl(user.avatar_url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  user?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.full_name || 'User'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isDark ? '#93c5fd' : roleStyle.color,
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#60a5fa' : roleStyle.color,
                      }}
                    />
                    {user?.role_name || 'STUDENT'}
                  </span>
                  {user?.roll_no && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      • {user.roll_no}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            </Link>

            {/* Categorized Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {navGroups.map((group, groupIdx) => (
                <div key={group.title || groupIdx}>
                  <div
                    style={{
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: isDark ? '#64748b' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {group.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive
                            ? (isDark ? '#ffffff' : '#0f172a')
                            : (isDark ? '#cbd5e1' : '#334155'),
                          background: isActive
                            ? (isDark ? 'rgba(37, 99, 235, 0.16)' : '#e2e8f0')
                            : 'transparent',
                          borderLeft: isActive
                            ? '3px solid var(--primary, #2563eb)'
                            : '3px solid transparent',
                          transition: 'all 0.15s ease',
                          textDecoration: 'none',
                        })}
                      >
                        <item.icon size={16} style={{ opacity: 0.9, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom Actions: Theme Toggle, Sign Out, Delete Account */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '14px',
                borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {/* Theme Toggle Row */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1'}`,
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
                  <span>{themeName}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Toggle
                </span>
              </button>

              {/* Sign Out Row */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>

              {/* Delete Account (Subtle Danger Action) */}
              <button
                type="button"
                onClick={() => {
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#f87171' : '#dc2626',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: 0.85,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 size={13} />
                <span>Delete Account</span>
              </button>
            </div>

            {/* Delete Account Confirmation Modal */}
            <AnimatePresence>
              {showDeleteModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                  }}
                  onClick={() => !isDeleting && setShowDeleteModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      maxWidth: '440px',
                      background: isDark ? '#111827' : '#ffffff',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                          }}
                        >
                          <Trash2 size={18} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Delete Account Permanently?
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {user?.email} ({user?.role_name || 'User'})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#ef4444' }}>Warning: This action is irreversible!</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Your account credentials and session records will be deleted.</li>
                        <li>All pending tasks, submissions, and audit proofs will be permanently wiped.</li>
                      </ul>
                    </div>

                    {deleteError && (
                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          color: '#f87171',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <AlertCircle size={14} />
                        <span>{deleteError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setShowDeleteModal(false)}
                        style={{
                          flex: 1,
                          height: '38px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                          color: 'var(--text-primary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDeleteAccount}
                        style={{
                          flex: 1.4,
                          height: '38px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isDeleting ? 0.7 : 1,
                        }}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            <span>Yes, Delete Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
