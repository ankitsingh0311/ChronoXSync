// =============================================================================
// ChronoSync — 3D Conflict Warning Modal (ConflictModal.jsx)
// =============================================================================
// Triggered on database constraint violations (trg_PreventExamClash):
// Clashes with exam schedule (<24h) or excessive load (>3 tasks in 48h).
// =============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { AlertOctagon, X, RotateCcw } from 'lucide-react';

// 3D Warning Crystal
function WarningCrystal() {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={1} color="#cf2d56" />
      <pointLight position={[-3, -3, -3]} intensity={0.7} color="#cf2d56" />
      <Float speed={3} rotationIntensity={1.2} floatIntensity={0.8}>
        <mesh>
          <octahedronGeometry args={[1.05, 0]} />
          <MeshDistortMaterial
            color="#cf2d56"
            emissive="#4a1c25"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
            distort={0.3}
            speed={2}
          />
        </mesh>
      </Float>
    </Canvas>
  );
}

export default function ConflictModal({ isOpen, errorDetails, onClose }) {
  if (!isOpen) return null;

  const isExamClash = errorDetails?.toLowerCase().includes('exam');

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(20, 19, 17, 0.75)',
        backdropFilter: 'blur(4px)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glass-card"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '24px 28px',
            border: '1px solid var(--semantic-error-border)',
            background: 'var(--bg-card)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          {/* 3D Warning Hologram Canvas */}
          <div style={{ height: '120px', width: '100%', marginBottom: '8px' }}>
            <WarningCrystal />
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--semantic-error-bg)',
              color: 'var(--semantic-error)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '8px',
              border: '1px solid var(--semantic-error-border)',
            }}>
              <AlertOctagon size={13} />
              <span>SQL TRIGGER EXCEPTION (trg_PreventExamClash)</span>
            </div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {isExamClash ? 'Examination Conflict Blocked' : 'Workload Density Limit Exceeded'}
            </h3>
          </div>

          {/* Body Message */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--semantic-error)',
            marginBottom: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            lineHeight: '1.5',
          }}>
            {errorDetails || 'CONFLICT: Deadline clashes with scheduled examination within 24 hours. Transaction rolled back.'}
          </div>

          {/* Academic Rubric Explanation Box */}
          <div style={{
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            marginBottom: '18px',
            background: 'var(--bg-tertiary)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            lineHeight: '1.45',
          }}>
            <strong>Academic Schedule Protection:</strong> Deliverable creation was halted because an examination is scheduled within 24 hours for this course. Please pick a non-conflicting due date.
          </div>

          {/* Action button */}
          <div style={{ display: 'flex' }}>
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', height: '38px', justifyContent: 'center' }}
            >
              <RotateCcw size={15} />
              <span>Acknowledge & Reschedule</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
