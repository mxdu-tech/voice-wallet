import type { WalletSession } from '../session/wallet-session'
import { formatEther } from 'viem'
import type {
	CheckWalletExistsMessage,
	CreateWalletMessage,
	GetAddressMessage,
	GetBalanceMessage,
	GetChainIdMessage,
	LockWalletMessage,
	Message,
	MessageResponse,
	SwitchChainMessage,
	UnlockWalletMessage,
	ImportWalletMessage,
	RevealMnemonicMessage
} from './types'

const SUPPORTED_CHAINS = new Map<number, string>([
	[1, 'mainnet'],
	[11155111, 'sepolia'],
	[8453, 'base'],
	[42161, 'arbitrum'],
])

export class MessageHandler {
	private currentChainId: number = 11155111
	private session: WalletSession

	constructor(session: WalletSession) {
		this.session = session
	}

	async handle(message: Message): Promise<MessageResponse> {
		// console.log('Received message type:', message.type)

		try {
			switch (message.type) {
				case 'createWallet':
					return await this.handleCreateWallet(message as CreateWalletMessage)
				case 'importWallet':
					return await this.handleImportWallet(message as ImportWalletMessage)
				case 'unlockWallet':
					return await this.handleUnlockWallet(message as UnlockWalletMessage)
				case 'revealMnemonic':
					return await this.handleRevealMnemonic(message as RevealMnemonicMessage)
				case 'lockWallet':
					return await this.handleLockWallet(message as LockWalletMessage)
				case 'checkWalletExists':
					return await this.handleCheckWalletExists(
						message as CheckWalletExistsMessage,
					)
				case 'getAddress':
					return await this.handleGetAddress(message as GetAddressMessage)
				case 'getBalance':
					return await this.handleGetBalance(message as GetBalanceMessage)
				case 'getChainId':
					return await this.handleGetChainId(message as GetChainIdMessage)
				case 'switchChain':
					return await this.handleSwitchChain(message as SwitchChainMessage)
				default:
					return {
						success: false,
						error: `Unknown message type: ${(message as Message).type}`,
					}
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	private async handleCreateWallet(
		message: CreateWalletMessage,
	): Promise<MessageResponse<string>> {
		try {
			// console.log('handleCreateWallet: Starting wallet creation...')
			const wallet = await this.session.create(message.password)
			// console.log('handleCreateWallet: Wallet created, getting account...')
			const account = await wallet.getAccount(0)
			// console.log('handleCreateWallet: Got account, getting address...')
			const address = await account.getAddress()
			// console.log('handleCreateWallet: Got address:', address)
			return {
				success: true,
				data: address,
			}
		} catch (error) {
			console.error('handleCreateWallet: Error:', error)
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to create wallet',
			}
		}
	}

	private async handleImportWallet(
		message: ImportWalletMessage,
	): Promise<MessageResponse<string>> {
		try {
			// console.log('handleImportWallet: Importing wallet...')
			const wallet = await this.session.import(message.mnemonic, message.password)
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			// console.log('handleImportWallet: Wallet imported, address:', address)
			return {
				success: true,
				data: address,
			}
		} catch (error) {
			console.error('handleImportWallet: Error:', error)
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to import wallet',
			}
		}
	}

	private async handleUnlockWallet(
		message: UnlockWalletMessage,
	): Promise<MessageResponse<string>> {
		try {
			// console.log('handleUnlockWallet: Unlocking wallet...')
			const wallet = await this.session.unlock(message.password)
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			// console.log('handleUnlockWallet: Wallet unlocked, address:', address)
			return {
				success: true,
				data: address,
			}
		} catch (error) {
			console.error('handleUnlockWallet: Error:', error)
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to unlock wallet',
			}
		}
	}

	private async handleLockWallet(
		_message: LockWalletMessage,
	): Promise<MessageResponse<void>> {
		try {
			// console.log('handleLockWallet: Locking wallet...')
			await this.session.lock()
			return {
				success: true,
			}
		} catch (error) {
			console.error('handleLockWallet: Error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to lock wallet',
			}
		}
	}

	private async handleCheckWalletExists(
		_message: CheckWalletExistsMessage,
	): Promise<MessageResponse<boolean>> {
		try {
			const exists = await this.session.exists()
			return {
				success: true,
				data: exists,
			}
		} catch (error) {
			console.error('handleCheckWalletExists: Error:', error)
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to check wallet exists',
			}
		}
	}

	private async handleGetAddress(
		_message: GetAddressMessage,
	): Promise<MessageResponse<string>> {
		try {
			const wallet = this.session.get()
			if (!wallet) {
				return {
					success: false,
					error: 'Wallet is locked or not available',
				}
			}

			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			return {
				success: true,
				data: address,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get address',
			}
		}
	}

	private async handleGetBalance(
		_message: GetBalanceMessage,
	): Promise<MessageResponse<string>> {
		try {
			// console.log('[MessageHandler] currentChainId:', this.currentChainId)
			const wallet = this.session.get()
			if (!wallet) {
				return {
					success: false,
					error: 'Wallet is locked or not available',
				}
			}

			const account = await wallet.getAccount(0)
			const balance = await account.getBalance()
			return {
				success: true,
				data: formatEther(balance),
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get balance',
			}
		}
	}

	private async handleRevealMnemonic(
		message: RevealMnemonicMessage,
	  ): Promise<MessageResponse<string>> {
		try {
		  const mnemonic = await this.session.revealMnemonic(message.password)
	  
		  return {
			success: true,
			data: mnemonic,
		  }
		} catch (error) {
		  return {
			success: false,
			error:
			  error instanceof Error ? error.message : 'Failed to reveal mnemonic',
		  }
		}
	  }

	private async handleGetChainId(
		_message: GetChainIdMessage,
	): Promise<MessageResponse<number>> {
		return {
			success: true,
			data: this.currentChainId,
		}
	}

	private async handleSwitchChain(
		message: SwitchChainMessage,
	): Promise<MessageResponse<number>> {
		// console.log('[MessageHandler] currentChainId:', this.currentChainId)
		try {
			// SECURITY: Require unlocked wallet before allowing network switch
			if (!this.session.isUnlocked()) {
				return {
					success: false,
					error:
						'Wallet is locked. Please unlock your wallet to switch networks.',
				}
			}

			if (!SUPPORTED_CHAINS.has(message.chainId)) {
				return {
					success: false,
					error: `Unsupported chain ID: ${message.chainId}`,
				}
			}

			await this.session.updateNetwork(message.chainId)
			this.currentChainId = message.chainId

			return {
				success: true,
				data: this.currentChainId,
			}
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to switch chain',
			}
		}
	}

	getCurrentChainId(): number {
		return this.currentChainId
	}
}
