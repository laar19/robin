import { useState, useEffect } from 'react'
import STTButton from './components/STTButton'
import TTSInput from './components/TTSInput'
import ModelSelector from './components/ModelSelector'
import LanguageSelector from './components/LanguageSelector'
import StatusBar from './components/StatusBar'
import AudioPlayer from './components/AudioPlayer'
import { requestPermissions, checkPermissions } from './services/permissions'
import { VoskPlugin, TtsPlugin, WhisperPlugin, PiperPlugin } from './services/capacitor-plugins'

export default function App() {
  const [sttEngine, setSttEngine] = useState('vosk')
  const [ttsEngine, setTtsEngine] = useState('android')
  const [language, setLanguage] = useState('es')
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    initApp()
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

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

  async function handleStartRecording() {
    try {
      setIsRecording(true)
      setStatus('listening')
      setError(null)
      await VoskPlugin.startListening()
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
      await VoskPlugin.stopListening()
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
      await TtsPlugin.speak({ text, lang: language, speed: 1.0 })
      setStatus('ready')
    } catch (e) {
      setError(`Error TTS: ${e.message}`)
      setStatus('error')
    }
  }

  function toggleTheme() {
    setDarkMode(!darkMode)
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <header>
        <div className="header-top">
          <h1>Robin</h1>
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
              <h3>Configuración</h3>
              <ModelSelector
                sttEngine={sttEngine}
                ttsEngine={ttsEngine}
                onSttChange={setSttEngine}
                onTtsChange={setTtsEngine}
              />
              <LanguageSelector value={language} onChange={setLanguage} />
            </section>
          </>
        )}
      </main>

      {error && <div className="error-toast">{error}</div>}

      <footer>
        <p>Procesamiento 100% local</p>
      </footer>
    </div>
  )
}
