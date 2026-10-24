// =============================================================================
// ChronoSync — Personal Information & Academic Dossier (StudentProfile.jsx)
// =============================================================================
// Allows Students & CRs to manage personal credentials, phone number,
// University Enrollment ID, avatar photo, social URLs (GitHub, LinkedIn, Portfolio),
// and upload/delete verified certificates permanently stored in the database.
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileAPI, authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Hash, Globe, Award,
  Upload, Trash2, CheckCircle2, AlertCircle, ArrowLeft,
  ExternalLink, Calendar, FileText, Camera, ShieldCheck, Sparkles, Plus, Loader2,
  Sliders, Crop, X
} from 'lucide-react';
import ImageAdjustModal from '../components/ImageAdjustModal';
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

export default function StudentProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    university_id: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    bio: '',
    program: '',
    semester: '',
  });

  // Action States
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);
  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    issue_date: '',
    credential_url: '',
  });
  const [certFile, setCertFile] = useState(null);

  const avatarInputRef = useRef(null);

  // Photo Adjust / Crop Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);


  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await profileAPI.getProfile();
      const u = res.data.user;
      setProfile(u);
      setCertificates(res.data.certificates || []);
      setFormData({
        full_name: u.full_name || '',
        phone: u.phone || '',
        university_id: u.university_id || '',
        github_url: u.github_url || '',
        linkedin_url: u.linkedin_url || '',
        portfolio_url: u.portfolio_url || '',
        bio: u.bio || '',
        program: u.program || '',
        semester: u.semester || '',
      });
      // Synchronize context
      updateUser(u);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load profile details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const res = await profileAPI.updateProfile(formData);
      setProfile(res.data.user);
      setCertificates(res.data.certificates || []);
      updateUser(res.data.user);
      setStatusMessage({
        type: 'success',
        text: '✓ Personal Information updated permanently in database.',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Update profile failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImageSrc(event.target.result);
      setShowAdjustModal(true);
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleOpenCurrentAvatarForAdjust = () => {
    if (!profile?.avatar_url) return;
    setSelectedImageSrc(profile.avatar_url);
    setShowAdjustModal(true);
  };

  const handleConfirmCrop = async (croppedFile) => {
    try {
      setIsUploadingAvatar(true);
      setStatusMessage(null);
      const res = await profileAPI.uploadAvatar(croppedFile);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setShowAdjustModal(false);
      setSelectedImageSrc(null);
      setStatusMessage({
        type: 'success',
        text: '✓ Profile photo adjusted, cropped & updated successfully!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to upload adjusted photo.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      setIsUploadingAvatar(true);
      const res = await profileAPI.deleteAvatar();
      setProfile(res.data.user);
      updateUser(res.data.user);
      setStatusMessage({
        type: 'success',
        text: '✓ Profile photo removed. Reverted to default avatar.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete avatar failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to remove photo.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.title.trim() || !certForm.issuer.trim()) {
      alert('Please provide Certificate Title and Issuing Organization.');
      return;
    }

    try {
      setIsSubmittingCert(true);
      const data = new FormData();
      data.append('title', certForm.title.trim());
      data.append('issuer', certForm.issuer.trim());
      if (certForm.issue_date) data.append('issue_date', certForm.issue_date.trim());
      if (certForm.credential_url) data.append('credential_url', certForm.credential_url.trim());
      if (certFile) data.append('file', certFile);

      const res = await profileAPI.addCertificate(data);
      setCertificates(res.data.certificates || []);
      setShowCertModal(false);
      setCertForm({ title: '', issuer: '', issue_date: '', credential_url: '' });
      setCertFile(null);
      setStatusMessage({
        type: 'success',
        text: '✓ New certificate saved permanently to your profile.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Add certificate failed:', err);
      alert(err.response?.data?.detail || 'Failed to save certificate.');
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const handleDeleteCertificate = async (certId, title) => {
    if (!window.confirm(`Delete certificate "${title}"? This cannot be undone.`)) return;

    try {
      const res = await profileAPI.deleteCertificate(certId);
      setCertificates(res.data.certificates || []);
      setStatusMessage({
        type: 'success',
        text: `✓ Certificate "${title}" deleted permanently.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete certificate failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to delete certificate.',
      });
    }
  };

  const roleName = profile?.role_name || (profile?.role_id === 2 ? 'CR' : 'STUDENT');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      <Navbar
        title="Personal Information & Academic Dossier"
        subtitle="Manage personal records, contact information, social handles, and verified certificates."
      />

      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Database Record: Permanent
        </span>
      </div>

      {/* Status Alert Banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '13.5px',
              fontWeight: 500,
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header Hero Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6)',
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
          {/* Avatar Upload Container & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                  border: '3px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
                onClick={() => avatarInputRef.current?.click()}
                title="Click to upload & adjust profile photo"
              >
                {profile?.avatar_url && !avatarLoadFailed ? (
                  <img
                    src={getMediaUrl(profile.avatar_url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Upload Button Badge */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Upload & adjust new profile photo"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: '2px solid var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
              >
                {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={15} />}
              </button>
            </div>

            {/* Quick Photo Actions (Adjust & Crop / Remove / Upload) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Choose new image to adjust"
              >
                <Upload size={11} /> Upload
              </button>

              {profile?.avatar_url && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenCurrentAvatarForAdjust}
                    disabled={isUploadingAvatar}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#10b981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                    title="Crop, rotate, or adjust photo position & zoom"
                  >
                    <Sliders size={11} /> Adjust
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Remove profile photo"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Identity Details */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {profile?.full_name || user?.full_name || 'Student Profile'}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: roleName === 'CR' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: roleName === 'CR' ? '#14b8a6' : '#10b981',
                  border: `1px solid ${roleName === 'CR' ? 'rgba(20, 184, 166, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {roleName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {profile?.department || 'Computer Science & Engineering'}
              </span>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {profile?.bio || 'No academic bio added yet. Add your personal bio, goals, and technical interests below.'}
            </p>

            {/* Quick Links & Info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              {profile?.university_id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '6px' }}>
                  <Hash size={13} style={{ color: 'var(--primary)' }} />
                  <strong>ID:</strong> {profile.university_id}
                </div>
              )}
              {profile?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '6px' }}>
                  <Phone size={13} style={{ color: '#10b981' }} />
                  {profile.phone}
                </div>
              )}
              {profile?.github_url && (
                <a
                  href={profile.github_url.startsWith('http') ? profile.github_url : `https://${profile.github_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-tertiary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <GithubIcon size={13} /> GitHub <ExternalLink size={11} />
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    color: '#0284c7',
                    background: 'rgba(2, 132, 199, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                  }}
                >
                  <LinkedinIcon size={13} color="#0284c7" /> LinkedIn <ExternalLink size={11} />
                </a>
              )}
              {profile?.portfolio_url && (
                <a
                  href={profile.portfolio_url.startsWith('http') ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    color: '#8b5cf6',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                  }}
                >
                  <Globe size={13} /> Portfolio <ExternalLink size={11} />
                </a>
              )}

              {/* Photo Remove Option if present */}
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--semantic-error)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                  }}
                >
                  <Trash2 size={12} /> Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Form Column: Personal & Social Details */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Personal Details & Social Links
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            {/* Email (Read Only Verified) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Institutional Email (Verified)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input"
                  style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-tertiary)' }}
                />
                <ShieldCheck size={16} color="#10b981" style={{ position: 'absolute', right: '12px' }} />
              </div>
            </div>

            {/* Phone & University ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  University ID / Roll No
                </label>
                <input
                  type="text"
                  name="university_id"
                  value={formData.university_id}
                  onChange={handleInputChange}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="24BCSE10492"
                />
              </div>
            </div>

            {/* Program & Semester */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Academic Program
                </label>
                <input
                  type="text"
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Core CSE / AI-ML"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Current Semester
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Semester 3"
                />
              </div>
            </div>

            {/* GitHub URL */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <GithubIcon size={13} /> GitHub Profile URL
              </label>
              <input
                type="text"
                name="github_url"
                value={formData.github_url}
                onChange={handleInputChange}
                className="input"
                style={{ width: '100%' }}
                placeholder="https://github.com/username"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <LinkedinIcon size={13} color="#0284c7" /> LinkedIn Profile URL
              </label>
              <input
                type="text"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                className="input"
                style={{ width: '100%' }}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            {/* Portfolio URL */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Globe size={13} color="#8b5cf6" /> Personal Portfolio / Resume URL
              </label>
              <input
                type="text"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleInputChange}
                className="input"
                style={{ width: '100%' }}
                placeholder="https://yourportfolio.dev"
              />
            </div>

            {/* Academic Bio */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Bio & Technical Highlights
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="input"
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Brief summary of your academic interests, stack expertise (e.g. React, Python, RDBMS), and projects..."
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '10px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isSaving ? 'Saving to Database...' : 'Save Profile Changes Permanently'}
            </button>
          </form>
        </div>

        {/* Certificates & Achievements Column */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={18} style={{ color: '#f59e0b' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Certificates & Credentials
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {certificates.length} verified credential{certificates.length === 1 ? '' : 's'} on record
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="btn btn-primary"
              style={{
                fontSize: '12px',
                height: '32px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Plus size={14} /> Add Certificate
            </button>
          </div>

          {/* Certificate Cards List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {certificates.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <Award size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  No Certificates Added Yet
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Upload your Coursera, NPTEL, AWS, or college competition certificates with verification links or PDF files.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="btn btn-secondary"
                  style={{ marginTop: '14px', fontSize: '12px' }}
                >
                  <Plus size={13} style={{ marginRight: '4px' }} /> Add Your First Certificate
                </button>
              </div>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.certificate_id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'var(--transition-smooth)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cert.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{cert.issuer}</span>
                        {cert.issue_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                            <Calendar size={11} /> {cert.issue_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Option to change/manage data */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCertificate(cert.certificate_id, cert.title)}
                      title="Permanently delete certificate"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--semantic-error)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Actions / Links */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url.startsWith('http') ? cert.credential_url : `https://${cert.credential_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '11.5px',
                          color: '#06b6d4',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500,
                        }}
                      >
                        <ExternalLink size={12} /> Verify Credential
                      </a>
                    )}
                    {cert.file_path && (
                      <a
                        href={getMediaUrl(cert.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500,
                          background: 'var(--bg-card)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <FileText size={12} /> View Certificate Document ({cert.file_name || 'PDF'})
                      </a>
                    )}
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Added: {cert.created_at?.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="card" style={{
          marginTop: '24px',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Danger Zone: Delete Account
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '540px' }}>
                  Permanently delete your account, academic records, and coursework from the SQLite database
                  and synchronize removal with the institutional directory ledger in real time.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError('');
                setShowDeleteModal(true);
              }}
              style={{
                padding: '8px 18px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <Trash2 size={15} />
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '450px',
                background: 'var(--bg-card, #121214)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                  }}>
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Delete Account Permanently?
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {user?.email} ({user?.role_name || 'User'})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: '#ef4444' }}>Warning: This cannot be undone!</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Your user account will be permanently erased from the SQLite database.</li>
                  <li>Your credentials will be removed from <code style={{ color: '#f87171' }}>REGISTERED_USERS_DIRECTORY.md</code> and pushed to GitHub in real time.</li>
                  <li>All your tasks, submissions, and records will be deleted.</li>
                </ul>
              </div>

              {deleteAccountError && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <AlertCircle size={14} />
                  <span>{deleteAccountError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, height: '38px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={async () => {
                    try {
                      setIsDeletingAccount(true);
                      setDeleteAccountError('');
                      await authAPI.deleteMyAccount();
                      logout();
                      navigate('/login?deleted=true');
                    } catch (err) {
                      console.error('Failed to delete account:', err);
                      setDeleteAccountError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  }}
                  style={{
                    flex: 1.4,
                    height: '38px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 8px)',
                    cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: isDeletingAccount ? 0.7 : 1,
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Yes, Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={20} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Add Verified Certificate
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Certificate Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={certForm.title}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. AWS Certified Solutions Architect Associate"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Issuing Organization / Platform *
                  </label>
                  <input
                    type="text"
                    required
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Amazon Web Services / Coursera / NPTEL"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Issue Date
                    </label>
                    <input
                      type="text"
                      value={certForm.issue_date}
                      onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="e.g. Oct 2024 / 2024-10"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Credential Verification URL
                    </label>
                    <input
                      type="text"
                      value={certForm.credential_url}
                      onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="https://credly.com/..."
                    />
                  </div>
                </div>

                {/* File Attachment */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Attach Certificate Document (PDF or Image, optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    className="input"
                    style={{ width: '100%', padding: '8px' }}
                  />
                  {certFile && (
                    <span style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'block' }}>
                      Selected: {certFile.name} ({(certFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCertModal(false)}
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCert}
                    className="btn btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isSubmittingCert ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                    {isSubmittingCert ? 'Saving Certificate...' : 'Save Certificate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Photo Interactive Adjust & Crop Modal */}
      <ImageAdjustModal
        isOpen={showAdjustModal}
        imageSrc={selectedImageSrc}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedImageSrc(null);
        }}
        onConfirm={handleConfirmCrop}
        isUploading={isUploadingAvatar}
        title="Adjust & Crop Profile Photo"
      />
    </div>
  );
}
