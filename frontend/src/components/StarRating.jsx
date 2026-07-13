export function StarDisplay({ rating, size = 'sm' }) {
  const cls = size === 'lg' ? 'text-2xl' : 'text-base'
  return (
    <span className="inline-flex gap-px">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`${cls} ${rating >= i ? 'text-gold' : rating >= i - 0.5 ? 'text-gold opacity-50' : 'text-[#2a2a2a]'}`}>★</span>
      ))}
    </span>
  )
}

export function StarPicker({ value, onChange }) {
  function handleClick(i) {
    onChange(value === i ? i - 0.5 : i)
  }

  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          className={`text-3xl leading-none transition-colors ${
            value >= i ? 'text-gold' : value >= i - 0.5 ? 'text-gold opacity-50' : 'text-[#2a2a2a] hover:text-gold'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
