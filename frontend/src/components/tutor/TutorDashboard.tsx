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
    courseName: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Grouping state
  type GroupedSpaces = {
    [course: string]: {
      [week: string]: VirtualSpace[];
    };
  };
  const [groupedSpaces, setGroupedSpaces] = useState<GroupedSpaces>({});
  const [expandedCourses, setExpandedCourses] = useState<{ [key: string]: boolean }>({});
  const [expandedWeeks, setExpandedWeeks] = useState<{ [key: string]: boolean }>({});

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
      groupSpaces(spaces);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    }
  };

  const groupSpaces = (spaces: VirtualSpace[]) => {
    const grouped: GroupedSpaces = {};

    spaces.forEach(space => {
      const courseName = space.courseName || 'Other';
      
      // Calculate week (start of week based on startTime)
      const date = new Date(space.startTime);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday as start
      const weekKey = `Week of ${startOfWeek.toLocaleDateString()}`;

      if (!grouped[courseName]) {
        grouped[courseName] = {};
      }
      if (!grouped[courseName][weekKey]) {
        grouped[courseName][weekKey] = [];
      }
      grouped[courseName][weekKey].push(space);
    });

    setGroupedSpaces(grouped);
  };

  const toggleCourse = (course: string) => {
    setExpandedCourses(prev => ({ ...prev, [course]: !prev[course] }));
  };

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));
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
      setFormData({ name: '', courseName: '', description: '', startTime: '', endTime: '' });
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
                    placeholder="e.g. Week 1 Discussion"
                  />
                </div>

                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="e.g. MATH 101"
                    pattern="^[A-Z]+ \d+$"
                    title="Format: ALL CAPS COURSE + SPACE + NUMBER (e.g. MATH 101)"
                  />
                  <small className="form-hint">Format: MATH 101 (All Caps + Space + Number)</small>
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
            <div className="sidebar-header">
              <h3>My Spaces</h3>
              <button 
                className="refresh-btn" 
                onClick={loadSpaces} 
                title="Refresh List"
              >
                ↻
              </button>
            </div>
            {spaces.length === 0 ? (
              <p className="empty-state">No spaces created yet</p>
            ) : (
              <div className="session-tree">
                {Object.entries(groupedSpaces).map(([course, weeks]) => (
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
                        {Object.entries(weeks).map(([week, spaces]) => (
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
                                {spaces.map(space => (
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
        </aside>

        <main className="main-content">
          {selectedSpace ? (
            <>
              <div className="space-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2>{selectedSpace.name}</h2>
                    <button 
                      className="refresh-btn" 
                      onClick={loadSpaceDetails} 
                      title="Refresh Details"
                    >
                      ↻
                    </button>
                  </div>
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

              <PostList 
                spaceId={selectedSpace._id} 
                isStudent={false} 
                spaceTutorId={(user as any)?._id || user?.id}
              />
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
