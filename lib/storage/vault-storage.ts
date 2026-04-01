import { storage } from 'wxt/utils/storage'
import type { EncryptedVault } from '../crypto/vault'

const VAULT_KEY = 'local:vault'

export class VaultStorage {
	static async save(vault: EncryptedVault): Promise<void> {
		// console.log('[VaultStorage.save] key = ', VAULT_KEY)
		// console.log('[VaultStorage.save] vault =', vault)

		await storage.setItem(VAULT_KEY, vault)

		// const verify = await storage.getItem<EncryptedVault>(VAULT_KEY)
		// console.log('[VaultStorage.save] verify after save = ', verify)
	}

	static async load(): Promise<EncryptedVault | null> {
		const vault = await storage.getItem<EncryptedVault>(VAULT_KEY)
		// console.log('[VaultStorage.load] key =', VAULT_KEY, 'value =', vault)
		return vault
	}

	static async exists(): Promise<boolean> {
		const vault = await storage.getItem<EncryptedVault>(VAULT_KEY)
		// console.log('[VaultStorage.exists] key =', VAULT_KEY, 'value =', vault)
		return vault !== null
	}

	static async remove(): Promise<void> {
		// console.log('[VaultStorage.remove] key =', VAULT_KEY)
		await storage.removeItem(VAULT_KEY)
	}
}
