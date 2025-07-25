import { WebSocketServer } from 'ws'
import WebSocket from 'ws'

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

        // Create connection to Zensor WebSocket
        const zensorWs = new WebSocket(ZENSOR_WS_URL)

        // Forward messages from Zensor to client
        zensorWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                // Convert Buffer to string to ensure proper JSON parsing on frontend
                const messageData = data instanceof Buffer ? data.toString('utf8') : data
                clientWs.send(messageData)
            }
        })

        // Forward messages from client to Zensor
        clientWs.on('message', (data) => {
            if (zensorWs.readyState === WebSocket.OPEN) {
                // Ensure data is properly formatted for upstream
                const messageData = data instanceof Buffer ? data.toString('utf8') : data
                zensorWs.send(messageData)
            }
        })

        // Handle Zensor WebSocket connection
        zensorWs.on('open', () => {
            console.log('✅ Connected to Zensor WebSocket')
        })

        zensorWs.on('error', (error) => {
            console.error('❌ Zensor WebSocket error:', error.message)
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close(1011, 'Upstream WebSocket error')
            }
        })

        zensorWs.on('close', (code, reason) => {
            console.log(`🔌 Zensor WebSocket closed: ${code} ${reason}`)
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close(code, reason)
            }
        })

        // Handle client disconnect
        clientWs.on('close', (code, reason) => {
            console.log(`🔌 Client WebSocket disconnected: ${code} ${reason}`)
            if (zensorWs.readyState === WebSocket.OPEN) {
                zensorWs.close()
            }
        })

        clientWs.on('error', (error) => {
            console.error('❌ Client WebSocket error:', error.message)
            if (zensorWs.readyState === WebSocket.OPEN) {
                zensorWs.close()
            }
        })
    })

    console.log('✅ WebSocket proxy configured successfully')
} 