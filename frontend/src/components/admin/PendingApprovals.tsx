import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import apiService from '../../services/api';
import './Admin.css';

const PendingApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const { pendingUsers } = await apiService.getPendingUsers();
      setPendingUsers(pendingUsers);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, username: string) => {
    if (!window.confirm(`Approve user "${username}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const { message } = await apiService.approveUser(userId);
      setSuccess(message);
      await loadPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!window.confirm(`Reject and delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const { message } = await apiService.rejectUser(userId);
      setSuccess(message);
      await loadPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pending-approvals">
      <div className="approvals-header">
        <div>
          <h2>Pending User Approvals</h2>
          <p className="approvals-subtitle">Review and approve new user registrations</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="approvals-container">
        {loading && pendingUsers.length === 0 ? (
          <div className="approvals-loading">Loading pending users...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="approvals-empty">
            <div className="empty-icon">✓</div>
            <h3>No pending approvals</h3>
            <p>All user registrations have been reviewed</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {pendingUsers.map((user) => (
              <div key={user._id} className="approval-card">
                <div className="approval-card-header">
                  <div className="approval-user-icon">
                    {user.role === 'admin' ? '👑' : '👨‍🏫'}
                  </div>
                  <div className="approval-user-info">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p className="approval-username">@{user.username}</p>
                  </div>
                  <span className={`approval-badge approval-badge-${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>

                <div className="approval-card-body">
                  <div className="approval-info-row">
                    <span className="approval-label">Email</span>
                    <span className="approval-value">{user.email}</span>
                  </div>
                  <div className="approval-info-row">
                    <span className="approval-label">Registered</span>
                    <span className="approval-value">
                      {new Date(user.createdAt!).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="approval-card-actions">
                  <button
                    onClick={() => handleApprove(user._id, user.username)}
                    className="approval-btn approval-btn-approve"
                    disabled={loading}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(user._id, user.username)}
                    className="approval-btn approval-btn-reject"
                    disabled={loading}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
