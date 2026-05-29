import { useState, useEffect } from 'react'

const ENGINES = {
  STT: [
    { value: 'vosk', label: 'Vosk', type: 'offline', icon: '📱', desc: 'Rápido, ~40MB' },
    { value: 'whisper', label: 'Whisper tiny', type: 'offline', icon: '📱', desc: 'Preciso, ~75MB' },
    { value: 'whisper-api', label: 'Whisper API', type: 'online', icon: '☁️', desc: 'Cloud, requiere API Key' },
  ],
  TTS: [
    { value: 'android', label: 'Android TTS', type: 'offline', icon: '📱', desc: 'Built-in del sistema' },
    { value: 'piper', label: 'Piper TTS', type: 'offline', icon: '📱', desc: 'Mejor calidad, ~300KB' },
  ],
}

export default function EngineSelector({ 
  type = 'STT', 
  value, 
  onChange, 
  showInfo = true,
  highlightOnline = true,
}) {
  const [selected, setSelected] = useState(value)
  
  const engines = type === 'STT' ? ENGINES.STT : ENGINES.TTS
  
  useEffect(() => {
    setSelected(value)
  }, [value])
  
  function handleSelect(engineValue) {
    setSelected(engineValue)
    onChange?.(engineValue)
  }
  
  function getEngineInfo(engineValue) {
    return engines.find(e => e.value === engineValue)
  }
  
  const selectedEngine = getEngineInfo(selected)
  
  return (
    <div className="engine-selector">
      <div className="engine-options">
        {engines.map(engine => (
          <button
            key={engine.value}
            className={`engine-option ${selected === engine.value ? 'selected' : ''} ${engine.type}`}
            onClick={() => handleSelect(engine.value)}
          >
            <div className="engine-icon">{engine.icon}</div>
            <div className="engine-info">
              <span className="engine-name">{engine.label}</span>
              {showInfo && (
                <span className="engine-desc">{engine.desc}</span>
              )}
            </div>
            {engine.type === 'online' && highlightOnline && (
              <span className="online-badge">☁️</span>
            )}
          </button>
        ))}
      </div>
      
      {selectedEngine && showInfo && (
        <div className={`engine-details ${selectedEngine.type}`}>
          {selectedEngine.type === 'online' ? (
            <>
              <span className="detail-icon">☁️</span>
              <span>Procesamiento en la nube - Requiere internet</span>
            </>
          ) : (
            <>
              <span className="detail-icon">📱</span>
              <span>Procesamiento local - 100% offline</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { ENGINES }
