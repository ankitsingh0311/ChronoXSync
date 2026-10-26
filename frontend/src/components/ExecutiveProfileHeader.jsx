// =============================================================================
// ChronoSync — Pure Personal Profile Header (ExecutiveProfileHeader.jsx)
// =============================================================================
// Displays exclusively verified Personal & University Identity:
// 1. Profile Picture (avatar_url) in a circular luxury frame
// 2. Full Name (crisp, high-contrast)
// 3. Designation Badge (theme-aware colors for dark & light modes)
// 4. University Badge (Official Logo + University Name)
// 5. Academic Meta: Department • Program • Semester • UID (high contrast)
// 6. Verified Social Links: GitHub & LinkedIn (official brand colors) + Edit Action
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../utils/media';
import {
  Building2, Hash, ExternalLink, Edit3
} from 'lucide-react';

function GithubIcon({ size = 13, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon({ size = 13, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function ExecutiveProfileHeader({
  roleAccent = 'var(--primary)',
  roleLabel = 'Student',
  designationText = null,
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  if (!user) return null;

  // Resolve concise designation
  const designation = designationText || user.designation || (
    user.role_id === 4 ? 'Head of Department' :
    user.role_id === 3 ? 'Faculty Professor' :
    user.role_id === 2 ? 'Class Representative (CR)' :
    'Student'
  );

  // Role pill theme-aware palette (High contrast WCAG AAA in both modes)
  const roleStyles = (() => {
    const roleId = user.role_id;
    if (roleId === 2 || roleLabel === 'Class Representative') {
      return {
        color: isDark ? '#2dd4bf' : '#0f766e',
        bg: isDark ? 'rgba(20, 184, 166, 0.16)' : '#ccfbf1',
        border: isDark ? 'rgba(20, 184, 166, 0.35)' : '#99f6e4',
        accent: isDark ? '#14b8a6' : '#0d9488'
      };
    }
    if (roleId === 3 || roleLabel === 'Faculty Member') {
      return {
        color: isDark ? '#fbbf24' : '#b45309',
        bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
        border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
        accent: isDark ? '#f59e0b' : '#d97706'
      };
    }
    if (roleId === 4 || roleLabel === 'Department Head') {
      return {
        color: isDark ? '#f472b6' : '#be185d',
        bg: isDark ? 'rgba(236, 72, 153, 0.16)' : '#fce7f3',
        border: isDark ? 'rgba(236, 72, 153, 0.35)' : '#fbcfe8',
        accent: isDark ? '#ec4899' : '#be185d'
      };
    }
    // Student default
    return {
      color: isDark ? '#60a5fa' : '#1d4ed8',
      bg: isDark ? 'rgba(37, 99, 235, 0.16)' : '#dbeafe',
      border: isDark ? 'rgba(37, 99, 235, 0.35)' : '#bfdbfe',
      accent: isDark ? '#3b82f6' : '#2563eb'
    };
  })();

  const cleanGithub = user.github_url?.trim();
  const cleanLinkedin = user.linkedin_url?.trim();
  const githubHref = cleanGithub ? (cleanGithub.startsWith('http') ? cleanGithub : `https://${cleanGithub}`) : null;
  const linkedinHref = cleanLinkedin ? (cleanLinkedin.startsWith('http') ? cleanLinkedin : `https://${cleanLinkedin}`) : null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 28px',
        marginBottom: '24px',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.45)'
          : '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Accent Gradient Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${roleStyles.accent}, rgba(139, 92, 246, 0.6), transparent)`
        }}
      />

      {/* Main Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        
        {/* Left: Avatar + Identity Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 auto', minWidth: '320px' }}>
          
          {/* Profile Picture */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '66px',
                height: '66px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: isDark ? '#1e293b' : '#f1f5f9',
                border: `2.5px solid ${roleStyles.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? `0 4px 16px ${roleStyles.accent}33` : '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {user.avatar_url && !avatarFailed ? (
                <img
                  src={getMediaUrl(user.avatar_url)}
                  alt={user.full_name || 'Profile'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: roleStyles.color,
                  fontFamily: 'var(--font-heading)'
                }}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <Link
              to="/profile"
              title="Change Profile Picture"
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textDecoration: 'none'
              }}
            >
              <Edit3 size={11} />
            </Link>
          </div>

          {/* Identity Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            
            {/* Row 1: Full Name + Designation Badge + University */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                {user.full_name || 'Academic Scholar'}
              </h1>

              {/* Designation Pill */}
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: roleStyles.bg,
                  color: roleStyles.color,
                  border: `1px solid ${roleStyles.border}`,
                  letterSpacing: '0.01em'
                }}
                title="Academic Designation"
              >
                {designation}
              </span>

              {/* University Badge (Logo + Name) */}
              {user.university_name ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                  title="Affiliated University"
                >
                  {user.university_logo && !logoFailed ? (
                    <img
                      src={getMediaUrl(user.university_logo)}
                      alt=""
                      style={{
                        width: '17px',
                        height: '17px',
                        borderRadius: '50%',
                        objectFit: 'contain',
                        background: '#ffffff',
                        padding: '1px'
                      }}
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <Building2 size={13} style={{ color: roleStyles.accent }} />
                  )}
                  <span>{user.university_name}</span>
                </div>
              ) : (
                <Link
                  to="/profile"
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px dashed var(--border-subtle)',
                    background: isDark ? 'transparent' : '#f8fafc'
                  }}
                  title="Add University in Profile"
                >
                  + Add University
                </Link>
              )}
            </div>

            {/* Row 2: Department • Program • Semester • UID */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              {user.department && <span style={{ color: 'var(--text-secondary)' }}>{user.department}</span>}
              {user.department && (user.program || user.semester) && <span style={{ color: 'var(--border-strong, #94a3b8)' }}>•</span>}
              {user.program && <span style={{ color: 'var(--text-secondary)' }}>{user.program}</span>}
              {user.semester && <span style={{ color: 'var(--text-muted)' }}>({user.semester})</span>}
              <span style={{ color: 'var(--border-strong, #94a3b8)' }}>•</span>
              
              {/* UID Monospace Badge */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.02em'
                }}
                title="University Enrollment UID"
              >
                UID: {user.university_id || user.user_id}
              </span>
            </div>

          </div>
        </div>

        {/* Right: Social Profiles (GitHub, LinkedIn) & Edit Profile Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* GitHub Pill */}
          {githubHref ? (
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              title={`Open GitHub: ${cleanGithub}`}
            >
              <GithubIcon size={14} color="var(--text-primary)" />
              <span>GitHub</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>
          ) : (
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: isDark ? 'transparent' : '#f8fafc',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
              title="Link GitHub Profile"
            >
              <GithubIcon size={13} />
              <span>+ GitHub</span>
            </Link>
          )}

          {/* LinkedIn Pill (High-Contrast Official Brand Palette) */}
          {linkedinHref ? (
            <a
              href={linkedinHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: isDark ? 'rgba(10, 102, 194, 0.22)' : '#e0f2fe',
                border: isDark ? '1px solid rgba(10, 102, 194, 0.45)' : '1px solid #bae6fd',
                color: isDark ? '#38bdf8' : '#0369a1',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              title={`Open LinkedIn: ${cleanLinkedin}`}
            >
              <LinkedinIcon size={14} color={isDark ? '#38bdf8' : '#0369a1'} />
              <span>LinkedIn</span>
              <ExternalLink size={10} style={{ opacity: 0.7 }} />
            </a>
          ) : (
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: isDark ? 'transparent' : '#f8fafc',
                border: '1px dashed var(--border-subtle)',
                color: isDark ? '#38bdf8' : '#0369a1',
                fontSize: '12px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
              title="Link LinkedIn Profile"
            >
              <LinkedinIcon size={13} color={isDark ? '#38bdf8' : '#0369a1'} />
              <span>+ LinkedIn</span>
            </Link>
          )}

          {/* Edit Profile Action Button */}
          <Link
            to="/profile"
            className="btn btn-secondary"
            style={{
              height: '34px',
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              background: isDark ? 'var(--bg-card)' : '#ffffff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Edit Profile Information"
          >
            <Edit3 size={13} style={{ color: 'var(--text-secondary)' }} />
            <span>Edit Details</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
