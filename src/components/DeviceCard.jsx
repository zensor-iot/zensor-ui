import { Cpu, Signal, Wifi, Key } from 'lucide-react'

const DeviceCard = ({ device, onViewDetails, onSendCommand }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="device-card">
      <div className="device-card-header">
        <div className="device-icon">
          <Cpu size={24} />
        </div>
        <div className="device-info">
          <h4 className="device-name">{device.name}</h4>
          <p className="device-id">ID: {device.id}</p>
        </div>
      </div>

      <div className="device-details">
        <div className="detail-row">
          <Signal className="detail-icon" />
          <span className="detail-label">App EUI:</span>
          <code 
            className="detail-value clickable" 
            onClick={() => copyToClipboard(device.app_eui)}
            title="Click to copy"
          >
            {device.app_eui}
          </code>
        </div>

        <div className="detail-row">
          <Wifi className="detail-icon" />
          <span className="detail-label">Dev EUI:</span>
          <code 
            className="detail-value clickable"
            onClick={() => copyToClipboard(device.dev_eui)}
            title="Click to copy"
          >
            {device.dev_eui}
          </code>
        </div>

        <div className="detail-row">
          <Key className="detail-icon" />
          <span className="detail-label">App Key:</span>
          <code 
            className="detail-value clickable"
            onClick={() => copyToClipboard(device.app_key)}
            title="Click to copy"
          >
            {device.app_key.substring(0, 16)}...
          </code>
        </div>

        {device.tenant_id && (
          <div className="detail-row">
            <Cpu className="detail-icon" />
            <span className="detail-label">Tenant:</span>
            <span className="detail-value">
              {device.tenant_id}
            </span>
          </div>
        )}
      </div>

      <div className="device-actions">
        <button 
          className="action-button primary"
          onClick={() => onViewDetails && onViewDetails(device)}
        >
          View Details
        </button>
        <button 
          className="action-button secondary"
          onClick={() => onSendCommand && onSendCommand(device)}
        >
          Send Command
        </button>
      </div>
    </div>
  )
}

export default DeviceCard 