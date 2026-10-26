// =============================================================================
// ChronoSync — Executive Profile Header Strip (ExecutiveProfileHeader.jsx)
// =============================================================================
// Displays verified personal info on every role dashboard:
// 1. Profile Picture (avatar_url) with fallback monogram
// 2. Full Name & Academic Designation (role_name / designation)
// 3. University Name with official University Logo
// 4. Social Links (GitHub & LinkedIn) with 1-click external navigation
// 5. University Enrollment ID (UID) & Department
// 6. Role-specific Quick Actions (children)
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import {
  Building2, Hash, ExternalLink, Edit3, ShieldCheck
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
  roleBg = 'rgba(37, 99, 235, 0.12)',
  roleBorder = 'rgba(37, 99, 235, 0.25)',
  designationText = null,
  children
}) {
  const { user } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  if (!user) return null;

  // Resolve designation: explicit override -> user.designation -> roleLabel
  const designation = designationText || user.designation || (
    user.role_id === 4 ? 'Head of Department (HOD)' :
    user.role_id === 3 ? 'Faculty Professor' :
    user.role_id === 2 ? 'Class Representative (CR)' :
    `${user.program || 'Undergraduate'} Student`
  );

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
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Accent Stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2.5px',
          background: `linear-gradient(90deg, ${roleAccent}, rgba(139, 92, 246, 0.5), transparent)`
        }}
      />

      {/* Left: Avatar + Personal Meta + Socials */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', flex: '1 1 500px' }}>
        
        {/* Profile Picture */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              overflow: 'hidden',
              background: 'var(--bg-tertiary)',
              border: `2px solid ${roleAccent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${roleAccent}25`,
              flexShrink: 0
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
                fontSize: '20px',
                fontWeight: 700,
                color: roleAccent,
                fontFamily: 'var(--font-heading)'
              }}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <Link
            to="/profile"
            title="Update Profile Picture"
            style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '10px',
              textDecoration: 'none'
            }}
          >
            <Edit3 size={9} />
          </Link>
        </div>

        {/* Identity Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          
          {/* Row 1: Name + Designation Badge + UID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '1.35rem',
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
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: roleBg,
                color: roleAccent,
                border: `1px solid ${roleBorder}`
              }}
              title="Official Academic Designation"
            >
              {designation}
            </span>

            {/* UID Badge */}
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                padding: '2px 7px',
                borderRadius: '5px',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="University Enrollment UID"
            >
              <Hash size={10} style={{ opacity: 0.7 }} />
              {user.university_id || user.user_id || 'UID-101'}
            </span>
          </div>

          {/* Row 2: University Name with Logo + Department/Program */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            
            {/* University Pill */}
            {user.university_name ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 10px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
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
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      objectFit: 'contain',
                      background: '#ffffff',
                      padding: '1px'
                    }}
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <Building2 size={13} style={{ color: '#818cf8' }} />
                )}
                <span>{user.university_name}</span>
              </div>
            ) : (
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  border: '1px dashed var(--border-subtle)'
                }}
                title="Add your university name and logo in profile settings"
              >
                <Building2 size={12} />
                <span>+ Add University & Logo</span>
              </Link>
            )}

            {/* Department / Program */}
            <span>
              {user.department || 'Department of Computer Science'}
              {user.program ? ` • ${user.program}` : ''}
              {user.semester ? ` • ${user.semester}` : ''}
            </span>
          </div>

          {/* Row 3: Verified Socials (GitHub, LinkedIn) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
            
            {/* GitHub */}
            {githubHref ? (
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                title={`Open GitHub: ${cleanGithub}`}
              >
                <GithubIcon size={12} />
                <span>GitHub</span>
                <ExternalLink size={9} style={{ opacity: 0.6 }} />
              </a>
            ) : (
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  textDecoration: 'none'
                }}
                title="Link your GitHub profile"
              >
                <GithubIcon size={11} />
                <span>+ GitHub</span>
              </Link>
            )}

            {/* LinkedIn */}
            {linkedinHref ? (
              <a
                href={linkedinHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: 'rgba(10, 102, 194, 0.12)',
                  border: '1px solid rgba(10, 102, 194, 0.3)',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                title={`Open LinkedIn: ${cleanLinkedin}`}
              >
                <LinkedinIcon size={12} color="#38bdf8" />
                <span>LinkedIn</span>
                <ExternalLink size={9} style={{ opacity: 0.6 }} />
              </a>
            ) : (
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  textDecoration: 'none'
                }}
                title="Link your LinkedIn profile"
              >
                <LinkedinIcon size={11} />
                <span>+ LinkedIn</span>
              </Link>
            )}

            {/* Quick Profile Edit Shortcut */}
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                marginLeft: '4px'
              }}
              title="Edit Profile Information"
            >
              <Edit3 size={11} />
              <span>Edit Details</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Right: Role-Specific Action Tools */}
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {children}
        </div>
      )}
    </div>
  );
}
