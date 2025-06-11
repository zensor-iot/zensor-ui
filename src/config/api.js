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
        websocket: '/ws/device-messages'
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
        path = path.replace(/\/:[^/]+/, `/${param}`)
    })

    return getApiUrl(path)
}

export default config 