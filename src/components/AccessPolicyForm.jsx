import { useState } from 'react'

const DECISIONS = ['allow', 'deny', 'non_identity', 'bypass']

// Access Policy "include" rules dùng schema dạng { <loại>: {...tham số} }.
// Ta chỉ hỗ trợ các loại phổ biến nhất qua UI; loại nâng cao vẫn có thể
// chỉnh trực tiếp bằng JSON raw editor bên dưới.
const RULE_TYPES = [
  { value: 'email', label: 'Email cụ thể', paramKey: 'email', paramLabel: 'Địa chỉ email', paramField: 'email' },
  { value: 'email_domain', label: 'Tên miền email', paramKey: 'email_domain', paramLabel: 'Domain (vd: company.com)', paramField: 'domain' },
  { value: 'ip', label: 'Dải IP', paramKey: 'ip', paramLabel: 'CIDR (vd: 203.0.113.0/24)', paramField: 'ip' },
  { value: 'everyone', label: 'Tất cả mọi người', paramKey: 'everyone', paramLabel: null },
]

function emptyRule() {
  return { type: 'email', value: '' }
}

function rulesToApiFormat(rules) {
  return rules
    .filter((r) => r.type === 'everyone' || r.value.trim())
    .map((r) => {
      const def = RULE_TYPES.find((t) => t.value === r.type)
      if (r.type === 'everyone') return { everyone: {} }
      return { [def.paramKey]: { [def.paramField]: r.value.trim() } }
    })
}

function apiFormatToRules(includeArr = []) {
  if (!includeArr.length) return [emptyRule()]
  return includeArr.map((item) => {
    const key = Object.keys(item)[0]
    const def = RULE_TYPES.find((t) => t.value === key)
    if (!def) return { type: 'email', value: '', raw: item }
    if (key === 'everyone') return { type: 'everyone', value: '' }
    return { type: key, value: item[key]?.[def.paramField] || '' }
  })
}

export default function AccessPolicyForm({ initial, onSubmit, onCancel, submitting }) {
  const [name, setName] = useState(initial?.name || '')
  const [decision, setDecision] = useState(initial?.decision || 'allow')
  const [rules, setRules] = useState(apiFormatToRules(initial?.include))
  const [error, setError] = useState(null)

  function updateRule(idx, patch) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function addRule() {
    setRules((prev) => [...prev, emptyRule()])
  }

  function removeRule(idx) {
    setRules((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Vui lòng đặt tên cho policy.')
      return
    }
    const include = rulesToApiFormat(rules)
    if (!include.length) {
      setError('Cần ít nhất 1 điều kiện "include" (ai được áp dụng policy này).')
      return
    }

    onSubmit({ name: name.trim(), decision, include })
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="policy-name">Tên policy</label>
        <input
          id="policy-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vd: Cho phép team Engineering"
        />
      </div>

      <div className="field">
        <label htmlFor="policy-decision">Hành động</label>
        <select id="policy-decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
          {DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="hint">allow: cho vào · deny: chặn · bypass: bỏ qua xác thực · non_identity: áp dụng cho traffic không có identity</div>
      </div>

      <div className="field">
        <label>Điều kiện áp dụng (include)</label>
        {rules.map((rule, idx) => {
          const def = RULE_TYPES.find((t) => t.value === rule.type)
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                value={rule.type}
                onChange={(e) => updateRule(idx, { type: e.target.value, value: '' })}
                style={{ flex: '0 0 170px' }}
              >
                {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {def?.paramField ? (
                <input
                  value={rule.value}
                  onChange={(e) => updateRule(idx, { value: e.target.value })}
                  placeholder={def.paramLabel}
                  style={{ flex: 1 }}
                />
              ) : (
                <div className="faint" style={{ flex: 1, alignSelf: 'center', fontSize: 12.5 }}>
                  Áp dụng cho mọi người, không cần giá trị
                </div>
              )}
              <button type="button" className="btn btn-ghost" onClick={() => removeRule(idx)} disabled={rules.length === 1}>✕</button>
            </div>
          )
        })}
        <button type="button" className="btn btn-ghost" onClick={addRule}>+ Thêm điều kiện</button>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Tạo policy'}
        </button>
      </div>
    </form>
  )
}
