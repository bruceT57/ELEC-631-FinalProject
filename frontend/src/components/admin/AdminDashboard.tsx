import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArchivedSession } from '../../types';
import apiService from '../../services/api';
import './Admin.css';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [archivedSpaces, setArchivedSpaces] = useState<ArchivedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArchivedSpaces();
  }, []);

  const loadArchivedSpaces = async () => {
    setLoading(true);
    try {
      const { archivedSpaces } = await apiService.getArchivedSpaces();
      setArchivedSpaces(archivedSpaces);
    } catch (err) {
      console.error('Failed to load archived spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const details = await apiService.getArchivedSpaceDetails(sessionId);
      setSelectedSession(details);
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard - Archived Spaces</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h3>Archived Sessions</h3>
          {loading ? (
            <p>Loading...</p>
          ) : archivedSpaces.length === 0 ? (
            <p className="empty-state">No archived spaces yet</p>
          ) : (
            archivedSpaces.map((session) => (
              <div
                key={session._id}
                className={`archive-card ${selectedSession?.session?._id === session._id ? 'active' : ''}`}
                onClick={() => loadSessionDetails(session._id)}
              >
                <h4>{session.spaceId?.name || 'Unknown Space'}</h4>
                <p className="archive-date">
                  Archived: {new Date(session.archivedAt!).toLocaleDateString()}
                </p>
                <div className="archive-stats">
                  <span>Posts: {session.statistics.totalPosts}</span>
                  <span>Participants: {session.statistics.participantCount}</span>
                </div>
              </div>
            ))
          )}
        </aside>

        <main className="main-content">
          {selectedSession ? (
            <>
              <div className="archive-header">
                <h2>{selectedSession.data.space.name}</h2>
                <p>{selectedSession.data.space.description}</p>
                <div className="archive-meta">
                  <p>
                    <strong>Tutor:</strong>{' '}
                    {selectedSession.data.space.tutor?.firstName}{' '}
                    {selectedSession.data.space.tutor?.lastName}
                  </p>
                  <p>
                    <strong>Period:</strong>{' '}
                    {new Date(selectedSession.data.space.startTime).toLocaleString()} -{' '}
                    {new Date(selectedSession.data.space.endTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="statistics-panel">
                <h3>Session Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.totalPosts}
                    </div>
                    <div className="stat-label">Total Posts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.answeredPosts}
                    </div>
                    <div className="stat-label">Answered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.participantCount}
                    </div>
                    <div className="stat-label">Participants</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.averageDifficultyScore.toFixed(1)}
                    </div>
                    <div className="stat-label">Avg Difficulty</div>
                  </div>
                </div>
              </div>

              <div className="archived-posts">
                <h3>Posts ({selectedSession.data.posts.length})</h3>
                {selectedSession.data.posts.map((post: any, index: number) => (
                  <div key={index} className="archived-post-card">
                    <div className="post-header">
                      <strong>
                        {post.student?.firstName} {post.student?.lastName}
                      </strong>
                      <span className="post-time">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="post-content">
                      <p><strong>Q:</strong> {post.question}</p>
                      {post.isAnswered && (
                        <p className="tutor-response">
                          <strong>A:</strong> {post.tutorResponse}
                        </p>
                      )}
                    </div>
                    <div className="post-meta">
                      <span className="difficulty-badge">
                        {post.difficultyLevel} ({post.difficultyScore})
                      </span>
                      <span className="input-type-badge">{post.inputType}</span>
                      {post.isAnswered ? (
                        <span className="answered-badge">Answered</span>
                      ) : (
                        <span className="unanswered-badge">Unanswered</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state-main">
              <h2>Select an archived session to view details</h2>
              <p>View past tutoring sessions and their statistics</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
