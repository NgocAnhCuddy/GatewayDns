import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AccessPolicies from './pages/AccessPolicies'
import AccessUsers from './pages/AccessUsers'
import Devices from './pages/Devices'
import AccessLogs from './pages/AccessLogs'
import GatewayPolicies from './pages/GatewayPolicies'
import GatewayLogs from './pages/GatewayLogs'
import { useTheme } from './lib/useTheme'

export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="shell">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/access/policies" element={<AccessPolicies />} />
          <Route path="/access/users" element={<AccessUsers />} />
          <Route path="/access/devices" element={<Devices />} />
          <Route path="/access/logs" element={<AccessLogs />} />
          <Route path="/gateway/policies" element={<GatewayPolicies />} />
          <Route path="/gateway/logs" element={<GatewayLogs />} />
        </Routes>
      </main>
    </div>
  )
}
