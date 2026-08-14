import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Switch from './Switch'
import { SELECTORS, OPERATORS, buildExpression, parseExpression } from '../lib/wirefilter'

const ACTIONS = ['allow', 'block', 'isolate', 'noop', 'safesearch', 'ytrestricted', 'l4_override']
const FILTER_TYPES = [
  { value: 'dns', label: 'DNS' },
  { value: 'http', label: 'HTTP' },
  { value: 'l4', label: 'Network (L4)' },
]

function emptyCondition() {
  return { selector: 'content_category', operator: 'in', values: [] }
}

export default function GatewayPolicyForm({ initial, onSubmit, onCancel, submitting }) {
  const [name, setName] = useState(initial?.name || '')
  const [action, setAction] = useState(initial?.action || 'block')
  const [filterType, setFilterType] = useState(initial?.filters?.[0] || 'dns')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [error, setError] = useState(null)

  // Visual Builder chỉ áp dụng cho DNS (đúng phạm vi đã thống nhất).
  // HTTP / Network luôn dùng tab Wirefilter thô.
  const supportsBuilder = filterType === 'dns'
  const initialParsed = initial?.traffic ? parseExpression(initial.traffic) : null
  const [mode, setMode] = useState(
    supportsBuilder && initialParsed && !initialParsed.unrecognized && initialParsed.conditions.length ? 'builder' : 'raw'
  )

  const [conditions, setConditions] = useState(
    initialParsed && !initialParsed.unrecognized && initialParsed.conditions.length ? initialParsed.conditions : [emptyCondition()]
  )
  const [joiner, setJoiner] = useState(initialParsed?.joiner || 'and')
  const [rawExpression, setRawExpression] = useState(initial?.traffic || '')

  const [categories, setCategories] = useState(null)
  const [appTypes, setAppTypes] = useState(null)
  const [optionsError, setOptionsError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.gateway.categories.list(), api.gateway.appTypes.list()])
      .then(([cats, apps]) => {
        if (cancelled) return
        setCategories(cats.result || [])
        setAppTypes(apps.result || [])
      })
      .catch((err) => { if (!cancelled) setOptionsError(err.message) })
    return () => { cancelled = true }
  }, [])

  function valueOptionsFor(selector) {
    const def = SELECTORS.find((s) => s.value === selector)
    if (!def) return []
    if (def.valueSource === 'appTypes') {
      return (appTypes || []).map((a) => ({ id: String(a.id), name: a.name || a.application_type_id || `#${a.id}` }))
    }
    // /gateway/categories trả về cây 2 tầng: category cha -> subcategories[].
    // ID thực sự dùng trong biểu thức Wirefilter (dns.content_category[*] /
    // dns.security_category[*]) là ID của SUBCATEGORY, không phải cha.
    // Cloudflare không đánh dấu content/security bằng 1 field riêng — phải suy
    // ra từ việc category cha có nằm trong 2 nhóm gốc "Security threats" /
    // "Security Risks" hay không (đối chiếu với ví dụ chính thức của Cloudflare:
    // ID 68/80/83/117/131/134/151/175/176/178 — toàn bộ đều là con của 2 nhóm này).
    const SECURITY_PARENT_NAMES = ['security threats', 'security risks']
    const isSecurityParent = (name) => SECURITY_PARENT_NAMES.includes((name || '').toLowerCase())

    const wantSecurity = def.value === 'security_category'
    const out = []
    for (const parent of categories || []) {
      const parentIsSecurity = isSecurityParent(parent.name)
      if (parentIsSecurity !== wantSecurity) continue
      // Cloudflare cho chọn cả category cha lẫn từng category con — đều là ID
      // riêng biệt, hợp lệ độc lập trong dns.content_category[*] / security_category[*].
      // Giữ đúng thứ tự giống dashboard gốc: cha trước, rồi các con.
      if (!parent.deprecated) out.push({ id: String(parent.id), name: parent.name, isParent: true })
      for (const sub of parent.subcategories || []) {
        if (sub.deprecated) continue
        out.push({ id: String(sub.id), name: sub.name, isParent: false })
      }
    }
    return out
  }

  function updateCondition(idx, patch) {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  function addCondition() {
    setConditions((prev) => [...prev, emptyCondition()])
  }

  function removeCondition(idx) {
    setConditions((prev) => prev.filter((_, i) => i !== idx))
  }

  function toggleValue(idx, id) {
    setConditions((prev) => prev.map((c, i) => {
      if (i !== idx) return c
      const has = c.values.includes(id)
      return { ...c, values: has ? c.values.filter((v) => v !== id) : [...c.values, id] }
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Vui lòng đặt tên cho rule.')
      return
    }

    let traffic
    if (mode === 'builder') {
      const validConditions = conditions.filter((c) => c.values.length)
      if (!validConditions.length) {
        setError('Cần ít nhất 1 điều kiện có giá trị.')
        return
      }
      traffic = buildExpression(validConditions, joiner)
    } else {
      traffic = rawExpression.trim()
      if (!traffic) {
        setError('Vui lòng nhập biểu thức traffic.')
        return
      }
    }

    onSubmit({ name: name.trim(), action, enabled, filters: [filterType], traffic })
  }

  const previewExpression = mode === 'builder'
    ? buildExpression(conditions.filter((c) => c.values.length), joiner)
    : rawExpression

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="gw-name">Tên rule</label>
        <input id="gw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vd: Chặn mạng xã hội giờ làm việc" />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="gw-filter">Loại lọc</label>
          <select
            id="gw-filter"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              if (e.target.value !== 'dns') setMode('raw')
            }}
          >
            {FILTER_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="gw-action">Hành động</label>
          <select id="gw-action" value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Điều kiện traffic</label>

        {supportsBuilder && (
          <div className="tabs" style={{ marginBottom: 12 }}>
            <div className={`tab${mode === 'builder' ? ' active' : ''}`} onClick={() => setMode('builder')}>Visual Builder</div>
            <div className={`tab${mode === 'raw' ? ' active' : ''}`} onClick={() => setMode('raw')}>Wirefilter</div>
          </div>
        )}
        {!supportsBuilder && (
          <div className="hint" style={{ marginBottom: 8 }}>
            Visual Builder hiện chỉ hỗ trợ loại lọc DNS. Với HTTP / Network, nhập biểu thức Wirefilter trực tiếp bên dưới.
          </div>
        )}

        {mode === 'builder' ? (
          <BuilderEditor
            conditions={conditions}
            joiner={joiner}
            setJoiner={setJoiner}
            onUpdate={updateCondition}
            onAdd={addCondition}
            onRemove={removeCondition}
            onToggleValue={toggleValue}
            valueOptionsFor={valueOptionsFor}
            loadingOptions={!categories || !appTypes}
            optionsError={optionsError}
          />
        ) : (
          <textarea
            value={rawExpression}
            onChange={(e) => setRawExpression(e.target.value)}
            placeholder='Vd: any(dns.domains[*] in {"facebook.com" "instagram.com"})'
          />
        )}

        {previewExpression && (
          <div className="mono faint" style={{ marginTop: 8, fontSize: 11.5, wordBreak: 'break-all' }}>
            {previewExpression}
          </div>
        )}
        <div className="hint">Cú pháp Wirefilter của Cloudflare Gateway — xem tài liệu Cloudflare để biết đầy đủ toán tử.</div>
      </div>

      <div className="field">
        <Switch checked={enabled} onChange={setEnabled} label="Bật rule ngay sau khi lưu" />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Tạo rule'}
        </button>
      </div>
    </form>
  )
}

