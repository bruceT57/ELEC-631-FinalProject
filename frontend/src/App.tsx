import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
import Login from './components/common/Login';
import Register from './components/common/Register';
import StudentJoin from './components/student/StudentJoin';
import TutorDashboard from './components/tutor/TutorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import './App.css';

/**
 * Protected Route component
 */
const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Main App component
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === UserRole.TUTOR ? (
              <Navigate to="/tutor/dashboard" replace />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Anonymous student join - no authentication required */}
      <Route path="/join/:spaceCode" element={<StudentJoin />} />

      <Route
        path="/tutor/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.TUTOR]}>
            <TutorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
