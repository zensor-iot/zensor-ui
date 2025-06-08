import { 
  Cpu, 
  Wifi, 
  Battery, 
  Circle,
  Settings,
  RotateCcw,
  Play,
  Pause,
  MoreVertical,
  Edit3,
  Check,
  X
} from 'lucide-react'
import { useState } from 'react'

const TenantDeviceCard = ({ device, onAction, onUpdateDisplayName }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDisplayName, setEditedDisplayName] = useState(device.display_name || device.name)
  const [isUpdating, setIsUpdating] = useState(false)

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
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
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

      {/* Quick Stats */}
      <div className="device-stats">
        <div className="stat-item">
          <span className="stat-label">Uptime</span>
          <span className="stat-value">
            {device.status === 'online' ? '99.2%' : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Usage</span>
          <span className="stat-value">2.3 MB</span>
        </div>
      </div>

      {/* Device Actions */}
      <div className="device-actions">
        <button 
          className="action-btn primary"
          onClick={() => onAction(device.id, 'configure')}
          disabled={device.status === 'offline'}
        >
          <Settings size={16} />
          Configure
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => onAction(device.id, 'restart')}
          disabled={device.status === 'offline'}
        >
          <RotateCcw size={16} />
          Restart
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => onAction(device.id, device.status === 'online' ? 'pause' : 'resume')}
        >
          {device.status === 'online' ? (
            <>
              <Pause size={16} />
              Pause
            </>
          ) : (
            <>
              <Play size={16} />
              Resume
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default TenantDeviceCard 