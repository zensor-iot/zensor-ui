# Server-Side Migration Guide

## Overview

This document describes the migration from a static React application to a full-stack Express.js application with server-side rendering (SSR), API proxying, and WebSocket proxying.

## New Architecture

### Technology Stack
- **Frontend**: React 19.1.0 with SSR support
- **Backend**: Express.js 5.1.0 with Vite SSR
- **Build Tool**: Vite 6.3.5 with SSR configuration
- **Proxy**: http-proxy-middleware for API and WebSocket proxying

### Architecture Benefits
1. **API Key Security**: Zensor API key is now stored server-side only
2. **Server-Side Rendering**: Faster initial page loads and better SEO
3. **Centralized Proxy**: Single entry point for all API and WebSocket traffic
4. **External Auth Compatibility**: Designed to work with external authentication systems

## Server Components

### 1. Express.js Server (`server/index.js`)
- Main server entry point
- Handles both development and production modes
- Manages SSR rendering
- Serves static files in production

### 2. API Proxy Middleware (`server/middleware/api-proxy.js`)
- Proxies all `/api/*` requests to Zensor API at `/v1/*`
- Automatically injects API key into all requests
- Handles CORS and error responses
- Provides health check endpoint at `/health`

### 3. WebSocket Proxy (`server/middleware/websocket-proxy.js`)
- Proxies WebSocket connections from `/ws/device-messages` to Zensor WebSocket
- Maintains bidirectional message forwarding
- Handles connection errors and reconnection

## Configuration Changes

### Environment Variables
```bash
# Server Configuration
ZENSOR_API_URL=http://localhost:3000     # Zensor API base URL
ZENSOR_API_KEY=your-api-key-here         # Zensor API key (server-side only)
PORT=5173                                # Server port
NODE_ENV=development                     # Environment mode

# Client Configuration (still available)
VITE_GRAFANA_BASE_URL=https://cardamomo.zensor-iot.net
VITE_GRAFANA_API_KEY=your-grafana-api-key
```

### API Configuration Updates
- **Before**: Direct calls to `VITE_API_BASE_URL`
- **After**: Calls to local proxy at `/api/*`
- **WebSocket**: Changed from external URL to local proxy
- **Automatic Detection**: URLs adapt based on browser location

## Development vs Production

### Development Mode
- Vite dev server integrated with Express.js
- Hot module replacement (HMR) enabled
- SSR with live reloading
- Detailed proxy logging

### Production Mode
- Pre-built static files served by Express.js
- Optimized SSR bundle
- Compressed assets
- Health check endpoint

## Running the Application

### Development
```bash
npm run dev
# Starts Express server with Vite SSR on port 5173
```

### Production Build
```bash
npm run build
# Builds both client and server bundles
```

### Production Start
```bash
npm start
# Starts production Express server
```

## API Proxy Behavior

### Request Flow
1. Client makes request to `/api/tenants`
2. Express proxy receives request
3. Proxy adds API key headers
4. Request forwarded to `${ZENSOR_API_URL}/v1/tenants`
5. Response returned to client

### Headers Added
- `X-API-Key`: Zensor API key
- `Authorization`: Bearer token with API key
- CORS headers for browser compatibility

### Error Handling
- Proxy connection errors return 500 with error details
- API errors are passed through to client
- Health check available at `/health`

## WebSocket Proxy Behavior

### Connection Flow
1. Client connects to `ws://localhost:5173/ws/device-messages`
2. Server creates upstream connection to Zensor WebSocket
3. Bidirectional message forwarding established
4. Connection errors handled gracefully

### Features
- Automatic upstream connection management
- Message forwarding in both directions
- Error handling and connection cleanup
- Logging for debugging

## Deployment Changes

### Docker
- **Before**: nginx serving static files
- **After**: Node.js Express server
- Multi-stage build for optimization
- Health check endpoint included
- Non-root user for security

### nginx (Optional)
- Can still use nginx as reverse proxy
- Or deploy Express server directly
- SSL termination can be handled by nginx or Express

## Migration Checklist

### ✅ Completed
- [x] Express.js server setup
- [x] Vite SSR configuration
- [x] API proxy implementation
- [x] WebSocket proxy implementation
- [x] React SSR adaptation
- [x] API configuration updates
- [x] Docker configuration updates

### 🔄 Testing Required
- [ ] Test development mode
- [ ] Test production build
- [ ] Test API proxy functionality
- [ ] Test WebSocket proxy
- [ ] Test with external authentication
- [ ] Test Docker deployment

## External Authentication Integration

The new architecture is designed to work seamlessly with external authentication systems:

1. **No Built-in Auth**: Server doesn't handle authentication internally
2. **Proxy-Friendly**: All requests go through Express proxy
3. **Header Forwarding**: Authentication headers can be forwarded from external systems
4. **Session Handling**: External auth can set cookies/headers that Express forwards

### Integration Points
- Authentication middleware can be added to Express routes
- API proxy can forward authentication headers
- WebSocket connections can include auth validation
- Health check endpoint can validate auth status

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure port 5173 is available
2. **API Key Missing**: Set `ZENSOR_API_KEY` environment variable
3. **Proxy Errors**: Check `ZENSOR_API_URL` configuration
4. **WebSocket Issues**: Verify upstream WebSocket URL

### Debug Commands
```bash
# Check health status
curl http://localhost:5173/health

# Test API proxy
curl http://localhost:5173/api/tenants

# View server logs
npm run dev --verbose
```

### Environment Validation
The server validates configuration on startup and logs:
- Zensor API URL
- API key presence (not the actual key)
- Proxy configuration
- WebSocket proxy status

## Performance Considerations

### SSR Benefits
- Faster initial page load
- Better SEO and social media sharing
- Improved perceived performance

### Proxy Overhead
- Minimal latency added by proxy layer
- Connection pooling for upstream requests
- Error handling prevents cascading failures

### WebSocket Performance
- Direct proxy with minimal overhead
- Efficient message forwarding
- Proper connection cleanup

## Security Improvements

### API Key Protection
- API key never exposed to client
- Stored only in server environment
- Automatically injected into requests

### CORS Handling
- Proper CORS headers added by proxy
- No need for browser CORS configuration
- Secure by default

### Content Security Policy
- Maintained compatibility with existing CSP
- WebSocket connections properly proxied
- No inline scripts required for proxy 