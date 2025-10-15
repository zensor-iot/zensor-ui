import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Cpu, ArrowLeft, Eye, Edit, Trash2, Plus, Building, Clock, Activity } from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin'
import { useNotification } from '../../hooks/useNotification'
import './AdminDevices.css'

const AdminDevices = () => {
    const { tenantId } = useParams()
    const { isAdmin, isLoading } = useAdmin()
    const { showSuccess, showError, showApiNotification } = useNotification()
    const [devices, setDevices] = useState([])
    const [tenant, setTenant] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingDevice, setEditingDevice] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        device_type: 'sensor',
        location: '',
        status: 'active'
    })

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            showError('Access denied. Admin privileges required.', 'Unauthorized')
            return
        }

        if (isAdmin && tenantId) {
            fetchTenantAndDevices()
        }
    }, [isAdmin, isLoading, tenantId])

    const fetchTenantAndDevices = async () => {
        try {
            setLoading(true)

            // Fetch tenant info and devices in parallel
            const [tenantResponse, devicesResponse] = await Promise.all([
                fetch(`/api/tenants/${tenantId}`),
                fetch(`/api/tenants/${tenantId}/devices`)
            ])

            if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json()
                setTenant(tenantData)
            }

            if (devicesResponse.ok) {
                const devicesData = await devicesResponse.json()
                setDevices(devicesData)
            } else {
                throw new Error(`HTTP ${devicesResponse.status}`)
            }
        } catch (error) {
            console.error('Failed to fetch tenant and devices:', error)
            showError('Failed to load tenant and devices', 'Error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateDevice = async (e) => {
        e.preventDefault()

        const result = await showApiNotification(
            fetch(`/api/tenants/${tenantId}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Device created successfully',
            'Failed to create device',
            'Success',
            'Error'
        )

        if (result.success) {
            setShowCreateForm(false)
            setFormData({ name: '', description: '', device_type: 'sensor', location: '', status: 'active' })
            fetchTenantAndDevices()
        }
    }

    const handleUpdateDevice = async (e) => {
        e.preventDefault()

        const result = await showApiNotification(
            fetch(`/api/devices/${editingDevice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Device updated successfully',
            'Failed to update device',
            'Success',
            'Error'
        )

        if (result.success) {
            setEditingDevice(null)
            setFormData({ name: '', description: '', device_type: 'sensor', location: '', status: 'active' })
            fetchTenantAndDevices()
        }
    }

    const handleDeleteDevice = async (deviceId) => {
        if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            return
        }

        const result = await showApiNotification(
            fetch(`/api/devices/${deviceId}`, {
                method: 'DELETE'
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Device deleted successfully',
            'Failed to delete device',
            'Success',
            'Error'
        )

        if (result.success) {
            fetchTenantAndDevices()
        }
    }

    const startEdit = (device) => {
        setEditingDevice(device)
        setFormData({
            name: device.name || '',
            description: device.description || '',
            device_type: device.device_type || 'sensor',
            location: device.location || '',
            status: device.status || 'active'
        })
    }

    const cancelEdit = () => {
        setEditingDevice(null)
        setFormData({ name: '', description: '', device_type: 'sensor', location: '', status: 'active' })
    }

    if (isLoading) {
        return (
            <div className="admin-devices">
                <div className="loading">Loading admin panel...</div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-devices">
                <div className="access-denied">
                    <Cpu size={48} />
                    <h2>Access Denied</h2>
                    <p>You need admin privileges to access this page.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-devices">
            <div className="admin-header">
                <div className="header-top">
                    <Link to="/admin/tenants" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Tenants
                    </Link>
                </div>
                <div className="admin-title">
                    <Cpu size={32} />
                    <div>
                        <h1>Device Management</h1>
                        {tenant && (
                            <p className="tenant-info">
                                <Building size={16} />
                                {tenant.name}
                            </p>
                        )}
                    </div>
                </div>
                <p className="admin-subtitle">Manage devices for this tenant</p>
            </div>

            <div className="admin-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                >
                    <Plus size={20} />
                    Add Device
                </button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingDevice) && (
                <div className="form-overlay">
                    <div className="form-card">
                        <h2>{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
                        <form onSubmit={editingDevice ? handleUpdateDevice : handleCreateDevice}>
                            <div className="form-group">
                                <label htmlFor="name">Device Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="device_type">Device Type</label>
                                <select
                                    id="device_type"
                                    value={formData.device_type}
                                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                                >
                                    <option value="sensor">Sensor</option>
                                    <option value="actuator">Actuator</option>
                                    <option value="gateway">Gateway</option>
                                    <option value="controller">Controller</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    type="text"
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={editingDevice ? cancelEdit : () => setShowCreateForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDevice ? 'Update Device' : 'Add Device'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Devices List */}
            {loading ? (
                <div className="loading">Loading devices...</div>
            ) : (
                <div className="devices-grid">
                    {devices.map((device) => (
                        <div key={device.id} className="device-card">
                            <div className="device-header">
                                <div className="device-info">
                                    <h3>{device.name}</h3>
                                    <span className={`status-badge ${device.status}`}>
                                        {device.status}
                                    </span>
                                </div>
                                <div className="device-actions">
                                    <Link
                                        to={`/admin/tenants/${tenantId}/devices/${device.id}/scheduled-tasks`}
                                        className="btn-icon"
                                        title="View Scheduled Tasks"
                                    >
                                        <Clock size={16} />
                                    </Link>
                                    <Link
                                        to={`/portal/${tenantId}`}
                                        className="btn-icon"
                                        title="View Device Portal"
                                    >
                                        <Eye size={16} />
                                    </Link>
                                    <button
                                        className="btn-icon"
                                        onClick={() => startEdit(device)}
                                        title="Edit Device"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDeleteDevice(device.id)}
                                        title="Delete Device"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="device-details">
                                {device.description && (
                                    <p className="device-description">{device.description}</p>
                                )}
                                {device.location && (
                                    <p className="device-location">
                                        <strong>Location:</strong> {device.location}
                                    </p>
                                )}
                                <p className="device-type">
                                    <strong>Type:</strong> {device.device_type}
                                </p>
                            </div>

                            <div className="device-stats">
                                <div className="stat">
                                    <Clock size={16} />
                                    <span>Tasks: {device.scheduled_task_count || 0}</span>
                                </div>
                                <div className="stat">
                                    <Activity size={16} />
                                    <span>Last Seen: {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {devices.length === 0 && (
                        <div className="empty-state">
                            <Cpu size={48} />
                            <h3>No Devices Found</h3>
                            <p>Add your first device to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdminDevices
