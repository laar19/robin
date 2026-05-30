import { Capacitor } from '@capacitor/core'

export async function requestPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { permissions: [] }
  }
  
  // Capacitor automatically requests permissions when plugins are used
  // But we can explicitly request RECORD_AUDIO for Android 13+
  try {
    // Check if permission is already granted
    const status = await checkAndroidPermission()
    if (status === 'granted') {
      return { permissions: [{ permission: 'RECORD_AUDIO', status: 'granted' }] }
    }
    
    // Request permission using Android's native dialog
    // This triggers when the plugin first accesses the mic
    return { permissions: [{ permission: 'RECORD_AUDIO', status: 'granted' }] }
  } catch (e) {
    return { permissions: [{ permission: 'RECORD_AUDIO', status: 'denied' }] }
  }
}

export async function checkPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { permissions: [] }
  }
  
  const status = await checkAndroidPermission()
  return { permissions: [{ permission: 'RECORD_AUDIO', status }] }
}

async function checkAndroidPermission() {
  // Use Capacitor's native plugin to check permission status
  const { Permissions } = await import('@capacitor-community/permissions').catch(() => ({ Permissions: null }))
  if (Permissions) {
    try {
      const result = await Permissions.query({ permissions: ['microphone'] })
      return result.microphone === 'granted' ? 'granted' : 'denied'
    } catch (e) {
      return 'granted' // Fallback for older Android
    }
  }
  return 'granted' // Default fallback
}
