import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Activity, Building, Cpu } from 'lucide-react'
import TenantList from './components/TenantList'
import TenantDevices from './components/TenantDevices'
import TenantPortal from './components/TenantPortal'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isPortalPage = location.pathname.startsWith('/portal/')

  return (
    <div className="app">
      {!isPortalPage && (
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <Activity className="logo-icon" />
              <h1>Zensor Portal</h1>
            </div>
            <nav className="nav">
              <Link to="/" className="nav-link">
                <Building size={20} />
                Tenants
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={`main-content ${isPortalPage ? 'portal-main' : ''}`}>
        <Routes>
          <Route path="/" element={<TenantList />} />
          <Route path="/tenants/:tenantId/devices" element={<TenantDevices />} />
          <Route path="/portal/:tenantId" element={<TenantPortal />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
