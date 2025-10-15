# Logging Configuration for Zensor Portal UI

## Overview

The Zensor Portal UI implements structured logging using Pino, designed to be easily consumed by Loki via Docker logging drivers. All logs are output in JSON format with consistent key:value pairs for optimal Loki integration.

## Logging Architecture

### Core Components

- **Logger**: `server/logger.js` - Main logging library with structured output
- **Middleware**: `server/middleware/logging.js` - Express middleware for request/response logging
- **Integration**: Integrated into all server components (API proxy, WebSocket, etc.)

### Log Structure

All logs follow a consistent key=value format optimized for Loki and human readability:

```
time=2024-01-15T10:30:00.000Z level=INFO service=zensor-ui environment=production version=0.0.0 pid=12345 hostname=server-01 event=api_request requestId=req-123 traceId=trace-456 spanId=span-789 method=GET url="/api/tenants" statusCode=200 duration=150 msg="API request completed"
```

**Format Rules:**
- `time=timestamp` - ISO timestamp
- `level=LEVEL` - Uppercase log level (ERROR, WARN, INFO, DEBUG)
- `service=name` - Service identifier
- `environment=env` - Environment (development, production)
- `version=version` - Application version
- `key=value` - Simple key-value pairs
- `key="value"` - Quoted values for strings with spaces or special characters
- `key="json"` - JSON objects are serialized as quoted strings
- `msg="message"` - Human-readable message at the end

## Log Levels

- **error**: System errors, API failures, critical issues
- **warn**: Warnings, security events, degraded functionality
- **info**: General information, successful operations, system events
- **debug**: Detailed debugging information (development only)

## Event Types

### API Events
- `api_request` - HTTP API requests
- `api_error` - API request failures
- `api_proxy_request` - Proxy requests to Zensor API
- `api_proxy_error` - Proxy request failures

### WebSocket Events
- `websocket_event` - WebSocket operations
- `client_connected` - Client WebSocket connection
- `client_disconnected` - Client WebSocket disconnection
- `upstream_connected` - Connection to Zensor WebSocket
- `upstream_error` - Zensor WebSocket errors

### System Events
- `system_event` - System-level events
- `server_started` - Server startup
- `health_check` - Health check requests
- `spa_serve` - SPA file serving

### Device Events
- `device_operation` - Device control operations
- `scheduled_task_operation` - Scheduled task management

### Authentication Events
- `auth_event` - Authentication operations
- `user_info_request` - User information requests

## Configuration

### Environment Variables

```bash
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Environment (development, production)
NODE_ENV=production

# Service information
npm_package_version=0.0.0
```

### Development vs Production

**Development Mode:**
- Pretty-printed logs with colors
- Debug level logging enabled
- Human-readable timestamps

**Production Mode:**
- Raw JSON output
- Info level logging (configurable)
- ISO timestamps
- Sensitive data redaction

## Docker Integration

### Docker Logging Driver

The application outputs structured JSON logs that can be consumed by Loki using Docker's logging drivers:

```yaml
# docker-compose.yml
version: '3.8'
services:
  zensor-ui:
    image: zensor-ui:latest
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
        loki-batch-size: "400"
        loki-batch-wait: "1s"
        loki-external-labels: "service=zensor-ui,environment=production"
```

### Loki Labels

Logs are automatically labeled with:
- `service`: "zensor-ui"
- `environment`: NODE_ENV value
- `version`: Package version
- `level`: Log level
- `event`: Event type

## Usage Examples

### Basic Logging

```javascript
import { createLogger } from './server/logger.js'

const logger = createLogger({ component: 'my-component' })

logger.info({
  event: 'operation_completed',
  userId: 'user-123',
  operation: 'create_tenant',
  duration: 250
}, 'Tenant created successfully')
```

### Request-Scoped Logging

```javascript
import { createRequestLogger } from './server/logger.js'

app.get('/api/tenants', (req, res) => {
  const logger = createRequestLogger(req, { operation: 'list_tenants' })
  
  logger.info({
    event: 'tenant_list_request',
    tenantCount: tenants.length
  }, 'Tenant list requested')
})
```

### WebSocket Logging

```javascript
import { logWebSocketEvent } from './server/logger.js'

logWebSocketEvent('message_received', {
  messageType: 'device_data',
  deviceId: 'device-123',
  messageSize: 1024
}, { operation: 'websocket_handler' })
```

### Device Operations

```javascript
import { logDeviceOperation } from './server/logger.js'

logDeviceOperation('irrigation_start', {
  id: 'device-123',
  name: 'Irrigation Controller',
  tenantId: 'tenant-456'
}, {
  duration: 30,
  command: 'start_irrigation'
})
```

## Log Analysis with Loki

### Common Queries

**All API requests:**
```logql
{service="zensor-ui"} |= "event=api_request"
```

**Error logs:**
```logql
{service="zensor-ui"} |= "level=ERROR"
```

**WebSocket events:**
```logql
{service="zensor-ui"} |= "event=websocket_event"
```

**Device operations:**
```logql
{service="zensor-ui"} |= "event=device_operation"
```

**Performance analysis:**
```logql
{service="zensor-ui"} |= "event=request_performance" | regexp "duration=(?P<duration>\\d+)" | duration > 1000
```

**Trace correlation:**
```logql
{service="zensor-ui"} |= "traceId=trace-123"
```

**Specific operation:**
```logql
{service="zensor-ui"} |= "operation=api_proxy"
```

**Request by method:**
```logql
{service="zensor-ui"} |= "method=GET"
```

### Grafana Dashboards

Create dashboards using these log queries to monitor:
- Request rates and response times
- Error rates and types
- WebSocket connection health
- Device operation success rates
- System performance metrics

## Security Considerations

### Sensitive Data Redaction

The logger automatically redacts sensitive information:
- `password`
- `token`
- `authorization`
- `x-auth-token`
- `apiKey`

### Log Sanitization

All user inputs in log messages are sanitized to prevent log injection attacks.

## Performance Impact

- **Minimal overhead**: Pino is one of the fastest Node.js loggers
- **Async logging**: Non-blocking log output
- **Configurable levels**: Reduce verbosity in production
- **Structured data**: Efficient JSON serialization

## Troubleshooting

### Common Issues

1. **Missing logs in Loki**
   - Check Docker logging driver configuration
   - Verify Loki endpoint accessibility
   - Check log level configuration

2. **Performance issues**
   - Reduce log level in production
   - Check for excessive debug logging
   - Monitor log volume

3. **Log format issues**
   - Ensure JSON output in production
   - Check for log injection in user data
   - Verify timestamp format

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug npm run dev
```

This will show detailed trace information and internal operations.

## Best Practices

1. **Use structured data**: Always include relevant context in log objects
2. **Consistent event names**: Use descriptive, consistent event identifiers
3. **Include correlation IDs**: Use requestId, traceId for request tracing
4. **Log at appropriate levels**: Don't log everything as info
5. **Include timing data**: Add duration for performance monitoring
6. **Use child loggers**: Create context-specific loggers for components
7. **Monitor log volume**: Be aware of log generation rates in production
