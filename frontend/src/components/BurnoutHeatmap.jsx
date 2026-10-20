// =============================================================================
// ChronoSync — Burnout Heatmap & Executive Telemetry (BurnoutHeatmap.jsx)
// =============================================================================
// Aggregates database deadlines density and estimated study hours across
// a 16-week semester matrix. Provides HOD and Faculty with real-time visual
// telemetry graphs to identify peak student stress weeks and export to Power BI.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI } from '../services/api';
import {
  Activity, Flame, Download, RefreshCw, Layers, ShieldCheck,
  AlertTriangle, Clock, Calendar, CheckCircle2, BookOpen,
  TrendingUp, BarChart2, Filter, ChevronRight, X, ExternalLink
} from 'lucide-react';

const STRESS_COLORS = {
  CRITICAL: {
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.45)',
    text: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.22)',
    glow: '0 0 16px rgba(239, 68, 68, 0.25)',
  },
  HIGH: {
    bg: 'rgba(249, 115, 22, 0.14)',
    border: 'rgba(249, 115, 22, 0.4)',
    text: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    glow: '0 0 12px rgba(249, 115, 22, 0.2)',
  },
  MODERATE: {
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    text: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    glow: 'none',
  },
  BALANCED: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    text: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    glow: 'none',
  },
};

