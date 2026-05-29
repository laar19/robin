export default function TranscriptionResult({ text, onCopy, onListen, onShare, onClose }) {
  return (
    <div className="transcription-result">
      <div className="result-header">
        <h3>✅ Transcripción completa</h3>
      </div>
      
      <div className="result-text">
        {text}
      </div>
      
      <div className="result-actions">
        <button className="action-btn" onClick={onCopy} title="Copiar">
          📋 Copiar
        </button>
        <button className="action-btn" onClick={onListen} title="Escuchar">
          🔊 Escuchar
        </button>
        <button className="action-btn" onClick={onShare} title="Compartir">
          📤 Compartir
        </button>
      </div>
      
      <div className="result-footer">
        <button className="btn btn-secondary full-width" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
