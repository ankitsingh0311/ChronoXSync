// =============================================================================
// ChronoSync — Role Switcher for Live Viva Demo (RoleSwitcher.jsx)
// =============================================================================
// Allows academic examiners to immediately toggle between all 4 distinct roles:
// - role_id = 1 (STUDENT)
// - role_id = 2 (CR - Class Rep)
// - role_id = 3 (FACULTY)
// - role_id = 4 (HOD / ADMIN)
// =============================================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const ROLES = [
  { id: 1, name: 'STUDENT', label: 'Student', color: 'var(--semantic-success)', desc: 'Feed & Focus Timer' },
  { id: 2, name: 'CR', label: 'CR', color: 'var(--primary)', desc: 'OCR & Deadlines' },
  { id: 3, name: 'FACULTY', label: 'Faculty', color: 'var(--semantic-warning)', desc: 'Exam Publisher' },
  { id: 4, name: 'HOD', label: 'HOD', color: 'var(--semantic-error)', desc: 'Heatmap & Triage' },
];

export default function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  if (!user) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 4px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 6px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <ShieldCheck size={13} style={{ color: 'var(--text-muted)' }} />
        <span>Role</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {ROLES.map((role) => {
          const isActive = user.role_id === role.id;
          return (
            <button
              key={role.id}
              onClick={() => switchRole(role.id, role.name)}
              title={`Switch to ${role.name}: ${role.desc}`}
              style={{
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: role.color,
                display: 'inline-block',
                opacity: isActive ? 1 : 0.6,
              }} />
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
