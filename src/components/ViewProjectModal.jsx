import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2, FiTrash2, FiCheck, FiPlus, FiCalendar, FiFlag } from 'react-icons/fi';
import { RiDragMove2Line } from 'react-icons/ri';
import socket from '../socket';

export default function ViewProjectModal({ viewProject, setViewProject, token, darkMode }) {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('todo');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const [newTasks, setNewTasks] = useState({
    todo: { title: '', description: '', priority: 'medium', dueDate: '' },
    'in progress': { title: '', description: '', priority: 'medium', dueDate: '' },
    done: { title: '', description: '', priority: 'medium', dueDate: '' }
  });

  const statusConfig = {
    todo: {
      label: 'To Do',
      color: 'bg-blue-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-blue-50',
      border: darkMode ? 'border-blue-900/50' : 'border-blue-200'
    },
    'in progress': {
      label: 'In Progress',
      color: 'bg-yellow-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-yellow-50',
      border: darkMode ? 'border-yellow-900/50' : 'border-yellow-200'
    },
    done: {
      label: 'Done',
      color: 'bg-green-500',
      bg: darkMode ? 'bg-gray-800/50' : 'bg-green-50',
      border: darkMode ? 'border-green-900/50' : 'border-green-200'
    }
  };

  const priorityConfig = {
    low: {
      color: darkMode ? 'text-green-400' : 'text-green-600',
      bg: darkMode ? 'bg-green-900/30' : 'bg-green-100',
      icon: '↓'
    },
    medium: {
      color: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      bg: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
      icon: '→'
    },
    high: {
      color: darkMode ? 'text-red-400' : 'text-red-600',
      bg: darkMode ? 'bg-red-900/30' : 'bg-red-100',
      icon: '↑'
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
          setTasks((prev) => prev.map(t => t._id === task._id ? task : t));
        }
      });

      socket.on('task:deleted', (taskId) => {
        setTasks((prev) => prev.filter(t => t._id !== taskId));
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
          description: editTaskDescription,
          status: editTaskStatus,
          priority: editTaskPriority,
          dueDate: editTaskDueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => prev.map(t => (t._id === taskId ? res.data : t)));
      socket.emit('task:update', res.data); // 🔁 real-time emit
      setEditingTaskId(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err.response?.data?.message || 'Error updating task');
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
      socket.emit('task:delete', taskId); // 🔁 real-time emit
      setError(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Error deleting task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (status) => {
    if (!newTasks[status].title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.post(
        `/projects/${viewProject._id}/tasks`,
        { 
          title: newTasks[status].title, 
          description: newTasks[status].description, 
          status,
          priority: newTasks[status].priority,
          dueDate: newTasks[status].dueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => [...prev, res.data]);
      socket.emit('task:create', res.data); // 🔁 real-time emit
      setNewTasks(prev => ({
        ...prev,
        [status]: { title: '', description: '', priority: 'medium', dueDate: '' }
      }));
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.response?.data?.message || 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;

    try {
      setIsLoading(true);
      const res = await axios.put(`/tasks/${draggableId}`, {
        status: destination.droppableId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.map(t => t._id === draggableId ? res.data : t));
      socket.emit('task:update', res.data); // 🔁 real-time status move
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
          transition={{ type: 'spring', damping: 25 }}
          className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
        >
          {/* Modal Header */}
          <div className={`sticky top-0 z-10 flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
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
              className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}
            >
              <div className="flex-1 text-sm">{error}</div>
              <button onClick={() => setError(null)} className="ml-2">
                <FiX />
              </button>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center p-4">
              <div className={`w-8 h-8 border-4 rounded-full animate-spin ${darkMode ? 'border-gray-600 border-t-blue-500' : 'border-gray-300 border-t-blue-600'}`}></div>
            </div>
          )}

          {/* Kanban Board */}
          <div className="p-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Droppable droppableId={status} key={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-xl ${config.bg} border ${config.border} p-4 min-h-[300px]`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-3 h-3 rounded-full ${config.color} mr-2`}></div>
                          <h3 className="font-semibold text-sm uppercase tracking-wider">{config.label}</h3>
                          <span className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                            {tasks.filter(t => t.status === status).length}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {tasks
                            .filter(task => task.status === status)
                            .map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    animate={{
                                      scale: snapshot.isDragging ? 1.02 : 1,
                                      boxShadow: snapshot.isDragging
                                        ? darkMode
                                          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                          : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        : 'none'
                                    }}
                                    className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white border-gray-200'} shadow-sm`}
                                  >
                                    {editingTaskId === task._id ? (
                                      <div className="space-y-3">
                                        <input
                                          value={editTaskTitle}
                                          onChange={(e) => setEditTaskTitle(e.target.value)}
                                          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-600 border-gray-500 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                          placeholder="Task title"
                                          autoFocus
                                        />
                                        <textarea
                                          value={editTaskDescription}
                                          onChange={(e) => setEditTaskDescription(e.target.value)}
                                          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-600 border-gray-500 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                          placeholder="Task description"
                                          rows={3}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium mb-1">Status</label>
                                            <select
                                              value={editTaskStatus}
                                              onChange={(e) => setEditTaskStatus(e.target.value)}
                                              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-600 border-gray-500 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                            >
                                              {Object.entries(statusConfig).map(([value, config]) => (
                                                <option key={value} value={value}>{config.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium mb-1">Priority</label>
                                            <select
                                              value={editTaskPriority}
                                              onChange={(e) => setEditTaskPriority(e.target.value)}
                                              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-600 border-gray-500 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                            >
                                              <option value="low">Low</option>
                                              <option value="medium">Medium</option>
                                              <option value="high">High</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium mb-1">Due Date</label>
                                          <input
                                            type="date"
                                            value={editTaskDueDate}
                                            onChange={(e) => setEditTaskDueDate(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-600 border-gray-500 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                          />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                          <button
                                            onClick={() => handleTaskUpdate(task._id)}
                                            disabled={isLoading}
                                            className={`flex-1 py-2 rounded-lg flex items-center justify-center ${isLoading ? 'bg-green-400' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                                          >
                                            {isLoading ? (
                                              <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                              </>
                                            ) : (
                                              <>
                                                <FiCheck className="mr-2" />
                                                Save
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => setEditingTaskId(null)}
                                            className={`flex-1 py-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <div 
                                            className="flex-1 cursor-pointer"
                                            onClick={() => toggleTaskExpand(task._id)}
                                          >
                                            <h4 className={`font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
                                              {task.title}
                                            </h4>
                                            {expandedTaskId === task._id && task.description && (
                                              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {task.description}
                                              </p>
                                            )}
                                          </div>
                                          <div
                                            {...provided.dragHandleProps}
                                            className={`p-1 rounded-md cursor-grab active:cursor-grabbing ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                          >
                                            <RiDragMove2Line className="text-gray-500" />
                                          </div>
                                        </div>

                                        {(task.dueDate || task.priority) && (
                                          <div className="flex items-center justify-between mt-3">
                                            {task.dueDate && (
                                              <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${new Date(task.dueDate) < new Date() ? (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                                                <FiCalendar className="mr-1" size={12} />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                              </div>
                                            )}
                                            <div className="flex gap-2">
                                              {task.priority && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
                                                  <FiFlag className="inline mr-1" size={12} />
                                                  {task.priority}
                                                </span>
                                              )}
                                              <button
                                                onClick={() => {
                                                  setEditingTaskId(task._id);
                                                  setEditTaskTitle(task.title);
                                                  setEditTaskDescription(task.description || '');
                                                  setEditTaskStatus(task.status);
                                                  setEditTaskPriority(task.priority || 'medium');
                                                  setEditTaskDueDate(task.dueDate?.slice(0, 10) || '');
                                                }}
                                                className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                title="Edit task"
                                              >
                                                <FiEdit2 size={16} />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteTask(task._id)}
                                                className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                title="Delete task"
                                              >
                                                <FiTrash2 size={16} className="text-red-500" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>

                        {/* Add Task Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-4 rounded-lg border-dashed border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                          <h4 className="text-sm font-medium mb-3 flex items-center">
                            <FiPlus className="mr-2" /> Add Task
                          </h4>
                          <div className="space-y-3">
                            <input
                              value={newTasks[status].title}
                              onChange={(e) => setNewTasks(prev => ({
                                ...prev,
                                [status]: { ...prev[status], title: e.target.value }
                              }))}
                              placeholder="Task title"
                              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                            />
                            <textarea
                              value={newTasks[status].description}
                              onChange={(e) => setNewTasks(prev => ({
                                ...prev,
                                [status]: { ...prev[status], description: e.target.value }
                              }))}
                              placeholder="Description (optional)"
                              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                              rows={2}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                                <select
                                  value={newTasks[status].priority}
                                  onChange={(e) => setNewTasks(prev => ({
                                    ...prev,
                                    [status]: { ...prev[status], priority: e.target.value }
                                  }))}
                                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                                <input
                                  type="date"
                                  value={newTasks[status].dueDate}
                                  onChange={(e) => setNewTasks(prev => ({
                                    ...prev,
                                    [status]: { ...prev[status], dueDate: e.target.value }
                                  }))}
                                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddTask(status)}
                              disabled={isLoading || !newTasks[status].title.trim()}
                              className={`w-full py-2 rounded-lg flex items-center justify-center ${isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isLoading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <FiPlus className="mr-2" />
                                  Add Task
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}