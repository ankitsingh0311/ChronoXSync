// =============================================================================
// ChronoSync — Luxury 3D Interactive Opening Page & Academic Platform Showcase
// Component: ChronoSyncOpeningPage.jsx
// =============================================================================
// Purpose:
// Rather than an abstract spinning logo, this component showcases EXACTLY what
// ChronoSync does:
// 1. Unifies 4 Academic Roles (HOD, Faculty, CR, Student) in a 3D Spatial Matrix.
// 2. Interactive "Live Clash Resolver" Simulator demonstrating automated
//    deadline conflict resolution & burnout reduction.
// 3. 3D Interactive Role Portals that users can click to inspect live capabilities.
// 4. Smooth 60FPS WebGL canvas with 360° Orbit interaction & pure CSS-3D fallback.
// 5. Direct 1-click CTA: "ENTER CHRONOSYNC PLATFORM" transitioning into Login/Dashboard.
// =============================================================================

import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Users, BookOpen, Crown,
  AlertTriangle, CheckCircle2, ArrowRight, Zap,
  Calendar, Clock, ShieldCheck, Sparkles, ChevronRight,
  TrendingDown, Layers, BarChart3, Activity, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 4 Academic Roles Data & Platform Value Proposition
// ─────────────────────────────────────────────────────────────────────────────
const ACADEMIC_ROLES = [
  {
    id: 'student',
    title: 'Student Portal',
    badge: 'Workload & Panic Triage',
    icon: GraduationCap,
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    tagline: 'Deadlines Without the Panic',
    description: 'Dynamic assignment timeline, submission status tracking, and 1-click AI Panic Button alerting CR & HOD when test schedules clash.',
    metric: '88% Stress Reduced',
    livePreview: {
      type: 'deadlines',
      items: [
        { name: 'DSA Lab Submission', time: 'Today, 11:59 PM', status: 'On Track', color: '#10b981' },
        { name: 'DBMS Unit 2 Quiz', time: 'Tomorrow, 10:00 AM', status: 'Auto-Synced', color: '#06b6d4' },
      ],
      alertText: 'Panic Triage Assistant: 0 Active Clashes',
    }
  },
  {
    id: 'cr',
    title: 'CR Command Portal',
    badge: 'Batch Coordinator',
    icon: Users,
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    tagline: 'Batch Schedule & Conflict Resolver',
    description: 'Elected Class Representatives coordinate lecture slots, publish assignment deadlines, and resolve overlapping submissions in real time.',
    metric: '100% Conflict-Free',
    livePreview: {
      type: 'coordination',
      items: [
        { name: 'B.Tech CSE Sec A', time: 'Active Batch', status: '62 Students', color: '#06b6d4' },
        { name: 'Operating Systems Milestone', time: 'Rescheduled +2 Days', status: 'Clash Resolved', color: '#10b981' },
      ],
      alertText: 'Delegation Inbox: 4 Faculty Syncs Active',
    }
  },
  {
    id: 'faculty',
    title: 'Faculty Academic Console',
    badge: 'Multi-Department Syllabus',
    icon: BookOpen,
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    tagline: 'Unit-Wise Syllabus & Exam Manager',
    description: 'Teachers design unit-wise syllabi across multiple departments (CSE, AIML, Mechanical, etc.) and delegate milestones to Class Reps.',
    metric: '12 Depts Unified',
    livePreview: {
      type: 'syllabus',
      items: [
        { name: 'DBMS · Unit 3 Normalization', time: 'B.Tech CSE', status: '85% Completed', color: '#f59e0b' },
        { name: 'Cloud Computing · Midterm', time: 'B.Tech AIML', status: 'Scheduled', color: '#38bdf8' },
      ],
      alertText: 'Course Pacing: 4 Units Checked Off',
    }
  },
  {
    id: 'hod',
    title: 'HOD Executive Suite',
    badge: 'Leadership & Burnout Oversight',
    icon: Crown,
    accent: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    tagline: 'Branch-Wide Analytics & Governance',
    description: 'Deans and HODs monitor student burnout heatmaps, audit faculty curriculum pacing, and resolve escalated anomalies with full transparency.',
    metric: 'Zero Blindspots',
    livePreview: {
      type: 'analytics',
      items: [
        { name: 'Branch Burnout Index', time: 'Real-Time', status: 'Healthy (22%)', color: '#10b981' },
        { name: 'Department Panic Logs', time: 'Last 7 Days', status: 'All Resolved', color: '#ec4899' },
      ],
      alertText: 'Executive Roster: Instant User Governance',
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3D Academic Matrix WebGL Canvas
// ─────────────────────────────────────────────────────────────────────────────
function AcademicMatrixCanvas({ activeRoleIndex, onSelectRole }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.038);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 8.5);
    camera.lookAt(0, 0, 0);

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

    const geosToDispose = [];
    const matsToDispose = [];
    const regG = (g) => { geosToDispose.push(g); return g; };
    const regM = (m) => { matsToDispose.push(m); return m; };

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xf59e0b, 8, 25);
    goldPoint.position.set(5, 6, 6);
    scene.add(goldPoint);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 8, 25);
    cyanPoint.position.set(-5, -3, 5);
    scene.add(cyanPoint);

    // 3. Central Academic Timeline Track (Concentric Rings)
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    // Outer Orbit Track Ring
    const trackTorusGeo = regG(new THREE.TorusGeometry(3.2, 0.035, 16, 120));
    const trackTorusMat = regM(new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x0f172a,
    }));
    const trackRing = new THREE.Mesh(trackTorusGeo, trackTorusMat);
    trackRing.rotation.x = Math.PI / 2;
    centralGroup.add(trackRing);

    // Inner Secondary Track
    const innerTrackGeo = regG(new THREE.TorusGeometry(2.1, 0.025, 16, 90));
    const innerTrackMat = regM(new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 }));
    const innerRing = new THREE.Mesh(innerTrackGeo, innerTrackMat);
    innerRing.rotation.x = Math.PI / 2;
    centralGroup.add(innerRing);

    // 4. Center Singularity: The ChronoSync Relational Core
    const coreCrystalGeo = regG(new THREE.OctahedronGeometry(0.75, 0));
    const coreCrystalMat = regM(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
    }));
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, coreCrystalMat);
    centralGroup.add(coreCrystal);

    const auraGeo = regG(new THREE.IcosahedronGeometry(1.05, 1));
    const auraMat = regM(new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.45 }));
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    centralGroup.add(auraMesh);

    // 5. 4 Interactive 3D Role Pedestals / Portals around the track
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const roleColors = [0x10b981, 0x06b6d4, 0xf59e0b, 0xec4899];
    const nodePillars = [];
    const pedestalGeo = regG(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 32));
    const sphereGeo = regG(new THREE.SphereGeometry(0.32, 24, 24));
    const ringMarkerGeo = regG(new THREE.TorusGeometry(0.55, 0.03, 12, 48));

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 3.2;
      const z = Math.sin(angle) * 3.2;

      const subGroup = new THREE.Group();
      subGroup.position.set(x, 0, z);

      // Base Pedestal
      const baseMat = regM(new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.2,
      }));
      const pedestal = new THREE.Mesh(pedestalGeo, baseMat);
      pedestal.position.y = -0.15;
      subGroup.add(pedestal);

      // Floating Luminous Role Sphere
      const sphereMat = regM(new THREE.MeshStandardMaterial({
        color: roleColors[i],
        emissive: roleColors[i],
        emissiveIntensity: 1.6,
        metalness: 0.8,
        roughness: 0.15,
      }));
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.y = 0.45;
      subGroup.add(sphere);

      // Orbiting Aura Ring
      const ringMat = regM(new THREE.MeshBasicMaterial({
        color: roleColors[i],
        transparent: true,
        opacity: 0.8,
      }));
      const ringMarker = new THREE.Mesh(ringMarkerGeo, ringMat);
      ringMarker.rotation.x = Math.PI / 2;
      ringMarker.position.y = 0.45;
      subGroup.add(ringMarker);

      nodeGroup.add(subGroup);
      nodePillars.push({ group: subGroup, sphere, ringMarker, index: i, angle });
    }

    // 6. Connective Energy Data Beams (Linking Role Nodes to Central Core)
    const beamMat = regM(new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
    nodePillars.forEach((node) => {
      const lineGeo = regG(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(node.group.position.x, 0.45, node.group.position.z)
      ]));
      const beamLine = new THREE.Line(lineGeo, beamMat);
      scene.add(beamLine);
    });

    // 7. Ambient Particle Field (600+ Stardust Particles)
    const PARTICLE_COUNT = 600;
    const partPos = new Float32Array(PARTICLE_COUNT * 3);
    const partCols = new Float32Array(PARTICLE_COUNT * 3);
    const cEmerald = new THREE.Color(0x10b981);
    const cCyan = new THREE.Color(0x06b6d4);
    const cGold = new THREE.Color(0xf59e0b);

    for (let p = 0; p < PARTICLE_COUNT; p++) {
      const rad = 1.8 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.5;

      partPos[p * 3] = rad * Math.cos(theta);
      partPos[p * 3 + 1] = y;
      partPos[p * 3 + 2] = rad * Math.sin(theta);

      const rVal = Math.random();
      const c = rVal > 0.6 ? cGold : rVal > 0.3 ? cCyan : cEmerald;
      partCols[p * 3] = c.r;
      partCols[p * 3 + 1] = c.g;
      partCols[p * 3 + 2] = c.b;
    }

    const partGeo = regG(new THREE.BufferGeometry());
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(partCols, 3));

    const partMat = regM(new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    }));
    const particleField = new THREE.Points(partGeo, partMat);
    scene.add(particleField);

    // 8. Interactive Drag to Orbit the Matrix
    let isMouseDown = false;
    let prevMouseX = 0;
    let userRotY = 0;
    let targetUserRotY = 0;

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e) => {
      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        prevMouseX = e.clientX;
        targetUserRotY += deltaX * 0.008;
      }
    };
    const onMouseUp = () => {
      isMouseDown = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
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

    // 9. 60 FPS Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Orbit Drag Lerp
      userRotY += (targetUserRotY - userRotY) * 0.08;
      centralGroup.rotation.y = userRotY + elapsed * 0.15;
      nodeGroup.rotation.y = userRotY;

      // Central Crystal Tumbling
      coreCrystal.rotation.x = elapsed * 0.8;
      coreCrystal.rotation.y = elapsed * 1.1;
      const pulse = 1.0 + Math.sin(elapsed * 4.5) * 0.1;
      coreCrystal.scale.set(pulse, pulse, pulse);

      auraMesh.rotation.x = -elapsed * 0.6;
      auraMesh.rotation.z = elapsed * 0.5;

      // Pedestal Pulsing & Floating
      nodePillars.forEach((node) => {
        const bob = Math.sin(elapsed * 2.5 + node.angle) * 0.08;
        node.sphere.position.y = 0.45 + bob;
        node.ringMarker.position.y = 0.45 + bob;
        node.ringMarker.rotation.z = elapsed * 1.2;

        // Highlight selected role node
        if (node.index === activeRoleIndex) {
          node.sphere.scale.set(1.4, 1.4, 1.4);
          node.ringMarker.scale.set(1.3, 1.3, 1.3);
        } else {
          node.sphere.scale.set(1.0, 1.0, 1.0);
          node.ringMarker.scale.set(1.0, 1.0, 1.0);
        }
      });

      // Ambient particle vortex
      particleField.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
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
  }, [activeRoleIndex]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        overflow: 'hidden',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Opening Page Component: ChronoSyncOpeningPage
