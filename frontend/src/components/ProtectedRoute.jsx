// =============================================================================
// ChronoSync — Protected Route Guard (ProtectedRoute.jsx)
// =============================================================================
// Role-Based Access Control (RBAC) route wrapper verifying JWT authorization
// and presenting clean 403 status pages with fast role switching hints.
// =============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-heading)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border-subtle)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    return (
      <div style={{
        padding: '48px 32px',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '80px auto',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--semantic-error-border)',
      }}>
        <ShieldAlert size={40} style={{ color: 'var(--semantic-error)', margin: '0 auto 14px' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, color: 'var(--semantic-error)', marginBottom: '8px', fontSize: '1.25rem' }}>
          403 — Insufficient Role Clearance
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
          Active session role: <strong style={{ color: 'var(--text-primary)' }}>{user.role_name}</strong> (Role ID: {user.role_id}).<br />
          This module requires role clearance: {allowedRoles.join(' / ')}.
        </p>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-tertiary)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          Notice: Each account has access to its designated role portal. Please log in with an authorized account for this module.
        </p>
      </div>
    );
  }

  return children;
}
