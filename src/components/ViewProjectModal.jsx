import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiEdit2, FiTrash2, FiCheck, FiPlus, 
  FiCalendar, FiFlag, FiSearch, FiChevronLeft, 
  FiChevronRight, FiAlertTriangle, FiArrowUp, 
  FiArrowRight, FiArrowDown, FiClock 
} from 'react-icons/fi';
import { RiDragMove2Line } from 'react-icons/ri';
import socket from '../socket';

const LoadingSpinner = ({ darkMode }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className={`h-5 w-5 border-2 ${darkMode ? 'border-gray-300' : 'border-gray-500'} border-t-transparent rounded-full`}
  />
);

const ErrorMessage = ({ error, onClose, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}
  >
    <div className="flex-1 text-sm">{error}</div>
    <button 
      onClick={onClose}
      className={`ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-red-800/50' : 'hover:bg-red-200'}`}
    >
      <FiX size={16} />
    </button>
  </motion.div>
);

const PriorityBadge = ({ priority, darkMode }) => {
  const priorityConfig = {
    high: {
      label: 'High Priority',
      color: darkMode ? 'text-red-400' : 'text-red-600',
      bg: darkMode ? 'bg-red-900/30' : 'bg-red-100',
      icon: <FiAlertTriangle className="inline" size={12} />,
      text: 'High'
    },
    medium: {
      label: 'Medium Priority',
      color: darkMode ? 'text-amber-400' : 'text-amber-600',
      bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-100',
      icon: <FiArrowRight className="inline" size={12} />,
      text: 'Medium'
    },
    low: {
      label: 'Low Priority',
      color: darkMode ? 'text-emerald-400' : 'text-emerald-600',
      bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-100',
      icon: <FiArrowDown className="inline" size={12} />,
      text: 'Low'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <div 
      className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${config.bg} ${config.color}`}
      title={config.label}
    >
      {config.icon}
      <span className="ml-1">{config.text}</span>
    </div>
  );
};

const DueDateBadge = ({ dueDate, darkMode }) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  
  let statusText = '';
  let isUrgent = false;
  let isOverdue = false;

  if (diffDays < 0) {
    statusText = 'Overdue';
    isOverdue = true;
  } else if (diffDays === 0) {
    statusText = 'Due today';
    isUrgent = true;
  } else if (diffDays === 1) {
    statusText = 'Due tomorrow';
    isUrgent = true;
  } else if (diffDays <= 3) {
    statusText = `Due in ${diffDays} days`;
    isUrgent = true;
  } else if (diffDays <= 7) {
    statusText = `Due in ${diffDays} days`;
  } else {
    statusText = due.toLocaleDateString();
  }

  return (
    <div 
      className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
        isOverdue
          ? (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
          : isUrgent
            ? (darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800')
            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
      }`}
      title={`Due: ${new Date(dueDate).toLocaleDateString()}`}
    >
      {isOverdue || isUrgent ? <FiClock className="mr-1" size={12} /> : <FiCalendar className="mr-1" size={12} />}
      {statusText}
    </div>
  );
};

