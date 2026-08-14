import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'

export default function AccessLogs() {
  const [logs, setLogs] = useState(null)
  const [error, setError] = useState(null)
  const [limit, setLimit] = useState('100')

  async function load() {
    setError(null)
    try {
      const data = await api.access.logs.list({ limit })
      setLogs(data.result || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [limit]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Access Logs</h1>
          <div className="desc">Nhật ký xác thực — ai đăng nhập app nào, khi nào, allow hay deny</div>
        </div>
        <div className="toolbar">
          <select value={limit} onChange={(e) => setLimit(e.target.value)}>
            <option value="50">50 dòng gần nhất</option>
            <option value="100">100 dòng gần nhất</option>
            <option value="500">500 dòng gần nhất</option>
          </select>
          <button className="btn" onClick={load}>Làm mới</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Ứng dụng</th>
              <th>Kết quả</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {!logs && <tr className="loading-row"><td colSpan={5}>Đang tải…</td></tr>}
            {logs?.length === 0 && <tr><td colSpan={5}><div className="empty-state">Không có log trong khoảng thời gian này.</div></td></tr>}
            {logs?.map((log, i) => (
              <tr key={log.id || i}>
                <td className="dim mono">{log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '—'}</td>
                <td className="mono">{log.email || '—'}</td>
                <td>{log.app_name || log.app_uid || '—'}</td>
                <td><Badge>{log.allowed === false ? 'deny' : 'allow'}</Badge></td>
                <td className="mono dim">{log.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
