import express from 'express'

// Configuration
const ZENSOR_API_URL = process.env.ZENSOR_API_URL || 'http://localhost:3000'
const ZENSOR_API_KEY = process.env.ZENSOR_API_KEY || ''

export function setupApiProxy(app) {
    console.log(`🔗 Setting up API proxy to: ${ZENSOR_API_URL}`)

    // Parse JSON bodies
    app.use(express.json())

    // Manual proxy implementation
    app.use('/api/*', async (req, res) => {
        try {
            // Transform /api/* to /v1/*
            const targetPath = req.path.replace(/^\/api/, '/v1')
            const targetUrl = `${ZENSOR_API_URL}${targetPath}${req.search || ''}`

            // Log requests in development
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🔄 Proxying ${req.method} ${req.path} -> ${targetUrl}`)
            }

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                ...req.headers
            }

            // Remove host header to avoid conflicts
            delete headers.host

            // Propagate standard user authentication headers
            const userHeaders = {}

            // Standard authentication headers
            if (req.headers.authorization) {
                userHeaders['Authorization'] = req.headers.authorization
            }
            if (req.headers['x-user-id']) {
                userHeaders['X-User-ID'] = req.headers['x-user-id']
            }
            if (req.headers['x-user-email']) {
                userHeaders['X-User-Email'] = req.headers['x-user-email']
            }
            if (req.headers['x-user-name']) {
                userHeaders['X-User-Name'] = req.headers['x-user-name']
            }
            if (req.headers['x-tenant-id']) {
                userHeaders['X-Tenant-ID'] = req.headers['x-tenant-id']
            }
            if (req.headers['x-request-id']) {
                userHeaders['X-Request-ID'] = req.headers['x-request-id']
            }
            if (req.headers['x-forwarded-for']) {
                userHeaders['X-Forwarded-For'] = req.headers['x-forwarded-for']
            }
            if (req.headers['x-real-ip']) {
                userHeaders['X-Real-IP'] = req.headers['x-real-ip']
            }

            // Legacy headers (for backward compatibility)
            if (req.headers['remote-user']) {
                userHeaders['X-User-ID'] = req.headers['remote-user']
            }
            if (req.headers['remote-name']) {
                userHeaders['X-User-Name'] = req.headers['remote-name']
            }
            if (req.headers['remote-email']) {
                userHeaders['X-User-Email'] = req.headers['remote-email']
            }

            // Merge user headers with existing headers
            Object.assign(headers, userHeaders)

            // Inject server API key for all requests
            if (ZENSOR_API_KEY) {
                headers['X-Auth-Token'] = ZENSOR_API_KEY
                headers['Authorization'] = `Bearer ${ZENSOR_API_KEY}`
            }

            // Prepare fetch options
            const fetchOptions = {
                method: req.method,
                headers
            }

            // Add body for POST/PUT requests
            if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
                fetchOptions.body = JSON.stringify(req.body)
            }

            // Make request to Zensor API
            const response = await fetch(targetUrl, fetchOptions)

            // Set response headers
            res.set('Access-Control-Allow-Origin', '*')
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email')

            // Forward response
            const data = await response.text()
            res.status(response.status)

            // Try to parse as JSON, fallback to text
            try {
                const jsonData = JSON.parse(data)
                res.json(jsonData)
            } catch {
                res.send(data)
            }

        } catch (error) {
            console.error('❌ Proxy error:', error.message)
            res.status(500).json({
                error: 'Proxy Error',
                message: 'Failed to connect to Zensor API',
                details: error.message
            })
        }
    })

    // Handle preflight requests
    app.options('/api/*', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email')
        res.sendStatus(200)
    })

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            zensorApiUrl: ZENSOR_API_URL,
            hasApiKey: !!ZENSOR_API_KEY
        })
    })

    console.log('✅ API proxy configured successfully')
} 