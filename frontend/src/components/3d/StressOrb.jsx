// =============================================================================
// ChronoSync — 3D Workload Stress Orb (StressOrb.jsx)
// =============================================================================
// Spatial WebGL telemetry visualization displaying real-time deadline density.
// Harmonic timeline palette: Mint (Low) → Blue (Moderate) → Gold (High) → Crimson (Critical)
// =============================================================================

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Stress Level Configuration (Cursor Color Spectrum) ---
const STRESS_CONFIG = {
  LOW: { color: '#1f8a65', distort: 0.18, speed: 0.8, particles: 80, emissive: '#0a3627' },
  MODERATE: { color: '#356ebd', distort: 0.3, speed: 1.4, particles: 200, emissive: '#11223b' },
  HIGH: { color: '#c08532', distort: 0.45, speed: 2.2, particles: 450, emissive: '#3d290d' },
  CRITICAL: { color: '#cf2d56', distort: 0.65, speed: 3.5, particles: 800, emissive: '#45101d' },
};

function Orb({ stressLevel = 'LOW', pendingCount = 0 }) {
  const meshRef = useRef();
  const config = STRESS_CONFIG[stressLevel] || STRESS_CONFIG.LOW;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * (config.speed * 0.3);
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * (config.speed * 0.3);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
      <Sphere ref={meshRef} args={[1.4, 64, 64]}>
        <MeshDistortMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.7}
          distort={config.distort}
          speed={config.speed}
          transparent
          opacity={0.92}
        />
      </Sphere>
    </Float>
  );
}

function ParticleField({ count = 200 }) {
  const particlesRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#807d72"
        size={0.025}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function OrbRing({ stressLevel }) {
  const ringRef = useRef();
  const config = STRESS_CONFIG[stressLevel] || STRESS_CONFIG.LOW;

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.25;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.1, 0.015, 16, 100]} />
      <meshStandardMaterial
        color={config.color}
        emissive={config.color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

export default function StressOrb({ stressLevel = 'LOW', pendingCount = 0 }) {
  const config = STRESS_CONFIG[stressLevel] || STRESS_CONFIG.LOW;

  return (
    <div className="three-canvas-container" style={{ background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <pointLight
          position={[-3, -3, -3]}
          intensity={0.4}
          color={config.color}
        />

        <Orb stressLevel={stressLevel} pendingCount={pendingCount} />
        <OrbRing stressLevel={stressLevel} />
        <ParticleField count={config.particles} />
      </Canvas>

      {/* Overlay Label */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 600,
          color: config.color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {stressLevel} LOAD STATE
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10.5px',
          color: 'var(--text-muted)',
          marginTop: '2px',
        }}>
          {pendingCount} active deliverables
        </div>
      </div>
    </div>
  );
}
