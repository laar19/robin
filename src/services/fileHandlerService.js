import { Capacitor } from '@capacitor/core'
import { registerPlugin } from '@capacitor/core'

const FileHandlerPlugin = Capacitor.isNativePlatform()
  ? registerPlugin('FileHandler')
  : null

const AudioExtractorPlugin = Capacitor.isNativePlatform()
  ? registerPlugin('AudioExtractor')
  : null

// File size limits (in bytes)
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB default
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos

export async function getSharedFile() {
  if (!FileHandlerPlugin) {
    return null
  }
  try {
    const result = await FileHandlerPlugin.getSharedFile()
    return result
  } catch (e) {
    console.error('Error getting shared file:', e)
    return null
  }
}

export async function clearSharedFile() {
  if (!FileHandlerPlugin) return
  try {
    await FileHandlerPlugin.clearSharedFile()
  } catch (e) {
    console.error('Error clearing shared file:', e)
  }
}

export async function extractAudioFromVideo(videoUri, onProgress) {
  if (!AudioExtractorPlugin) {
    throw new Error('AudioExtractor plugin not available')
  }
  
  try {
    const result = await AudioExtractorPlugin.extractAudio({
      videoUri,
      outputDir: 'cache',
    })
    return result
  } catch (e) {
    throw new Error(`Error extracting audio: ${e.message}`)
  }
}

export async function cancelAudioExtraction() {
  if (!AudioExtractorPlugin) return
  try {
    await AudioExtractorPlugin.cancelExtraction()
  } catch (e) {
    console.error('Error canceling extraction:', e)
  }
}

export async function cleanupExtractedFile(audioPath) {
  if (!AudioExtractorPlugin) return
  try {
    await AudioExtractorPlugin.cleanup({ filePath: audioPath })
  } catch (e) {
    console.error('Error cleaning up file:', e)
  }
}

export function getFileIcon(type) {
  if (type?.startsWith('video/')) return '📹'
  if (type?.startsWith('audio/')) return '🎵'
  return '📄'
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(2)} MB`
}

export function validateFileSize(file) {
  if (!file?.size) {
    return { valid: true, error: null }
  }
  
  const isVideo = file.type?.startsWith('video/')
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE
  const maxMB = maxSize / (1024 * 1024)
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo ${maxMB}MB. Este archivo: ${formatFileSize(file.size)}`
    }
  }
  
  return { valid: true, error: null }
}

export function getSupportedFormats() {
  return {
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm', 'opus'],
    video: ['mp4', 'mkv', 'avi', 'webm', 'mov', '3gp'],
  }
}

export function isSupportedFile(file) {
  const type = file?.type
  if (!type) return false
  
  const formats = getSupportedFormats()
  const ext = type.split('/')[1]?.toLowerCase()
  
  return type.startsWith('audio/') || type.startsWith('video/')
}

export function getSupportedFormatsList() {
  const formats = getSupportedFormats()
  return {
    audio: formats.audio.map(f => `.${f}`).join(', '),
    video: formats.video.map(f => `.${f}`).join(', '),
  }
}

export function getMaxFileSize() {
  return {
    audio: MAX_FILE_SIZE,
    video: MAX_VIDEO_SIZE,
    audioFormatted: formatFileSize(MAX_FILE_SIZE),
    videoFormatted: formatFileSize(MAX_VIDEO_SIZE),
  }
}
