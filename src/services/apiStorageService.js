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

export async function saveApiKey(key) {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: KEYS.API_KEY, value: key })
    } else {
      localStorage.setItem(KEYS.API_KEY, key)
    }
  } catch (e) {
    console.error('Error saving API key:', e)
    localStorage.setItem(KEYS.API_KEY, key)
  }
}

export async function getApiKey() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const result = await Preferences.get({ key: KEYS.API_KEY })
      return result.value
    } else {
      return localStorage.getItem(KEYS.API_KEY)
    }
  } catch (e) {
    console.error('Error getting API key:', e)
    return localStorage.getItem(KEYS.API_KEY)
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
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: KEYS.BASE_URL, value: url })
    } else {
      localStorage.setItem(KEYS.BASE_URL, url)
    }
  } catch (e) {
    console.error('Error saving base URL:', e)
    localStorage.setItem(KEYS.BASE_URL, url)
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
