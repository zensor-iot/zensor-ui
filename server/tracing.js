import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { B3Propagator } from '@opentelemetry/propagator-b3'
import { trace, context, propagation, metrics } from '@opentelemetry/api'

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'zensor-ui',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    traceExporter: getTraceExporter(),
    metricReader: getMetricReader(),
    instrumentations: [
        getNodeAutoInstrumentations({
            // Disable some instrumentations that might conflict with our custom setup
            '@opentelemetry/instrumentation-fs': {
                enabled: false,
            },
            '@opentelemetry/instrumentation-dns': {
                enabled: false,
            },
        }),
    ],
    textMapPropagator: new B3Propagator(),
})

function getTraceExporter() {
    const exporterType = process.env.OTEL_EXPORTER_TYPE || 'otlp'
    const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
    const tracesEndpoint = `${baseEndpoint}/v1/traces`

    switch (exporterType) {
        case 'otlp':
            return new OTLPTraceExporter({
                url: tracesEndpoint,
            })
        default:
            console.warn(`Unknown exporter type: ${exporterType}, using OTLP`)
            return new OTLPTraceExporter({
                url: tracesEndpoint,
            })
    }
}

function getMetricReader() {
    const exporterType = process.env.OTEL_EXPORTER_TYPE || 'otlp'
    const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
    const metricsEndpoint = `${baseEndpoint}/v1/metrics`

    switch (exporterType) {
        case 'otlp':
            return new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: metricsEndpoint,
                }),
                exportIntervalMillis: 10000, // Export every 10 seconds
            })
        default:
            console.warn(`Unknown exporter type: ${exporterType}, using OTLP`)
            return new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: metricsEndpoint,
                }),
                exportIntervalMillis: 10000,
            })
    }
}

// Initialize the SDK and register with the OpenTelemetry API
sdk.start()

// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => {
            const logger = createLogger({ operation: 'tracing' })
            logger.info({
                event: 'tracing_terminated'
            }, 'Tracing terminated')
        })
        .catch((error) => {
            const logger = createLogger({ operation: 'tracing' })
            logger.error({
                event: 'tracing_termination_error',
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            }, 'Error terminating tracing')
        })
        .finally(() => process.exit(0))
})

// Export tracing utilities
export const tracer = trace.getTracer('zensor-ui', '1.0.0')

// Export metrics utilities
export const meter = metrics.getMeter('zensor-ui', '1.0.0')

// Create metrics instruments
export const httpRequestCounter = meter.createCounter('zensor_ui_http_requests_total', {
    description: 'Total number of HTTP requests',
    unit: '1',
})

export const httpRequestDuration = meter.createHistogram('zensor_ui_http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    unit: 's',
})

export const httpRequestErrors = meter.createCounter('zensor_ui_http_errors_total', {
    description: 'Total number of HTTP errors',
    unit: '1',
})

export const websocketConnections = meter.createCounter('zensor_ui_websocket_connections_total', {
    description: 'Total number of WebSocket connections',
    unit: '1',
})

export const websocketMessages = meter.createCounter('zensor_ui_websocket_messages_total', {
    description: 'Total number of WebSocket messages',
    unit: '1',
})

export const websocketErrors = meter.createCounter('zensor_ui_websocket_errors_total', {
    description: 'Total number of WebSocket errors',
    unit: '1',
})

// Helper function to create a span for API calls
export function createApiSpan(operationName, attributes = {}) {
    return tracer.startSpan(operationName, {
        kind: 2, // SpanKind.CLIENT
        attributes: {
            'span.kind': 'client',
            'component': 'zensor-ui',
            ...attributes,
        },
    })
}

// Helper function to inject trace context into headers
export function injectTraceContext(headers = {}) {
    const carrier = {}
    propagation.inject(context.active(), carrier)

    // Convert carrier to headers
    const traceHeaders = {}
    Object.keys(carrier).forEach(key => {
        traceHeaders[key.toLowerCase()] = carrier[key]
    })

    return { ...headers, ...traceHeaders }
}

// Helper function to extract trace context from headers
export function extractTraceContext(headers) {
    const carrier = {}
    Object.keys(headers).forEach(key => {
        carrier[key.toLowerCase()] = headers[key]
    })

    return propagation.extract(context.active(), carrier)
}

// Helper function to add span attributes for HTTP requests
export function addHttpSpanAttributes(span, method, url, statusCode, responseTime) {
    span.setAttributes({
        'http.method': method,
        'http.url': url,
        'http.status_code': statusCode,
        'http.response_time_ms': responseTime,
        'component': 'zensor-ui',
        'span.kind': 'client',
    })
}

// Helper function to add error attributes to span
export function addErrorSpanAttributes(span, error) {
    span.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.name': error.name,
        'error.stack': error.stack,
    })
    span.recordException(error)
    span.setStatus({ code: 2, message: error.message }) // StatusCode.ERROR
}

// Helper function to record HTTP request metrics
export function recordHttpRequestMetrics(method, path, statusCode, durationMs, attributes = {}) {
    const baseAttributes = {
        method,
        path,
        status_code: statusCode.toString(),
        component: 'zensor-ui',
        ...attributes,
    }

    // Record request counter
    httpRequestCounter.add(1, baseAttributes)

    // Record request duration
    httpRequestDuration.record(durationMs / 1000, baseAttributes)

    // Record errors
    if (statusCode >= 400) {
        httpRequestErrors.add(1, {
            ...baseAttributes,
            error_type: statusCode >= 500 ? 'server_error' : 'client_error',
        })
    }
}

// Helper function to record WebSocket metrics
export function recordWebSocketMetrics(event, attributes = {}) {
    const baseAttributes = {
        component: 'zensor-ui',
        ...attributes,
    }

    switch (event) {
        case 'connection':
            websocketConnections.add(1, baseAttributes)
            break
        case 'message':
            websocketMessages.add(1, baseAttributes)
            break
        case 'error':
            websocketErrors.add(1, baseAttributes)
            break
    }
}

// Import logger for structured logging
import { logSystemEvent, createLogger } from './logger.js'

const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'

logSystemEvent('tracing_initialized', {
    service: process.env.OTEL_SERVICE_NAME || 'zensor-ui',
    exporter: process.env.OTEL_EXPORTER_TYPE || 'otlp',
    baseEndpoint,
    tracesEndpoint: `${baseEndpoint}/v1/traces`,
    metricsEndpoint: `${baseEndpoint}/v1/metrics`
})

export default sdk
