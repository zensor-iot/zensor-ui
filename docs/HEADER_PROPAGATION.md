# Header Propagation System

## Overview

The Zensor Portal UI server acts as a proxy between the frontend and the Zensor API, automatically propagating user authentication and context headers from incoming requests to the Zensor API.

## Supported Headers

### Standard Authentication Headers

| Header          | Description                        | Example          |
| --------------- | ---------------------------------- | ---------------- |
| `Authorization` | Standard HTTP authorization header | `Bearer <token>` |

| `X-User-ID`       | Unique user identifier                | `user123`           |
| `X-User-Email`    | User's email address                  | `user@example.com`  |
| `X-User-Name`     | User's display name                   | `John Doe`          |
| `X-Tenant-ID`     | Tenant identifier for multi-tenancy   | `tenant456`         |
| `X-Request-ID`    | Unique request identifier for tracing | `req-789`           |
| `X-Forwarded-For` | Client IP address                     | `192.168.1.100`     |
| `X-Real-IP`       | Real client IP address                | `192.168.1.100`     |

### Legacy Headers (Backward Compatibility)

| Header         | Description            | Example            | Mapped To      |
| -------------- | ---------------------- | ------------------ | -------------- |
| `Remote-User`  | Legacy user identifier | `user123`          | `X-User-ID`    |
| `Remote-Name`  | Legacy user name       | `John Doe`         | `X-User-Name`  |
| `Remote-Email` | Legacy user email      | `user@example.com` | `X-User-Email` |

## How It Works

1. **Request Reception**: The server receives requests from the frontend or external authentication systems
2. **Header Extraction**: Standard user headers are extracted from the incoming request
3. **Header Mapping**: Legacy Remote-* headers are mapped to their X-User-* equivalents
4. **Header Propagation**: These headers are forwarded to the Zensor API in the proxied request
5. **Server Authentication**: The server automatically injects its configured API key for all requests

## Implementation Details

### Header Processing Logic

```javascript
// Extract user headers from incoming request
const userHeaders = {}

// Standard authentication headers
if (req.headers.authorization) {
    userHeaders['Authorization'] = req.headers.authorization
}
// ... additional headers

// Legacy header mapping
if (req.headers['remote-user']) {
    userHeaders['X-User-ID'] = req.headers['remote-user']
}
if (req.headers['remote-name']) {
    userHeaders['X-User-Name'] = req.headers['remote-name']
}
if (req.headers['remote-email']) {
    userHeaders['X-User-Email'] = req.headers['remote-email']
}

// Merge with existing headers
Object.assign(headers, userHeaders)

// Inject server API key for all requests
if (ZENSOR_API_KEY) {
    headers['X-Auth-Token'] = ZENSOR_API_KEY
    headers['Authorization'] = `Bearer ${ZENSOR_API_KEY}`
}
```

### CORS Configuration

The server is configured to allow the following headers in CORS requests:

```
Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, 
X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, 
Remote-User, Remote-Name, Remote-Email
```

## Usage Examples

### Frontend API Calls

```javascript
// Example: Making an API call with user headers
const response = await fetch('/api/v1/tenants/123/devices', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'user123',
        'X-User-Email': 'user@example.com',
        'X-Tenant-ID': 'tenant456',
        'Authorization': 'Bearer user-token-here'
    }
})
// Note: API key is automatically injected by the server
```

### External Authentication System

When using external authentication systems (like Grafana), the system can be configured to inject headers:

```nginx
# Nginx configuration example
location / {
    proxy_pass http://localhost:5173;
    proxy_set_header X-User-ID $remote_user;
    proxy_set_header X-User-Email $http_x_user_email;
    proxy_set_header X-Tenant-ID $http_x_tenant_id;
    proxy_set_header Authorization $http_authorization;
}
# Note: API key is automatically injected by the server
```

## Security Considerations

1. **Header Validation**: The server forwards headers as-is without validation
2. **Sensitive Data**: Be cautious with headers containing sensitive information
3. **CORS Policy**: Ensure proper CORS configuration for your deployment environment
4. **Authentication**: Always use HTTPS in production to protect header data

## Testing

### Test Headers with curl

```bash
# Test with user headers
curl -H "X-User-ID: testuser" \
     -H "X-User-Email: test@example.com" \
     -H "X-Tenant-ID: testtenant" \
     http://localhost:5173/api/v1/tenants

# Test with authorization header
curl -H "Authorization: Bearer your-token" \
     http://localhost:5173/api/v1/tenants
```

### Debug Endpoint

Use the debug endpoint to verify header propagation:

```bash
curl -H "X-User-ID: testuser" \
     -H "X-User-Email: test@example.com" \
     http://localhost:5173/debug/path/tenants
```

## Configuration

### Environment Variables

- `ZENSOR_API_URL`: Target Zensor API URL
- `ZENSOR_API_KEY`: Fallback API key for server authentication
- `NODE_ENV`: Environment (development/production)

### Server Configuration

The header propagation is implemented in:
- `server/simple-server.js` - Main server implementation
- `server/middleware/api-proxy.js` - API proxy middleware

## Troubleshooting

### Common Issues

1. **Headers Not Propagated**: Check CORS configuration and ensure headers are included in `Access-Control-Allow-Headers`
2. **Authentication Failures**: Verify that user headers are being sent correctly from the client
3. **CORS Errors**: Ensure the frontend is sending headers that are allowed in the CORS policy

### Debug Steps

1. Check server logs for header propagation messages
2. Use browser developer tools to inspect request headers
3. Test with curl to isolate frontend vs backend issues
4. Verify Zensor API is receiving the expected headers 