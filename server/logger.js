import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'

/**
 * Structured Logger for Zensor Portal UI
 * 
 * This logger provides structured logging with key:value pairs optimized for Loki.
 * It outputs logs that can be easily consumed by Loki via Docker logging drivers.
 * It supports multiple log levels, context enrichment, and automatic correlation
 * with OpenTelemetry traces.
 */

// Default configuration
const defaultConfig = {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
    service: 'zensor-ui',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.0.0'
}

// Custom serializer for key=value format
function serializeKeyValue(obj) {
    const parts = []

    // Always start with time and level
    if (obj.time) parts.push(`time=${obj.time}`)
    if (obj.level) parts.push(`level=${obj.level.toUpperCase()}`)

    // Add service metadata
    if (obj.service) parts.push(`service=${obj.service}`)
    if (obj.environment) parts.push(`environment=${obj.environment}`)
    if (obj.version) parts.push(`version=${obj.version}`)
    if (obj.hostname) parts.push(`hostname=${obj.hostname}`)
    if (obj.pid) parts.push(`pid=${obj.pid}`)

    // Add trace context if present
    if (obj.requestId) parts.push(`requestId=${obj.requestId}`)
    if (obj.traceId) parts.push(`traceId=${obj.traceId}`)
    if (obj.spanId) parts.push(`spanId=${obj.spanId}`)

    // Add event and operation context
    if (obj.event) parts.push(`event=${obj.event}`)
    if (obj.operation) parts.push(`operation=${obj.operation}`)

    // Add other key-value pairs (excluding already processed ones)
    const excludeKeys = ['time', 'level', 'service', 'environment', 'version', 'hostname', 'pid', 'requestId', 'traceId', 'spanId', 'event', 'operation', 'msg']

    for (const [key, value] of Object.entries(obj)) {
        if (!excludeKeys.includes(key)) {
            if (typeof value === 'string') {
                // Quote strings that contain spaces or special characters
                const needsQuotes = value.includes(' ') || value.includes('=') || value.includes('"')
                parts.push(needsQuotes ? `${key}="${value}"` : `${key}=${value}`)
            } else if (typeof value === 'object' && value !== null) {
                // For objects, serialize as JSON
                parts.push(`${key}="${JSON.stringify(value)}"`)
            } else {
                parts.push(`${key}=${value}`)
            }
        }
    }

    // Add message at the end
    if (obj.msg) parts.push(`msg="${obj.msg}"`)

    return parts.join(' ')
}

// Create base logger with key=value format
const logger = pino({
    level: defaultConfig.level,
    timestamp: pino.stdTimeFunctions.isoTime,
    // Use pretty printing only in development
    transport: defaultConfig.pretty ? {
        target: 'pino-pretty',
        options: {
            colorize: false,
            translateTime: false,
            ignore: 'pid,hostname',
            messageFormat: '{msg}'
        }
    } : undefined,
    // Formatters to ensure consistent structure
    formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
            service: defaultConfig.service,
            environment: defaultConfig.environment,
            version: defaultConfig.version,
            pid: bindings.pid,
            hostname: bindings.hostname
        })
    },
    // Redact sensitive information
    redact: {
        paths: ['password', 'token', 'authorization', 'x-auth-token', 'apiKey'],
        censor: '[REDACTED]'
    }
})

// Create a custom logger that uses our key=value format
const customLogger = {
    // Override the child method to return a custom logger
    child: function (bindings) {
        return {
            info: function (obj, msg) {
                const logObj = typeof obj === 'string' ? { msg: obj, ...bindings } : { ...obj, msg: msg || obj.msg, ...bindings }
                const formatted = serializeKeyValue(logObj)
                process.stdout.write(formatted + '\n')
            },
            error: function (obj, msg) {
                const logObj = typeof obj === 'string' ? { msg: obj, level: 'error', ...bindings } : { ...obj, msg: msg || obj.msg, level: 'error', ...bindings }
                const formatted = serializeKeyValue(logObj)
                process.stdout.write(formatted + '\n')
            },
            warn: function (obj, msg) {
                const logObj = typeof obj === 'string' ? { msg: obj, level: 'warn', ...bindings } : { ...obj, msg: msg || obj.msg, level: 'warn', ...bindings }
                const formatted = serializeKeyValue(logObj)
                process.stdout.write(formatted + '\n')
            },
            debug: function (obj, msg) {
                const logObj = typeof obj === 'string' ? { msg: obj, level: 'debug', ...bindings } : { ...obj, msg: msg || obj.msg, level: 'debug', ...bindings }
                const formatted = serializeKeyValue(logObj)
                process.stdout.write(formatted + '\n')
            }
        }
    },
    // Override the main logging methods
    info: function (obj, msg) {
        const logObj = typeof obj === 'string' ? { msg: obj } : { ...obj, msg: msg || obj.msg }
        const formatted = serializeKeyValue(logObj)
        process.stdout.write(formatted + '\n')
    },
    error: function (obj, msg) {
        const logObj = typeof obj === 'string' ? { msg: obj, level: 'error' } : { ...obj, msg: msg || obj.msg, level: 'error' }
        const formatted = serializeKeyValue(logObj)
        process.stdout.write(formatted + '\n')
    },
    warn: function (obj, msg) {
        const logObj = typeof obj === 'string' ? { msg: obj, level: 'warn' } : { ...obj, msg: msg || obj.msg, level: 'warn' }
        const formatted = serializeKeyValue(logObj)
        process.stdout.write(formatted + '\n')
    },
    debug: function (obj, msg) {
        const logObj = typeof obj === 'string' ? { msg: obj, level: 'debug' } : { ...obj, msg: msg || obj.msg, level: 'debug' }
        const formatted = serializeKeyValue(logObj)
        process.stdout.write(formatted + '\n')
    }
}

