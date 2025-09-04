import { WebSocketServer } from 'ws'
import WebSocket from 'ws'
import { tracer, injectTraceContext, addErrorSpanAttributes, recordWebSocketMetrics } from '../tracing.js'
import { context, trace } from '@opentelemetry/api'

// Configuration
const ZENSOR_API_URL = process.env.ZENSOR_API_URL || 'http://localhost:3000'
const ZENSOR_WS_URL = ZENSOR_API_URL.replace(/^http/, 'ws') + '/ws/device-messages'

export function setupWebSocketProxy(server) {
    console.log(`🔗 Setting up WebSocket proxy to: ${ZENSOR_WS_URL}`)

    const wss = new WebSocketServer({
        server,
        path: '/ws/device-messages'
    })

    wss.on('connection', (clientWs, request) => {
        console.log('🔌 New WebSocket client connected')

        // Record WebSocket connection metric
        recordWebSocketMetrics('connection', {
            operation: 'websocket_connection',
            url: ZENSOR_WS_URL,
            protocol: 'ws',
            user_agent: request.headers['user-agent'],
            remote_addr: request.connection.remoteAddress,
        })

        // Create a span for the WebSocket connection
        const connectionSpan = tracer.startSpan('WebSocket Connection', {
            kind: 1, // SpanKind.SERVER
            attributes: {
                'span.kind': 'server',
                'component': 'zensor-ui',
                'operation': 'websocket_connection',
                'websocket.url': ZENSOR_WS_URL,
                'websocket.protocol': 'ws',
                'http.user_agent': request.headers['user-agent'],
                'http.remote_addr': request.connection.remoteAddress,
            },
        })

        // Create connection to Zensor WebSocket
        const zensorWs = new WebSocket(ZENSOR_WS_URL)

        // Forward messages from Zensor to client
        zensorWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                // Create a span for message forwarding
                const messageSpan = tracer.startSpan('WebSocket Message Forward', {
                    kind: 2, // SpanKind.CLIENT
                    attributes: {
                        'span.kind': 'client',
                        'component': 'zensor-ui',
                        'operation': 'websocket_message_forward',
                        'websocket.direction': 'upstream_to_client',
                        'websocket.message_size': data.length,
                    },
                })

                try {
                    // Convert Buffer to string to ensure proper JSON parsing on frontend
                    const messageData = data instanceof Buffer ? data.toString('utf8') : data
                    clientWs.send(messageData)

                    // Record WebSocket message metric
                    recordWebSocketMetrics('message', {
                        operation: 'websocket_message_forward',
                        direction: 'upstream_to_client',
                        message_size: data.length,
                    })

                    messageSpan.setStatus({ code: 1 }) // StatusCode.OK
                } catch (error) {
                    addErrorSpanAttributes(messageSpan, error)

                    // Record WebSocket error metric
                    recordWebSocketMetrics('error', {
                        operation: 'websocket_message_forward',
                        direction: 'upstream_to_client',
                        error_type: 'send_error',
                    })
                } finally {
                    messageSpan.end()
                }
            }
        })

        // Forward messages from client to Zensor
        clientWs.on('message', (data) => {
            if (zensorWs.readyState === WebSocket.OPEN) {
                // Create a span for message forwarding
                const messageSpan = tracer.startSpan('WebSocket Message Forward', {
                    kind: 2, // SpanKind.CLIENT
                    attributes: {
                        'span.kind': 'client',
                        'component': 'zensor-ui',
                        'operation': 'websocket_message_forward',
                        'websocket.direction': 'client_to_upstream',
                        'websocket.message_size': data.length,
                    },
                })

                try {
                    // Ensure data is properly formatted for upstream
                    const messageData = data instanceof Buffer ? data.toString('utf8') : data
                    zensorWs.send(messageData)

                    // Record WebSocket message metric
                    recordWebSocketMetrics('message', {
                        operation: 'websocket_message_forward',
                        direction: 'client_to_upstream',
                        message_size: data.length,
                    })

                    messageSpan.setStatus({ code: 1 }) // StatusCode.OK
                } catch (error) {
                    addErrorSpanAttributes(messageSpan, error)

                    // Record WebSocket error metric
                    recordWebSocketMetrics('error', {
                        operation: 'websocket_message_forward',
                        direction: 'client_to_upstream',
                        error_type: 'send_error',
                    })
                } finally {
                    messageSpan.end()
                }
            }
        })

        // Handle Zensor WebSocket connection
        zensorWs.on('open', () => {
            console.log('✅ Connected to Zensor WebSocket')
            connectionSpan.setAttributes({
                'websocket.connection_status': 'connected',
                'websocket.upstream_connected': true,
            })
        })

        zensorWs.on('error', (error) => {
            console.error('❌ Zensor WebSocket error:', error.message)
            addErrorSpanAttributes(connectionSpan, error)
            connectionSpan.setAttributes({
                'websocket.connection_status': 'error',
                'websocket.upstream_connected': false,
            })

            // Record WebSocket error metric
            recordWebSocketMetrics('error', {
                operation: 'websocket_connection',
                error_type: 'upstream_error',
                error_message: error.message,
            })

            connectionSpan.end()

            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close(1011, 'Upstream WebSocket error')
            }
        })

        zensorWs.on('close', (code, reason) => {
            console.log(`🔌 Zensor WebSocket closed: ${code} ${reason}`)
            connectionSpan.setAttributes({
                'websocket.connection_status': 'closed',
                'websocket.upstream_connected': false,
                'websocket.close_code': code,
                'websocket.close_reason': reason.toString(),
            })
            connectionSpan.end()

            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close(code, reason)
            }
        })

        // Handle client disconnect
        clientWs.on('close', (code, reason) => {
            console.log(`🔌 Client WebSocket disconnected: ${code} ${reason}`)
            connectionSpan.setAttributes({
                'websocket.connection_status': 'closed',
                'websocket.client_connected': false,
                'websocket.close_code': code,
                'websocket.close_reason': reason.toString(),
            })
            connectionSpan.end()

            if (zensorWs.readyState === WebSocket.OPEN) {
                zensorWs.close()
            }
        })

        clientWs.on('error', (error) => {
            console.error('❌ Client WebSocket error:', error.message)
            addErrorSpanAttributes(connectionSpan, error)
            connectionSpan.setAttributes({
                'websocket.connection_status': 'error',
                'websocket.client_connected': false,
            })

            // Record WebSocket error metric
            recordWebSocketMetrics('error', {
                operation: 'websocket_connection',
                error_type: 'client_error',
                error_message: error.message,
            })

            connectionSpan.end()

            if (zensorWs.readyState === WebSocket.OPEN) {
                zensorWs.close()
            }
        })
    })

    console.log('✅ WebSocket proxy configured successfully')
} 