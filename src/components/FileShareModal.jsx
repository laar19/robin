import { useState, useEffect } from 'react'
import EngineSelector from './EngineSelector'
import ProgressBar from './ProgressBar'
import TranscriptionResult from './TranscriptionResult'
import { transcribeAudio, cancelTranscription, estimateCostFromFile, WHISPER_MODELS } from '../services/whisperApiService'
import { getAllConfig } from '../services/apiStorageService'
import { getLastEngine, setLastEngine } from '../services/preferencesService'
import { 
  getFileIcon, 
  formatFileSize, 
  extractAudioFromVideo, 
  clearSharedFile,
  validateFileSize,
  cleanupExtractedFile,
  getMaxFileSize,
} from '../services/fileHandlerService'
import { addToQueue, updateItemStatus, STATUS } from '../services/queueService'
import { recordTranscription } from '../services/statsService'
import { addToHistory } from '../services/historyService'

export default function FileShareModal({ isOpen, file, onClose, sttEngine: globalSttEngine }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [extractedAudioPath, setExtractedAudioPath] = useState(null)
  const [estimatedCost, setEstimatedCost] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [selectedEngine, setSelectedEngine] = useState(globalSttEngine || 'vosk')
  
  const maxSizes = getMaxFileSize()

  useEffect(() => {
    if (isOpen && file) {
      // Usar último motor usado o el global
      getLastEngine().then(lastEngine => {
        setSelectedEngine(lastEngine || globalSttEngine || 'vosk')
      })
      validateAndPrepare()
    }
    return () => {
      if (extractedAudioPath) {
        cleanupExtractedFile(extractedAudioPath)
      }
    }
  }, [isOpen, file])

  useEffect(() => {
    // Actualizar cuando cambia el engine seleccionado
    if (file && selectedEngine === 'whisper-api') {
      const cost = estimateCostFromFile(file.file, 'whisper-large-v3')
      setEstimatedCost(cost)
    } else {
      setEstimatedCost(null)
    }
  }, [selectedEngine, file])

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

    // Check API Key if using Whisper API
    if (selectedEngine === 'whisper-api') {
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
  }

  async function processFile() {
    if (!file || !confirmed) return

    try {
      // Guardar preferencia del motor usado
      setLastEngine(selectedEngine)
      
      // Agregar a la cola
      const queueItem = addToQueue({
        file: {
          name: file.name,
          size: file.size,
          isVideo: file.isVideo,
        },
        engine: selectedEngine,
        status: STATUS.PENDING,
      })
      
      const config = await getAllConfig()
      let audioFile = file.file

      // Extract audio from video if needed
      if (file.isVideo) {
        setStatus('extracting')
        updateItemStatus(queueItem.id, STATUS.PROCESSING, 5)
        setProgress(0)
        
        try {
          const extractResult = await extractAudioFromVideo(file.uri, (p) => {
            const newProgress = Math.round(p * 0.3)
            setProgress(newProgress)
            updateItemStatus(queueItem.id, STATUS.PROCESSING, newProgress)
          })
          setExtractedAudioPath(extractResult.audioPath)
          
          const audioBlob = await uriToBlob(extractResult.audioUri)
          audioFile = new File([audioBlob], 'extracted_audio.m4a', { type: 'audio/m4a' })
        } catch (e) {
          updateItemStatus(queueItem.id, STATUS.FAILED, 0, e.message)
          throw new Error(`Error extrayendo audio: ${e.message}`)
        }
      }

      // Process based on engine
      if (selectedEngine === 'whisper-api') {
        // Upload and transcribe via API
        setStatus('uploading')
        updateItemStatus(queueItem.id, STATUS.PROCESSING, 30)
        setProgress(30)

        const result = await transcribeAudio(audioFile, {
          ...config,
          onProgress: (uploadProgress) => {
            const newProgress = 30 + Math.round(uploadProgress * 0.5)
            setProgress(newProgress)
            updateItemStatus(queueItem.id, STATUS.PROCESSING, newProgress)
          },
        })

        setStatus('transcribing')
        setProgress(90)
        updateItemStatus(queueItem.id, STATUS.PROCESSING, 90)

        setTranscription(result.text)
        setStatus('complete')
        setProgress(100)
        updateItemStatus(queueItem.id, STATUS.COMPLETED, 100, null, result.text)
        
        // Record stats
        recordTranscription('whisper-api', config.model, result.duration || 0, estimatedCost || 0)
        
        // Save to history
        addToHistory({
          text: result.text,
          filename: file.name,
          engine: 'whisper-api',
          model: config.model,
          duration: result.duration,
          cost: estimatedCost,
          isVideo: file.isVideo,
        })

      } else {
        // Offline processing (Vosk or Whisper local)
        // For now, we'll simulate offline processing
        // In a real implementation, this would call the native plugins
        setStatus('processing')
        updateItemStatus(queueItem.id, STATUS.PROCESSING, 50)
        
        // Simular procesamiento offline
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setStatus('complete')
        setProgress(100)
        updateItemStatus(queueItem.id, STATUS.COMPLETED, 100)
        
        // Placeholder text for offline
        const offlineText = '[Procesamiento offline completado - Texto no disponible en esta demo]'
        setTranscription(offlineText)
        
        // Record stats
        recordTranscription(selectedEngine, null, 0, 0)
        
        // Save to history
        addToHistory({
          text: offlineText,
          filename: file.name,
          engine: selectedEngine,
          duration: 0,
          cost: 0,
          isVideo: file.isVideo,
        })
      }

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

  const isOnline = selectedEngine === 'whisper-api'

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

            <div className="engine-selection-section">
              <label>Selecciona el motor de transcripción:</label>
              <EngineSelector
                type="STT"
                value={selectedEngine}
                onChange={setSelectedEngine}
                showInfo={true}
              />
            </div>

            {isOnline && (
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
            )}

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
                {isOnline ? `💵 Confirmar ($${estimatedCost})` : '▶️'} Procesar
              </button>
            </div>
          </>
        )}

        {(status === 'extracting' || status === 'uploading' || status === 'transcribing' || status === 'processing') && (
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
