import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BalanceProvider } from './balance-service'
import { BalanceService } from './balance-service'

const mockAccount = {
	getBalance: vi.fn(),
} as unknown as BalanceProvider

describe('BalanceService', () => {
	let service: BalanceService

	beforeEach(() => {
		service = new BalanceService()
	})

	describe('fetchBalance', () => {
		it('should format wei to ETH correctly', async () => {
			;(mockAccount.getBalance as any).mockResolvedValue(1000000000000000000n)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('1.0 ETH')
		})

		it('should format fractional ETH correctly', async () => {
			;(mockAccount.getBalance as any).mockResolvedValue(500000000000000000n)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0.5 ETH')
		})

		it('should format small amounts correctly', async () => {
			;(mockAccount.getBalance as any).mockResolvedValue(1000000000000000n)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0.001 ETH')
		})

		it('should format zero balance', async () => {
			;(mockAccount.getBalance as any).mockResolvedValue(0n)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0.0 ETH')
		})

		it('should handle large amounts', async () => {
			;(mockAccount.getBalance as any).mockResolvedValue(100000000000000000000n)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('100.0 ETH')
		})

		it('should return "0 ETH" on network error', async () => {
			;(mockAccount.getBalance as any).mockRejectedValue(
				new Error('Network error'),
			)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0 ETH')
		})

		it('should handle RPC timeout errors gracefully', async () => {
			;(mockAccount.getBalance as any).mockRejectedValue(
				new Error('RPC timeout'),
			)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0 ETH')
		})

		it('should handle provider not available errors', async () => {
			;(mockAccount.getBalance as any).mockRejectedValue(
				new Error('Provider not available'),
			)

			const result = await service.fetchBalance(mockAccount)

			expect(result).toBe('0 ETH')
		})
	})
})
