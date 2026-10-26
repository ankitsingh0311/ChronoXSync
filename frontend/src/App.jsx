// =============================================================================
// EduTrack 3D — Main React Application (App.jsx)
// =============================================================================
// SUBJECT 2 (System Design): Decoupled 3-Tier Client-Server architecture.
// Integrates Theme Engine, JWT AuthContext, ProtectedRoute RBAC guards,
// Spatial Glassmorphic layouts, and Three.js canvas components.
// =============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoleDashboardRouter from './pages/RoleDashboardRouter';
import CRDashboard from './pages/CRDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HODDashboard from './pages/HODDashboard';
import DeadlinesFeed from './pages/DeadlinesFeed';
import CRCommandPortal from './pages/CRCommandPortal';
import ExamManager from './pages/ExamManager';
import BurnoutAnalytics from './pages/BurnoutAnalytics';
import PanicTriage from './pages/PanicTriage';
import PanicPage from './pages/PanicPage';
import FocusTimerPage from './pages/FocusTimerPage';
import UserManagement from './pages/UserManagement';
import AIChatbot from './pages/AIChatbot';
import NoticeBoard from './pages/NoticeBoard';
import FacultyAssignCR from './pages/FacultyAssignCR';
import CRAssignmentsInbox from './pages/CRAssignmentsInbox';
import AuditHistory from './pages/AuditHistory';
import CryptoVerifierTerminal from './components/CryptoVerifierTerminal';
import StudentProfile from './pages/StudentProfile';

function AppLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage || !user) {
    return children;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary fallbackTitle="Application View Error">
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<Login />} />

              {/* Dynamic Role-Adaptive Dashboard Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleDashboardRouter />
                  </ProtectedRoute>
                }
              />

              {/* Direct Role Dashboard Routes */}
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cr-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[2, 4]}>
                    <CRDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[3, 4]}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hod-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[4]}>
                    <HODDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notices"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                    <NoticeBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deadlines"
                element={
                  <ProtectedRoute>
                    <DeadlinesFeed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timer"
                element={
                  <ProtectedRoute>
                    <FocusTimerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panic"
                element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <PanicPage />
                  </ProtectedRoute>
                }
              />

              {/* Personal Information & Student / CR Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />

              {/* Feature F8: AI Report Analyst & Copilot (NVIDIA Nemotron 3.5 Super-VL 120B) */}
              <Route
                path="/ai-assistant"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                    <AIChatbot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
                    <AIChatbot />
                  </ProtectedRoute>
                }
              />

              {/* CR Command Portal (F6 OCR + F2 Conflict Trigger) */}
              <Route
                path="/cr-portal"
                element={
                  <ProtectedRoute allowedRoles={[2, 4]}>
                    <CRCommandPortal />
                  </ProtectedRoute>
                }
              />

              {/* Faculty Exam Schedule Publisher */}
              <Route
                path="/exams"
                element={
                  <ProtectedRoute allowedRoles={[3, 4]}>
                    <ExamManager />
                  </ProtectedRoute>
                }
              />

              {/* Faculty Coursework Delegation to CR */}
              <Route
                path="/faculty/assign-cr"
                element={
                  <ProtectedRoute allowedRoles={[3, 4]}>
                    <FacultyAssignCR />
                  </ProtectedRoute>
                }
              />

              {/* CR Faculty Assignments Inbox & Batch Publisher */}
              <Route
                path="/cr/faculty-assignments"
                element={
                  <ProtectedRoute allowedRoles={[2, 4]}>
                    <CRAssignmentsInbox />
                  </ProtectedRoute>
                }
              />

              {/* Task, Assignment & Account History Console (Faculty, CR, HOD, Student) */}
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <AuditHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logged"
                element={
                  <ProtectedRoute>
                    <AuditHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login-logs"
                element={
                  <ProtectedRoute>
                    <AuditHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-history"
                element={
                  <ProtectedRoute>
                    <AuditHistory />
                  </ProtectedRoute>
                }
              />

              {/* HOD Analytics & Triage */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={[3, 4]}>
                    <BurnoutAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panic-logs"
                element={
                  <ProtectedRoute allowedRoles={[4]}>
                    <PanicTriage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={[4]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* Cryptographic Proof of Submission SHA-256 Verifier Terminal (Faculty & HOD Exclusive) */}
              <Route
                path="/verify-receipt"
                element={
                  <ProtectedRoute allowedRoles={[3, 4]}>
                    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                      <CryptoVerifierTerminal embedded={false} />
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Fallback & Root Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </>
  );
}
