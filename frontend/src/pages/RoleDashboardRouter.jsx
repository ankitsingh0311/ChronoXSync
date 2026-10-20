// =============================================================================
// EduTrack 3D — Role-Adaptive Dashboard Router (RoleDashboardRouter.jsx)
// =============================================================================
// Dynamically inspects the authenticated user's verified role and renders
// their dedicated, customized dashboard:
//   - HOD (Role 4): HODDashboard (Executive Governance, Heatmap, Triage)
//   - Faculty (Role 3): FacultyDashboard (Console, Exam Publisher, Milestones)
//   - CR (Role 2): CRDashboard (Batch Command Hub, Timetable OCR, Broadcast)
//   - Student (Role 1): Dashboard (Student Workload, 3D Stress Orb, Submissions)
// =============================================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import Dashboard from './Dashboard';
import CRDashboard from './CRDashboard';
import FacultyDashboard from './FacultyDashboard';
import HODDashboard from './HODDashboard';

export default function RoleDashboardRouter() {
  const { user } = useAuth();

  const roleId = user?.role_id;
  const roleName = (user?.role_name || '').toUpperCase();

  // Role 4: Head of Department
  if (roleId === 4 || roleName === 'HOD') {
    return (
      <ErrorBoundary fallbackTitle="HOD Executive Dashboard Error">
        <HODDashboard />
      </ErrorBoundary>
    );
  }

  // Role 3: Faculty Member / Professor
  if (roleId === 3 || roleName === 'FACULTY') {
    return (
      <ErrorBoundary fallbackTitle="Faculty Console Error">
        <FacultyDashboard />
      </ErrorBoundary>
    );
  }

  // Role 2: Class Representative (CR)
  if (roleId === 2 || roleName === 'CR') {
    return (
      <ErrorBoundary fallbackTitle="CR Command Hub Error">
        <CRDashboard />
      </ErrorBoundary>
    );
  }

  // Role 1 (or default): Student Workload & Deadline Dashboard
  return (
    <ErrorBoundary fallbackTitle="Student Dashboard Error">
      <Dashboard />
    </ErrorBoundary>
  );
}

