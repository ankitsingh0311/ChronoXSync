import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, User, Sparkles } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../utils/media';

const ROLE_BADGE = {
  1: { label: 'Student', bg: 'var(--semantic-success-bg, #ecfdf5)', color: 'var(--semantic-success, #047857)', border: 'var(--semantic-success-border, #a7f3d0)' },
  2: { label: 'CR', bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' },
  3: { label: 'Faculty', bg: 'var(--semantic-warning-bg, #fffbeb)', color: 'var(--semantic-warning, #b45309)', border: 'var(--semantic-warning-border, #fde68a)' },
  4: { label: 'HOD', bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
};

export default function TopHeader() {
  const { toggleSidebar, isOpen } = useSidebar();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const roleId = user?.role_id || 1;
  const roleInfo = ROLE_BADGE[roleId] || ROLE_BADGE[1];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '56px',
        width: '100%',
        background: isDark ? 'rgba(10, 14, 23, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-subtle, #cbd5e1)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left Section: 3-line Menu Button + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* The 3-Line Hamburger Menu Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          title="Toggle Navigation Menu"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
            color: 'var(--text-primary, #0f172a)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
            e.currentTarget.style.borderColor = 'var(--primary, #2563eb)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9';
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
          }}
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>

        {/* Brand Mark */}
        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: isDark ? '#ffffff' : '#0f172a',
              color: isDark ? '#0f172a' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              fontSize: '14px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            }}
          >
            C
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            ChronoSync
          </span>
        </Link>

        {/* Dynamic Role Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: isDark ? 'rgba(255, 255, 255, 0.07)' : roleInfo.bg,
            color: isDark ? '#93c5fd' : roleInfo.color,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : roleInfo.border}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#60a5fa' : roleInfo.color,
            }}
          />
          {user?.role_name || roleInfo.label}
        </span>
      </div>

      {/* Right Section: Theme Switcher & User Profile Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 12px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}`,
            color: 'var(--text-secondary, #334155)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary, #2563eb)';
            e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1';
            e.currentTarget.style.color = 'var(--text-secondary, #334155)';
          }}
        >
          {isDark ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
          <span style={{ display: 'none', md: 'inline' }}>{isDark ? 'Dark' : 'Light'}</span>
        </button>

        {/* User Profile Link */}
        <Link
          to="/profile"
          title="Open Profile & Settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '34px',
            padding: '0 10px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}`,
            textDecoration: 'none',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '12.5px',
            fontWeight: 600,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary, #2563eb)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1';
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--bg-tertiary, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
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
          <span
            style={{
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.full_name || 'My Profile'}
          </span>
        </Link>
      </div>
    </header>
  );
}
