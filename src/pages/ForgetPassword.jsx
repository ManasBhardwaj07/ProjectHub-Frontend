// pages/ForgetPassword.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { AnimatedInput, AnimatedButton } from '../components/AuthUI';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'If an account exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Forgot Password?</h2>
        <p className="mt-2 text-gray-600">Enter your email and we'll send a reset link.</p>
      </header>

      {message && <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-700 text-sm shadow-sm">{message}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm shadow-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <AnimatedInput id="email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" />
        <AnimatedButton isSubmitting={isSending} text="Send Reset Link" loadingText="Sending..." />
      </form>

      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">← Back to Login</Link>
      </div>
    </AuthLayout>
  );
}