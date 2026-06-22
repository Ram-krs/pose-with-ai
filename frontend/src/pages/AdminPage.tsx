import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminStats, User } from '../types';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [statsRes, usersRes] = await Promise.all([adminApi.stats(), adminApi.users()]);
    setStats(statsRes.data);
    setUsers(usersRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: number) => {
    await adminApi.toggleActive(id);
    load();
  };

  if (loading) return <div className="loading-spinner">Loading admin dashboard...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage users and monitor AI performance</p>

      {stats && (
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.active_users}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.total_photos}</div>
            <div className="stat-label">Photos Captured</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.total_analyses}</div>
            <div className="stat-label">AI Analyses</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.avg_pose_score}%</div>
            <div className="stat-label">Avg Pose Score</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.avg_overall_score}</div>
            <div className="stat-label">Avg Overall Score</div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>User Management</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>Username</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Admin</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{u.id}</td>
                <td style={{ padding: '0.75rem' }}>{u.username}</td>
                <td style={{ padding: '0.75rem' }}>{u.email}</td>
                <td style={{ padding: '0.75rem' }}>{u.is_admin ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="tag" style={{
                    background: u.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: u.is_active ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {!u.is_admin && (
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => toggleActive(u.id)}>
                      Toggle Active
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
