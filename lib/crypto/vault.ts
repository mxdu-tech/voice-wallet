export interface EncryptedVault {
	version: 1
	ciphertext: string
	iv: string
	salt: string
	kdf: {
		algorithm: 'PBKDF2'
		iterations: 600000
		hash: 'SHA-256'
	}
	encryption: {
		algorithm: 'AES-GCM'
		keyLength: 256
	}
	createdAt: number
}

export class VaultCrypto {
	private static readonly PBKDF2_ITERATIONS = 600000
	private static readonly SALT_LENGTH = 16
	private static readonly IV_LENGTH = 12

	static async encrypt(
		mnemonic: string,
		password: string,
	): Promise<EncryptedVault> {
		const salt = crypto.getRandomValues(new Uint8Array(VaultCrypto.SALT_LENGTH))
		const key = await VaultCrypto.deriveKey(password, salt.buffer)
		const iv = crypto.getRandomValues(new Uint8Array(VaultCrypto.IV_LENGTH))

		const encoder = new TextEncoder()
		const data = encoder.encode(mnemonic)

		const ciphertext = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			data,
		)

		return {
			version: 1,
			ciphertext: VaultCrypto.arrayBufferToBase64(ciphertext),
			iv: VaultCrypto.arrayBufferToBase64(iv.buffer),
			salt: VaultCrypto.arrayBufferToBase64(salt.buffer),
			kdf: {
				algorithm: 'PBKDF2',
				iterations: VaultCrypto.PBKDF2_ITERATIONS,
				hash: 'SHA-256',
			},
			encryption: {
				algorithm: 'AES-GCM',
				keyLength: 256,
			},
			createdAt: Date.now(),
		}
	}

	static async decrypt(
		vault: EncryptedVault,
		password: string,
	): Promise<string> {
		try {
			const salt = VaultCrypto.base64ToArrayBuffer(vault.salt)
			const key = await VaultCrypto.deriveKey(password, salt)

			const iv = VaultCrypto.base64ToArrayBuffer(vault.iv)
			const ciphertext = VaultCrypto.base64ToArrayBuffer(vault.ciphertext)

			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				key,
				ciphertext,
			)

			const decoder = new TextDecoder()
			return decoder.decode(decrypted)
		} catch (_error) {
			throw new Error('Invalid password or corrupted vault')
		}
	}

	private static async deriveKey(
		password: string,
		salt: ArrayBuffer,
	): Promise<CryptoKey> {
		const encoder = new TextEncoder()
		const passwordBuffer = encoder.encode(password)

		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			passwordBuffer,
			'PBKDF2',
			false,
			['deriveKey'],
		)

		return await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt,
				iterations: VaultCrypto.PBKDF2_ITERATIONS,
				hash: 'SHA-256',
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt'],
		)
	}

	private static arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer)
		let binary = ''
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i])
		}
		return btoa(binary)
	}

	private static base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i)
		}
		return bytes.buffer
	}
}
