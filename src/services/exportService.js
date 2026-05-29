// Export Service - Exportar transcripciones a archivos

// Exportar transcripción a .txt
export function exportToTxt(text, filename = 'transcripcion') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.txt`
  link.click()
  
  URL.revokeObjectURL(url)
}

// Exportar transcripción con metadatos
export function exportToTxtWithMetadata(transcription, metadata = {}) {
  const {
    filename = 'transcripcion',
    date = new Date().toISOString(),
    engine = 'desconocido',
    language = 'es',
  } = metadata
  
  const content = `
=====================================
TRANSCRIPCIÓN - Robin App
=====================================

Fecha: ${new Date(date).toLocaleString('es-ES')}
Motor: ${engine}
Idioma: ${language}

-------------------------------------
TEXTO TRANSCRITO
-------------------------------------

${transcription}

-------------------------------------
Fin de la transcripción
=====================================
`.trim()
  
  exportToTxt(content, filename)
}

// Exportar historial completo a JSON
export function exportHistoryToJSON(history) {
  const blob = new Blob([JSON.stringify(history, null, 2)], { 
    type: 'application/json;charset=utf-8' 
  })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `historial-robin-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  
  URL.revokeObjectURL(url)
}

// Exportar historial a CSV
export function exportHistoryToCSV(history) {
  const headers = ['ID', 'Fecha', 'Archivo', 'Motor', 'Duración (s)', 'Costo (USD)', 'Texto']
  
  const rows = history.map(item => [
    item.id,
    new Date(item.date).toLocaleString('es-ES'),
    item.filename || 'N/A',
    item.engine || 'N/A',
    item.duration || 0,
    item.cost || 0,
    `"${(item.text || '').replace(/"/g, '""')}"`,
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `historial-robin-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  URL.revokeObjectURL(url)
}

// Compartir transcripción (Web Share API)
export async function shareTranscription(text, title = 'Transcripción Robin') {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      })
      return { success: true }
    } catch (e) {
      if (e.name === 'AbortError') {
        return { success: false, error: 'cancelled' }
      }
      return { success: false, error: e.message }
    }
  } else {
    // Fallback: copiar al clipboard
    try {
      await navigator.clipboard.writeText(text)
      return { success: true, fallback: 'clipboard' }
    } catch (e) {
      return { success: false, error: 'Web Share no soportado' }
    }
  }
}

// Copiar al clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return { success: true }
  } catch (e) {
    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return { success: true }
    } catch (e2) {
      document.body.removeChild(textarea)
      return { success: false, error: e.message }
    }
  }
}

// Descargar audio (si está disponible)
export function downloadAudio(audioBlob, filename = 'audio') {
  if (!audioBlob) return
  
  const url = URL.createObjectURL(audioBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.m4a`
  link.click()
  
  URL.revokeObjectURL(url)
}

// Obtener formatos de exportación soportados
export function getSupportedFormats() {
  return {
    txt: {
      extension: '.txt',
      mimeType: 'text/plain;charset=utf-8',
      description: 'Texto plano',
    },
    json: {
      extension: '.json',
      mimeType: 'application/json;charset=utf-8',
      description: 'JSON con metadatos',
    },
    csv: {
      extension: '.csv',
      mimeType: 'text/csv;charset=utf-8',
      description: 'CSV para Excel/Sheets',
    },
  }
}
