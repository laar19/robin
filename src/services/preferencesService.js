// Preferences Service - Preferencias de usuario y últimos motores usados

const PREFS_KEY = 'robin_prefs_v1'

function getPrefs() {
  const stored = localStorage.getItem(PREFS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  
  return {
    lastEngine: 'vosk', // Último motor STT usado
    lastTtsEngine: 'android', // Último motor TTS usado
    lastLanguage: 'es',
    darkMode: true,
    queueAutoStart: true, // Iniciar cola automáticamente
    showNotifications: true,
    confirmBeforeProcess: true, // Confirmar antes de procesar online
    maxOnlineQueueSize: 10,
    maxOfflineQueueSize: 20,
  }
}

function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// Obtener último motor STT usado
export function getLastEngine() {
  const prefs = getPrefs()
  return prefs.lastEngine
}

// Guardar último motor STT usado
export function setLastEngine(engine) {
  const prefs = getPrefs()
  prefs.lastEngine = engine
  savePrefs(prefs)
}

// Obtener último motor TTS usado
export function getLastTtsEngine() {
  const prefs = getPrefs()
  return prefs.lastTtsEngine
}

// Guardar último motor TTS usado
export function setLastTtsEngine(engine) {
  const prefs = getPrefs()
  prefs.lastTtsEngine = engine
  savePrefs(prefs)
}

// Obtener último idioma usado
export function getLastLanguage() {
  const prefs = getPrefs()
  return prefs.lastLanguage
}

// Guardar último idioma usado
export function setLastLanguage(lang) {
  const prefs = getPrefs()
  prefs.lastLanguage = lang
  savePrefs(prefs)
}

// Obtener preferencia de modo oscuro
export function getDarkMode() {
  const prefs = getPrefs()
  return prefs.darkMode
}

// Guardar preferencia de modo oscuro
export function setDarkMode(dark) {
  const prefs = getPrefs()
  prefs.darkMode = dark
  savePrefs(prefs)
}

// Obtener todas las preferencias
export function getAllPrefs() {
  return getPrefs()
}

// Guardar todas las preferencias
export function saveAllPrefs(prefs) {
  savePrefs({ ...getPrefs(), ...prefs })
}

// Resetear preferencias a default
export function resetPrefs() {
  localStorage.removeItem(PREFS_KEY)
  return getPrefs()
}

// Verificar si debe mostrar confirmación para procesamiento online
export function shouldConfirmOnline() {
  const prefs = getPrefs()
  return prefs.confirmBeforeProcess
}

// Obtener tamaño máximo de cola online
export function getMaxOnlineQueueSize() {
  const prefs = getPrefs()
  return prefs.maxOnlineQueueSize
}

// Obtener tamaño máximo de cola offline
export function getMaxOfflineQueueSize() {
  const prefs = getPrefs()
  return prefs.maxOfflineQueueSize
}

// Verificar si auto-iniciar cola
export function shouldAutoStartQueue() {
  const prefs = getPrefs()
  return prefs.queueAutoStart
}
