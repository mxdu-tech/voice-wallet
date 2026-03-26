import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { generateMnemonic } from 'bip39'
import { VaultCrypto } from '../crypto/vault'
import {
  getCurrentNetwork,
  getNetworkByChainId,
  switchNetwork,
} from '../network/network-config'
import { VaultStorage } from '../storage/vault-storage'
import { SessionStorage } from './session-storage'

export class WalletSession {
  private wallet: WalletManagerEvm | null = null
  private mnemonic: string | null = null

  async restore(): Promise<boolean> {
    const mnemonic = await SessionStorage.load()
    if (!mnemonic) {
      return false
    }

    this.mnemonic = mnemonic
    const network = getCurrentNetwork()
    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: network.rpcUrl,
    })

    return true
  }

  async create(password: string): Promise<WalletManagerEvm> {
    if (await VaultStorage.exists()) {
      throw new Error('Wallet already exists. Use unlock() instead.')
    }

    const mnemonic = generateMnemonic()
    const vault = await VaultCrypto.encrypt(mnemonic, password)
    await VaultStorage.save(vault)

    this.mnemonic = mnemonic
    const network = getCurrentNetwork()
    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: network.rpcUrl,
    })

    await SessionStorage.save(mnemonic)

    return this.wallet
  }

  async unlock(password: string): Promise<WalletManagerEvm> {
    const vault = await VaultStorage.load()
    if (!vault) {
      throw new Error('No wallet found. Create one first.')
    }

    const mnemonic = await VaultCrypto.decrypt(vault, password)

    this.mnemonic = mnemonic
    const network = getCurrentNetwork()
    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: network.rpcUrl,
    })

    await SessionStorage.save(mnemonic)

    return this.wallet
  }

  isUnlocked(): boolean {
    return this.wallet !== null
  }

  get(): WalletManagerEvm | null {
    return this.wallet
  }

  async lock(): Promise<void> {
    if (this.wallet) {
      this.wallet.dispose()
      this.wallet = null
    }

    if (this.mnemonic) {
      this.mnemonic = null
    }

    await SessionStorage.clear()
  }

  async exists(): Promise<boolean> {
    return await VaultStorage.exists()
  }

  async updateNetwork(chainId: number): Promise<void> {
    if (!this.wallet || !this.mnemonic) {
      throw new Error('No wallet to switch network')
    }

    const network = getNetworkByChainId(chainId)
    if (!network) {
      throw new Error(`Network ${chainId} not found`)
    }

    switchNetwork(chainId)

    this.wallet.dispose()
    this.wallet = new WalletManagerEvm(this.mnemonic, {
      provider: network.rpcUrl,
    })

    await SessionStorage.updateActivity()
  }
}
