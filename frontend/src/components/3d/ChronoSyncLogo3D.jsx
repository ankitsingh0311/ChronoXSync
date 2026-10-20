// =============================================================================
// ChronoSync 3D — Cyberpunk Holographic 3D Live Logo & Cinematic Splash
// Component: ChronoSyncLogo3D.jsx
// =============================================================================
// Features:
// 1. Procedural 3D Holographic Chrono-Gyroscope with 4 Interlocking Rings.
// 2. Rain-Slicked Wet Metallic Reflector Ground with Cyber Cyan & Magenta Puddles.
// 3. Falling Neon Data Rain Streaks & Volumetric Atmospheric Fog.
// 4. Holographic Projector Emitter Base with Concentric HUD Telemetry Rings.
// 5. Dynamic Sweeping Cinematic Camera Pan with Mouse Parallax Lerp.
// 6. Kinetic Neon Typography with Real-Time Chromatic Aberration & Glitch-Art Effects.
// 7. Full Zero-Asset Reliability & Built-in Pure CSS-3D Fallback.
// =============================================================================

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Shield, Sparkles, Terminal } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Cyberpunk Color Palette
// ─────────────────────────────────────────────────────────────────────────────
const CYBER_COLORS = {
  voidBlack: 0x030509,
  cyberCyan: 0x06b6d4,
  neonMagenta: 0xec4899,
  electricGold: 0xf59e0b,
  liquidGold: 0xfbbf24,
  hologramBlue: 0x38bdf8,
  wetAsphalt: 0x0a0f1d,
  starlight: 0xffffff,
};

