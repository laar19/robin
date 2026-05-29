import { useState, useEffect } from 'react'
import { testConnection, WHISPER_MODELS } from '../services/whisperApiService'
import { getAllConfig, saveAllConfig, validateApiKey, validateBaseUrl } from '../services/apiStorageService'

export default function ApiKeyModal({ isOpen, onClose, onSave }) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('whisper-large-v3')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validationError, setValidationError] = useState(null)

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
    setValidationError(null)
    
    const keyValidation = validateApiKey(apiKey)
    if (!keyValidation.valid) {
      setValidationError(keyValidation.error)
      return
    }
    
    const urlValidation = validateBaseUrl(baseUrl)
    if (!urlValidation.valid) {
      setValidationError(urlValidation.error)
      return
    }

    try {
      await saveAllConfig({
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        model,
      })
      onSave?.()
      onClose()
    } catch (e) {
      setValidationError(e.message)
    }
  }

  function isOpenAIUrl() {
    return baseUrl.includes('openai.com')
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
              <div className="alert alert-info">
                <strong>☁️ Cloud API:</strong> Las transcripciones se procesan en servidores de OpenAI.
                Requiere conexión a internet. Se cobra por minuto de audio.
              </div>

              <div className="form-group">
                <label>API Key <span className="required">*</span></label>
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
                  Formato: sk-xxxxxxxxxxxxxxxxxxxx (mínimo 20 caracteres)
                </p>
              </div>

              <div className="form-group">
                <label>Modelo <span className="required">*</span></label>
                <select value={model} onChange={e => setModel(e.target.value)}>
                  {WHISPER_MODELS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label} - {m.price}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  {WHISPER_MODELS.find(m => m.value === model)?.description}
                </p>
              </div>

              <div className="form-group">
                <label>Base URL (opcional)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className={`full-width ${!isOpenAIUrl() ? 'warning-input' : ''}`}
                />
                {!isOpenAIUrl() && (
                  <p className="form-help warning">
                    ⚠️ URL custom detectada. Asegúrate de confiar en el proveedor.
                  </p>
                )}
                <p className="form-help">
                  Para proxies o instancias self-hosted (debe usar HTTPS)
                </p>
              </div>

              {validationError && (
                <div className="test-result error">
                  ❌ {validationError}
                </div>
              )}

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

              <div className="pricing-info">
                <h4>💰 Precios Estimados</h4>
                <ul>
                  <li>1 minuto de audio: ~${(0.0006).toFixed(4)} - $0.0006 USD</li>
                  <li>10 minutos: ~$0.006 USD</li>
                  <li>1 hora: ~$0.036 USD</li>
                </ul>
                <p className="form-help">
                  Precios de OpenAI. Verifica en platform.openai.com
                </p>
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