export default function BurnoutHeatmap({ initialProgram = 'ALL', showProgramFilter = true }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(initialProgram);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchHeatmap = async (prog = selectedProgram) => {
    try {
      setIsLoading(true);
      const res = await analyticsAPI.getHeatmap({ program: prog === 'ALL' ? undefined : prog });
      setHeatmapData(res.data?.heatmap || []);
      setTelemetry(res.data || null);
      if (res.data?.heatmap?.length > 0 && !selectedWeek) {
        // Default select highest burnout week or week 8
        const highest = res.data.highest_burnout_week;
        const defaultWeek = highest ? res.data.heatmap.find(h => h.week_number === highest.week_number) : res.data.heatmap[7];
        setSelectedWeek(defaultWeek || res.data.heatmap[0]);
      }
    } catch (err) {
      console.error('Failed to load burnout heatmap telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(selectedProgram);
  }, [selectedProgram]);

  const handleProgramChange = (prog) => {
    setSelectedProgram(prog);
  };

  const handleExportPowerBI = async () => {
    try {
      setIsExporting(true);
      const res = await analyticsAPI.getPowerBIDataset({ program: selectedProgram === 'ALL' ? undefined : selectedProgram });
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ChronoSync_PowerBI_Burnout_Telemetry_${selectedProgram}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Power BI export failed:', err);
      alert('Failed to export Power BI dataset: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyEndpoint = () => {
    const fullUrl = `${window.location.origin}/api/analytics/powerbi-dataset`;
    navigator.clipboard.writeText(fullUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // SVG Graph Dimensions & calculations
  const graphWidth = 800;
  const graphHeight = 150;
  const paddingX = 40;
  const paddingY = 25;
  const innerW = graphWidth - paddingX * 2;
  const innerH = graphHeight - paddingY * 2;

  const maxHours = Math.max(35, ...(heatmapData.map(h => h.total_study_hours || 0)));

  const points = heatmapData.map((h, i) => {
    const x = paddingX + (i / 15) * innerW;
    const y = graphHeight - paddingY - (h.total_study_hours / maxHours) * innerH;
    return { x, y, ...h };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${graphHeight - paddingY} L ${points[0].x} ${graphHeight - paddingY} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Command Header */}
      <div className="glass-card" style={{
        padding: '22px 26px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
            flexShrink: 0
          }}>
            <Flame size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.22)',
                color: '#ef4444',
                fontWeight: 700
              }}>
                Live Executive Telemetry
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Power BI & DAX Ready · 16-Week Academic Matrix
              </span>
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)'
            }}>
              Semester Student Burnout Heatmap
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Real-time aggregation of assignment density and AI study hour workload estimates across all 16 semester weeks.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchHeatmap()}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCopyEndpoint}
            className="btn btn-secondary"
            title="Copy Power BI REST endpoint URL"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={13} />
            <span>{copySuccess ? 'Copied URL!' : 'Power BI URL'}</span>
          </button>

          <button
            onClick={handleExportPowerBI}
            disabled={isExporting}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderColor: '#ef4444',
              color: '#fff',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Download size={13} />
            <span>{isExporting ? 'Exporting...' : 'Export Power BI Dataset'}</span>
          </button>
        </div>
      </div>

      {/* Program Filter Bar (if enabled) */}
      {showProgramFilter && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '4px' }}>
            Academic Cohort:
          </span>
          {['ALL', 'Core CSE', 'AIML', 'Data Science', 'Cyber Security', 'Cloud Computing'].map((prog) => {
            const active = selectedProgram === prog;
            return (
              <button
                key={prog}
                onClick={() => handleProgramChange(prog)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: active ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  background: active ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
                  color: active ? '#ef4444' : 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {prog === 'ALL' ? '🌐 All Department Programs' : prog}
              </button>
            );
          })}
        </div>
      )}

      {/* Top 4 KPI Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Highest Stress Peak
            </span>
            <Flame size={15} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Week {telemetry?.highest_burnout_week?.week_number || '-'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
            {telemetry?.highest_burnout_week?.total_study_hours || 0}h Combined Workload ({telemetry?.highest_burnout_week?.burnout_index || 0}% Burnout)
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {telemetry?.highest_burnout_week?.task_count || 0} Tasks · {telemetry?.highest_burnout_week?.exam_count || 0} Exams Scheduled
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '3px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Peak Stress Weeks
            </span>
            <AlertTriangle size={15} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {telemetry?.peak_stress_weeks?.length || 0} Weeks
          </div>
          <div style={{ fontSize: '11.5px', color: '#f97316', fontWeight: 600, marginTop: '2px' }}>
            Weeks {telemetry?.peak_stress_weeks?.length > 0 ? telemetry.peak_stress_weeks.join(', ') : 'None'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Deliverables & Exam Bottlenecks
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Semester Workload
            </span>
            <Clock size={15} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {telemetry?.total_semester_study_hours || 0} hrs
          </div>
          <div style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 600, marginTop: '2px' }}>
            Across 16 Weeks
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {telemetry?.total_active_deadlines || 0} Tasks · {telemetry?.total_scheduled_exams || 0} Exams in Database
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Burnout Index
            </span>
            <ShieldCheck size={15} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {telemetry?.average_burnout_index || 0}%
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
            {telemetry?.average_burnout_index > 50 ? 'High Cohort Load' : 'Moderate Safe Threshold'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-Time Relational Aggregation
          </div>
        </div>
      </div>

      {/* Visual Workload Trajectory Curve (SVG Graph) */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#ef4444" />
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              16-Week Semester Workload Trajectory & Stress Peaks
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Peak Stress Week
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> Study Hours Trend
            </span>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            style={{ width: '100%', minWidth: '650px', height: '160px', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="burnoutAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.38" />
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="burnoutStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="45%" stopColor="#ef4444" />
                <stop offset="65%" stopColor="#3b82f6" />
                <stop offset="90%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guidelines */}
            <line x1={paddingX} y1={paddingY} x2={graphWidth - paddingX} y2={paddingY} stroke="var(--border-subtle)" strokeDasharray="3 3" opacity="0.6" />
            <line x1={paddingX} y1={graphHeight / 2} x2={graphWidth - paddingX} y2={graphHeight / 2} stroke="var(--border-subtle)" strokeDasharray="3 3" opacity="0.6" />
            <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - paddingX} y2={graphHeight - paddingY} stroke="var(--border-subtle)" opacity="0.8" />

            {/* Area under curve */}
            {areaD && <path d={areaD} fill="url(#burnoutAreaGrad)" />}

            {/* Curve path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#burnoutStrokeGrad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((p) => {
              const isSelected = selectedWeek?.week_number === p.week_number;
              const pointColor = p.is_peak ? '#ef4444' : (p.stress_level === 'HIGH' ? '#f97316' : (p.total_study_hours > 0 ? '#3b82f6' : '#10b981'));

              return (
                <g key={p.week_number} onClick={() => setSelectedWeek(p)} style={{ cursor: 'pointer' }}>
                  {p.is_peak && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      fill="#ef4444"
                      opacity="0.25"
                      style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 6 : (p.is_peak ? 5 : 3.5)}
                    fill={isSelected ? '#ffffff' : pointColor}
                    stroke={pointColor}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  {/* Week label on X-axis */}
                  <text
                    x={p.x}
                    y={graphHeight - 6}
                    textAnchor="middle"
                    fill={isSelected ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                    fontWeight={isSelected ? 700 : 400}
                  >
                    W{p.week_number}
                  </text>
                  {/* Hours tooltip badge if peak or selected */}
                  {(p.is_peak || isSelected) && p.total_study_hours > 0 && (
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill={p.is_peak ? '#ef4444' : '#3b82f6'}
                      fontSize="9.5"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                    >
                      {p.total_study_hours}h
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 16-Week Heatmap Grid & Drill-Down Detail Drawer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedWeek ? 'minmax(400px, 1.8fr) 1.2fr' : '1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Heatmap 16-Cell Matrix */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--primary)" />
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                16-Week Academic Deliverable Heatmap Matrix
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any week to inspect real database assignments & exams
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '10px',
          }}>
            {heatmapData.map((week) => {
              const isSelected = selectedWeek?.week_number === week.week_number;
              const styleTheme = STRESS_COLORS[week.stress_level] || STRESS_COLORS.BALANCED;
              const itemsCount = (week.deliverables_count !== undefined) ? week.deliverables_count : (week.task_count || 0);

              return (
                <motion.div
                  key={week.week_number}
                  whileHover={{ y: -3, scale: 1.02 }}
                  onClick={() => setSelectedWeek(week)}
                  style={{
                    background: isSelected ? styleTheme.bg : 'var(--bg-card)',
                    border: isSelected
                      ? `2px solid ${styleTheme.text}`
                      : `1px solid ${styleTheme.border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px',
                    position: 'relative',
                    boxShadow: isSelected ? styleTheme.glow : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top: Week Number & Peak Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}>
                      W{week.week_number.toString().padStart(2, '0')}
                    </span>
                    {week.is_peak && (
                      <span style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: '#ef444422',
                        color: '#ef4444',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Flame size={10} /> PEAK
                      </span>
                    )}
                  </div>

                  {/* Center: Hours & Items Count */}
                  <div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      color: styleTheme.text,
                      lineHeight: '1.1'
                    }}>
                      {week.total_study_hours}h
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {itemsCount > 0
                        ? `${week.task_count || 0} Tasks · ${week.exam_count || 0} Exams`
                        : '0 Deliverables'}
                    </div>
                  </div>

                  {/* Bottom: Burnout Index & Stress Label */}
                  <div style={{
                    marginTop: '2px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: styleTheme.text
                    }}>
                      {week.burnout_index}% Index
                    </span>
                    <span style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: styleTheme.badgeBg,
                      color: styleTheme.text,
                      fontWeight: 600
                    }}>
                      {week.stress_level}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Week Drill-Down Panel */}
        {selectedWeek && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card"
            style={{
              padding: '22px',
              border: `1px solid ${STRESS_COLORS[selectedWeek.stress_level]?.border || 'var(--border-subtle)'}`,
              background: 'var(--bg-card)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: STRESS_COLORS[selectedWeek.stress_level]?.text,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Week {selectedWeek.week_number} Investigation
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedWeek.week_label}
                </h4>
              </div>
              <button
                onClick={() => setSelectedWeek(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Week Summary Telemetry Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              marginBottom: '14px',
              fontSize: '11.5px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Workload Hours:</span>
                <strong style={{ color: 'var(--text-primary)', marginLeft: '6px' }}>{selectedWeek.total_study_hours} hrs</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Burnout Score:</span>
                <strong style={{ color: STRESS_COLORS[selectedWeek.stress_level]?.text, marginLeft: '6px' }}>{selectedWeek.burnout_index}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Deliverables:</span>
                <strong style={{ color: 'var(--text-primary)', marginLeft: '6px' }}>
                  {(selectedWeek.deliverables_count !== undefined ? selectedWeek.deliverables_count : selectedWeek.task_count) || 0} Total ({selectedWeek.task_count || 0}T, {selectedWeek.exam_count || 0}E)
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Stress Rating:</span>
                <strong style={{ color: STRESS_COLORS[selectedWeek.stress_level]?.text, marginLeft: '6px' }}>{selectedWeek.stress_level}</strong>
              </div>
            </div>

            {/* Detailed Lists: Exams & Coursework Deliverables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto' }}>
              {/* Scheduled Exams Section */}
              {selectedWeek.exams && selectedWeek.exams.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flame size={13} /> Scheduled Examinations ({selectedWeek.exams.length})
                  </div>
                  {selectedWeek.exams.map((exam, i) => (
                    <div
                      key={exam.exam_id || i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontWeight: 700
                        }}>
                          {exam.exam_type} EXAM
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {exam.course_code}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exam.course_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>📍 {exam.venue || exam.room_number || 'Main Examination Hall'} · 📅 {exam.exam_date}</span>
                        <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {exam.prep_hours} hrs prep
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coursework Tasks Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BookOpen size={13} /> Coursework Deliverables ({selectedWeek.tasks?.length || 0})
                </div>

                {(!selectedWeek.tasks || selectedWeek.tasks.length === 0) && (!selectedWeek.exams || selectedWeek.exams.length === 0) ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 6px', opacity: 0.8 }} />
                    <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Optimal Academic Pacing</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px' }}>
                      No hard assignments or exams scheduled in database for this week. Regular lecture study.
                    </p>
                  </div>
                ) : (!selectedWeek.tasks || selectedWeek.tasks.length === 0) ? (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '11.5px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    No coursework assignments due this week (exam preparation active).
                  </div>
                ) : (
                  selectedWeek.tasks.map((task, i) => (
                    <div
                      key={task.deadline_id || i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          fontWeight: 600
                        }}>
                          {task.course_code}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: task.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                          color: task.urgency === 'CRITICAL' ? '#ef4444' : '#f97316',
                          fontWeight: 700
                        }}>
                          {task.urgency}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.3' }}>
                        {task.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>{task.course_name} · 📅 {task.due_date}</span>
                        <span style={{ color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {task.study_hours} hrs
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
