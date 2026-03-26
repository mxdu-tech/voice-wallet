import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WalletSession } from '../session/wallet-session'
import { MessageHandler } from './message-handler'
import type { Message, MessageResponse } from './types'

vi.mock('webextension-polyfill', () => ({
	default: {
		storage: {
			local: {
				set: vi.fn(() => Promise.resolve()),
				get: vi.fn(() => Promise.resolve({})),
				remove: vi.fn(() => Promise.resolve()),
			},
		},
	},
}))

describe('MessageHandler', () => {
	let handler: MessageHandler
	let session: WalletSession

	beforeEach(() => {
		vi.clearAllMocks()

		if (typeof chrome !== 'undefined' && chrome.storage) {
			vi.spyOn(chrome.storage.local, 'set').mockImplementation(() =>
				Promise.resolve(),
			)
			vi.spyOn(chrome.storage.local, 'get').mockImplementation(() =>
				Promise.resolve({}),
			)
			vi.spyOn(chrome.storage.local, 'remove').mockImplementation(() =>
				Promise.resolve(),
			)
		}

		session = new WalletSession()
		handler = new MessageHandler(session)
	})

	describe('handle()', () => {
		describe('createWallet', () => {
			it('should create a new wallet and return address', async () => {
				const message: Message = { type: 'createWallet', password: 'test123' }
				const response = await handler.handle(message)

				expect(response.success).toBe(true)
				expect(response.data).toBeDefined()
				expect(typeof response.data).toBe('string')
				expect((response.data as string).startsWith('0x')).toBe(true)
			})
		})

		describe('getAddress', () => {
			it('should return address when wallet exists', async () => {
				await session.create('test123')
				const message: Message = { type: 'getAddress' }
				const response = await handler.handle(message)

				expect(response.success).toBe(true)
				expect(response.data).toBeDefined()
				expect(typeof response.data).toBe('string')
				expect((response.data as string).startsWith('0x')).toBe(true)
			})

			it('should return error when no wallet exists', async () => {
				const message: Message = { type: 'getAddress' }
				const response = await handler.handle(message)

				expect(response.success).toBe(false)
				expect(response.error).toBeDefined()
				expect(response.error).toContain('No wallet')
			})
		})

		describe('getBalance', () => {
			it('should return error when no wallet exists', async () => {
				const message: Message = { type: 'getBalance' }
				const response = await handler.handle(message)

				expect(response.success).toBe(false)
				expect(response.error).toBeDefined()
				expect(response.error).toContain('No wallet')
			})
		})

		describe('getChainId', () => {
			it('should return current chain ID', async () => {
				const message: Message = { type: 'getChainId' }
				const response = await handler.handle(message)

				expect(response.success).toBe(true)
				expect(response.data).toBeDefined()
				expect(typeof response.data).toBe('number')
				expect(response.data).toBe(1)
			})
		})

		describe('switchChain', () => {
			it('should return error when wallet is locked', async () => {
				const message: Message = { type: 'switchChain', chainId: 11155111 }
				const response = await handler.handle(message)

				expect(response.success).toBe(false)
				expect(response.error).toBeDefined()
				expect(response.error).toContain('locked')
			})

			it('should switch to specified chain when wallet is unlocked', async () => {
				await session.create('test123')
				const message: Message = { type: 'switchChain', chainId: 11155111 }
				const response = await handler.handle(message)

				expect(response.success).toBe(true)
				expect(response.data).toBe(11155111)
			})

			it('should return error for invalid chain ID', async () => {
				await session.create('test123')
				const message: Message = { type: 'switchChain', chainId: 99999 }
				const response = await handler.handle(message)

				expect(response.success).toBe(false)
				expect(response.error).toBeDefined()
				expect(response.error).toContain('Unsupported')
			})

			it('should update current chain ID when wallet is unlocked', async () => {
				await session.create('test123')
				const switchMsg: Message = { type: 'switchChain', chainId: 8453 }
				await handler.handle(switchMsg)

				const chainMsg: Message = { type: 'getChainId' }
				const response = await handler.handle(chainMsg)

				expect(response.data).toBe(8453)
			})
		})

		describe('unknown message type', () => {
			it('should return error for unknown message type', async () => {
				const message = { type: 'unknownType' } as unknown as Message
				const response = await handler.handle(message)

				expect(response.success).toBe(false)
				expect(response.error).toBeDefined()
				expect(response.error).toContain('Unknown')
			})
		})
	})

	describe('routing', () => {
		it('should route createWallet to correct handler', async () => {
			const message: Message = { type: 'createWallet', password: 'test123' }
			const response = await handler.handle(message)

			expect(response.success).toBe(true)
		})

		it('should route getAddress to correct handler', async () => {
			await session.create('test123')
			const message: Message = { type: 'getAddress' }
			const response = await handler.handle(message)

			expect(response.success).toBe(true)
		})

		it('should route getChainId to correct handler', async () => {
			const message: Message = { type: 'getChainId' }
			const response = await handler.handle(message)

			expect(response.success).toBe(true)
		})

		it('should route switchChain to correct handler', async () => {
			await session.create('test123')
			const message: Message = { type: 'switchChain', chainId: 1 }
			const response = await handler.handle(message)

			expect(response.success).toBe(true)
		})
	})

	describe('getCurrentChainId()', () => {
		it('should return current chain ID', () => {
			expect(handler.getCurrentChainId()).toBe(1)
		})

		it('should reflect chain changes', async () => {
			await session.create('test123')
			const message: Message = { type: 'switchChain', chainId: 42161 }
			await handler.handle(message)

			expect(handler.getCurrentChainId()).toBe(42161)
		})
	})
})
