// hooks/useTaskManager.js

import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import socket from '../socket';

export default function useTaskManager(projectId, token) {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/projects/${projectId}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load tasks.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        if (projectId) {
            fetchTasks();
            
            const handleTaskCreated = (task) => { if (task.projectId === projectId) setTasks(prev => [...prev, task]); };
            const handleTaskUpdated = (task) => { if (task.projectId === projectId) setTasks(prev => prev.map(t => t._id === task._id ? task : t)); };
            const handleTaskDeleted = (taskId) => setTasks(prev => prev.filter(t => t._id !== taskId));

            socket.on('task:created', handleTaskCreated);
            socket.on('task:updated', handleTaskUpdated);
            socket.on('task:deleted', handleTaskDeleted);

            return () => {
                socket.off('task:created', handleTaskCreated);
                socket.off('task:updated', handleTaskUpdated);
                socket.off('task:deleted', handleTaskDeleted);
            };
        }
    }, [projectId, fetchTasks]);

    const handleAddTask = async (newTaskData) => {
        try {
            const res = await axios.post(`/projects/${projectId}/tasks`, newTaskData, { headers: { Authorization: `Bearer ${token}` } });
            socket.emit('task:create', res.data);
            // Local state is updated by socket listener
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add task');
            return false;
        }
    };
    
    const handleUpdateTask = async (taskId, updatedData) => {
        try {
            const res = await axios.put(`/tasks/${taskId}`, updatedData, { headers: { Authorization: `Bearer ${token}` } });
            socket.emit('task:update', res.data);
            // Local state is updated by socket listener
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete(`/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            socket.emit('task:delete', taskId);
            // Local state is updated by socket listener
        } catch (err) {
            setError('Failed to delete task');
        }
    };
    
    const handleDragEnd = async ({ destination, source, draggableId }) => {
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Optimistically update UI
        const movedTask = tasks.find(t => t._id === draggableId);
        if(movedTask) movedTask.status = destination.droppableId;
        const reorderedTasks = Array.from(tasks);
        const [removed] = reorderedTasks.splice(source.index, 1);
        reorderedTasks.splice(destination.index, 0, removed);
        setTasks(reorderedTasks);

        try {
            await handleUpdateTask(draggableId, { status: destination.droppableId });
        } catch (err) {
            // Revert on error
            setTasks(tasks);
            setError('Failed to update task status.');
        }
    };

    return { tasks, isLoading, error, handleDragEnd, handleAddTask, handleUpdateTask, handleDeleteTask };
}