import { useState, useEffect } from 'react'
import STTButton from './components/STTButton'
import TTSInput from './components/TTSInput'
import ModelSelector from './components/ModelSelector'
import LanguageSelector from './components/LanguageSelector'
import StatusBar from './components/StatusBar'
import SettingsScreen from './components/SettingsScreen'
import ApiKeyModal from './components/ApiKeyModal'
import FileShareModal from './components/FileShareModal'
import ProcessingQueue from './components/ProcessingQueue'
import HistoryList from './components/HistoryList'
import { requestPermissions, checkPermissions } from './services/permissions'
import { VoskPlugin, TtsPlugin, WhisperPlugin, PiperPlugin } from './services/capacitor-plugins'
import { getSharedFile, clearSharedFile } from './services/fileHandlerService'
import { getAllConfig, saveModel } from './services/apiStorageService'
import { transcribeAudio, cancelTranscription } from './services/whisperApiService'
import { getQueueStats } from './services/queueService'
import { getStatsSummary } from './services/statsService'
import { getLastEngine, setLastEngine, getDarkMode, setDarkMode } from './services/preferencesService'

export default function App() {
  const [sttEngine, setSttEngine] = useState('vosk')
  const [ttsEngine, setTtsEngine] = useState('android')
  const [language, setLanguage] = useState('es')
  const [whisperModel, setWhisperModel] = useState('whisper-large-v3')
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [darkMode, setDarkModeState] = useState(() => getDarkMode())

  // Modal states
  const [showSettings, setShowSettings] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showFileShareModal, setShowFileShareModal] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  const [sharedFile, setSharedFile] = useState(null)
  const [queueStats, setQueueStats] = useState({ offline: { pending: 0 }, online: { pending: 0 } })

  useEffect(() => {
    initApp()
  }, [])

  useEffect(() => {
    setDarkMode(darkMode)
  }, [darkMode])

  useEffect(() => {
    const loadWhisperModel = async () => {
      await saveModel(whisperModel)
    }
    loadWhisperModel()
  }, [whisperModel])

  useEffect(() => {
    const cleanup = setupFileShareListener()
    return () => cleanup()
  }, [])

  useEffect(() => {
    // Update queue stats periodically
    const interval = setInterval(() => {
      setQueueStats(getQueueStats())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  async function initApp() {
    const permResult = await requestPermissions()
    const audioGranted = permResult.permissions?.some(p => p.permission === 'RECORD_AUDIO' && p.status === 'granted')
    
    if (!audioGranted) {
      setError('Permiso de micrófono requerido. La app no funcionará sin él.')
      setStatus('error')
      return
    }
    
    setPermissionsGranted(true)
    
    try {
      await VoskPlugin.init({ lang: language })
      await TtsPlugin.init()
      setStatus('ready')
    } catch (e) {
      setError(`Error inicializando: ${e.message}`)
      setStatus('error')
    }
  }

  function setupFileShareListener() {
    const FileHandlerPlugin = window.FileHandlerPlugin
    if (!FileHandlerPlugin) return () => {}

    const listener = FileHandlerPlugin.addListener('onFileShared', async (data) => {
      if (data.hasSharedFile) {
        const file = await getSharedFile()
        setSharedFile(file)
        setShowFileShareModal(true)
      }
    })

    return () => listener.remove()
  }

  async function handleStartRecording() {
    try {
      setIsRecording(true)
      setStatus('listening')
      setError(null)
      
      if (sttEngine === 'vosk') {
        await VoskPlugin.startListening()
      } else if (sttEngine === 'whisper') {
        await WhisperPlugin.startListening()
      }
    } catch (e) {
      setError(`Error de grabación: ${e.message}`)
      setIsRecording(false)
      setStatus('error')
    }
  }

  async function handleStopRecording() {
    try {
      setIsRecording(false)
      setStatus('processing')
      
      let result
      if (sttEngine === 'vosk') {
        result = await VoskPlugin.stopListening()
      } else if (sttEngine === 'whisper') {
        result = await WhisperPlugin.stopListening()
      }
      
      if (result?.text) {
        setTranscription(result.text)
      }
      
      setStatus('ready')
    } catch (e) {
      setError(`Error al detener: ${e.message}`)
      setStatus('error')
    }
  }

  async function handleSpeak(text) {
    try {
      setStatus('speaking')
      setError(null)
      
      if (ttsEngine === 'android') {
        await TtsPlugin.speak({ text, lang: language, speed: 1.0 })
      } else {
        await PiperPlugin.synthesize({ text, modelPath: 'models/es_ES-mls-medium.onnx' })
      }
      
      setStatus('ready')
    } catch (e) {
      setError(`Error TTS: ${e.message}`)
      setStatus('error')
    }
  }

  function toggleTheme() {
    setDarkModeState(!darkMode)
  }

  function handleWhisperModelChange(model) {
    setWhisperModel(model)
  }

  function handleApiKeySaved() {
    setShowApiKeyModal(false)
    setShowSettings(false)
  }

  function handleEngineChange(engine) {
    setSttEngine(engine)
    setLastEngine(engine)
  }

  const totalPending = queueStats.offline.pending + queueStats.online.pending

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <header>
        <div className="header-top">
          <h1>Robin</h1>
          <div className="header-actions">
            <button 
              className="queue-btn" 
              onClick={() => setShowQueue(true)} 
              title="Cola de procesamiento"
            >
              🔄 {totalPending > 0 && <span className="badge">{totalPending}</span>}
            </button>
            <button 
              className="history-btn" 
              onClick={() => setShowHistory(true)} 
              title="Historial"
            >
              📜
            </button>
            <button 
              className="settings-btn" 
              onClick={() => setShowSettings(true)} 
              title="Configuración"
            >
              ⚙️
            </button>
            <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <StatusBar status={status} />
      </header>

      <main>
        {!permissionsGranted && status !== 'error' && (
          <section className="permissions-section">
            <p>Solicitando permisos...</p>
          </section>
        )}
        
        {permissionsGranted && (
          <>
            <section className="stt-section">
              <h2>Reconocimiento de Voz</h2>
              <STTButton
                isRecording={isRecording}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
              />
              <div className="transcription-box">
                <p>{transcription || 'La transcripción aparecerá aquí...'}</p>
              </div>
            </section>

            <section className="tts-section">
              <h2>Texto a Voz</h2>
              <TTSInput onSpeak={handleSpeak} />
            </section>

            <section className="settings-section">
              <h3>Configuración Rápida</h3>
              <ModelSelector
                sttEngine={sttEngine}
                ttsEngine={ttsEngine}
                onSttChange={handleEngineChange}
                onTtsChange={setTtsEngine}
                onWhisperModelChange={handleWhisperModelChange}
              />
              <LanguageSelector value={language} onChange={setLanguage} />
              
              <div className="quick-actions">
                <button className="btn-action" onClick={() => setShowQueue(true)}>
                  🔄 Cola {totalPending > 0 && `(${totalPending})`}
                </button>
                <button className="btn-action" onClick={() => setShowHistory(true)}>
                  📜 Historial
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {error && <div className="error-toast">{error}</div>}

      <footer>
        <p>
          {sttEngine === 'whisper-api' 
            ? '☁️ Procesamiento cloud (Whisper API)' 
            : '📱 Procesamiento 100% local'}
        </p>
      </footer>

      <SettingsScreen
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenQueue={() => setShowQueue(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySaved}
      />

      <FileShareModal
        isOpen={showFileShareModal}
        file={sharedFile}
        onClose={() => {
          setShowFileShareModal(false)
          setSharedFile(null)
          clearSharedFile()
        }}
        sttEngine={sttEngine}
      />

      <ProcessingQueue
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
      />

      <HistoryList
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  )
}
