import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Activity, Building, Cpu, Radio, Bell } from 'lucide-react'
import TenantList from './components/TenantList'
import TenantDevices from './components/TenantDevices'
import TenantPortal from './components/TenantPortal'
import DeviceMessagesLive from './components/DeviceMessagesLive'
import NotificationDemo from './components/NotificationDemo'
import { NotificationProvider } from './components/NotificationSystem'
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
              <Link to="/live-messages" className="nav-link">
                <Radio size={20} />
                Live Messages
              </Link>
              <Link to="/notifications-demo" className="nav-link">
                <Bell size={20} />
                Notifications Demo
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
          <Route path="/live-messages" element={<DeviceMessagesLive />} />
          <Route path="/notifications-demo" element={<NotificationDemo />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AppContent />
      </Router>
    </NotificationProvider>
  )
}

export default App
