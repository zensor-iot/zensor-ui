#!/usr/bin/env node

/**
 * Simple test script to verify OpenTelemetry tracing is working
 * Run this script to test trace generation and export
 */

import { tracer } from './tracing.js'

async function testTracing() {
    console.log('🧪 Testing OpenTelemetry tracing...')

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

    // Wait a bit for the span to be exported
    console.log('⏳ Waiting for span export...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('✨ Tracing test completed!')
    console.log('📈 Check your OpenTelemetry Collector and configured backend to see the trace')

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
