import { beforeEach, describe, expect, it, vi } from 'vitest'
import { switchNetwork } from '../network/network-config'
import { WalletSession } from '../session/wallet-session'
import { Eip1193Provider } from './eip1193'

// Mock chrome.storage.local
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

describe('Eip1193Provider', () => {
	let provider: Eip1193Provider
	let walletSession: WalletSession

	beforeEach(() => {
		vi.clearAllMocks()

		// Mock chrome global if it exists
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

		switchNetwork(1)
		walletSession = new WalletSession()
		provider = new Eip1193Provider(walletSession)
	})

	describe('request() - eth_chainId', () => {
		it('returns current chain ID as hex string', async () => {
			const result = await provider.request({ method: 'eth_chainId' })
			expect(result).toBe('0x1')
		})

		it('returns updated chain ID after network switch', async () => {
			switchNetwork(11155111)
			const result = await provider.request({ method: 'eth_chainId' })
			expect(result).toBe('0xaa36a7')
		})
	})

	describe('request() - eth_accounts', () => {
		it('returns empty array when no wallet exists', async () => {
			const result = await provider.request({ method: 'eth_accounts' })
			expect(result).toEqual([])
		})

		it('returns [address] when wallet exists', async () => {
			const wallet = await walletSession.create('test-password-123')
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			const result = await provider.request({ method: 'eth_accounts' })
			expect(result).toEqual([address])
		})

		it('returns empty array after wallet is locked', async () => {
			await walletSession.create('test-password-123')
			await walletSession.lock()
			const result = await provider.request({ method: 'eth_accounts' })
			expect(result).toEqual([])
		})
	})

	describe('request() - eth_requestAccounts', () => {
		it('returns [address] when wallet exists (auto-approve for demo)', async () => {
			const wallet = await walletSession.create('test-password-123')
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()
			const result = await provider.request({ method: 'eth_requestAccounts' })
			expect(result).toEqual([address])
		})

		it('throws error when no wallet exists', async () => {
			try {
				await provider.request({ method: 'eth_requestAccounts' })
				expect.unreachable('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				expect((error as Error).message).toContain('No wallet')
			}
		})
	})

	describe('request() - eth_sendTransaction', () => {
		it('returns error "Not implemented in demo"', async () => {
			try {
				await provider.request({
					method: 'eth_sendTransaction',
					params: [
						{ to: '0x1234567890123456789012345678901234567890', value: '0x0' },
					],
				})
				expect.unreachable('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				expect((error as Error).message).toContain('Not implemented')
			}
		})
	})

	describe('request() - unsupported method', () => {
		it('throws error for unsupported methods', async () => {
			try {
				await provider.request({ method: 'eth_unsupported' })
				expect.unreachable('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				expect((error as Error).message).toContain('not supported')
			}
		})
	})

	describe('events', () => {
		it('emits chainChanged event when network switches', async () => {
			const eventPromise = new Promise<unknown>((resolve) => {
				provider.on('chainChanged', (arg) => {
					resolve(arg)
				})
			})
			switchNetwork(11155111)
			provider.emitChainChanged()
			const chainId = await eventPromise
			expect(chainId).toBe('0xaa36a7')
		})

		it('emits accountsChanged event when wallet is created', async () => {
			const eventPromise = new Promise<unknown>((resolve) => {
				provider.on('accountsChanged', (arg) => {
					resolve(arg)
				})
			})
			await walletSession.create('test-password-123')
			await provider.emitAccountsChanged()
			const accounts = await eventPromise
			expect(Array.isArray(accounts)).toBe(true)
			const accountsArray = accounts as string[]
			expect(accountsArray.length).toBe(1)
			expect(accountsArray[0]).toMatch(/^0x[a-fA-F0-9]{40}$/)
		})

		it('emits accountsChanged with empty array when wallet is locked', async () => {
			await walletSession.create('test-password-123')
			const eventPromise = new Promise<unknown>((resolve) => {
				provider.on('accountsChanged', (arg) => {
					resolve(arg)
				})
			})
			await walletSession.lock()
			await provider.emitAccountsChanged()
			const accounts = await eventPromise
			expect(accounts).toEqual([])
		})

		it('supports multiple listeners for same event', async () => {
			let count = 0
			const promise1 = new Promise<void>((resolve) => {
				provider.on('chainChanged', () => {
					count++
					if (count === 2) resolve()
				})
			})
			const promise2 = new Promise<void>((resolve) => {
				provider.on('chainChanged', () => {
					count++
					if (count === 2) resolve()
				})
			})
			switchNetwork(8453)
			provider.emitChainChanged()
			await Promise.race([promise1, promise2])
			expect(count).toBe(2)
		})

		it('allows removing listeners with off()', async () => {
			let called = false
			const listener = () => {
				called = true
			}

			provider.on('chainChanged', listener)
			provider.off('chainChanged', listener)
			switchNetwork(8453)
			provider.emitChainChanged()

			await new Promise((resolve) => setTimeout(resolve, 10))
			expect(called).toBe(false)
		})
	})

	describe('connect event', () => {
		it('emits connect event on initialization', async () => {
			let connectEmitted = false
			let chainId: unknown = null
			const newProvider = new Eip1193Provider(walletSession)
			newProvider.on('connect', (arg) => {
				connectEmitted = true
				chainId = arg
			})
			await new Promise((resolve) => setTimeout(resolve, 10))
			expect(connectEmitted).toBe(true)
			expect(chainId).toBe('0x1')
		})
	})
})
