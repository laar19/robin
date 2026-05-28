const STATUS_LABELS = {
  idle: 'Inactivo',
  ready: 'Listo',
  listening: 'Escuchando...',
  processing: 'Procesando...',
  speaking: 'Hablando...',
  error: 'Error',
}

export default function StatusBar({ status }) {
  return (
    <div className={`status-bar status-${status}`}>
      {STATUS_LABELS[status] || status}
    </div>
  )
}
