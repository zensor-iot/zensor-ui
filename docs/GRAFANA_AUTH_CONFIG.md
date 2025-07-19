# Grafana Authentication Configuration for Embedding

## Problem
Grafana is asking for authentication when embedded in iframes, preventing the dashboard from loading.

## Solution 1: Anonymous Access (Recommended)

### 1. Configure Anonymous Access
Edit your Grafana configuration file (`grafana.ini`):

```ini
[security]
allow_embedding = true
cookie_samesite = none

[auth.anonymous]
enabled = true
org_name = Main Org.
org_role = Viewer
```

### 2. Environment Variables (Docker)
If using Docker, add these environment variables:

```yaml
environment:
  - GF_SECURITY_ALLOW_EMBEDDING=true
  - GF_SECURITY_COOKIE_SAMESITE=none
  - GF_AUTH_ANONYMOUS_ENABLED=true
  - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

### 3. Make Dashboard Public
In Grafana UI:
1. Go to the dashboard settings
2. Set "Editable" to "No" 
3. Set "Viewable" to "Yes"
4. Save the dashboard

## Solution 2: API Key Authentication

### 1. Create API Key
1. Go to Grafana → Configuration → API Keys
2. Create a new API key with "Viewer" role
3. Copy the API key

### 2. Update URL with API Key
Modify the Grafana URL to include the API key:

```
https://cardamomo.zensor-iot.net/grafana/d-solo/fes28u6b3f6yof/sensor-data?orgId=1&from=${from}&to=${to}&timezone=browser&var-device_name=${deviceName}&panelId=1&__feature.dashboardSceneSolo&authToken=YOUR_API_KEY
```

## Solution 3: Session-Based Authentication

### 1. Pre-authenticate User
Create a login endpoint that sets Grafana session cookies:

```javascript
// In your backend API
const loginToGrafana = async (username, password) => {
  const response = await fetch('https://cardamomo.zensor-iot.net/grafana/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: username, password: password }),
    credentials: 'include'
  });
  return response.cookies;
};
```

### 2. Pass Session to Frontend
The session cookies will be automatically included in the iframe request.

## Solution 4: Proxy Authentication

### 1. Create Proxy Endpoint
Create a backend endpoint that proxies Grafana requests:

```javascript
// Backend proxy endpoint
app.get('/api/grafana-proxy/:dashboardId', async (req, res) => {
  const { dashboardId } = req.params;
  const grafanaUrl = `https://cardamomo.zensor-iot.net/grafana/d-solo/${dashboardId}/sensor-data?${req.query}`;
  
  // Add authentication headers
  const response = await fetch(grafanaUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.GRAFANA_API_KEY}`
    }
  });
  
  const data = await response.text();
  res.send(data);
});
```

### 2. Update Frontend URL
Use the proxy URL instead of direct Grafana URL.

## Recommended Approach

**Use Solution 1 (Anonymous Access)** for the best user experience:
- No authentication prompts
- Clean embedding experience
- Secure when dashboard is set to read-only

## Testing

After configuration:
1. Restart Grafana
2. Test the iframe embedding
3. Verify no authentication prompts appear 