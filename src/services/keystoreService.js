import { Capacitor } from '@capacitor/core'
import { registerPlugin } from '@capacitor/core'

const KeystorePlugin = Capacitor.isNativePlatform()
  ? registerPlugin('KeystorePlugin')
  : null

export async function encrypt(text) {
  if (!KeystorePlugin) {
    // Fallback: simple XOR for development
    return simpleEncrypt(text)
  }
  
  try {
    const result = await KeystorePlugin.encrypt({ plaintext: text })
    return result.ciphertext
  } catch (e) {
    console.error('Keystore encryption failed, using fallback:', e)
    return simpleEncrypt(text)
  }
}

export async function decrypt(ciphertext) {
  if (!KeystorePlugin) {
    // Fallback: simple XOR for development
    return simpleDecrypt(ciphertext)
  }
  
  try {
    const result = await KeystorePlugin.decrypt({ ciphertext })
    return result.plaintext
  } catch (e) {
    console.error('Keystore decryption failed, using fallback:', e)
    return simpleDecrypt(ciphertext)
  }
}

export async function isKeyGenerated() {
  if (!KeystorePlugin) {
    return false
  }
  
  try {
    const result = await KeystorePlugin.isKeyGenerated()
    return result.generated
  } catch (e) {
    return false
  }
}

export async function deleteKey() {
  if (!KeystorePlugin) {
    return
  }
  
  try {
    await KeystorePlugin.deleteKey()
  } catch (e) {
    console.error('Error deleting key:', e)
  }
}

// Simple XOR fallback (not secure, only for development/migration)
const XOR_KEY = 'robin_app_key_2024'

function simpleEncrypt(text) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
  }
  return btoa(result)
}

function simpleDecrypt(encrypted) {
  try {
    const decrypted = atob(encrypted)
    let result = ''
    for (let i = 0; i < decrypted.length; i++) {
      result += String.fromCharCode(decrypted.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
    }
    return result
  } catch (e) {
    return encrypted
  }
}

// Migration function: convert XOR-encrypted keys to Keystore-encrypted
export async function migrateToKeystore(getXorKey, saveEncryptedKey) {
  try {
    const keyGenerated = await isKeyGenerated()
    if (keyGenerated) {
      return false // Already migrated
    }
    
    // Get XOR-encrypted key
    const xorEncrypted = await getXorKey()
    if (!xorEncrypted) {
      return false // No key to migrate
    }
    
    // Decrypt with XOR
    const plaintext = simpleDecrypt(xorEncrypted)
    
    // Encrypt with Keystore
    const keystoreEncrypted = await encrypt(plaintext)
    
    // Save new encrypted key
    await saveEncryptedKey(keystoreEncrypted)
    
    return true // Migration successful
  } catch (e) {
    console.error('Migration failed:', e)
    return false
  }
}
