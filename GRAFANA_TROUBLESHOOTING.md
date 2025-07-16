# Grafana Troubleshooting Guide

## Current Error
```
Failed to get settings" error="context canceled"
Error rendering template: error. You may need to build frontend assets
can't evaluate field Assets in type struct
```

## Possible Causes & Solutions

### 1. Grafana Frontend Assets Issue
The error suggests Grafana's frontend assets are missing or corrupted.

**Solution:**
```bash
# If using Docker
docker restart grafana-container

# If using systemd
sudo systemctl restart grafana-server

# If using Docker Compose
docker-compose restart grafana
```

### 2. Grafana Version Compatibility
The error might be due to version incompatibility.

**Check Version:**
```bash
# Check Grafana version
curl http://cardamomo.zensor-iot.net/grafana/api/health
```

### 3. Configuration Issues
The error might be related to specific URL parameters.

**Try Simplified URL:**
Remove complex parameters and test with basic URL:
```
http://cardamomo.zensor-iot.net/grafana/d-solo/ces2boi7cdh4wc/sensor-data?orgId=1&panelId=1
```

### 4. Authentication Issues
The error might be related to authentication context.

**Solutions:**
- Ensure API key is valid
- Check if anonymous access is properly configured
- Verify dashboard permissions

### 5. Dashboard/Panel Issues
The specific dashboard or panel might be corrupted.

**Check:**
- Verify dashboard ID `ces2boi7cdh4wc` exists
- Verify panel ID `1` exists
- Check if dashboard is accessible in Grafana UI

## Immediate Fixes to Try

### Fix 1: Simplify URL Parameters
Update the Grafana URL to use minimal parameters:

```javascript
// In GrafanaVisualization.jsx
const baseUrl = `${config.grafanaBaseUrl}/grafana/d-solo/ces2boi7cdh4wc/sensor-data?orgId=1&panelId=1&var-device_name=${encodeURIComponent(deviceName)}`
```

### Fix 2: Remove Problematic Parameters
Remove parameters that might cause issues:

```javascript
// Remove these parameters:
// &from=${from}&to=${to}&timezone=browser&__feature.dashboardSceneSolo&refresh=0&kiosk
```

### Fix 3: Use Different Authentication Method
Try using session-based authentication instead of API key:

```javascript
// Remove authToken parameter and rely on session cookies
const grafanaUrl = baseUrl
```

### Fix 4: Check Dashboard in Browser
1. Open `http://cardamomo.zensor-iot.net/grafana` in browser
2. Navigate to the dashboard manually
3. Check if it loads without errors
4. Copy the working URL from browser

## Testing Steps

1. **Test Basic Dashboard:**
   ```bash
   curl "http://cardamomo.zensor-iot.net/grafana/d-solo/ces2boi7cdh4wc/sensor-data?orgId=1&panelId=1"
   ```

2. **Test with Device Variable:**
   ```bash
   curl "http://cardamomo.zensor-iot.net/grafana/d-solo/ces2boi7cdh4wc/sensor-data?orgId=1&panelId=1&var-device_name=test-device"
   ```

3. **Test in Browser:**
   - Open the URL directly in browser
   - Check for JavaScript errors in console
   - Verify dashboard loads properly

## Recommended Next Steps

1. **Restart Grafana** - This often fixes frontend asset issues
2. **Simplify URL** - Remove complex parameters
3. **Check Dashboard** - Verify dashboard exists and is accessible
4. **Test Authentication** - Ensure API key or anonymous access works
5. **Update Configuration** - Apply fixes based on testing results 