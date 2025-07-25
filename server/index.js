import express from 'express'
import { createServer as createViteServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { setupWebSocketProxy } from './middleware/websocket-proxy.js'
import { setupApiProxy } from './middleware/api-proxy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173

async function createExpressServer() {
    const app = express()

    // Setup API proxy routes first
    setupApiProxy(app)

    let vite
    if (!isProduction) {
        // Development mode: Use Vite dev server
        vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom',
            logLevel: 'info'
        })
        app.use(vite.ssrLoadModule)
    } else {
        // Production mode: Serve static files
        app.use(express.static(resolve(__dirname, '../dist/client')))
    }

    // Handle SSR for all other routes
    app.use('*', async (req, res, next) => {
        const url = req.originalUrl

        try {
            let template, render

            if (!isProduction) {
                // Development: Always read template fresh
                template = fs.readFileSync(resolve(__dirname, '../index.html'), 'utf-8')
                template = await vite.transformIndexHtml(url, template)
                render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
            } else {
                // Production: Use cached template and render function
                template = fs.readFileSync(resolve(__dirname, '../dist/client/index.html'), 'utf-8')
                render = (await import('../dist/server/entry-server.js')).render
            }

            const appHtml = await render(url)
            const html = template.replace(`<!--ssr-outlet-->`, appHtml)

            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
        } catch (e) {
            if (!isProduction) {
                vite.ssrFixStacktrace(e)
            }
            console.error(e)
            res.status(500).end('Internal Server Error')
        }
    })

    return app
}

// Start server
createExpressServer().then(app => {
    const server = createServer(app)

    // Setup WebSocket proxy
    setupWebSocketProxy(server)

    server.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`)
        console.log(`📊 Environment: ${isProduction ? 'production' : 'development'}`)
        if (!isProduction) {
            console.log(`🔧 Vite dev server with SSR enabled`)
        }
    })
}).catch(err => {
    console.error('Failed to start server:', err)
    process.exit(1)
}) 