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

const TenantPortal = () => {
  const { tenantId } = useParams()
  const [tenant, setTenant] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      // Simulate device status (in real app, this would come from the API)
      const devicesWithStatus = (data.data || []).map(device => ({
        ...device,
        status: Math.random() > 0.3 ? 'online' : 'offline',
        lastSeen: new Date(Date.now() - Math.random() * 86400000), // Random last seen within 24h
        batteryLevel: Math.floor(Math.random() * 100),
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