import { storage } from 'wxt/utils/storage'
import type { EncryptedVault } from '../crypto/vault'

const VAULT_KEY = 'local:vault'

export class VaultStorage {
	static async save(vault: EncryptedVault): Promise<void> {
		await storage.setItem(VAULT_KEY, vault)
	}

	static async load(): Promise<EncryptedVault | null> {
		return await storage.getItem<EncryptedVault>(VAULT_KEY)
	}

	static async exists(): Promise<boolean> {
		const vault = await storage.getItem<EncryptedVault>(VAULT_KEY)
		return vault !== null
	}

	static async remove(): Promise<void> {
		await storage.removeItem(VAULT_KEY)
	}
}
