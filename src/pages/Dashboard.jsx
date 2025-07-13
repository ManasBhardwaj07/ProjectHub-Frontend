import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import ProjectForm from '../components/ProjectForm';
import ProjectList from '../components/ProjectList';
import ViewProjectModal from '../components/ViewProjectModal';
import axios from '../api/axios';
import socket from '../socket';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const projectsRef = useRef([]); // ✅ live reference for socket listeners
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [viewProject, setViewProject] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Keep projectsRef in sync with projects state
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    // ✅ Socket listeners using latest state
    socket.on('project:created', (newProject) => {
      const exists = projectsRef.current.find(p => p._id === newProject._id);
      if (!exists) {
        setProjects([newProject, ...projectsRef.current]);
      }
    });

    socket.on('project:updated', (updated) => {
      setProjects(projectsRef.current.map(p =>
        p._id === updated._id ? updated : p
      ));
    });

    socket.on('project:deleted', (deletedId) => {
      setProjects(projectsRef.current.filter(p => p._id !== deletedId));
    });

    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('project:deleted');
    };
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Header with smooth animations */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.h1 
            className="text-2xl md:text-3xl font-bold"
            whileHover={{ scale: 1.02 }}
          >
            👋 Welcome, {user?.name || 'User'}
          </motion.h1>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            } transition-colors`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg hover:shadow-red-500/30 transition-all"
        >
          Logout
        </motion.button>
      </motion.header>

      {/* Main content area */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {/* Project creation form */}
        <ProjectForm
          setProjects={setProjects}
          token={token}
          darkMode={darkMode}
        />

        {/* Search bar with floating label effect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=" "
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 peer transition-all ${
              darkMode
                ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30'
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          <label
            className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none peer-focus:text-sm peer-focus:-translate-y-6 peer-focus:text-blue-500 peer-placeholder-shown:translate-y-0 ${
              darkMode
                ? 'text-gray-400 peer-placeholder-shown:text-gray-500'
                : 'text-gray-500 peer-placeholder-shown:text-gray-400'
            }`}
          >
            Search projects...
          </label>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project list with staggered animations */}
        {!isLoading && (
          <ProjectList
            projects={filteredProjects}
            setProjects={setProjects}
            token={token}
            darkMode={darkMode}
            onView={setViewProject}
          />
        )}
      </motion.main>

      {/* Project view modal */}
      <AnimatePresence>
        {viewProject && (
          <ViewProjectModal
            viewProject={viewProject}
            setViewProject={setViewProject}
            token={token}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}