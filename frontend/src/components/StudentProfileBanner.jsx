// =============================================================================
// ChronoSync — Student & CR Profile Overview Banner (StudentProfileBanner.jsx)
// =============================================================================
// Displays user avatar photo, University ID, contact details, social links
// (GitHub, LinkedIn, Portfolio), and quick link to the Personal Profile &
// Certificates Dossier at the top of Student and CR Dashboards.
// =============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Globe, Hash, Phone, Mail, Award,
  ExternalLink, Edit3, ShieldCheck, Sparkles
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

  const [bannerAvatarFailed, setBannerAvatarFailed] = React.useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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

      {/* Left: User Avatar & Basic Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 340px' }}>
        {/* Avatar Photo */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: `2px solid ${roleColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          {user.avatar_url && !bannerAvatarFailed ? (
            <img
              src={getMediaUrl(user.avatar_url)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setBannerAvatarFailed(true)}
            />
          ) : (
            <span style={{ fontSize: '22px', fontWeight: 700, color: roleColor, fontFamily: 'var(--font-heading)' }}>
              {user.full_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>

        {/* Name & Academic Metas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {user.full_name || 'Student'}
            </h2>
            <span
              style={{
                fontSize: '10.5px',
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
            {user.university_id && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ID: {user.university_id}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>{user.program || 'Core CSE'}</span>
            <span>•</span>
            <span>{user.semester || 'Semester 3'}</span>
            {user.phone && (
              <>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} color="#10b981" /> {user.phone}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Social Links & Edit Profile Button */}
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
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <GithubIcon size={14} />
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
        {user.linkedin_url && (
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
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <LinkedinIcon size={14} />
            <span>LinkedIn</span>
            <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </a>
        )}

        {/* Portfolio Link */}
        {user.portfolio_url && (
          <a
            href={user.portfolio_url.startsWith('http') ? user.portfolio_url : `https://${user.portfolio_url}`}
            target="_blank"
            rel="noreferrer"
            title="Open Portfolio / Website"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: '#8b5cf6',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Globe size={14} />
            <span>Portfolio</span>
            <ExternalLink size={10} style={{ opacity: 0.6 }} />
          </a>
        )}

        {/* Edit Profile & Certificates Button */}
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
          }}
        >
          <Edit3 size={13} />
          <span>Edit Profile & Certificates</span>
        </Link>
      </div>
    </div>
  );
}
