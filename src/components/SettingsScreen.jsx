import { useState, useEffect } from 'react'
import { getAllConfig, deleteApiKey } from '../services/apiStorageService'
import { WHISPER_MODELS } from '../services/whisperApiService'
import { getStatsSummary, getApiCostStats } from '../services/statsService'
import { getQueueStats } from '../services/queueService'
import { getAllPrefs, resetPrefs } from '../services/preferencesService'

export default function SettingsScreen({ 
  isOpen, 
  onClose, 
  onOpenApiKeyModal,
  onOpenQueue,
  onOpenHistory,
}) {
  const [config, setConfig] = useState(null)
  const [stats, setStats] = useState(null)
  const [queueStats, setQueueStats] = useState(null)
  const [prefs, setPrefs] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadAllData()
    }
  }, [isOpen])

  async function loadAllData() {
    const savedConfig = await getAllConfig()
    setConfig(savedConfig)
    
    const savedStats = getStatsSummary()
    setStats(savedStats)
    
    const savedQueueStats = getQueueStats()
    setQueueStats(savedQueueStats)
    
    const savedPrefs = getAllPrefs()
    setPrefs(savedPrefs)
  }

  function renderSTTSection() {
    return (
      <div className="settings-section">
        <h3>🎤 STT Engines</h3>
        
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Vosk</span>
            <span className="item-description">Rápido, ~40MB, offline</span>
          </div>
          <span className="status-badge status-local">📱 Offline</span>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Whisper tiny</span>
            <span className="item-description">Preciso, ~75MB, offline</span>
          </div>
          <span className="status-badge status-local">📱 Offline</span>
        </div>

        <div className="settings-item" onClick={onOpenApiKeyModal}>
          <div className="settings-item-info">
            <span className="item-title">Whisper API</span>
            <span className="item-description">Cloud, requiere API Key</span>
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
            <div className="subitem-actions">
              <button className="btn btn-small btn-secondary" onClick={onOpenApiKeyModal}>
                ✏️ Editar
              </button>
              <button className="btn btn-small btn-danger" onClick={handleDeleteApiKey}>
                🗑️ Eliminar
              </button>
            </div>
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
          <span className="status-badge status-built-in">📱 Built-in</span>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="item-title">Piper TTS</span>
            <span className="item-description">es_ES-mls-medium.onnx</span>
          </div>
          <span className="status-badge status-local">📱 Local (~300KB)</span>
        </div>
      </div>
    )
  }

  function renderQueueSection() {
    if (!queueStats) return null
    
    const totalPending = queueStats.offline.pending + queueStats.online.pending
    const totalCompleted = queueStats.offline.completed + queueStats.online.completed
    
    return (
      <div className="settings-section">
        <h3>🔄 Cola de Procesamiento</h3>
        
        <div className="queue-stats">
          <div className="queue-stat-item">
            <span className="stat-label">📱 Offline</span>
            <div className="stat-values">
              <span className="stat-pending">⏳ {queueStats.offline.pending} pendientes</span>
              <span className="stat-completed">✅ {queueStats.offline.completed} completados</span>
            </div>
          </div>
          
          <div className="queue-stat-item">
            <span className="stat-label">☁️ Online</span>
            <div className="stat-values">
              <span className="stat-pending">⏳ {queueStats.online.pending} pendientes</span>
              <span className="stat-completed">✅ {queueStats.online.completed} completados</span>
            </div>
          </div>
          
          <button className="btn btn-primary full-width" onClick={onOpenQueue}>
            🔄 Ver Cola ({totalPending} pendientes)
          </button>
        </div>
      </div>
    )
  }

  function renderStatsSection() {
    if (!stats) return null
    
    const costStats = getApiCostStats()
    
    return (
      <div className="settings-section">
        <h3>📊 Estadísticas</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.totalTranscriptions}</span>
            <span className="stat-label">Transcripciones</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-value">{stats.apiTranscriptions}</span>
            <span className="stat-label">Cloud (API)</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-value">{stats.offlineTranscriptions}</span>
            <span className="stat-label">Offline</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-value">${costStats.totalCost.toFixed(3)}</span>
            <span className="stat-label">Costo API</span>
          </div>
        </div>
        
        <div className="stats-details">
          <p><strong>Últimos 7 días:</strong></p>
          <div className="daily-stats">
            {stats.last7Days.map(day => (
              <div key={day.date} className="daily-stat">
                <span className="day-name">{day.dayName}</span>
                <span className="day-count">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderHistorySection() {
    return (
      <div className="settings-section">
        <h3>📜 Historial</h3>
        
        <div className="settings-item" onClick={onOpenHistory}>
          <div className="settings-item-info">
            <span className="item-title">Ver Historial</span>
            <span className="item-description">Últimas 50 transcripciones</span>
          </div>
          <span className="arrow">→</span>
        </div>
        
        <p className="settings-help">
          Busca, filtra, exporta o elimina transcripciones anteriores.
          Los favoritos no se eliminan al limpiar.
        </p>
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

  function renderAboutSection() {
    return (
      <div className="settings-section">
        <h3>ℹ️ Acerca de</h3>
        
        <div className="about-info">
          <div className="app-logo">🐦</div>
          <h4>Robin App</h4>
          <p className="version">Versión 2.1.0</p>
          <p className="license">Licencia: AGPL-3.0</p>
          
          <div className="features-list">
            <p>✓ Reconocimiento de voz offline (Vosk, Whisper)</p>
            <p>✓ Texto a voz offline (Piper, Android TTS)</p>
            <p>✓ Whisper API cloud (opcional)</p>
            <p>✓ Compartir audio/video desde otras apps</p>
            <p>✓ Cola de procesamiento (offline/online)</p>
            <p>✓ Historial de transcripciones</p>
            <p>✓ Estadísticas de uso</p>
          </div>
          
          <button className="btn btn-small btn-secondary" onClick={() => {
            if (confirm('¿Resetear todas las preferencias?')) {
              resetPrefs()
              alert('Preferencias reseteadas')
            }
          }}>
            🔄 Resetear Preferencias
          </button>
        </div>
      </div>
    )
  }

  async function handleDeleteApiKey() {
    if (confirm('¿Estás seguro de eliminar la API Key?')) {
      await deleteApiKey()
      await loadAllData()
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
          {renderQueueSection()}
          {renderStatsSection()}
          {renderHistorySection()}
          {renderLanguageSection()}
          {renderAboutSection()}
        </div>
      </div>
    </div>
  )
}
