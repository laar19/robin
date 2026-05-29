import { Capacitor } from '@capacitor/core'

const KEYS = {
  API_KEY: 'whisper_api_key',
  BASE_URL: 'whisper_base_url',
  MODEL: 'whisper_model',
}

const DEFAULTS = {
  BASE_URL: 'https://api.openai.com/v1',
  MODEL: 'whisper-large-v3',
}

// Simple XOR encryption for basic obfuscation (not cryptographically secure)
// For production, use Android Keystore via native plugin
function simpleEncrypt(text) {
  const key = 'robin_app_key_2024'
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

function simpleDecrypt(encrypted) {
  try {
    const key = 'robin_app_key_2024'
    const decrypted = atob(encrypted)
    let result = ''
    for (let i = 0; i < decrypted.length; i++) {
      result += String.fromCharCode(decrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch (e) {
    return encrypted
  }
}

export function validateApiKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API Key es requerida' }
  }
  
  const trimmed = key.trim()
  
  if (trimmed.length < 20) {
    return { valid: false, error: 'API Key demasiado corta' }
  }
  
  if (!trimmed.startsWith('sk-') && !trimmed.startsWith('http')) {
    return { 
      valid: false, 
      error: 'Formato inválido. Debe comenzar con "sk-" o ser una URL de proxy' 
    }
  }
  
  return { valid: true, error: null }
}

export function validateBaseUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL es requerida' }
  }
  
  const trimmed = url.trim()
  
  if (!trimmed.startsWith('https://')) {
    return { 
      valid: false, 
      error: 'URL debe comenzar con https:// para seguridad' 
    }
  }
  
  try {
    new URL(trimmed)
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: 'URL inválida' }
  }
}

export async function saveApiKey(key) {
  const validation = validateApiKey(key)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const encrypted = simpleEncrypt(key.trim())
      await Preferences.set({ key: KEYS.API_KEY, value: encrypted })
    } else {
      localStorage.setItem(KEYS.API_KEY, simpleEncrypt(key.trim()))
    }
  } catch (e) {
    console.error('Error saving API key:', e)
    localStorage.setItem(KEYS.API_KEY, simpleEncrypt(key.trim()))
  }
}

export async function getApiKey() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const result = await Preferences.get({ key: KEYS.API_KEY })
      return result.value ? simpleDecrypt(result.value) : null
    } else {
      const stored = localStorage.getItem(KEYS.API_KEY)
      return stored ? simpleDecrypt(stored) : null
    }
  } catch (e) {
    console.error('Error getting API key:', e)
    const stored = localStorage.getItem(KEYS.API_KEY)
    return stored ? simpleDecrypt(stored) : null
  }
}

export async function deleteApiKey() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key: KEYS.API_KEY })
    } else {
      localStorage.removeItem(KEYS.API_KEY)
    }
  } catch (e) {
    console.error('Error deleting API key:', e)
    localStorage.removeItem(KEYS.API_KEY)
  }
}

export async function saveBaseUrl(url) {
  const validation = validateBaseUrl(url)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: KEYS.BASE_URL, value: url.trim() })
    } else {
      localStorage.setItem(KEYS.BASE_URL, url.trim())
    }
  } catch (e) {
    console.error('Error saving base URL:', e)
    localStorage.setItem(KEYS.BASE_URL, url.trim())
  }
}

export async function getBaseUrl() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const result = await Preferences.get({ key: KEYS.BASE_URL })
      return result.value || DEFAULTS.BASE_URL
    } else {
      return localStorage.getItem(KEYS.BASE_URL) || DEFAULTS.BASE_URL
    }
  } catch (e) {
    console.error('Error getting base URL:', e)
    return DEFAULTS.BASE_URL
  }
}

export async function saveModel(model) {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: KEYS.MODEL, value: model })
    } else {
      localStorage.setItem(KEYS.MODEL, model)
    }
  } catch (e) {
    console.error('Error saving model:', e)
    localStorage.setItem(KEYS.MODEL, model)
  }
}

export async function getModel() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const result = await Preferences.get({ key: KEYS.MODEL })
      return result.value || DEFAULTS.MODEL
    } else {
      return localStorage.getItem(KEYS.MODEL) || DEFAULTS.MODEL
    }
  } catch (e) {
    console.error('Error getting model:', e)
    return DEFAULTS.MODEL
  }
}

export async function getAllConfig() {
  const [apiKey, baseUrl, model] = await Promise.all([
    getApiKey(),
    getBaseUrl(),
    getModel(),
  ])
  return { apiKey, baseUrl, model }
}

export async function saveAllConfig(config) {
  await Promise.all([
    config.apiKey ? saveApiKey(config.apiKey) : Promise.resolve(),
    config.baseUrl ? saveBaseUrl(config.baseUrl) : Promise.resolve(),
    config.model ? saveModel(config.model) : Promise.resolve(),
  ])
}

export function isApiKeyConfigured() {
  return getApiKey().then(key => !!key)
}
