import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Activity, Building, Cpu, Radio } from 'lucide-react'
import TenantList from './components/TenantList'
import TenantDevices from './components/TenantDevices'
import TenantPortal from './components/TenantPortal'
import DeviceMessagesLive from './components/DeviceMessagesLive'
import UserInfo from './components/UserInfo'
import { NotificationProvider } from './components/NotificationSystem'
import './App.css'

function App() {
  const location = useLocation()
  const isPortalPage = location.pathname.startsWith('/portal/')

  return (
    <NotificationProvider>
      <div className="app">
        {!isPortalPage && (
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
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
                </nav>
              </div>
              <UserInfo />
            </div>
          </header>
        )}

        <main className={`main-content ${isPortalPage ? 'portal-main' : ''}`}>
          <Routes>
            <Route path="/" element={<TenantList />} />
            <Route path="/tenants/:tenantId/devices" element={<TenantDevices />} />
            <Route path="/portal/:tenantId" element={<TenantPortal />} />
            <Route path="/live-messages" element={<DeviceMessagesLive />} />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  )
}

export default App
