// =============================================================================
// ChronoSync — 3D Pomodoro Focus Timer (FocusTimer.jsx)
// =============================================================================
// Interactive 3D Pomodoro focus timer with Three.js toroidal ring,
// 25-minute focus / 5-minute recovery intervals, and session tracking.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

// --- Timer Ring 3D Component ---
function TimerRing({ progress = 1, isRunning, isBreak }) {
  const ringRef = useRef();
  // Precision Cobalt (#2563eb) for focus, Emerald (#059669) for break
  const color = isBreak ? '#059669' : '#2563eb';

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = -Math.PI / 2;
      if (isRunning) {
        ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.05;
        ringRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.7) * 0.05;
      }
    }
  });

  const theta = progress * Math.PI * 2;

  return (
    <group ref={ringRef}>
      {/* Background ring */}
      <mesh>
        <torusGeometry args={[2, 0.06, 16, 100]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Progress ring */}
      <mesh>
        <torusGeometry args={[2, 0.09, 16, 100, theta]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isRunning ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <torusGeometry args={[2, 0.12, 16, 100, theta]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

function PulsingCore({ isRunning, isBreak }) {
  const coreRef = useRef();
  const color = isBreak ? '#059669' : '#2563eb';

  useFrame((state) => {
    if (coreRef.current) {
      const scale = isRunning
        ? 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04
        : 1;
      coreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[0.26, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isRunning ? 0.6 : 0.25}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalDuration] = useState(25 * 60);
  const intervalRef = useRef(null);

  const progress = timeLeft / (isBreak ? 5 * 60 : totalDuration);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const playChime = useCallback((freq = 880, duration = 0.5) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playChime(isBreak ? 587.33 : 880, 0.8);
      if (!isBreak) {
        setSessions(prev => prev + 1);
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, isBreak, playChime]);

  const toggleTimer = () => setIsRunning(prev => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: isBreak ? 'var(--semantic-success)' : 'var(--primary)' }} />
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 500,
          }}>
            Neuro-Ergonomic Timer
          </h3>
        </div>
        <span className="badge" style={{
          background: isBreak ? 'var(--semantic-success-bg)' : 'var(--primary-subtle)',
          color: isBreak ? 'var(--semantic-success)' : 'var(--primary)',
          border: `1px solid ${isBreak ? 'var(--semantic-success-border)' : 'rgba(245, 78, 0, 0.25)'}`,
        }}>
          {isBreak ? 'BREAK INTERVAL' : 'DEEP FOCUS'}
        </span>
      </div>

      {/* 3D Timer Canvas */}
      <div style={{ height: '210px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <Float speed={0.5} floatIntensity={0.2}>
            <TimerRing progress={progress} isRunning={isRunning} isBreak={isBreak} />
            <PulsingCore isRunning={isRunning} isBreak={isBreak} />
          </Float>
        </Canvas>
      </div>

      {/* Timer Display */}
      <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
        <div className="mono" style={{
          fontSize: '2.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: isBreak ? 'var(--semantic-success)' : 'var(--primary)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {formatTime(timeLeft)}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Interval #{sessions + 1} · {isBreak ? 'Cognitive Recovery' : 'Sprint Focus'}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          className="btn btn-primary"
          onClick={toggleTimer}
          style={{ minWidth: '110px' }}
        >
          {isRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {timeLeft < (isBreak ? 300 : 1500) ? 'Resume' : 'Start'}</>}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>

      {/* Session Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11.5px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '12px',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={13} style={{ color: 'var(--semantic-success)' }} />
          <span>{sessions} cycles completed</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={13} style={{ color: 'var(--primary)' }} />
          <span>{Math.round(sessions * 25)} min focused</span>
        </span>
      </div>
    </div>
  );
}
