// =============================================================================
// ChronoSync — 3D Focus Timer & Study Estimator (FocusTimerPage.jsx)
// =============================================================================
// Interactive 3D Pomodoro timer synchronized with keyword-driven study
// duration forecasting and cognitive recovery interval suggestions.
// =============================================================================

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import FocusTimer from '../components/3d/FocusTimer';
import { estimateAPI } from '../services/api';
import { Sparkles, Calculator, CheckCircle2, Layers } from 'lucide-react';

export default function FocusTimerPage() {
  const [taskTitle, setTaskTitle] = useState('Data Structures AVL Trees Assignment');
  const [taskDesc, setTaskDesc] = useState('Implement rotations, calculate balance factors, and test edge cases.');
  const [urgency, setUrgency] = useState('HIGH');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await estimateAPI.getEstimate(taskTitle, taskDesc, urgency);
      setEstimate(res.data.estimate);
    } catch (err) {
      console.error('Estimate failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Pomodoro Focus & Workload Estimator"
        subtitle="Neuro-ergonomic focus cycles with keyword-driven workload forecasting"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left Column: 3D Focus Timer */}
        <div>
          <FocusTimer />
        </div>

        {/* Right Column: AI Study Hours Estimator */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
              Workload Estimator
            </h2>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.45' }}>
            Calculates estimated completion hours by tokenizing technical assignment keywords (e.g. "AVL Trees", "Socket", "Lab") and applying pace multipliers.
          </p>

          <form onSubmit={handleEstimate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Assignment Title
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Task Details / Keywords
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
                Urgency Multiplier
              </label>
              <select
                className="input-field"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="LOW">LOW (0.8x pace)</option>
                <option value="MEDIUM">MEDIUM (1.0x baseline)</option>
                <option value="HIGH">HIGH (1.3x intensity)</option>
                <option value="CRITICAL">CRITICAL (1.6x sprint)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', height: '40px', marginTop: '4px' }}
            >
              <Calculator size={15} />
              <span>{loading ? 'Analyzing Tokens...' : 'Calculate Study Plan'}</span>
            </button>
          </form>

          {/* Estimate Breakdown Card */}
          {estimate && (
            <div style={{
              marginTop: '18px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Forecast Output:</span>
                <span className="badge badge-done">
                  {estimate.estimated_hours} Hours Total
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>Keywords: <code style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{estimate.matched_keywords?.join(', ') || 'General Assignment'}</code></div>
                <div>Recommended Cycles: <strong>{estimate.pomodoro_sessions} x 25-minute Pomodoros</strong></div>
                <div>Scheduled Breaks: <strong>{estimate.recommended_breaks} recovery intervals</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
