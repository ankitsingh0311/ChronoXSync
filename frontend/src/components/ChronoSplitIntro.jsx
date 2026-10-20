// =============================================================================
// ChronoSync — Ultra-Luxury Split-Slide Kinetic Live Intro
// Component: ChronoSplitIntro.jsx
// =============================================================================
// Choreography:
// 1. Left Half-Slide glides from left with "CHRONO" in liquid gold typography.
// 2. Right Half-Slide glides from right with "SYNC" in liquid gold typography.
// 3. Both halves impact & fuse seamlessly at center with an anamorphic gold flash.
// 4. Seam fuses into unified "CHRONOSYNC" with institutional tagline.
// 5. Interactive 3D mouse parallax tilt & click pulse shockwave.
// 6. Smooth luxury dissolve directly into the Login Portal.
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ChronoSplitIntro({ onComplete }) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'colliding' | 'fused' | 'exiting'
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Parallax tracking
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
    const y = (clientY / innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sequence Timeline (~3.2s total)
  useEffect(() => {
    // Phase 1: Entering (0ms - 1000ms)
    const collideTimer = setTimeout(() => {
      setPhase('colliding');
    }, 1000);

    // Phase 2: Fused & Unified (1000ms - 2800ms)
    const fusedTimer = setTimeout(() => {
      setPhase('fused');
    }, 1250);

    // Phase 3: Transition to Login (2800ms)
    const exitTimer = setTimeout(() => {
      handleComplete();
    }, 3100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(collideTimer);
      clearTimeout(fusedTimer);
      clearTimeout(exitTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  };

  const isFused = phase === 'fused' || phase === 'colliding';

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="chrono-split-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#020409] select-none text-slate-100"
          style={{
            perspective: '1200px',
            fontFamily: "'Cinzel', 'Outfit', serif",
          }}
          onClick={handleComplete}
        >
          {/* Deep Ambient Luxury Gold Grid & Nebula Underglow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.14) 0%, transparent 65%),
                linear-gradient(rgba(245, 158, 11, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 64px 64px, 64px 64px',
            }}
          />

          {/* Floating Luxury Gold Dust Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 36 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0.2 + Math.random() * 0.6,
                  scale: 0.6 + Math.random() * 0.8,
                }}
                animate={{
                  y: [null, Math.random() * -120 - 40],
                  opacity: [null, 0.8, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: Math.random() * 2,
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_#fbbf24]"
              />
            ))}
          </div>

          {/* Top Skip / Dismiss Control */}
          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              type="button"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:border-amber-400 text-xs font-mono tracking-widest uppercase backdrop-blur-md transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <span>SKIP</span>
              <span className="text-[10px] text-slate-500">[ESC]</span>
            </button>
          </div>

          {/* Interactive 3D Parallax Master Stage */}
          <motion.div
            style={{
              rotateY: mousePos.x * 6,
              rotateX: -mousePos.y * 6,
              transformStyle: 'preserve-3d',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="relative flex items-center justify-center w-full max-w-6xl px-4 py-12"
          >
            {/* Anamorphic Impact Flash Line (Fires when the two halves collide) */}
            <AnimatePresence>
              {phase === 'colliding' && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1.8, 0.4], opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute z-40 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-300 via-white to-transparent shadow-[0_0_40px_#fbbf24,0_0_80px_#f59e0b] pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Central Fusion Glow Burst */}
            {isFused && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.4, 1], opacity: [0, 0.9, 0.4] }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute z-10 w-[520px] h-[520px] rounded-full bg-radial from-amber-500/25 via-cyan-500/10 to-transparent blur-3xl pointer-events-none"
              />
            )}

            {/* ─────────────────────────────────────────────────────────────────
                LEFT HALF-SLIDE: "CHRONO"
                Glides from left screen edge (-100vw) to center (0)
               ───────────────────────────────────────────────────────────────── */}
            <motion.div
              initial={{ x: '-100vw', opacity: 0 }}
              animate={{
                x: isFused ? 0 : '-3%',
                opacity: 1,
              }}
              transition={{
                duration: 1.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-center justify-end flex-1 h-36 sm:h-48 md:h-56 overflow-hidden select-none"
              style={{
                background: 'linear-gradient(90deg, rgba(15,23,42,0.1) 0%, rgba(20,29,48,0.75) 80%, rgba(30,41,66,0.92) 100%)',
                borderTop: '1px solid rgba(245, 158, 11, 0.35)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
                borderLeft: '1px solid rgba(245, 158, 11, 0.2)',
                borderRight: isFused ? 'none' : '2px solid rgba(245, 158, 11, 0.9)',
                borderTopLeftRadius: '24px',
                borderBottomLeftRadius: '24px',
                boxShadow: isFused
                  ? 'inset 0 1px 1px rgba(255,255,255,0.2), -15px 0 45px rgba(0,0,0,0.6)'
                  : '-20px 0 60px rgba(245, 158, 11, 0.25)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Luxury Beveled Tick Marks & Gear Teeth on Left Plate */}
              <div className="absolute top-3 left-6 flex items-center gap-1.5 opacity-60">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase">
                  TEMPORAL_CHRONO
                </span>
              </div>

              {/* Laser Edge Guide (Gleams as it approaches) */}
              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-300 to-transparent opacity-80" />

              {/* The Word: CHRONO */}
              <div className="pr-1 sm:pr-2 md:pr-3 flex items-center">
                <h2
                  className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-[0.08em] sm:tracking-[0.14em]"
                  style={{
                    fontFamily: "'Cinzel', 'Cinzel Decorative', 'Outfit', serif",
                    background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 30%, #f59e0b 60%, #b45309 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 24px rgba(245, 158, 11, 0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                  }}
                >
                  CHRONO
                </h2>
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────────────────────────────
                SEAM JOINT MAGNET / HARMONIC CORE EMITTER
               ───────────────────────────────────────────────────────────────── */}
            <motion.div
              animate={{
                scale: isFused ? [1, 1.25, 1] : 0,
                opacity: isFused ? 1 : 0,
              }}
              transition={{ duration: 0.6 }}
              className="relative z-30 flex items-center justify-center w-0 flex-shrink-0"
            >
              <div className="w-1.5 h-28 sm:h-36 md:h-44 bg-gradient-to-b from-amber-300 via-white to-cyan-300 shadow-[0_0_25px_#fbbf24] rounded-full" />
            </motion.div>

            {/* ─────────────────────────────────────────────────────────────────
                RIGHT HALF-SLIDE: "SYNC"
                Glides from right screen edge (+100vw) to center (0)
               ───────────────────────────────────────────────────────────────── */}
            <motion.div
              initial={{ x: '100vw', opacity: 0 }}
              animate={{
                x: isFused ? 0 : '3%',
                opacity: 1,
              }}
              transition={{
                duration: 1.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-center justify-start flex-1 h-36 sm:h-48 md:h-56 overflow-hidden select-none"
              style={{
                background: 'linear-gradient(270deg, rgba(15,23,42,0.1) 0%, rgba(20,29,48,0.75) 80%, rgba(30,41,66,0.92) 100%)',
                borderTop: '1px solid rgba(245, 158, 11, 0.35)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
                borderRight: '1px solid rgba(245, 158, 11, 0.2)',
                borderLeft: isFused ? 'none' : '2px solid rgba(6, 182, 212, 0.9)',
                borderTopRightRadius: '24px',
                borderBottomRightRadius: '24px',
                boxShadow: isFused
                  ? 'inset 0 1px 1px rgba(255,255,255,0.2), 15px 0 45px rgba(0,0,0,0.6)'
                  : '20px 0 60px rgba(6, 182, 212, 0.25)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Laser Edge Guide (Gleams as it approaches) */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-300 to-transparent opacity-80" />

              {/* Luxury Status Telemetry on Right Plate */}
              <div className="absolute top-3 right-6 flex items-center gap-1.5 opacity-60">
                <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
                  ROLE_SYNC
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              </div>

              {/* The Word: SYNC */}
              <div className="pl-1 sm:pl-2 md:pl-3 flex items-center">
                <h2
                  className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-[0.08em] sm:tracking-[0.14em]"
                  style={{
                    fontFamily: "'Cinzel', 'Cinzel Decorative', 'Outfit', serif",
                    background: 'linear-gradient(135deg, #fef08a 0%, #fbbf24 35%, #06b6d4 70%, #0284c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 24px rgba(6, 182, 212, 0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                  }}
                >
                  SYNC
                </h2>
              </div>
            </motion.div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              BOTTOM LUXURY SUBTITLE & BRAND BADGE (Reveals on Fusion)
             ───────────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: isFused ? 1 : 0,
              y: isFused ? 0 : 24,
            }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="absolute bottom-10 z-40 flex flex-col items-center text-center px-4"
          >
            {/* Tagline Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-ping" />
              <p className="text-[11px] sm:text-xs font-mono tracking-[0.24em] text-amber-200 uppercase font-semibold">
                INSTITUTIONAL ACADEMIC TIME &amp; WORKLOAD SYNCHRONIZATION
              </p>
            </div>

            {/* Micro Interaction Hint */}
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer hover:text-amber-300 transition-colors">
              <span>ENTERING AUTHENTICATION PORTAL</span>
              <ArrowRight className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