export default function ViewProjectModal({ viewProject, setViewProject, token, darkMode }) {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('todo');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  });
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const statusOrder = ['todo', 'in progress', 'done'];

  const statusConfig = {
    todo: {
      label: 'To Do',
      color: 'bg-blue-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-blue-50/80',
      border: darkMode ? 'border-blue-900/50' : 'border-blue-200',
      gradient: darkMode ? 'from-blue-900/30 to-gray-800/50' : 'from-blue-50/80 to-white'
    },
    'in progress': {
      label: 'In Progress',
      color: 'bg-amber-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-amber-50/80',
      border: darkMode ? 'border-amber-900/50' : 'border-amber-200',
      gradient: darkMode ? 'from-amber-900/30 to-gray-800/50' : 'from-amber-50/80 to-white'
    },
    done: {
      label: 'Done',
      color: 'bg-emerald-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-emerald-50/80',
      border: darkMode ? 'border-emerald-900/50' : 'border-emerald-200',
      gradient: darkMode ? 'from-emerald-900/30 to-gray-800/50' : 'from-emerald-50/80 to-white'
    }
  };

  useEffect(() => {
    if (viewProject) {
      fetchTasks();

      socket.on('task:created', (task) => {
        if (task.projectId === viewProject._id) {
          setTasks(prev => {
            const exists = prev.find(t => t._id === task._id);
            return exists ? prev : [...prev, task];
          });
        }
      });

      socket.on('task:updated', (task) => {
        if (task.projectId === viewProject._id) {
          setTasks(prev => prev.map(t => t._id === task._id ? task : t));
        }
      });

      socket.on('task:deleted', (taskId) => {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      });

      return () => {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
      };
    }
  }, [viewProject]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/projects/${viewProject._id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId) => {
    try {
      setIsLoading(true);
      const res = await axios.put(
        `/tasks/${taskId}`,
        {
          title: editTaskTitle,
          status: editTaskStatus,
          priority: editTaskPriority,
          dueDate: editTaskDueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => prev.map(t => (t._id === taskId ? res.data : t)));
      socket.emit('task:update', res.data);
      setEditingTaskId(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err.response?.data?.message || 'Error updating task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, direction) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    
    const currentIndex = statusOrder.indexOf(task.status);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0 || newIndex >= statusOrder.length) return;

    try {
      setIsLoading(true);
      const newStatus = statusOrder[newIndex];
      const res = await axios.put(
        `/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
      socket.emit('task:update', res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setError(err.response?.data?.message || 'Error updating task status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setIsLoading(true);
      await axios.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t._id !== taskId));
      socket.emit('task:delete', taskId);
      setError(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Error deleting task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.post(
        `/projects/${viewProject._id}/tasks`,
        { 
          title: newTask.title, 
          status: newTask.status,
          priority: newTask.priority,
          dueDate: newTask.dueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => [...prev, res.data]);
      socket.emit('task:create', res.data);
      setNewTask({
        title: '',
        status: 'todo',
        priority: 'medium',
        dueDate: ''
      });
      setShowAddTaskModal(false);
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.response?.data?.message || 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (result) => {
    setDraggingTaskId(result.draggableId);
  };

  const handleDragEnd = async (result) => {
    setDraggingTaskId(null);
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    try {
      setIsLoading(true);
      const res = await axios.put(`/tasks/${draggableId}`, {
        status: destination.droppableId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.map(t => t._id === draggableId ? res.data : t));
      socket.emit('task:update', res.data);
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskExpand = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TaskActionButtons = ({ task }) => {
    const currentStatusIndex = statusOrder.indexOf(task.status);
    const canMoveBackward = currentStatusIndex > 0;
    const canMoveForward = currentStatusIndex < statusOrder.length - 1;

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(task._id, 'backward');
          }}
          disabled={!canMoveBackward}
          className={`p-1.5 rounded-md transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-200 text-gray-600'
          } ${
            !canMoveBackward 
              ? darkMode 
                ? 'opacity-30 cursor-not-allowed' 
                : 'opacity-40 cursor-not-allowed'
              : ''
          }`}
          title="Move backward"
        >
          <FiChevronLeft size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(task._id, 'forward');
          }}
          disabled={!canMoveForward}
          className={`p-1.5 rounded-md transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-200 text-gray-600'
          } ${
            !canMoveForward 
              ? darkMode 
                ? 'opacity-30 cursor-not-allowed' 
                : 'opacity-40 cursor-not-allowed'
              : ''
          }`}
          title="Move forward"
        >
          <FiChevronRight size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingTaskId(task._id);
            setEditTaskTitle(task.title);
            setEditTaskStatus(task.status);
            setEditTaskPriority(task.priority || 'medium');
            setEditTaskDueDate(task.dueDate?.slice(0, 10) || '');
          }}
          className={`p-1.5 rounded-md transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="Edit task"
        >
          <FiEdit2 size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTask(task._id);
          }}
          className={`p-1.5 rounded-md transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-red-400' 
              : 'hover:bg-gray-200 text-red-500'
          }`}
          title="Delete task"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    );
  };

  if (!viewProject) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && setViewProject(null)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
        >
          {/* Modal Header */}
          <div className={`sticky top-0 z-10 flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-white/90'}`}>
            <div>
              <h2 className="text-2xl font-bold">{viewProject.name}</h2>
              {viewProject.description && (
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {viewProject.description}
                </p>
              )}
            </div>
            <button 
              onClick={() => setViewProject(null)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Search and Add Task */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Search tasks..."
                />
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className={`px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600`}
              >
                <FiPlus /> Add Task
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4">
              <ErrorMessage error={error} onClose={() => setError(null)} darkMode={darkMode} />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center p-4">
              <LoadingSpinner darkMode={darkMode} />
            </div>
          )}

          {/* Kanban Board */}
          <div className="p-6">
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Droppable droppableId={status} key={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-2xl bg-gradient-to-b ${config.gradient} border ${config.border} p-5 min-h-[300px] transition-colors duration-200 ${
                          snapshot.isDraggingOver ? (darkMode ? 'ring-2 ring-blue-400/50' : 'ring-2 ring-blue-500/50') : ''
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-3 h-3 rounded-full ${config.color} mr-2`}></div>
                          <h3 className="font-semibold text-sm uppercase tracking-wider">{config.label}</h3>
                          <span className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                            {filteredTasks.filter(t => t.status === status).length}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {filteredTasks
                            .filter(task => task.status === status)
                            .map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-4 rounded-xl border ${
                                      snapshot.isDragging 
                                        ? (darkMode ? 'bg-gray-600 border-gray-500 shadow-lg' : 'bg-gray-100 border-gray-300 shadow-lg')
                                        : (darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white border-gray-200')
                                    } shadow-sm min-h-[120px] transition-all duration-200 ${
                                      draggingTaskId === task._id ? 'opacity-30' : 'opacity-100'
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      transform: snapshot.isDragging 
                                        ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                        : provided.draggableProps.style?.transform
                                    }}
                                  >
                                    {editingTaskId === task._id ? (
                                      <div className="space-y-3">
                                        <input
                                          value={editTaskTitle}
                                          onChange={(e) => setEditTaskTitle(e.target.value)}
                                          className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                          placeholder="Task title"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <select
                                              value={editTaskStatus}
                                              onChange={(e) => setEditTaskStatus(e.target.value)}
                                              className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                            >
                                              {Object.entries(statusConfig).map(([value, config]) => (
                                                <option key={value} value={value}>{config.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <select
                                              value={editTaskPriority}
                                              onChange={(e) => setEditTaskPriority(e.target.value)}
                                              className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                            >
                                              <option value="low">Low</option>
                                              <option value="medium">Medium</option>
                                              <option value="high">High</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div>
                                          <input
                                            type="date"
                                            value={editTaskDueDate}
                                            onChange={(e) => setEditTaskDueDate(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                          />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                          <button
                                            onClick={() => handleTaskUpdate(task._id)}
                                            className={`px-4 py-2 rounded-lg text-white font-medium flex-1 bg-gradient-to-r from-blue-500 to-indigo-600`}
                                          >
                                            {isLoading ? <LoadingSpinner darkMode={darkMode} /> : 'Save'}
                                          </button>
                                          <button
                                            onClick={() => setEditingTaskId(null)}
                                            className={`px-4 py-2 rounded-lg font-medium flex-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-full flex flex-col">
                                        <div className="flex justify-between items-start gap-2 flex-1">
                                          <div 
                                            className="flex-1 cursor-pointer"
                                            onClick={() => toggleTaskExpand(task._id)}
                                          >
                                            <h4 className={`font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
                                              {task.title}
                                            </h4>
                                          </div>
                                          <div
                                            {...provided.dragHandleProps}
                                            className={`p-1 rounded-md cursor-grab ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                          >
                                            <RiDragMove2Line className="text-gray-500" />
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                          <DueDateBadge dueDate={task.dueDate} darkMode={darkMode} />
                                          <div className="flex items-center gap-2">
                                            {task.priority && (
                                              <PriorityBadge priority={task.priority} darkMode={darkMode} />
                                            )}
                                            <TaskActionButtons task={task} />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        </motion.div>
      </motion.div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Task</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title*</label>
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Task title"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleAddTask}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                >
                  {isLoading && <LoadingSpinner darkMode={darkMode} />}
                  Add Task
                </button>

                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-medium ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}