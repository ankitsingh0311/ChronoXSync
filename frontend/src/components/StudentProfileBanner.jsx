// =============================================================================
// ChronoSync — Student & CR Profile Overview Banner (StudentProfileBanner.jsx)
// =============================================================================
// Displays user avatar photo, Full Name, University ID (UID), University Name
// with University Logo, and social credentials (GitHub & LinkedIn) at the
// very top of both Student and CR Dashboards.
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Globe, Hash, Phone, Mail, Award,
  ExternalLink, Edit3, ShieldCheck, Sparkles, Building2, GraduationCap
} from 'lucide-react';
import { getMediaUrl } from '../utils/media';

function GithubIcon({ size = 14, color = "currentColor", ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon({ size = 14, color = "currentColor", ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function StudentProfileBanner({ certCount = 0 }) {
  const { user } = useAuth();
  if (!user) return null;

  const roleName = user.role_name || (user.role_id === 2 ? 'CR' : 'STUDENT');
  const roleColor = roleName === 'CR' ? '#14b8a6' : '#10b981';

  const [bannerAvatarFailed, setBannerAvatarFailed] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Top Accent Gradient Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${roleColor}, #06b6d4, #8b5cf6)`,
        }}
      />

      {/* Left: User Avatar & Identity Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: '1 1 420px', flexWrap: 'wrap' }}>
        {/* Avatar Photo */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: `2.5px solid ${roleColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          {user.avatar_url && !bannerAvatarFailed ? (
            <img
              src={getMediaUrl(user.avatar_url)}
              alt={user.full_name || 'Profile'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setBannerAvatarFailed(true)}
            />
          ) : (
            <span style={{ fontSize: '24px', fontWeight: 700, color: roleColor, fontFamily: 'var(--font-heading)' }}>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Identity & Academic Meta */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Full Name */}
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {user.full_name || 'Student'}
            </h2>

            {/* Role Badge */}
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: `${roleColor}18`,
                color: roleColor,
                border: `1px solid ${roleColor}35`,
              }}
            >
              {roleName}
            </span>

            {/* UID (University / Student ID) */}
            {user.university_id ? (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="University Enrollment ID"
              >
                <Hash size={11} /> UID: {user.university_id}
              </span>
            ) : (
              <Link
                to="/profile"
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px dashed var(--border-subtle)',
                  textDecoration: 'none'
                }}
                title="Click to set your University ID"
              >
                + Add UID
              </Link>
            )}
          </div>

          {/* University Name along with University Logo */}
          <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {user.university_name ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '3px 12px 3px 6px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                {/* University Logo */}
                {user.university_logo && !logoLoadFailed ? (
                  <img
                    src={getMediaUrl(user.university_logo)}
                    alt=""
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'contain',
                      background: '#ffffff',
                      padding: '2px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      flexShrink: 0
                    }}
                    onError={() => setLogoLoadFailed(true)}
                  />
                ) : (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Building2 size={13} color="#a5b4fc" />
                  </div>
                )}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e0e7ff', letterSpacing: '-0.01em' }}>
                  {user.university_name}
                </span>
              </div>
            ) : (
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  background: 'rgba(99, 102, 241, 0.05)',
                  color: '#a5b4fc',
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <Building2 size={13} color="#a5b4fc" />
                <span>+ Add University Name & Logo</span>
              </Link>
            )}

            {/* Academic Program & Semester */}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {user.program || 'Core CSE'} • {user.semester || 'Semester 3'}
            </span>
            {user.section && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                Section: {user.section}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Social Links (GitHub, LinkedIn) & Edit Profile Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* GitHub Link */}
        {user.github_url ? (
          <a
            href={user.github_url.startsWith('http') ? user.github_url : `https://${user.github_url}`}
            target="_blank"
            rel="noreferrer"
            title="Open GitHub Profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <GithubIcon size={14} color="#f8fafc" />
            <span>GitHub</span>
            <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </a>
        ) : (
          <Link
            to="/profile"
            title="Add your GitHub link in Profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              textDecoration: 'none',
            }}
          >
            <GithubIcon size={13} />
            <span>+ Add GitHub</span>
          </Link>
        )}

        {/* LinkedIn Link */}
        {user.linkedin_url ? (
          <a
            href={user.linkedin_url.startsWith('http') ? user.linkedin_url : `https://${user.linkedin_url}`}
            target="_blank"
            rel="noreferrer"
            title="Open LinkedIn Profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(10, 102, 194, 0.15)',
              border: '1px solid rgba(10, 102, 194, 0.35)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <LinkedinIcon size={14} color="#38bdf8" />
            <span>LinkedIn</span>
            <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </a>
        ) : (
          <Link
            to="/profile"
            title="Add your LinkedIn link in Profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              textDecoration: 'none',
            }}
          >
            <LinkedinIcon size={13} />
            <span>+ Add LinkedIn</span>
          </Link>
        )}

        {/* Edit Personal Information Button */}
        <Link
          to="/profile"
          className="btn btn-secondary"
          style={{
            fontSize: '12.5px',
            height: '34px',
            padding: '0 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            fontWeight: 500,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <Edit3 size={13} />
          <span>Edit Personal Info</span>
        </Link>
      </div>
    </div>
  );
}
