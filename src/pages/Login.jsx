// pages/Login.jsx

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { AnimatedInput, AnimatedButton } from '../components/AuthUI';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await axios.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Login failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
        <p className="mt-2 text-gray-600">Sign in to continue.</p>
      </header>

      {errors.api && <motion.div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm shadow-sm" role="alert">{errors.api}</motion.div>}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <AnimatedInput id="email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="your.email@example.com" autoComplete="email" />
        <AnimatedInput id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Enter your password" autoComplete="current-password" delay={0.6} />

        <div className="flex items-center justify-between text-sm">
            <Link to="/forget-password" className="font-medium text-blue-600 hover:text-blue-500">Forgot Password?</Link>
        </div>
        
        <AnimatedButton isSubmitting={isSubmitting} text="Sign In" loadingText="Signing In..." />
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link></p>
      </div>
    </AuthLayout>
  );
}