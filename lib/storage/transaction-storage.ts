import { storage } from 'wxt/utils/storage'
import type { TxRecord } from '@/lib/transport/types'

const TX_HISTORY_KEY = 'local:tx-history'

export class TransactionStorage {
    static async list(): Promise<TxRecord[]> {
        const records = await storage.getItem<TxRecord[]>(TX_HISTORY_KEY)
        return records ?? []
    }
    
    static async add(record: TxRecord): Promise<void> {
        const records = await this.list()
        const nextRecords = [record, ...records]
        await storage.setItem(TX_HISTORY_KEY, nextRecords)
    }

    static async clear(): Promise<void> {
        await storage.removeItem(TX_HISTORY_KEY)
    }
}
