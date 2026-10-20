// =============================================================================
// ChronoSync 3D — Holographic AI Neural Core (AINeuralCore3D.jsx)
// =============================================================================
// Luxury 3D interactive WebGL neural orb representing the live AI bot state:
// - States: 'idle' (sapphire aura), 'thinking' (amber/violet synaptic burst),
//           'speaking' (harmonic wave vibration), 'streaming' (kinetic flux).
// - Multi-axis gyroscopic gimbal rings + iridescent wireframe icosahedron
// - Orbiting particle aura + reactive light sheen
// - Automatic resilient fallback to high-end 2D Canvas if WebGL is unavailable
// =============================================================================

import React, { useRef, useMemo, useState, useEffect, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// ─── Luxury State Color Matrix ────────────────────────────────────────────────
const STATE_THEMES = {
  idle: {
    coreColor: '#38bdf8',
    emissive: '#0284c7',
    ringColor: '#60a5fa',
    accentColor: '#818cf8',
    speed: 0.9,
    distort: 0.2,
    intensity: 1.8,
  },
  thinking: {
    coreColor: '#f59e0b',
    emissive: '#d97706',
    ringColor: '#fbbf24',
    accentColor: '#ec4899',
    speed: 2.8,
    distort: 0.6,
    intensity: 3.2,
  },
  speaking: {
    coreColor: '#10b981',
    emissive: '#059669',
    ringColor: '#34d399',
    accentColor: '#38bdf8',
    speed: 1.8,
    distort: 0.4,
    intensity: 2.4,
  },
  streaming: {
    coreColor: '#a855f7',
    emissive: '#7c3aed',
    ringColor: '#c084fc',
    accentColor: '#f43f5e',
    speed: 2.2,
    distort: 0.5,
    intensity: 2.8,
  },
};

// ─── Error Boundary for 100% Robustness ───────────────────────────────────────
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('3D Canvas encountered issue, falling back to 2D Canvas:', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── 3D Inner Synaptic Core ───────────────────────────────────────────────────
function SynapticCore({ state = 'idle' }) {
  const meshRef = useRef();
  const wireRef = useRef();
  const theme = STATE_THEMES[state] || STATE_THEMES.idle;

  useFrame((clockState, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4 * theme.speed;
      meshRef.current.rotation.y += delta * 0.6 * theme.speed;
      const s = 1 + Math.sin(clockState.clock.elapsedTime * theme.speed * 2) * 0.08;
      meshRef.current.scale.set(s, s, s);
    }
    if (wireRef.current) {
      wireRef.current.rotation.x -= delta * 0.5 * theme.speed;
      wireRef.current.rotation.z += delta * 0.3 * theme.speed;
    }
  });

  return (
    <group>
      {/* Central Solid Glowing Faceted Core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color={theme.coreColor}
          emissive={theme.emissive}
          emissiveIntensity={theme.intensity}
          roughness={0.15}
          metalness={0.85}
          wireframe={false}
        />
      </mesh>

      {/* Outer Holographic Wireframe Lattice */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.18, 1]} />
        <meshBasicMaterial
          color={theme.accentColor}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}

// ─── 3D Gyroscopic Rings ─────────────────────────────────────────────────────
function GyroRings({ state = 'idle' }) {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();
  const theme = STATE_THEMES[state] || STATE_THEMES.idle;

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.8 * theme.speed;
    if (ring2.current) ring2.current.rotation.x += delta * 0.6 * theme.speed;
    if (ring3.current) {
      ring3.current.rotation.y += delta * 0.7 * theme.speed;
      ring3.current.rotation.x += delta * 0.3 * theme.speed;
    }
  });

  return (
    <group>
      {/* Ring 1 - Equator */}
      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.022, 16, 100]} />
        <meshStandardMaterial
          color={theme.ringColor}
          emissive={theme.ringColor}
          emissiveIntensity={theme.intensity * 0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Ring 2 - Polar 45 deg */}
      <mesh ref={ring2} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.72, 0.018, 16, 100]} />
        <meshStandardMaterial
          color={theme.accentColor}
          emissive={theme.accentColor}
          emissiveIntensity={theme.intensity * 0.6}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Ring 3 - Outer Orbital */}
      <mesh ref={ring3} rotation={[-Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.95, 0.012, 16, 100]} />
        <meshBasicMaterial
          color={theme.coreColor}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── Orbiting Particle Swarm ─────────────────────────────────────────────────
function ParticleHalo({ count = 90, state = 'idle' }) {
  const particlesRef = useRef();
  const theme = STATE_THEMES[state] || STATE_THEMES.idle;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorA = new THREE.Color(theme.coreColor);
    const colorB = new THREE.Color(theme.accentColor);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.0 + Math.random() * 1.5;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixed = colorA.clone().lerp(colorB, Math.random());
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [count, theme.coreColor, theme.accentColor]);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.15 * theme.speed;
      particlesRef.current.rotation.x += delta * 0.08 * theme.speed;
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
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Resilient 2D HTML5 Canvas Fallback (if WebGL crashes or on weak GPUs) ────
function LuxuryCanvas2DFallback({ state = 'idle', size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const t = STATE_THEMES[state] || STATE_THEMES.idle;

      angle += 0.02 * t.speed;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 75);
      grad.addColorStop(0, t.coreColor);
      grad.addColorStop(0.5, t.emissive);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.fill();

      // Gyro Ellipses
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.strokeStyle = t.ringColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 55, 20, angle, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = t.accentColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 22, -angle * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      // Core Orb
      ctx.globalAlpha = 0.95;
      const coreGrad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 26);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, t.coreColor);
      coreGrad.addColorStop(1, t.emissive);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 26 + Math.sin(angle * 3) * 2, 0, Math.PI * 2);
      ctx.fill();

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [state]);

  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// ─── Main Exported Component ──────────────────────────────────────────────────
export default function AINeuralCore3D({
  state = 'idle',      // 'idle' | 'thinking' | 'speaking' | 'streaming'
  size = 220,
  interactive = true,
  className = '',
}) {
  const [hasWebGL, setHasWebGL] = useState(true);

  // Catch WebGL context creation failure gracefully
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <LuxuryCanvas2DFallback state={state} size={size} />;
  }

  return (
    <CanvasErrorBoundary fallback={<LuxuryCanvas2DFallback state={state} size={size} />}>
      <div
        className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Canvas
          camera={{ position: [0, 0, 4.8], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%', pointerEvents: interactive ? 'auto' : 'none' }}
          onError={() => setHasWebGL(false)}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#38bdf8" />

          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <SynapticCore state={state} />
            <GyroRings state={state} />
            <ParticleHalo count={90} state={state} />
          </Float>
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
