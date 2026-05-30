import { Capacitor } from '@capacitor/core'

export async function requestPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { permissions: [] }
  }
  
  // On Android native, permissions are requested automatically
  // when plugins try to access protected features (like microphone)
  // The native MainActivity.java explicitly requests RECORD_AUDIO permission
  return { 
    permissions: [{ 
      permission: 'RECORD_AUDIO', 
      status: 'granted' 
    }] 
  }
}

export async function checkPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { permissions: [] }
  }
  
  return { 
    permissions: [{ 
      permission: 'RECORD_AUDIO', 
      status: 'granted' 
    }] 
  }
}
