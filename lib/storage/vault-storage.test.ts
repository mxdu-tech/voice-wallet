import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import type { EncryptedVault } from '../crypto/vault'
import { VaultStorage } from './vault-storage'

describe('VaultStorage', () => {
	const mockVault: EncryptedVault = {
		version: 1,
		ciphertext: 'mock_ciphertext_base64',
		iv: 'mock_iv_base64',
		salt: 'mock_salt_base64',
		kdf: {
			algorithm: 'PBKDF2',
			iterations: 600000,
			hash: 'SHA-256',
		},
		encryption: {
			algorithm: 'AES-GCM',
			keyLength: 256,
		},
		createdAt: 1000,
	}

	beforeEach(() => {
		fakeBrowser.reset()
	})

	describe('save()', () => {
		it('should save encrypted vault', async () => {
			await VaultStorage.save(mockVault)

			const loaded = await VaultStorage.load()
			expect(loaded).toEqual(mockVault)
		})

		it('should overwrite existing vault', async () => {
			const vault1 = { ...mockVault, createdAt: 1000 }
			const vault2 = { ...mockVault, createdAt: 2000 }

			await VaultStorage.save(vault1)
			const loaded1 = await VaultStorage.load()
			expect(loaded1?.createdAt).toBe(1000)

			await VaultStorage.save(vault2)
			const loaded2 = await VaultStorage.load()
			expect(loaded2?.createdAt).toBe(2000)
		})
	})

	describe('load()', () => {
		it('should load encrypted vault', async () => {
			await VaultStorage.save(mockVault)

			const result = await VaultStorage.load()

			expect(result).toEqual(mockVault)
		})

		it('should return null if no vault exists', async () => {
			const result = await VaultStorage.load()

			expect(result).toBeNull()
		})
	})

	describe('exists()', () => {
		it('should return true if vault exists', async () => {
			await VaultStorage.save(mockVault)

			const result = await VaultStorage.exists()

			expect(result).toBe(true)
		})

		it('should return false if vault does not exist', async () => {
			const result = await VaultStorage.exists()

			expect(result).toBe(false)
		})
	})

	describe('remove()', () => {
		it('should remove vault', async () => {
			await VaultStorage.save(mockVault)
			expect(await VaultStorage.exists()).toBe(true)

			await VaultStorage.remove()

			expect(await VaultStorage.exists()).toBe(false)
		})

		it('should not throw error if vault does not exist', async () => {
			await expect(VaultStorage.remove()).resolves.not.toThrow()
		})
	})

	describe('integration', () => {
		it('should handle complete save -> load -> exists -> remove flow', async () => {
			expect(await VaultStorage.exists()).toBe(false)

			await VaultStorage.save(mockVault)
			expect(await VaultStorage.exists()).toBe(true)

			const loaded = await VaultStorage.load()
			expect(loaded).toEqual(mockVault)

			await VaultStorage.remove()
			expect(await VaultStorage.exists()).toBe(false)
		})
	})
})
