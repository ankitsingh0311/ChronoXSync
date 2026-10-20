// =============================================================================
// ChronoSync — Cursor Editorial Navbar (Navbar.jsx)
// =============================================================================
// Displays current academic context, live Viva Mode Role Switcher,
// cloud database telemetry indicators, and dual-theme switcher.
// =============================================================================

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Database, Cloud, ShieldCheck } from 'lucide-react';

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
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            border: '1px solid rgba(245, 78, 0, 0.25)',
          }}>
            3NF · Azure SQL · NLP
          </span>
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

      {/* Right controls: Locked Role Identity Badge + Cloud Indicators + Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Cloud Status Badges (Subject 3: DP-900) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginRight: '4px',
        }} className="desktop-cloud-pills">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Database size={12} style={{ color: 'var(--semantic-success)' }} />
            <span>Azure SQL</span>
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Cloud size={12} style={{ color: 'var(--semantic-info)' }} />
            <span>Blob Store</span>
          </span>
        </div>

        {/* Read-Only Verified Role Clearance Badge (No switcher buttons) */}
        {user && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${roleColor}40`,
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            <ShieldCheck size={14} style={{ color: roleColor }} />
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role:</span>
            <span style={{ color: roleColor, fontWeight: 700 }}>
              {roleName}
            </span>
            <span style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              borderRadius: '4px',
              background: `${roleColor}18`,
              color: roleColor,
              marginLeft: '2px'
            }}>
              Level {user.role_id || 1}
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
