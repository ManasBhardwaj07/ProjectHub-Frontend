import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';

export default function ProjectForm({ setProjects, token, darkMode }) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate input
    if (!newTitle.trim()) {
      setError('Project title is required');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        '/projects',
        { name: newTitle, description: newDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects((prev) => [res.data, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setShowForm(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(!showForm)}
        className={`px-5 py-3 rounded-lg shadow-md transition-all ${
          showForm
            ? darkMode
              ? 'bg-gray-600 hover:bg-gray-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
        }`}
      >
        {showForm ? (
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Cancel
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Project
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleCreate}
            className="mt-4 overflow-hidden"
          >
            <div className={`p-6 rounded-xl shadow-md border transition-colors ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 p-3 rounded-lg ${
                    darkMode ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Awesome Project"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30'
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30'
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg text-white font-medium transition-all ${
                    loading
                      ? 'bg-blue-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Project...
                    </span>
                  ) : (
                    'Create Project'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}