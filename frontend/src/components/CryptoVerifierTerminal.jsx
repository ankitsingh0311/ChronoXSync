// =============================================================================
// ChronoSync 3D — Cryptographic Receipt Verifier Terminal (CryptoVerifierTerminal.jsx)
// =============================================================================
// Anti-Tamper Verification Engine for Faculty & HOD God-Mode Dashboards
// Features:
//   - Interactive 64-character hexadecimal SHA-256 Receipt Input
//   - "Test Tampered Hash" button demonstrating Avalanche Effect live during Viva
//   - Live Server Re-computation against SERVER_CRYPTO_SALT
//   - Sleek Cyber-Verification Result Cards (Emerald Valid vs Crimson Alert)
//   - 1-Click Recent Submissions Quick Loader for Viva Examination
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Search,
  RefreshCw, Copy, Check, ExternalLink, Download, FileText, User,
  Award, Clock, Calendar, Hash, Zap, Sparkles, Terminal, Info
} from 'lucide-react';
import { cryptoAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function CryptoVerifierTerminal({ embedded = true }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [receiptHash, setReceiptHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tamperedDemoActive, setTamperedDemoActive] = useState(false);

  const handleVerify = async (hashToVerify = receiptHash) => {
    const cleanHash = (hashToVerify || '').trim();
    if (!cleanHash) {
      setErrorMsg('Please enter a 64-character hexadecimal SHA-256 receipt hash.');
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);
      const res = await cryptoAPI.verifyReceipt(cleanHash);
      setResult(res.data);
      setTamperedDemoActive(false);
    } catch (err) {
      console.error('Receipt verification failed:', err);
      const data = err.response?.data;
      setResult({
        verified: false,
        tamper_detected: true,
        error: data?.error || 'CRYPTOGRAPHIC VERIFICATION FAILED',
        message: data?.message || data?.detail || 'Hash does not match server cryptographic vault! The submission signature is mathematically invalid or manipulated.',
        receipt_hash: cleanHash,
      });
    } finally {
      setLoading(false);
    }
  };

  // Modify 1 character to demonstrate the SHA-256 Avalanche Effect live during Viva
  const handleTestTamperedHash = () => {
    if (!receiptHash || receiptHash.length !== 64) {
      // Use standard sample hash and flip the last character
      const sample = 'daf748f2ba9db2af26acb01d324deba812013c6c1c9dc3b05e119e6673a1a705';
      const tamperedArr = sample.split('');
      tamperedArr[tamperedArr.length - 1] = tamperedArr[tamperedArr.length - 1] === '0' ? '1' : '0';
      const newTampered = tamperedArr.join('');
      setReceiptHash(newTampered);
      setTamperedDemoActive(true);
      handleVerify(newTampered);
      return;
    }

    const arr = receiptHash.split('');
    const idx = 15; // flip character at index 15
    arr[idx] = arr[idx] === 'a' ? 'b' : (arr[idx] === '0' ? '1' : 'a');
    const tampered = arr.join('');
    setReceiptHash(tampered);
    setTamperedDemoActive(true);
    handleVerify(tampered);
  };

  const handleCopyHash = () => {
    if (!receiptHash) return;
    navigator.clipboard.writeText(receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(22, 27, 34, 0.95) 100%)'
          : '#ffffff',
        border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #cbd5e1',
        borderRadius: embedded ? '18px' : '24px',
        padding: embedded ? '24px' : '32px',
        boxShadow: isDark
          ? '0 15px 45px rgba(0, 0, 0, 0.5), 0 0 25px rgba(16, 185, 129, 0.1)'
          : '0 4px 20px rgba(0, 0, 0, 0.06)',
        color: isDark ? '#f0f6fc' : '#0f172a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Cyber Circuit Glow Accent */}
      {isDark && (
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        paddingBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))'
              : '#ecfdf5',
            border: '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            boxShadow: '0 0 14px rgba(16, 185, 129, 0.25)',
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: 0,
                color: isDark ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.01em',
              }}>
                SHA-256 Submission Verifier (Anti-Tamper Utility)
              </h3>
              <span style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                color: isDark ? '#34d399' : '#059669',
                fontWeight: 700,
                border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #a7f3d0',
              }}>
                NON-REPUDIATION ENGINE
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: isDark ? '#8b949e' : '#475569', margin: '3px 0 0' }}>
              Validates student digital receipts live against server cryptographic vault to prevent Inspect Element &amp; falsified screenshot fraud.
            </p>
          </div>
        </div>
      </div>

      {/* Hash Input Bar + Action Controls */}
      <div style={{
        background: isDark ? '#090d16' : '#f8fafc',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        boxShadow: isDark ? 'inset 0 2px 8px rgba(0, 0, 0, 0.6)' : 'none',
      }}>
        <Terminal size={18} color="#10b981" style={{ flexShrink: 0 }} />

        <input
          type="text"
          value={receiptHash}
          onChange={(e) => {
            setReceiptHash(e.target.value);
            setTamperedDemoActive(false);
          }}
          placeholder="Enter 64-character SHA-256 receipt hash provided by student..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: isDark ? '#ffffff' : '#0f172a',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12.5px',
            letterSpacing: '0.04em',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify();
          }}
        />

        {receiptHash && (
          <button
            onClick={handleCopyHash}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#10b981' : (isDark ? '#8b949e' : '#64748b'),
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Copy Hash"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={loading || !receiptHash.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              Computing Hash...
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              Verify Receipt
            </>
          )}
        </button>

        {/* Viva Live Demonstration Button: Avalanche Effect */}
        <button
          onClick={handleTestTamperedHash}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          title="Modifies 1 character of the hash to trigger the Avalanche Effect and prove cryptographic rejection live!"
        >
          <Zap size={13} />
          Test Tampered Hash (Viva Demo)
        </button>
      </div>

      {/* Validation / Format Notice */}
      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
          border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecdd3',
          color: isDark ? '#fca5a5' : '#b91c1c',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}>
          <AlertTriangle size={15} flexShrink={0} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Awaiting Verification Empty State */}
      {!result && !errorMsg && (
        <div style={{
          padding: '24px 20px',
          textAlign: 'center',
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
          border: isDark ? '1px dashed rgba(255, 255, 255, 0.12)' : '1px dashed #cbd5e1',
          borderRadius: '12px',
          color: isDark ? '#8b949e' : '#475569',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ShieldCheck size={28} color="#10b981" style={{ opacity: 0.9 }} />
          <div>
            <div style={{ color: isDark ? '#c9d1d9' : '#0f172a', fontSize: '13.5px', fontWeight: 600 }}>
              Awaiting Student Receipt Hash
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: isDark ? '#8b949e' : '#475569', maxWidth: '520px', lineHeight: 1.45 }}>
              Ask the student for the 64-character SHA-256 hash generated upon their coursework submission.
              Paste the hash above and click <strong>Verify Receipt</strong> to authenticate non-repudiation, millisecond server timestamps, and view their submitted PDF.
            </p>
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              borderRadius: '14px',
              padding: '22px',
              background: result.verified
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.06) 100%)',
              border: result.verified
                ? '1.5px solid #10b981'
                : '1.5px solid #ef4444',
              boxShadow: result.verified
                ? '0 0 35px rgba(16, 185, 129, 0.2)'
                : '0 0 35px rgba(239, 68, 68, 0.25)',
            }}
          >
            {/* Status Header Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
              borderBottom: result.verified
                ? '1px solid rgba(16, 185, 129, 0.25)'
                : '1px solid rgba(239, 68, 68, 0.25)',
              paddingBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: result.verified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: result.verified ? '#10b981' : '#ef4444',
                }}>
                  {result.verified ? <CheckCircle2 size={22} /> : <ShieldAlert size={22} />}
                </div>

                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: result.verified ? '#34d399' : '#f87171',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {result.verified
                      ? 'NON-REPUDIATION CONFIRMED — 100% AUTHENTIC SUBMISSION'
                      : 'SECURITY BREACH / FORGED RECEIPT DETECTED'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '2px' }}>
                    {result.verified
                      ? 'Cryptographic integrity verified via canonical SHA-256 live re-computation.'
                      : 'Hash does not match server cryptographic vault! The signature is mathematically invalid or manipulated.'}
                  </div>
                </div>
              </div>

              {result.verified && (
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                }}>
                  VERIFIED {result.verification_count} TIME(S)
                </div>
              )}
            </div>

            {/* If Valid Result: Display Full Verified Metadata */}
            {result.verified ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  {/* Student Details */}
                  <div style={{
                    background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginBottom: '6px' }}>
                      STUDENT IDENTIFICATION
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {result.student_name}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#8b949e' : '#475569', fontFamily: 'var(--font-mono, monospace)' }}>
                      {result.student_email}
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#6e7681' : '#64748b', marginTop: '4px' }}>
                      {result.department} · {result.program} · {result.semester}
                    </div>
                  </div>

                  {/* Coursework & Verdict */}
                  <div style={{
                    background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ fontSize: '11px', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700, marginBottom: '6px' }}>
                      DELIVERABLE VERDICT
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {result.assignment_title}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#38bdf8' : '#0369a1', fontWeight: 600 }}>
                      {result.course_code} · {result.course_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: result.status === 'Completed' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'),
                        border: result.status === 'Completed' ? '1px solid #10b981' : '1px solid #ef4444',
                        color: result.status === 'Completed' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#f87171' : '#b91c1c'),
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}>
                        {result.on_time_verdict || (result.status === 'Completed' ? 'ON-TIME' : 'LATE')}
                      </span>
                      <span style={{ fontSize: '11px', color: isDark ? '#8b949e' : '#64748b' }}>
                        Due: {result.official_due_date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Server Timestamp & PDF Link */}
                <div style={{
                  background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                  borderRadius: '10px',
                  padding: '12px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: isDark ? '#f59e0b' : '#d97706', fontWeight: 700, letterSpacing: '0.04em' }}>
                      EXACT SERVER TIMESTAMP (UTC/IST MILLISECONDS)
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: isDark ? '#ffffff' : '#0f172a',
                      marginTop: '2px',
                    }}>
                      {result.server_timestamp_ms}
                    </div>
                  </div>

                  {result.file_path && (
                    <a
                      href={result.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        background: isDark ? 'rgba(56, 189, 248, 0.15)' : '#eff6ff',
                        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.4)' : '#bfdbfe'}`,
                        color: isDark ? '#38bdf8' : '#1d4ed8',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={13} />
                      <span>Download Submitted PDF Work</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Tampered Alert Details */
              <div>
                <div style={{
                  background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#fef2f2',
                  borderRadius: '10px',
                  padding: '14px',
                  border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5'}`,
                }}>
                  <div style={{
                    fontSize: '12.5px',
                    color: isDark ? '#fca5a5' : '#991b1b',
                    lineHeight: '1.5',
                    marginBottom: '10px',
                  }}>
                    {result.message}
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecdd3'}`,
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: isDark ? '#fca5a5' : '#b91c1c',
                  }}>
                    <strong>Avalanche Effect Forensic Diagnostic:</strong> A change of even 1 single character or timestamp millisecond completely alters the 256-bit hash. The submitted token does not match the canonical tuple:
                    <div style={{ color: isDark ? '#8b949e' : '#64748b', marginTop: '4px' }}>
                      student_id | student_email | deadline_id | server_timestamp_ms | status | SERVER_VAULT_SECRET
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
