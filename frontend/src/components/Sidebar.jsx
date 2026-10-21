// =============================================================================
// ChronoSync — Cursor Developer Navigation (Sidebar.jsx)
// =============================================================================
// Clean hairline sidebar navigation with role-based links,
// persistent user session card, and theme controls.
// =============================================================================

import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ListTodo, Upload, Calendar, AlertTriangle,
  BarChart3, Users, Sun, Moon, LogOut, Clock, Layers, BookOpen, Crown, Brain, Sparkles, Megaphone,
  Send, Inbox, History, ShieldCheck, User
} from 'lucide-react';

// --- Role-Based Navigation Configuration ---
const NAV_ITEMS = {
  1: [ // STUDENT
    { path: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Personal Profile', icon: User, badge: 'Info' },
    { path: '/notices', label: 'HOD Notice Board', icon: Megaphone, badge: 'Official' },
    { path: '/ai-assistant', label: 'AI Report Analyst', icon: Brain, badge: '120B' },
    { path: '/deadlines', label: 'All Tasks & Feed', icon: ListTodo, badge: 'Tasks' },
    { path: '/history', label: 'My Task History', icon: History },
    { path: '/timer', label: 'Focus Timer', icon: Clock },
    { path: '/panic', label: 'Grievance Dispatch', icon: AlertTriangle },
  ],
  2: [ // CR
    { path: '/dashboard', label: 'CR Command Hub', icon: LayoutDashboard },
    { path: '/profile', label: 'Personal Profile', icon: User, badge: 'Info' },
    { path: '/cr/faculty-assignments', label: 'Faculty Assignments', icon: Inbox, badge: 'Tasks' },
    { path: '/history', label: 'Task & Audit History', icon: History, badge: 'Audit' },
    { path: '/notices', label: 'HOD Notice Board', icon: Megaphone, badge: 'Official' },
    { path: '/ai-assistant', label: 'AI Report Analyst', icon: Brain, badge: '120B' },
    { path: '/cr-portal', label: 'Timetable OCR', icon: Upload },
    { path: '/deadlines', label: 'Batch Deadlines', icon: ListTodo },
    { path: '/timer', label: 'Focus Timer', icon: Clock },
    { path: '/panic', label: 'Grievance Relay', icon: AlertTriangle },
  ],
  3: [ // FACULTY
    { path: '/dashboard', label: 'Faculty Console', icon: BookOpen },
    { path: '/profile', label: 'Faculty Profile', icon: User },
    { path: '/verify-receipt', label: 'SHA-256 Verifier', icon: ShieldCheck, badge: 'Crypto' },
    { path: '/faculty/assign-cr', label: 'Assign to CR', icon: Send, badge: 'Work' },
    { path: '/history', label: 'Assignment & Audit History', icon: History, badge: 'Audit' },
    { path: '/notices', label: 'HOD Notice Board', icon: Megaphone, badge: 'Official' },
    { path: '/ai-assistant', label: 'AI Report Analyst', icon: Brain, badge: '120B' },
    { path: '/exams', label: 'Exam Publisher', icon: Calendar },
    { path: '/deadlines', label: 'Assignments', icon: ListTodo },
    { path: '/analytics', label: 'Workload Analytics', icon: BarChart3 },
  ],
  4: [ // HOD
    { path: '/dashboard', label: 'Executive Governance', icon: Crown },
    { path: '/verify-receipt', label: 'SHA-256 Verifier', icon: ShieldCheck, badge: 'Crypto' },
    { path: '/history', label: 'Department Audit History & Roster', icon: History, badge: 'Audit' },
    { path: '/notices', label: 'Department Bulletins', icon: Megaphone, badge: 'Official' },
    { path: '/faculty/assign-cr', label: 'Assign to CR', icon: Send },
    { path: '/cr/faculty-assignments', label: 'CR Delegations', icon: Inbox },
    { path: '/ai-assistant', label: 'AI Report Analyst', icon: Brain, badge: '120B' },
    { path: '/analytics', label: 'Burnout Heatmap', icon: BarChart3 },
    { path: '/panic-logs', label: 'Panic Triage', icon: AlertTriangle },
    { path: '/exams', label: 'Exam Schedules', icon: Calendar },
    { path: '/users', label: 'User Governance', icon: Users },
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

  const roleId = user?.role_id || 1;
  const navItems = NAV_ITEMS[roleId] || NAV_ITEMS[1];
  const roleStyle = ROLE_BADGE[roleId] || ROLE_BADGE[1];

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name || 'User'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            color: 'var(--semantic-error)',
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
}
