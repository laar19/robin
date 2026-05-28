import { describe, it, expect, beforeEach, vi } from 'vitest'
import { requestPermissions, checkPermissions } from '../permissions'
import { Capacitor } from '@capacitor/core'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}))

// Mock PermissionsPlugin
const mockPermissionsPlugin = {
  requestPermissions: vi.fn(),
  checkPermissions: vi.fn()
}

vi.mock('@capacitor/android', () => ({
  PermissionsPlugin: mockPermissionsPlugin
}))

describe('Permissions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestPermissions', () => {
    it('should request RECORD_AUDIO permission on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true)
      mockPermissionsPlugin.requestPermissions.mockResolvedValue({
        permissions: [{ permission: 'RECORD_AUDIO', status: 'granted' }]
      })

      const result = await requestPermissions()

      expect(mockPermissionsPlugin.requestPermissions).toHaveBeenCalledWith({
        permissions: ['RECORD_AUDIO']
      })
      expect(result.permissions).toHaveLength(1)
    })

    it('should return empty permissions on web platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false)

      const result = await requestPermissions()

      expect(mockPermissionsPlugin.requestPermissions).not.toHaveBeenCalled()
      expect(result.permissions).toEqual([])
    })

    it('should handle permission request error gracefully', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true)
      mockPermissionsPlugin.requestPermissions.mockRejectedValue(new Error('Permission denied'))

      const result = await requestPermissions()

      expect(result.permissions).toEqual([])
    })
  })

  describe('checkPermissions', () => {
    it('should check RECORD_AUDIO permission on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true)
      mockPermissionsPlugin.checkPermissions.mockResolvedValue({
        permissions: [{ permission: 'RECORD_AUDIO', status: 'granted' }]
      })

      const result = await checkPermissions()

      expect(mockPermissionsPlugin.checkPermissions).toHaveBeenCalledWith({
        permissions: ['RECORD_AUDIO']
      })
    })

    it('should return empty permissions on web platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false)

      const result = await checkPermissions()

      expect(result.permissions).toEqual([])
    })
  })
})
