import { useState, useEffect } from 'react'
import { 
  getQueues, 
  updateItemStatus, 
  removeFromQueue, 
  retryItem,
  cancelAllPending,
  cleanupQueue,
  STATUS,
} from '../services/queueService'

const STATUS_LABELS = {
  [STATUS.PENDING]: 'En cola',
  [STATUS.PROCESSING]: 'Procesando',
  [STATUS.COMPLETED]: 'Completado',
  [STATUS.FAILED]: 'Fallido',
  [STATUS.CANCELLED]: 'Cancelado',
}

const STATUS_ICONS = {
  [STATUS.PENDING]: '⏳',
  [STATUS.PROCESSING]: '⚙️',
  [STATUS.COMPLETED]: '✅',
  [STATUS.FAILED]: '❌',
  [STATUS.CANCELLED]: '⏹️',
}

function QueueItem({ item, onRetry, onCancel, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  
  const isOffline = item.engine !== 'whisper-api'
  const engineIcon = isOffline ? '📱' : '☁️'
  const engineName = item.engine === 'whisper-api' 
    ? `Whisper API (${item.model || 'large-v3'})`
    : item.engine.charAt(0).toUpperCase() + item.engine.slice(1)
  
  return (
    <div className={`queue-item ${item.status} ${expanded ? 'expanded' : ''}`}>
      <div className="queue-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="queue-item-status">
          <span className="status-icon">{STATUS_ICONS[item.status]}</span>
        </div>
        
        <div className="queue-item-info">
          <div className="queue-item-name">
            <span className="file-icon">{item.file?.isVideo ? '📹' : '🎵'}</span>
            <span className="file-name">{item.file?.name || 'Archivo'}</span>
          </div>
          <div className="queue-item-meta">
            <span className={`engine-badge ${isOffline ? 'offline' : 'online'}`}>
              {engineIcon} {engineName}
            </span>
            <span className="queue-time">
              {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="queue-item-progress">
          {item.status === STATUS.PROCESSING && (
            <div className="progress-mini">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          <span className="progress-text">{item.progress}%</span>
        </div>
        
        <div className="queue-item-actions">
          {item.status === STATUS.FAILED && (
            <button className="btn-retry" onClick={(e) => { e.stopPropagation(); onRetry(item.id) }}>
              🔄
            </button>
          )}
          {item.status === STATUS.PENDING && (
            <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); onCancel(item.id) }}>
              ❌
            </button>
          )}
          <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}>
            🗑️
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="queue-item-details">
          {item.error && (
            <div className="error-message">
              <strong>Error:</strong> {item.error}
            </div>
          )}
          
          {item.transcription && (
            <div className="transcription-preview">
              <strong>Transcripción:</strong>
              <p>{item.transcription.substring(0, 200)}...</p>
            </div>
          )}
          
          <div className="item-stats">
            <span>Tamaño: {item.file?.size ? (item.file.size / 1024 / 1024).toFixed(2) : 0} MB</span>
            {item.duration && <span>Duración: {item.duration}s</span>}
            {item.cost && <span>Costo: ${item.cost.toFixed(4)}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function QueueSection({ title, type, items, onRetry, onCancel, onRemove }) {
  const pending = items.filter(i => i.status === STATUS.PENDING)
  const processing = items.filter(i => i.status === STATUS.PROCESSING)
  const completed = items.filter(i => i.status === STATUS.COMPLETED)
  const failed = items.filter(i => i.status === STATUS.FAILED || i.status === STATUS.CANCELLED)
  
  return (
    <div className={`queue-section ${type}`}>
      <div className="queue-section-header">
        <h3>
          {type === 'offline' ? '📱 Offline' : '☁️ Online'}
          <span className="queue-count">({items.length})</span>
        </h3>
        {pending.length > 0 && (
          <button 
            className="btn-clear-pending"
            onClick={() => cancelAllPending(type)}
          >
            Cancelar pendientes ({pending.length})
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="queue-empty">
          <p>No hay items en esta cola</p>
        </div>
      ) : (
        <div className="queue-items">
          {/* Procesando primero */}
          {processing.map(item => (
            <QueueItem
              key={item.id}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
          
          {/* Pendientes */}
          {pending.map(item => (
            <QueueItem
              key={item.id}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
          
          {/* Completados */}
          {completed.map(item => (
            <QueueItem
              key={item.id}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
          
          {/* Fallidos/Cancelados */}
          {failed.map(item => (
            <QueueItem
              key={item.id}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProcessingQueue({ isOpen, onClose }) {
  const [queues, setQueues] = useState({ offline: [], online: [] })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  function refreshQueues() {
    setQueues(getQueues())
  }
  
  useEffect(() => {
    if (isOpen) {
      refreshQueues()
      
      // Auto-refresh cada 2 segundos
      const interval = setInterval(refreshQueues, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, refreshTrigger])
  
  function handleRetry(id) {
    retryItem(id)
    setRefreshTrigger(t => t + 1)
  }
  
  function handleCancel(id) {
    updateItemStatus(id, STATUS.CANCELLED)
    setRefreshTrigger(t => t + 1)
  }
  
  function handleRemove(id) {
    removeFromQueue(id)
    setRefreshTrigger(t => t + 1)
  }
  
  function handleCleanup() {
    cleanupQueue(5)
    setRefreshTrigger(t => t + 1)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="queue-modal-overlay" onClick={onClose}>
      <div className="queue-modal" onClick={e => e.stopPropagation()}>
        <div className="queue-modal-header">
          <h2>🔄 Cola de Procesamiento</h2>
          <div className="header-actions">
            <button className="btn-cleanup" onClick={handleCleanup}>
              🧹 Limpiar
            </button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="queue-modal-body">
          <QueueSection
            title="Offline"
            type="offline"
            items={queues.offline}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onRemove={handleRemove}
          />
          
          <QueueSection
            title="Online"
            type="online"
            items={queues.online}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onRemove={handleRemove}
          />
        </div>
        
        <div className="queue-modal-footer">
          <p className="queue-info">
            💡 Los items offline se procesan localmente. 
            Los online usan Whisper API (requiere internet).
          </p>
        </div>
      </div>
    </div>
  )
}
