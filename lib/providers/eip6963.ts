import { v4 as uuidv4 } from 'uuid'
import type { Eip1193Provider } from './eip1193'

export interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: Eip1193Provider
}

export class Eip6963Announcer {
  private provider: Eip1193Provider
  private providerInfo: EIP6963ProviderInfo

  constructor(provider: Eip1193Provider) {
    this.provider = provider
    this.providerInfo = this.createProviderInfo()
    this.setupListeners()
    this.announce()
  }

  private createProviderInfo(): EIP6963ProviderInfo {
    return {
      uuid: uuidv4(),
      name: 'WDK Browser Extension Wallet',
      icon: this.createIcon(),
      rdns: 'com.wdk.wallet',
    }
  }

  private createIcon(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#1a1a2e"/>
  <circle cx="48" cy="48" r="40" fill="#0f3460"/>
  <text x="48" y="55" font-size="32" font-weight="bold" fill="#e94560" text-anchor="middle" font-family="monospace">B58</text>
</svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  private setupListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('eip6963:requestProvider', () => {
        this.announce()
      })
    }
  }

  private announce(): void {
    if (typeof window === 'undefined') {
      return
    }

    const detail = Object.freeze({
      info: this.providerInfo,
      provider: this.provider,
    })

    const event = new CustomEvent('eip6963:announceProvider', {
      detail,
    })

    window.dispatchEvent(event)
  }

  getProviderInfo(): EIP6963ProviderInfo {
    return this.providerInfo
  }

  getProviderDetail(): EIP6963ProviderDetail {
    return {
      info: this.providerInfo,
      provider: this.provider,
    }
  }
}
