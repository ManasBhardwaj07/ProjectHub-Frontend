// components/AuthUI.jsx

import { motion } from 'framer-motion';

export const AnimatedInput = ({ id, label, type, value, onChange, error, delay = 0.5, placeholder, autoComplete }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
    </label>
    <motion.input
      id={id} name={id} type={type} required value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error}
      className={`block w-full rounded-lg border px-4 py-3 placeholder-gray-400 text-gray-900 bg-white shadow-sm transition duration-300 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
      whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' }}
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.5 }}
    />
    {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
  </div>
);

export const AnimatedButton = ({ isSubmitting, text, loadingText, delay = 0.7 }) => (
  <motion.button
    type="submit" disabled={isSubmitting}
    whileHover={isSubmitting ? {} : { scale: 1.02, y: -2 }} whileTap={isSubmitting ? {} : { scale: 0.98 }}
    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 hover:shadow-xl ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
  >
    {isSubmitting ? (
      <div className="flex items-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
        {loadingText}
      </div>
    ) : ( text )}
  </motion.button>
);