/**
 * Create a child logger with additional context
 * @param {Object} context - Additional context to include in all logs
 * @returns {Object} Child logger instance
 */
export function createLogger(context = {}) {
    return customLogger.child(context)
}

/**
 * Create a request-scoped logger with trace correlation
 * @param {Object} req - Express request object
 * @param {Object} additionalContext - Additional context
 * @returns {Object} Request-scoped logger
 */
export function createRequestLogger(req, additionalContext = {}) {
    const requestId = req.headers['x-request-id'] || uuidv4()
    const traceId = req.headers['b3-trace-id'] || req.traceId
    const spanId = req.headers['b3-span-id'] || req.spanId

    const context = {
        requestId,
        traceId,
        spanId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        ...additionalContext
    }

    return customLogger.child(context)
}

/**
 * Log API request with structured data
 * @param {Object} req - Express request object
 * @param {Object} response - Response data
 * @param {number} duration - Request duration in ms
 */
export function logApiRequest(req, response, duration) {
    const requestLogger = createRequestLogger(req, {
        operation: 'api_request',
        responseStatus: response.status,
        duration
    })

    requestLogger.info({
        event: 'api_request',
        method: req.method,
        path: req.path,
        statusCode: response.status,
        duration,
        contentLength: response.headers?.['content-length'],
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress
    }, 'API request completed')
}

/**
 * Log API error with structured data
 * @param {Object} req - Express request object
 * @param {Error} error - Error object
 * @param {number} duration - Request duration in ms
 */
export function logApiError(req, error, duration) {
    const requestLogger = createRequestLogger(req, {
        operation: 'api_error',
        errorType: error.constructor.name,
        duration
    })

    requestLogger.error({
        event: 'api_error',
        method: req.method,
        path: req.path,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        duration
    }, 'API request failed')
}

/**
 * Log WebSocket events
 * @param {string} event - WebSocket event type
 * @param {Object} data - Event data
 * @param {Object} context - Additional context
 */
export function logWebSocketEvent(event, data = {}, context = {}) {
    const wsLogger = createLogger({
        operation: 'websocket',
        event,
        ...context
    })

    wsLogger.info({
        event: 'websocket_event',
        wsEvent: event,
        ...data
    }, `WebSocket ${event}`)
}

/**
 * Log device operations
 * @param {string} operation - Device operation type
 * @param {Object} device - Device information
 * @param {Object} data - Operation data
 * @param {Object} context - Additional context
 */
export function logDeviceOperation(operation, device, data = {}, context = {}) {
    const deviceLogger = createLogger({
        operation: 'device_operation',
        deviceOperation: operation,
        deviceId: device.id,
        deviceName: device.name,
        tenantId: device.tenantId,
        ...context
    })

    deviceLogger.info({
        event: 'device_operation',
        deviceOperation: operation,
        device: {
            id: device.id,
            name: device.name,
            tenantId: device.tenantId,
            type: device.type
        },
        ...data
    }, `Device ${operation}`)
}

/**
 * Log scheduled task operations
 * @param {string} operation - Task operation type
 * @param {Object} task - Task information
 * @param {Object} data - Operation data
 * @param {Object} context - Additional context
 */
export function logScheduledTaskOperation(operation, task, data = {}, context = {}) {
    const taskLogger = createLogger({
        operation: 'scheduled_task',
        taskOperation: operation,
        taskId: task.id,
        deviceId: task.deviceId,
        tenantId: task.tenantId,
        ...context
    })

    taskLogger.info({
        event: 'scheduled_task_operation',
        taskOperation: operation,
        task: {
            id: task.id,
            deviceId: task.deviceId,
            tenantId: task.tenantId,
            schedule: task.schedule,
            isActive: task.isActive
        },
        ...data
    }, `Scheduled task ${operation}`)
}

/**
 * Log authentication events
 * @param {string} event - Auth event type
 * @param {Object} user - User information
 * @param {Object} data - Event data
 * @param {Object} context - Additional context
 */
export function logAuthEvent(event, user, data = {}, context = {}) {
    const authLogger = createLogger({
        operation: 'authentication',
        authEvent: event,
        userId: user?.id,
        userEmail: user?.email,
        ...context
    })

    authLogger.info({
        event: 'auth_event',
        authEvent: event,
        user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            role: user?.role
        },
        ...data
    }, `Auth ${event}`)
}

/**
 * Log system events
 * @param {string} event - System event type
 * @param {Object} data - Event data
 * @param {Object} context - Additional context
 */
export function logSystemEvent(event, data = {}, context = {}) {
    const systemLogger = createLogger({
        operation: 'system',
        systemEvent: event,
        ...context
    })

    systemLogger.info({
        event: 'system_event',
        systemEvent: event,
        ...data
    }, `System ${event}`)
}

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {Object} tags - Metric tags
 * @param {Object} context - Additional context
 */
export function logPerformanceMetric(metric, value, tags = {}, context = {}) {
    const perfLogger = createLogger({
        operation: 'performance',
        metric,
        ...context
    })

    perfLogger.info({
        event: 'performance_metric',
        metric,
        value,
        tags,
        timestamp: new Date().toISOString()
    }, `Performance metric: ${metric}`)
}

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {Object} data - Event data
 * @param {Object} context - Additional context
 */
export function logSecurityEvent(event, data = {}, context = {}) {
    const securityLogger = createLogger({
        operation: 'security',
        securityEvent: event,
        ...context
    })

    securityLogger.warn({
        event: 'security_event',
        securityEvent: event,
        ...data
    }, `Security ${event}`)
}

// Export the custom logger and utility functions
export { customLogger as logger }
export default customLogger
