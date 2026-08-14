import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function AccessUsers() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.access.users.list()
      .then((data) => setUsers(data.result || []))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <div className="desc">Người dùng đã từng xác thực qua Cloudflare Access</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Tên</th>
              <th>Lần đăng nhập gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {!users && <tr className="loading-row"><td colSpan={3}>Đang tải…</td></tr>}
            {users?.length === 0 && <tr><td colSpan={3}><div className="empty-state">Chưa có dữ liệu người dùng.</div></td></tr>}
            {users?.map((u) => (
              <tr key={u.id || u.uid || u.email}>
                <td className="mono">{u.email}</td>
                <td>{u.name || '—'}</td>
                <td className="dim">{u.last_seen_at || u.updated_at ? new Date(u.last_seen_at || u.updated_at).toLocaleString('vi-VN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
