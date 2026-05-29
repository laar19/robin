import { useState, useEffect } from 'react'
import ProgressBar from './ProgressBar'
import TranscriptionResult from './TranscriptionResult'
import { transcribeAudio, cancelTranscription } from '../services/whisperApiService'
import { getAllConfig } from '../services/apiStorageService'
import { getFileIcon, formatFileSize, extractAudioFromVideo, clearSharedFile } from '../services/fileHandlerService'

export default function FileShareModal({ isOpen, file, onClose, sttEngine }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [extractedAudioPath, setExtractedAudioPath] = useState(null)

  useEffect(() => {
    if (isOpen && file) {
      processFile()
    }
  }, [isOpen, file])

  async function processFile() {
    if (!file) return

    try {
      const config = await getAllConfig()
      
      if (sttEngine !== 'whisper-api') {
        setError('Whisper API debe estar seleccionado como engine STT')
        setStatus('error')
        return
      }

      if (!config.apiKey) {
        setError('API Key no configurada. Configúrala en Ajustes.')
        setStatus('error')
        return
      }

      let audioFile = file.file

      if (file.isVideo) {
        setStatus('extracting')
        setProgress(0)
        
        try {
          const extractResult = await extractAudioFromVideo(file.uri, (p) => {
            setProgress(Math.round(p * 0.3))
          })
          setExtractedAudioPath(extractResult.audioPath)
          
          const audioBlob = await uriToBlob(extractResult.audioPath)
          audioFile = new File([audioBlob], 'extracted_audio.m4a', { type: 'audio/m4a' })
        } catch (e) {
          throw new Error(`Error extrayendo audio: ${e.message}`)
        }
      }

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
    setExtractedAudioPath(null)
    onClose()
  }

  if (!isOpen || !file) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content file-share-modal" onClick={e => e.stopPropagation()}>
        {status === 'idle' && (
          <div className="file-info">
            <div className="file-icon">{getFileIcon(file.type)}</div>
            <div className="file-details">
              <h3>{file.name}</h3>
              <p>{formatFileSize(file.size)}</p>
              <p className="file-type">{file.isVideo ? 'Video' : 'Audio'}</p>
            </div>
          </div>
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
