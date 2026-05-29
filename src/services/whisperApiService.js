import axios from 'axios'

let abortController = null

// Whisper API pricing (per minute of audio)
// Updated as of 2024, verify current pricing at platform.openai.com
const PRICING = {
  'whisper-large-v3': 0.0006,
  'whisper-large-v3-turbo': 0.0003,
  'whisper-1': 0.0006,
}

export function estimateCost(durationSeconds, model = 'whisper-large-v3') {
  const pricePerMinute = PRICING[model] || PRICING['whisper-1']
  const minutes = durationSeconds / 60
  return (minutes * pricePerMinute).toFixed(4)
}

export function estimateCostFromFile(file, model = 'whisper-large-v3') {
  // Rough estimate: 1MB ≈ 1 minute of audio (varies by codec)
  const sizeMB = file.size / (1024 * 1024)
  const estimatedMinutes = sizeMB
  return estimateCost(estimatedMinutes * 60, model)
}

export async function transcribeAudio(file, options = {}) {
  const {
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'whisper-large-v3',
    language = 'es',
    onProgress,
  } = options

  if (!apiKey) {
    throw new Error('API key is required')
  }

  abortController = new AbortController()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', model)
  formData.append('language', language)
  formData.append('response_format', 'verbose_json')

  try {
    const response = await axios.post(`${baseUrl}/audio/transcriptions`, formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
      signal: abortController.signal,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000,
    })

    return {
      text: response.data.text,
      language: response.data.language,
      duration: response.data.duration,
      segments: response.data.segments,
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Transcription cancelled')
    }
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`)
    }
    throw new Error(`Network Error: ${error.message}`)
  }
}

export function cancelTranscription() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

export async function testConnection(apiKey, baseUrl = 'https://api.openai.com/v1') {
  try {
    const response = await axios.get(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    })
    return { success: true, models: response.data.data }
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        error: `API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Invalid API key'}` 
      }
    }
    return { success: false, error: `Connection Error: ${error.message}` }
  }
}

export const WHISPER_MODELS = [
  { 
    value: 'whisper-large-v3', 
    label: 'Whisper Large v3',
    description: 'Mayor precisión, más lento',
    price: '$0.0006/min'
  },
  { 
    value: 'whisper-large-v3-turbo', 
    label: 'Whisper Large v3 Turbo',
    description: 'Más rápido, buena precisión',
    price: '$0.0003/min'
  },
  { 
    value: 'whisper-1', 
    label: 'Whisper-1',
    description: 'Modelo default',
    price: '$0.0006/min'
  },
]

export function getModelPricing(model) {
  return PRICING[model] || PRICING['whisper-1']
}
