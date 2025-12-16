import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
import Login from './components/common/Login';
import Register from './components/common/Register';
<<<<<<< HEAD
import JoinSpace from './components/common/JoinSpace';
import StudentDashboard from './components/student/StudentDashboard';
=======
import StudentJoin from './components/student/StudentJoin';
>>>>>>> ai_feature_clean
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
<<<<<<< HEAD
            user?.role === UserRole.STUDENT ? (
              <Navigate to="/student/dashboard" replace />
            ) : user?.role === UserRole.TUTOR ? (
=======
            user?.role === UserRole.TUTOR ? (
>>>>>>> ai_feature_clean
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
<<<<<<< HEAD
      <Route path="/join/:spaceCode" element={<JoinSpace />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
=======

      {/* Anonymous student join - no authentication required */}
      <Route path="/join/:spaceCode" element={<StudentJoin />} />
>>>>>>> ai_feature_clean

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
