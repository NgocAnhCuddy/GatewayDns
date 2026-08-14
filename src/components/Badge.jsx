const TONE_MAP = {
  allow: 'ok',
  bypass: 'ok',
  success: 'ok',
  deny: 'danger',
  block: 'danger',
  fail: 'danger',
  error: 'danger',
  isolate: 'warn',
  non_identity: 'warn',
  warn: 'warn',
}

export default function Badge({ children, tone }) {
  const resolvedTone = tone || TONE_MAP[String(children).toLowerCase()] || 'dim'
  return <span className={`badge badge-${resolvedTone}`}>{children}</span>
}
