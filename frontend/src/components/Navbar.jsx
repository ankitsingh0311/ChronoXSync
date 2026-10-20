// =============================================================================
// ChronoSync — Cursor Editorial Navbar (Navbar.jsx)
// =============================================================================
// Displays current academic context, live Viva Mode Role Switcher,
// cloud database telemetry indicators, and dual-theme switcher.
// =============================================================================

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, ShieldCheck } from 'lucide-react';

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

  const roleColor = ROLE_COLORS[user?.role_id] || ROLE_COLORS[user?.role_name] || '#10b981';
  const roleName = user?.role_name || (user?.role_id === 4 ? 'HOD' : user?.role_id === 3 ? 'Faculty' : user?.role_id === 2 ? 'CR' : 'Student');

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
      zIndex: 20,
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

      {/* Right controls: User Profile Badge + Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Verified User Identity Badge */}
        {user && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: `${roleColor}22`,
              color: roleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
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
          </div>
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
    </header>
  );
}
