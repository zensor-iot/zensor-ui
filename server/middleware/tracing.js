import { trace, context, SpanStatusCode } from '@opentelemetry/api'
import { tracer, addHttpSpanAttributes, addErrorSpanAttributes, recordHttpRequestMetrics } from '../tracing.js'

// Custom Express middleware for tracing
export function tracingMiddleware(req, res, next) {
    const span = tracer.startSpan(`${req.method} ${req.path}`, {
        kind: 1, // SpanKind.SERVER
        attributes: {
            'span.kind': 'server',
            'component': 'zensor-ui',
            'http.method': req.method,
            'http.url': req.url,
            'http.route': req.route?.path || req.path,
            'http.user_agent': req.get('User-Agent'),
            'http.request_id': req.get('X-Request-ID'),
            'http.tenant_id': req.get('X-Tenant-ID'),
            'http.user_id': req.get('X-User-ID'),
            'http.user_email': req.get('X-User-Email'),
        },
    })

    // Set the span as active
    const activeContext = trace.setSpan(context.active(), span)
    context.with(activeContext, () => {
        // Store span in request for later use
        req.span = span

        // Track response time
        const startTime = Date.now()

        // Override res.end to capture response details
        const originalEnd = res.end
        res.end = function (chunk, encoding) {
            const responseTime = Date.now() - startTime

            // Add response attributes
            span.setAttributes({
                'http.status_code': res.statusCode,
                'http.response_time_ms': responseTime,
                'http.content_length': res.get('Content-Length') || 0,
            })

            // Record metrics
            recordHttpRequestMetrics(
                req.method,
                req.path,
                res.statusCode,
                responseTime,
                {
                    route: req.route?.path || req.path,
                    user_agent: req.get('User-Agent'),
                    tenant_id: req.get('X-Tenant-ID'),
                    user_id: req.get('X-User-ID'),
                }
            )

            // Set span status based on response code
            if (res.statusCode >= 400) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: `HTTP ${res.statusCode}`,
                })
            } else {
                span.setStatus({ code: SpanStatusCode.OK })
            }

            // End the span
            span.end()

            // Call original end
            originalEnd.call(this, chunk, encoding)
        }

        // Handle errors
        req.on('error', (error) => {
            addErrorSpanAttributes(span, error)
            span.end()
        })

        next()
    })
}

// Middleware to extract trace context from incoming requests
export function traceContextMiddleware(req, res, next) {
    // Extract trace context from headers
    const traceId = req.get('X-Trace-Id') || req.get('B3-Trace-Id')
    const spanId = req.get('X-Span-Id') || req.get('B3-Span-Id')
    const parentSpanId = req.get('X-Parent-Span-Id') || req.get('B3-Parent-Span-Id')

    if (traceId) {
        // Create a span context from the extracted trace information
        const spanContext = {
            traceId,
            spanId: spanId || traceId, // Use traceId as spanId if spanId not provided
            traceFlags: 1, // SAMPLED
        }

        // Create a span from the context
        const span = tracer.startSpan(`${req.method} ${req.path}`, {
            kind: 1, // SpanKind.SERVER
            attributes: {
                'span.kind': 'server',
                'component': 'zensor-ui',
                'http.method': req.method,
                'http.url': req.url,
                'http.trace_id': traceId,
                'http.span_id': spanId,
                'http.parent_span_id': parentSpanId,
            },
        })

        // Set the span as active
        const activeContext = trace.setSpan(context.active(), span)
        context.with(activeContext, () => {
            req.span = span
            next()
        })
    } else {
        next()
    }
}

// Helper function to create a child span for specific operations
export function createChildSpan(req, operationName, attributes = {}) {
    if (!req.span) {
        return tracer.startSpan(operationName, {
            kind: 2, // SpanKind.CLIENT
            attributes: {
                'span.kind': 'client',
                'component': 'zensor-ui',
                ...attributes,
            },
        })
    }

    return tracer.startSpan(operationName, {
        kind: 2, // SpanKind.CLIENT
        attributes: {
            'span.kind': 'client',
            'component': 'zensor-ui',
            ...attributes,
        },
    }, trace.setSpan(context.active(), req.span))
}

export default { tracingMiddleware, traceContextMiddleware, createChildSpan }
