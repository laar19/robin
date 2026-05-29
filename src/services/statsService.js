// Stats Service - Estadísticas de uso de API y procesamiento

const STATS_KEY = 'robin_stats_v1'

function getStats() {
  const stored = localStorage.getItem(STATS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  
  return {
    totalTranscriptions: 0,
    apiTranscriptions: 0,
    offlineTranscriptions: 0,
    totalApiCost: 0,
    totalAudioProcessed: 0, // en segundos
    byEngine: {
      'vosk': { count: 0, seconds: 0 },
      'whisper': { count: 0, seconds: 0 },
      'whisper-api': { count: 0, seconds: 0, cost: 0 },
      'piper': { count: 0, seconds: 0 },
      'android-tts': { count: 0, seconds: 0 },
    },
    byModel: {},
    dailyUsage: {}, // { '2024-01-15': { count: 5, apiCost: 0.03 } }
    lastUpdated: new Date().toISOString(),
  }
}

function saveStats(stats) {
  stats.lastUpdated = new Date().toISOString()
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

// Registrar transcripción completada
export function recordTranscription(engine, model = null, duration = 0, cost = 0) {
  const stats = getStats()
  
  stats.totalTranscriptions++
  stats.totalAudioProcessed += duration
  
  if (engine === 'whisper-api') {
    stats.apiTranscriptions++
    stats.totalApiCost += cost
  } else {
    stats.offlineTranscriptions++
  }
  
  // Por engine
  if (!stats.byEngine[engine]) {
    stats.byEngine[engine] = { count: 0, seconds: 0 }
  }
  stats.byEngine[engine].count++
  stats.byEngine[engine].seconds += duration
  
  if (engine === 'whisper-api') {
    stats.byEngine[engine].cost = (stats.byEngine[engine].cost || 0) + cost
  }
  
  // Por modelo
  if (model) {
    if (!stats.byModel[model]) {
      stats.byModel[model] = { count: 0, seconds: 0, cost: 0 }
    }
    stats.byModel[model].count++
    stats.byModel[model].seconds += duration
    if (cost > 0) {
      stats.byModel[model].cost += cost
    }
  }
  
  // Daily usage
  const today = new Date().toISOString().split('T')[0]
  if (!stats.dailyUsage[today]) {
    stats.dailyUsage[today] = { count: 0, apiCost: 0, seconds: 0 }
  }
  stats.dailyUsage[today].count++
  stats.dailyUsage[today].seconds += duration
  if (cost > 0) {
    stats.dailyUsage[today].apiCost += cost
  }
  
  saveStats(stats)
}

// Obtener estadísticas completas
export function getStatsSummary() {
  const stats = getStats()
  
  // Calcular últimos 7 días
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStats = stats.dailyUsage[dateStr] || { count: 0, apiCost: 0, seconds: 0 }
    
    last7Days.push({
      date: dateStr,
      dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      count: dayStats.count,
      apiCost: dayStats.apiCost,
      seconds: dayStats.seconds,
    })
  }
  
  return {
    ...stats,
    last7Days,
    avgDailyTranscriptions: stats.totalTranscriptions / Math.max(1, Object.keys(stats.dailyUsage).length),
    avgApiCostPerDay: stats.totalApiCost / Math.max(1, Object.keys(stats.dailyUsage).length),
  }
}

// Obtener estadísticas de costo
export function getApiCostStats() {
  const stats = getStats()
  
  return {
    totalCost: stats.totalApiCost,
    byModel: Object.entries(stats.byModel).map(([model, data]) => ({
      model,
      cost: data.cost || 0,
      count: data.count,
    })),
    dailyAverage: stats.totalApiCost / Math.max(1, Object.keys(stats.dailyUsage).length),
    monthlyEstimate: (stats.totalApiCost / Math.max(1, Object.keys(stats.dailyUsage).length)) * 30,
  }
}

// Resetear estadísticas
export function resetStats() {
  localStorage.removeItem(STATS_KEY)
  return getStats()
}

// Exportar estadísticas a JSON
export function exportStats() {
  const stats = getStats()
  return JSON.stringify(stats, null, 2)
}

// Predecir costo mensual basado en uso actual
export function predictMonthlyCost() {
  const stats = getStats()
  const days = Object.keys(stats.dailyUsage).length || 1
  const dailyAvg = stats.totalApiCost / days
  return dailyAvg * 30
}

// Obtener engine más usado
export function getMostUsedEngine() {
  const stats = getStats()
  let maxCount = 0
  let mostUsed = 'vosk'
  
  Object.entries(stats.byEngine).forEach(([engine, data]) => {
    if (data.count > maxCount) {
      maxCount = data.count
      mostUsed = engine
    }
  })
  
  return mostUsed
}
