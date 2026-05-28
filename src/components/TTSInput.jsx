import { useState } from 'react'

export default function TTSInput({ onSpeak }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSpeak(text)
  }

  return (
    <form onSubmit={handleSubmit} className="tts-form">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Escribe el texto a convertir en voz..."
        rows={3}
      />
      <button type="submit" className="speak-button">
        🔊 Escuchar
      </button>
    </form>
  )
}
