// History Service - Historial de transcripciones mejorado

const HISTORY_KEY = 'robin_history_v2'
const MAX_HISTORY = 50

// Obtener historial
export function getHistory() {
  const stored = localStorage.getItem(HISTORY_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

// Agregar al historial
export function addToHistory(item) {
  const history = getHistory()
  
  const historyItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    ...item,
  }
  
  // Agregar al inicio
  history.unshift(historyItem)
  
  // Limitar tamaño
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY)
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return historyItem
}

// Obtener item por ID
export function getHistoryItem(id) {
  const history = getHistory()
  return history.find(item => item.id === id)
}

// Eliminar item del historial
export function removeFromHistory(id) {
  const history = getHistory()
  const newHistory = history.filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
}

// Limpiar historial completo
export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// Buscar en historial
export function searchHistory(query) {
  const history = getHistory()
  const lowerQuery = query.toLowerCase()
  
  return history.filter(item => {
    const textMatch = item.text?.toLowerCase().includes(lowerQuery)
    const filenameMatch = item.filename?.toLowerCase().includes(lowerQuery)
    const engineMatch = item.engine?.toLowerCase().includes(lowerQuery)
    
    return textMatch || filenameMatch || engineMatch
  })
}

// Filtrar por engine
export function filterByEngine(engine) {
  const history = getHistory()
  if (!engine || engine === 'all') return history
  return history.filter(item => item.engine === engine)
}

// Filtrar por fecha
export function filterByDate(startDate, endDate) {
  const history = getHistory()
  
  const start = startDate ? new Date(startDate).getTime() : 0
  const end = endDate ? new Date(endDate).getTime() : Date.now()
  
  return history.filter(item => {
    const itemDate = new Date(item.date).getTime()
    return itemDate >= start && itemDate <= end
  })
}

// Obtener estadísticas del historial
export function getHistoryStats() {
  const history = getHistory()
  
  const byEngine = {}
  history.forEach(item => {
    const engine = item.engine || 'unknown'
    if (!byEngine[engine]) {
      byEngine[engine] = 0
    }
    byEngine[engine]++
  })
  
  const totalDuration = history.reduce((sum, item) => sum + (item.duration || 0), 0)
  const totalCost = history.reduce((sum, item) => sum + (item.cost || 0), 0)
  
  return {
    total: history.length,
    byEngine,
    totalDuration,
    totalCost,
    oldest: history.length > 0 ? history[history.length - 1].date : null,
    newest: history.length > 0 ? history[0].date : null,
  }
}

// Exportar historial
export function exportHistory(format = 'json') {
  const history = getHistory()
  
  if (format === 'json') {
    return JSON.stringify(history, null, 2)
  }
  
  if (format === 'csv') {
    const headers = ['ID', 'Fecha', 'Archivo', 'Motor', 'Duración', 'Costo', 'Texto']
    const rows = history.map(item => [
      item.id,
      new Date(item.date).toLocaleString('es-ES'),
      item.filename || 'N/A',
      item.engine || 'N/A',
      item.duration || 0,
      item.cost || 0,
      `"${(item.text || '').replace(/"/g, '""')}"`,
    ])
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }
  
  return JSON.stringify(history, null, 2)
}

// Obtener últimos N items
export function getRecent(count = 10) {
  const history = getHistory()
  return history.slice(0, count)
}

// Marcar item como favorito
export function toggleFavorite(id) {
  const history = getHistory()
  const index = history.findIndex(item => item.id === id)
  
  if (index !== -1) {
    history[index].favorite = !history[index].favorite
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return history[index].favorite
  }
  
  return false
}

// Obtener favoritos
export function getFavorites() {
  const history = getHistory()
  return history.filter(item => item.favorite)
}
