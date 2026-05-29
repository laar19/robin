import { useState, useEffect } from 'react'
import { getAllConfig, deleteApiKey } from '../services/apiStorageService'
import { WHISPER_MODELS } from '../services/whisperApiService'

export default function SettingsScreen({ isOpen, onClose, onOpenApiKeyModal }) {
  const [config, setConfig] = useState(null)
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen])

  async function loadConfig() {
    const savedConfig = await getAllConfig()
    setConfig(savedConfig)
  }

  function renderSTTSection() {
    return (
      <div className="settings-section">
        <h3>🎤 STT Engines</h3>
        
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Whisper API</span>
            <span className="item-description">Transcripción en la nube</span>
          </div>
          <div className="settings-item-status">
            {config?.apiKey ? (
              <span className="status-badge status-configured">✓ Configurado</span>
            ) : (
              <span className="status-badge status-not-configured">⚠ Sin configurar</span>
            )}
          </div>
        </div>

        {config?.apiKey && (
          <div className="settings-subitem">
            <p><strong>Modelo:</strong> {WHISPER_MODELS.find(m => m.value === config.model)?.label || config.model}</p>
            <p><strong>Base URL:</strong> {config.baseUrl}</p>
            <button className="btn btn-small btn-secondary" onClick={onOpenApiKeyModal}>
              ✏️ Editar
            </button>
            <button className="btn btn-small btn-danger" onClick={handleDeleteApiKey}>
              🗑️ Eliminar API Key
            </button>
          </div>
        )}

        {!config?.apiKey && (
          <div className="settings-subitem">
            <button className="btn btn-primary btn-small" onClick={onOpenApiKeyModal}>
              ⚙️ Configurar
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderTTSSection() {
    return (
      <div className="settings-section">
        <h3>🔊 TTS Engines</h3>
        
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Android TTS</span>
            <span className="item-description">Motor del sistema</span>
          </div>
          <span className="status-badge status-built-in">✓ Built-in</span>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Piper TTS</span>
            <span className="item-description">es_ES-mls-medium.onnx</span>
          </div>
          <span className="status-badge status-local">✓ Local (~300KB)</span>
        </div>
      </div>
    )
  }

  function renderLanguageSection() {
    const languages = [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
      { code: 'pt', name: 'Português' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
    ]

    return (
      <div className="settings-section">
        <h3>🌐 Idiomas Soportados</h3>
        <div className="language-grid">
          {languages.map(lang => (
            <div key={lang.code} className="language-badge">
              <span className="lang-code">{lang.code.toUpperCase()}</span>
              <span className="lang-name">{lang.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderAppearanceSection() {
    return (
      <div className="settings-section">
        <h3>🎨 Apariencia</h3>
        <div className="settings-item">
          <span className="item-title">Tema</span>
          <span className="item-description">Claro / Oscuro</span>
        </div>
        <p className="settings-help">
          Usa el botón en el header para cambiar entre temas
        </p>
      </div>
    )
  }

  function renderFileSection() {
    const audioFormats = ['MP3', 'WAV', 'OGG', 'M4A', 'FLAC', 'AAC', 'WEBM']
    const videoFormats = ['MP4', 'MKV', 'AVI', 'WEBM', 'MOV', '3GP']

    return (
      <div className="settings-section">
        <h3>📁 Archivos Compartidos</h3>
        
        <div className="formats-list">
          <div className="format-category">
            <span className="format-icon">🎵 Audio</span>
            <div className="format-tags">
              {audioFormats.map(f => (
                <span key={f} className="format-tag">{f}</span>
              ))}
            </div>
          </div>
          
          <div className="format-category">
            <span className="format-icon">📹 Video</span>
            <div className="format-tags">
              {videoFormats.map(f => (
                <span key={f} className="format-tag">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <p className="settings-help">
          Comparte archivos desde cualquier app (Galería, Telegram, Files, etc.) 
          y selecciónalas para transcribir.
        </p>
      </div>
    )
  }

  function renderAboutSection() {
    return (
      <div className="settings-section">
        <h3>ℹ️ Acerca de</h3>
        
        <div className="about-info">
          <div className="app-logo">🐦</div>
          <h4>Robin App</h4>
          <p className="version">Versión 2.0.0</p>
          <p className="license">Licencia: AGPL-3.0</p>
          
          <div className="features-list">
            <p>✓ Reconocimiento de voz offline (Vosk, Whisper)</p>
            <p>✓ Texto a voz offline (Piper, Android TTS)</p>
            <p>✓ Whisper API cloud (opcional)</p>
            <p>✓ Compartir audio/video desde otras apps</p>
            <p>✓ 100% offline (excepto API cloud)</p>
          </div>
        </div>
      </div>
    )
  }

  async function handleDeleteApiKey() {
    if (confirm('¿Estás seguro de eliminar la API Key?')) {
      await deleteApiKey()
      await loadConfig()
    }
  }

  if (!isOpen) return null

  return (
    <div className="settings-screen-overlay" onClick={onClose}>
      <div className="settings-screen" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <button className="btn-back" onClick={onClose}>←</button>
          <h2>⚙️ Configuración</h2>
          <div className="header-spacer" />
        </div>

        <div className="settings-content">
          {renderSTTSection()}
          {renderTTSSection()}
          {renderLanguageSection()}
          {renderAppearanceSection()}
          {renderFileSection()}
          {renderAboutSection()}
        </div>
      </div>
    </div>
  )
}
