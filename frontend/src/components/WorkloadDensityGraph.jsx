// =============================================================================
// ChronoSync — Workload Density & Stress Trajectory Graph (WorkloadDensityGraph.jsx)
// =============================================================================
// Replaces the 3D Stress Orb with a precision SVG Workload Density Spline Graph.
// Grounded in DESIGN.md:
//   - Hairline-only depth (1px subtle hairlines, zero blurry drop shadows)
//   - Cursor Orange (#f54e00) accent voltage for critical peak zones
//   - Timeline pastels for load distribution (Peach, Mint, Blue, Lavender)
//   - JetBrains Mono coordinates, timestamps, and workload metrics
// =============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, AlertTriangle, Clock, Calendar, CheckCircle2,
  Activity, Zap, Info, ChevronRight, BarChart2
} from 'lucide-react';

export default function WorkloadDensityGraph({ stressLevel = 'MODERATE', pendingCount = 5, deadlines = [], exams = [] }) {
  const [activePoint, setActivePoint] = useState(null);
  const [viewMode, setViewMode] = useState('spline'); // 'spline' | 'breakdown'

  // Map 7-day trajectory points based on real deadlines and scheduled exams
  const graphData = useMemo(() => {
    // 7-day distribution buckets (Sun=0, Mon=1, ..., Sat=6)
    const dayBuckets = {
      0: { name: 'Sun', tasks: [], exams: [], load: 0 },
      1: { name: 'Mon', tasks: [], exams: [], load: 0 },
      2: { name: 'Tue', tasks: [], exams: [], load: 0 },
      3: { name: 'Wed', tasks: [], exams: [], load: 0 },
      4: { name: 'Thu', tasks: [], exams: [], load: 0 },
      5: { name: 'Fri', tasks: [], exams: [], load: 0 },
      6: { name: 'Sat', tasks: [], exams: [], load: 0 },
    };

    let hasRealItems = false;

    if (Array.isArray(deadlines) && deadlines.length > 0) {
      deadlines.forEach(d => {
        if (!d.due_date) return;
        try {
          const date = new Date(d.due_date);
          const dayIdx = date.getDay();
          const hrs = d.study_hours || (d.urgency === 'CRITICAL' ? 6 : d.urgency === 'HIGH' ? 4 : 2.5);
          dayBuckets[dayIdx].tasks.push(d);
          dayBuckets[dayIdx].load += hrs;
          hasRealItems = true;
        } catch (_) {}
      });
    }

    if (Array.isArray(exams) && exams.length > 0) {
      exams.forEach(e => {
        if (!e.exam_date) return;
        try {
          const date = new Date(e.exam_date);
          const dayIdx = date.getDay();
          const hrs = e.prep_hours || ((e.exam_type || '').includes('FINAL') ? 8 : (e.exam_type || '').includes('MID') ? 6 : 4);
          dayBuckets[dayIdx].exams.push(e);
          dayBuckets[dayIdx].load += hrs;
          hasRealItems = true;
        } catch (_) {}
      });
    }

    const orderedWeek = [1, 2, 3, 4, 5, 6, 0];

    if (hasRealItems) {
      return orderedWeek.map(idx => {
        const b = dayBuckets[idx];
        const totalItems = b.tasks.length + b.exams.length;
        let label = 'Independent Study';
        if (b.exams.length > 0) {
          label = `${b.exams[0].exam_type || 'Exam'} (${b.exams[0].course_code || 'Exam'})`;
        } else if (b.tasks.length > 0) {
          label = b.tasks[0].title;
        }
        return {
          day: b.name,
          load: Math.min(10, Math.round(b.load * 10) / 10),
          tasks: totalItems,
          label
        };
      });
    }

    // Baseline term pacing based on active stress level
    const baseMultiplier = stressLevel === 'CRITICAL' ? 2.5 : stressLevel === 'HIGH' ? 1.8 : stressLevel === 'MODERATE' ? 1.0 : 0.6;
    return [
      { day: 'Mon', load: Math.round(1.2 * baseMultiplier * 10) / 10, tasks: 0, label: 'Course Lectures' },
      { day: 'Tue', load: Math.round(1.8 * baseMultiplier * 10) / 10, tasks: 0, label: 'Lab Practicum' },
      { day: 'Wed', load: Math.round(2.2 * baseMultiplier * 10) / 10, tasks: 0, label: 'Mid-Week Review' },
      { day: 'Thu', load: Math.round(1.6 * baseMultiplier * 10) / 10, tasks: 0, label: 'Tutorial Study' },
      { day: 'Fri', load: Math.round(2.6 * baseMultiplier * 10) / 10, tasks: 0, label: 'Deliverable Wrap-up' },
      { day: 'Sat', load: Math.round(0.8 * baseMultiplier * 10) / 10, tasks: 0, label: 'Self Study' },
      { day: 'Sun', load: 0.0, tasks: 0, label: 'Rest & Buffer' },
    ];
  }, [stressLevel, deadlines, exams]);

  const peakPoint = useMemo(() => {
    return graphData.reduce((max, pt) => (pt.load > max.load ? pt : max), graphData[0]);
  }, [graphData]);

  // SVG dimensions
  const width = 560;
  const height = 190;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Convert points to SVG coordinates
  const coords = useMemo(() => {
    return graphData.map((pt, i) => {
      const x = paddingX + (i / (graphData.length - 1)) * graphWidth;
      const y = height - paddingY - (pt.load / 10) * graphHeight;
      return { ...pt, x, y };
    });
  }, [graphData]);

  // Generate smooth SVG Cubic Bezier Path
  const splinePath = useMemo(() => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [coords]);

  const areaPath = useMemo(() => {
    if (!splinePath) return '';
    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const bottomY = height - paddingY;
    return `${splinePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [splinePath, coords]);

  // Color mappings based on stress level
  const statusColor = stressLevel === 'CRITICAL' ? '#cf2d56' : stressLevel === 'HIGH' ? '#f54e00' : stressLevel === 'MODERATE' ? '#c08532' : '#1f8a65';
  const statusBg = stressLevel === 'CRITICAL' ? 'rgba(207, 45, 86, 0.1)' : stressLevel === 'HIGH' ? 'rgba(245, 78, 0, 0.1)' : stressLevel === 'MODERATE' ? 'rgba(192, 133, 50, 0.1)' : 'rgba(31, 138, 101, 0.1)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <Activity size={16} style={{ color: statusColor }} />
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              Workload Density Trajectory
            </h3>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: statusBg,
              color: statusColor,
              border: `1px solid ${statusColor}33`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {stressLevel} STRAIN
            </span>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Kinetic spline monitoring cognitive saturation & deadline clustering
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-tertiary)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setViewMode('spline')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'spline' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'spline' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: viewMode === 'spline' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Spline
          </button>
          <button
            onClick={() => setViewMode('breakdown')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'breakdown' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'breakdown' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: viewMode === 'breakdown' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Load Heat
          </button>
        </div>
      </div>

      {/* Main Graph Visualization */}
      <div style={{ flex: 1, minHeight: '190px', position: 'relative' }}>
        {viewMode === 'spline' ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                {/* Smooth Area Gradient */}
                <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={statusColor} stopOpacity="0.28" />
                  <stop offset="60%" stopColor={statusColor} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={statusColor} stopOpacity="0.0" />
                </linearGradient>

                {/* Critical Stress Warning Threshold Line */}
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1f8a65" />
                  <stop offset="40%" stopColor="#c08532" />
                  <stop offset="75%" stopColor={statusColor} />
                  <stop offset="100%" stopColor="#1f8a65" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines (Hairline depth) */}
              {[2, 5, 8].map((level) => {
                const y = height - paddingY - (level / 10) * graphHeight;
                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="var(--hairline)"
                      strokeWidth="1"
                      strokeDasharray={level === 8 ? "3 3" : "none"}
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fill="var(--text-muted)"
                      fontSize="9px"
                      fontFamily="var(--font-mono)"
                      textAnchor="end"
                    >
                      {level}h
                    </text>
                  </g>
                );
              })}

              {/* Area Under Curve */}
              <path d={areaPath} fill="url(#splineGradient)" />

              {/* Spline Stroke Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                d={splinePath}
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points / Milestone Nodes */}
              {coords.map((pt, i) => {
                const isHovered = activePoint === i;
                const isPeak = pt.load >= 4;
                return (
                  <g key={i}>
                    {/* Pulsing halo on peak nodes */}
                    {isPeak && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : isPeak ? 4.5 : 3.5}
                      fill={isHovered ? statusColor : 'var(--bg-card)'}
                      stroke={statusColor}
                      strokeWidth={isHovered ? 2.5 : 2}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => setActivePoint(i)}
                      onMouseLeave={() => setActivePoint(null)}
                    />
                    {/* Day X-Axis Label */}
                    <text
                      x={pt.x}
                      y={height - 6}
                      fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                      fontSize="10px"
                      fontFamily="var(--font-mono)"
                      fontWeight={isHovered ? 600 : 400}
                      textAnchor="middle"
                    >
                      {pt.day}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Hover Tooltip */}
            {activePoint !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: `${(coords[activePoint].x / width) * 100}%`,
                  top: `${(coords[activePoint].y / height) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ fontWeight: 600 }}>{coords[activePoint].day}: {coords[activePoint].label}</div>
                <div style={{ fontSize: '10px', opacity: 0.85 }}>
                  Load: {coords[activePoint].load}h · {coords[activePoint].tasks} Deliverable(s)
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Breakdown View (Histogram style) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', height: '100%', alignItems: 'flex-end', paddingTop: '10px', paddingBottom: '20px' }}>
            {graphData.map((pt, i) => {
              const heightPct = Math.max(12, (pt.load / 10) * 100);
              const isPeak = pt.load >= 4;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {pt.load}h
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    background: isPeak ? 'var(--primary)' : 'var(--bg-tertiary)',
                    border: `1px solid ${isPeak ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                  }} />
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {pt.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Telemetry Metrics Strip (Cursor Developer Style) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '12px',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Peak Velocity
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {peakPoint?.load || 0} hrs / {peakPoint?.day || '-'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Saturation
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: statusColor, marginTop: '2px' }}>
            {pendingCount} Tasks Queued
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Risk Index
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {stressLevel === 'CRITICAL' ? 'High Overload' : stressLevel === 'HIGH' ? 'Elevated' : 'Balanced'}
          </div>
        </div>
      </div>
    </div>
  );
}
