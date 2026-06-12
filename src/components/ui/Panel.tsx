// Panel — card surface wrapper. Shared UI atom.
export default function Panel({ children, className = '' }) {
  return (
    <section className={`nexora-card ${className}`}>
      {children}
    </section>
  )
}
