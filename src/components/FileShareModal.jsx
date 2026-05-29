import { useState, useEffect } from 'react'
import ProgressBar from './ProgressBar'
import TranscriptionResult from './TranscriptionResult'
import { transcribeAudio, cancelTranscription, estimateCostFromFile, WHISPER_MODELS } from '../services/whisperApiService'
import { getAllConfig } from '../services/apiStorageService'
import { 
  getFileIcon, 
  formatFileSize, 
  extractAudioFromVideo, 
  clearSharedFile,
  validateFileSize,
  cleanupExtractedFile,
  getMaxFileSize,
} from '../services/fileHandlerService'

export default function FileShareModal({ isOpen, file, onClose, sttEngine }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [extractedAudioPath, setExtractedAudioPath] = useState(null)
  const [estimatedCost, setEstimatedCost] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const maxSizes = getMaxFileSize()

  useEffect(() => {
    if (isOpen && file) {
      validateAndPrepare()
    }
    return () => {
      if (extractedAudioPath) {
        cleanupExtractedFile(extractedAudioPath)
      }
    }
  }, [isOpen, file])

  async function validateAndPrepare() {
    setStatus('idle')
    setError(null)
    setConfirmed(false)
    setProgress(0)
    setTranscription('')
    setEstimatedCost(null)

    if (!file) return

    // Validate file size
    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      setError(sizeValidation.error)
      setStatus('error')
      return
    }

    // Check if Whisper API is selected
    if (sttEngine !== 'whisper-api') {
      setError('Whisper API debe estar seleccionado como engine STT')
      setStatus('error')
      return
    }

    // Check API Key
    const config = await getAllConfig()
    if (!config.apiKey) {
      setError('API Key no configurada. Configúrala en Ajustes.')
      setStatus('error')
      return
    }

    // Estimate cost
    const cost = estimateCostFromFile(file.file, config.model)
    setEstimatedCost(cost)
  }

  async function processFile() {
    if (!file || !confirmed) return

    try {
      const config = await getAllConfig()
      let audioFile = file.file

      // Extract audio from video if needed
      if (file.isVideo) {
        setStatus('extracting')
        setProgress(0)
        
        try {
          const extractResult = await extractAudioFromVideo(file.uri, (p) => {
            setProgress(Math.round(p * 0.3))
          })
          setExtractedAudioPath(extractResult.audioPath)
          
          const audioBlob = await uriToBlob(extractResult.audioUri)
          audioFile = new File([audioBlob], 'extracted_audio.m4a', { type: 'audio/m4a' })
        } catch (e) {
          throw new Error(`Error extrayendo audio: ${e.message}`)
        }
      }

      // Upload and transcribe
      setStatus('uploading')
      setProgress(30)

      const result = await transcribeAudio(audioFile, {
        ...config,
        onProgress: (uploadProgress) => {
          setProgress(30 + Math.round(uploadProgress * 0.5))
        },
      })

      setStatus('transcribing')
      setProgress(90)

      setTranscription(result.text)
      setStatus('complete')
      setProgress(100)

      // Save to history
      saveToHistory(result.text, file.name)

    } catch (e) {
      if (e.message.includes('cancel')) {
        setStatus('cancelled')
      } else {
        setError(e.message)
        setStatus('error')
      }
    }
  }

  async function uriToBlob(uri) {
    const response = await fetch(uri)
    return await response.blob()
  }

  function saveToHistory(text, filename) {
    try {
      const history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]')
      history.unshift({
        id: Date.now(),
        text,
        filename,
        date: new Date().toISOString(),
        engine: 'whisper-api',
      })
      // Keep only last 50 transcriptions
      localStorage.setItem('transcriptionHistory', history.slice(0, 50))
    } catch (e) {
      console.error('Error saving to history:', e)
    }
  }

  function handleCancel() {
    cancelTranscription()
    setStatus('cancelled')
    clearSharedFile()
    if (extractedAudioPath) {
      cleanupExtractedFile(extractedAudioPath)
      setExtractedAudioPath(null)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(transcription)
  }

  function handleListen() {
    const utterance = new SpeechSynthesisUtterance(transcription)
    speechSynthesis.speak(utterance)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'Transcripción Robin',
        text: transcription,
      })
    } else {
      alert('Compartir no está soportado en este dispositivo')
    }
  }

  function handleClose() {
    clearSharedFile()
    if (extractedAudioPath) {
      cleanupExtractedFile(extractedAudioPath)
      setExtractedAudioPath(null)
    }
    onClose()
  }

  if (!isOpen || !file) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content file-share-modal" onClick={e => e.stopPropagation()}>
        {status === 'idle' && !confirmed && (
          <>
            <div className="file-info">
              <div className="file-icon">{getFileIcon(file.type)}</div>
              <div className="file-details">
                <h3>{file.name}</h3>
                <p>{formatFileSize(file.size)}</p>
                <p className="file-type">{file.isVideo ? 'Video' : 'Audio'}</p>
              </div>
            </div>

            <div className="cost-warning">
              <h4>⚠️ Costo Estimado</h4>
              <p className="cost-amount">~${estimatedCost} USD</p>
              <p className="cost-details">
                Este es un estimado basado en el tamaño del archivo.
                El costo real depende de la duración del audio.
              </p>
              <div className="size-limits">
                <p><strong>Límites:</strong></p>
                <p>Audio: máx {maxSizes.audioFormatted}</p>
                <p>Video: máx {maxSizes.videoFormatted}</p>
              </div>
            </div>

            <div className="confirmation-actions">
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setConfirmed(true)
                  processFile()
                }}
              >
                💵 Confirmar (${estimatedCost}) y Transcribir
              </button>
            </div>
          </>
        )}

        {(status === 'extracting' || status === 'uploading' || status === 'transcribing') && (
          <ProgressBar
            progress={progress}
            status={status}
            showCancel={true}
            onCancel={handleCancel}
            canCancel={true}
          />
        )}

        {status === 'complete' && (
          <TranscriptionResult
            text={transcription}
            onCopy={handleCopy}
            onListen={handleListen}
            onShare={handleShare}
            onClose={handleClose}
          />
        )}

        {status === 'error' && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="cancelled-state">
            <div className="cancel-icon">⏹️</div>
            <h3>Procesamiento cancelado</h3>
            <button className="btn btn-primary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
