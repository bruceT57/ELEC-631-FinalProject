import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import apiService from '../../services/api';
import './Admin.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.TUTOR
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { users } = await apiService.getAllUsers();
      setUsers(users);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const { message } = await apiService.createUser(formData);
      setSuccess(message);
      setShowCreateModal(false);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const updates = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      };
      const { message } = await apiService.updateUser(editingUser._id, updates);
      setSuccess(message);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const { message } = await apiService.deleteUser(userId);
      setSuccess(message);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const { message } = await apiService.resetUserPassword(userId, newPassword);
      setSuccess(message);
      setShowResetPassword(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    setShowCreateModal(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: UserRole.TUTOR
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    resetForm();
  };

  const getStatistics = () => {
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const tutors = users.filter(u => u.role === UserRole.TUTOR).length;
    return { total: users.length, admins, tutors };
  };

  const stats = getStatistics();

  return (
    <div className="user-management-v2">
      {/* Header */}
      <div className="um-v2-header">
        <div>
          <h2>User Management</h2>
          <p className="um-v2-subtitle">Manage tutors and administrators</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setEditingUser(null);
            cancelEdit();
          }}
          className="btn-primary"
          disabled={loading}
        >
          + Create New User
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="um-v2-stats">
        <div className="um-v2-stat">
          <span className="um-v2-stat-label">Total Users</span>
          <span className="um-v2-stat-value">{stats.total}</span>
        </div>
        <div className="um-v2-stat">
          <span className="um-v2-stat-label">Tutors</span>
          <span className="um-v2-stat-value">{stats.tutors}</span>
        </div>
        <div className="um-v2-stat">
          <span className="um-v2-stat-label">Administrators</span>
          <span className="um-v2-stat-value">{stats.admins}</span>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Search and Filter */}
      <div className="um-v2-controls">
        <div className="um-v2-search">
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="um-v2-filter">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value={UserRole.TUTOR}>Tutors Only</option>
            <option value={UserRole.ADMIN}>Admins Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="um-v2-table-container">
        {loading && users.length === 0 ? (
          <div className="um-v2-loading">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-v2-empty">
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <table className="um-v2-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th className="um-v2-actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="um-v2-user-name">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="um-v2-username">@{user.username}</td>
                  <td className="um-v2-email">{user.email}</td>
                  <td>
                    <span className={`um-v2-badge um-v2-badge-${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="um-v2-actions">
                      <button
                        onClick={() => startEdit(user)}
                        className="um-v2-btn um-v2-btn-edit"
                        disabled={loading}
                        title="Edit user"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowResetPassword(user._id)}
                        className="um-v2-btn um-v2-btn-reset"
                        disabled={loading}
                        title="Reset password"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.username)}
                        className="um-v2-btn um-v2-btn-delete"
                        disabled={loading}
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="um-v2-modal-overlay" onClick={() => {
          setShowCreateModal(false);
          cancelEdit();
        }}>
          <div className="um-v2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-v2-modal-header">
              <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button
                className="um-v2-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  cancelEdit();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="um-v2-modal-body">
                <div className="um-v2-form-row">
                  <div className="um-v2-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="um-v2-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="um-v2-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="um-v2-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                {!editingUser && (
                  <div className="um-v2-form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      disabled={loading}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                )}

                <div className="um-v2-form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    disabled={loading}
                  >
                    <option value={UserRole.TUTOR}>Tutor</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>
              </div>

              <div className="um-v2-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    cancelEdit();
                  }}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="um-v2-modal-overlay" onClick={() => setShowResetPassword(null)}>
          <div className="um-v2-modal um-v2-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="um-v2-modal-header">
              <h3>Reset Password</h3>
              <button
                className="um-v2-modal-close"
                onClick={() => {
                  setShowResetPassword(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                ×
              </button>
            </div>

            <div className="um-v2-modal-body">
              <div className="um-v2-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>
              <div className="um-v2-form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="um-v2-error-text">Passwords do not match</p>
              )}
            </div>

            <div className="um-v2-modal-footer">
              <button
                onClick={() => {
                  setShowResetPassword(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(showResetPassword)}
                className="btn-primary"
                disabled={loading || !newPassword || newPassword !== confirmPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
