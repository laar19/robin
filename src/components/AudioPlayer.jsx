export default function AudioPlayer({ audioFile }) {
  if (!audioFile) return null
  return (
    <div className="audio-player">
      <audio controls src={audioFile}>
        Tu navegador no soporta audio.
      </audio>
    </div>
  )
}
