import React, { useState, useEffect } from 'react'
import {
    Clock,
    Droplets,
    Plus,
    Edit3,
    Trash2,
    Play,
    Pause,
    Calendar,
    X,
    Check,
    Settings,
    List
} from 'lucide-react'
import { scheduledTasksApi } from '../config/api'
import './ScheduledIrrigation.css'

const ScheduledIrrigation = ({ tenantId, deviceId, deviceName }) => {
    const [scheduledTasks, setScheduledTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [showExecutionsModal, setShowExecutionsModal] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [taskExecutions, setTaskExecutions] = useState([])
    const [executionsLoading, setExecutionsLoading] = useState(false)
    const [executionsError, setExecutionsError] = useState(null)

    // Form state with human-friendly options
    const [formData, setFormData] = useState({
        frequency: 'daily', // daily, every2days, every3days, weekly
        time: '06:00', // HH:MM format
        dayOfWeek: '1', // 1-7 (Monday-Sunday)
        duration: 5,
        isActive: true
    })

    // Load scheduled tasks
    const loadScheduledTasks = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await scheduledTasksApi.getScheduledTasks(tenantId, deviceId)
            setScheduledTasks(response.data || [])
        } catch (err) {
            setError(err.message)
            console.error('Failed to load scheduled tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadScheduledTasks()
    }, [tenantId, deviceId])

    // Convert human-friendly form data to cron expression
    const formDataToCron = (data) => {
        const [hour, minute] = data.time.split(':')

        switch (data.frequency) {
            case 'daily':
                return `0 ${minute} ${hour} * * *`
            case 'weekly':
                return `0 ${minute} ${hour} * * ${data.dayOfWeek}`
            case 'every2days':
                return `0 ${minute} ${hour} */2 * *`
            case 'every3days':
                return `0 ${minute} ${hour} */3 * *`
            default:
                return `0 ${minute} ${hour} * * *`
        }
    }

    // Convert cron expression to human-friendly form data
    const cronToFormData = (cron) => {
        const parts = cron.split(' ')
        if (parts.length !== 6) return null

        const [second, minute, hour, day, month, dayOfWeekCron] = parts

        // Determine frequency
        let frequency = 'daily'
        let dayOfWeek = '1'

        if (dayOfWeekCron !== '*') {
            frequency = 'weekly'
            dayOfWeek = dayOfWeekCron
        } else if (day.startsWith('*/')) {
            const interval = parseInt(day.substring(2))
            if (interval === 2) {
                frequency = 'every2days'
            } else if (interval === 3) {
                frequency = 'every3days'
            }
        }

        return {
            frequency,
            time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
            dayOfWeek,
            duration: 5, // Will be set separately
            isActive: true
        }
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const cronExpression = formDataToCron(formData)
            const taskData = {
                commands: [
                    {
                        index: 1,
                        value: 1, // Activate relay
                        priority: "NORMAL",
                        wait_for: "0s"
                    },
                    {
                        index: 1,
                        value: 0, // Deactivate relay
                        priority: "NORMAL",
                        wait_for: `${formData.duration}m` // Wait for user's selected duration
                    }
                ],
                schedule: cronExpression,
                is_active: formData.isActive
            }

            if (editingTask) {
                await scheduledTasksApi.updateScheduledTask(tenantId, deviceId, editingTask.id, taskData)
            } else {
                await scheduledTasksApi.createScheduledTask(tenantId, deviceId, taskData)
            }

            // Reset form and reload tasks
            closeModal()
            await loadScheduledTasks()
        } catch (err) {
            setError(err.message)
            console.error('Failed to save scheduled task:', err)
        }
    }

    // Handle task deletion
    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this scheduled irrigation task?')) {
            return
        }

        try {
            await scheduledTasksApi.deleteScheduledTask(tenantId, deviceId, taskId)
            await loadScheduledTasks()
        } catch (err) {
            setError(err.message)
            console.error('Failed to delete scheduled task:', err)
        }
    }

    // Handle task toggle (active/inactive)
    const handleToggleActive = async (task) => {
        try {
            const updatedTask = {
                commands: task.commands,
                schedule: task.schedule,
                is_active: !task.is_active
            }

            await scheduledTasksApi.updateScheduledTask(tenantId, deviceId, task.id, updatedTask)
            await loadScheduledTasks()
        } catch (err) {
            setError(err.message)
            console.error('Failed to toggle scheduled task:', err)
        }
    }

    // Handle edit task
    const handleEdit = (task) => {
        setEditingTask(task)
        const formDataFromCron = cronToFormData(task.schedule)
        setFormData({
            ...formDataFromCron,
            duration: getTaskDuration(task),
            isActive: task.is_active
        })
        setShowModal(true)
    }

    // Handle add new task
    const handleAddNew = () => {
        setEditingTask(null)
        setFormData({
            frequency: 'daily',
            time: '06:00',
            dayOfWeek: '1',
            duration: 5,
            isActive: true
        })
        setShowModal(true)
    }

    // Close modal
    const closeModal = () => {
        setShowModal(false)
        setEditingTask(null)
        setFormData({
            frequency: 'daily',
            time: '06:00',
            dayOfWeek: '1',
            duration: 5,
            isActive: true
        })
        setError(null)
    }

    // Parse cron expression to human readable format
    const parseCronExpression = (cron) => {
        try {
            if (!cron || typeof cron !== 'string') {
                return 'Invalid schedule'
            }

            const parts = cron.split(' ')
            if (parts.length !== 6) return 'Invalid schedule'

            const [second, minute, hour, day, month, dayOfWeek] = parts

            // Simple parsing for common patterns
            if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
                return 'Daily at midnight'
            }
            if (minute === '0' && hour === '6' && day === '*' && month === '*' && dayOfWeek === '*') {
                return 'Daily at 6:00 AM'
            }
            if (minute === '0' && hour === '12' && day === '*' && month === '*' && dayOfWeek === '*') {
                return 'Daily at 12:00 PM'
            }
            if (minute === '0' && hour === '18' && day === '*' && month === '*' && dayOfWeek === '*') {
                return 'Daily at 6:00 PM'
            }
            if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
                return 'Every hour'
            }
            if (minute === '0' && hour === '0' && day === '1' && month === '*' && dayOfWeek === '*') {
                return 'Monthly on the 1st'
            }

            // Custom format
            const hourStr = hour === '*' ? 'every hour' : `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
            const dayStr = day === '*' ? 'every day' : `day ${day}`
            return `${hourStr} on ${dayStr}`
        } catch (error) {
            console.error('Error parsing cron expression:', error, cron)
            return 'Invalid schedule'
        }
    }

    // Get duration from task commands
    const getTaskDuration = (task) => {
        try {
            // Extract duration from the second command's wait_for field
            if (task.commands && Array.isArray(task.commands) && task.commands.length >= 2) {
                const deactivateCommand = task.commands[1]
                if (deactivateCommand && deactivateCommand.wait_for && typeof deactivateCommand.wait_for === 'string') {
                    // Parse wait_for format like "5m" to get minutes
                    const match = deactivateCommand.wait_for.match(/(\d+)m/)
                    if (match) {
                        return parseInt(match[1])
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing task duration:', error, task)
        }
        return 5 // Default duration in minutes
    }

    // Get human-readable schedule description
    const getScheduleDescription = (data) => {
        try {
            if (!data || !data.time || typeof data.time !== 'string') {
                return 'Invalid schedule'
            }

            const timeStr = data.time
            const [hour, minute] = timeStr.split(':')
            const timeDisplay = new Date(2000, 0, 1, parseInt(hour), parseInt(minute)).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })

            switch (data.frequency) {
                case 'daily':
                    return `Daily at ${timeDisplay}`
                case 'weekly':
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                    const dayName = days[parseInt(data.dayOfWeek) - 1] || 'Sunday'
                    return `Weekly on ${dayName}s at ${timeDisplay}`
                case 'every2days':
                    return `Every 2 days at ${timeDisplay}`
                case 'every3days':
                    return `Every 3 days at ${timeDisplay}`
                default:
                    return `Daily at ${timeDisplay}`
            }
        } catch (error) {
            console.error('Error generating schedule description:', error, data)
            return 'Invalid schedule'
        }
    }

    // Load task executions
    const loadTaskExecutions = async (taskId) => {
        try {
            setExecutionsLoading(true)
            setExecutionsError(null)
            const response = await scheduledTasksApi.getTaskExecutions(tenantId, deviceId, taskId, 3)
            setTaskExecutions(response.data || [])
        } catch (err) {
            setExecutionsError(err.message)
            console.error('Failed to load task executions:', err)
        } finally {
            setExecutionsLoading(false)
        }
    }

    // Handle showing executions for a task
    const handleShowExecutions = async (task) => {
        console.log('Show executions clicked for task:', task.id)
        setSelectedTask(task)
        setShowExecutionsModal(true)
        await loadTaskExecutions(task.id)
    }

    // Close executions modal
    const closeExecutionsModal = () => {
        setShowExecutionsModal(false)
        setSelectedTask(null)
        setTaskExecutions([])
        setExecutionsError(null)
    }

    if (loading) {
        return (
            <div className="scheduled-irrigation">
                <div className="scheduled-irrigation-header">
                    <div className="scheduled-irrigation-title">
                        <Calendar size={18} />
                        <span>Scheduled Irrigation</span>
                    </div>
                </div>
                <div className="scheduled-irrigation-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading scheduled tasks...</span>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="scheduled-irrigation">
                <div className="scheduled-irrigation-header">
                    <div className="scheduled-irrigation-title">
                        <Calendar size={18} />
                        <span>Scheduled Irrigation</span>
                    </div>
                    <button
                        className="add-schedule-btn"
                        onClick={handleAddNew}
                    >
                        <Plus size={16} />
                        Add Schedule
                    </button>
                </div>

                {/* Scheduled Tasks List */}
                <div className="scheduled-tasks-list">
                    {scheduledTasks.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <h4>No scheduled irrigation tasks</h4>
                            <p>Create your first scheduled irrigation task to automate watering.</p>
                            <button
                                className="add-first-schedule-btn"
                                onClick={handleAddNew}
                            >
                                <Plus size={16} />
                                Add First Schedule
                            </button>
                        </div>
                    ) : (
                        scheduledTasks.map((task) => (
                            <div key={task.id} className="scheduled-task-item">
                                <div className="task-info">
                                    <div className="task-header">
                                        <div className="task-schedule">
                                            <Clock size={16} />
                                            <span>{parseCronExpression(task.schedule)}</span>
                                        </div>
                                        <div className="task-status">
                                            <div
                                                className={`status-indicator ${task.is_active ? 'active' : 'inactive'}`}
                                            />
                                            <span>{task.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>

                                    <div className="task-details">
                                        <div className="task-duration">
                                            <Droplets size={14} />
                                            <span>{getTaskDuration(task)} minutes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="task-actions">
                                    <button
                                        onClick={() => handleShowExecutions(task)}
                                        className="executions-btn"
                                        title="View Executions"
                                    >
                                        <Calendar size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(task)}
                                        className={`toggle-btn ${task.is_active ? 'pause' : 'play'}`}
                                        title={task.is_active ? 'Pause' : 'Activate'}
                                    >
                                        {task.is_active ? <Pause size={14} /> : <Play size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(task)}
                                        className="edit-btn"
                                        title="Edit"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="delete-btn"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTask ? 'Edit Schedule' : 'New Schedule'}</h3>
                            <button onClick={closeModal} className="modal-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="modal-error">
                                <span>{error}</span>
                                <button onClick={() => setError(null)}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-form">
                            {/* Schedule Preview */}
                            <div className="schedule-preview">
                                <div className="preview-label">Schedule Preview:</div>
                                <div className="preview-text">{getScheduleDescription(formData)}</div>
                            </div>

                            {/* Frequency Selection */}
                            <div className="form-group">
                                <label>Frequency</label>
                                <div className="frequency-options">
                                    <label className="frequency-option">
                                        <input
                                            type="radio"
                                            name="frequency"
                                            value="daily"
                                            checked={formData.frequency === 'daily'}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        />
                                        <span>Daily</span>
                                    </label>
                                    <label className="frequency-option">
                                        <input
                                            type="radio"
                                            name="frequency"
                                            value="every2days"
                                            checked={formData.frequency === 'every2days'}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        />
                                        <span>Every 2 days</span>
                                    </label>
                                    <label className="frequency-option">
                                        <input
                                            type="radio"
                                            name="frequency"
                                            value="every3days"
                                            checked={formData.frequency === 'every3days'}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        />
                                        <span>Every 3 days</span>
                                    </label>
                                    <label className="frequency-option">
                                        <input
                                            type="radio"
                                            name="frequency"
                                            value="weekly"
                                            checked={formData.frequency === 'weekly'}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        />
                                        <span>Weekly</span>
                                    </label>
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div className="form-group">
                                <label htmlFor="time">Time</label>
                                <input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>

                            {/* Day Selection (Weekly) */}
                            {formData.frequency === 'weekly' && (
                                <div className="form-group">
                                    <label htmlFor="dayOfWeek">Day of Week</label>
                                    <select
                                        id="dayOfWeek"
                                        value={formData.dayOfWeek}
                                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="1">Monday</option>
                                        <option value="2">Tuesday</option>
                                        <option value="3">Wednesday</option>
                                        <option value="4">Thursday</option>
                                        <option value="5">Friday</option>
                                        <option value="6">Saturday</option>
                                        <option value="7">Sunday</option>
                                    </select>
                                </div>
                            )}

                            {/* Duration Selection */}
                            <div className="form-group">
                                <label htmlFor="duration">Duration (minutes)</label>
                                <div className="duration-slider-container">
                                    <input
                                        id="duration"
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        className="duration-slider"
                                        required
                                    />
                                    <div className="duration-value">
                                        <span>{formData.duration}</span>
                                    </div>
                                </div>
                                <div className="duration-display">
                                    <Droplets size={14} />
                                    <span>Will irrigate for {formData.duration} minute{formData.duration !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="form-group">
                                <label className="switch-label">
                                    <span>Active</span>
                                    <div className="switch-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="switch-input"
                                        />
                                        <span className="switch-slider"></span>
                                    </div>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="save-btn">
                                    <Check size={16} />
                                    {editingTask ? 'Update' : 'Create'} Schedule
                                </button>
                                <button type="button" onClick={closeModal} className="cancel-btn">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Executions Modal */}
            {showExecutionsModal && (
                <div className="modal-overlay" onClick={closeExecutionsModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Last 3 Task Executions</h3>
                            <button onClick={closeExecutionsModal} className="modal-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {selectedTask && (
                            <div className="task-info-header">
                                <div className="task-schedule">
                                    <Clock size={16} />
                                    <span>{parseCronExpression(selectedTask.schedule)}</span>
                                </div>
                                <div className="task-duration">
                                    <Droplets size={14} />
                                    <span>{getTaskDuration(selectedTask)} minutes</span>
                                </div>
                            </div>
                        )}

                        {executionsLoading ? (
                            <div className="modal-loading">
                                <div className="loading-spinner"></div>
                                <span>Loading executions...</span>
                            </div>
                        ) : executionsError ? (
                            <div className="modal-error">
                                <span>{executionsError}</span>
                                <button onClick={() => setExecutionsError(null)}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="executions-list">
                                    {taskExecutions.length === 0 ? (
                                        <div className="empty-state">
                                            <Calendar size={48} />
                                            <h4>No executions found</h4>
                                            <p>This scheduled task has not been executed yet.</p>
                                        </div>
                                    ) : (
                                        taskExecutions.map((execution) => {
                                            const startCommand = execution.commands[0];
                                            const endCommand = execution.commands[1];

                                            const formatDateTime = (dateString) => {
                                                if (!dateString) return 'Unknown';
                                                const date = new Date(dateString);
                                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                                                const day = days[date.getDay()];
                                                const dayNum = date.getDate();
                                                const month = months[date.getMonth()];
                                                const hours = date.getHours().toString().padStart(2, '0');
                                                const minutes = date.getMinutes().toString().padStart(2, '0');

                                                return `${day} ${dayNum} ${month}, ${hours}:${minutes}`;
                                            };

                                            return (
                                                <div key={execution.id} className="execution-item">
                                                    <div className="execution-info">
                                                        <div className="execution-timestamp">
                                                            <Clock size={14} />
                                                            <span><strong>Started:</strong> {formatDateTime(startCommand?.sent_at)}</span>
                                                        </div>
                                                        <div className="execution-timestamp">
                                                            <Clock size={14} />
                                                            <span><strong>Ended:</strong> {endCommand?.sent_at ? formatDateTime(endCommand.sent_at) : <em>In progress</em>}</span>
                                                        </div>
                                                    </div>
                                                    <div className="execution-status">
                                                        <div className="status-indicator completed" />
                                                        <span>Completed</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="modal-actions">
                                    <button onClick={closeExecutionsModal} className="close-btn">
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default ScheduledIrrigation 