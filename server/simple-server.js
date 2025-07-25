import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { setupWebSocketProxy } from './middleware/websocket-proxy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const port = process.env.PORT || 5173
const ZENSOR_API_URL = process.env.ZENSOR_API_URL || 'http://localhost:3000'
const ZENSOR_API_KEY = process.env.ZENSOR_API_KEY || ''

async function createSimpleServer() {
    const app = express()

    console.log(`🔗 Setting up API proxy to: ${ZENSOR_API_URL}`)

    // Parse JSON bodies
    app.use(express.json())

    // User info endpoint - returns user data from authentication headers
    app.get('/api/user', (req, res) => {
        const userInfo = {
            user: req.headers['x-user'] || null,
            email: req.headers['x-user-email'] || null,
            name: req.headers['x-user-name'] || null
        }

        console.log('👤 User info requested:', userInfo)

        res.json(userInfo)
    })

    // Serve static files
    app.use(express.static(resolve(__dirname, '../dist/client')))

    // Manual API proxy
    app.all('/api/*', async (req, res) => {
        try {
            // Transform /api/* to /v1/*
            const targetPath = req.path.replace(/^\/api/, '/v1')
            const targetUrl = `${ZENSOR_API_URL}${targetPath}${req.search || ''}`

            console.log(`🔄 Proxying ${req.method} ${req.path} -> ${targetUrl}`)

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                ...req.headers
            }

            // Remove host header to avoid conflicts
            delete headers.host

            // Remove accept-encoding to prevent compression issues
            delete headers['accept-encoding']

            // Inject API key
            if (ZENSOR_API_KEY) {
                headers['X-API-Key'] = ZENSOR_API_KEY
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

            // Set CORS headers
            res.set('Access-Control-Allow-Origin', '*')
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

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
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
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

    // Debug endpoint to see path transformation
    app.get('/debug/path/:path(*)', (req, res) => {
        const inputPath = '/api/' + req.params.path
        const targetPath = inputPath.replace(/^\/api/, '/v1')
        const targetUrl = `${ZENSOR_API_URL}${targetPath}`

        res.json({
            inputPath,
            targetPath,
            zensorApiUrl: ZENSOR_API_URL,
            finalUrl: targetUrl
        })
    })

    // Serve index.html for all other routes (SPA)
    app.get('*', (req, res) => {
        // For production builds, serve from dist/client
        // For development, serve from root
        const indexPath = fs.existsSync(resolve(__dirname, '../dist/client/index.html'))
            ? resolve(__dirname, '../dist/client/index.html')
            : resolve(__dirname, '../index.html')

        console.log(`📄 Serving SPA for route: ${req.path} -> ${indexPath}`)
        res.sendFile(indexPath)
    })

    return app
}

// Start server
createSimpleServer().then(app => {
    const server = createServer(app)

    // Setup WebSocket proxy
    setupWebSocketProxy(server)

    server.listen(port, () => {
        console.log(`🚀 Simple server running at http://localhost:${port}`)
        console.log(`🔧 API proxy: ${ZENSOR_API_URL}`)
        console.log(`🔑 API key: ${ZENSOR_API_KEY ? 'configured' : 'not set'}`)
    })
}).catch(err => {
    console.error('Failed to start server:', err)
    process.exit(1)
}) 