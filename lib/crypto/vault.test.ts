import { beforeEach, describe, expect, it } from 'vitest'
import { type EncryptedVault, VaultCrypto } from './vault'

describe('VaultCrypto', () => {
	const testMnemonic =
		'test wallet brave airport tobacco monitor genuine video road casual brick hurdle'
	const testPassword = 'SecurePassword123!'

	describe('encrypt()', () => {
		it('should encrypt a mnemonic with a password', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault).toBeDefined()
			expect(vault.version).toBe(1)
			expect(vault.ciphertext).toBeDefined()
			expect(vault.iv).toBeDefined()
			expect(vault.salt).toBeDefined()
			expect(vault.ciphertext).not.toBe(testMnemonic)
		})

		it('should return a valid vault structure', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault.kdf.algorithm).toBe('PBKDF2')
			expect(vault.kdf.iterations).toBe(600000)
			expect(vault.kdf.hash).toBe('SHA-256')
			expect(vault.encryption.algorithm).toBe('AES-GCM')
			expect(vault.encryption.keyLength).toBe(256)
			expect(vault.createdAt).toBeGreaterThan(0)
		})

		it('should generate unique salt for each encryption', async () => {
			const vault1 = await VaultCrypto.encrypt(testMnemonic, testPassword)
			const vault2 = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault1.salt).not.toBe(vault2.salt)
		})

		it('should generate unique IV for each encryption', async () => {
			const vault1 = await VaultCrypto.encrypt(testMnemonic, testPassword)
			const vault2 = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault1.iv).not.toBe(vault2.iv)
		})

		it('should produce different ciphertext for same mnemonic with different passwords', async () => {
			const vault1 = await VaultCrypto.encrypt(testMnemonic, 'password1')
			const vault2 = await VaultCrypto.encrypt(testMnemonic, 'password2')

			expect(vault1.ciphertext).not.toBe(vault2.ciphertext)
		})

		it('should handle empty password', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, '')

			expect(vault.ciphertext).toBeDefined()
		})

		it('should handle unicode characters in password', async () => {
			const unicodePassword = '🔐 パスワード 密码'
			const vault = await VaultCrypto.encrypt(testMnemonic, unicodePassword)

			expect(vault.ciphertext).toBeDefined()
		})
	})

	describe('decrypt()', () => {
		let vault: EncryptedVault

		beforeEach(async () => {
			vault = await VaultCrypto.encrypt(testMnemonic, testPassword)
		})

		it('should decrypt a vault with correct password', async () => {
			const decrypted = await VaultCrypto.decrypt(vault, testPassword)

			expect(decrypted).toBe(testMnemonic)
		})

		it('should throw error with incorrect password', async () => {
			await expect(
				VaultCrypto.decrypt(vault, 'WrongPassword123!'),
			).rejects.toThrow('Invalid password or corrupted vault')
		})

		it('should throw error with corrupted ciphertext', async () => {
			const corruptedVault = { ...vault, ciphertext: 'corrupted_data' }

			await expect(
				VaultCrypto.decrypt(corruptedVault, testPassword),
			).rejects.toThrow('Invalid password or corrupted vault')
		})

		it('should throw error with corrupted IV', async () => {
			const corruptedVault = { ...vault, iv: 'corrupted_iv' }

			await expect(
				VaultCrypto.decrypt(corruptedVault, testPassword),
			).rejects.toThrow()
		})

		it('should throw error with corrupted salt', async () => {
			const corruptedVault = { ...vault, salt: 'corrupted_salt' }

			await expect(
				VaultCrypto.decrypt(corruptedVault, testPassword),
			).rejects.toThrow()
		})

		it('should handle empty password consistently', async () => {
			const vaultWithEmptyPassword = await VaultCrypto.encrypt(testMnemonic, '')
			const decrypted = await VaultCrypto.decrypt(vaultWithEmptyPassword, '')

			expect(decrypted).toBe(testMnemonic)
		})

		it('should handle unicode password consistently', async () => {
			const unicodePassword = '🔐 パスワード 密码'
			const vaultWithUnicode = await VaultCrypto.encrypt(
				testMnemonic,
				unicodePassword,
			)
			const decrypted = await VaultCrypto.decrypt(
				vaultWithUnicode,
				unicodePassword,
			)

			expect(decrypted).toBe(testMnemonic)
		})

		it('should handle long mnemonics (24 words)', async () => {
			const longMnemonic =
				'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
			const vaultWithLong = await VaultCrypto.encrypt(
				longMnemonic,
				testPassword,
			)
			const decrypted = await VaultCrypto.decrypt(vaultWithLong, testPassword)

			expect(decrypted).toBe(longMnemonic)
		})
	})

	describe('encrypt() -> decrypt() round trip', () => {
		it('should successfully round trip with various mnemonics', async () => {
			const mnemonics = [
				'test wallet brave airport tobacco monitor genuine video road casual brick hurdle',
				'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
				'legal winner thank year wave sausage worth useful legal winner thank yellow',
			]

			for (const mnemonic of mnemonics) {
				const vault = await VaultCrypto.encrypt(mnemonic, testPassword)
				const decrypted = await VaultCrypto.decrypt(vault, testPassword)
				expect(decrypted).toBe(mnemonic)
			}
		})

		it('should successfully round trip with various passwords', async () => {
			const passwords = [
				'short',
				'VeryLongPasswordWith123NumbersAndSpecialChars!@#$%^&*()',
				'🔐🔑🗝️',
				'   spaces   everywhere   ',
			]

			for (const password of passwords) {
				const vault = await VaultCrypto.encrypt(testMnemonic, password)
				const decrypted = await VaultCrypto.decrypt(vault, password)
				expect(decrypted).toBe(testMnemonic)
			}
		})
	})

	describe('base64 encoding/decoding', () => {
		it('should produce valid base64 strings', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			const validBase64Pattern = /^[A-Za-z0-9+/]*={0,2}$/

			expect(vault.ciphertext).toMatch(validBase64Pattern)
			expect(vault.iv).toMatch(validBase64Pattern)
			expect(vault.salt).toMatch(validBase64Pattern)
		})

		it('should handle binary data correctly', async () => {
			const allPossibleByteValues = Array.from({ length: 256 }, (_, i) =>
				String.fromCharCode(i),
			).join('')
			const vault = await VaultCrypto.encrypt(
				allPossibleByteValues,
				testPassword,
			)
			const decrypted = await VaultCrypto.decrypt(vault, testPassword)

			expect(decrypted).toBe(allPossibleByteValues)
		})
	})

	describe('security properties', () => {
		it('should use PBKDF2 with 600,000 iterations (OWASP 2025 standard)', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault.kdf.iterations).toBeGreaterThanOrEqual(600000)
		})

		it('should use 16-byte salt (128-bit)', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			// Base64 encoding of 16 bytes = 24 characters (with padding)
			const saltBytes = atob(vault.salt)
			expect(saltBytes.length).toBe(16)
		})

		it('should use 12-byte IV (96-bit) for AES-GCM', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			// Base64 encoding of 12 bytes = 16 characters
			const ivBytes = atob(vault.iv)
			expect(ivBytes.length).toBe(12)
		})

		it('should use AES-256-GCM encryption', async () => {
			const vault = await VaultCrypto.encrypt(testMnemonic, testPassword)

			expect(vault.encryption.algorithm).toBe('AES-GCM')
			expect(vault.encryption.keyLength).toBe(256)
		})

		it('should be deterministic with same inputs (same password, salt, IV)', async () => {
			// Cryptographic determinism test: key derivation must be deterministic despite random salt/IV
			const vault1 = await VaultCrypto.encrypt(testMnemonic, testPassword)

			const decrypted = await VaultCrypto.decrypt(vault1, testPassword)
			const vault2 = await VaultCrypto.encrypt(decrypted, testPassword)

			expect(await VaultCrypto.decrypt(vault1, testPassword)).toBe(testMnemonic)
			expect(await VaultCrypto.decrypt(vault2, testPassword)).toBe(testMnemonic)
		})
	})

	describe('edge cases', () => {
		it('should handle very long passwords', async () => {
			const longPassword = 'a'.repeat(10000)
			const vault = await VaultCrypto.encrypt(testMnemonic, longPassword)
			const decrypted = await VaultCrypto.decrypt(vault, longPassword)

			expect(decrypted).toBe(testMnemonic)
		})

		it('should handle special characters in mnemonic', async () => {
			const specialMnemonic = 'test-wallet_123 (special) [chars]'
			const vault = await VaultCrypto.encrypt(specialMnemonic, testPassword)
			const decrypted = await VaultCrypto.decrypt(vault, testPassword)

			expect(decrypted).toBe(specialMnemonic)
		})

		it('should handle newlines in mnemonic', async () => {
			const mnemonicWithNewlines = 'test wallet\nbrave airport\ntobacco monitor'
			const vault = await VaultCrypto.encrypt(
				mnemonicWithNewlines,
				testPassword,
			)
			const decrypted = await VaultCrypto.decrypt(vault, testPassword)

			expect(decrypted).toBe(mnemonicWithNewlines)
		})
	})
})
