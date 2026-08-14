import { useEffect, useState } from 'react'
import { api } from '../api/client'

const TABS = [
  { value: 'dns', label: 'DNS' },
  { value: 'http', label: 'HTTP' },
  { value: 'network', label: 'Network' },
]

export default function GatewayLogs() {
  const [tab, setTab] = useState('dns')
  const [hours, setHours] = useState('1')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    setData(null)
    try {
      const res = await api.gateway.logs.list({ type: tab, hours })
      setData(res)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [tab, hours]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gateway Logs</h1>
          <div className="desc">Traffic đã qua Gateway — số lượt theo thời gian, nhóm theo phút</div>
        </div>
        <div className="toolbar">
          <select value={hours} onChange={(e) => setHours(e.target.value)}>
            <option value="1">1 giờ qua</option>
            <option value="6">6 giờ qua</option>
            <option value="24">24 giờ qua</option>
          </select>
          <button className="btn" onClick={load}>Làm mới</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.value} className={`tab${tab === t.value ? ' active' : ''}`} onClick={() => setTab(t.value)}>
            {t.label}
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Số lượt (count)</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <tr className="loading-row"><td colSpan={2}>Đang tải…</td></tr>}
            {data?.rows?.length === 0 && (
              <tr><td colSpan={2}><div className="empty-state">Không có dữ liệu trong khoảng thời gian này.</div></td></tr>
            )}
            {data?.rows?.map((row, i) => (
              <tr key={i}>
                <td className="mono dim">{new Date(row.dimensions.datetime).toLocaleString('vi-VN')}</td>
                <td className="mono">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hint" style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-faint)' }}>
        Dữ liệu tổng hợp qua Cloudflare GraphQL Analytics API, nhóm theo phút. Để xem log chi tiết từng request, cần bật Logpush sang kho lưu trữ ngoài (R2/S3).
      </div>
    </div>
  )
}
