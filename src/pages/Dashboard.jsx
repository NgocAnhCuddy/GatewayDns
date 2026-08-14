import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [accessPolicies, gatewayPolicies, users, devices] = await Promise.all([
          api.access.policies.list(),
          api.gateway.policies.list(),
          api.access.users.list(),
          api.access.devices.list(),
        ])
        if (cancelled) return
        setStats({
          accessPolicies: accessPolicies.result?.length ?? 0,
          gatewayPolicies: gatewayPolicies.result?.length ?? 0,
          users: users.result?.length ?? 0,
          devices: devices.result?.length ?? 0,
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="desc">Tổng quan tài khoản Zero Trust</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <StatCard label="Access Policies" value={stats?.accessPolicies} to="/access/policies" />
        <StatCard label="Gateway Policies" value={stats?.gatewayPolicies} to="/gateway/policies" />
        <StatCard label="Users" value={stats?.users} to="/access/users" />
        <StatCard label="Devices" value={stats?.devices} to="/access/devices" />
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>Lối tắt</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn" to="/access/policies">Quản lý Access Policies</Link>
          <Link className="btn" to="/gateway/policies">Quản lý Gateway Policies</Link>
          <Link className="btn" to="/access/logs">Xem Access Logs</Link>
          <Link className="btn" to="/gateway/logs">Xem Gateway Logs</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, to }) {
  return (
    <Link to={to} className="stat-card" style={{ display: 'block' }}>
      <div className="label">{label}</div>
      <div className="value">{value ?? '—'}</div>
    </Link>
  )
}
