/** Display-only star rating */
export function StarDisplay({ rating, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : 'text-base'
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<span key={i} className={`${sizeClass} text-yellow-400`}>★</span>)
    } else if (rating >= i - 0.5) {
      stars.push(
        <span key={i} className={`${sizeClass}`}
          style={{ background: 'linear-gradient(90deg,#facc15 50%,#4b5563 50%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          ★
        </span>
      )
    } else {
      stars.push(<span key={i} className={`${sizeClass} text-gray-600`}>★</span>)
    }
  }
  return <span className="inline-flex gap-px">{stars}</span>
}

/** Interactive star picker */
export function StarPicker({ value, onChange }) {
  function handleClick(i) {
    // click same whole-star → half star
    const newVal = value === i ? i - 0.5 : i
    onChange(newVal)
  }

  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          onMouseEnter={() => {}}
          className={`text-3xl transition-colors leading-none ${
            value >= i ? 'text-yellow-400' : value >= i - 0.5 ? 'text-yellow-300' : 'text-gray-600 hover:text-yellow-400'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
