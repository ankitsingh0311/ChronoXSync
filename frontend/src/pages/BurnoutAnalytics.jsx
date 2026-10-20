// =============================================================================
// ChronoSync — Burnout Heatmap Analytics (BurnoutAnalytics.jsx)
// =============================================================================
// Aggregates weekly task density and study hours from SQL views and renders
// an interactive 16-week matrix with Power BI JSON schema export.
// =============================================================================

import React from 'react';
import Navbar from '../components/Navbar';
import BurnoutHeatmap from '../components/BurnoutHeatmap';

export default function BurnoutAnalytics() {
  return (
    <div>
      <Navbar
        title="Departmental Workload Density & Burnout Analytics"
        subtitle="16-week semester density matrix synthesized from real-time deliverable density & AI study estimates"
      />

      <BurnoutHeatmap initialProgram="ALL" showProgramFilter={true} />
    </div>
  );
}
