export default function ModelSelector({ sttEngine, ttsEngine, onSttChange, onTtsChange }) {
  return (
    <div className="model-selector">
      <label>
        STT Engine:
        <select value={sttEngine} onChange={e => onSttChange(e.target.value)}>
          <option value="vosk">Vosk (rápido, ~40MB)</option>
          <option value="whisper">Whisper tiny (preciso, ~75MB)</option>
        </select>
      </label>

      <label>
        TTS Engine:
        <select value={ttsEngine} onChange={e => onTtsChange(e.target.value)}>
          <option value="android">Android TTS (built-in)</option>
          <option value="piper">Piper TTS (~100MB, mejor calidad)</option>
        </select>
      </label>
    </div>
  )
}
