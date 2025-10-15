import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, Plus, Edit, Trash2, Eye, ArrowLeft, Users, Cpu } from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin'
import { useNotification } from '../../hooks/useNotification'
import './AdminTenants.css'

const AdminTenants = () => {
    const { isAdmin, isLoading } = useAdmin()
    const { showSuccess, showError, showApiNotification } = useNotification()
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingTenant, setEditingTenant] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contact_email: '',
        status: 'active'
    })

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            showError('Access denied. Admin privileges required.', 'Unauthorized')
            return
        }

        if (isAdmin) {
            fetchTenants()
        }
    }, [isAdmin, isLoading])

    const fetchTenants = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/tenants')

            if (response.ok) {
                const data = await response.json()
                setTenants(data)
            } else {
                throw new Error(`HTTP ${response.status}`)
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error)
            showError('Failed to load tenants', 'Error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTenant = async (e) => {
        e.preventDefault()

        const result = await showApiNotification(
            fetch('/api/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Tenant created successfully',
            'Failed to create tenant',
            'Success',
            'Error'
        )

        if (result.success) {
            setShowCreateForm(false)
            setFormData({ name: '', description: '', contact_email: '', status: 'active' })
            fetchTenants()
        }
    }

    const handleUpdateTenant = async (e) => {
        e.preventDefault()

        const result = await showApiNotification(
            fetch(`/api/tenants/${editingTenant.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Tenant updated successfully',
            'Failed to update tenant',
            'Success',
            'Error'
        )

        if (result.success) {
            setEditingTenant(null)
            setFormData({ name: '', description: '', contact_email: '', status: 'active' })
            fetchTenants()
        }
    }

    const handleDeleteTenant = async (tenantId) => {
        if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
            return
        }

        const result = await showApiNotification(
            fetch(`/api/tenants/${tenantId}`, {
                method: 'DELETE'
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            }),
            'Tenant deleted successfully',
            'Failed to delete tenant',
            'Success',
            'Error'
        )

        if (result.success) {
            fetchTenants()
        }
    }

    const startEdit = (tenant) => {
        setEditingTenant(tenant)
        setFormData({
            name: tenant.name || '',
            description: tenant.description || '',
            contact_email: tenant.contact_email || '',
            status: tenant.status || 'active'
        })
    }

    const cancelEdit = () => {
        setEditingTenant(null)
        setFormData({ name: '', description: '', contact_email: '', status: 'active' })
    }

    if (isLoading) {
        return (
            <div className="admin-tenants">
                <div className="loading">Loading admin panel...</div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-tenants">
                <div className="access-denied">
                    <Building size={48} />
                    <h2>Access Denied</h2>
                    <p>You need admin privileges to access this page.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-tenants">
            <div className="admin-header">
                <div className="header-top">
                    <Link to="/admin" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Link>
                </div>
                <div className="admin-title">
                    <Building size={32} />
                    <h1>Tenant Management</h1>
                </div>
                <p className="admin-subtitle">Manage all tenant organizations in the system</p>
            </div>

            <div className="admin-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                >
                    <Plus size={20} />
                    Create Tenant
                </button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingTenant) && (
                <div className="form-overlay">
                    <div className="form-card">
                        <h2>{editingTenant ? 'Edit Tenant' : 'Create New Tenant'}</h2>
                        <form onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant}>
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
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
                                <label htmlFor="contact_email">Contact Email</label>
                                <input
                                    type="email"
                                    id="contact_email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
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
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={editingTenant ? cancelEdit : () => setShowCreateForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTenant ? 'Update Tenant' : 'Create Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tenants List */}
            {loading ? (
                <div className="loading">Loading tenants...</div>
            ) : (
                <div className="tenants-grid">
                    {tenants.map((tenant) => (
                        <div key={tenant.id} className="tenant-card">
                            <div className="tenant-header">
                                <div className="tenant-info">
                                    <h3>{tenant.name}</h3>
                                    <span className={`status-badge ${tenant.status}`}>
                                        {tenant.status}
                                    </span>
                                </div>
                                <div className="tenant-actions">
                                    <Link
                                        to={`/admin/tenants/${tenant.id}/devices`}
                                        className="btn-icon"
                                        title="View Devices"
                                    >
                                        <Eye size={16} />
                                    </Link>
                                    <button
                                        className="btn-icon"
                                        onClick={() => startEdit(tenant)}
                                        title="Edit Tenant"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDeleteTenant(tenant.id)}
                                        title="Delete Tenant"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="tenant-details">
                                {tenant.description && (
                                    <p className="tenant-description">{tenant.description}</p>
                                )}
                                {tenant.contact_email && (
                                    <p className="tenant-contact">
                                        <strong>Contact:</strong> {tenant.contact_email}
                                    </p>
                                )}
                            </div>

                            <div className="tenant-stats">
                                <div className="stat">
                                    <Users size={16} />
                                    <span>Devices: {tenant.device_count || 0}</span>
                                </div>
                                <div className="stat">
                                    <Cpu size={16} />
                                    <span>Tasks: {tenant.task_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {tenants.length === 0 && (
                        <div className="empty-state">
                            <Building size={48} />
                            <h3>No Tenants Found</h3>
                            <p>Create your first tenant to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdminTenants
