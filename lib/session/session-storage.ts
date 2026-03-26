import { storage } from 'wxt/utils/storage'
import type { EncryptedVault } from '../crypto/vault'
import { VaultCrypto } from '../crypto/vault'

interface SessionData {
	encryptedMnemonic: EncryptedVault
	sessionKey: string
	lastActivity: number
	version: number
}

const SESSION_KEY = 'session:wallet-session'
const SESSION_VERSION = 1

export class SessionStorage {
	static async save(mnemonic: string): Promise<void> {
		const sessionKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')

		const encryptedMnemonic = await VaultCrypto.encrypt(mnemonic, sessionKey)

		const sessionData: SessionData = {
			encryptedMnemonic,
			sessionKey,
			lastActivity: Date.now(),
			version: SESSION_VERSION,
		}

		await storage.setItem(SESSION_KEY, sessionData)
	}

	static async load(): Promise<string | null> {
		const sessionData = await storage.getItem<SessionData>(SESSION_KEY)

		if (!sessionData) {
			return null
		}

		if (sessionData.version !== SESSION_VERSION) {
			await SessionStorage.clear()
			return null
		}

		try {
			const mnemonic = await VaultCrypto.decrypt(
				sessionData.encryptedMnemonic,
				sessionData.sessionKey,
			)

			return mnemonic
		} catch (_error) {
			await SessionStorage.clear()
			return null
		}
	}

	static async updateActivity(): Promise<void> {
		const sessionData = await storage.getItem<SessionData>(SESSION_KEY)
		if (sessionData) {
			sessionData.lastActivity = Date.now()
			await storage.setItem(SESSION_KEY, sessionData)
		}
	}

	static async getLastActivity(): Promise<number | null> {
		const sessionData = await storage.getItem<SessionData>(SESSION_KEY)
		return sessionData?.lastActivity ?? null
	}

	static async exists(): Promise<boolean> {
		const sessionData = await storage.getItem<SessionData>(SESSION_KEY)
		return sessionData !== null
	}

	static async clear(): Promise<void> {
		await storage.removeItem(SESSION_KEY)
	}
}
