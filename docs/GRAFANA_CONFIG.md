# Grafana Configuration for Iframe Embedding

## Problem
The error "Refused to display '<URL>' in a frame because it set 'X-Frame-Options' to 'deny'" occurs because Grafana blocks iframe embedding by default.

## Solution: Configure Grafana

### 1. Grafana Configuration File
Edit your Grafana configuration file (usually `grafana.ini` or `custom.ini`):

```ini
[security]
# Allow embedding in iframes
allow_embedding = true

# Configure allowed origins for embedding (optional but recommended)
cookie_samesite = none
```

### 2. Environment Variables (Alternative)
If using Docker or environment-based configuration:

```bash
# Set these environment variables
GF_SECURITY_ALLOW_EMBEDDING=true
GF_SECURITY_COOKIE_SAMESITE=none
```

### 3. Docker Compose Example
If using Docker Compose, add to your grafana service:

```yaml
services:
  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_SECURITY_COOKIE_SAMESITE=none
    # ... other configuration
```

### 4. Restart Grafana
After making changes, restart your Grafana service:

```bash
# If using systemd
sudo systemctl restart grafana-server

# If using Docker
docker-compose restart grafana

# If using Docker directly
docker restart grafana-container
```

## Security Considerations

- **allow_embedding = true** enables iframe embedding
- **cookie_samesite = none** allows cookies to work in embedded context
- Consider implementing additional security measures like:
  - CORS configuration
  - Authentication requirements
  - Domain whitelisting

## Alternative: Use Grafana API

If iframe embedding is not possible, consider using the Grafana API to fetch data and create custom visualizations in the React app.

## Testing

After configuration, test the iframe embedding by:
1. Opening the Zensor Portal UI
2. Clicking "Analytics" on any device
3. Verifying the Grafana dashboard loads in the modal 