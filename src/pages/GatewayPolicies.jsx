import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Switch from '../components/Switch'
import GatewayPolicyForm from '../components/GatewayPolicyForm'

// Cắt bớt biểu thức traffic dài (vd: danh sách hàng trăm domain trong
// "any(dns.domains[*] in {...})") để bảng không bị vỡ layout.
// Người dùng có thể bấm "xem đầy đủ" để xổ ra khi cần.
const TRAFFIC_PREVIEW_LENGTH = 90

function TrafficExpression({ expression }) {
  const [expanded, setExpanded] = useState(false)
  if (!expression) return null

  const isLong = expression.length > TRAFFIC_PREVIEW_LENGTH
  const shown = expanded || !isLong ? expression : expression.slice(0, TRAFFIC_PREVIEW_LENGTH) + '…'

  return (
    <div className="mono faint" style={{ marginTop: 3, maxWidth: 420 }}>
      <span style={{ wordBreak: expanded ? 'break-all' : 'normal', whiteSpace: expanded ? 'pre-wrap' : 'nowrap', display: 'inline-block', overflow: expanded ? 'visible' : 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', verticalAlign: 'bottom' }}>
        {shown}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 11.5, marginLeft: 6, padding: 0, fontFamily: 'var(--sans)' }}
        >
          {expanded ? 'thu gọn' : 'xem đầy đủ'}
        </button>
      )}
    </div>
  )
}

export default function GatewayPolicies() {
  const [policies, setPolicies] = useState(null)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setError(null)
    try {
      const data = await api.gateway.policies.list()
      setPolicies(data.result || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(body) {
    setSubmitting(true)
    try {
      await api.gateway.policies.create(body)
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id, body) {
    setSubmitting(true)
    try {
      await api.gateway.policies.update(id, body)
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setSubmitting(true)
    try {
      await api.gateway.policies.remove(id)
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleEnabled(policy) {
    setError(null)
    try {
      await api.gateway.policies.update(policy.id, { ...policy, enabled: !policy.enabled })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const editing = modal && typeof modal === 'object' && modal.id ? modal : null
  const deleting = modal && typeof modal === 'object' && modal.deleteId ? modal : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gateway Policies</h1>
          <div className="desc">Rule lọc DNS / HTTP / Network traffic</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Tạo rule</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Loại</th>
              <th>Hành động</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!policies && (
              <tr className="loading-row"><td colSpan={5}>Đang tải…</td></tr>
            )}
            {policies?.length === 0 && (
              <tr><td colSpan={5}><div className="empty-state">Chưa có rule nào.</div></td></tr>
            )}
            {policies?.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name}
                  <TrafficExpression expression={p.traffic} />
                </td>
                <td className="dim">{(p.filters || []).join(', ')}</td>
                <td><Badge>{p.action}</Badge></td>
                <td>
                  <Switch checked={p.enabled} onChange={() => toggleEnabled(p)} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setModal(p)}>Sửa</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setModal({ deleteId: p.id, name: p.name })}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === 'create' || editing) && (
        <Modal
          title={editing ? `Sửa: ${editing.name}` : 'Tạo Gateway Rule'}
          description={editing ? `ID: ${editing.id}` : 'Định nghĩa rule lọc traffic mới'}
          onClose={() => setModal(null)}
        >
          <GatewayPolicyForm
            initial={editing}
            submitting={submitting}
            onCancel={() => setModal(null)}
            onSubmit={(body) => editing ? handleUpdate(editing.id, body) : handleCreate(body)}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title={`Xóa "${deleting.name}"?`} description="Hành động này không thể hoàn tác." onClose={() => setModal(null)}>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button>
            <button className="btn btn-danger" disabled={submitting} onClick={() => handleDelete(deleting.deleteId)}>
              {submitting ? 'Đang xóa…' : 'Xóa rule'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
