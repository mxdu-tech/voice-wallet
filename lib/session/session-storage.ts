import { storage } from 'wxt/utils/storage'
import type { EncryptedVault } from '../crypto/vault'
import { VaultCrypto } from '../crypto/vault'

interface SessionData {
	lastActivity: number
	version: number
}

const SESSION_KEY = 'session:wallet-session'
const SESSION_VERSION = 1

export class SessionStorage {
	static async start(): Promise<void> {
		const sessionData: SessionData = {
			lastActivity: Date.now(),
			version: SESSION_VERSION,
		}
	
		await storage.setItem(SESSION_KEY, sessionData)
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
