import { useState, useEffect } from 'react'
import STTButton from './components/STTButton'
import TTSInput from './components/TTSInput'
import ModelSelector from './components/ModelSelector'
import LanguageSelector from './components/LanguageSelector'
import StatusBar from './components/StatusBar'
import AudioPlayer from './components/AudioPlayer'
import { requestPermissions, checkPermissions } from './services/permissions'

export default function App() {
  const [sttEngine, setSttEngine] = useState('vosk')
  const [ttsEngine, setTtsEngine] = useState('android')
  const [language, setLanguage] = useState('es')
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    // Pedir permisos primero
    const permResult = await requestPermissions()
    const audioGranted = permResult.permissions?.some(p => p.permission === 'RECORD_AUDIO' && p.status === 'granted')
    
    if (!audioGranted) {
      setError('Permiso de micrófono requerido. La app no funcionará sin él.')
      setStatus('error')
      return
    }
    
    setPermissionsGranted(true)
    setStatus('ready')
    
    // Inicializar motores
    try {
      await Capacitor.Plugins.VoskPlugin.init({ lang: language })
      await Capacitor.Plugins.TtsPlugin.init()
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
      await Capacitor.Plugins.VoskPlugin.startListening()
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
      await Capacitor.Plugins.VoskPlugin.stopListening()
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
      await Capacitor.Plugins.TtsPlugin.speak({ text, lang: language, speed: 1.0 })
      setStatus('ready')
    } catch (e) {
      setError(`Error TTS: ${e.message}`)
      setStatus('error')
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>Robin</h1>
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
