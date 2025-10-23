import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { VirtualSpace } from '../../types';
import apiService from '../../services/api';
import CreatePost from './CreatePost';
import PostList from './PostList';
import './Student.css';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [spaces, setSpaces] = useState<VirtualSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<VirtualSpace | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      const { spaces } = await apiService.getStudentSpaces();
      setSpaces(spaces);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    }
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
            <h3>My Spaces</h3>
            {spaces.length === 0 ? (
              <p className="empty-state">No spaces joined yet</p>
            ) : (
              spaces.map((space) => (
                <div
                  key={space._id}
                  className={`space-card ${selectedSpace?._id === space._id ? 'active' : ''}`}
                  onClick={() => handleSelectSpace(space)}
                >
                  <h4>{space.name}</h4>
                  <p className="space-code">Code: {space.spaceCode}</p>
                  <p className="space-tutor">
                    Tutor: {space.tutorId.firstName} {space.tutorId.lastName}
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
                <h2>{selectedSpace.name}</h2>
                <p>{selectedSpace.description}</p>
              </div>

              <CreatePost spaceId={selectedSpace._id} onPostCreated={() => {}} />

              <PostList spaceId={selectedSpace._id} isStudent={true} />
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
