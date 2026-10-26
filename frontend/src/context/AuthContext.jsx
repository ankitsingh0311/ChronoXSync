// =============================================================================
// EduTrack 3D — Auth Context Provider (AuthContext.jsx)
// =============================================================================
// SUBJECT 4 (Cloud Security): React context for JWT auth state management.
// Provides login/logout/register functions and ProtectedRoute guards.
// Updated: login now sends { full_name, email, password, selected_role }
//          for backend role-identity verification (Step 5 of login pipeline).
// =============================================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem('edutrack_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('edutrack_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('edutrack_user');
        localStorage.removeItem('edutrack_token');
      }
    }
    setLoading(false);
  }, [token]);

  /**
   * Login with full identity verification.
   * Sends { full_name, email, password, selected_role, department, subject_taught, course_name } to backend.
   * Backend performs 5-step verification: email lookup → lockout check →
   * bcrypt verify → role match → name match → JWT issued.
   */
  const login = async (full_name, email, password, selected_role, extra = {}) => {
    const payload = (typeof full_name === 'object' && full_name !== null)
      ? full_name
      : { full_name, email, password, selected_role, ...extra };
    const res = await authAPI.login(payload);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('edutrack_token', newToken);
    localStorage.setItem('edutrack_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  /**
   * Register with Institutional_Directory cross-check.
   * Sends { full_name, email, password, selected_role, department, subject_taught, course_name } to backend.
   * Backend verifies email exists in ERP roster and role matches authorized_role.
   */
  const register = async (full_name, email, password, selected_role, department = 'Computer Science', extra = {}) => {
    const payload = (typeof full_name === 'object' && full_name !== null)
      ? full_name
      : { full_name, email, password, selected_role, department, ...extra };
    const res = await authAPI.register(payload);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('edutrack_token', newToken);
    localStorage.setItem('edutrack_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_user');
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('chronosync_vault_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    setToken(null);
    setUser(null);
  };

  const switchRole = (roleId, roleName) => {
    // Live viva demo: Role Switcher for testing different role dashboards
    if (user) {
      const updated = { ...user, role_id: roleId, role_name: roleName };
      setUser(updated);
      localStorage.setItem('edutrack_user', JSON.stringify(updated));
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('edutrack_user', JSON.stringify(merged));
      return merged;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('edutrack_user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (e) {
      // ignore if offline or guest
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, switchRole, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

