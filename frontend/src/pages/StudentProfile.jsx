// =============================================================================
// ChronoSync — Personal Information & Academic Dossier (StudentProfile.jsx)
// =============================================================================
// Allows Students & CRs to manage personal credentials:
// - Reflected on Dashboard Top: Name, UID, Profile Picture, University Name with Logo,
//   GitHub profile, LinkedIn profile.
// - Personal Dossier (Form Only): Phone, Program, Semester, Section, Personal Email,
//   Blood Group, Date of Birth, Emergency Contact, Address, Portfolio, LeetCode, Twitter, Bio.
// - Verified Academic Certificates permanent storage.
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
  Sliders, Crop, X, Building2, GraduationCap, HeartPulse, MapPin, Eye, Code, AtSign
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

// Popular institutional presets for 1-click logo & name setup
const UNIVERSITY_PRESETS = [
  { name: 'Stanford University', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Leland_Stanford_Junior_University.svg' },
  { name: 'Harvard University', logo: 'https://upload.wikimedia.org/wikipedia/en/2/29/Harvard_shield_wreath.svg' },
  { name: 'Massachusetts Institute of Technology (MIT)', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg' },
  { name: 'University of Oxford', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Oxford-University-Circlet.svg' },
  { name: 'University of Cambridge', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg' },
  { name: 'IIT Delhi', logo: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg' },
  { name: 'University of Delhi', logo: 'https://upload.wikimedia.org/wikipedia/en/8/84/University_of_Delhi.svg' },
  { name: 'Chandigarh University', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Chandigarh_University_seal.svg' },
  { name: 'Anna University', logo: 'https://upload.wikimedia.org/wikipedia/en/4/49/Anna_University_Logo.svg' },
  { name: 'University of Mumbai', logo: 'https://upload.wikimedia.org/wikipedia/en/6/63/University_of_Mumbai_coat_of_arms.svg' },
  { name: 'Visvesvaraya Technological University (VTU)', logo: 'https://upload.wikimedia.org/wikipedia/en/8/87/Visvesvaraya_Technological_University_logo.png' },
  { name: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)', logo: 'https://upload.wikimedia.org/wikipedia/en/2/20/AKTU_Logo.png' },
  { name: 'Lovely Professional University (LPU)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Lovely_Professional_University_logo.png/220px-Lovely_Professional_University_logo.png' },
];

export default function StudentProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State: Reflected on Dashboard + Dossier Only
  const [formData, setFormData] = useState({
    // Reflected on Dashboard Top:
    full_name: '',
    university_id: '',
    university_name: '',
    university_logo: '',
    github_url: '',
    linkedin_url: '',

    // Academic & Dossier Only:
    program: '',
    semester: '',
    section: '',
    phone: '',
    personal_email: '',
    portfolio_url: '',
    bio: '',
    blood_group: '',
    dob: '',
    emergency_contact: '',
    address: '',
    leetcode_url: '',
    twitter_url: '',
  });

  // Action States
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

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
  const logoInputRef = useRef(null);

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
        university_id: u.university_id || '',
        university_name: u.university_name || '',
        university_logo: u.university_logo || '',
        github_url: u.github_url || '',
        linkedin_url: u.linkedin_url || '',

        program: u.program || '',
        semester: u.semester || '',
        section: u.section || '',
        phone: u.phone || '',
        personal_email: u.personal_email || '',
        portfolio_url: u.portfolio_url || '',
        bio: u.bio || '',
        blood_group: u.blood_group || '',
        dob: u.dob || '',
        emergency_contact: u.emergency_contact || '',
        address: u.address || '',
        leetcode_url: u.leetcode_url || '',
        twitter_url: u.twitter_url || '',
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
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const res = await profileAPI.updateProfile(formData);
      setProfile(res.data.user);
      setCertificates(res.data.certificates || []);
      updateUser(res.data.user);
      setStatusMessage({
        type: 'success',
        text: '✓ Personal Information updated permanently! Changes are now live on your dashboard.',
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
        text: '✓ Profile photo adjusted, cropped & updated successfully! Reflecting on dashboard.',
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
      setStatusMessage(null);
      const res = await profileAPI.deleteAvatar();
      setProfile(res.data.user);
      updateUser(res.data.user);
      setStatusMessage({
        type: 'success',
        text: '✓ Profile photo removed. Reverted to default initials.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete avatar failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to remove avatar.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // University Logo File Upload Handler
  const handleLogoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, SVG, WEBP).' });
      return;
    }

    try {
      setIsUploadingLogo(true);
      setStatusMessage(null);
      const res = await profileAPI.uploadUniversityLogo(file);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setFormData((prev) => ({ ...prev, university_logo: updatedUser.university_logo }));
      updateUser(updatedUser);
      setLogoLoadFailed(false);
      setStatusMessage({
        type: 'success',
        text: '✓ University logo uploaded and live on your dashboard header!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Logo upload failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to upload university logo.',
      });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to remove your university logo?')) return;
    try {
      setIsUploadingLogo(true);
      setStatusMessage(null);
      const res = await profileAPI.deleteUniversityLogo();
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setFormData((prev) => ({ ...prev, university_logo: '' }));
      updateUser(updatedUser);
      setStatusMessage({
        type: 'success',
        text: '✓ University logo removed.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete logo failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to remove university logo.',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      university_name: preset.name,
      university_logo: preset.logo,
    }));
    setShowPresetModal(false);
    setStatusMessage({
      type: 'success',
      text: `Selected ${preset.name}! Click "Save Personal Information" below to persist.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.title.trim() || !certForm.issuer.trim()) {
      alert('Certificate Title and Issuing Organization are required.');
      return;
    }
    try {
      setIsSubmittingCert(true);
      const payload = {
        title: certForm.title.trim(),
        issuer: certForm.issuer.trim(),
        issue_date: certForm.issue_date.trim(),
        credential_url: certForm.credential_url.trim(),
      };
      if (certFile) payload.file = certFile;

      const res = await profileAPI.addCertificate(payload);
      setCertificates(res.data.certificates || []);
      setShowCertModal(false);
      setCertForm({ title: '', issuer: '', issue_date: '', credential_url: '' });
      setCertFile(null);
      setStatusMessage({
        type: 'success',
        text: '✓ Certificate permanently added to database dossier!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Add certificate failed:', err);
      alert(err.response?.data?.detail || 'Failed to save certificate.');
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const handleDeleteCertificate = async (certificateId, title) => {
    if (!window.confirm(`Permanently delete certificate "${title}" from the database?`)) return;
    try {
      const res = await profileAPI.deleteCertificate(certificateId);
      setCertificates(res.data.certificates || []);
      setStatusMessage({
        type: 'success',
        text: `✓ Certificate "${title}" removed permanently from database.`,
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete your entire ChronoSync account and coursework records! Continue?')) return;
    try {
      setIsDeletingAccount(true);
      setDeleteAccountError('');
      await authAPI.deleteAccount();
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('chronosync_vault_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
      logout();
      navigate('/login?deleted=true');
    } catch (err) {
      console.error('Delete account failed:', err);
      if (err.response?.status === 404) {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('chronosync_vault_')) {
              localStorage.removeItem(key);
            }
          });
        } catch {}
        logout();
        navigate('/login?deleted=true');
        return;
      }
      setDeleteAccountError(err.response?.data?.detail || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  const roleName = profile?.role_name || user?.role_name || (user?.role_id === 2 ? 'CR' : 'Student');
  const roleColor = roleName === 'CR' ? '#14b8a6' : '#10b981';

  if (isLoading && !profile) {
    return (
      <div>
        <Navbar title="Personal Information & Academic Dossier" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Loading your verified credentials from database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      <Navbar
        title="Personal Information & Academic Dossier"
        subtitle={`${formData.university_name || profile?.department || 'Institutional Profile'} · ${formData.full_name || profile?.full_name}`}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 16px 0' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} /> SQL Database Storage: Active
            </span>
          </div>
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

        {/* ========================================================================= */}
        {/* LIVE DASHBOARD TOP BANNER PREVIEW CARD */}
        {/* ========================================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 19, 17, 0.95), rgba(30, 27, 24, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '28px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, #6366f1, ${roleColor}, #f54e00)`,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#818cf8" />
              <strong style={{ fontSize: '13px', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Dashboard Header Preview
              </strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              This is exactly how your header appears at the top of your Student / CR Dashboard
            </span>
          </div>

          {/* Render Preview of the Top Banner */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Avatar Preview */}
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                  border: `2px solid ${roleColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {profile?.avatar_url && !avatarLoadFailed ? (
                  <img
                    src={getMediaUrl(profile.avatar_url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <span style={{ fontSize: '20px', fontWeight: 700, color: roleColor }}>
                    {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Name, Role & UID */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formData.full_name || 'Student Name'}
                  </h3>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: `${roleColor}18`,
                      color: roleColor,
                      border: `1px solid ${roleColor}35`,
                      textTransform: 'uppercase'
                    }}
                  >
                    {roleName}
                  </span>
                  {formData.university_id && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      UID: {formData.university_id}
                    </span>
                  )}
                </div>

                {/* University Name & Logo Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {formData.university_name ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 10px 2px 4px',
                        borderRadius: '16px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      {formData.university_logo ? (
                        <img
                          src={getMediaUrl(formData.university_logo)}
                          alt=""
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            objectFit: 'contain',
                            background: '#fff',
                            padding: '1.5px',
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Building2 size={12} color="#a5b4fc" />
                      )}
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#e0e7ff' }}>
                        {formData.university_name}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      (No University Name Set)
                    </span>
                  )}

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {formData.program || 'Core CSE'} • {formData.semester || 'Semester 3'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {formData.github_url && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '11.5px',
                    fontWeight: 500,
                  }}
                >
                  <GithubIcon size={13} color="#f8fafc" /> GitHub
                </span>
              )}
              {formData.linkedin_url && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(10, 102, 194, 0.15)',
                    border: '1px solid rgba(10, 102, 194, 0.35)',
                    color: '#38bdf8',
                    fontSize: '11.5px',
                    fontWeight: 500,
                  }}
                >
                  <LinkedinIcon size={13} color="#38bdf8" /> LinkedIn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN TWO-COLUMN WORKBENCH */}
        {/* ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', alignItems: 'start' }}>
          
          {/* LEFT: PERSONAL INFORMATION FORM */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '26px',
            }}
          >
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* SECTION 1: DASHBOARD HEADER CREDENTIALS */}
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} color="#f54e00" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Header Credentials
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#f54e00',
                      background: 'rgba(245, 78, 0, 0.1)',
                      border: '1px solid rgba(245, 78, 0, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    ✨ Reflected on Top of Dashboard
                  </span>
                </div>

                {/* Profile Photo Quick Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: `2px solid ${roleColor}`,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      flexShrink: 0
                    }}
                  >
                    {profile?.avatar_url && !avatarLoadFailed ? (
                      <img src={getMediaUrl(profile.avatar_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 700, color: roleColor }}>
                        {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Profile Picture</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Visible in dashboard header, submission receipts, and directory.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                      >
                        <Camera size={12} style={{ marginRight: '4px' }} /> Upload New Photo
                      </button>
                      {profile?.avatar_url && (
                        <>
                          <button
                            type="button"
                            onClick={handleOpenCurrentAvatarForAdjust}
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', height: '28px', padding: '0 10px', color: '#10b981' }}
                          >
                            <Sliders size={12} style={{ marginRight: '4px' }} /> Crop / Adjust
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteAvatar}
                            className="btn btn-ghost"
                            style={{ fontSize: '11px', height: '28px', padding: '0 10px', color: '#ef4444' }}
                          >
                            <Trash2 size={12} style={{ marginRight: '4px' }} /> Remove
                          </button>
                        </>
                      )}
                    </div>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarFileSelect} accept="image/*" style={{ display: 'none' }} />
                  </div>
                </div>

                {/* University Name & University Logo Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#e0e7ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="#818cf8" /> University Name & Campus
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPresetModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      ⚡ Pick From University Presets
                    </button>
                  </div>

                  <input
                    type="text"
                    name="university_name"
                    value={formData.university_name}
                    onChange={handleInputChange}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Stanford University, Chandigarh University, Delhi University..."
                  />

                  {/* University Logo Upload & URL Box */}
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        University Logo (Icon/Emblem)
                      </span>
                      {formData.university_logo && (
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, university_logo: '' }))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Clear Logo
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Logo Preview */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        {formData.university_logo && !logoLoadFailed ? (
                          <img
                            src={getMediaUrl(formData.university_logo)}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                            onError={() => setLogoLoadFailed(true)}
                          />
                        ) : (
                          <Building2 size={18} color="#6366f1" />
                        )}
                      </div>

                      {/* Upload button & Logo URL input */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', height: '30px', padding: '0 10px', whiteSpace: 'nowrap' }}
                          >
                            {isUploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} style={{ marginRight: '4px' }} />}
                            Upload Logo File
                          </button>
                          <input
                            type="text"
                            name="university_logo"
                            value={formData.university_logo}
                            onChange={(e) => {
                              handleInputChange(e);
                              setLogoLoadFailed(false);
                            }}
                            className="input"
                            style={{ flex: 1, height: '30px', fontSize: '11.5px' }}
                            placeholder="Or paste Logo Image URL (e.g. https://.../logo.png)"
                          />
                        </div>
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoFileSelect}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Name & UID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Full Name *
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
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      UID (University / Student Roll No)
                    </label>
                    <input
                      type="text"
                      name="university_id"
                      value={formData.university_id}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="e.g. 24BCSE10492"
                    />
                  </div>
                </div>

                {/* GitHub & LinkedIn URLs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                </div>
              </div>

              {/* SECTION 2: ACADEMIC ENROLLMENT (DOSSIER) */}
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GraduationCap size={18} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Academic Enrollment Details
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    🔒 Academic Dossier
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Degree Program
                    </label>
                    <input
                      type="text"
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="B.Tech Computer Science"
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
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Class Section / Batch
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="Section A / Batch 2024"
                    />
                  </div>
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
                      style={{ width: '100%', opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-tertiary)' }}
                    />
                    <ShieldCheck size={16} color="#10b981" style={{ position: 'absolute', right: '12px' }} />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PERSONAL & CONTACT DOSSIER (FORM ONLY) */}
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HeartPulse size={18} color="#ec4899" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Personal Contact & Emergency Information
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    🔒 Personal Information Page Only
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Primary Phone Number
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
                      Personal / Alternate Email
                    </label>
                    <input
                      type="email"
                      name="personal_email"
                      value={formData.personal_email}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="personal.email@gmail.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Blood Group
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%', height: '38px' }}
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Emergency Contact (Name & Phone)
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="e.g. Parent (+91 98765...)"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Hostel / Residential Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="Hostel Block B, Room 304 / City, State"
                  />
                </div>
              </div>

              {/* SECTION 4: DEVELOPER HANDLES & BIO */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Code size={18} color="#8b5cf6" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Developer Handles & Portfolio
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    🔒 Personal Information Page Only
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
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
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      <Code size={13} color="#f59e0b" /> LeetCode / Coding Profile
                    </label>
                    <input
                      type="text"
                      name="leetcode_url"
                      value={formData.leetcode_url}
                      onChange={handleInputChange}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="https://leetcode.com/u/username"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    <AtSign size={13} color="#38bdf8" /> Twitter / X Profile URL
                  </label>
                  <input
                    type="text"
                    name="twitter_url"
                    value={formData.twitter_url}
                    onChange={handleInputChange}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="https://x.com/username"
                  />
                </div>

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
              </div>

              {/* Submit Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 15px rgba(245, 78, 0, 0.3)',
                }}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSaving ? 'Saving to Database...' : 'Save Personal Information & Update Dashboard'}
              </button>
            </form>
          </div>

          {/* RIGHT: CERTIFICATES & DANGER ZONE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Certificates Dossier */}
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '550px' }}>
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
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Links to Verification & Document */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url.startsWith('http') ? cert.credential_url : `https://${cert.credential_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'var(--primary)',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            <ExternalLink size={11} /> Verify Online
                          </a>
                        )}
                        {cert.file_path && (
                          <a
                            href={getMediaUrl(cert.file_path)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                            }}
                          >
                            <FileText size={11} /> View Document ({cert.file_name || 'File'})
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Settings / Danger Zone */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
              }}
            >
              <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                Account Safety & Danger Zone
              </h4>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Permanently purge your account credentials, submissions, and uploaded certificates from database.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeletingAccount ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* UNIVERSITY PRESETS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPresetModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: '640px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    Select University Preset
                  </h3>
                </div>
                <button
                  onClick={() => setShowPresetModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Click any top university below to instantly set its official name and logo for your dashboard header:
              </p>

              <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {UNIVERSITY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#818cf8';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        padding: '2px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img
                        src={preset.logo}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CERTIFICATE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCertModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    Add Verified Certificate
                  </h3>
                </div>
                <button
                  onClick={() => setShowCertModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
