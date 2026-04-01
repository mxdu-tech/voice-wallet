// Message types for chrome.runtime.sendMessage communication

export type TxRecord = {
	hash: string
	amount: string
	to: string
	chainId: number
	networkName: string
	status: 'sent' | 'failed'
	timestamp: number
}

export type MessageType =
	| 'createWallet'
	| 'unlockWallet'
	| 'lockWallet'
	| 'checkWalletExists'
	| 'getAddress'
	| 'getBalance'
	| 'getChainId'
	| 'switchChain'
	| 'importWallet'
	| 'revealMnemonic'

export interface CreateWalletMessage {
	type: 'createWallet'
	password: string
}

export interface RevealMnemonicMessage {
	type: 'revealMnemonic'
	password: string
}

export interface ImportWalletMessage {
	type: 'importWallet'
	mnemonic: string
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
	| ImportWalletMessage
	| RevealMnemonicMessage

export interface MessageResponse<T = unknown> {
	success: boolean
	data?: T
	error?: string
}
