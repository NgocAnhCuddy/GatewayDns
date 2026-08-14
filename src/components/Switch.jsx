export default function Switch({ checked, onChange, disabled, label }) {
  return (
    <span className="switch-row">
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="track" />
        <span className="thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </span>
  )
}
