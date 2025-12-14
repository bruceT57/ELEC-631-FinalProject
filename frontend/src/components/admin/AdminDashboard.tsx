import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArchivedSession } from '../../types';
import apiService from '../../services/api';
import UserManagement from './UserManagement';
import PendingApprovals from './PendingApprovals';
import './Admin.css';

type ActiveTab = 'archives' | 'users' | 'approvals';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('archives');
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
        <h1>Lumina - Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'archives' ? 'active' : ''}`}
          onClick={() => setActiveTab('archives')}
        >
          Archived Sessions
        </button>
        <button
          className={`tab-button ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Pending Approvals
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="dashboard-content">
          <UserManagement />
        </div>
      ) : activeTab === 'approvals' ? (
        <div className="dashboard-content">
          <PendingApprovals />
        </div>
      ) : (
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
              {/* Space Header - Same as Tutor View */}
              <div className="space-header">
                <div>
                  <h2>{selectedSession.data.space.name}</h2>
                  <p>{selectedSession.data.space.description}</p>
                  <p className="space-time">
                    {new Date(selectedSession.data.space.startTime).toLocaleString()} -{' '}
                    {new Date(selectedSession.data.space.endTime).toLocaleString()}
                  </p>
                  <p className="tutor-name" style={{ marginTop: '10px', color: '#666' }}>
                    <strong>Tutor:</strong>{' '}
                    {selectedSession.data.space.tutor?.firstName}{' '}
                    {selectedSession.data.space.tutor?.lastName}
                  </p>
                </div>
              </div>

              {/* Statistics Panel - Same as Tutor View */}
              <div className="statistics-panel">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.totalPosts}
                    </div>
                    <div className="stat-label">Total Questions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.answeredPosts}
                    </div>
                    <div className="stat-label">Answered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.totalPosts - selectedSession.session.statistics.answeredPosts}
                    </div>
                    <div className="stat-label">Unanswered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedSession.session.statistics.averageDifficultyScore.toFixed(1)}
                    </div>
                    <div className="stat-label">Avg Difficulty</div>
                  </div>
                </div>
              </div>

              {/* AI Session Summary - Same as Tutor View */}
              {selectedSession.data.space.aiSessionSummary && (
                <div className="session-summary-section" style={{ margin: '20px 0', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>🤖</span>
                      <h3 style={{ margin: 0, color: '#333' }}>AI Session Report</h3>
                    </div>
                  </div>
                  <div
                    className="ai-report-content"
                    style={{
                      backgroundColor: '#fafafa',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      lineHeight: '1.6',
                      color: '#333333',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ marginBottom: '15px', textAlign: 'center', borderBottom: '2px solid #673ab7', paddingBottom: '8px' }}>
                      <h2 style={{ color: '#673ab7', margin: '0 0 4px 0', fontSize: '1.4em' }}>Session Summary Report</h2>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.85em' }}>
                        Space: {selectedSession.data.space.name} | Archived: {new Date(selectedSession.session.archivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="markdown-body" dangerouslySetInnerHTML={{
                      __html: selectedSession.data.space.aiSessionSummary
                        .replace(/\n/g, '<br/>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^# (.*$)/gim, '<h3 style="color: #5e35b1; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 15px; margin-bottom: 8px; font-size: 1.2em;">$1</h3>')
                        .replace(/^## (.*$)/gim, '<h4 style="color: #5e35b1; margin-top: 12px; margin-bottom: 5px; font-size: 1.1em;">$1</h4>')
                        .replace(/^- (.*$)/gim, '<li style="margin-left: 15px; margin-bottom: 4px;">$1</li>')
                    }} />
                  </div>
                </div>
              )}

              {/* Posts List - Using post-list component styling */}
              <div className="post-list">
                <div className="post-list-header">
                  <h3>Questions ({selectedSession.data.posts.length})</h3>
                </div>
                {selectedSession.data.posts.length === 0 ? (
                  <p className="empty-state">No questions posted in this session</p>
                ) : (
                  selectedSession.data.posts.map((post: any, index: number) => (
                    <div key={index} className="post-card">
                      <div className="post-header">
                        <div className="post-author">
                          <strong>
                            {post.studentNickname || post.student?.nickname || post.student?.firstName || 'Unknown Student'}
                          </strong>
                          <span className="post-time">
                            {new Date(post.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="post-meta">
                          <span
                            className="difficulty-badge"
                            style={{
                              backgroundColor: post.difficultyLevel === 'easy' ? '#4caf50' :
                                              post.difficultyLevel === 'medium' ? '#ff9800' :
                                              post.difficultyLevel === 'hard' ? '#f44336' :
                                              post.difficultyLevel === 'very_hard' ? '#9c27b0' : '#757575'
                            }}
                          >
                            {post.difficultyLevel} ({post.difficultyScore})
                          </span>
                          <span className="input-type-badge">{post.inputType}</span>
                        </div>
                      </div>

                      <div className="post-content">
                        <p>{post.question}</p>
                        {post.mediaAttachments && post.mediaAttachments.length > 0 && (
                          <div className="attachments">
                            {post.mediaAttachments.map((attachment: any, idx: number) => (
                              <img
                                key={idx}
                                src={attachment.url}
                                alt={attachment.originalName}
                                className="attachment-preview"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {post.knowledgePoints && post.knowledgePoints.length > 0 && (
                        <div className="knowledge-points">
                          <strong>Topics:</strong>
                          {post.knowledgePoints.map((kp: any, idx: number) => (
                            <span key={idx} className="knowledge-tag">
                              {kp.topic}: {kp.concept}
                            </span>
                          ))}
                        </div>
                      )}

                      {post.aiHint && (
                        <div className="ai-hint-box" style={{
                          backgroundColor: '#f0f7ff',
                          padding: '15px',
                          margin: '10px 0',
                          borderRadius: '8px',
                          borderLeft: '4px solid #2196f3',
                          fontSize: '0.95em',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#1565c0', display: 'block', marginBottom: '5px' }}>💡 AI Hint:</strong>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>{post.aiHint}</p>
                          </div>

                          {post.keyConceptsDefinitions && post.keyConceptsDefinitions.length > 0 && (
                            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #e3f2fd' }}>
                              <strong style={{ color: '#1565c0', display: 'block', marginBottom: '8px' }}>📚 Key Concepts:</strong>
                              <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                                {post.keyConceptsDefinitions.map((def: any, idx: number) => (
                                  <li key={idx} style={{ marginBottom: '6px' }}>
                                    <strong>{def.term}:</strong> <span style={{ color: '#546e7a' }}>{def.definition}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {post.isAnswered ? (
                        <div className="tutor-response">
                          <strong>Tutor Response:</strong>
                          <p>{post.tutorResponse}</p>
                          <span className="answered-time">
                            Answered {new Date(post.answeredAt).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="unanswered-badge">Not Answered</div>
                      )}

                      {/* Student Comments Section */}
                      {post.studentComments && post.studentComments.length > 0 && (
                        <div className="student-comments-section">
                          <h4>Student Responses:</h4>
                          {post.studentComments.map((comment: any, idx: number) => (
                            <div key={idx} className="student-comment">
                              <div className="comment-header">
                                <strong>{comment.nickname}</strong>
                                <span className="comment-time">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="comment-text">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
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
      )}
    </div>
  );
};

export default AdminDashboard;
