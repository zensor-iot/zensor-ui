// API Configuration
const config = {
    // Backend API base URL
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',

    // WebSocket base URL (derived from API base URL)
    get wsBaseUrl() {
        const url = new URL(this.apiBaseUrl)
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${wsProtocol}//${url.host}`
    },

    // API endpoints
    endpoints: {
        tenants: '/v1/tenants',
        devices: '/v1/devices',
        websocket: '/ws/device-messages',
        scheduledTasks: '/v1/tenants/{tenant_id}/devices/{device_id}/scheduled-tasks'
    }
}

// Helper functions for building URLs
export const getApiUrl = (path = '') => {
    return `${config.apiBaseUrl}${path}`
}

export const getWebSocketUrl = (path = '') => {
    return `${config.wsBaseUrl}${path}`
}

export const buildApiEndpoint = (endpoint, ...params) => {
    let path = config.endpoints[endpoint]
    if (!path) {
        throw new Error(`Unknown endpoint: ${endpoint}`)
    }

    // Replace parameters in the path
    params.forEach(param => {
        path = path.replace(/\{[^}]+\}/, param)
    })

    return getApiUrl(path)
}

// Scheduled Tasks API functions
export const scheduledTasksApi = {
    // Get all scheduled tasks for a device
    async getScheduledTasks(tenantId, deviceId, page = 1, limit = 10) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId)
        const response = await fetch(`${url}?page=${page}&limit=${limit}`)

        if (!response.ok) {
            throw new Error(`Failed to fetch scheduled tasks: ${response.status}`)
        }

        return response.json()
    },

    // Create a new scheduled task
    async createScheduledTask(tenantId, deviceId, taskData) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        })

        if (!response.ok) {
            throw new Error(`Failed to create scheduled task: ${response.status}`)
        }

        return response.json()
    },

    // Update an existing scheduled task
    async updateScheduledTask(tenantId, deviceId, taskId, taskData) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId) + `/${taskId}`
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        })

        if (!response.ok) {
            throw new Error(`Failed to update scheduled task: ${response.status}`)
        }

        return response.json()
    },

    // Delete a scheduled task
    async deleteScheduledTask(tenantId, deviceId, taskId) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId) + `/${taskId}`
        const response = await fetch(url, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete scheduled task: ${response.status}`)
        }
    },

    // Get a specific scheduled task
    async getScheduledTask(tenantId, deviceId, taskId) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId) + `/${taskId}`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch scheduled task: ${response.status}`)
        }

        return response.json()
    },

    // Get task executions for a scheduled task
    async getTaskExecutions(tenantId, deviceId, scheduledTaskId, limit = 3) {
        const url = buildApiEndpoint('scheduledTasks', tenantId, deviceId) + `/${scheduledTaskId}/tasks`
        const response = await fetch(`${url}?limit=${limit}`)

        if (!response.ok) {
            throw new Error(`Failed to fetch task executions: ${response.status}`)
        }

        return response.json()
    }
}

export default config 