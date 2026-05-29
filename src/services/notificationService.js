import { Capacitor } from '@capacitor/core'
import { registerPlugin } from '@capacitor/core'

const NotificationPlugin = Capacitor.isNativePlatform()
  ? registerPlugin('NotificationPlugin')
  : null

export async function showTranscriptionComplete(options = {}) {
  const {
    title = 'Transcripción Completa',
    message = 'Tu archivo ha sido procesado',
    transcriptionId = '',
  } = options
  
  if (!NotificationPlugin) {
    // Fallback: browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon.png',
        badge: '/badge.png',
      })
    }
    return { success: true, notificationId: 0 }
  }
  
  try {
    const result = await NotificationPlugin.showTranscriptionComplete({
      title,
      message,
      transcriptionId,
    })
    return result
  } catch (e) {
    console.error('Notification failed:', e)
    return { success: false, error: e.message }
  }
}

export async function showTranscriptionProgress(options = {}) {
  const {
    progress = 0,
    title = 'Procesando...',
    transcriptionId = '',
  } = options
  
  if (!NotificationPlugin) {
    return { success: true, notificationId: 0 }
  }
  
  try {
    const result = await NotificationPlugin.showTranscriptionProgress({
      progress,
      title,
      transcriptionId,
    })
    return result
  } catch (e) {
    console.error('Progress notification failed:', e)
    return { success: false, error: e.message }
  }
}

export async function cancelNotification(notificationId) {
  if (!NotificationPlugin) {
    return
  }
  
  try {
    await NotificationPlugin.cancelNotification({ notificationId })
  } catch (e) {
    console.error('Cancel notification failed:', e)
  }
}

export async function cancelAllNotifications() {
  if (!NotificationPlugin) {
    return
  }
  
  try {
    await NotificationPlugin.cancelAllNotifications()
  } catch (e) {
    console.error('Cancel all notifications failed:', e)
  }
}

export async function requestPermission() {
  if (!NotificationPlugin) {
    // Browser notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return { granted: permission === 'granted' }
    }
    return { granted: false }
  }
  
  try {
    const result = await NotificationPlugin.requestPermission()
    return result
  } catch (e) {
    return { granted: false, error: e.message }
  }
}

export async function checkPermission() {
  if ('Notification' in window) {
    return {
      granted: Notification.permission === 'granted',
      status: Notification.permission,
    }
  }
  
  if (!NotificationPlugin) {
    return { granted: false }
  }
  
  try {
    const result = await NotificationPlugin.requestPermission()
    return { granted: result.granted, status: result.granted ? 'granted' : 'denied' }
  } catch (e) {
    return { granted: false, error: e.message }
  }
}
