import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import socket from '../socket';

const LoadingSpinner = ({ darkMode }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className={`h-5 w-5 rounded-full border-2 ${darkMode ? 'border-gray-300' : 'border-gray-500'} border-t-transparent`}
  />
);

export default function ProjectList({
  projects,
  setProjects,
  token,
  search = '',
  darkMode,
  onView,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filtered = projects.filter((p) =>
    p?.name?.toLowerCase().includes(search?.toLowerCase() || '')
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      setIsDeleting(true);
      await axios.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p._id !== id));
      socket.emit('project:delete', id);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Error deleting project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      setIsUpdating(true);
      const res = await axios.put(
        `/projects/${id}`,
        { name: editTitle, description: editDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects((prev) => prev.map((p) => (p._id === id ? res.data : p)));
      socket.emit('project:update', res.data);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Error updating project');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full px-0 mx-0">
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-0 mx-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filtered.map((project) => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.5
                }}
                className={`h-full flex flex-col rounded-xl border ${
                  darkMode
                    ? 'bg-gray-800/90 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {editingId === project._id ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 flex flex-col flex-grow space-y-4"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-opacity-20 ${
                        darkMode
                          ? 'bg-gray-700/50 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500/30'
                          : 'bg-white text-gray-800 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                      placeholder="Project title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 min-h-[120px] focus:ring-2 focus:ring-opacity-20 ${
                        darkMode
                          ? 'bg-gray-700/50 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500/30'
                          : 'bg-white text-gray-800 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                      placeholder="Project description"
                    />
                    <div className="flex gap-3 mt-auto">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdate(project._id)}
                        disabled={isUpdating}
                        className={`flex-1 py-2.5 rounded-lg text-white font-medium ${
                          isUpdating
                            ? 'bg-emerald-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        } flex items-center justify-center gap-2`}
                      >
                        {isUpdating && <LoadingSpinner darkMode={darkMode} />}
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 flex flex-col h-full"
                  >
                    <div className="flex-grow">
                      <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {project.name || 'Untitled Project'}
                      </h3>
                      <p
                        className={`text-sm mb-5 leading-relaxed line-clamp-3 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {project.description || 'No description available.'}
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span
                        className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onView(project)}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${
                              darkMode
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            View
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingId(project._id);
                              setEditTitle(project.name);
                              setEditDescription(project.description);
                            }}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${
                              darkMode
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                          >
                            Edit
                          </motion.button>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(project._id)}
                          disabled={isDeleting}
                          className={`px-4 py-2 rounded-lg text-white font-medium ${
                            darkMode
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-red-500 hover:bg-red-600'
                          } flex items-center gap-2`}
                        >
                          {isDeleting && <LoadingSpinner darkMode={darkMode} />}
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full text-center py-16 rounded-xl ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4 opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-1">
              {search ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-sm">
              {search
                ? 'Try adjusting your search criteria'
                : 'Create your first project to get started'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}