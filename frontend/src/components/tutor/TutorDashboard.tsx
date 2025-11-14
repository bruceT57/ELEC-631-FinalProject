import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { VirtualSpace } from '../../types';
import apiService from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import PostList from '../student/PostList';
import './Tutor.css';

const TutorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [spaces, setSpaces] = useState<VirtualSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<VirtualSpace | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpace) {
      loadSpaceDetails();
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    try {
      const { spaces } = await apiService.getTutorSpaces();
      setSpaces(spaces);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    }
  };

  const loadSpaceDetails = async () => {
    if (!selectedSpace) return;

    setDetailsLoading(true);
    setDetailsError('');
    setKnowledgeSummary('');
    setStatistics(null);

    try {
      const [summaryData, statsData] = await Promise.all([
        apiService.getKnowledgeSummary(selectedSpace._id),
        apiService.getPostStatistics(selectedSpace._id)
      ]);

      // Handle knowledge summary - could be array or string
      if (Array.isArray(summaryData.summary)) {
        const summaryText = summaryData.summary
          .map((item: any) => `${item.point}: ${item.count} occurrences`)
          .join('\n');
        setKnowledgeSummary(summaryText);
      } else {
        setKnowledgeSummary(summaryData.summary || '');
      }

      // Handle statistics
      if (statsData.statistics) {
        const stats = statsData.statistics;
        setStatistics({
          total: stats.total || 0,
          answered: stats.answered || 0,
          unanswered: stats.unanswered || 0,
          averageScore: stats.avgDifficulty || stats.averageScore || 0
        });
      }
    } catch (err: any) {
      console.error('Failed to load space details:', err);
      setDetailsError(err.response?.data?.error || 'Failed to load space details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.createSpace(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', startTime: '', endTime: '' });
      await loadSpaces();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="dashboard tutor-dashboard">
      <header className="dashboard-header">
        <h1>Tutor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="create-space-section">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Create New Space'}
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateSpace} className="create-space-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Space Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Space'}
                </button>
              </form>
            )}
          </div>

          <div className="spaces-list">
            <h3>My Spaces</h3>
            {spaces.length === 0 ? (
              <p className="empty-state">No spaces created yet</p>
            ) : (
              spaces.map((space) => (
                <div
                  key={space._id}
                  className={`space-card ${selectedSpace?._id === space._id ? 'active' : ''}`}
                  onClick={() => setSelectedSpace(space)}
                >
                  <h4>{space.name}</h4>
                  <p className="space-code">Code: {space.spaceCode}</p>
                  <p className="participant-count">
                    Participants: {space.participants.length}
                  </p>
                  <span className={`status-badge ${space.status}`}>{space.status}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="main-content">
          {selectedSpace ? (
            <>
              <div className="space-header">
                <div>
                  <h2>{selectedSpace.name}</h2>
                  <p>{selectedSpace.description}</p>
                  <p className="space-time">
                    {new Date(selectedSpace.startTime).toLocaleString()} -{' '}
                    {new Date(selectedSpace.endTime).toLocaleString()}
                  </p>
                </div>
                <div className="qr-code-section">
                  <h4>Space QR Code</h4>
                  <img
                    src={selectedSpace.qrCode}
                    alt="QR Code"
                    className="qr-code"
                  />
                  <p className="space-code-display">Code: {selectedSpace.spaceCode}</p>
                </div>
              </div>

              {detailsError && <div className="error-message">{detailsError}</div>}

              {detailsLoading && <div className="loading">Loading space details...</div>}

              {statistics && (
                <div className="statistics-panel">
                  <h3>Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{statistics.total}</div>
                      <div className="stat-label">Total Questions</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{statistics.answered}</div>
                      <div className="stat-label">Answered</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{statistics.unanswered}</div>
                      <div className="stat-label">Unanswered</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {statistics.averageScore.toFixed(1)}
                      </div>
                      <div className="stat-label">Avg Difficulty</div>
                    </div>
                  </div>
                </div>
              )}

              {knowledgeSummary && (
                <div className="knowledge-summary">
                  <h3>Knowledge Points Summary</h3>
                  <div
                    className="summary-content"
                    dangerouslySetInnerHTML={{ __html: knowledgeSummary.replace(/\n/g, '<br/>') }}
                  />
                </div>
              )}

              <PostList spaceId={selectedSpace._id} isStudent={false} />
            </>
          ) : (
            <div className="empty-state-main">
              <h2>Select a space or create a new one</h2>
              <p>Create virtual discussion spaces for your students</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorDashboard;
