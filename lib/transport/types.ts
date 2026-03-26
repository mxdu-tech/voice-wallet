// Message types for chrome.runtime.sendMessage communication

export type MessageType =
	| 'createWallet'
	| 'unlockWallet'
	| 'lockWallet'
	| 'checkWalletExists'
	| 'getAddress'
	| 'getBalance'
	| 'getChainId'
	| 'switchChain'

export interface CreateWalletMessage {
	type: 'createWallet'
	password: string
}

export interface UnlockWalletMessage {
	type: 'unlockWallet'
	password: string
}

export interface LockWalletMessage {
	type: 'lockWallet'
}

export interface CheckWalletExistsMessage {
	type: 'checkWalletExists'
}

export interface GetAddressMessage {
	type: 'getAddress'
}

export interface GetBalanceMessage {
	type: 'getBalance'
}

export interface GetChainIdMessage {
	type: 'getChainId'
}

export interface SwitchChainMessage {
	type: 'switchChain'
	chainId: number
}

export type Message =
	| CreateWalletMessage
	| UnlockWalletMessage
	| LockWalletMessage
	| CheckWalletExistsMessage
	| GetAddressMessage
	| GetBalanceMessage
	| GetChainIdMessage
	| SwitchChainMessage

export interface MessageResponse<T = unknown> {
	success: boolean
	data?: T
	error?: string
}
