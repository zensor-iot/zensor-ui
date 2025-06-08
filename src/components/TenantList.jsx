import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, Users, ChevronRight, Loader2 } from 'lucide-react'

const TenantList = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/v1/tenants')
      if (!response.ok) {
        throw new Error(`Failed to fetch tenants: ${response.statusText}`)
      }
      const data = await response.json()
      setTenants(data.tenants || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="loading-spinner" />
        <p>Loading tenants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={fetchTenants} className="retry-button">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="tenant-list">
      <div className="page-header">
        <h2>
          <Building className="page-icon" />
          Tenant Management
        </h2>
        <p className="page-description">
          Manage your tenants and their IoT device fleets
        </p>
      </div>

      {tenants.length === 0 ? (
        <div className="empty-state">
          <Users size={64} className="empty-icon" />
          <h3>No tenants found</h3>
          <p>Create your first tenant to get started</p>
        </div>
      ) : (
        <div className="tenant-grid">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              to={`/tenants/${tenant.id}/devices`}
              className="tenant-card"
            >
              <div className="tenant-card-header">
                <div className="tenant-info">
                  <h3 className="tenant-name">{tenant.name}</h3>
                  <p className="tenant-email">{tenant.email}</p>
                </div>
                <div className="tenant-status">
                  <span className={`status-badge ${tenant.is_active ? 'active' : 'inactive'}`}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {tenant.description && (
                <p className="tenant-description">{tenant.description}</p>
              )}
              
              <div className="tenant-card-footer">
                <div className="tenant-meta">
                  <span className="meta-item">
                    Created: {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </div>
                <ChevronRight className="nav-arrow" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default TenantList 