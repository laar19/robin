import { useEffect, useState } from 'react'
import { getModel } from '../services/apiStorageService'
import { WHISPER_MODELS } from '../services/whisperApiService'

export default function ModelSelector({ sttEngine, ttsEngine, onSttChange, onTtsChange, onWhisperModelChange }) {
  const [whisperModel, setWhisperModel] = useState('whisper-large-v3')

  useEffect(() => {
    getModel().then(setWhisperModel)
  }, [])

  useEffect(() => {
    onWhisperModelChange?.(whisperModel)
  }, [whisperModel])

  return (
    <div className="model-selector">
      <label>
        STT Engine:
        <select value={sttEngine} onChange={e => onSttChange(e.target.value)}>
          <option value="vosk">Vosk (rápido, ~40MB)</option>
          <option value="whisper">Whisper tiny (preciso, ~75MB)</option>
          <option value="whisper-api">Whisper API (cloud, requiere API Key)</option>
        </select>
      </label>

      {sttEngine === 'whisper-api' && (
        <label className="whisper-model-selector">
          Modelo Whisper:
          <select value={whisperModel} onChange={e => setWhisperModel(e.target.value)}>
            {WHISPER_MODELS.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      )}

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
