import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { B3Propagator } from '@opentelemetry/propagator-b3'
import { trace, context, propagation } from '@opentelemetry/api'

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'zensor-ui',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    traceExporter: getTraceExporter(),
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

    switch (exporterType) {
        case 'otlp':
            return new OTLPTraceExporter({
                url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
            })
        default:
            console.warn(`Unknown exporter type: ${exporterType}, using OTLP`)
            return new OTLPTraceExporter({
                url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
            })
    }
}

// Initialize the SDK and register with the OpenTelemetry API
sdk.start()

// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0))
})

// Export tracing utilities
export const tracer = trace.getTracer('zensor-ui', '1.0.0')

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

console.log('🔍 OpenTelemetry tracing initialized')
console.log(`📊 Service: ${process.env.OTEL_SERVICE_NAME || 'zensor-ui'}`)
console.log(`📈 Exporter: ${process.env.OTEL_EXPORTER_TYPE || 'otlp'}`)
console.log(`🔗 OTLP Endpoint: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'}`)

export default sdk
