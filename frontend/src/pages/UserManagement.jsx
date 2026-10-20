// =============================================================================
// ChronoSync — HOD User Governance & RBAC (UserManagement.jsx)
// =============================================================================
// User access control console to manage student roles and promote candidates
// to Class Representatives (CR) with bcrypt-authenticated sessions.
// =============================================================================

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userAPI } from '../services/api';
import { Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePromote = async (userId, targetRoleId) => {
    try {
      await userAPI.promote(userId, targetRoleId);
      setMessage(`User #${userId} authorization successfully updated to Role ID ${targetRoleId}.`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  return (
    <div>
      <Navbar
        title="Department Personnel & RBAC"
        subtitle="HOD authorization console to administer Class Representative roles"
      />

      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
              Personnel Registry ({users.length} Users)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Authorized department personnel directory and role-based access management
            </p>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--semantic-success-bg)',
            border: '1px solid var(--semantic-success-border)',
            color: 'var(--semantic-success)',
            fontSize: '12.5px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{
                textAlign: 'left',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.04em',
              }}>
                <th style={{ padding: '10px 14px' }}>USER ID</th>
                <th style={{ padding: '10px 14px' }}>NAME</th>
                <th style={{ padding: '10px 14px' }}>INSTITUTIONAL EMAIL</th>
                <th style={{ padding: '10px 14px' }}>ROLE</th>
                <th style={{ padding: '10px 14px' }}>DEPARTMENT</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isStudent = u.role_id === 1;
                const isCR = u.role_id === 2;

                return (
                  <tr
                    key={u.user_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      #{u.user_id}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {u.full_name}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${
                        u.role_id === 4 ? 'critical' : u.role_id === 3 ? 'high' : u.role_id === 2 ? 'medium' : 'low'
                      }`}>
                        {u.role_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {u.department}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {isStudent && (
                        <button
                          onClick={() => handlePromote(u.user_id, 2)}
                          className="btn btn-primary"
                          style={{ height: '30px', padding: '0 10px', fontSize: '11.5px' }}
                        >
                          <ArrowUpRight size={13} /> Promote to CR
                        </button>
                      )}
                      {isCR && (
                        <button
                          onClick={() => handlePromote(u.user_id, 1)}
                          className="btn btn-ghost"
                          style={{ height: '30px', padding: '0 10px', fontSize: '11.5px' }}
                        >
                          Demote to Student
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
