// API Configuration for Express.js proxy
const config = {
    // Local API base URL (proxied through Express server)
    apiBaseUrl: typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/api`
        : '/api',

    // Grafana base URL
    grafanaBaseUrl: import.meta.env.VITE_GRAFANA_BASE_URL || 'https://cardamomo.zensor-iot.net',

    // Grafana API Key for authentication (still client-side for Grafana)
    grafanaApiKey: import.meta.env.VITE_GRAFANA_API_KEY || '',

    // WebSocket base URL (proxied through Express server)
    get wsBaseUrl() {
        if (typeof window !== 'undefined') {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            return `${wsProtocol}//${window.location.host}`
        }
        return 'ws://localhost:5173'
    },

    // API endpoints (now relative to proxy)
    endpoints: {
        tenants: '/tenants',
        devices: '/devices',
        websocket: '/ws/device-messages',
        scheduledTasks: '/tenants/{tenant_id}/devices/{device_id}/scheduled-tasks'
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

// Device Commands API functions
export const deviceCommandsApi = {
    // Send a command to a device
    async sendCommand(deviceId, commandData) {
        const url = getApiUrl(`/devices/${deviceId}/commands`)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commandData)
        })

        if (!response.ok) {
            throw new Error(`Failed to send command: ${response.status}`)
        }

        return response.json()
    }
}

export default config 