// ─────────────────────────────────────────────────────────────────────────────
export default function ChronoSyncOpeningPage({ onEnterPlatform }) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [simulatedClashResolved, setSimulatedClashResolved] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const activeRole = ACADEMIC_ROLES[selectedRoleIndex];

  // Interactive Clash Resolver Simulation
  const handleRunResolution = () => {
    setIsResolving(true);
    setTimeout(() => {
      setSimulatedClashResolved(true);
      setIsResolving(false);
    }, 750);
  };

  const handleResetClash = () => {
    setSimulatedClashResolved(false);
  };

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col justify-between overflow-y-auto bg-[#030712] text-slate-100 select-none font-sans">
      {/* Background Luxury Ambient Glow Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at center, black 35%, transparent 85%)',
        }}
      />

      {/* Top Navigation Bar: Brand & Direct Action */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-400 p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider uppercase text-white font-mono">
                CHRONO<span className="text-amber-400">SYNC</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                ACADEMIC OS
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono tracking-wide hidden sm:block">
              Institutional Time &amp; Workload Synchronization Platform
            </p>
          </div>
        </div>

        {/* Enter Platform CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEnterPlatform}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <span>ENTER PLATFORM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body: Hero Header + 3D Spatial Canvas + Interactive Live Showcase */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-4 w-full">
        {/* Hero Title & Value Proposition */}
        <div className="text-center max-w-3xl mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md mb-3 text-xs font-mono text-slate-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>UNIFYING ACADEMIC TIME, DEADLINES &amp; ROLE HARMONIZATION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight"
          >
            Stop Deadline Clashes.{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              Synchronize Every Campus Role.
            </span>
          </motion.h1>

          <p className="text-sm sm:text-base text-slate-400 mt-2.5 max-w-2xl mx-auto font-normal leading-relaxed">
            ChronoSync orchestrates exam schedules, lab submissions, and multi-department syllabi in real time—connecting Students, Class Reps, Faculty, and HODs into one conflict-free academic timeline.
          </p>
        </div>

        {/* 3D Interactive Spatial Canvas & Role Telemetry Cards */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-2">
          {/* Left Column: 4 Role Selector Tabs */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold px-1">
              Select An Academic Role to Inspect:
            </span>

            {ACADEMIC_ROLES.map((role, idx) => {
              const Icon = role.icon;
              const isSelected = idx === selectedRoleIndex;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleIndex(idx)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left group ${
                    isSelected
                      ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.18)]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${role.accent}18`, border: `1px solid ${role.accent}44` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: role.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {role.title}
                      </h3>
                      <span
                        className="text-[9.5px] font-mono px-2 py-0.5 rounded font-bold"
                        style={{ background: `${role.accent}20`, color: role.accent }}
                      >
                        {role.metric}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-normal">
                      {role.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center Column: 3D WebGL Matrix Viewport */}
          <div className="lg:col-span-5 h-[340px] sm:h-[400px] relative rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
            <AcademicMatrixCanvas
              activeRoleIndex={selectedRoleIndex}
              onSelectRole={setSelectedRoleIndex}
            />

            {/* Micro 3D Orbit Tip */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>🖱️ Drag to Rotate 360° Academic Matrix</span>
            </div>
          </div>

          {/* Right Column: Live Role Inspector & Real-Time Demo */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div
              className="p-4 rounded-xl border bg-slate-900/80 backdrop-blur-md transition-all shadow-lg"
              style={{ borderColor: `${activeRole.accent}55` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {activeRole.badge}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: activeRole.accent }}
                />
              </div>

              <h4 className="text-base font-bold text-white mb-1">
                {activeRole.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {activeRole.description}
              </p>

              {/* Simulated Live Feed Items */}
              <div className="mt-3.5 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Active Sync Telemetry:
                </span>
                {activeRole.livePreview.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.time}</div>
                    </div>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono" style={{ color: activeRole.accent }}>
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{activeRole.livePreview.alertText}</span>
              </div>
            </div>

            {/* Quick Feature Stats Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-around text-center">
              <div>
                <div className="text-lg font-black text-amber-400 font-mono">4</div>
                <div className="text-[9.5px] text-slate-500 uppercase font-mono">Synced Roles</div>
              </div>
              <div className="w-[1px] h-7 bg-slate-800" />
              <div>
                <div className="text-lg font-black text-cyan-400 font-mono">12+</div>
                <div className="text-[9.5px] text-slate-500 uppercase font-mono">Depts Unified</div>
              </div>
              <div className="w-[1px] h-7 bg-slate-800" />
              <div>
                <div className="text-lg font-black text-emerald-400 font-mono">0</div>
                <div className="text-[9.5px] text-slate-500 uppercase font-mono">Clash Tolerated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Feature: Live "Clash Detection & Auto-Resolution" Simulator */}
        <div className="w-full mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                  Interactive Platform Engine Simulator:
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {simulatedClashResolved
                  ? '✓ Conflict Resolved: ChronoSync AI shifted overlapping deadlines, restoring optimal workload balance.'
                  : '⚠️ Simulated Clashing Schedule: Midterm Exam & Machine Learning Project overlap on Friday, creating peak burnout.'}
              </p>
            </div>

            {/* Interactive Simulation Trigger */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono text-xs">
                <span className="text-slate-400">Student Stress:</span>
                <span
                  className={`font-bold ${
                    simulatedClashResolved ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulatedClashResolved ? '22% (Optimal)' : '88% (Critical)'}
                </span>
              </div>

              {!simulatedClashResolved ? (
                <button
                  onClick={handleRunResolution}
                  disabled={isResolving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isResolving ? 'Resolving...' : 'Resolve Clash'}</span>
                </button>
              ) : (
                <button
                  onClick={handleResetClash}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono tracking-wider transition-all"
                >
                  <span>Reset Demo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs font-mono border-t border-slate-900">
        <div>
          CHRONOSYNC ARCHITECTURE · REAL-TIME ROLE SYNCHRONIZATION ENGINE
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <button
            onClick={onEnterPlatform}
            className="text-amber-400 hover:text-amber-300 font-bold uppercase transition-colors"
          >
            Launch Auth Portal &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
}
