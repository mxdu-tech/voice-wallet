import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { WalletSession } from './wallet-session'

describe('WalletSession', () => {
	let session: WalletSession
	const testPassword = 'SecurePassword123!'

	beforeEach(() => {
		fakeBrowser.reset()
		session = new WalletSession()
	})

	describe('create(password)', () => {
		it('should create a new wallet with password', async () => {
			const wallet = await session.create(testPassword)

			expect(wallet).toBeDefined()
			expect(wallet).not.toBeNull()
		})

		it('should return a WalletManagerEvm instance', async () => {
			const wallet = await session.create(testPassword)

			expect(wallet.constructor.name).toBe('WalletManagerEvm')
		})

		it('should generate different mnemonics on each call', async () => {
			const wallet1 = await session.create(testPassword)
			const account1 = await wallet1.getAccount(0)
			const address1 = await account1.getAddress()

			fakeBrowser.reset()
			const session2 = new WalletSession()
			const wallet2 = await session2.create('DifferentPassword!')
			const account2 = await wallet2.getAccount(0)
			const address2 = await account2.getAddress()

			expect(address1).not.toBe(address2)
		})

		it('should store wallet in memory', async () => {
			const wallet = await session.create(testPassword)
			const storedWallet = session.get()

			expect(storedWallet).toBe(wallet)
		})

		it('should save encrypted vault to storage', async () => {
			await session.create(testPassword)

			expect(await session.exists()).toBe(true)
		})

		it('should throw error if vault already exists', async () => {
			await session.create(testPassword)

			await expect(session.create(testPassword)).rejects.toThrow(
				'Wallet already exists',
			)
		})

		it('should accept empty password', async () => {
			const wallet = await session.create('')

			expect(wallet).toBeDefined()
		})

		it('should handle long passwords', async () => {
			const longPassword = 'a'.repeat(1000)
			const wallet = await session.create(longPassword)

			expect(wallet).toBeDefined()
		})

		it('should handle unicode passwords', async () => {
			const unicodePassword = '🔐 パスワード 密码'
			const wallet = await session.create(unicodePassword)

			expect(wallet).toBeDefined()
		})
	})

	describe('unlock(password)', () => {
		beforeEach(async () => {
			await session.create(testPassword)
			session.lock()
		})

		it('should unlock wallet with correct password', async () => {
			const wallet = await session.unlock(testPassword)

			expect(wallet).toBeDefined()
			expect(wallet).not.toBeNull()
		})

		it('should restore wallet to memory after unlock', async () => {
			await session.unlock(testPassword)
			const storedWallet = session.get()

			expect(storedWallet).not.toBeNull()
		})

		it('should throw error with incorrect password', async () => {
			await expect(session.unlock('WrongPassword!')).rejects.toThrow(
				'Invalid password',
			)
		})

		it('should throw error if no vault exists', async () => {
			fakeBrowser.storage.local.clear()
			const newSession = new WalletSession()

			await expect(newSession.unlock(testPassword)).rejects.toThrow(
				'No wallet found',
			)
		})

		it('should generate same addresses after unlock', async () => {
			const wallet1 = await session.unlock(testPassword)
			const account1 = await wallet1.getAccount(0)
			const address1 = await account1.getAddress()

			session.lock()

			const wallet2 = await session.unlock(testPassword)
			const account2 = await wallet2.getAccount(0)
			const address2 = await account2.getAddress()

			expect(address1).toBe(address2)
		})

		it('should handle multiple unlock attempts with wrong password', async () => {
			await expect(session.unlock('wrong1')).rejects.toThrow()
			await expect(session.unlock('wrong2')).rejects.toThrow()
			await expect(session.unlock('wrong3')).rejects.toThrow()

			const wallet = await session.unlock(testPassword)
			expect(wallet).toBeDefined()
		})
	})

	describe('lock()', () => {
		it('should lock the wallet', async () => {
			await session.create(testPassword)
			expect(session.isUnlocked()).toBe(true)

			session.lock()

			expect(session.isUnlocked()).toBe(false)
			expect(session.get()).toBeNull()
		})

		it('should dispose wallet when locking', async () => {
			await session.create(testPassword)

			session.lock()

			expect(session.get()).toBeNull()
		})

		it('should be safe to call when wallet is already locked', () => {
			expect(() => session.lock()).not.toThrow()
		})

		it('should be safe to call multiple times', async () => {
			await session.create(testPassword)

			session.lock()
			session.lock()
			session.lock()

			expect(session.get()).toBeNull()
		})

		it('should not remove vault from storage', async () => {
			await session.create(testPassword)
			session.lock()

			expect(await session.exists()).toBe(true)
		})

		it('should allow unlock after lock', async () => {
			await session.create(testPassword)
			session.lock()

			const wallet = await session.unlock(testPassword)
			expect(wallet).toBeDefined()
		})
	})

	describe('isUnlocked()', () => {
		it('should return false when wallet is not created', () => {
			expect(session.isUnlocked()).toBe(false)
		})

		it('should return true after wallet creation', async () => {
			await session.create(testPassword)

			expect(session.isUnlocked()).toBe(true)
		})

		it('should return false after lock', async () => {
			await session.create(testPassword)
			session.lock()

			expect(session.isUnlocked()).toBe(false)
		})

		it('should return true after unlock', async () => {
			await session.create(testPassword)
			session.lock()
			await session.unlock(testPassword)

			expect(session.isUnlocked()).toBe(true)
		})
	})

	describe('exists()', () => {
		it('should return false when no wallet exists', async () => {
			const exists = await session.exists()

			expect(exists).toBe(false)
		})

		it('should return true after wallet creation', async () => {
			await session.create(testPassword)
			const exists = await session.exists()

			expect(exists).toBe(true)
		})

		it('should return true even after lock', async () => {
			await session.create(testPassword)
			session.lock()

			const exists = await session.exists()

			expect(exists).toBe(true)
		})

		it('should return false after clearing storage', async () => {
			await session.create(testPassword)

			fakeBrowser.storage.local.clear()

			const exists = await session.exists()

			expect(exists).toBe(false)
		})
	})

	describe('get()', () => {
		it('should return null when no wallet exists', () => {
			const wallet = session.get()

			expect(wallet).toBeNull()
		})

		it('should return the current wallet after create()', async () => {
			const createdWallet = await session.create(testPassword)
			const retrievedWallet = session.get()

			expect(retrievedWallet).toBe(createdWallet)
		})

		it('should return the same wallet instance on multiple calls', async () => {
			await session.create(testPassword)
			const wallet1 = session.get()
			const wallet2 = session.get()

			expect(wallet1).toBe(wallet2)
		})

		it('should return null after lock', async () => {
			await session.create(testPassword)
			session.lock()

			const wallet = session.get()

			expect(wallet).toBeNull()
		})

		it('should return wallet after unlock', async () => {
			await session.create(testPassword)
			session.lock()
			await session.unlock(testPassword)

			const wallet = session.get()

			expect(wallet).not.toBeNull()
		})
	})

	describe('integration flows', () => {
		it('should handle create -> lock -> unlock flow', async () => {
			const wallet1 = await session.create(testPassword)
			const account1 = await wallet1.getAccount(0)
			const address1 = await account1.getAddress()

			session.lock()
			expect(session.isUnlocked()).toBe(false)

			const wallet2 = await session.unlock(testPassword)
			const account2 = await wallet2.getAccount(0)
			const address2 = await account2.getAddress()

			expect(address1).toBe(address2)
		})

		it('should handle multiple lock/unlock cycles', async () => {
			await session.create(testPassword)

			for (let i = 0; i < 5; i++) {
				session.lock()
				expect(session.isUnlocked()).toBe(false)

				await session.unlock(testPassword)
				expect(session.isUnlocked()).toBe(true)
			}
		})

		it('should maintain wallet state across operations', async () => {
			const wallet = await session.create(testPassword)
			const account = await wallet.getAccount(0)
			const address = await account.getAddress()

			expect(await session.exists()).toBe(true)
			expect(session.isUnlocked()).toBe(true)
			expect(session.get()).toBe(wallet)

			session.lock()

			expect(await session.exists()).toBe(true)
			expect(session.isUnlocked()).toBe(false)
			expect(session.get()).toBeNull()

			const unlockedWallet = await session.unlock(testPassword)
			const unlockedAccount = await unlockedWallet.getAccount(0)
			const unlockedAddress = await unlockedAccount.getAddress()

			expect(address).toBe(unlockedAddress)
			expect(await session.exists()).toBe(true)
			expect(session.isUnlocked()).toBe(true)
		})
	})
})
