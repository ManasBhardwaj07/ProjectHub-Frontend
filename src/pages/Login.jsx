import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

// Background blobs with floating and rotating animations for depth
const blobs = [
  {
    id: 1,
    className:
      'absolute top-10 left-5 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-400 to-blue-400 opacity-30 filter blur-3xl animate-floatSlow',
    style: { filter: 'blur(80px)' },
    animate: { y: ['0%', '15%', '0%'], rotate: [0, 10, 0] },
    duration: 8,
  },
  {
    id: 2,
    className:
      'absolute bottom-10 right-5 w-72 h-72 rounded-full bg-gradient-to-br from-pink-400 to-indigo-400 opacity-25 filter blur-4xl animate-float',
    style: { filter: 'blur(90px)' },
    animate: { y: ['0%', '-20%', '0%'], rotate: [0, -5, 0] },
    duration: 10,
  },
  {
    id: 3,
    className:
      'absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-gradient-to-tr from-teal-300 to-cyan-400 opacity-20 filter blur-3xl animate-floatSlow delay-2000',
    style: { filter: 'blur(100px)' },
    animate: { y: ['0%', '10%', '0%'], rotate: [0, 15, 0] },
    duration: 9,
  },
];

// Particles for subtle background movement
const particles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  className: 'absolute w-2 h-2 bg-white/30 rounded-full animate-particle',
  style: {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 5 + 5}s`,
    animationDelay: `${Math.random() * 2}s`,
  },
}));

// Fixed Typewriter effect for dynamic welcome messages
const useTypewriter = (texts, speed = 110) => {
  const [displayed, setDisplayed] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const currentText = texts[currentTextIndex];
    if (index < currentText.length) {
      const interval = setTimeout(() => {
        setDisplayed(currentText.slice(0, index + 1));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(interval);
    } else {
      const pauseInterval = setTimeout(() => {
        setIndex(0);
        setDisplayed('');
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      }, 1500);
      return () => clearTimeout(pauseInterval);
    }
  }, [index, currentTextIndex, texts, speed]);

  return displayed;
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const typewriterText = useTypewriter(
    ['Welcome Back'],
    110
  );

  // Scroll-based opacity effect for background
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setErrors({ api: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 md:p-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{ opacity: 1 - scrollY / 500 }}
    >
      {/* Animated Background Blobs */}
      {blobs.map(({ id, className, style, animate, duration }) => (
        <motion.div
          key={id}
          className={className}
          style={style}
          animate={animate}
          transition={{ repeat: Infinity, duration, ease: 'easeInOut', repeatType: 'mirror' }}
          aria-hidden="true"
        />
      ))}
      {/* Particle Background for Depth */}
      {particles.map(({ id, className, style }) => (
        <div key={id} className={className} style={style} aria-hidden="true" />
      ))}
      {/* Form Container with Glassmorphism Effect */}
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 overflow-hidden"
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      >
        {/* Decorative Gradient Top Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        <header className="mb-8 text-center select-none">
          <motion.h2
            className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"
            aria-label="Welcome message"
          >
            {typewriterText}
            <motion.span
              className="text-blue-600"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              &nbsp;|
            </motion.span>
          </motion.h2>
          <motion.p
            className="mt-3 text-gray-600 text-sm md:text-base tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Sign in to your account
          </motion.p>
        </header>

        {/* API Error Notification */}
        {errors.api && (
          <motion.div
            className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm shadow-sm"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {errors.api}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-5">
            {/* Email Field with Animation */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <motion.input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`block w-full rounded-lg border px-4 py-3 placeholder-gray-400 text-gray-900 bg-white shadow-sm transition duration-300
                  ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field with Animation */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <motion.input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`block w-full rounded-lg border px-4 py-3 placeholder-gray-400 text-gray-900 bg-white shadow-sm transition duration-300
                  ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" id="password-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Additional Form Features */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 transition duration-200">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button with Loading State */}
          <motion.button
            type="submit"
            whileHover={isSubmitting ? {} : { scale: 1.02, y: -2 }}
            whileTap={isSubmitting ? {} : { scale: 0.98 }}
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 hover:shadow-xl
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {isSubmitting ? (
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </motion.div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        {/* Footer with Sign Up Link */}
        <motion.div
          className="mt-6 text-center text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-gray-600 select-none">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition duration-200">
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* CSS Animations for Background Effects */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.8; }
          50% { transform: translateY(${Math.random() * 100 - 50}px) translateX(${Math.random() * 100 - 50}px); opacity: 0.3; }
        }
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 10s ease-in-out infinite; }
        .animate-particle { animation: particle ease-in-out infinite; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </motion.div>
  );
}