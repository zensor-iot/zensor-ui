import { 
  Cpu, 
  Wifi, 
  Battery, 
  Circle,
  MoreVertical,
  Edit3,
  Check,
  X,
  Droplets,
  Clock,
  Thermometer,
  Gauge,
  BarChart3
} from 'lucide-react'
import { useState } from 'react'

const TenantDeviceCard = ({ device, sensorData, onUpdateDisplayName }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDisplayName, setEditedDisplayName] = useState(device.display_name || device.name)
  const [isUpdating, setIsUpdating] = useState(false)
  const [irrigationMinutes, setIrrigationMinutes] = useState(5)
  const [isIrrigating, setIsIrrigating] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981'
      case 'offline': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getSignalBars = (strength) => {
    if (strength >= 80) return 4
    if (strength >= 60) return 3
    if (strength >= 40) return 2
    if (strength >= 20) return 1
    return 0
  }

  const formatLastSeen = (date) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getSensorIcon = (sensorType) => {
    const type = sensorType.toLowerCase()
    if (type.includes('temp')) return <Thermometer className="sensor-icon" />
    if (type.includes('humid') || type.includes('water')) return <Droplets className="sensor-icon" />
    if (type.includes('flow') || type.includes('pressure')) return <Gauge className="sensor-icon" />
    return <BarChart3 className="sensor-icon" />
  }

  const getSensorUnit = (sensorType) => {
    const type = sensorType.toLowerCase()
    if (type.includes('temp')) return '°C'
    if (type.includes('humid')) return '%'
    if (type.includes('water') && type.includes('flow')) return 'L/min'
    if (type.includes('pressure')) return 'bar'
    return ''
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const renderSensorData = () => {
    if (!sensorData || !sensorData.data) {
      return (
        <div className="sensor-data-section">
          <div className="sensor-data-header">
            <h4>Sensor Data</h4>
            <span className="no-data">No recent data</span>
          </div>
        </div>
      )
    }

    const entries = Object.entries(sensorData.data)
    if (entries.length === 0) {
      return (
        <div className="sensor-data-section">
          <div className="sensor-data-header">
            <h4>Sensor Data</h4>
            <span className="no-data">No sensor data</span>
          </div>
        </div>
      )
    }

    return (
      <div className="sensor-data-section">
        <div className="sensor-data-header">
          <h4>Latest Sensor Data</h4>
          <span className="data-timestamp">{formatTimestamp(sensorData.timestamp)}</span>
        </div>
        <div className="sensor-data-container">
          {entries.map(([sensorType, readings]) => {
            if (!Array.isArray(readings) || readings.length === 0) return null
            
            const unit = getSensorUnit(sensorType)
            
            return (
              <div key={sensorType} className="sensor-type">
                <div className="sensor-header">
                  {getSensorIcon(sensorType)}
                  <span className="sensor-name">{sensorType}</span>
                  <span className="sensor-count">({readings.length})</span>
                </div>
                <div className="sensor-readings">
                  {readings.map((reading, idx) => (
                    <div key={idx} className="sensor-reading">
                      <span className="reading-index">#{reading.Index || reading.index}</span>
                      <span className="reading-value">
                        {typeof (reading.Value || reading.value) === 'number' ? 
                          (reading.Value || reading.value).toFixed(2) : 
                          (reading.Value || reading.value)}
                        {unit && <span className="reading-unit">{unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }).filter(Boolean)}
        </div>
      </div>
    )
  }

  const handleSaveDisplayName = async () => {
    if (editedDisplayName.trim() === '') return
    
    setIsUpdating(true)
    try {
      await onUpdateDisplayName(device.id, editedDisplayName.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update display name:', error)
      // Reset to original value on error
      setEditedDisplayName(device.display_name || device.name)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedDisplayName(device.display_name || device.name)
    setIsEditing(false)
  }

  const handleIrrigation = async () => {
    if (isIrrigating || device.status === 'offline') return
    
    setIsIrrigating(true)
    try {
      const taskPayload = {
        commands: [
          {
            wait_for: "0s", // Immediate activation
            priority: "HIGH",
            index: 1,
            value: 1 // Activation value
          },
          {
            wait_for: `${irrigationMinutes}m`, // Wait for user-specified minutes
            priority: "HIGH", 
            index: 1,
            value: 2 // Deactivation value
          }
        ]
      }

      const response = await fetch(`http://localhost:3000/v1/devices/${device.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskPayload)
      })

      if (!response.ok) {
        throw new Error(`Failed to start irrigation`)
      }

      const result = await response.json()
      console.log('Irrigation task created:', result)
      
      // Show feedback to user
      alert(`Irrigation started for ${irrigationMinutes} minutes!`)
      
      // Reset irrigation state after the duration + buffer
      setTimeout(() => {
        setIsIrrigating(false)
      }, (irrigationMinutes * 60 + 30) * 1000) // Add 30 seconds buffer
      
    } catch (error) {
      console.error('Failed to start irrigation:', error)
      alert(`Failed to start irrigation: ${error.message}`)
      setIsIrrigating(false)
    }
  }

  return (
    <div className="tenant-device-card">
      {/* Device Header */}
      <div className="device-header">
        <div className="device-identity">
          <div className="device-icon-wrapper">
            <Cpu className="device-icon" />
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(device.status) }}
            />
          </div>
          <div className="device-info">
            {isEditing ? (
              <div className="device-name-edit">
                <input
                  type="text"
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  className="device-name-input"
                  placeholder="Enter display name"
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDisplayName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                />
                <div className="edit-actions">
                  <button 
                    onClick={handleSaveDisplayName}
                    disabled={isUpdating || editedDisplayName.trim() === ''}
                    className="edit-save-btn"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="edit-cancel-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <h3 className="device-name">
                {device.display_name || device.name}
                <button 
                  onClick={() => setIsEditing(true)}
                  className="edit-name-btn"
                  title="Edit display name"
                >
                  <Edit3 size={14} />
                </button>
              </h3>
            )}
            <p className="device-status">
              <Circle 
                size={8} 
                fill={getStatusColor(device.status)}
                color={getStatusColor(device.status)}
              />
              {device.status === 'online' ? 'Online' : 'Offline'} • {formatLastSeen(device.lastSeen)}
            </p>
          </div>
        </div>
        <button className="device-menu">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Device Metrics */}
      <div className="device-metrics">
        <div className="metric">
          <div className="metric-icon">
            <Wifi size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Signal</span>
            <div className="signal-bars">
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`signal-bar ${bar <= getSignalBars(device.signalStrength) ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="metric">
          <div className="metric-icon">
            <Battery size={16} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Battery</span>
            <div className="battery-indicator">
              <div 
                className="battery-level"
                style={{ width: `${device.batteryLevel}%` }}
              />
              <span className="battery-text">{device.batteryLevel}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data Section */}
      {renderSensorData()}

      {/* Irrigation Control */}
      <div className="irrigation-control">
        <div className="irrigation-header">
          <div className="irrigation-title">
            <Droplets size={18} />
            <span>Irrigation Control</span>
          </div>
          {isIrrigating && (
            <div className="irrigation-status">
              <Circle size={8} fill="#10b981" color="#10b981" />
              <span>Active</span>
            </div>
          )}
        </div>
        
        <div className="irrigation-settings">
          <div className="duration-control">
            <label htmlFor={`duration-${device.id}`} className="duration-label">
              <Clock size={14} />
              Duration (minutes)
            </label>
            <div className="duration-input-group">
              <button 
                className="duration-btn"
                onClick={() => setIrrigationMinutes(Math.max(1, irrigationMinutes - 1))}
                disabled={isIrrigating || device.status === 'offline'}
              >
                -
              </button>
              <input
                id={`duration-${device.id}`}
                type="number"
                min="1"
                max="60"
                value={irrigationMinutes}
                onChange={(e) => setIrrigationMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                className="duration-input"
                disabled={isIrrigating || device.status === 'offline'}
              />
              <button 
                className="duration-btn"
                onClick={() => setIrrigationMinutes(Math.min(60, irrigationMinutes + 1))}
                disabled={isIrrigating || device.status === 'offline'}
              >
                +
              </button>
            </div>
          </div>
          
          <button 
            className={`irrigation-btn ${isIrrigating ? 'active' : ''}`}
            onClick={handleIrrigation}
            disabled={isIrrigating || device.status === 'offline'}
          >
            <Droplets size={16} />
            {isIrrigating ? `Irrigating (${irrigationMinutes}m)` : 'Start Irrigation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TenantDeviceCard 