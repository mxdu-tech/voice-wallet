import type { JsonRpcRequest } from '@/lib'

class InpageProvider {
  private listeners: Map<string, Set<(arg: unknown) => void>> = new Map()

  async request(req: JsonRpcRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36).slice(2)

      const handleResponse = (event: MessageEvent) => {
        if (
          event.source !== window ||
          event.data.type !== 'INPAGE_RESPONSE' ||
          event.data.id !== messageId
        ) {
          return
        }

        window.removeEventListener('message', handleResponse)

        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }

      window.addEventListener('message', handleResponse)

      window.postMessage(
        {
          type: 'INPAGE_REQUEST',
          id: messageId,
          method: req.method,
          params: req.params || [],
        },
        '*',
      )

      setTimeout(() => {
        window.removeEventListener('message', handleResponse)
        reject(new Error('Request timeout'))
      }, 30000)
    })
  }

  on(event: string, listener: (arg: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.add(listener)
    }
  }

  off(event: string, listener: (arg: unknown) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
    }
  }

  removeListener(event: string, listener: (arg: unknown) => void): void {
    this.off(event, listener)
  }

  private emit(event: string, arg: unknown): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(arg)
      }
    }
  }

  emitChainChanged(chainId: string): void {
    this.emit('chainChanged', chainId)
  }

  emitAccountsChanged(accounts: string[]): void {
    this.emit('accountsChanged', accounts)
  }

  // EIP-1193 required properties
  isConnected(): boolean {
    return true
  }
}

function createProviderInfo() {
  return {
    uuid: crypto.randomUUID(),
    name: 'WDK Browser Extension Wallet',
    icon: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#1a1a2e"/>
  <circle cx="48" cy="48" r="40" fill="#0f3460"/>
  <text x="48" y="55" font-size="32" font-weight="bold" fill="#e94560" text-anchor="middle" font-family="monospace">WDK</text>
</svg>`)}`,
    rdns: 'com.wdk.wallet',
  }
}

export default defineUnlistedScript(() => {
  console.log('[INPAGE] Initializing WDK Browser Extension Wallet provider')

  const provider = new InpageProvider()

  // Set window.ethereum for backward compatibility
  Object.defineProperty(window, 'ethereum', {
    value: provider,
    writable: false,
    configurable: false,
  })

  // EIP-6963: Announce provider
  const providerInfo = createProviderInfo()

  function announceProvider() {
    const event = new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({
        info: providerInfo,
        provider,
      }),
    })
    window.dispatchEvent(event)
    console.log('[INPAGE] EIP-6963 provider announced:', providerInfo)
  }

  // Announce immediately
  announceProvider()

  // Listen for dApp requests
  window.addEventListener('eip6963:requestProvider', () => {
    console.log('[INPAGE] Received eip6963:requestProvider')
    announceProvider()
  })

  console.log(
    '[INPAGE] WDK Browser Extension Wallet ready (window.ethereum + EIP-6963)',
  )
})
