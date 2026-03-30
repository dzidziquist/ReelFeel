export default function EmotionPicker({ emotions, selected, onChange }) {
  function toggle(id) {
    onChange(
      selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map(e => {
        const active = selected.includes(e.id)
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => toggle(e.id)}
            className="text-sm px-3 py-1 rounded-full border transition-all duration-150 select-none font-medium"
            style={{
              borderColor: active ? e.color : e.color + '55',
              color: active ? e.color : e.color + 'aa',
              backgroundColor: active ? e.color + '33' : 'transparent',
            }}
          >
            {e.icon} {e.name}
          </button>
        )
      })}
    </div>
  )
}
