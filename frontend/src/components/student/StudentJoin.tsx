import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import CreatePost from './CreatePost';
import PostList from './PostList';
import './Student.css';

interface SpaceInfo {
  _id: string;
  name: string;
  description?: string;
  tutorId: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

/**
 * StudentJoin Component
 * Anonymous student view - students join with just nickname and email
 * No authentication required
 */
const StudentJoin: React.FC = () => {
  const { spaceCode } = useParams<{ spaceCode: string }>();
  const [space, setSpace] = useState<SpaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student info form
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [participantId, setParticipantId] = useState('');

  useEffect(() => {
    // Check if already joined (stored in sessionStorage)
    const storedToken = sessionStorage.getItem(`space_${spaceCode}_token`);
    const storedParticipantId = sessionStorage.getItem(`space_${spaceCode}_participantId`);
    const storedNickname = sessionStorage.getItem(`space_${spaceCode}_nickname`);

    if (storedToken && storedParticipantId && storedNickname) {
      setSessionToken(storedToken);
      setParticipantId(storedParticipantId);
      setNickname(storedNickname);
      setIsJoined(true);
    }

    loadSpace();
  }, [spaceCode]);

  const loadSpace = async () => {
    try {
      setLoading(true);
      const { space } = await apiService.getSpaceByCode(spaceCode || '');
      setSpace(space);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load space');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !email.trim()) {
      setError('Please enter both nickname and email');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.joinSpaceAnonymous(spaceCode || '', {
        nickname: nickname.trim(),
        email: email.trim()
      });

      // Store session info
      sessionStorage.setItem(`space_${spaceCode}_token`, response.sessionToken);
      sessionStorage.setItem(`space_${spaceCode}_participantId`, response.participantId);
      sessionStorage.setItem(`space_${spaceCode}_nickname`, nickname.trim());

      setSessionToken(response.sessionToken);
      setParticipantId(response.participantId);
      setIsJoined(true);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join space');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    // Clear session
    sessionStorage.removeItem(`space_${spaceCode}_token`);
    sessionStorage.removeItem(`space_${spaceCode}_participantId`);
    sessionStorage.removeItem(`space_${spaceCode}_nickname`);

    setIsJoined(false);
    setSessionToken('');
    setParticipantId('');
    setNickname('');
    setEmail('');
  };

  if (loading && !space) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error && !space) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Error</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Space Not Found</h2>
          <p>The virtual space you're looking for doesn't exist or has been closed.</p>
        </div>
      </div>
    );
  }

  // If not joined yet, show join form
  if (!isJoined) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Rice OASUS Tutoring Tool</h1>
          <h2>Join: {space.name}</h2>

          {space.description && <p className="space-description">{space.description}</p>}

          <p className="tutor-info">
            Tutor: {space.tutorId.firstName} {space.tutorId.lastName}
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label htmlFor="nickname">Nickname *</label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                required
                maxLength={50}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Joining...' : 'Join Session'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Joined - show question posting interface
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Rice OASUS Tutoring Tool</h1>
          <h2>{space.name}</h2>
        </div>
        <div className="user-info">
          <span>Welcome, {nickname}!</span>
          <button onClick={handleLeave} className="btn-secondary">
            Leave Session
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="student-session">
          <div className="post-question-section">
            <h3>Ask a Question</h3>
            <CreatePost
              spaceId={space._id}
              participantId={participantId}
              sessionToken={sessionToken}
            />
          </div>

          <div className="questions-list">
            <PostList
              spaceId={space._id}
              sessionToken={sessionToken}
              isStudent={true}
              participantId={participantId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJoin;
