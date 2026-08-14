export default function Modal({ title, description, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        {description && <div className="modal-desc">{description}</div>}
        {children}
      </div>
    </div>
  )
}
