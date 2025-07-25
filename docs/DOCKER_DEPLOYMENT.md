# Docker Deployment Guide

## Overview

The Zensor Portal UI can be deployed using Docker with the Express.js server. The Docker configuration creates a production-ready container with proper security and health checks.

## Building the Docker Image

### Basic Build
```bash
docker build -t zensor-ui . --load
```

### With Build Arguments (Optional)
```bash
docker build -t zensor-ui . --load \
  --build-arg NODE_ENV=production
```

## Running the Container

### Development/Testing
```bash
docker run --rm -d \
  -p 5173:5173 \
  --name zensor-ui \
  -e ZENSOR_API_URL=https://server.zensor-iot.net \
  -e ZENSOR_API_KEY=your-api-key-here \
  zensor-ui
```

### Production with Environment File
```bash
# Create .env file
cat > .env << EOF
ZENSOR_API_URL=https://server.zensor-iot.net
ZENSOR_API_KEY=your-production-api-key
PORT=5173
NODE_ENV=production
EOF

# Run with environment file
docker run --rm -d \
  -p 5173:5173 \
  --name zensor-ui \
  --env-file .env \
  zensor-ui
```

### Docker Compose (Recommended)
```yaml
# docker-compose.yml
version: '3.8'

services:
  zensor-ui:
    build: .
    ports:
      - "5173:5173"
    environment:
      - ZENSOR_API_URL=https://server.zensor-iot.net
      - ZENSOR_API_KEY=your-api-key-here
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "node", "-e", "const http = require('http'); http.get('http://localhost:5173/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3
    restart: unless-stopped
```

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

### Required
- `ZENSOR_API_URL`: Backend Zensor API URL (e.g., `https://server.zensor-iot.net`)

### Optional
- `ZENSOR_API_KEY`: API key for Zensor API authentication
- `PORT`: Server port (default: 5173)
- `NODE_ENV`: Environment mode (default: production in container)

## Container Features

### Security
- **Non-root user**: Runs as `zensor` user (UID 1001)
- **Minimal base**: Uses Alpine Linux for smaller attack surface
- **No unnecessary packages**: Production-only dependencies

### Performance
- **Multi-stage build**: Optimized for size and security
- **Build cache**: Efficient Docker layer caching
- **Production build**: Minified and optimized assets

### Monitoring
- **Health check**: Built-in health endpoint at `/health`
- **Automatic restart**: Container restarts on failure
- **Logging**: Structured logging to stdout

## Build Process Details

### Multi-stage Build
1. **Builder stage**: 
   - Installs all dependencies
   - Builds client-side assets (`npm run build:client`)
   - Creates optimized production bundle

2. **Production stage**:
   - Installs only production dependencies
   - Copies built assets and server code
   - Sets up non-root user
   - Configures health checks

### Why Client-Only Build?
The Dockerfile uses `npm run build:client` instead of `npm run build` to avoid SSR build issues in the Docker environment. Since the application uses the simple server (`server/simple-server.js`), SSR is not required.

## Testing the Container

### Health Check
```bash
curl http://localhost:5173/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-25T02:38:54.234Z",
  "zensorApiUrl": "https://server.zensor-iot.net",
  "hasApiKey": false
}
```

### API Proxy Test
```bash
curl http://localhost:5173/api/tenants
```

### SPA Routing Test
```bash
curl http://localhost:5173/tenants/123/devices
```

All should return appropriate responses (JSON for API, HTML for SPA routes).

## Production Deployment

### With Reverse Proxy (Recommended)
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Direct Deployment
```bash
# Production deployment
docker run -d \
  --name zensor-ui-prod \
  --restart unless-stopped \
  -p 80:5173 \
  -e ZENSOR_API_URL=https://server.zensor-iot.net \
  -e ZENSOR_API_KEY=your-production-api-key \
  -e NODE_ENV=production \
  zensor-ui
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs zensor-ui

# Check if port is available
netstat -tlnp | grep :5173

# Verify environment variables
docker exec zensor-ui env | grep ZENSOR
```

### API Proxy Issues
```bash
# Test API connectivity from container
docker exec zensor-ui curl -s https://server.zensor-iot.net/v1/tenants

# Check proxy configuration
curl http://localhost:5173/debug/path/tenants
```

### Build Issues
```bash
# Clean build
docker system prune
docker build --no-cache -t zensor-ui . --load

# Check build logs
docker build -t zensor-ui . --load --progress=plain
```

## Container Management

### Viewing Logs
```bash
# Real-time logs
docker logs -f zensor-ui

# Last 100 lines
docker logs --tail 100 zensor-ui
```

### Updating
```bash
# Rebuild and restart
docker build -t zensor-ui . --load
docker stop zensor-ui
docker run -d --name zensor-ui-new [your-run-options] zensor-ui
docker rm zensor-ui
docker rename zensor-ui-new zensor-ui
```

### Resource Monitoring
```bash
# Container stats
docker stats zensor-ui

# Resource usage
docker exec zensor-ui ps aux
docker exec zensor-ui df -h
```

The Docker deployment provides a production-ready, secure, and scalable way to run the Zensor Portal UI with all the server-side features including API proxying and WebSocket support. 