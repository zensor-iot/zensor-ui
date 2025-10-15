import express from 'express'
import { tracer, injectTraceContext, addHttpSpanAttributes, addErrorSpanAttributes, recordHttpRequestMetrics } from '../tracing.js'
import { context, trace } from '@opentelemetry/api'
import { logSystemEvent, createLogger } from '../logger.js'

// Configuration
const ZENSOR_API_URL = process.env.ZENSOR_API_URL || 'http://localhost:3000'
const ZENSOR_API_KEY = process.env.ZENSOR_API_KEY || ''

export function setupApiProxy(app) {
    logSystemEvent('api_proxy_middleware_setup', {
        targetUrl: ZENSOR_API_URL
    })

    // Parse JSON bodies
    app.use(express.json())

    // Manual proxy implementation
    app.use('/api/*', async (req, res) => {
        // Create a span for the API proxy operation
        const span = tracer.startSpan(`API Proxy: ${req.method} ${req.path}`, {
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

            // Log requests in development
            if (process.env.NODE_ENV !== 'production') {
                const logger = createLogger({ operation: 'api_proxy' })
                logger.debug({
                    event: 'api_proxy_request',
                    method: req.method,
                    path: req.path,
                    targetUrl
                }, `Proxying ${req.method} ${req.path} -> ${targetUrl}`)
            }

            // Prepare headers with trace context injection
            const headers = {
                'Content-Type': 'application/json',
                ...req.headers
            }

            // Inject trace context into headers for propagation to backend
            const headersWithTrace = injectTraceContext(headers)

            // Remove host header to avoid conflicts
            delete headersWithTrace.host

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

            // Inject server API key for all requests
            if (ZENSOR_API_KEY) {
                headersWithTrace['X-Auth-Token'] = ZENSOR_API_KEY
                headersWithTrace['Authorization'] = `Bearer ${ZENSOR_API_KEY}`
            }

            // Add trace context headers for debugging
            if (process.env.NODE_ENV !== 'production') {
                const logger = createLogger({ operation: 'api_proxy' })
                logger.debug({
                    event: 'trace_context_headers',
                    traceHeaders: {
                        'b3-trace-id': headersWithTrace['b3-trace-id'] || 'not set',
                        'b3-span-id': headersWithTrace['b3-span-id'] || 'not set',
                        'b3-parent-span-id': headersWithTrace['b3-parent-span-id'] || 'not set',
                        'b3-sampled': headersWithTrace['b3-sampled'] || 'not set',
                    }
                }, 'Trace context headers')
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

            // Set response headers
            res.set('Access-Control-Allow-Origin', '*')
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-User-Role, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email, Remote-Role')

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
            console.error('❌ Proxy error:', error.message)

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

    // Handle preflight requests
    app.options('/api/*', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-User-Role, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email, Remote-Role')
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

    logSystemEvent('api_proxy_configured', {
        targetUrl: ZENSOR_API_URL
    })
} 