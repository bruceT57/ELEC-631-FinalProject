import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArchivedSession } from '../../types';
import apiService from '../../services/api';
import './Admin.css';

interface GroupedSessions {
  [courseName: string]: {
    [week: string]: ArchivedSession[];
  };
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [archivedSpaces, setArchivedSpaces] = useState<ArchivedSession[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<GroupedSessions>({});
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  // Tutor Codes state
  const [view, setView] = useState<'archives' | 'codes' | 'tutors'>('archives');
  const [tutorCodes, setTutorCodes] = useState<any[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);

  // Tutors state
  const [tutors, setTutors] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);

  useEffect(() => {
    if (view === 'archives') {
      loadArchivedSpaces();
    } else if (view === 'codes') {
      loadTutorCodes();
    } else if (view === 'tutors') {
      loadTutors();
    }
  }, [view]);

  const loadTutors = async () => {
    setTutorsLoading(true);
    try {
      const { tutors } = await apiService.getTutors();
      setTutors(tutors);
    } catch (err) {
      console.error('Failed to load tutors:', err);
    } finally {
      setTutorsLoading(false);
    }
  };

  const toggleTutorStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this tutor?`)) return;
    
    try {
      await apiService.toggleUserStatus(userId, !currentStatus);
      loadTutors();
    } catch (err) {
      console.error('Failed to toggle tutor status:', err);
      alert('Failed to update tutor status');
    }
  };

  const handleDeleteTutor = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this tutor? This action cannot be undone.')) return;

    try {
      await apiService.deleteUser(userId);
      loadTutors();
    } catch (err) {
      console.error('Failed to delete tutor:', err);
      alert('Failed to delete tutor');
    }
  };

  const loadTutorCodes = async () => {
    setCodeLoading(true);
    try {
      const { codes } = await apiService.getTutorCodes();
      setTutorCodes(codes);
      setSelectedCodes([]); // Reset selection on reload
    } catch (err) {
      console.error('Failed to load tutor codes:', err);
    } finally {
      setCodeLoading(false);
    }
  };

  const generateCodes = async () => {
    try {
      const { codes } = await apiService.generateTutorCode(generateCount);
      await loadTutorCodes();
      downloadCSV(codes);
    } catch (err) {
      console.error('Failed to generate code:', err);
      alert('Failed to generate code');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm('Are you sure you want to delete this tutor code?')) return;

    try {
      await apiService.deleteTutorCode(codeId);
      loadTutorCodes();
    } catch (err) {
      console.error('Failed to delete code:', err);
      alert('Failed to delete code');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCodes.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCodes.length} selected codes?`)) return;

    try {
      await apiService.bulkDeleteTutorCodes(selectedCodes);
      loadTutorCodes();
    } catch (err) {
      console.error('Failed to delete codes:', err);
      alert('Failed to delete codes');
    }
  };

  const toggleSelectCode = (codeId: string) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCodes.length === tutorCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(tutorCodes.map(c => c._id));
    }
  };

  const downloadCSV = (codes: any[]) => {
    const headers = ['Code', 'Created At'];
    const rows = codes.map(c => [c.code, new Date(c.createdAt).toLocaleString()]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tutor_codes_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadArchivedSpaces = async () => {
    setLoading(true);
    try {
      const { archivedSpaces } = await apiService.getArchivedSpaces();
      setArchivedSpaces(archivedSpaces);
      groupSessions(archivedSpaces);
    } catch (err) {
      console.error('Failed to load archived spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupSessions = (sessions: ArchivedSession[]) => {
    const grouped: GroupedSessions = {};

    sessions.forEach(session => {
      // Use courseName if available, otherwise fallback to parsing name or "Other"
      const courseName = session.spaceId?.courseName || 'Other';
      
      // Calculate week (start of week)
      const date = new Date(session.archivedAt!);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday as start
      const weekKey = `Week of ${startOfWeek.toLocaleDateString()}`;

      if (!grouped[courseName]) {
        grouped[courseName] = {};
      }
      if (!grouped[courseName][weekKey]) {
        grouped[courseName][weekKey] = [];
      }
      grouped[courseName][weekKey].push(session);
    });

    setGroupedSessions(grouped);
  };

  const toggleCourse = (course: string) => {
    setExpandedCourses(prev => ({ ...prev, [course]: !prev[course] }));
  };

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const details = await apiService.getArchivedSpaceDetails(sessionId);
      setSelectedSession(details);
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this archived session?')) return;

    try {
      await apiService.deleteArchivedSession(sessionId);
      // Reload list
      loadArchivedSpaces();
      if (selectedSession?.session?._id === sessionId) {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Failed to delete session');
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard - {view === 'archives' ? 'Archived Spaces' : view === 'codes' ? 'Tutor Codes' : 'Manage Tutors'}</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="sidebar-nav">
            <button 
              className={`nav-btn ${view === 'archives' ? 'active' : ''}`}
              onClick={() => setView('archives')}
            >
              Archived Sessions
            </button>
            <button 
              className={`nav-btn ${view === 'codes' ? 'active' : ''}`}
              onClick={() => setView('codes')}
            >
              Tutor Codes
            </button>
            <button 
              className={`nav-btn ${view === 'tutors' ? 'active' : ''}`}
              onClick={() => setView('tutors')}
            >
              Manage Tutors
            </button>
          </div>
        </aside>

        <main className="main-content">
          {view === 'archives' ? (
            <div className="archives-container">
              <div className="archives-list-panel">
                <div className="sidebar-header">
                  <h3>Sessions List</h3>
                  <button 
                    className="refresh-btn" 
                    onClick={loadArchivedSpaces} 
                    title="Refresh List"
                  >
                    ↻
                  </button>
                </div>
                {loading ? (
                  <p>Loading...</p>
                ) : Object.keys(groupedSessions).length === 0 ? (
                  <p className="empty-state">No archived spaces yet</p>
                ) : (
                  <div className="session-tree">
                    {Object.entries(groupedSessions).map(([course, weeks]) => (
                      <div key={course} className="course-group">
                        <div 
                          className="course-header" 
                          onClick={() => toggleCourse(course)}
                        >
                          <span className="toggle-icon">{expandedCourses[course] ? '▼' : '▶'}</span>
                          <span className="course-name">{course}</span>
                        </div>
                        
                        {expandedCourses[course] && (
                          <div className="course-weeks">
                            {Object.entries(weeks).map(([week, sessions]) => (
                              <div key={week} className="week-group">
                                <div 
                                  className="week-header"
                                  onClick={() => toggleWeek(`${course}-${week}`)}
                                >
                                  <span className="toggle-icon">{expandedWeeks[`${course}-${week}`] ? '▼' : '▶'}</span>
                                  <span className="week-name">{week}</span>
                                </div>

                                {expandedWeeks[`${course}-${week}`] && (
                                  <div className="week-sessions">
                                    {sessions.map(session => (
                                      <div
                                        key={session._id}
                                        className={`archive-card ${selectedSession?.session?._id === session._id ? 'active' : ''}`}
                                        onClick={() => loadSessionDetails(session._id)}
                                      >
                                        <div className="card-header">
                                          <h4>{session.spaceId?.name || 'Unknown Space'}</h4>
                                          <button 
                                            className="delete-btn"
                                            onClick={(e) => handleDeleteSession(session._id, e)}
                                            title="Delete Session"
                                          >
                                            ×
                                          </button>
                                        </div>
                                        <p className="archive-date">
                                          {new Date(session.archivedAt!).toLocaleDateString()}
                                        </p>
                                        <div className="archive-stats">
                                          <span>Posts: {session.statistics.totalPosts}</span>
                                          <span>Participants: {session.statistics.participantCount}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="archives-detail-panel">
                {selectedSession ? (
                  <>
                    <div className="archive-header">
                      <h2>{selectedSession.data.space.name}</h2>
                      <p>{selectedSession.data.space.description}</p>
                      <div className="archive-meta">
                        <p>
                          <strong>Tutor:</strong>{' '}
                          {selectedSession.data.space.tutor?.firstName || 'Unknown'}{' '}
                          {selectedSession.data.space.tutor?.lastName || ''}
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
                            
                            {/* Display Replies */}
                            {post.replies && post.replies.length > 0 && (
                              <div className="archived-replies" style={{ marginTop: '10px', paddingLeft: '15px', borderLeft: '3px solid #eee' }}>
                                <h5 style={{ margin: '5px 0', color: '#666' }}>Replies:</h5>
                                {post.replies.map((reply: any, rIndex: number) => {
                                  const tutorId = selectedSession.data.space.tutor?._id || selectedSession.data.space.tutor?.id;
                                  const replyAuthorId = reply.author?._id || reply.author?.id;
                                  const isTutor = tutorId && replyAuthorId && String(tutorId) === String(replyAuthorId);
                                  
                                  return (
                                    <div 
                                      key={rIndex} 
                                      className={`archived-reply ${isTutor ? 'tutor-reply' : ''}`}
                                      style={{ 
                                        marginBottom: '8px', 
                                        padding: '8px', 
                                        background: isTutor ? '#e3f2fd' : '#f9f9f9', 
                                        borderRadius: '4px',
                                        borderLeft: isTutor ? '3px solid #2196f3' : 'none'
                                      }}
                                    >
                                      <div className="reply-header" style={{ fontSize: '0.85em', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                          <strong>{reply.author?.firstName || 'Unknown'} {reply.author?.lastName || 'User'}</strong>
                                          {isTutor && (
                                            <span style={{ 
                                              backgroundColor: '#2196f3', 
                                              color: 'white', 
                                              padding: '2px 6px', 
                                              borderRadius: '4px', 
                                              fontSize: '0.8em', 
                                              marginLeft: '6px' 
                                            }}>
                                              Tutor
                                            </span>
                                          )}
                                        </div>
                                        <span className="reply-time" style={{ color: '#888' }}>{new Date(reply.createdAt).toLocaleString()}</span>
                                      </div>
                                      <p style={{ margin: 0 }}>{reply.content}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Fallback for old tutorResponse field */}
                            {post.isAnswered && post.tutorResponse && (!post.replies || post.replies.length === 0) && (
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
                  <div className="select-session-placeholder">
                    <p>Select a session from the list to view details</p>
                  </div>
                )}
              </div>
            </div>
          ) : view === 'codes' ? (
            <div className="codes-management">
              <div className="codes-header">
                <h2>Tutor Registration Codes</h2>
                <div className="generate-controls">
                  {selectedCodes.length > 0 && (
                    <button 
                      onClick={handleBulkDelete} 
                      className="btn-danger"
                      style={{ marginRight: '15px' }}
                    >
                      Delete Selected ({selectedCodes.length})
                    </button>
                  )}
                  <button 
                    className="refresh-btn" 
                    onClick={loadTutorCodes} 
                    title="Refresh List"
                    style={{ marginRight: '15px' }}
                  >
                    ↻
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={generateCount} 
                    onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                    className="count-input"
                  />
                  <button onClick={generateCodes} className="btn-primary">
                    Generate & Download CSV
                  </button>
                </div>
              </div>

              {codeLoading ? (
                <p>Loading codes...</p>
              ) : (
                <div className="codes-table-container">
                  <table className="codes-table">
                    <thead>
                      <tr>
                        <th>
                          <input 
                            type="checkbox" 
                            checked={selectedCodes.length === tutorCodes.length}
                            onChange={toggleSelectAll}
                            className="select-all-checkbox"
                          />
                        </th>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Used By</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorCodes.map((code: any) => (
                        <tr key={code._id} className={code.isUsed ? 'used-row' : 'active-row'}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedCodes.includes(code._id)}
                              onChange={() => toggleSelectCode(code._id)}
                              className="select-code-checkbox"
                            />
                          </td>
                          <td className="code-cell">{code.code}</td>
                          <td>
                            <span className={`status-badge ${code.isUsed ? 'used' : 'active'}`}>
                              {code.isUsed ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td>
                            {code.isUsed ? (
                              `${code.usedBy?.firstName} ${code.usedBy?.lastName} (${code.usedBy?.email})`
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{new Date(code.createdAt).toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn-small btn-danger"
                              onClick={() => handleDeleteCode(code._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : view === 'tutors' ? (
            <div className="codes-management">
              <div className="codes-header">
                <h2>Manage Tutors</h2>
                <button 
                  className="refresh-btn" 
                  onClick={loadTutors} 
                  title="Refresh List"
                >
                  ↻
                </button>
              </div>

              {tutorsLoading ? (
                <p>Loading tutors...</p>
              ) : (
                <div className="codes-table-container">
                  <table className="codes-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutors.map((tutor: any) => (
                        <tr key={tutor._id} className={tutor.isActive === false ? 'used-row' : ''}>
                          <td>{tutor.firstName} {tutor.lastName}</td>
                          <td>{tutor.email}</td>
                          <td>{tutor.username}</td>
                          <td>
                            <span className={`status-badge ${tutor.isActive !== false ? 'active' : 'used'}`}>
                              {tutor.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className={`btn-small ${tutor.isActive !== false ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => toggleTutorStatus(tutor._id, tutor.isActive !== false)}
                              >
                                {tutor.isActive !== false ? 'Suspend' : 'Activate'}
                              </button>
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteTutor(tutor._id)}
                                style={{ marginLeft: '8px' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
