// components/AuthLayout.jsx

import { motion } from 'framer-motion';

const blobs = [
    { id: 1, className: 'absolute top-10 left-5 w-64 h-64 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-full opacity-30 filter blur-3xl animate-floatSlow', style: { filter: 'blur(80px)' }},
    { id: 2, className: 'absolute bottom-10 right-5 w-72 h-72 bg-gradient-to-br from-pink-400 to-indigo-400 rounded-full opacity-25 filter blur-4xl animate-float', style: { filter: 'blur(90px)' }},
    { id: 3, className: 'absolute top-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-teal-300 to-cyan-400 rounded-full opacity-20 filter blur-3xl animate-floatSlow delay-2000', style: { filter: 'blur(100px)' }},
];

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

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Animated Background */}
      {blobs.map(({ id, className, style }) => (
        <div key={id} className={className} style={style} aria-hidden="true" />
      ))}
      {particles.map(({ id, className, style }) => (
        <div key={id} className={className} style={style} aria-hidden="true" />
      ))}

      {/* Glassmorphism Form Container */}
      <motion.div
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 overflow-hidden"
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      >
        {/* Decorative Gradient Top Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
        {children}
      </motion.div>

      {/* CSS Keyframes for animations */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-25px) rotate(5deg); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
        @keyframes particle { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 10s ease-in-out infinite; }
        .animate-particle { animation: particle ease-in-out infinite; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}