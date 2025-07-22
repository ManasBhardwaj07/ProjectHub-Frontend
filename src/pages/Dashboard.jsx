import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
// import ProjectForm from '../components/ProjectForm'; // Old import
// import ProjectList from '../components/ProjectList'; // Old import
// import ViewProjectModal from '../components/ViewProjectModal'; // Old import
import axios from '../api/axios';
import socket from '../socket';
// import toast from 'react-hot-toast'; // Example toast library - install if needed

// Lazy load components for performance optimization
const ProjectForm = lazy(() => import('../components/ProjectForm'));
const ProjectList = lazy(() => import('../components/ProjectList'));
const ViewProjectModal = lazy(() => import('../components/ViewProjectModal'));

/* ========================================================================= */
/* ICON COMPONENTS                              */
/* ========================================================================= */

// Magnifying glass icon for search
const SearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sun icon for light mode
const SunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V5M12 19V21M5 12H3M21 12H19M16.9497 7.05025L18.364 5.63604M5.63604 18.364L7.05025 16.9497M7.05025 7.05025L5.63604 5.63604M18.364 18.364L16.9497 16.9497M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Moon icon for dark mode
const MoonIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.3542 15.3542C19.3176 15.7708 18.1856 16 17 16C11.4772 16 7 11.5228 7 6C7 4.81441 7.22924 3.68236 7.64581 2.64575C5.3365 3.38767 3.38767 5.3365 2.64575 7.64575C2.22924 8.68236 2 9.81441 2 11C2 16.5228 6.47715 21 12 21C13.1856 21 14.3176 20.7708 15.3542 20.3542C13.3365 19.3877 12 17.3365 12 15C12 12.6635 13.3365 10.6123 15.3542 9.64575C14.3176 9.22924 13.1856 9 12 9C10.8144 9 9.68236 9.22924 8.64575 9.64575C9.61233 11.6635 11.6635 13 14 13C16.3365 13 18.3877 11.6635 19.3542 9.64575C20.7708 10.6824 21 11.8144 21 13C21 14.1856 20.7708 15.3176 20.3542 16.3542C19.3176 16.7708 18.1856 17 17 17C15.8144 17 14.6824 16.7708 13.6458 16.3542C14.6123 14.3365 16.6635 13 19 13C21.3365 13 23.3877 14.3365 24.3542 16.3542Z" fill="currentColor"/>
  </svg>
);

// Logout icon
const LogoutIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7C5.34315 3 4 4.34315 4 6V18C4 19.6569 5.34315 21 7 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ========================================================================= */
/* REUSABLE COMPONENTS                           */
/* ========================================================================= */

