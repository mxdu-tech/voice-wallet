import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { generateMnemonic, validateMnemonic } from 'bip39'
import { VaultCrypto } from '../crypto/vault'
import {
  getCurrentNetwork,
  getNetworkByChainId,
  switchNetwork
} from '../network/network-config'
import { VaultStorage } from '../storage/vault-storage'
import { SessionStorage } from './session-storage'
import type { Network } from '../network/network-config'
import { JsonRpcProvider } from 'ethers'

export class WalletSession {
  private wallet: WalletManagerEvm | null = null
  private mnemonic: string | null = null

  private async getWorkingRpcUrl(network: Network): Promise<string> {
    for (const rpcUrl of network.rpcUrls){
      try {
        const provider = new JsonRpcProvider(rpcUrl)
        await provider.getBlockNumber()
        console.log(`[WalletSession] Using RPC: ${rpcUrl}`)
        return rpcUrl
      } catch (error){
        console.warn(`[WalletSession] RPC unavailable: ${rpcUrl}`, error)
      }
    }
    throw new Error(`No working RPC available for ${network.name}`)
  }

  async restore(): Promise<boolean> {
    const mnemonic = await SessionStorage.load()
    if (!mnemonic) {
      return false
    }

    this.mnemonic = mnemonic
    const network = getCurrentNetwork()
    const rpcUrl = await this.getWorkingRpcUrl(network)
    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: rpcUrl,
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
    const rpcUrl = await this.getWorkingRpcUrl(network)

    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: rpcUrl,
    })

    await SessionStorage.save(mnemonic)

    return this.wallet
  }

  async revealMnemonic(password: string): Promise<string> {
    const vault = await VaultStorage.load()
    if (!vault) {
      throw new Error('No wallet found')
    }

    const mnemonic = await VaultCrypto.decrypt(vault, password)

    return mnemonic
  }

  async import(mnemonic: string, password: string): Promise<WalletManagerEvm> {
    if (await VaultStorage.exists()){
      throw new Error('Wallet already exists. Use unlock() instead.')
    }

    const normalizedMnemonic = mnemonic.replace(/\s+/g, ' ').trim()

    if (!validateMnemonic(normalizedMnemonic)){
      throw new Error('Invalid mnemonic phrase')
    }

    const vault = await VaultCrypto.encrypt(normalizedMnemonic, password)
    await VaultStorage.save(vault)

    this.mnemonic = normalizedMnemonic
    const network = getCurrentNetwork()
    const rpcUrl = await this.getWorkingRpcUrl(network)

    this.wallet = new WalletManagerEvm(normalizedMnemonic, {
      provider: rpcUrl,
    })

    await SessionStorage.save(normalizedMnemonic)

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
    const rpcUrl = await this.getWorkingRpcUrl(network)

    this.wallet = new WalletManagerEvm(mnemonic, {
      provider: rpcUrl,
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
    const rpcUrl = await this.getWorkingRpcUrl(network)

    this.wallet = new WalletManagerEvm(this.mnemonic, {
      provider: rpcUrl,
    })

    await SessionStorage.updateActivity()
  }
}
