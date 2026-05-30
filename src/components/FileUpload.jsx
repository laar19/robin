import { useState } from 'react'

export default function FileUpload({ onFileSelected, isProcessing }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['audio/', 'video/']
    const isValidType = validTypes.some(type => file.type.startsWith(type))
    
    if (!isValidType) {
      setError('Formato no válido. Solo audio (MP3, WAV, M4A) o video (MP4, MKV, AVI)')
      return
    }

    // Validate file size (max 500MB for video, 100MB for audio)
    const maxSize = file.type.startsWith('video/') ? 500 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = file.type.startsWith('video/') ? 500 : 100
      setError(`Archivo muy grande. Máximo ${maxMB}MB para ${file.type.startsWith('video/') ? 'video' : 'audio'}`)
      return
    }

    setError(null)
    setSelectedFile(file)
    onFileSelected(file)
  }

  function handleClear() {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className="file-upload-container">
      <div className="file-upload-box">
        <input
          type="file"
          id="file-upload"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="file-upload-input"
        />
        <label htmlFor="file-upload" className="file-upload-label">
          <span className="file-upload-icon">📁</span>
          <span className="file-upload-text">
            {selectedFile ? selectedFile.name : 'Cargar Archivo'}
          </span>
          <span className="file-upload-subtext">
            {selectedFile 
              ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`
              : 'Audio o video (MP3, WAV, MP4, etc.)'
            }
          </span>
        </label>
        {selectedFile && (
          <button 
            type="button" 
            className="file-upload-clear"
            onClick={handleClear}
            disabled={isProcessing}
          >
            ✕
          </button>
        )}
      </div>
      {error && <p className="file-upload-error">{error}</p>}
    </div>
  )
}
