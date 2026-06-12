// IconButton — square icon button with accessible label. Shared UI atom.
export default function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`nexora-icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
