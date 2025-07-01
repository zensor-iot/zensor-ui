# Zensor Mock Server

This directory contains mock server implementations for the Zensor API to support development and testing of the Zensor Portal UI.

## Available Mock Servers

### 1. Custom Mock Server (Recommended)
A comprehensive Express.js-based mock server with realistic data and WebSocket support.

**Features:**
- ✅ Full API endpoint coverage
- ✅ Realistic mock data
- ✅ WebSocket support for real-time device messages
- ✅ CORS enabled
- ✅ Error handling
- ✅ Graceful shutdown

**Start the server:**
```bash
npm run mock
```

### 2. Prism Mock Server
A Prism-based mock server that generates responses from the OpenAPI specification.

**Features:**
- ✅ OpenAPI specification compliance
- ✅ Dynamic response generation
- ✅ CORS enabled
- ✅ Verbose logging

**Start the server:**
```bash
npm run mock:prism
```

## Server Configuration

### Custom Mock Server
- **Port**: 3000 (configurable via `PORT` environment variable)
- **Host**: 0.0.0.0 (configurable via `HOST` environment variable)
- **WebSocket**: ws://localhost:3000/ws/device-messages

### Prism Mock Server
- **Port**: 3000
- **Host**: 0.0.0.0
- **OpenAPI Spec**: docs/openapi.yaml

## Mock Data

The custom mock server includes realistic sample data:

### Tenants
- **Acme Corporation** (ID: 550e8400-e29b-41d4-a716-446655440001)
- **Green Farms Ltd** (ID: 550e8400-e29b-41d4-a716-446655440002)

### Devices
- **Temperature Sensor 1** (online)
- **Irrigation Controller 1** (online, includes relay data)
- **Humidity Sensor 1** (offline)

### Scheduled Tasks
- Daily 6 AM irrigation (5 minutes, active)
- Daily 6 PM irrigation (3 minutes, inactive)

## API Endpoints

### Health & Monitoring
- `GET /healthz` - Health check
- `GET /metrics` - Prometheus metrics

### Tenants
- `GET /v1/tenants` - List tenants
- `POST /v1/tenants` - Create tenant
- `GET /v1/tenants/{id}` - Get tenant
- `PUT /v1/tenants/{id}` - Update tenant

### Devices
- `GET /v1/devices` - List all devices
- `POST /v1/devices` - Create device
- `GET /v1/devices/{id}` - Get device
- `PUT /v1/devices/{id}` - Update device

### Tenant Devices
- `GET /v1/tenants/{id}/devices` - List tenant devices
- `POST /v1/tenants/{id}/devices` - Adopt device

### Tasks
- `GET /v1/devices/{id}/tasks` - List device tasks
- `POST /v1/devices/{id}/tasks` - Create task

### Scheduled Tasks
- `GET /v1/tenants/{tid}/devices/{did}/scheduled-tasks` - List scheduled tasks
- `POST /v1/tenants/{tid}/devices/{did}/scheduled-tasks` - Create scheduled task
- `GET /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id}` - Get scheduled task
- `PUT /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id}` - Update scheduled task
- `DELETE /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id}` - Delete scheduled task

### WebSocket
- `GET /ws/device-messages` - WebSocket endpoint for real-time device messages

## WebSocket Data Format

The WebSocket sends device message updates every 5 seconds:

```json
{
  "type": "device_message",
  "device_id": "123e4567-e89b-12d3-a456-426614174001",
  "data": {
    "temperature": {
      "Index": 1,
      "Value": 22.5
    },
    "humidity": {
      "Index": 1,
      "Value": 45.2
    },
    "relay": {
      "Index": 1,
      "Value": 0
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "receivedAt": "2024-01-15T10:30:00Z"
}
```

## Development Workflow

1. **Start the mock server:**
   ```bash
   npm run mock
   ```

2. **Start the React development server:**
   ```bash
   npm run dev
   ```

3. **Configure the React app to use the mock server:**
   Set the environment variable:
   ```bash
   export VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Access the application:**
   - React App: http://localhost:5173
   - Mock Server: http://localhost:3000

## Testing the API

You can test the API endpoints using curl:

```bash
# Health check
curl http://localhost:3000/healthz

# List tenants
curl http://localhost:3000/v1/tenants

# Get specific tenant
curl http://localhost:3000/v1/tenants/550e8400-e29b-41d4-a716-446655440001

# List tenant devices
curl http://localhost:3000/v1/tenants/550e8400-e29b-41d4-a716-446655440001/devices

# Create a scheduled task
curl -X POST http://localhost:3000/v1/tenants/550e8400-e29b-41d4-a716-446655440001/devices/123e4567-e89b-12d3-a456-426614174002/scheduled-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
  {"index": 1, "value": 1, "priority": "NORMAL", "wait_for": "0s"},
  {"index": 1, "value": 0, "priority": "NORMAL", "wait_for": "5m"}
],
    "schedule": "0 0 12 * * *",
    "is_active": true
  }'
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it:
```bash
PORT=3001 npm run mock
```

### WebSocket Connection Issues
Make sure the WebSocket URL is correctly configured in the React app:
```javascript
// Should be ws://localhost:3000/ws/device-messages
const wsUrl = getWebSocketUrl('/ws/device-messages')
```

### CORS Issues
The mock server has CORS enabled by default. If you encounter CORS issues, check that the React app is making requests to the correct URL.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

## Dependencies

The custom mock server requires these npm packages:
- `express` - Web framework
- `cors` - CORS middleware
- `ws` - WebSocket support
- `uuid` - UUID generation 