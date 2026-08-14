import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessPolicyForm from '../components/AccessPolicyForm'

export default function AccessPolicies() {
  const [policies, setPolicies] = useState(null)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'create' | policy object (edit) | { deleteId }
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setError(null)
    try {
      const data = await api.access.policies.list()
      setPolicies(data.result || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(body) {
    setSubmitting(true)
    try {
      await api.access.policies.create(body)
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
      await api.access.policies.update(id, body)
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
      await api.access.policies.remove(id)
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const editing = modal && typeof modal === 'object' && modal.id ? modal : null
  const deleting = modal && typeof modal === 'object' && modal.deleteId ? modal : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Access Policies</h1>
          <div className="desc">Chính sách quyết định ai được vào ứng dụng nào</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Tạo policy</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Quyết định</th>
              <th>Điều kiện</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!policies && (
              <tr className="loading-row"><td colSpan={4}>Đang tải…</td></tr>
            )}
            {policies?.length === 0 && (
              <tr><td colSpan={4}><div className="empty-state">Chưa có policy nào. Tạo policy đầu tiên để bắt đầu kiểm soát truy cập.</div></td></tr>
            )}
            {policies?.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><Badge>{p.decision}</Badge></td>
                <td className="dim">{summarizeInclude(p.include)}</td>
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
          title={editing ? `Sửa: ${editing.name}` : 'Tạo Access Policy'}
          description={editing ? `ID: ${editing.id}` : 'Định nghĩa ai được phép hoặc bị chặn'}
          onClose={() => setModal(null)}
        >
          <AccessPolicyForm
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
              {submitting ? 'Đang xóa…' : 'Xóa policy'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function summarizeInclude(include = []) {
  if (!include.length) return '—'
  return include.map((rule) => {
    const key = Object.keys(rule)[0]
    if (key === 'everyone') return 'Tất cả mọi người'
    const val = Object.values(rule[key] || {})[0]
    return `${key}: ${val}`
  }).join(', ')
}
