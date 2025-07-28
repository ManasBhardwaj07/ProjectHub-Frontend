import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgetPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';

// Helper component 1: Protects routes that require a user to be logged in.
// If not logged in, it redirects them to the login page.
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Helper component 2: Handles routes that a logged-in user should NOT see.
// If a user is already logged in, it redirects them to the dashboard.
const AuthRedirect = ({ children }) => {
  const token = sessionStorage.getItem('token');
  return token ? <Navigate to="/dashboard" /> : children;
};

export default function App() {
  return (
    <main>
      <Routes>
        {/* --- Authentication Routes --- */}
        {/* A logged-in user will be redirected from these pages to the dashboard. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
        <Route path="/forget-password" element={<AuthRedirect><ForgetPassword /></AuthRedirect>} />
        <Route path="/reset-password/:token" element={<AuthRedirect><ResetPassword /></AuthRedirect>} />

        {/* --- Protected Application Route --- */}
        {/* The user MUST be logged in to access the dashboard. */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* --- Catch-All Route --- */}
        {/* This MUST be the last route. It handles any unknown URLs. */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </main>
  );
}