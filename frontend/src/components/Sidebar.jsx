// =============================================================================
// ChronoSync — Cursor Developer Navigation (Sidebar.jsx)
// =============================================================================
// Clean hairline sidebar navigation with role-based links,
// persistent user session card, and theme controls.
// =============================================================================

import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../utils/media';
import { authAPI } from '../services/api';
import {
  LayoutDashboard, ListTodo, Upload, Calendar, AlertTriangle,
  BarChart3, Users, Sun, Moon, LogOut, Clock, Layers, BookOpen, Crown, Brain, Sparkles, Megaphone,
  Send, Inbox, History, ShieldCheck, User, Trash2, X, AlertCircle, Loader2
} from 'lucide-react';

// --- Role-Based Navigation Configuration ---
const NAV_ITEMS = {
  1: [ // STUDENT
    { path: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Student Profile', icon: User },
    { path: '/deadlines', label: 'Tasks & Deadlines', icon: ListTodo },
    { path: '/notices', label: 'Department Notices', icon: Megaphone },
    { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
    { path: '/timer', label: 'Focus Timer', icon: Clock },
    { path: '/history', label: 'Audit History', icon: History },
    { path: '/panic', label: 'Grievance Dispatch', icon: AlertTriangle },
  ],
  2: [ // CR
    { path: '/dashboard', label: 'Class Rep Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'CR Profile', icon: User },
    { path: '/cr/faculty-assignments', label: 'Faculty Assignments', icon: Inbox },
    { path: '/deadlines', label: 'Batch Deadlines', icon: ListTodo },
    { path: '/cr-portal', label: 'Timetable OCR Scanner', icon: Upload },
    { path: '/notices', label: 'Department Notices', icon: Megaphone },
    { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
    { path: '/timer', label: 'Focus Timer', icon: Clock },
    { path: '/history', label: 'Audit History', icon: History },
    { path: '/panic', label: 'Grievance Relay', icon: AlertTriangle },
  ],
  3: [ // FACULTY
    { path: '/dashboard', label: 'Faculty Console', icon: BookOpen },
    { path: '/profile', label: 'Faculty Profile', icon: User },
    { path: '/deadlines', label: 'Assignments & Labs', icon: ListTodo },
    { path: '/faculty/assign-cr', label: 'Delegate to CR', icon: Send },
    { path: '/verify-receipt', label: 'Verify Submission Receipt', icon: ShieldCheck },
    { path: '/exams', label: 'Exam Schedules', icon: Calendar },
    { path: '/notices', label: 'Department Notices', icon: Megaphone },
    { path: '/analytics', label: 'Workload Analytics', icon: BarChart3 },
    { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
    { path: '/history', label: 'Audit History', icon: History },
  ],
  4: [ // HOD
    { path: '/dashboard', label: 'Executive Governance', icon: Crown },
    { path: '/verify-receipt', label: 'Verify Submission Receipt', icon: ShieldCheck },
    { path: '/notices', label: 'Department Bulletins', icon: Megaphone },
    { path: '/faculty/assign-cr', label: 'Assign to CR', icon: Send },
    { path: '/cr/faculty-assignments', label: 'CR Delegations', icon: Inbox },
    { path: '/analytics', label: 'Burnout & Workload', icon: BarChart3 },
    { path: '/panic-logs', label: 'Panic Triage', icon: AlertTriangle },
    { path: '/exams', label: 'Exam Schedules', icon: Calendar },
    { path: '/users', label: 'User Governance', icon: Users },
    { path: '/ai-assistant', label: 'Academic AI Assistant', icon: Brain },
    { path: '/history', label: 'Audit History', icon: History },
  ],
};

const ROLE_BADGE = {
  1: { bg: 'var(--semantic-success-bg)', color: 'var(--semantic-success)', border: 'var(--semantic-success-border)' },
  2: { bg: 'var(--primary-subtle)', color: 'var(--primary)', border: 'rgba(245, 78, 0, 0.25)' },
  3: { bg: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)', border: 'var(--semantic-warning-border)' },
  4: { bg: 'var(--semantic-error-bg)', color: 'var(--semantic-error)', border: 'var(--semantic-error-border)' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, themeName, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const roleId = user?.role_id || 1;
  const navItems = NAV_ITEMS[roleId] || NAV_ITEMS[1];
  const roleStyle = ROLE_BADGE[roleId] || ROLE_BADGE[1];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      await authAPI.deleteMyAccount();
      // Clean up any client vault entries so account cannot auto-revive
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('chronosync_vault_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
      logout();
      navigate('/login?deleted=true');
    } catch (err) {
      console.error('Failed to delete account:', err);
      // If 404, user account is already removed from DB: proceed with clean local logout
      if (err.response?.status === 404) {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('chronosync_vault_')) {
              localStorage.removeItem(key);
            }
          });
        } catch {}
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
    <motion.aside
      className="sidebar"
      initial={{ x: -270 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Brand Wordmark (Cursor-style quiet elegance) */}
      <div style={{ marginBottom: '28px', padding: '4px 8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '13px',
          }}>
            C
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              ChronoSync
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}>
              Workload v2.4
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <Link
        to="/profile"
        title="View & Edit Personal Profile"
        style={{
          textDecoration: 'none',
          display: 'block',
          padding: '12px 14px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
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
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: roleStyle.color,
              marginTop: '2px',
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: roleStyle.color,
              }} />
              {user?.role_name || 'STUDENT'}
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{
          padding: '6px 12px',
          fontSize: '10.5px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'var(--transition-smooth)',
              textDecoration: 'none',
            })}
          >
            <item.icon size={16} style={{ opacity: 0.85 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            fontSize: '12.5px',
            height: '34px',
            padding: '0 12px',
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{themeName}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            fontSize: '12.5px',
            height: '34px',
            padding: '0 12px',
            color: 'var(--text-secondary)',
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>

        {/* Delete Account in Footer */}
        <button
          onClick={() => {
            setDeleteError('');
            setShowDeleteModal(true);
          }}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            fontSize: '12.5px',
            height: '34px',
            padding: '0 12px',
            color: 'var(--semantic-error, #ef4444)',
            gap: '8px',
          }}
        >
          <Trash2 size={14} />
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '450px',
                background: 'var(--bg-card, #121214)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                  }}>
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
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

              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: '#ef4444' }}>Warning: This cannot be undone!</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Your user account will be permanently erased from the SQLite database.</li>
                  <li>Your credentials will be removed from <code style={{ color: '#f87171' }}>REGISTERED_USERS_DIRECTORY.md</code> and pushed to GitHub in real time.</li>
                  <li>All your tasks, submissions, and records will be deleted.</li>
                </ul>
              </div>

              {deleteError && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <AlertCircle size={14} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, height: '38px', fontSize: '13px' }}
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
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 8px)',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: isDeleting ? 0.7 : 1,
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting Account...</span>
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
  );
}
