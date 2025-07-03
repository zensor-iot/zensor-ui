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
import { useNotification } from '../hooks/useNotification'
import './ScheduledIrrigation.css'

const ScheduledIrrigationWithNotifications = ({ tenantId, deviceId, deviceName }) => {
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

    // Notification hook with error handling
    let notificationFunctions = { showError: () => { }, showWarning: () => { }, showApiNotification: () => { } }
    try {
        notificationFunctions = useNotification()
    } catch (err) {
        console.error('Failed to initialize notification hook:', err)
    }
    const { showError, showWarning, showApiNotification } = notificationFunctions

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
            console.log('Loading scheduled tasks for:', { tenantId, deviceId })
            const response = await scheduledTasksApi.getScheduledTasks(tenantId, deviceId)
            console.log('Scheduled tasks response:', response)
            setScheduledTasks(response.data || [])
        } catch (err) {
            setError(err.message)
            console.error('Failed to load scheduled tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (tenantId && deviceId) {
            loadScheduledTasks()
        } else {
            console.warn('Missing required props:', { tenantId, deviceId })
            setLoading(false)
        }
    }, [tenantId, deviceId])

    // Convert human-friendly form data to cron expression (5-part format)
    const formDataToCron = (data) => {
        try {
            if (!data || !data.time) {
                console.error('Invalid form data for cron conversion:', data)
                return '0 6 * * *' // Default to 6 AM daily
            }

            const [hour, minute] = data.time.split(':')
            if (!hour || !minute) {
                console.error('Invalid time format:', data.time)
                return '0 6 * * *' // Default to 6 AM daily
            }

            switch (data.frequency) {
                case 'daily':
                    return `${minute} ${hour} * * *`
                case 'weekly':
                    return `${minute} ${hour} * * ${data.dayOfWeek || '1'}`
                case 'every2days':
                    return `${minute} ${hour} */2 * *`
                case 'every3days':
                    return `${minute} ${hour} */3 * *`
                default:
                    return `${minute} ${hour} * * *`
            }
        } catch (err) {
            console.error('Error converting form data to cron:', err, data)
            return '0 6 * * *' // Default to 6 AM daily
        }
    }

    // Convert cron expression to human-friendly form data (supports both 5 and 6-part formats)
    const cronToFormData = (cron) => {
        try {
            const parts = cron.split(' ')
            if (parts.length !== 5 && parts.length !== 6) {
                console.error('Invalid cron format (expected 5 or 6 parts):', cron)
                return null
            }

            // Handle both 5-part and 6-part formats
            let minute, hour, day, month, dayOfWeekCron
            if (parts.length === 6) {
                // 6-part format: second minute hour day month dayOfWeek
                [, minute, hour, day, month, dayOfWeekCron] = parts
            } else {
                // 5-part format: minute hour day month dayOfWeek
                [minute, hour, day, month, dayOfWeekCron] = parts
            }

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
        } catch (err) {
            console.error('Error parsing cron expression:', err, cron)
            return null
        }
    }

    // Handle form submission with notification
    const handleSubmit = async (e) => {
        e.preventDefault()

        const cronExpression = formDataToCron(formData)
        // Ensure duration is within valid range (1-60 minutes)
        const duration = Math.max(1, Math.min(60, formData.duration))

        const taskData = {
            commands: [
                {
                    index: 1,
                    value: 1, // Activate relay
                    priority: "NORMAL",
                    wait_for: "0s" // Immediate activation
                },
                {
                    index: 1,
                    value: 0, // Deactivate relay
                    priority: "NORMAL",
                    wait_for: `${duration}m` // Wait for user's selected duration (1-60 minutes)
                }
            ],
            schedule: cronExpression,
            is_active: formData.isActive
        }

        console.log('Submitting task:', { editingTask, taskData, tenantId, deviceId })

        const operation = editingTask
            ? scheduledTasksApi.updateScheduledTask(tenantId, deviceId, editingTask.id, taskData)
            : scheduledTasksApi.createScheduledTask(tenantId, deviceId, taskData)

        const result = await showApiNotification(
            operation,
            editingTask
                ? 'Scheduled irrigation task updated successfully!'
                : 'Scheduled irrigation task created successfully!',
            editingTask
                ? 'Failed to update scheduled irrigation task'
                : 'Failed to create scheduled irrigation task',
            editingTask ? 'Task Updated' : 'Task Created',
            'Operation Failed'
        )

        if (result.success) {
            if (editingTask) {
                // Update existing task in UI
                setScheduledTasks(prev => prev.map(task =>
                    task.id === editingTask.id
                        ? { ...task, ...taskData, id: editingTask.id }
                        : task
                ))
            } else {
                // Add new task to UI using the returned UUID
                const returnedTask = result.data
                const newTask = {
                    id: returnedTask?.id || returnedTask?.uuid || Date.now(), // Use returned UUID or fallback
                    ...taskData,
                    schedule: cronExpression,
                    is_active: formData.isActive
                }

                console.log('New task created with UUID:', newTask.id, 'API response:', returnedTask)
                setScheduledTasks(prev => [...prev, newTask])
            }

            // Reset form and close modal
            closeModal()
        }
    }

    // Handle task deletion with notification
    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this scheduled irrigation task?')) {
            return
        }

        const result = await showApiNotification(
            scheduledTasksApi.deleteScheduledTask(tenantId, deviceId, taskId),
            'Scheduled irrigation task deleted successfully',
            'Failed to delete scheduled irrigation task',
            'Task Deleted',
            'Delete Failed'
        )

        if (result.success) {
            // Remove the task from the UI immediately
            setScheduledTasks(prev => prev.filter(task => task.id !== taskId))
        }
    }

    // Handle task toggle (active/inactive) with notification
    const handleToggleActive = async (task) => {
        // Ensure all wait_for values are properly formatted as strings
        const normalizedCommands = task.commands.map(cmd => ({
            ...cmd,
            wait_for: typeof cmd.wait_for === 'number' ? `${cmd.wait_for}s` : String(cmd.wait_for)
        }))

        const updatedTask = {
            commands: normalizedCommands,
            schedule: task.schedule,
            is_active: !task.is_active
        }

        const result = await showApiNotification(
            scheduledTasksApi.updateScheduledTask(tenantId, deviceId, task.id, updatedTask),
            `Task ${!task.is_active ? 'activated' : 'deactivated'} successfully`,
            `Failed to ${!task.is_active ? 'activate' : 'deactivate'} task`,
            'Status Updated',
            'Update Failed'
        )

        if (result.success) {
            // Update the task's active state in the UI immediately
            setScheduledTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { ...t, is_active: !task.is_active }
                    : t
            ))
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
    }

    // Parse cron expression for display (supports both 5 and 6-part formats)
    const parseCronExpression = (cron) => {
        try {
            if (!cron || typeof cron !== 'string') {
                console.error('Invalid cron expression:', cron)
                return 'Invalid schedule'
            }

            const parts = cron.split(' ')
            if (parts.length !== 5 && parts.length !== 6) {
                console.error('Invalid cron format (expected 5 or 6 parts):', cron)
                return 'Invalid schedule'
            }

            // Handle both 5-part and 6-part formats
            let minute, hour, day, month, dayOfWeek
            if (parts.length === 6) {
                // 6-part format: second minute hour day month dayOfWeek
                [, minute, hour, day, month, dayOfWeek] = parts
            } else {
                // 5-part format: minute hour day month dayOfWeek
                [minute, hour, day, month, dayOfWeek] = parts
            }

            // Convert to readable format
            const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`

            if (dayOfWeek !== '*') {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dayIndex = parseInt(dayOfWeek) - 1
                const dayName = days[dayIndex] || 'Sun'
                return `Weekly on ${dayName} at ${time}`
            } else if (day.startsWith('*/')) {
                const interval = parseInt(day.substring(2))
                return `Every ${interval} days at ${time}`
            } else {
                return `Daily at ${time}`
            }
        } catch (err) {
            console.error('Error parsing cron expression:', err, cron)
            return 'Invalid schedule'
        }
    }

    // Get task duration from commands (always returns 1-60 minutes)
    const getTaskDuration = (task) => {
        try {
            if (!task || !task.commands || task.commands.length < 2) return 5

            const deactivateCommand = task.commands.find(cmd => cmd.value === 0)
            if (deactivateCommand && deactivateCommand.wait_for) {
                // Ensure wait_for is a string before calling match
                const waitFor = String(deactivateCommand.wait_for)

                // Parse different time units and convert to minutes
                const minutesMatch = waitFor.match(/(\d+)m/)
                const secondsMatch = waitFor.match(/(\d+)s/)
                const hoursMatch = waitFor.match(/(\d+)h/)

                if (minutesMatch) {
                    const minutes = parseInt(minutesMatch[1])
                    return Math.max(1, Math.min(60, minutes))
                } else if (secondsMatch) {
                    const seconds = parseInt(secondsMatch[1])
                    const minutes = Math.ceil(seconds / 60)
                    return Math.max(1, Math.min(60, minutes))
                } else if (hoursMatch) {
                    const hours = parseInt(hoursMatch[1])
                    const minutes = hours * 60
                    return Math.max(1, Math.min(60, minutes))
                }
            }

            return 5 // Default duration
        } catch (err) {
            console.error('Error parsing task duration:', err, task)
            return 5
        }
    }

    // Get human-readable schedule description
    const getScheduleDescription = (data) => {
        const time = data.time
        const duration = data.duration

        switch (data.frequency) {
            case 'daily':
                return `Daily at ${time} for ${duration} minutes`
            case 'weekly':
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const dayName = days[parseInt(data.dayOfWeek) - 1]
                return `Weekly on ${dayName} at ${time} for ${duration} minutes`
            case 'every2days':
                return `Every 2 days at ${time} for ${duration} minutes`
            case 'every3days':
                return `Every 3 days at ${time} for ${duration} minutes`
            default:
                return `Daily at ${time} for ${duration} minutes`
        }
    }

    // Load task executions
    const loadTaskExecutions = async (taskId) => {
        try {
            setExecutionsLoading(true)
            setExecutionsError(null)
            const response = await scheduledTasksApi.getTaskExecutions(tenantId, deviceId, taskId)
            setTaskExecutions(response.data || [])
        } catch (err) {
            setExecutionsError(err.message)
            console.error('Failed to load task executions:', err)
        } finally {
            setExecutionsLoading(false)
        }
    }

    const handleShowExecutions = async (task) => {
        setSelectedTask(task)
        setShowExecutionsModal(true)
        await loadTaskExecutions(task.id)
    }

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

export default ScheduledIrrigationWithNotifications 