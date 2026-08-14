import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

export default function Sidebar({ theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div>
          <div className="mark">⛨ zt-console</div>
          <div className="sub">Cloudflare Zero Trust</div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="nav-group">
        <div className="nav-label">Tổng quan</div>
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
      </div>

      <div className="nav-group">
        <div className="nav-label">Access</div>
        <NavLink to="/access/policies" className={linkClass}>Policies</NavLink>
        <NavLink to="/access/users" className={linkClass}>Users</NavLink>
        <NavLink to="/access/devices" className={linkClass}>Devices</NavLink>
        <NavLink to="/access/logs" className={linkClass}>Access Logs</NavLink>
      </div>

      <div className="nav-group">
        <div className="nav-label">Gateway</div>
        <NavLink to="/gateway/policies" className={linkClass}>Policies</NavLink>
        <NavLink to="/gateway/logs" className={linkClass}>Gateway Logs</NavLink>
      </div>
    </aside>
  )
}
