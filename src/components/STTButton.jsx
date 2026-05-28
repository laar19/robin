export default function STTButton({ isRecording, onStart, onStop }) {
  return (
    <button
      className={`stt-button ${isRecording ? 'recording' : ''}`}
      onClick={isRecording ? onStop : onStart}
    >
      <span className="mic-icon">
        {isRecording ? '⏹' : '🎤'}
      </span>
      <span>{isRecording ? 'Detener' : 'Iniciar Grabación'}</span>
    </button>
  )
}
