import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import axios from '../api/axios';

// Animation variants for the modal backdrop
const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

// Animation variants for the modal panel
const modalVariants = {
  hidden: {
    y: "-100vh",
    opacity: 0,
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    y: "100vh",
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};


export default function ProjectForm({ setProjects, token, darkMode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    setModalOpen(false);
    // Reset form state on close
    setError(null);
    setNewTitle('');
    setNewDescription('');
  };
  const open = () => setModalOpen(true);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);

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

      // Add to local state
      setProjects((prev) => [res.data, ...prev]);

      // Emit real-time socket event
      socket.emit('project:create', res.data);

      // Reset form and close modal
      close();

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={open}
        className="px-6 py-3 rounded-lg shadow-md font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
      >
        <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          New Project
        </span>
      </motion.button>

      <AnimatePresence
        initial={false}
        mode='wait'
        onExitComplete={() => null}
      >
        {modalOpen && (
          <motion.div
            onClick={close}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking on it
              className={`relative w-full max-w-lg mx-4 p-8 rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create a New Project</h2>

              {error && (
                <div className={`mb-4 p-3 rounded-lg ${ darkMode ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800' }`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Awesome Project"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={close}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                        Cancel
                    </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${loading ? 'bg-blue-400' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Project'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}