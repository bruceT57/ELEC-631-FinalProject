import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { VirtualSpace } from '../../types';
import apiService from '../../services/api';
import CreatePost from './CreatePost';
import PostList from './PostList';
import './Student.css';

interface GroupedSpaces {
  [courseName: string]: {
    [week: string]: VirtualSpace[];
  };
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [spaces, setSpaces] = useState<VirtualSpace[]>([]);
  const [groupedSpaces, setGroupedSpaces] = useState<GroupedSpaces>({});
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [selectedSpace, setSelectedSpace] = useState<VirtualSpace | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      const { spaces } = await apiService.getStudentSpaces();
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
      
      const date = new Date(space.startTime);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
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

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { space } = await apiService.joinSpace(joinCode);
      setMessage(`Successfully joined "${space.name}"!`);
      setJoinCode('');
      await loadSpaces();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join space');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpace = (space: VirtualSpace) => {
    setSelectedSpace(space);
    setError('');
    setMessage('');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="join-space-section">
            <h3>Join a Space</h3>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <form onSubmit={handleJoinSpace}>
              <input
                type="text"
                placeholder="Enter space code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Joining...' : 'Join'}
              </button>
            </form>
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
            {Object.keys(groupedSpaces).length === 0 ? (
              <p className="empty-state">No spaces joined yet</p>
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
                                    onClick={() => handleSelectSpace(space)}
                                  >
                                    <h4>{space.name}</h4>
                                    <p className="space-tutor">
                                      Tutor: {space.tutorId?.firstName || 'Unknown'} {space.tutorId?.lastName || ''}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2>{selectedSpace.name}</h2>
                  <button 
                    className="refresh-btn" 
                    onClick={() => setRefreshTrigger(prev => prev + 1)} 
                    title="Refresh Posts"
                  >
                    ↻
                  </button>
                </div>
                <p>{selectedSpace.description}</p>
              </div>

              {selectedSpace.status !== 'archived' && (
                <CreatePost 
                  spaceId={selectedSpace._id} 
                  onPostCreated={() => setRefreshTrigger(prev => prev + 1)} 
                />
              )}

              <PostList 
                spaceId={selectedSpace._id} 
                isStudent={true} 
                refreshTrigger={refreshTrigger}
                spaceTutorId={(selectedSpace.tutorId as any)?._id || selectedSpace.tutorId?.id}
              />
            </>
          ) : (
            <div className="empty-state-main">
              <h2>Select a space or join one to get started</h2>
              <p>Use the space code provided by your tutor to join a discussion space</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
