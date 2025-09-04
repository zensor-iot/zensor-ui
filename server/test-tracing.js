#!/usr/bin/env node

/**
 * Simple test script to verify OpenTelemetry tracing is working
 * Run this script to test trace generation and export
 */

import { tracer, httpRequestCounter, httpRequestDuration, httpRequestErrors, recordHttpRequestMetrics } from './tracing.js'

async function testTracing() {
    console.log('🧪 Testing OpenTelemetry tracing and metrics...')

    // Create a test span
    const span = tracer.startSpan('test-trace', {
        kind: 1, // SpanKind.INTERNAL
        attributes: {
            'test.component': 'zensor-ui',
            'test.operation': 'tracing_verification',
            'test.timestamp': new Date().toISOString(),
        },
    })

    try {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100))

        // Add some events
        span.addEvent('test-event-1', { message: 'First test event' })

        await new Promise(resolve => setTimeout(resolve, 50))

        span.addEvent('test-event-2', { message: 'Second test event' })

        // Set span status
        span.setStatus({ code: 1, message: 'Test completed successfully' })

        console.log('✅ Test span created successfully')
        console.log(`📊 Span ID: ${span.spanContext().spanId}`)
        console.log(`🔍 Trace ID: ${span.spanContext().traceId}`)

    } catch (error) {
        span.recordException(error)
        span.setStatus({ code: 2, message: error.message })
        console.error('❌ Test failed:', error.message)
    } finally {
        span.end()
        console.log('🏁 Test span ended')
    }

    // Test metrics
    console.log('📊 Testing metrics...')

    // Simulate some HTTP requests
    const testRequests = [
        { method: 'GET', path: '/api/tenants', statusCode: 200, duration: 150 },
        { method: 'POST', path: '/api/devices', statusCode: 201, duration: 300 },
        { method: 'GET', path: '/api/devices/123', statusCode: 404, duration: 50 },
        { method: 'PUT', path: '/api/devices/123', statusCode: 500, duration: 2000 },
    ]

    for (const req of testRequests) {
        recordHttpRequestMetrics(
            req.method,
            req.path,
            req.statusCode,
            req.duration,
            { test: 'true' }
        )
        console.log(`📈 Recorded metric: ${req.method} ${req.path} - ${req.statusCode}`)
    }

    // Wait a bit for the span and metrics to be exported
    console.log('⏳ Waiting for span and metrics export...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('✨ Tracing and metrics test completed!')
    console.log('📈 Check your OpenTelemetry Collector and configured backend to see the traces and metrics')

    process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error)
    process.exit(1)
})

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error)
    process.exit(1)
})

// Run the test
testTracing().catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
})