// ─────────────────────────────────────────────────────────────────────────────
// Three.js Cyberpunk Holographic Engine
// ─────────────────────────────────────────────────────────────────────────────
function CyberGyroCanvas({
  mode = 'splash',
  isHovered,
  isSyncLocked,
  pulseTrigger,
  onCoreClick,
}) {
  const mountRef = useRef(null);
  const isCompact = mode === 'compact';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId;
    const width = container.clientWidth || (isCompact ? 220 : window.innerWidth);
    const height = container.clientHeight || (isCompact ? 220 : window.innerHeight);

    // 1. Scene, Volumetric Atmospheric Fog & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(CYBER_COLORS.voidBlack, isCompact ? 0.04 : 0.055);

    const camera = new THREE.PerspectiveCamera(
      isCompact ? 38 : 45,
      width / height,
      0.1,
      100
    );
    camera.position.set(0, isCompact ? 0.3 : 0.8, isCompact ? 5.2 : 6.5);

    // 2. High-Performance WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init failed:', e);
      return;
    }

    // Disposal tracking arrays
    const geosToDispose = [];
    const matsToDispose = [];
    const regG = (g) => { geosToDispose.push(g); return g; };
    const regM = (m) => { matsToDispose.push(m); return m; };

    // 3. Cyberpunk Neon Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Cyan Neon Key Light
    const cyanLight = new THREE.PointLight(CYBER_COLORS.cyberCyan, 14, 30);
    cyanLight.position.set(4.5, 4.0, 5.0);
    scene.add(cyanLight);

    // Magenta Neon Rim Light
    const magentaLight = new THREE.PointLight(CYBER_COLORS.neonMagenta, 12, 28);
    magentaLight.position.set(-4.5, -3.0, 4.5);
    scene.add(magentaLight);

    // Core Singularity Gold Light
    const coreLight = new THREE.PointLight(CYBER_COLORS.liquidGold, 12, 16);
    coreLight.position.set(0, 0.4, 1.2);
    scene.add(coreLight);

    // 4. Ground Reflector Plane (Rain-Slicked Wet Metallic Surface)
    const groundGeo = regG(new THREE.PlaneGeometry(32, 32));
    const groundMat = regM(new THREE.MeshStandardMaterial({
      color: CYBER_COLORS.wetAsphalt,
      roughness: 0.1,
      metalness: 0.94,
      emissive: 0x02040a,
    }));
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = isCompact ? -1.8 : -2.3;
    scene.add(groundMesh);

    // Ground Wet Grid Lines (Cyber Matrix)
    const gridHelper = new THREE.GridHelper(30, 40, CYBER_COLORS.cyberCyan, CYBER_COLORS.neonMagenta);
    gridHelper.position.y = isCompact ? -1.79 : -2.29;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 5. Hologram Projector Emitter Base
    const emitterGroup = new THREE.Group();
    emitterGroup.position.y = isCompact ? -1.75 : -2.25;

    const baseTorusGeo = regG(new THREE.TorusGeometry(1.6, 0.04, 16, 64));
    const baseTorusMat = regM(new THREE.MeshBasicMaterial({ color: CYBER_COLORS.cyberCyan, wireframe: true }));
    const baseTorus = new THREE.Mesh(baseTorusGeo, baseTorusMat);
    baseTorus.rotation.x = Math.PI / 2;
    emitterGroup.add(baseTorus);

    const baseDiscGeo = regG(new THREE.CircleGeometry(1.5, 48));
    const baseDiscMat = regM(new THREE.MeshBasicMaterial({
      color: CYBER_COLORS.cyberCyan,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    }));
    const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
    baseDisc.rotation.x = Math.PI / 2;
    emitterGroup.add(baseDisc);

    scene.add(emitterGroup);

    // 6. Master Holographic Chrono-Gyroscope
    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(0, 0.2, 0);
    scene.add(gyroGroup);

    if (isCompact) {
      gyroGroup.scale.set(0.75, 0.75, 0.75);
    }

    // --- Ring 1: Outer Heavy Titanium Chrono-Bezel (HOD) ---
    const ring1Geo = regG(new THREE.TorusGeometry(2.35, 0.065, 24, 100));
    const ring1Mat = regM(new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: CYBER_COLORS.cyberCyan,
      emissiveIntensity: 0.45,
      metalness: 0.95,
      roughness: 0.15,
    }));
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    gyroGroup.add(ring1);

    // 36 Cog / Precision Hour Teeth
    const teethGroup = new THREE.Group();
    const toothGeo = regG(new THREE.BoxGeometry(0.04, 0.16, 0.06));
    const toothMat = regM(new THREE.MeshBasicMaterial({ color: CYBER_COLORS.liquidGold }));
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const t = new THREE.Mesh(toothGeo, toothMat);
      t.position.x = Math.cos(a) * 2.4;
      t.position.y = Math.sin(a) * 2.4;
      t.rotation.z = a;
      teethGroup.add(t);
    }
    gyroGroup.add(teethGroup);

    // --- Ring 2: Liquid Gold Gimbal (Faculty) ---
    const ring2Geo = regG(new THREE.TorusGeometry(1.88, 0.052, 20, 80));
    const ring2Mat = regM(new THREE.MeshStandardMaterial({
      color: CYBER_COLORS.electricGold,
      emissive: 0xb45309,
      emissiveIntensity: 0.85,
      metalness: 0.92,
      roughness: 0.14,
    }));
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    gyroGroup.add(ring2);

    // --- Ring 3: Neon Magenta Gimbal Ring (CR Reps) ---
    const ring3Geo = regG(new THREE.TorusGeometry(1.42, 0.046, 18, 72));
    const ring3Mat = regM(new THREE.MeshStandardMaterial({
      color: CYBER_COLORS.neonMagenta,
      emissive: 0x9d174d,
      emissiveIntensity: 1.1,
      metalness: 0.9,
      roughness: 0.18,
    }));
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    gyroGroup.add(ring3);

    // --- Ring 4: Cyan Wireframe Precession Ring (Students) ---
    const ring4Geo = regG(new THREE.TorusGeometry(1.02, 0.038, 16, 64));
    const ring4Mat = regM(new THREE.MeshBasicMaterial({
      color: CYBER_COLORS.hologramBlue,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    }));
    const ring4 = new THREE.Mesh(ring4Geo, ring4Mat);
    gyroGroup.add(ring4);

    // --- Center Pulsing Singularity Core ---
    const coreCrystalGeo = regG(new THREE.OctahedronGeometry(0.52, 0));
    const coreCrystalMat = regM(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: CYBER_COLORS.cyberCyan,
      emissiveIntensity: 2.4,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.92,
    }));
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, coreCrystalMat);
    gyroGroup.add(coreCrystal);

    // Outer Dual Holographic Icosahedron Shell
    const coreShellGeo = regG(new THREE.IcosahedronGeometry(0.76, 1));
    const coreShellMat = regM(new THREE.MeshBasicMaterial({
      color: CYBER_COLORS.neonMagenta,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    }));
    const coreShell = new THREE.Mesh(coreShellGeo, coreShellMat);
    gyroGroup.add(coreShell);

    // --- 4 Orbiting Neon Data Satellites ---
    const satGeo = regG(new THREE.SphereGeometry(0.068, 16, 16));
    const satMats = [
      regM(new THREE.MeshBasicMaterial({ color: CYBER_COLORS.cyberCyan })),
      regM(new THREE.MeshBasicMaterial({ color: CYBER_COLORS.neonMagenta })),
      regM(new THREE.MeshBasicMaterial({ color: CYBER_COLORS.liquidGold })),
      regM(new THREE.MeshBasicMaterial({ color: 0x10b981 })),
    ];
    const satellites = [];
    for (let s = 0; s < 4; s++) {
      const satMesh = new THREE.Mesh(satGeo, satMats[s]);
      gyroGroup.add(satMesh);
      satellites.push({
        mesh: satMesh,
        radius: 1.55 + s * 0.24,
        speed: 1.5 + s * 0.45,
        offset: (s * Math.PI) / 2,
        inclination: (s - 1.5) * 0.45,
      });
    }

    // --- Expanding Shockwave Ring (Click trigger) ---
    const shockwaveGeo = regG(new THREE.RingGeometry(0.3, 0.46, 64));
    const shockwaveMat = regM(new THREE.MeshBasicMaterial({
      color: CYBER_COLORS.cyberCyan,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }));
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    gyroGroup.add(shockwaveMesh);

    // 7. Cyberpunk Data Rain Drops (Falling Neon Streaks)
    const RAIN_COUNT = isCompact ? 40 : 120;
    const rainGeo = regG(new THREE.BoxGeometry(0.018, 0.45, 0.018));
    const rainMat = regM(new THREE.MeshBasicMaterial({
      color: CYBER_COLORS.cyberCyan,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    }));
    const rainGroup = new THREE.Group();
    const rainDrops = [];

    for (let r = 0; r < RAIN_COUNT; r++) {
      const drop = new THREE.Mesh(rainGeo, rainMat);
      drop.position.set(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 - 1,
        (Math.random() - 0.5) * 8
      );
      drop.scale.y = 0.5 + Math.random() * 1.5;
      rainGroup.add(drop);
      rainDrops.push({
        mesh: drop,
        speed: 0.08 + Math.random() * 0.12,
        resetY: 6 + Math.random() * 3,
        floorY: isCompact ? -1.8 : -2.3,
      });
    }
    scene.add(rainGroup);

    // 8. 500+ Floating Cyber Dust Particles
    const PARTICLE_COUNT = isCompact ? 160 : 540;
    const partPositions = new Float32Array(PARTICLE_COUNT * 3);
    const partColors = new Float32Array(PARTICLE_COUNT * 3);
    const cCyan = new THREE.Color(CYBER_COLORS.cyberCyan);
    const cMagenta = new THREE.Color(CYBER_COLORS.neonMagenta);
    const cGold = new THREE.Color(CYBER_COLORS.liquidGold);

    for (let p = 0; p < PARTICLE_COUNT; p++) {
      const rad = 1.0 + Math.random() * 4.5;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI * 0.75;

      partPositions[p * 3] = rad * Math.cos(th) * Math.cos(ph);
      partPositions[p * 3 + 1] = rad * Math.sin(th) * Math.cos(ph);
      partPositions[p * 3 + 2] = rad * Math.sin(ph);

      const rnd = Math.random();
      const c = rnd > 0.55 ? cCyan : rnd > 0.25 ? cMagenta : cGold;
      partColors[p * 3] = c.r;
      partColors[p * 3 + 1] = c.g;
      partColors[p * 3 + 2] = c.b;
    }

    const partGeo = regG(new THREE.BufferGeometry());
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(partColors, 3));

    const partMat = regM(new THREE.PointsMaterial({
      size: isCompact ? 0.04 : 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }));
    const partField = new THREE.Points(partGeo, partMat);
    gyroGroup.add(partField);

    // 9. Interactive Physics & Kinetic Spin Kick
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let clickSpin = 0;
    let shockwaveScale = 0.5;
    let shockwaveActive = false;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseTargetX = ny * 0.38;
      mouseTargetY = nx * 0.48;
    };

    container.addEventListener('mousemove', handleMouseMove);

    const triggerBurst = () => {
      shockwaveActive = true;
      shockwaveScale = 0.4;
      shockwaveMat.opacity = 1.0;
      clickSpin = 5.2; // intense kinetic kick
      if (onCoreClick) onCoreClick();
    };

    container.addEventListener('click', triggerBurst);

    let lastTrigger = pulseTrigger;

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    // 10. 60 FPS Cinematic Sweeping Pan & Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (pulseTrigger !== lastTrigger) {
        lastTrigger = pulseTrigger;
        triggerBurst();
      }

      // Smooth Mouse Tilt Lerp
      currentTiltX += (mouseTargetX - currentTiltX) * 0.08;
      currentTiltY += (mouseTargetY - currentTiltY) * 0.08;
      clickSpin += (0 - clickSpin) * 0.06;

      // Dynamic Sweeping Camera Pan (Creates true cinematic perspective)
      if (!isCompact) {
        camera.position.x = Math.sin(elapsed * 0.35) * 1.4 + currentTiltY * 2.0;
        camera.position.y = 0.75 + Math.cos(elapsed * 0.25) * 0.35 + currentTiltX * 1.5;
        camera.position.z = 6.4 + Math.sin(elapsed * 0.2) * 0.4;
        camera.lookAt(0, 0.15, 0);
      } else {
        gyroGroup.rotation.x = currentTiltX;
        gyroGroup.rotation.y = currentTiltY + clickSpin * 0.15;
      }

      // Gyroscope Multi-Axis Counter-Rotations
      const isLocked = isSyncLocked || isHovered;
      const speed = isLocked ? 0.35 : 1.0;

      if (isLocked) {
        ring1.rotation.z += 0.015;
        ring2.rotation.y += (0 - ring2.rotation.y) * 0.08;
        ring3.rotation.x += (0 - ring3.rotation.x) * 0.08;
        ring4.rotation.z += 0.02;

        coreCrystalMat.emissive.setHex(CYBER_COLORS.liquidGold);
        coreCrystalMat.emissiveIntensity = 3.5;
      } else {
        ring1.rotation.z = elapsed * 0.45 * speed;
        teethGroup.rotation.z = elapsed * 0.45 * speed;
        ring2.rotation.y = elapsed * 0.75 * speed;
        ring3.rotation.x = elapsed * 0.95 * speed;
        ring4.rotation.z = -elapsed * 1.15 * speed;

        coreCrystalMat.emissive.setHex(CYBER_COLORS.cyberCyan);
        coreCrystalMat.emissiveIntensity = 2.4;
      }

      // Core Crystal Breathing
      const pulse = 1.0 + Math.sin(elapsed * 5.5) * 0.14;
      coreCrystal.scale.set(pulse, pulse, pulse);
      coreCrystal.rotation.x = elapsed * 1.4;
      coreCrystal.rotation.y = elapsed * 1.8;

      coreShell.rotation.x = -elapsed * 0.8;
      coreShell.rotation.z = elapsed * 0.65;

      // Orbit Satellites
      satellites.forEach((sat) => {
        const th = elapsed * sat.speed + sat.offset;
        sat.mesh.position.x = Math.cos(th) * sat.radius;
        sat.mesh.position.y = Math.sin(th) * Math.cos(sat.inclination) * sat.radius;
        sat.mesh.position.z = Math.sin(th) * Math.sin(sat.inclination) * sat.radius;
      });

      // Emitter Base Holographic Precession
      baseTorus.rotation.z = elapsed * 0.5;

      // Animate Falling Rain Streaks
      rainDrops.forEach((d) => {
        d.mesh.position.y -= d.speed;
        if (d.mesh.position.y < d.floorY) {
          d.mesh.position.y = d.resetY;
        }
      });

      // Expand Shockwave
      if (shockwaveActive) {
        shockwaveScale += 0.15;
        shockwaveMesh.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        shockwaveMat.opacity *= 0.92;
        if (shockwaveMat.opacity < 0.01) {
          shockwaveActive = false;
          shockwaveMat.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', triggerBurst);
      window.removeEventListener('resize', handleResize);

      geosToDispose.forEach((g) => g && g.dispose && g.dispose());
      matsToDispose.forEach((m) => m && m.dispose && m.dispose());

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [isCompact, isHovered, isSyncLocked, pulseTrigger, onCoreClick]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust Pure CSS-3D Fallback
// ─────────────────────────────────────────────────────────────────────────────
function CSSGyroFallback({ isCompact }) {
  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <div
        className={`relative rounded-full border-2 border-cyan-400/60 flex items-center justify-center animate-[spin_8s_linear_infinite] ${
          isCompact ? 'w-24 h-24' : 'w-60 h-60'
        }`}
        style={{ boxShadow: '0 0 35px rgba(6, 182, 212, 0.4)' }}
      >
        <div className="absolute inset-2 rounded-full border border-pink-500/70 animate-[spin_6s_linear_infinite_reverse]" />
        <div className="absolute inset-5 rounded-full border border-amber-400/60 animate-[spin_4s_linear_infinite]" />
        <div
          className={`rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-amber-400 animate-pulse ${
            isCompact ? 'w-8 h-8' : 'w-16 h-16'
          }`}
          style={{ boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)' }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Component: ChronoSyncLogo3D
// ─────────────────────────────────────────────────────────────────────────────
export default function ChronoSyncLogo3D({
  mode = 'splash', // 'splash' | 'compact'
  onComplete,
  className = '',
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncLocked, setIsSyncLocked] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const [splashPhase, setSplashPhase] = useState('awakening'); // 'awakening' | 'sync' | 'dock'
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'splash') return;

    const startTime = Date.now();
    const DURATION = 3800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / (DURATION - 500)) * 100));
      setProgress(pct);

      if (elapsed < 1600) {
        setSplashPhase('awakening');
        setIsSyncLocked(false);
      } else if (elapsed < 2800) {
        setSplashPhase('sync');
        setIsSyncLocked(true);
      } else {
        setSplashPhase('dock');
      }

      if (elapsed >= DURATION - 400 && !isExiting) {
        setIsExiting(true);
      }

      if (elapsed >= DURATION) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 25);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, onComplete, isExiting]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 280);
  };

  const handleManualBurst = () => {
    setPulseCount((c) => c + 1);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // COMPACT MODE (For Login Card Header & Navigation Bar)
  // ───────────────────────────────────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-28 h-28 sm:w-36 sm:h-36">
          {hasWebGL ? (
            <CyberGyroCanvas
              mode="compact"
              isHovered={isHovered}
              isSyncLocked={isSyncLocked}
              pulseTrigger={pulseCount}
              onCoreClick={handleManualBurst}
            />
          ) : (
            <CSSGyroFallback isCompact={true} />
          )}

          {/* Cyan/Magenta Holographic Core Radial Glow */}
          <div className="absolute inset-0 pointer-events-none rounded-full bg-radial from-cyan-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="flex items-center gap-1.5 mt-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
          <span className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">
            CHRONO SYNC {isHovered ? '· LOCKED' : '· LIVE'}
          </span>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SPLASH MODE (Cinematic Cyberpunk Opening Sequence)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cyber-chronosync-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-between overflow-hidden bg-[#030509] text-slate-100 select-none font-sans"
        >
          {/* Cyberpunk Scanline & Chromatic Jitter Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.15) 3px, transparent 4px)',
              backgroundSize: '100% 4px',
            }}
          />

          {/* Top Cyber Telemetry & Skip Button */}
          <div className="relative z-20 flex items-center justify-between w-full max-w-7xl px-6 py-6 font-mono">
            {/* HUD Status Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-slate-950/80 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_18px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-ping" />
              <span className="text-[11px] tracking-widest text-cyan-300 font-bold uppercase">
                {splashPhase === 'awakening' && 'SYS_STATUS: CALIBRATING QUANTUM GYROSCOPE...'}
                {splashPhase === 'sync' && 'SYS_STATUS: 4-ROLE HARMONIC LOCK ENGAGED'}
                {splashPhase === 'dock' && 'SYS_STATUS: TEMPORAL MATRIX ONLINE · ALL NODES SYNCED'}
              </span>
            </div>

            {/* Skip Control */}
            <button
              onClick={handleSkip}
              className="group flex items-center gap-2 px-4 py-1.5 rounded-md bg-slate-950/70 border border-slate-700/70 hover:border-pink-500 hover:bg-pink-500/10 text-xs tracking-wider text-slate-300 hover:text-pink-400 transition-all duration-200 backdrop-blur-md shadow-[0_0_12px_rgba(236,72,153,0.15)]"
            >
              <span>SKIP</span>
              <span className="text-[10px] text-slate-500 group-hover:text-pink-400/80">[ESC]</span>
            </button>
          </div>

          {/* Center 3D Viewport with Sweeping Camera Pan */}
          <div className="relative z-10 flex-1 w-full flex items-center justify-center my-[-25px]">
            {/* Ambient Cyan/Magenta Reflector Glow */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-radial from-cyan-500/20 via-pink-500/15 to-transparent blur-3xl pointer-events-none" />

            <div className="w-full h-full max-h-[620px] flex items-center justify-center">
              {hasWebGL ? (
                <CyberGyroCanvas
                  mode="splash"
                  isHovered={isHovered}
                  isSyncLocked={isSyncLocked}
                  pulseTrigger={pulseCount}
                  onCoreClick={handleManualBurst}
                />
              ) : (
                <CSSGyroFallback isCompact={false} />
              )}
            </div>
          </div>

          {/* Bottom Kinetic Neon Typography with Chromatic Aberration */}
          <div className="relative z-20 flex flex-col items-center w-full max-w-3xl px-6 pb-8 text-center">
            {/* Chromatic Aberration Glitch Typography */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: splashPhase === 'awakening' ? 0.35 : 1,
                y: 0,
              }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center relative"
            >
              {/* Neon Logo Typography: CHRONO SYNC */}
              <div className="relative select-none">
                {/* Red/Pink Glitch Ghost */}
                <h1
                  className="absolute inset-0 text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.22em] uppercase text-pink-500 opacity-60 pointer-events-none select-none blur-[1px] transform -translate-x-0.5 translate-y-0.5"
                  aria-hidden="true"
                >
                  CHRONO SYNC
                </h1>

                {/* Cyan Glitch Ghost */}
                <h1
                  className="absolute inset-0 text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.22em] uppercase text-cyan-400 opacity-60 pointer-events-none select-none blur-[1px] transform translate-x-0.5 -translate-y-0.5"
                  aria-hidden="true"
                >
                  CHRONO SYNC
                </h1>

                {/* Main Luminous Neon Title */}
                <h1
                  className="relative text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.22em] uppercase text-white drop-shadow-[0_0_35px_rgba(6,182,212,0.8)] drop-shadow-[0_0_60px_rgba(236,72,153,0.5)] leading-none"
                  style={{
                    textShadow: '0 0 10px #06b6d4, 0 0 25px #06b6d4, 0 0 50px #ec4899',
                  }}
                >
                  CHRONO SYNC
                </h1>
              </div>

              {/* Holographic HUD Subtitle Badge */}
              <div className="mt-3 px-4 py-1 rounded bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_14px_rgba(6,182,212,0.2)]">
                <p className="text-[10px] sm:text-xs font-mono tracking-[0.28em] text-cyan-300 uppercase font-bold">
                  INTELLIGENT ACADEMIC TIME &amp; WORKLOAD SYNCHRONIZATION ENGINE
                </p>
              </div>

              {/* 4 Academic Pillars Role Status Tags */}
              <div className="flex items-center gap-3 sm:gap-6 mt-3.5 text-[10px] sm:text-[11px] font-mono tracking-wider">
                <span className="flex items-center gap-1.5 text-pink-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" /> HOD
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" /> FACULTY
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" /> CR REPS
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> STUDENTS
                </span>
              </div>
            </motion.div>

            {/* Glowing Neon Progress Laser */}
            <div className="w-full max-w-md mt-5 flex flex-col items-center gap-2 font-mono">
              <div className="w-full h-1 rounded-sm bg-slate-900/90 overflow-hidden relative border border-cyan-500/20 shadow-[0_0_14px_rgba(6,182,212,0.3)]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 shadow-[0_0_16px_#06b6d4] transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-[10px] text-slate-500 tracking-wider">
                <span className="text-cyan-400 font-bold">
                  {splashPhase === 'awakening' && 'CALIBRATING QUANTUM OSCILLATOR...'}
                  {splashPhase === 'sync' && 'ROLE GYROSCOPES SYNCHRONIZED'}
                  {splashPhase === 'dock' && 'PLATFORM READY TO ENTER'}
                </span>
                <span className="text-slate-400">{progress}%</span>
              </div>
            </div>

            {/* Enter Portal Action Button */}
            {splashPhase === 'dock' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={handleSkip}
                className="mt-4 flex items-center gap-2 px-8 py-2.5 rounded-md bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 text-slate-950 font-black text-xs font-mono tracking-widest uppercase shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(236,72,153,0.8)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <span>ENTER CHRONOSYNC PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
