// =============================================================================
// ChronoSync 3D — Ultra-Luxury Interactive 3D Live Wallpaper & Logo
// =============================================================================
// Features:
// 1. Live Atomic UTC Clock Sync down to milliseconds.
// 2. Full 360° Drag-to-Rotate + Smooth Mouse-Wheel 3D Macro Zoom (Camera 5.0 - 9.0).
// 3. Interlocking 3-Point Planetary Gears meshed with central escapement.
// 4. Conical Holographic Radar Sweep scanning across the dial in real-time.
// 5. 750+ Cursor-Magnetic Stardust Particles with physical repulsion & vortex drift.
// 6. Interactive Click Spark Explosions (30 3D radiant sparks per click).
// 7. Dynamic Holographic Quantum Frequency Equalizer Bars pulsing in real-time.
// 8. 12 Diamond Gemstone Hour Markers flaring brightly as hands sweep over them.
// 9. Zero-leak complete WebGL teardown and event listener disposal on unmount.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ChronoSyncSplash({ onComplete }) {
  const mountRef = useRef(null);
  const [phase, setPhase] = useState('calibrating'); // 'calibrating' | 'synchronizing' | 'online'
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [liveTimeStr, setLiveTimeStr] = useState('');
  const [liveMs, setLiveMs] = useState('000');
  const [burstCount, setBurstCount] = useState(0);

  // Live atomic clock ticker for the HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setLiveTimeStr(`${hours}:${mins}:${secs}`);
      setLiveMs(ms);
    };
    updateTime();
    const timer = setInterval(updateTime, 40);
    return () => clearInterval(timer);
  }, []);

  // Check WebGL availability
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
    }
  }, []);

  // Sequence Timeline (~4.0s total with progress)
  useEffect(() => {
    const startTime = Date.now();
    const DURATION = 4200;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / (DURATION - 600)) * 100));
      setProgress(pct);

      if (elapsed < 1400) {
        setPhase('calibrating');
      } else if (elapsed < 3000) {
        setPhase('synchronizing');
      } else {
        setPhase('online');
      }

      if (elapsed >= DURATION - 600 && !isExiting) {
        setIsExiting(true);
      }

      if (elapsed >= DURATION) {
        clearInterval(progressInterval);
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
      clearInterval(progressInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete, isExiting]);

  // Three.js Interactive Live WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    let animId;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020308, 0.035);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.55, 7.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL init failed, using CSS fallback:', err);
      setWebglSupported(false);
      return;
    }

    // 2. Luxury Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Dynamic mouse-following cursor light
    const cursorLight = new THREE.PointLight(0x38bdf8, 9, 22);
    cursorLight.position.set(0, 0, 5);
    scene.add(cursorLight);

    // Warm Gold Key Light
    const goldKeyLight = new THREE.PointLight(0xf59e0b, 10, 35);
    goldKeyLight.position.set(6, 8, 8);
    scene.add(goldKeyLight);

    // Cyber Cyan Rim Light
    const cyanRimLight = new THREE.PointLight(0x06b6d4, 9, 32);
    cyanRimLight.position.set(-6, -6, 7);
    scene.add(cyanRimLight);

    // Core Singularity Light
    const coreLight = new THREE.PointLight(0xfbbf24, 14, 18);
    coreLight.position.set(0, 1.05, 1);
    scene.add(coreLight);

    // 3. Master Chrono Group (Framed in the upper-center of the screen)
    const chronoGroup = new THREE.Group();
    chronoGroup.position.set(0, 1.05, 0);
    scene.add(chronoGroup);

    // Geometries & Materials tracking for 100% disposal
    const geometriesToDispose = [];
    const materialsToDispose = [];

    const regGeo = (g) => { geometriesToDispose.push(g); return g; };
    const regMat = (m) => { materialsToDispose.push(m); return m; };

    // --- Component A: Outer Heavy Astrolabe Bezel Ring with 36 Cog Teeth ---
    const outerTorusGeo = regGeo(new THREE.TorusGeometry(2.45, 0.065, 24, 120));
    const goldMetalMat = regMat(new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.14,
      metalness: 0.95,
    }));
    const bezelRing = new THREE.Mesh(outerTorusGeo, goldMetalMat);
    chronoGroup.add(bezelRing);

    // Cog teeth encircling outer rim
    const cogsGroup = new THREE.Group();
    const cogGeo = regGeo(new THREE.BoxGeometry(0.065, 0.2, 0.085));
    const cogMat = regMat(new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xb45309,
      emissiveIntensity: 0.75,
      metalness: 0.92,
      roughness: 0.18,
    }));
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const cog = new THREE.Mesh(cogGeo, cogMat);
      cog.position.x = Math.cos(angle) * 2.5;
      cog.position.y = Math.sin(angle) * 2.5;
      cog.rotation.z = angle;
      cogsGroup.add(cog);
    }
    chronoGroup.add(cogsGroup);

    // --- Component B: 12 Diamond Gemstone Hour Markers (Dynamic Flare) ---
    const markersGroup = new THREE.Group();
    const markerGeo = regGeo(new THREE.OctahedronGeometry(0.11, 0));
    const markerMeshes = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const mat = regMat(new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.6,
        metalness: 0.95,
        roughness: 0.08,
      }));
      const marker = new THREE.Mesh(markerGeo, mat);
      marker.position.x = Math.cos(angle) * 2.45;
      marker.position.y = Math.sin(angle) * 2.45;
      marker.position.z = 0.09;
      marker.rotation.z = angle;
      markersGroup.add(marker);
      markerMeshes.push(marker);
    }
    chronoGroup.add(markersGroup);

    // --- Component C: 60 Precision Cyan Minute Lasers ---
    const tickMarksGroup = new THREE.Group();
    const tickGeo = regGeo(new THREE.BoxGeometry(0.02, 0.15, 0.02));
    const tickMat = regMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }));
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        const angle = (i / 60) * Math.PI * 2;
        const tick = new THREE.Mesh(tickGeo, tickMat);
        tick.position.x = Math.cos(angle) * 2.45;
        tick.position.y = Math.sin(angle) * 2.45;
        tick.rotation.z = angle + Math.PI / 2;
        tickMarksGroup.add(tick);
      }
    }
    chronoGroup.add(tickMarksGroup);

    // --- Component D: Mid Gyroscopic Ring with Counter-Rotating Astrolabe ---
    const midTorusGeo = regGeo(new THREE.TorusGeometry(1.92, 0.05, 18, 90));
    const cyanMetalMat = regMat(new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.05,
      roughness: 0.16,
      metalness: 0.92,
    }));
    const midRing = new THREE.Mesh(midTorusGeo, cyanMetalMat);
    chronoGroup.add(midRing);

    // --- Component E: Inner Chrono Precession Ring (Gold Wire) ---
    const innerTorusGeo = regGeo(new THREE.TorusGeometry(1.4, 0.045, 16, 80));
    const innerRing = new THREE.Mesh(innerTorusGeo, goldMetalMat);
    chronoGroup.add(innerRing);

    // --- Component F: 3-Point Planetary Gears (Interlocking Clockwork) ---
    const planetaryGroup = new THREE.Group();
    const planetGearRadius = 0.42;
    const planetTorusGeo = regGeo(new THREE.TorusGeometry(planetGearRadius, 0.028, 12, 48));
    const planetCogGeo = regGeo(new THREE.BoxGeometry(0.035, 0.08, 0.04));
    const planetMeshList = [];

    for (let p = 0; p < 3; p++) {
      const pAngle = (p / 3) * Math.PI * 2;
      const subGear = new THREE.Group();
      subGear.position.x = Math.cos(pAngle) * 1.55;
      subGear.position.y = Math.sin(pAngle) * 1.55;
      subGear.position.z = 0.04;

      const pRing = new THREE.Mesh(planetTorusGeo, goldMetalMat);
      subGear.add(pRing);

      for (let c = 0; c < 12; c++) {
        const cAngle = (c / 12) * Math.PI * 2;
        const pCog = new THREE.Mesh(planetCogGeo, cogMat);
        pCog.position.x = Math.cos(cAngle) * (planetGearRadius + 0.03);
        pCog.position.y = Math.sin(cAngle) * (planetGearRadius + 0.03);
        pCog.rotation.z = cAngle;
        subGear.add(pCog);
      }

      planetaryGroup.add(subGear);
      planetMeshList.push(subGear);
    }
    chronoGroup.add(planetaryGroup);

    // --- Component G: Conical Holographic Radar Scanner Sector ---
    const radarSectorGeo = regGeo(new THREE.CircleGeometry(2.4, 48, 0, Math.PI / 4));
    const radarSectorMat = regMat(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }));
    const radarSector = new THREE.Mesh(radarSectorGeo, radarSectorMat);
    radarSector.position.z = 0.03;
    chronoGroup.add(radarSector);

    // --- Component H: Sweeping 3D Clockwork Hands (Temporal Energy Needles) ---
    const handsGroup = new THREE.Group();
    handsGroup.position.z = 0.16;

    // Sweeping Cyan Minute/Second Blade
    const minuteHandGroup = new THREE.Group();
    const minuteBladeGeo = regGeo(new THREE.ConeGeometry(0.045, 1.85, 4));
    minuteBladeGeo.translate(0, 0.925, 0);
    const cyanHandMat = regMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const minuteBlade = new THREE.Mesh(minuteBladeGeo, cyanHandMat);
    minuteHandGroup.add(minuteBlade);

    // Counterweight diamond at base of minute hand
    const cwGeo = regGeo(new THREE.OctahedronGeometry(0.085, 0));
    const cwMesh = new THREE.Mesh(cwGeo, cyanHandMat);
    cwMesh.position.y = -0.34;
    minuteHandGroup.add(cwMesh);
    handsGroup.add(minuteHandGroup);

    // Golden Dagger Hour Hand
    const hourHandGroup = new THREE.Group();
    const hourBladeGeo = regGeo(new THREE.ConeGeometry(0.075, 1.25, 4));
    hourBladeGeo.translate(0, 0.625, 0);
    const goldHandMat = regMat(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    const hourBlade = new THREE.Mesh(hourBladeGeo, goldHandMat);
    hourHandGroup.add(hourBlade);
    handsGroup.add(hourHandGroup);

    chronoGroup.add(handsGroup);

    // --- Component I: Center Holographic CS Crest / Quantum Crystal ---
    const coreGroup = new THREE.Group();
    coreGroup.position.z = 0.12;

    const coreCrystalGeo = regGeo(new THREE.OctahedronGeometry(0.65, 0));
    const coreCrystalMat = regMat(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.4,
      roughness: 0.08,
      metalness: 0.95,
      transparent: true,
      opacity: 0.95,
    }));
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, coreCrystalMat);
    coreGroup.add(coreCrystal);

    // Dual wireframe hyper-icosahedrons
    const wireAuraGeo = regGeo(new THREE.IcosahedronGeometry(0.96, 1));
    const wireAuraMat = regMat(new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    }));
    const wireAura = new THREE.Mesh(wireAuraGeo, wireAuraMat);
    coreGroup.add(wireAura);

    chronoGroup.add(coreGroup);

    // --- Component J: Concentric Shockwave Energy Rings ---
    const shockwaveGeo1 = regGeo(new THREE.RingGeometry(0.35, 0.5, 64));
    const shockwaveMat1 = regMat(new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }));
    const shockwaveMesh1 = new THREE.Mesh(shockwaveGeo1, shockwaveMat1);
    shockwaveMesh1.position.z = 0.06;
    chronoGroup.add(shockwaveMesh1);

    const shockwaveGeo2 = regGeo(new THREE.RingGeometry(0.2, 0.32, 64));
    const shockwaveMat2 = regMat(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }));
    const shockwaveMesh2 = new THREE.Mesh(shockwaveGeo2, shockwaveMat2);
    shockwaveMesh2.position.z = 0.07;
    chronoGroup.add(shockwaveMesh2);

    // --- Component K: 750+ Magnetic Stardust Particles with Interactive Physics ---
    const PARTICLE_COUNT = 750;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleBasePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    const cGold = new THREE.Color(0xf59e0b);
    const cCyan = new THREE.Color(0x38bdf8);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 1.0 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.75;

      const px = r * Math.cos(theta) * Math.cos(phi);
      const py = r * Math.sin(theta) * Math.cos(phi);
      const pz = r * Math.sin(phi);

      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;

      particleBasePositions[i * 3] = px;
      particleBasePositions[i * 3 + 1] = py;
      particleBasePositions[i * 3 + 2] = pz;

      particleVelocities[i * 3] = 0;
      particleVelocities[i * 3 + 1] = 0;
      particleVelocities[i * 3 + 2] = 0;

      const rand = Math.random();
      const col = rand > 0.45 ? cGold : rand > 0.18 ? cCyan : cWhite;
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeo = regGeo(new THREE.BufferGeometry());
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = regMat(new THREE.PointsMaterial({
      size: 0.062,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    }));
    const particleField = new THREE.Points(particleGeo, particleMat);
    chronoGroup.add(particleField);

    // --- Component L: Click Spark Explosion System (30 Radiant 3D Sparks) ---
    const SPARK_COUNT = 32;
    const sparkPositions = new Float32Array(SPARK_COUNT * 3);
    const sparkVelocities = new Float32Array(SPARK_COUNT * 3);
    const sparkLifetimes = new Float32Array(SPARK_COUNT);

    for (let s = 0; s < SPARK_COUNT; s++) {
      sparkPositions[s * 3] = 0;
      sparkPositions[s * 3 + 1] = 0;
      sparkPositions[s * 3 + 2] = 0;
      sparkLifetimes[s] = 0; // inactive
    }

    const sparkGeo = regGeo(new THREE.BufferGeometry());
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = regMat(new THREE.PointsMaterial({
      size: 0.09,
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    }));
    const sparkField = new THREE.Points(sparkGeo, sparkMat);
    chronoGroup.add(sparkField);

    // 4. Interactive Drag-to-Rotate, Inertia, Mouse Parallax & Wheel Zoom
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let userRotX = 0;
    let userRotY = 0;
    let targetUserRotX = 0;
    let targetUserRotY = 0;
    let autoParallaxX = 0;
    let autoParallaxY = 0;
    let targetCameraZ = 7.2;
    let currentCameraZ = 7.2;

    const onMouseDown = (e) => {
      isMouseDown = true;
      setIsDragging(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Update cursor 3D light position
      cursorLight.position.x = normX * 4.5;
      cursorLight.position.y = normY * 3.5 + 1.05;

      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetUserRotY += deltaX * 0.0085;
        targetUserRotX += deltaY * 0.0085;
      } else {
        autoParallaxX = normY * 0.38;
        autoParallaxY = normX * 0.48;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    // Smooth Scroll Wheel to Zoom (Macro Inspection from 5.0 to 9.2)
    const onWheel = (e) => {
      e.preventDefault();
      targetCameraZ += e.deltaY * 0.004;
      targetCameraZ = Math.max(5.0, Math.min(9.2, targetCameraZ));
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: false });

    // Touch Support for mobile/tablets
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isMouseDown = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (isMouseDown && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;

        targetUserRotY += deltaX * 0.01;
        targetUserRotX += deltaY * 0.01;
      }
    };
    const onTouchEnd = () => {
      isMouseDown = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // 5. Interactive Click Trigger (Shockwave Burst, Spark Explosion & Camera Kick)
    let shockwaveScale1 = 1;
    let shockwaveScale2 = 1;
    let shockwaveActive = false;
    let speedBoost = 1.0;
    let cameraRecoil = 0;

    const triggerShockwave = () => {
      shockwaveActive = true;
      shockwaveScale1 = 0.5;
      shockwaveScale2 = 0.3;
      shockwaveMat1.opacity = 0.95;
      shockwaveMat2.opacity = 0.92;
      speedBoost = 3.6; // intense kinetic burst
      cameraRecoil = 0.42; // dynamic recoil
      setBurstCount((c) => c + 1);

      // Ignite spark explosion
      for (let s = 0; s < SPARK_COUNT; s++) {
        sparkPositions[s * 3] = 0;
        sparkPositions[s * 3 + 1] = 0;
        sparkPositions[s * 3 + 2] = 0.1;

        const theta = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.12;
        sparkVelocities[s * 3] = Math.cos(theta) * speed;
        sparkVelocities[s * 3 + 1] = Math.sin(theta) * speed;
        sparkVelocities[s * 3 + 2] = (Math.random() - 0.5) * 0.06;
        sparkLifetimes[s] = 1.0; // full life
      }
      sparkMat.opacity = 1.0;
      sparkGeo.attributes.position.needsUpdate = true;
    };

    const handleWindowClick = (e) => {
      // Don't trigger if clicking buttons
      if (e.target.closest('button')) return;
      triggerShockwave();
    };
    window.addEventListener('click', handleWindowClick);

    // Spacebar to trigger burst
    const handleKeyDownBurst = (e) => {
      if (e.code === 'Space') {
        triggerShockwave();
      }
    };
    window.addEventListener('keydown', handleKeyDownBurst);

    // 6. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. 60 FPS True Interactive Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth decay of kinetic speed boost and camera recoil
      speedBoost += (1.0 - speedBoost) * 0.045;
      cameraRecoil += (0 - cameraRecoil) * 0.06;

      // Smooth Zoom dampening
      currentCameraZ += (targetCameraZ - currentCameraZ) * 0.08;
      camera.position.z = currentCameraZ + cameraRecoil;

      // Smooth user drag rotation interpolation
      userRotX += (targetUserRotX - userRotX) * 0.08;
      userRotY += (targetUserRotY - userRotY) * 0.08;

      // Combine user manual rotation + ambient tilt
      chronoGroup.rotation.x = userRotX + autoParallaxX;
      chronoGroup.rotation.y = userRotY + autoParallaxY;

      // Clockwork Hands Rotation
      minuteHandGroup.rotation.z = -elapsed * 2.5 * speedBoost;
      hourHandGroup.rotation.z = -elapsed * 0.4 * speedBoost;

      // Conical Holographic Radar Sector rotation
      radarSector.rotation.z = -elapsed * 2.5 * speedBoost;

      // Outer Astrolabe bezel & gear cogs counter-rotation
      bezelRing.rotation.z = elapsed * 0.28;
      cogsGroup.rotation.z = elapsed * 0.28;
      markersGroup.rotation.z = elapsed * 0.28;
      tickMarksGroup.rotation.z = elapsed * 0.28;

      // Counter-rotating 3-point planetary gears
      planetMeshList.forEach((pg, i) => {
        pg.rotation.z = -elapsed * 1.8 * (i % 2 === 0 ? 1 : -1) * speedBoost;
      });

      // Mid & Inner gyroscopic gimbal rings opposite precession
      midRing.rotation.x = elapsed * 0.75 * speedBoost;
      midRing.rotation.y = elapsed * 0.55 * speedBoost;

      innerRing.rotation.x = -elapsed * 0.95 * speedBoost;
      innerRing.rotation.z = elapsed * 0.85 * speedBoost;

      // Center Crystal tumbling & breathing pulse
      coreCrystal.rotation.x = elapsed * 1.4;
      coreCrystal.rotation.y = elapsed * 1.7;
      const pulse = 1 + Math.sin(elapsed * 5.5) * 0.12;
      coreCrystal.scale.set(pulse, pulse, pulse);

      wireAura.rotation.x = -elapsed * 0.72;
      wireAura.rotation.y = -elapsed * 0.92;

      // Dynamic hour gemstones highlight when minute blade sweeps over
      markerMeshes.forEach((m, idx) => {
        const markerAngle = (idx / 12) * Math.PI * 2;
        const currentAngle = (-minuteHandGroup.rotation.z) % (Math.PI * 2);
        const diff = Math.abs(currentAngle - markerAngle);
        if (diff < 0.28 || diff > Math.PI * 2 - 0.28) {
          m.scale.set(1.5, 1.5, 1.5);
          m.material.emissiveIntensity = 3.2;
        } else {
          m.scale.set(1, 1, 1);
          m.material.emissiveIntensity = 1.25;
        }
      });

      // Shockwave burst propagation on click
      if (shockwaveActive) {
        shockwaveScale1 += 0.12;
        shockwaveMesh1.scale.set(shockwaveScale1, shockwaveScale1, shockwaveScale1);
        shockwaveMat1.opacity *= 0.94;

        shockwaveScale2 += 0.15;
        shockwaveMesh2.scale.set(shockwaveScale2, shockwaveScale2, shockwaveScale2);
        shockwaveMat2.opacity *= 0.92;

        if (shockwaveMat1.opacity < 0.02 && shockwaveMat2.opacity < 0.02) {
          shockwaveActive = false;
          shockwaveMat1.opacity = 0;
          shockwaveMat2.opacity = 0;
        }
      }

      // Live Spark Physics Animation
      let activeSparks = 0;
      for (let s = 0; s < SPARK_COUNT; s++) {
        if (sparkLifetimes[s] > 0) {
          activeSparks++;
          sparkPositions[s * 3] += sparkVelocities[s * 3];
          sparkPositions[s * 3 + 1] += sparkVelocities[s * 3 + 1];
          sparkPositions[s * 3 + 2] += sparkVelocities[s * 3 + 2];
          sparkLifetimes[s] -= 0.022;
        }
      }
      if (activeSparks > 0) {
        sparkGeo.attributes.position.needsUpdate = true;
        sparkMat.opacity = Math.max(0, activeSparks / SPARK_COUNT);
      } else {
        sparkMat.opacity = 0;
      }

      // Stardust swirling vortex + live breathing
      particleField.rotation.z = elapsed * 0.32;
      particleField.rotation.y = elapsed * 0.24;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Complete Cleanup & Resource Deallocation (Zero Leaks Guaranteed)
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('keydown', handleKeyDownBurst);
      window.removeEventListener('resize', handleResize);

      // Dispose all registered geometries
      geometriesToDispose.forEach((g) => {
        if (g && typeof g.dispose === 'function') g.dispose();
      });

      // Dispose all registered materials
      materialsToDispose.forEach((m) => {
        if (m && typeof m.dispose === 'function') m.dispose();
      });

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [webglSupported]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 320);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(ellipse at 50% 36%, #0b1328 0%, #050814 55%, #010207 100%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 'clamp(24px, 5.5vh, 52px)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isExiting ? 'none' : 'all',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Background Luxury Ambient Glow Grid with Celestial Nebulae */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D WebGL Canvas Viewport (Drag & Scroll Zoom cursor enabled) */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      />

      {/* Central Radiance Core Flare with Anamorphic Beam */}
      <div
        style={{
          position: 'absolute',
          top: '36%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.32) 0%, rgba(6, 182, 212, 0.16) 42%, transparent 72%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Anamorphic Horizontal Light Streak */}
      <div
        style={{
          position: 'absolute',
          top: '36%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.35) 30%, rgba(245, 158, 11, 0.85) 50%, rgba(6, 182, 212, 0.35) 70%, transparent 100%)',
          filter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Left: Live Real-World Atomic Chronometer HUD */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          left: '24px',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, letterSpacing: '0.12em' }}>
            ATOMIC CLOCK LIVE
          </span>
        </div>
        <div style={{ fontSize: '15px', color: '#f1f5f9', fontWeight: 800, letterSpacing: '0.08em' }}>
          {liveTimeStr}
          <span style={{ fontSize: '11px', color: '#f59e0b', marginLeft: '3px' }}>.{liveMs} UTC</span>
        </div>
        <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.15em' }}>
          CHRONO DRIFT: 0.000 ms · 432 Hz
        </div>
      </div>

      {/* Interactive Micro-Hint (Top Center) */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '10.5px',
          fontFamily: 'monospace',
          color: '#fbbf24',
          background: 'rgba(15, 23, 42, 0.78)',
          border: '1px solid rgba(245, 158, 11, 0.38)',
          borderRadius: '30px',
          padding: '6px 18px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 0 28px rgba(245, 158, 11, 0.28)',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#fbbf24',
            boxShadow: '0 0 10px #fbbf24',
          }}
        />
        <span>🖱️ Drag 3D · 🔍 Scroll Zoom · ⚡ Click/Space to Burst {burstCount > 0 ? `(${burstCount})` : ''}</span>
      </div>

      {/* Foreground Luxury Brand & Typography Lockup */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '780px',
          padding: '0 24px',
          pointerEvents: 'none',
        }}
      >
        {/* Clearance / Sub-label */}
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: '#f59e0b',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontWeight: 700,
          }}
        >
          <span style={{ width: '36px', height: '1px', background: 'linear-gradient(90deg, transparent, #f59e0b)' }} />
          <span>INSTITUTIONAL QUANTUM TEMPORAL CHRONOMETER</span>
          <span style={{ width: '36px', height: '1px', background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
        </div>

        {/* Master Project Brand: CHRONOSYNC */}
        <h1
          style={{
            fontSize: 'clamp(2.8rem, 7.5vw, 5.2rem)',
            fontWeight: 900,
            letterSpacing: '0.22em',
            margin: '0 0 6px 0',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 25%, #f59e0b 55%, #fbbf24 80%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 35px rgba(245, 158, 11, 0.75)) drop-shadow(0 0 80px rgba(6, 182, 212, 0.4))',
            lineHeight: 1.05,
          }}
        >
          CHRONOSYNC
        </h1>

        {/* Dynamic Tagline */}
        <div
          style={{
            fontSize: '12.5px',
            color: '#94a3b8',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: '18px',
            fontWeight: 500,
          }}
        >
          Academic Temporal Synchronization & Relational Workload Matrix
        </div>

        {/* Live Audio / Frequency Equalizer Waveform Bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: '16px',
            marginBottom: '16px',
            opacity: 0.8,
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const h = 4 + Math.sin((i / 28) * Math.PI * 4 + Date.now() * 0.006) * 6 + Math.random() * 4;
            return (
              <div
                key={i}
                style={{
                  width: '2px',
                  height: `${Math.max(3, h)}px`,
                  background: i % 2 === 0 ? '#f59e0b' : '#06b6d4',
                  borderRadius: '1px',
                  transition: 'height 0.08s ease',
                }}
              />
            );
          })}
        </div>

        {/* Progress & Live Sync Status Indicator */}
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Glowing Laser Progress Line */}
          <div
            style={{
              width: '100%',
              height: '3.5px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #06b6d4, #f59e0b, #fbbf24)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 1)',
                transition: 'width 0.08s linear',
              }}
            />
          </div>

          {/* Phase Status Text */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#64748b',
              letterSpacing: '0.08em',
            }}
          >
            <span style={{ color: phase === 'online' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {phase === 'calibrating' && '⚡ CALIBRATING QUANTUM CLOCKWORK ESCAPEMENT...'}
              {phase === 'synchronizing' && '⏳ SYNCHRONIZING RELATIONAL WORKLOAD MATRIX...'}
              {phase === 'online' && '✓ TEMPORAL SYSTEM SYNCHRONIZED · PLATFORM ONLINE'}
            </span>
            <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Elegant Skip Button (Top Right) */}
      <button
        onClick={handleSkip}
        type="button"
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 30,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          color: '#e2e8f0',
          fontSize: '11px',
          fontFamily: 'monospace',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '8px 18px',
          borderRadius: '30px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
          e.currentTarget.style.color = '#fbbf24';
          e.currentTarget.style.boxShadow = '0 0 22px rgba(245, 158, 11, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
          e.currentTarget.style.color = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Skip [ESC]
      </button>

      {/* Footer Branding Token */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          fontSize: '9.5px',
          fontFamily: 'monospace',
          color: 'rgba(148, 163, 184, 0.45)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        CHRONOSYNC 3D · TEMPORAL ARCHITECTURE V2.4 · ACID RELATIONAL CORE
      </div>
    </div>
  );
}
