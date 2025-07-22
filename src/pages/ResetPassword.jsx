// pages/ResetPassword.jsx

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { AnimatedInput, AnimatedButton } from '../components/AuthUI';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message || 'Password reset! Redirecting...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Create New Password</h2>
        <p className="mt-2 text-gray-600">Enter and confirm your new password.</p>
      </header>

      {message && <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-700 text-sm">{message}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm">{error}</div>}

      {!message && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <AnimatedInput id="password" label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" autoComplete="new-password" />
            <AnimatedInput id="confirm" label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" delay={0.6}/>
            <AnimatedButton isSubmitting={isSubmitting} text="Reset Password" loadingText="Resetting..." />
        </form>
      )}
       <div className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">← Back to Login</Link>
      </div>
    </AuthLayout>
  );
}