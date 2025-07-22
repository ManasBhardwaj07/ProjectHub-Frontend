// pages/Register.jsx

import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { AnimatedInput, AnimatedButton } from '../components/AuthUI';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email address';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      await axios.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Registration failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Create an Account</h2>
        <p className="mt-2 text-gray-600">Join us and start your journey.</p>
      </header>

      {errors.api && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm shadow-sm" role="alert">{errors.api}</div>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AnimatedInput id="name" label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Your Full Name" autoComplete="name" />
        <AnimatedInput id="email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="your.email@example.com" autoComplete="email" delay={0.6}/>
        <AnimatedInput id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Create a strong password" autoComplete="new-password" delay={0.7}/>
        <AnimatedInput id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} placeholder="Confirm your password" autoComplete="new-password" delay={0.8}/>
        
        <AnimatedButton isSubmitting={isSubmitting} text="Sign Up" loadingText="Signing Up..." delay={0.9} />
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}