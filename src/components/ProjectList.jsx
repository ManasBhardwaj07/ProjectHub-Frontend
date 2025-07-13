import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import socket from '../socket'; // ✅ Socket import

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
      socket.emit('project:delete', id); // ✅ Real-time
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
      socket.emit('project:update', res.data); // ✅ Real-time
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Error updating project');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {filtered.length > 0 ? (
          filtered.map((project) => (
            <motion.div
              key={project._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-xl shadow-md border transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:shadow-gray-700/50'
                  : 'bg-white border-gray-200 hover:shadow-gray-300/50'
              }`}
            >
              {editingId === project._id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder="Project title"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg min-h-[100px] ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder="Project description"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpdate(project._id)}
                      disabled={isUpdating}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isUpdating
                          ? 'bg-green-400'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-2">
                    {project.name || 'Untitled Project'}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {project.description || 'No description available.'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onView(project)}
                        className={`px-3 py-1 rounded-lg ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                        className={`px-3 py-1 rounded-lg ${
                          darkMode
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(project._id)}
                        disabled={isDeleting}
                        className={`px-3 py-1 rounded-lg ${
                          darkMode
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`col-span-full text-center py-12 rounded-lg ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {search
              ? 'No projects match your search.'
              : 'No projects found. Create your first project!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
