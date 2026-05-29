import { useState, useEffect } from 'react'
import { 
  getHistory, 
  removeFromHistory, 
  clearHistory,
  searchHistory,
  filterByEngine,
  toggleFavorite,
  getFavorites,
} from '../services/historyService'
import { copyToClipboard, shareTranscription, exportToTxtWithMetadata, exportHistoryToJSON, exportHistoryToCSV } from '../services/exportService'

function HistoryItem({ item, onRemove, onFavorite }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const engineIcon = item.engine === 'whisper-api' ? '☁️' : '📱'
  const engineName = item.engine === 'whisper-api' 
    ? `Whisper API (${item.model || 'large-v3'})`
    : item.engine?.charAt(0).toUpperCase() + item.engine?.slice(1)
  
  async function handleCopy() {
    await copyToClipboard(item.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  async function handleShare() {
    await shareTranscription(item.text, `Transcripción - ${item.filename}`)
  }
  
  async function handleExport() {
    exportToTxtWithMetadata(item.text, {
      filename: item.filename || 'transcripcion',
      date: item.date,
      engine: engineName,
      language: item.language || 'es',
    })
  }
  
  return (
    <div className={`history-item ${expanded ? 'expanded' : ''} ${item.favorite ? 'favorite' : ''}`}>
      <div className="history-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="history-item-status">
          {item.favorite && <span className="favorite-star">⭐</span>}
          <span className="file-icon">{item.filename?.includes('video') || item.isVideo ? '📹' : '🎵'}</span>
        </div>
        
        <div className="history-item-info">
          <div className="history-item-name">
            <span className="filename">{item.filename || 'Sin nombre'}</span>
            <span className={`engine-badge ${item.engine === 'whisper-api' ? 'online' : 'offline'}`}>
              {engineIcon} {engineName}
            </span>
          </div>
          <div className="history-item-meta">
            <span className="date">{new Date(item.date).toLocaleDateString('es-ES')}</span>
            <span className="time">{new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            {item.duration && <span className="duration">{item.duration}s</span>}
            {item.cost && <span className="cost">${item.cost.toFixed(4)}</span>}
          </div>
        </div>
        
        <div className="history-item-actions">
          <button 
            className="btn-favorite" 
            onClick={(e) => { e.stopPropagation(); onFavorite(item.id) }}
            title={item.favorite ? 'Quitar favorito' : 'Marcar favorito'}
          >
            {item.favorite ? '⭐' : '☆'}
          </button>
          <button 
            className="btn-remove" 
            onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="history-item-details">
          <div className="transcription-text">
            <p>{item.text}</p>
          </div>
          
          <div className="history-item-actions-expanded">
            <button className="btn-action" onClick={handleCopy}>
              {copied ? '✅ Copiado' : '📋 Copiar'}
            </button>
            <button className="btn-action" onClick={handleShare}>
              📤 Compartir
            </button>
            <button className="btn-action" onClick={handleExport}>
              💾 Exportar .txt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryList({ isOpen, onClose }) {
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [engineFilter, setEngineFilter] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, refreshTrigger])
  
  useEffect(() => {
    filterHistory()
  }, [history, searchQuery, engineFilter, showFavoritesOnly])
  
  function loadHistory() {
    if (showFavoritesOnly) {
      setHistory(getFavorites())
    } else {
      setHistory(getHistory())
    }
  }
  
  function filterHistory() {
    let result = history
    
    if (searchQuery) {
      result = searchHistory(searchQuery)
    }
    
    if (engineFilter !== 'all') {
      result = filterByEngine(engineFilter)
    }
    
    if (showFavoritesOnly) {
      result = getFavorites()
    }
    
    setFilteredHistory(result)
  }
  
  function handleRemove(id) {
    removeFromHistory(id)
    setRefreshTrigger(t => t + 1)
  }
  
  function handleFavorite(id) {
    toggleFavorite(id)
    setRefreshTrigger(t => t + 1)
  }
  
  function handleClearAll() {
    if (confirm('¿Estás seguro de eliminar todo el historial?')) {
      clearHistory()
      setRefreshTrigger(t => t + 1)
    }
  }
  
  function handleExportJSON() {
    const data = exportHistoryToJSON(history)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-robin-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  function handleExportCSV() {
    const data = exportHistoryToCSV(history)
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-robin-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={e => e.stopPropagation()}>
        <div className="history-modal-header">
          <h2>📜 Historial de Transcripciones</h2>
          <div className="header-actions">
            <button className="btn-export" onClick={handleExportJSON} title="Exportar JSON">
              📄 JSON
            </button>
            <button className="btn-export" onClick={handleExportCSV} title="Exportar CSV">
              📊 CSV
            </button>
            <button className="btn-clear" onClick={handleClearAll} title="Limpiar todo">
              🧹 Limpiar
            </button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="history-filters">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Buscar en historial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          
          <select 
            className="engine-filter"
            value={engineFilter}
            onChange={e => setEngineFilter(e.target.value)}
          >
            <option value="all">Todos los motores</option>
            <option value="vosk">Vosk</option>
            <option value="whisper">Whisper tiny</option>
            <option value="whisper-api">Whisper API</option>
          </select>
          
          <button 
            className={`btn-favorites ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            ⭐ Favoritos
          </button>
        </div>
        
        <div className="history-stats">
          <span>{filteredHistory.length} items</span>
          {showFavoritesOnly && <span>(solo favoritos)</span>}
        </div>
        
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="history-empty">
              <p>No hay items en el historial</p>
              {searchQuery && <p>Intenta con otra búsqueda</p>}
            </div>
          ) : (
            filteredHistory.map(item => (
              <HistoryItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onFavorite={handleFavorite}
              />
            ))
          )}
        </div>
        
        <div className="history-modal-footer">
          <p className="history-info">
            💡 El historial guarda las últimas {50} transcripciones.
            Los favoritos no se eliminan al limpiar.
          </p>
        </div>
      </div>
    </div>
  )
}