const LogoutButton = ({ onClick, darkMode }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <motion.div className="relative">
      <AnimatePresence mode="wait"> {/* Use AnimatePresence with mode="wait" for smooth transition between states */}
        {isConfirming ? (
          <motion.div
            key="confirm-state" // Unique key for AnimatePresence
            initial={{ opacity: 0, x: 20 }} // Starts further right for a clearer slide
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }} // Ensures it slides out
            transition={{ duration: 0.25, ease: "easeOut" }} // Slightly increased duration
            className="flex gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }} // Increased hover scale
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              transition={{ type: "spring", stiffness: 500, damping: 25 }} // Spring effect
            >
              Confirm
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} // Increased hover scale
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsConfirming(false)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              transition={{ type: "spring", stiffness: 500, damping: 25 }} // Spring effect
            >
              Cancel
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="logout-button" // Unique key for AnimatePresence
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsConfirming(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
              darkMode
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-600/30'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30'
            }`}
            aria-label="Logout"
            transition={{ type: "spring", stiffness: 500, damping: 25 }} // Spring effect
          >
            <LogoutIcon className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Logout</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ========================================================================= */
/* MAIN DASHBOARD COMPONENT                         */
/* ========================================================================= */

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const projectsRef = useRef([]);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null); // Ref for search input for keyboard navigation
  const [debouncedSearch] = useDebounce(search, 300);
  const [viewProject, setViewProject] = useState(null);
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches // System preference detection
  );
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Sync projectsRef with state
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    // Apply font styles globally
    document.documentElement.style.fontFamily = darkMode ? "'Inter', sans-serif" : "'Inter', sans-serif";
    document.documentElement.style.setProperty('--font-poppins', 'Poppins'); // For headings
  }, [darkMode]);

  // Fetch projects and setup socket listeners
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

    // WebSocket event listeners for real-time updates
    socket.on('project:created', (newProject) => {
      const exists = projectsRef.current.find(p => p._id === newProject._id);
      if (!exists) {
        setProjects([newProject, ...projectsRef.current]);
        // toast.success(`Project "${newProject.name}" created!`); // Integrate a toast library here
      }
    });

    socket.on('project:updated', (updated) => {
      setProjects(projectsRef.current.map(p =>
        p._id === updated._id ? updated : p
      ));
      // toast.success(`Project "${updated.name}" updated!`); // Integrate a toast library here
    });

    socket.on('project:deleted', (deletedId) => {
      setProjects(projectsRef.current.filter(p => p._id !== deletedId));
      // toast.error(`Project deleted!`); // Integrate a toast library here
    });

    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('project:deleted');
    };
  }, [token, navigate]);

  // Keyboard navigation for search (⌘ + / or Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Implement ↑/↓ navigation for projects here if needed (more complex, usually in ProjectList)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Subtle "rise in"
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }} // Smoother ease
      className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }} // Apply Inter font globally
    >
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }} // Starts higher for a noticeable drop-in
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }} // Slightly longer duration for header
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10"
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
          whileHover={{ scale: 1.01 }} // Slightly reduced hover scale for subtlety
          transition={{ type: "spring", stiffness: 400, damping: 15 }} // Spring effect on hover
          style={{ fontFamily: 'Poppins, sans-serif' }} // Apply Poppins font for headings
        >
          Welcome, {user?.name || 'User'}
        </motion.h1>

        <motion.div // Wrap action buttons for orchestrated entrance
          initial={{ x: 50, opacity: 0 }} // Slide in from the right
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} // Slight delay for this group
          className="flex gap-4 items-center"
        >
          {/* Mode Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors duration-200 ${ // Added duration for direct class transition
              darkMode
                ? 'bg-blue-900/30 hover:bg-blue-900/40 text-blue-400'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
            }`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            transition={{ type: "spring", stiffness: 500, damping: 25 }} // Spring effect for dark mode toggle
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </motion.button>

          {/* Logout Button */}
          <LogoutButton onClick={handleLogout} darkMode={darkMode} />
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 30 }} // Slides up from slightly below
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }} // Delayed and smoother transition
        className="space-y-8 px-2 md:px-0" // Adjusted padding for main content
      >
        <Suspense fallback={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="rounded-lg h-32 w-full max-w-2xl mx-auto mb-8 bg-gray-200 dark:bg-gray-700 shadow-md"
          />
        }>
          {/* Project Creation Form */}
          <ProjectForm
            setProjects={setProjects}
            token={token}
            darkMode={darkMode}
          />
        </Suspense>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} // Slides up from slightly below
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }} // Adjusted delay and duration
          className="relative max-w-2xl mx-auto"
        >
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <SearchIcon className="h-5 w-5" />
          </div>
          <input
            ref={searchInputRef} // Assign ref for keyboard focus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200 ${
              darkMode
                ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 border-gray-700'
                : 'bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 border-gray-300'
            } border`}
            aria-label="Search projects"
          />
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} // Fades in with a slight zoom
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} // Fades out with a slight zoom
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="py-16 space-y-4 flex flex-col items-center"
            >
              <motion.div
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                aria-label="Loading"
              />
              <motion.p
                className={`text-center max-w-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
                initial={{ opacity: 0, y: 10 }} // Text slides up
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }} // Delayed and smoother
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Gathering your projects...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project List */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => ( // Render 6 skeleton cards
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className={`rounded-lg p-6 h-48 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} shadow-md`}
              />
            ))}
          </div>
        }>
          {!isLoading && (
            <ProjectList
              projects={filteredProjects}
              setProjects={setProjects}
              token={token}
              darkMode={darkMode}
              onView={setViewProject}
            />
          )}
        </Suspense>
      </motion.main>

      {/* Project View Modal */}
      <AnimatePresence>
        {viewProject && (
          <motion.div // Backdrop for the modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewProject(null)} // Close modal on backdrop click
          >
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.9 }} // Modal slides down, fades in, and slightly scales up
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.9 }} // Slides up, fades out, and scales down on exit
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative rounded-lg p-6 w-full max-w-lg ${
                darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
              } shadow-2xl`}
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing modal when clicking inside
            >
              <Suspense fallback={
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`rounded-lg p-6 h-64 w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                />
              }>
                <ViewProjectModal
                  viewProject={viewProject}
                  setViewProject={setViewProject}
                  token={token}
                  darkMode={darkMode}
                />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}