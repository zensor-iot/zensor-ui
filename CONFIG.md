# Configuration Guide

## Backend API Configuration

The Zensor UI can be configured to connect to different backend API servers using environment variables.

### Environment Variable

Set the `VITE_API_BASE_URL` environment variable to specify the backend server location:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

### Configuration Examples

**Development (default):**
```bash
VITE_API_BASE_URL=http://localhost:3000
```

**Production:**
```bash
VITE_API_BASE_URL=https://api.zensor.yourdomain.com
```

**Staging:**
```bash
VITE_API_BASE_URL=https://staging-api.zensor.yourdomain.com
```

**Docker Compose:**
```bash
VITE_API_BASE_URL=http://zensor-server:3000
```

### Setting Environment Variables

#### Option 1: Create a `.env` file in the `zensor-ui` directory:
```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

#### Option 2: Set environment variable when running:
```bash
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

#### Option 3: Export in your shell:
```bash
export VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

### How It Works

The configuration system automatically:
- Uses the `VITE_API_BASE_URL` environment variable if set
- Falls back to `http://localhost:3000` if not configured
- Derives WebSocket URLs from the API base URL (http → ws, https → wss)
- Handles different protocols and ports automatically

### API Endpoints

All API calls and WebSocket connections now use the configurable base URL:
- HTTP API calls: `${VITE_API_BASE_URL}/v1/...`
- WebSocket connections: `ws://${host}/ws/device-messages` (or `wss://` for HTTPS)

### Production Deployment

For production deployments, make sure to:
1. Set `VITE_API_BASE_URL` to your production API server
2. Use HTTPS for secure connections
3. Configure CORS on your backend server for the UI domain
4. Ensure WebSocket connections work through your proxy/load balancer 