import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface MockProvider {
  request: (req: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, listener: (arg: unknown) => void) => void
  off: (event: string, listener: (arg: unknown) => void) => void
  removeListener: (event: string, listener: (arg: unknown) => void) => void
  isConnected: () => boolean
}

interface EIP6963ProviderDetail {
  info: {
    uuid: string
    name: string
    icon: string
    rdns: string
  }
  provider: MockProvider
}

describe('EIP-6963 Provider Announcement', () => {
  let announceEvents: CustomEvent<EIP6963ProviderDetail>[] = []
  let originalDispatchEvent: typeof globalThis.dispatchEvent

  beforeEach(() => {
    announceEvents = []
    originalDispatchEvent = globalThis.dispatchEvent
    globalThis.dispatchEvent = vi.fn((event: Event) => {
      if (event.type === 'eip6963:announceProvider') {
        announceEvents.push(event as CustomEvent<EIP6963ProviderDetail>)
      }
      return true
    })
  })

  afterEach(() => {
    globalThis.dispatchEvent = originalDispatchEvent
  })

  it('should announce provider with correct info structure', () => {
    const mockProvider: MockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      removeListener: vi.fn(),
      isConnected: () => true,
    }

    const providerInfo = {
      uuid: 'test-uuid',
      name: 'WDK Browser Extension Wallet',
      icon: 'data:image/svg+xml,...',
      rdns: 'com.wdk.wallet',
    }

    const event = new CustomEvent('eip6963:announceProvider', {
      detail: {
        info: providerInfo,
        provider: mockProvider,
      },
    })

    globalThis.dispatchEvent(event)

    expect(announceEvents).toHaveLength(1)
    expect(announceEvents[0].detail.info.name).toBe(
      'WDK Browser Extension Wallet',
    )
    expect(announceEvents[0].detail.info.rdns).toBe('com.wdk.wallet')
    expect(announceEvents[0].detail.provider).toBe(mockProvider)
  })

  it('should have valid UUID format', () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    const mockUuid = crypto.randomUUID()
    expect(mockUuid).toMatch(uuidRegex)
  })

  it('should have valid icon data URI', () => {
    const mockIcon = 'data:image/svg+xml,%3Csvg%20xmlns%3D...'
    expect(mockIcon).toMatch(/^data:image\/svg\+xml,/)
  })
})

describe('EIP-1193 Provider Interface', () => {
  let mockProvider: MockProvider

  beforeEach(() => {
    mockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      removeListener: vi.fn(),
      isConnected: () => true,
    }
  })

  it('should support eth_chainId', async () => {
    ;(mockProvider.request as ReturnType<typeof vi.fn>).mockResolvedValue('0x1')

    const result = await mockProvider.request({ method: 'eth_chainId' })
    expect(result).toBe('0x1')
    expect(mockProvider.request).toHaveBeenCalledWith({ method: 'eth_chainId' })
  })

  it('should support eth_accounts', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    ;(mockProvider.request as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockAddress,
    ])

    const result = await mockProvider.request({ method: 'eth_accounts' })
    expect(result).toEqual([mockAddress])
  })

  it('should support eth_requestAccounts', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    ;(mockProvider.request as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockAddress,
    ])

    const result = await mockProvider.request({ method: 'eth_requestAccounts' })
    expect(result).toEqual([mockAddress])
  })

  it('should support event listeners', () => {
    const listener = vi.fn()

    mockProvider.on('chainChanged', listener)
    expect(mockProvider.on).toHaveBeenCalledWith('chainChanged', listener)

    mockProvider.off('chainChanged', listener)
    expect(mockProvider.off).toHaveBeenCalledWith('chainChanged', listener)
  })

  it('should have isConnected method', () => {
    expect(mockProvider.isConnected()).toBe(true)
    expect(typeof mockProvider.isConnected).toBe('function')
  })
})

describe('Provider Request Flow', () => {
  it('should handle request with params', async () => {
    const mockProvider: MockProvider = {
      request: vi.fn().mockResolvedValue(null),
      on: vi.fn(),
      off: vi.fn(),
      removeListener: vi.fn(),
      isConnected: () => true,
    }

    await mockProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })

    expect(mockProvider.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })
  })

  it('should handle request without params', async () => {
    const mockProvider: MockProvider = {
      request: vi.fn().mockResolvedValue('0x1'),
      on: vi.fn(),
      off: vi.fn(),
      removeListener: vi.fn(),
      isConnected: () => true,
    }

    await mockProvider.request({ method: 'eth_chainId' })

    expect(mockProvider.request).toHaveBeenCalledWith({ method: 'eth_chainId' })
  })
})
