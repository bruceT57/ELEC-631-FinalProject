import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import './Auth.css';

interface SpaceData {
  _id: string;
  name: string;
  description?: string;
  spaceCode: string;
  tutorId: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

const JoinSpace: React.FC = () => {
  const { spaceCode } = useParams<{ spaceCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      // Store the space code to redirect after login
      sessionStorage.setItem('redirectSpaceCode', spaceCode || '');
      navigate('/login');
      return;
    }

    // Fetch space details
    const fetchSpace = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSpaceByCode(spaceCode || '');
        setSpace(response.space);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to find space');
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceCode, isAuthenticated, authLoading, navigate]);

  const handleJoinSpace = async () => {
    if (!spaceCode) return;

    try {
      setJoining(true);
      const response = await apiService.joinSpace(spaceCode);
      
      // Join was successful, redirect to student dashboard
      navigate('/student/dashboard', { state: { joinedSpaceId: response.space._id } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join space');
      setJoining(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Please Log In</h2>
          <p>You need to be logged in to join a space.</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Loading Space...</h2>
          <p>Please wait while we fetch the space details.</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Space Not Found</h2>
          <p>{error || 'The space you are trying to join does not exist.'}</p>
          <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join Virtual Space</h2>
        
        <div className="space-details">
          <div className="detail-item">
            <label>Space Name:</label>
            <p>{space.name}</p>
          </div>
          
          {space.description && (
            <div className="detail-item">
              <label>Description:</label>
              <p>{space.description}</p>
            </div>
          )}
          
          <div className="detail-item">
            <label>Tutor:</label>
            <p>{space.tutorId.firstName} {space.tutorId.lastName}</p>
          </div>
          
          <div className="detail-item">
            <label>Status:</label>
            <p>{space.status}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            onClick={handleJoinSpace}
            disabled={joining}
            className="btn btn-primary"
          >
            {joining ? 'Joining...' : 'Join Space'}
          </button>
          
          <button
            onClick={() => navigate('/student/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSpace;
