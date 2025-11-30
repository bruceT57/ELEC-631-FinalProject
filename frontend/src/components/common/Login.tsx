import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login({ email, password });
      console.log('Login successful:', authenticatedUser);
      setLoading(false);

      // Check if there's a space code to redirect to
      const redirectSpaceCode = sessionStorage.getItem('redirectSpaceCode');
      if (redirectSpaceCode) {
        sessionStorage.removeItem('redirectSpaceCode');
        navigate(`/join/${redirectSpaceCode}`);
        return;
      }

      // Redirect based on role from authenticated user
      console.log('User role:', authenticatedUser?.role);
      if (authenticatedUser?.role === UserRole.STUDENT) {
        console.log('Redirecting to student dashboard');
        navigate('/student/dashboard');
      } else if (authenticatedUser?.role === UserRole.TUTOR) {
        console.log('Redirecting to tutor dashboard');
        navigate('/tutor/dashboard');
      } else if (authenticatedUser?.role === UserRole.ADMIN) {
        console.log('Redirecting to admin dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('Unknown role, redirecting to home');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Rice OASUS Tutoring Tool Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
