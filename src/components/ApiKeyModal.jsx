import { useState, useEffect } from 'react'
import { testConnection, WHISPER_MODELS } from '../services/whisperApiService'
import { getAllConfig, saveAllConfig } from '../services/apiStorageService'

export default function ApiKeyModal({ isOpen, onClose, onSave }) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('whisper-large-v3')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen])

  async function loadConfig() {
    setLoading(true)
    const config = await getAllConfig()
    if (config.apiKey) setApiKey(config.apiKey)
    if (config.baseUrl) setBaseUrl(config.baseUrl)
    if (config.model) setModel(config.model)
    setLoading(false)
  }

  async function handleTest() {
    if (!apiKey.trim()) {
      setTestResult({ success: false, error: 'Ingresa una API Key' })
      return
    }
    setTesting(true)
    setTestResult(null)
    const result = await testConnection(apiKey.trim(), baseUrl.trim())
    setTestResult(result)
    setTesting(false)
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      alert('Ingresa una API Key')
      return
    }
    await saveAllConfig({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model,
    })
    onSave?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Configuración de Whisper API</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Cargando configuración...</div>
          ) : (
            <>
              <div className="form-group">
                <label>API Key</label>
                <div className="input-with-actions">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Ocultar' : 'Mostrar'}
                  >
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="form-help">
                  Tu API Key de OpenAI o proveedor compatible
                </p>
              </div>

              <div className="form-group">
                <label>Modelo</label>
                <select value={model} onChange={e => setModel(e.target.value)}>
                  {WHISPER_MODELS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  Modelo a usar para transcripciones
                </p>
              </div>

              <div className="form-group">
                <label>Base URL (opcional)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="full-width"
                />
                <p className="form-help">
                  URL base para proxies o instancias self-hosted
                </p>
              </div>

              {testResult && (
                <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.success ? '✅ Conexión exitosa' : `❌ ${testResult.error}`}
                </div>
              )}

              <div className="test-button-container">
                <button
                  type="button"
                  className="test-button"
                  onClick={handleTest}
                  disabled={testing || !apiKey.trim()}
                >
                  {testing ? '⏳ Probando...' : '🧪 Test Connection'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
