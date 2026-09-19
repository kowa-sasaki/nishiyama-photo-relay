import { useState, type KeyboardEvent } from 'react'
import './TagInput.css'

export const TAG_SUGGESTIONS = [
  '桜', 'つつじ', '新緑', '紅葉', '雪', '花', '鳥', '混雑', '静か', '夕日', '夜',
]

export function TagInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function toggleSuggestion(tag: string) {
    if (value.includes(tag)) {
      removeTag(tag)
    } else {
      addTag(tag)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addTag(draft)
    setDraft('')
  }

  function handleAddClick() {
    addTag(draft)
    setDraft('')
  }

  return (
    <div className="tag-input">
      <div role="group" aria-label="タグ候補" className="tag-input__suggestions">
        {TAG_SUGGESTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={value.includes(tag)}
            className="tag-input__chip"
            onClick={() => toggleSuggestion(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="tag-input__draft-row">
        <label className="tag-input__draft-label">
          タグを追加
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className="tag-input__draft-input"
          />
        </label>
        <button type="button" className="tag-input__add-button" onClick={handleAddClick}>
          追加
        </button>
      </div>
      <ul className="tag-input__selected">
        {value.map((tag) => (
          <li key={tag} className="tag-input__selected-chip">
            {tag}
            <button type="button" aria-label={`${tag}を削除`} onClick={() => removeTag(tag)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
