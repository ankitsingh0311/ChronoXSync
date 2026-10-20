// =============================================================================
// EduTrack 3D — Global React Error Boundary (ErrorBoundary.jsx)
// =============================================================================
// SUBJECT 2 (System Design): Graceful fault tolerance. Prevents white/black screen
// crashes when unhandled exceptions occur in complex dashboard rendering trees.
// =============================================================================

import React from 'react';
import { AlertOctagon, RefreshCw, Home, LogOut } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleLogout = () => {
    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const fallbackTitle = this.props.fallbackTitle || 'Component Rendering Exception';
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 32px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ef4444',
              }}
            >
              <AlertOctagon size={28} />
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
                marginBottom: '8px',
              }}
            >
              {fallbackTitle}
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                marginBottom: '18px',
              }}
            >
              The dashboard encountered a client-side execution exception. All your database records and session credentials remain completely safe and intact.
            </p>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: '#f87171',
                marginBottom: '22px',
                wordBreak: 'break-word',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {errorMessage}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  padding: '8px 16px',
                }}
              >
                <RefreshCw size={13} />
                Try Re-rendering
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  padding: '8px 18px',
                  background: 'var(--primary)',
                }}
              >
                <RefreshCw size={13} />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleLogout}
                className="btn btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  padding: '8px 14px',
                  color: 'var(--text-muted)',
                }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
