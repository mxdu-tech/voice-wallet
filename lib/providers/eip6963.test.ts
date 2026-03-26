import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WalletSession } from '../session/wallet-session'
import { Eip1193Provider } from './eip1193'
import { Eip6963Announcer } from './eip6963'

describe('Eip6963Announcer', () => {
  let announcer: Eip6963Announcer
  let walletSession: WalletSession
  let provider: Eip1193Provider
  let dispatchedEvents: CustomEvent[] = []
  let listeners: Map<string, Set<(e: Event) => void>> = new Map()

  beforeEach(() => {
    dispatchedEvents = []
    listeners = new Map()

    const mockWindow = {
      addEventListener: (event: string, handler: (e: Event) => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set())
        }
        listeners.get(event)!.add(handler)
      },
      dispatchEvent: (event: Event) => {
        if (event.type === 'eip6963:announceProvider') {
          dispatchedEvents.push(event as CustomEvent)
        }
        const handlers = listeners.get(event.type)
        if (handlers) {
          for (const handler of handlers) {
            handler(event)
          }
        }
        return true
      },
    }

    global.window = mockWindow as any

    walletSession = new WalletSession()
    provider = new Eip1193Provider(walletSession)
    announcer = new Eip6963Announcer(provider)
  })

  afterEach(() => {
    delete (global as any).window
  })

  describe('provider info', () => {
    it('has correct name', () => {
      expect(announcer.getProviderInfo().name).toBe(
        'WDK Browser Extension Wallet',
      )
    })

    it('has valid uuid format', () => {
      const uuid = announcer.getProviderInfo().uuid
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it('has correct rdns', () => {
      expect(announcer.getProviderInfo().rdns).toBe('com.wdk.wallet')
    })

    it('has icon as data URI', () => {
      const icon = announcer.getProviderInfo().icon
      expect(icon).toMatch(/^data:image\//)
    })

    it('icon is SVG data URI', () => {
      const icon = announcer.getProviderInfo().icon
      expect(icon).toContain('svg')
    })
  })

  describe('announcement', () => {
    it('announces provider on initialization', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(dispatchedEvents.length).toBeGreaterThan(0)
    })

    it('dispatches eip6963:announceProvider event', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(announceEvent).toBeDefined()
    })

    it('includes provider info in event detail', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(announceEvent?.detail).toBeDefined()
      expect(announceEvent?.detail.info).toBeDefined()
      expect(announceEvent?.detail.info.name).toBe(
        'WDK Browser Extension Wallet',
      )
    })

    it('includes provider in event detail', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(announceEvent?.detail.provider).toBeDefined()
      expect(announceEvent?.detail.provider).toBe(provider)
    })

    it('freezes detail object', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(Object.isFrozen(announceEvent?.detail)).toBe(true)
    })
  })

  describe('requestProvider listener', () => {
    it('listens for eip6963:requestProvider events', async () => {
      dispatchedEvents = []
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(dispatchedEvents.length).toBeGreaterThan(0)
    })

    it('re-announces provider on requestProvider event', async () => {
      dispatchedEvents = []
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(announceEvent).toBeDefined()
    })

    it('re-announced provider has same info', async () => {
      const originalInfo = announcer.getProviderInfo()
      dispatchedEvents = []
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      await new Promise((resolve) => setTimeout(resolve, 10))
      const announceEvent = dispatchedEvents.find(
        (e) => e.type === 'eip6963:announceProvider',
      )
      expect(announceEvent?.detail.info.uuid).toBe(originalInfo.uuid)
      expect(announceEvent?.detail.info.name).toBe(originalInfo.name)
      expect(announceEvent?.detail.info.rdns).toBe(originalInfo.rdns)
    })

    it('handles multiple requestProvider events', async () => {
      dispatchedEvents = []
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      await new Promise((resolve) => setTimeout(resolve, 5))
      const count1 = dispatchedEvents.length
      window.dispatchEvent(new Event('eip6963:requestProvider'))
      await new Promise((resolve) => setTimeout(resolve, 5))
      const count2 = dispatchedEvents.length
      expect(count2).toBeGreaterThan(count1)
    })
  })

  describe('provider detail', () => {
    it('returns complete provider detail', async () => {
      const detail = announcer.getProviderDetail()
      expect(detail).toBeDefined()
      expect(detail.info).toBeDefined()
      expect(detail.provider).toBeDefined()
    })

    it('provider detail info has all required fields', async () => {
      const detail = announcer.getProviderDetail()
      expect(detail.info.uuid).toBeDefined()
      expect(detail.info.name).toBeDefined()
      expect(detail.info.icon).toBeDefined()
      expect(detail.info.rdns).toBeDefined()
    })

    it('provider detail includes eip1193 provider', async () => {
      const detail = announcer.getProviderDetail()
      expect(detail.provider).toBe(provider)
    })
  })
})
