import { Capacitor } from '@capacitor/core'

export async function requestPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { permissions: [] }
  }
  
  // En Android nativo, los permisos se piden automáticamente cuando se usa el micrófono
  // Retornamos true asumiendo que el usuario concedió el permiso al instalar/abrir
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
