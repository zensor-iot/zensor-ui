import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Cpu, 
  Activity, 
  Wifi,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import TenantDeviceCard from './TenantDeviceCard'
import useWebSocket from '../hooks/useWebSocket'

const TenantPortal = () => {
  const { tenantId } = useParams()
  const [tenant, setTenant] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deviceSensorData, setDeviceSensorData] = useState({}) // Store latest sensor data for each device

  // WebSocket connection for real-time sensor data
  const wsUrl = `ws://${window.location.hostname}:3000/ws/device-messages`
  const { isConnected, lastMessage } = useWebSocket(wsUrl)

  // Process incoming WebSocket messages to store latest sensor data
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'device_message') {
      setDeviceSensorData(prev => ({
        ...prev,
        [lastMessage.device_id]: {
          data: lastMessage.data,
          timestamp: lastMessage.timestamp,
          receivedAt: new Date()
        }
      }))
    }
  }, [lastMessage])

  useEffect(() => {
    fetchTenantInfo()
    fetchTenantDevices()
    // Set up periodic refresh for device status
    const interval = setInterval(fetchTenantDevices, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [tenantId])

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch(`http://localhost:3000/v1/tenants/${tenantId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tenant information`)
      }
      const data = await response.json()
      setTenant(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchTenantDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3000/v1/tenants/${tenantId}/devices`)
      if (!response.ok) {
        throw new Error(`Failed to fetch devices`)
      }
      const data = await response.json()
      // Use real device status and timestamp from API
      const devicesWithStatus = (data.data || []).map(device => ({
        ...device,
        // Use real status from API
        status: device.status,
        // Use real last message timestamp from API
        lastSeen: device.last_message_received_at ? new Date(device.last_message_received_at) : null,
        // Keep simulated values for metrics not yet implemented in API
        batteryLevel: 100, // Always show 100% battery
        signalStrength: Math.floor(Math.random() * 100)
      }))
      setDevices(devicesWithStatus)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDisplayName = async (deviceId, displayName) => {
    try {
      const response = await fetch(`http://localhost:3000/v1/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update device display name`)
      }

      // Update the local devices state
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === deviceId 
            ? { ...device, display_name: displayName }
            : device
        )
      )
    } catch (err) {
      throw new Error(`Failed to update display name: ${err.message}`)
    }
  }

  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length
  }

  if (error) {
    return (
      <div className="tenant-portal error">
        <div className="error-container">
          <AlertCircle className="error-icon" />
          <h2>Unable to load your devices</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => {
            setError(null)
            fetchTenantInfo()
            fetchTenantDevices()
          }} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tenant-portal">
      {/* Portal Header */}
      <header className="portal-header">
        <div className="portal-header-content">
          <div className="portal-branding">
            <Activity className="portal-logo" />
            <div className="portal-title">
              <h1>Device Management Portal</h1>
              {tenant && (
                <p className="tenant-name">{tenant.name}</p>
              )}
            </div>
          </div>
          <div className="portal-status">
            <div className="websocket-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                <span>{isConnected ? 'Live Data Connected' : 'Live Data Disconnected'}</span>
              </div>
            </div>
            <div className="last-updated">
              <Clock size={16} />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <section className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Cpu className="icon" />
          </div>
          <div className="stat-content">
            <h3>Total Devices</h3>
            <p className="stat-number">{deviceStats.total}</p>
          </div>
        </div>
        
        <div className="stat-card online">
          <div className="stat-icon">
            <CheckCircle className="icon" />
          </div>
          <div className="stat-content">
            <h3>Online</h3>
            <p className="stat-number">{deviceStats.online}</p>
          </div>
        </div>
        
        <div className="stat-card offline">
          <div className="stat-icon">
            <XCircle className="icon" />
          </div>
          <div className="stat-content">
            <h3>Offline</h3>
            <p className="stat-number">{deviceStats.offline}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Wifi className="icon" />
          </div>
          <div className="stat-content">
            <h3>Health Score</h3>
            <p className="stat-number">{Math.round((deviceStats.online / deviceStats.total) * 100)}%</p>
          </div>
        </div>
      </section>

      {/* Device Management Section */}
      <section className="device-management">
        <div className="section-header">
          <h2>Your Devices</h2>
        </div>

        {/* Device Grid */}
        {loading ? (
          <div className="loading-container">
            <Loader2 className="loading-spinner" />
            <p>Loading your devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="empty-state">
            <Cpu size={64} className="empty-icon" />
            <h3>No devices found</h3>
            <p>Contact your administrator to add devices to your fleet</p>
          </div>
        ) : (
          <div className="device-grid">
            {devices.map((device) => (
              <TenantDeviceCard
                key={device.id}
                device={device}
                sensorData={deviceSensorData[device.name]} // Pass latest sensor data
                onUpdateDisplayName={handleUpdateDisplayName}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default TenantPortal 