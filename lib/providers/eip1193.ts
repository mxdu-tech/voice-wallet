import { getCurrentNetwork } from '../network/network-config'
import type { WalletSession } from '../session/wallet-session'

export interface JsonRpcRequest {
	method: string
	params?: unknown[]
}

export interface JsonRpcResponse {
	result?: unknown
	error?: string
}

type EventListener = (arg: unknown) => void

export class Eip1193Provider {
	private walletSession: WalletSession
	private listeners: Map<string, Set<EventListener>> = new Map()

	constructor(walletSession: WalletSession) {
		this.walletSession = walletSession
		queueMicrotask(() => this.emitConnect())
	}

	async request(req: JsonRpcRequest): Promise<unknown> {
		const { method, params } = req

		switch (method) {
			case 'eth_chainId':
				return this.handleEthChainId()
			case 'eth_accounts':
				return this.handleEthAccounts()
			case 'eth_requestAccounts':
				return this.handleEthRequestAccounts()
			case 'eth_sendTransaction':
				return this.handleEthSendTransaction()
			default:
				throw new Error(`Method ${method} not supported`)
		}
	}

	private handleEthChainId(): string {
		const network = getCurrentNetwork()
		return `0x${network.chainId.toString(16)}`
	}

	private async handleEthAccounts(): Promise<string[]> {
		const wallet = this.walletSession.get()
		if (!wallet) {
			return []
		}
		const account = await wallet.getAccount(0)
		const address = await account.getAddress()
		return [address]
	}

	private async handleEthRequestAccounts(): Promise<string[]> {
		const wallet = this.walletSession.get()
		if (!wallet) {
			throw new Error('No wallet created. User must create wallet first.')
		}
		const account = await wallet.getAccount(0)
		const address = await account.getAddress()
		return [address]
	}

	private handleEthSendTransaction(): never {
		throw new Error('Not implemented in demo')
	}

	on(event: string, listener: EventListener): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set())
		}
		this.listeners.get(event)!.add(listener)
	}

	off(event: string, listener: EventListener): void {
		const eventListeners = this.listeners.get(event)
		if (eventListeners) {
			eventListeners.delete(listener)
		}
	}

	private emit(event: string, arg: unknown): void {
		const eventListeners = this.listeners.get(event)
		if (eventListeners) {
			for (const listener of eventListeners) {
				listener(arg)
			}
		}
	}

	private emitConnect(): void {
		const network = getCurrentNetwork()
		this.emit('connect', `0x${network.chainId.toString(16)}`)
	}

	emitChainChanged(): void {
		const network = getCurrentNetwork()
		this.emit('chainChanged', `0x${network.chainId.toString(16)}`)
	}

	async emitAccountsChanged(): Promise<void> {
		const wallet = this.walletSession.get()
		let accounts: string[] = []
		if (wallet) {
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			accounts = [address]
		}
		this.emit('accountsChanged', accounts)
	}
}
