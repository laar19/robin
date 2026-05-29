// Queue Service - Gestión de colas de procesamiento
// 2 colas separadas: offline y online

const QUEUES = {
  OFFLINE: 'offline_queue',
  ONLINE: 'online_queue',
}

const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

// Obtener colas de localStorage
export function getQueues() {
  const offline = JSON.parse(localStorage.getItem(QUEUES.OFFLINE) || '[]')
  const online = JSON.parse(localStorage.getItem(QUEUES.ONLINE) || '[]')
  return { offline, online }
}

// Guardar colas en localStorage
function saveQueues(offline, online) {
  localStorage.setItem(QUEUES.OFFLINE, JSON.stringify(offline))
  localStorage.setItem(QUEUES.ONLINE, JSON.stringify(online))
}

// Agregar item a la cola
export function addToQueue(item) {
  const { offline, online } = getQueues()
  
  const queueItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    status: STATUS.PENDING,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item,
  }
  
  // Determinar cola según si es online u offline
  const isOnline = item.engine === 'whisper-api'
  const targetQueue = isOnline ? online : offline
  
  targetQueue.push(queueItem)
  saveQueues(offline, online)
  
  return queueItem
}

// Obtener siguiente item pendiente de una cola
export function getNextPending(queueType) {
  const { offline, online } = getQueues()
  const queue = queueType === 'online' ? online : offline
  
  return queue.find(item => item.status === STATUS.PENDING)
}

// Actualizar estado de un item
export function updateItemStatus(id, status, progress = null, error = null) {
  const { offline, online } = getQueues()
  
  const updateInQueue = (queue) => {
    const index = queue.findIndex(item => item.id === id)
    if (index !== -1) {
      queue[index].status = status
      queue[index].updatedAt = new Date().toISOString()
      if (progress !== null) queue[index].progress = progress
      if (error !== null) queue[index].error = error
      return true
    }
    return false
  }
  
  if (!updateInQueue(offline)) {
    updateInQueue(online)
  }
  
  saveQueues(offline, online)
}

// Eliminar item de la cola
export function removeFromQueue(id) {
  const { offline, online } = getQueues()
  
  const newOffline = offline.filter(item => item.id !== id)
  const newOnline = online.filter(item => item.id !== id)
  
  saveQueues(newOffline, newOnline)
}

// Limpiar cola completada/failed
export function cleanupQueue(keepLast = 10) {
  const { offline, online } = getQueues()
  
  // Mantener solo los últimos X completados
  const completedOffline = offline.filter(item => item.status === STATUS.COMPLETED)
  const completedOnline = online.filter(item => item.status === STATUS.COMPLETED)
  
  const newOffline = [
    ...offline.filter(item => item.status !== STATUS.COMPLETED),
    ...completedOffline.slice(-keepLast),
  ]
  
  const newOnline = [
    ...online.filter(item => item.status !== STATUS.COMPLETED),
    ...completedOnline.slice(-keepLast),
  ]
  
  saveQueues(newOffline, newOnline)
}

// Obtener estadísticas de colas
export function getQueueStats() {
  const { offline, online } = getQueues()
  
  const countByStatus = (queue, status) => 
    queue.filter(item => item.status === status).length
  
  return {
    offline: {
      total: offline.length,
      pending: countByStatus(offline, STATUS.PENDING),
      processing: countByStatus(offline, STATUS.PROCESSING),
      completed: countByStatus(offline, STATUS.COMPLETED),
      failed: countByStatus(offline, STATUS.FAILED),
    },
    online: {
      total: online.length,
      pending: countByStatus(online, STATUS.PENDING),
      processing: countByStatus(online, STATUS.PROCESSING),
      completed: countByStatus(online, STATUS.COMPLETED),
      failed: countByStatus(online, STATUS.FAILED),
    },
  }
}

// Cancelar todos los items pendientes
export function cancelAllPending() {
  const { offline, online } = getQueues()
  
  const cancelInQueue = (queue) => {
    return queue.map(item => {
      if (item.status === STATUS.PENDING) {
        return {
          ...item,
          status: STATUS.CANCELLED,
          updatedAt: new Date().toISOString(),
        }
      }
      return item
    })
  }
  
  const newOffline = cancelInQueue(offline)
  const newOnline = cancelInQueue(online)
  
  saveQueues(newOffline, newOnline)
}

// Pausar procesamiento (marcar todos los processing como pending)
export function pauseAllProcessing() {
  const { offline, online } = getQueues()
  
  const pauseInQueue = (queue) => {
    return queue.map(item => {
      if (item.status === STATUS.PROCESSING) {
        return {
          ...item,
          status: STATUS.PENDING,
          updatedAt: new Date().toISOString(),
        }
      }
      return item
    })
  }
  
  const newOffline = pauseInQueue(offline)
  const newOnline = pauseInQueue(online)
  
  saveQueues(newOffline, newOnline)
}

// Reintentar item fallido
export function retryItem(id) {
  const { offline, online } = getQueues()
  
  const retryInQueue = (queue) => {
    const index = queue.findIndex(item => item.id === id)
    if (index !== -1 && queue[index].status === STATUS.FAILED) {
      queue[index].status = STATUS.PENDING
      queue[index].progress = 0
      queue[index].error = null
      queue[index].updatedAt = new Date().toISOString()
      return true
    }
    return false
  }
  
  if (!retryInQueue(offline)) {
    retryInQueue(online)
  }
  
  saveQueues(offline, online)
}

export { STATUS, QUEUES }
