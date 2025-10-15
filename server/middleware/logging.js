import { createRequestLogger, logApiRequest, logApiError, logSystemEvent } from '../logger.js'

/**
 * Express middleware for request logging
 * This middleware logs all HTTP requests with structured data
 */
export function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now()

    // Create request-scoped logger
    req.logger = createRequestLogger(req, {
        operation: 'http_request'
    })

    // Log request start
    req.logger.info({
        event: 'request_start',
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        contentLength: req.headers['content-length']
    }, 'Request started')

    // Override res.end to capture response data
    const originalEnd = res.end
    res.end = function (chunk, encoding) {
        const duration = Date.now() - startTime

        // Log response
        if (res.statusCode >= 400) {
            logApiError(req, new Error(`HTTP ${res.statusCode}`), duration)
        } else {
            logApiRequest(req, res, duration)
        }

        // Call original end
        originalEnd.call(this, chunk, encoding)
    }

    next()
}

/**
 * Error logging middleware
 * This middleware logs all unhandled errors
 */
export function errorLoggingMiddleware(err, req, res, next) {
    const duration = Date.now() - (req.startTime || Date.now())

    // Log the error
    logApiError(req, err, duration)

    // Log system event for critical errors
    if (err.status >= 500) {
        logSystemEvent('critical_error', {
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack
            },
            request: {
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection?.remoteAddress
            }
        })
    }

    next(err)
}

/**
 * WebSocket logging middleware
 * This middleware logs WebSocket connection events
 */
export function websocketLoggingMiddleware(ws, req) {
    const wsLogger = createRequestLogger(req, {
        operation: 'websocket_connection'
    })

    wsLogger.info({
        event: 'websocket_connected',
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress
    }, 'WebSocket client connected')

    // Log disconnection
    ws.on('close', (code, reason) => {
        wsLogger.info({
            event: 'websocket_disconnected',
            code,
            reason: reason.toString()
        }, 'WebSocket client disconnected')
    })

    // Log errors
    ws.on('error', (error) => {
        wsLogger.error({
            event: 'websocket_error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        }, 'WebSocket error')
    })

    return wsLogger
}

/**
 * Performance logging middleware
 * This middleware logs performance metrics for requests
 */
export function performanceLoggingMiddleware(req, res, next) {
    const startTime = process.hrtime.bigint()

    res.on('finish', () => {
        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds

        const perfLogger = createRequestLogger(req, {
            operation: 'performance'
        })

        perfLogger.info({
            event: 'request_performance',
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('content-length'),
            userAgent: req.headers['user-agent']
        }, 'Request performance metrics')
    })

    next()
}

export default {
    requestLoggingMiddleware,
    errorLoggingMiddleware,
    websocketLoggingMiddleware,
    performanceLoggingMiddleware
}
