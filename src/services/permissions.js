import { Capacitor } from '@capacitor/core'
import { PermissionsPlugin } from '@capacitor/android'

export async function requestPermissions() {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await PermissionsPlugin.requestPermissions({
        permissions: ['RECORD_AUDIO']
      })
      return result
    } catch (e) {
      console.error('Permission request failed:', e)
      return { permissions: [] }
    }
  }
  return { permissions: [] }
}

export async function checkPermissions() {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await PermissionsPlugin.checkPermissions({
        permissions: ['RECORD_AUDIO']
      })
      return result
    } catch (e) {
      console.error('Permission check failed:', e)
      return { permissions: [] }
    }
  }
  return { permissions: [] }
}
