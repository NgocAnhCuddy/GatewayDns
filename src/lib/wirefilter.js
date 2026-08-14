// src/lib/wirefilter.js
//
// Chuyển đổi giữa 2 dạng biểu diễn của 1 rule DNS:
//  - "structured": mảng { selector, operator, values } dùng cho Visual Builder
//  - "wirefilter": chuỗi biểu thức text mà Cloudflare Gateway API thực sự lưu (traffic field)
//
// Chỉ hỗ trợ 3 selector: application, content_category, security_category — đúng
// phạm vi đã thống nhất. Field Wirefilter tương ứng bên DNS:
//   - dns.content_category[*]   (dùng chung cho Application & Content Categories,
//                                 vì Application trong DNS policy là 1 dạng category)
//   - dns.security_category[*]

export const SELECTORS = [
  { value: 'application', label: 'Application', field: 'app.type.ids', isArray: true, valueSource: 'appTypes' },
  { value: 'content_category', label: 'Content Categories', field: 'dns.content_category', isArray: true, valueSource: 'contentCategories' },
  { value: 'security_category', label: 'Security Categories', field: 'dns.security_category', isArray: true, valueSource: 'securityCategories' },
]

export const OPERATORS = [
  { value: 'is', label: 'is', wirefilter: '==', arrayForm: false },
  { value: 'is_not', label: 'is not', wirefilter: '!=', arrayForm: false },
  { value: 'in', label: 'in', wirefilter: 'in', arrayForm: true },
  { value: 'not_in', label: 'not in', wirefilter: 'not in', arrayForm: true },
  { value: 'matches', label: 'matches regex', wirefilter: 'matches', arrayForm: false },
  { value: 'contains', label: 'contains', wirefilter: 'contains', arrayForm: false },
]

function formatValue(v) {
  // ID số (category/app type) đi thẳng; chuỗi thì bọc ngoặc kép.
  return /^-?\d+$/.test(String(v)) ? String(v) : `"${String(v).replace(/"/g, '\\"')}"`
}

/** 1 điều kiện structured -> 1 mệnh đề Wirefilter con. */
export function conditionToExpression(cond) {
  const sel = SELECTORS.find((s) => s.value === cond.selector)
  const op = OPERATORS.find((o) => o.value === cond.operator)
  if (!sel || !op || !cond.values?.length) return null

  if (sel.isArray) {
    if (op.arrayForm) {
      // in / not in -> any(field[*] in {v1 v2 ...})  (not in -> phủ định any bằng "not any(...)")
      const set = cond.values.map(formatValue).join(' ')
      const inner = `any(${sel.field}[*] in {${set}})`
      return op.value === 'not_in' ? `not ${inner}` : inner
    }
    // is / is not / contains / matches trên field mảng -> áp cho từng phần tử qua any()
    const value = formatValue(cond.values[0])
    if (op.value === 'matches') return `any(${sel.field}[*] matches ${value})`
    if (op.value === 'contains') return `any(${sel.field}[*] contains ${value})`
    const wf = op.value === 'is_not' ? '!=' : '=='
    return `any(${sel.field}[*] ${wf} ${value})`
  }

  // (dự phòng cho selector không phải mảng, hiện chưa dùng vì cả 3 selector đều isArray)
  const value = formatValue(cond.values[0])
  return `${sel.field} ${op.wirefilter} ${value}`
}

/** Danh sách điều kiện + joiner (and/or) -> 1 chuỗi Wirefilter hoàn chỉnh. */
export function buildExpression(conditions, joiner = 'and') {
  const parts = conditions.map(conditionToExpression).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  return parts.map((p) => `(${p})`).join(joiner === 'or' ? ' or ' : ' and ')
}

/**
 * Cố gắng phân tích ngược 1 chuỗi Wirefilter đã lưu thành structured conditions,
 * để form Sửa có thể tiền điền Visual Builder khi có thể.
 * Nếu không nhận diện được (biểu thức phức tạp / viết tay), trả về null —
 * form sẽ fallback sang tab Wirefilter thô.
 */
