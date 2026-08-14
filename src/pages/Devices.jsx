import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'

export default function Devices() {
  const [devices, setDevices] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.access.devices.list()
      .then((data) => setDevices(data.result || []))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Devices</h1>
          <div className="desc">Thiết bị đã đăng ký WARP client</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Thiết bị</th>
              <th>User</th>
              <th>OS</th>
              <th>Trạng thái</th>
              <th>Lần thấy gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {!devices && <tr className="loading-row"><td colSpan={5}>Đang tải…</td></tr>}
            {devices?.length === 0 && <tr><td colSpan={5}><div className="empty-state">Chưa có thiết bị nào đăng ký.</div></td></tr>}
            {devices?.map((d) => (
              <tr key={d.id}>
                <td>{d.name || d.device_type || '—'}</td>
                <td className="mono">{d.user?.email || '—'}</td>
                <td className="dim">{d.os_version ? `${d.device_type || ''} ${d.os_version}` : d.device_type || '—'}</td>
                <td><Badge tone={d.deleted ? 'dim' : 'ok'}>{d.deleted ? 'Đã gỡ' : 'Hoạt động'}</Badge></td>
                <td className="dim">{d.last_seen ? new Date(d.last_seen).toLocaleString('vi-VN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
