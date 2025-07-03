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

    // Notification hook
    const { showSuccess, showError, showWarning, showApiNotification, showNotification } = useNotification()

    // Form state with human-friendly options
    const [formData, setFormData] = useState({
        frequency: 'daily', // daily, every2days, every3days, weekly
        time: '06:00', // HH:MM format
        dayOfWeek: '1', // 1-7 (Monday-Sunday)
        duration: 5,
        isActive: true
    })

    // Load scheduled tasks with notification
    const loadScheduledTasks = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await scheduledTasksApi.getScheduledTasks(tenantId, deviceId)
            setScheduledTasks(response.data || [])

            // Show success notification for successful load
            if (response.data?.length > 0) {
                showSuccess(`Loaded ${response.data.length} scheduled irrigation tasks`)
            }
        } catch (err) {
            setError(err.message)
            showError(`Failed to load scheduled tasks: ${err.message}`, 'Loading Error')
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

    // Handle form submission with notification
    const handleSubmit = async (e) => {
        e.preventDefault()

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
            // Reset form and reload tasks
            closeModal()
            await loadScheduledTasks()
        }
    }

    // Handle task deletion with notification
    const handleDelete = async (taskId) => {
        // Show warning before deletion
        showWarning(
            'This action cannot be undone. The scheduled irrigation task will be permanently deleted.',
            'Confirm Deletion'
        )

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
            await loadScheduledTasks()
        }
    }

    // Handle task toggle (active/inactive) with notification
    const handleToggleActive = async (task) => {
        const updatedTask = {
            commands: task.commands,
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
            await loadScheduledTasks()
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

        // Show info notification
        showSuccess(`Editing scheduled irrigation task`, 'Edit Mode')
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

        // Show info notification
        showSuccess('Creating new scheduled irrigation task', 'New Task')
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

    // Parse cron expression for display
    const parseCronExpression = (cron) => {
        const parts = cron.split(' ')
        if (parts.length !== 6) return 'Invalid schedule'

        const [second, minute, hour, day, month, dayOfWeek] = parts

        // Convert to readable format
        const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`

        if (dayOfWeek !== '*') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            return `Weekly on ${days[parseInt(dayOfWeek) - 1]} at ${time}`
        } else if (day.startsWith('*/')) {
            const interval = parseInt(day.substring(2))
            return `Every ${interval} days at ${time}`
        } else {
            return `Daily at ${time}`
        }
    }

    // Get task duration from commands
    const getTaskDuration = (task) => {
        if (!task.commands || task.commands.length < 2) return 5

        const deactivateCommand = task.commands.find(cmd => cmd.value === 0)
        if (deactivateCommand && deactivateCommand.wait_for) {
            const match = deactivateCommand.wait_for.match(/(\d+)m/)
            return match ? parseInt(match[1]) : 5
        }

        return 5
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

    // Load task executions with notification
    const loadTaskExecutions = async (taskId) => {
        try {
            setExecutionsLoading(true)
            setExecutionsError(null)
            const response = await scheduledTasksApi.getTaskExecutions(tenantId, deviceId, taskId)
            setTaskExecutions(response.data || [])

            showSuccess(`Loaded ${response.data?.length || 0} task executions`)
        } catch (err) {
            setExecutionsError(err.message)
            showError(`Failed to load task executions: ${err.message}`, 'Loading Error')
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

    // Example of how to show a persistent notification for important operations
    const handleShowPersistentNotification = () => {
        showNotification({
            type: 'warning',
            title: 'Important System Notice',
            message: 'Scheduled irrigation tasks will be paused during system maintenance from 2-4 AM',
            autoHide: false
        })
    }

    // Rest of the component JSX would go here...
    // (This is just an example showing the notification integration)

    return (
        <div className="scheduled-irrigation">
            <div className="scheduled-irrigation-header">
                <div className="scheduled-irrigation-title">
                    <Droplets className="section-icon" />
                    <h4>Scheduled Irrigation</h4>
                </div>
                <button
                    className="add-schedule-btn"
                    onClick={handleAddNew}
                >
                    <Plus size={16} />
                    Add Schedule
                </button>
            </div>

            {/* Example button to show persistent notification */}
            <button
                onClick={handleShowPersistentNotification}
                style={{
                    marginBottom: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--color-warning)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius)',
                    cursor: 'pointer'
                }}
            >
                Show System Notice
            </button>

            {/* Rest of the component would render the scheduled tasks list */}
            {loading && <div className="scheduled-irrigation-loading">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            {/* This is a simplified version - the full component would have more JSX */}
        </div>
    )
}

export default ScheduledIrrigationWithNotifications 