export function parseExpression(expr) {
  if (!expr || typeof expr !== 'string') return { conditions: [], joiner: 'and', unrecognized: false }

  const trimmed = expr.trim()

  // Trường hợp đơn giản nhất: chỉ 1 mệnh đề, không có "and"/"or" nối, không
  // có ngoặc bọc ngoài do buildExpression thêm vào (đó chỉ xuất hiện khi có 2+ mệnh đề).
  const single = parseSingle(trimmed)
  if (single) return { conditions: [single], joiner: 'and', unrecognized: false }

  // Từ 2 mệnh đề trở lên: buildExpression luôn bọc "(...)" quanh mỗi phần
  // và nối bằng " and " hoặc " or " — tách theo đúng mẫu đó.
  const joiner = /\)\s+or\s+\(/.test(trimmed) ? 'or' : 'and'
  const splitter = joiner === 'or' ? /\)\s+or\s+\(/ : /\)\s+and\s+\(/
  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
    return { conditions: [], joiner: 'and', unrecognized: true }
  }
  const rawParts = trimmed.slice(1, -1).split(splitter)

  const conditions = []
  for (const raw of rawParts) {
    const cond = parseSingle(raw.trim())
    if (!cond) return { conditions: [], joiner: 'and', unrecognized: true }
    conditions.push(cond)
  }
  return { conditions, joiner, unrecognized: false }
}

function parseSingle(raw) {
  // Field có thể là dns.xxx (DNS selectors) hoặc app.type.ids (Application).
  const FIELD = '(dns\\.\\w+|app\\.type\\.ids)'

  // any(dns.content_category[*] in {17 85 102})  hoặc  any(app.type.ids[*] in {25})
  let m = raw.match(new RegExp(`^any\\(${FIELD}\\[\\*\\] in \\{([^}]*)\\}\\)$`))
  if (m) return finish(m[1], 'in', splitValues(m[2]))

  // not any(dns.security_category[*] in {68 178})
  m = raw.match(new RegExp(`^not any\\(${FIELD}\\[\\*\\] in \\{([^}]*)\\}\\)$`))
  if (m) return finish(m[1], 'not_in', splitValues(m[2]))

  // any(dns.content_category[*] == "17")
  m = raw.match(new RegExp(`^any\\(${FIELD}\\[\\*\\] (==|!=) (.+)\\)$`))
  if (m) return finish(m[1], m[2] === '==' ? 'is' : 'is_not', [unquote(m[3])])

  // any(dns.content_category[*] matches "regex")
  m = raw.match(new RegExp(`^any\\(${FIELD}\\[\\*\\] matches (.+)\\)$`))
  if (m) return finish(m[1], 'matches', [unquote(m[2])])

  // any(dns.content_category[*] contains "x")
  m = raw.match(new RegExp(`^any\\(${FIELD}\\[\\*\\] contains (.+)\\)$`))
  if (m) return finish(m[1], 'contains', [unquote(m[2])])

  return null
}

function finish(field, operator, values) {
  // Application và Content Categories dùng chung field dns.content_category —
  // không thể phân biệt ngược 100%; mặc định gán về content_category, người
  // dùng có thể đổi selector thủ công nếu ý là Application.
  const sel = SELECTORS.find((s) => s.field === field)
  if (!sel) return null
  return { selector: sel.value, operator, values }
}

function splitValues(str) {
  const out = []
  const re = /"((?:[^"\\]|\\.)*)"|(-?\d+)/g
  let m
  while ((m = re.exec(str))) {
    out.push(m[1] !== undefined ? m[1].replace(/\\"/g, '"') : m[2])
  }
  return out
}

function unquote(str) {
  const s = str.trim()
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\"/g, '"')
  return s
}
