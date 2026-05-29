export default function ProgressBar({ progress, status, showCancel, onCancel, canCancel }) {
  const statusConfig = {
    extracting: { icon: '📹', label: 'Extrayendo audio del video...', color: 'blue' },
    uploading: { icon: '☁️', label: 'Subiendo a Whisper API...', color: 'orange' },
    transcribing: { icon: '🎤', label: 'Transcribiendo...', color: 'green' },
    processing: { icon: '⚙️', label: 'Procesando...', color: 'blue' },
  }

  const current = statusConfig[status] || statusConfig.processing

  return (
    <div className="progress-modal">
      <div className="progress-header">
        <span className="progress-icon">{current.icon}</span>
        <span className="progress-label">{current.label}</span>
      </div>

      <div className="progress-bar-container">
        <div 
          className={`progress-bar-fill progress-bar-${current.color}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-percent">
        {progress}%
      </div>

      {canCancel && showCancel && (
        <button className="btn btn-cancel" onClick={onCancel}>
          ❌ Cancelar
        </button>
      )}
    </div>
  )
}
