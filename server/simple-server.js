// Initialize OpenTelemetry tracing first
import './tracing.js'

// Load environment variables from .env file if it exists
import { config } from 'dotenv'
config()

import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { setupWebSocketProxy } from './middleware/websocket-proxy.js'
import { tracingMiddleware, traceContextMiddleware } from './middleware/tracing.js'
import { tracer, injectTraceContext, addHttpSpanAttributes, addErrorSpanAttributes, recordHttpRequestMetrics } from './tracing.js'
import { requestLoggingMiddleware, errorLoggingMiddleware, performanceLoggingMiddleware } from './middleware/logging.js'
import { logSystemEvent, logApiRequest, logApiError, logWebSocketEvent } from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const port = process.env.PORT || 5173
const ZENSOR_API_URL = process.env.ZENSOR_API_URL || 'http://localhost:3000'
const ZENSOR_API_KEY = process.env.ZENSOR_API_KEY || ''

async function createSimpleServer() {
    const app = express()

    logSystemEvent('api_proxy_setup', {
        targetUrl: ZENSOR_API_URL
    })

    // Apply tracing middleware first
    app.use(traceContextMiddleware)
    app.use(tracingMiddleware)

    // Apply logging middleware
    app.use(requestLoggingMiddleware)
    app.use(performanceLoggingMiddleware)

    // Parse JSON bodies
    app.use(express.json())

    // User info endpoint - returns user data from authentication headers
    app.get('/api/user', (req, res) => {
        // For development, return mock data if no headers are present
        const hasAuthHeaders = req.headers['remote-user'] || req.headers['remote-name'] || req.headers['remote-email']

        const userInfo = hasAuthHeaders ? {
            user: req.headers['remote-user'] || null,
            name: req.headers['remote-name'] || null,
            email: req.headers['remote-email'] || null,
            role: req.headers['remote-role'] || null,
            isAdmin: req.headers['remote-role'] === 'admin'
        } : {
            // Mock data for development
            user: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin',
            tenant_id: 'test-tenant-id', // Mock tenant ID for development
            isAdmin: true
        }

        req.logger.info({
            event: 'user_info_request',
            userInfo: {
                user: userInfo.user,
                name: userInfo.name,
                email: userInfo.email,
                role: userInfo.role,
                tenant_id: userInfo.tenant_id,
                isAdmin: userInfo.isAdmin
            }
        }, 'User info requested')

        res.json(userInfo)
    })

    // Serve static files
    app.use(express.static(resolve(__dirname, '../dist/client')))

    // Handle preflight requests BEFORE the main proxy
    app.options('/api/*', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email, Remote-Role')
        res.sendStatus(200)
    })

    // Manual API proxy
    app.all('/api/*', async (req, res) => {
        // Create a span for the API proxy operation
        const span = req.span ? req.span : tracer.startSpan(`API Proxy: ${req.method} ${req.path}`, {
            kind: 2, // SpanKind.CLIENT
            attributes: {
                'span.kind': 'client',
                'component': 'zensor-ui',
                'operation': 'api_proxy',
                'http.method': req.method,
                'http.url': req.url,
                'http.target_path': req.path,
            },
        })

        try {
            // Transform /api/* to /v1/*
            const targetPath = req.path.replace(/^\/api/, '/v1')
            const targetUrl = `${ZENSOR_API_URL}${targetPath}${req.search || ''}`

            // Add target URL to span
            span.setAttributes({
                'http.target_url': targetUrl,
                'http.target_path': targetPath,
            })

            req.logger.info({
                event: 'api_proxy_request',
                targetUrl,
                targetPath,
                method: req.method,
                originalPath: req.path
            }, `Proxying ${req.method} ${req.path} -> ${targetUrl}`)

            // Prepare headers with trace context injection
            const headers = {
                'Content-Type': 'application/json',
                ...req.headers
            }

            // Inject trace context into headers for propagation to backend
            const headersWithTrace = injectTraceContext(headers)

            // Remove host header to avoid conflicts
            delete headersWithTrace.host

            // Remove accept-encoding to prevent compression issues
            delete headersWithTrace['accept-encoding']

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
            if (req.headers['x-user-role']) {
                userHeaders['X-User-Role'] = req.headers['x-user-role']
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
            if (req.headers['remote-role']) {
                userHeaders['X-User-Role'] = req.headers['remote-role']
            }

            // Merge user headers with existing headers
            Object.assign(headersWithTrace, userHeaders)

            // Log remote-* headers received
            const remoteHeaders = {}
            if (req.headers['remote-user']) remoteHeaders['remote-user'] = req.headers['remote-user']
            if (req.headers['remote-name']) remoteHeaders['remote-name'] = req.headers['remote-name']
            if (req.headers['remote-email']) remoteHeaders['remote-email'] = req.headers['remote-email']
            if (req.headers['remote-role']) remoteHeaders['remote-role'] = req.headers['remote-role']

            if (Object.keys(remoteHeaders).length > 0) {
                req.logger.info({
                    event: 'remote_headers_received',
                    remoteHeaders,
                    method: req.method,
                    path: req.path
                }, 'Remote authentication headers received')
            }

            // Inject server API key for all requests
            if (ZENSOR_API_KEY) {
                headersWithTrace['X-Auth-Token'] = ZENSOR_API_KEY
                headersWithTrace['Authorization'] = `Bearer ${ZENSOR_API_KEY}`
            }

            // Add trace context headers for debugging
            if (process.env.NODE_ENV !== 'production') {
                req.logger.debug({
                    event: 'trace_context_headers',
                    traceHeaders: {
                        'b3-trace-id': headersWithTrace['b3-trace-id'] || 'not set',
                        'b3-span-id': headersWithTrace['b3-span-id'] || 'not set',
                        'b3-parent-span-id': headersWithTrace['b3-parent-span-id'] || 'not set',
                        'b3-sampled': headersWithTrace['b3-sampled'] || 'not set',
                    }
                }, 'Trace context headers')
            }

            // Debug logging for header propagation (development only)
            if (process.env.NODE_ENV !== 'production') {
                req.logger.debug({
                    event: 'header_propagation',
                    headers: {
                        'Authorization': headersWithTrace.authorization ? '***' : 'not set',
                        'X-Auth-Token': headersWithTrace['x-auth-token'] ? '***' : 'not set',
                        'X-User-ID': headersWithTrace['x-user-id'] || 'not set',
                        'X-User-Email': headersWithTrace['x-user-email'] || 'not set',
                        'X-User-Role': headersWithTrace['x-user-role'] || 'not set',
                        'X-Tenant-ID': headersWithTrace['x-tenant-id'] || 'not set',
                        'X-Request-ID': headersWithTrace['x-request-id'] || 'not set'
                    }
                }, 'Propagating headers to Zensor API')
            }

            // Prepare fetch options
            const fetchOptions = {
                method: req.method,
                headers: headersWithTrace
            }

            // Add body for POST/PUT requests
            if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
                fetchOptions.body = JSON.stringify(req.body)
            }

            // Make request to Zensor API with timing
            const startTime = Date.now()
            const response = await fetch(targetUrl, fetchOptions)
            const responseTime = Date.now() - startTime

            // Add HTTP response attributes to span
            addHttpSpanAttributes(span, req.method, targetUrl, response.status, responseTime)
            span.setAttributes({
                'http.response_size': response.headers.get('content-length') || 0,
                'http.response_content_type': response.headers.get('content-type') || 'unknown',
            })

            // Record API proxy metrics
            recordHttpRequestMetrics(
                req.method,
                req.path,
                response.status,
                responseTime,
                {
                    operation: 'api_proxy',
                    target_url: targetUrl,
                    target_path: targetPath,
                    tenant_id: req.get('X-Tenant-ID'),
                    user_id: req.get('X-User-ID'),
                }
            )

            // Set CORS headers
            res.set('Access-Control-Allow-Origin', '*')
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email, Remote-Role')

            // Forward response
            const data = await response.text()
            res.status(Math.floor(response.status))

            // Set span status based on response
            if (response.status >= 400) {
                span.setStatus({
                    code: 2, // StatusCode.ERROR
                    message: `HTTP ${response.status}`,
                })
            } else {
                span.setStatus({ code: 1 }) // StatusCode.OK
            }

            // Try to parse as JSON, fallback to text
            try {
                const jsonData = JSON.parse(data)
                res.json(jsonData)
            } catch {
                res.send(data)
            }

            // End the span successfully
            span.end()

        } catch (error) {
            req.logger.error({
                event: 'api_proxy_error',
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                targetUrl,
                method: req.method,
                path: req.path
            }, 'Proxy error occurred')

            // Add error attributes to span
            addErrorSpanAttributes(span, error)
            span.end()

            res.status(500).json({
                error: 'Proxy Error',
                message: 'Failed to connect to Zensor API',
                details: error.message
            })
        }
    })

    // Health check endpoint
    app.get('/health', (req, res) => {
        req.logger.info({
            event: 'health_check',
            status: 'ok',
            zensorApiUrl: ZENSOR_API_URL,
            hasApiKey: !!ZENSOR_API_KEY
        }, 'Health check requested')

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

        req.logger.info({
            event: 'spa_serve',
            route: req.path,
            indexPath
        }, `Serving SPA for route: ${req.path} -> ${indexPath}`)

        res.sendFile(indexPath)
    })

    // Add error logging middleware
    app.use(errorLoggingMiddleware)

    return app
}

// Start server
createSimpleServer().then(app => {
    const server = createServer(app)

    // Setup WebSocket proxy
    setupWebSocketProxy(server)

    server.listen(port, () => {
        logSystemEvent('server_started', {
            port,
            apiUrl: ZENSOR_API_URL,
            hasApiKey: !!ZENSOR_API_KEY,
            environment: process.env.NODE_ENV || 'development'
        })

        // Log server startup with structured logging
        logSystemEvent('server_startup_complete', {
            port,
            apiUrl: ZENSOR_API_URL,
            hasApiKey: !!ZENSOR_API_KEY,
            status: 'running'
        })
    })
}).catch(err => {
    logSystemEvent('server_startup_error', {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack
        }
    })
    process.exit(1)
}) 