function BuilderEditor({ conditions, joiner, setJoiner, onUpdate, onAdd, onRemove, onToggleValue, valueOptionsFor, loadingOptions, optionsError }) {
  return (
    <div>
      {optionsError && <div className="error-banner">Không tải được danh sách category/application: {optionsError}</div>}

      {conditions.map((cond, idx) => {
        const op = OPERATORS.find((o) => o.value === cond.operator)
        const options = valueOptionsFor(cond.selector)
        const isMulti = op?.arrayForm

        return (
          <div key={idx} className="panel" style={{ padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                value={cond.selector}
                onChange={(e) => onUpdate(idx, { selector: e.target.value, values: [] })}
                style={{ flex: 1 }}
              >
                {SELECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select
                value={cond.operator}
                onChange={(e) => onUpdate(idx, { operator: e.target.value, values: [] })}
                style={{ flex: '0 0 150px' }}
              >
                {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button type="button" className="btn btn-ghost" onClick={() => onRemove(idx)} disabled={conditions.length === 1}>✕</button>
            </div>

            {loadingOptions ? (
              <div className="faint" style={{ fontSize: 12.5 }}>Đang tải danh sách giá trị…</div>
            ) : (
              <ValuePicker
                options={options}
                selected={cond.values}
                multi={isMulti}
                onToggle={(id) => onToggleValue(idx, id)}
                onSetSingle={(id) => onUpdate(idx, { values: id ? [id] : [] })}
              />
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-ghost" onClick={onAdd}>+ Thêm điều kiện</button>
        {conditions.length > 1 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-dim)' }}>
            Ghép bằng
            <select value={joiner} onChange={(e) => setJoiner(e.target.value)} style={{ width: 'auto', padding: '4px 8px' }}>
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          </label>
        )}
      </div>
    </div>
  )
}

function ValuePicker({ options, selected, multi, onToggle, onSetSingle }) {
  const [query, setQuery] = useState('')
  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options

  if (multi) {
    return (
      <div>
        <input
          placeholder="Tìm kiếm…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 6 }}
        />
        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-soft)', borderRadius: 4 }}>
          {filtered.length === 0 && <div className="faint" style={{ padding: 8, fontSize: 12.5 }}>Không tìm thấy.</div>}
          {filtered.map((o) => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} style={{ width: 'auto' }} />
              <span style={{ fontWeight: o.isParent ? 600 : 400 }}>{o.name}</span>
              {o.isParent
                ? <span className="faint" style={{ fontSize: 10.5 }}>(nhóm, id {o.id})</span>
                : <span className="faint" style={{ fontSize: 10.5 }}>id {o.id}</span>}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{selected.length} đã chọn</div>
        )}
      </div>
    )
  }

  return (
    <select value={selected[0] || ''} onChange={(e) => onSetSingle(e.target.value)}>
      <option value="">— chọn giá trị —</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  )
}
