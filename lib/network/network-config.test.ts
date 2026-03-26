import { beforeEach, describe, expect, it } from 'vitest'
import {
	getCurrentNetwork,
	getNetworkByChainId,
	switchNetwork,
} from './network-config'

describe('NetworkConfig', () => {
	beforeEach(() => {
		// Reset to mainnet before each test
		switchNetwork(1)
	})

	describe('Network definitions', () => {
		it('should define mainnet with correct chainId and RPC URL', () => {
			const mainnet = getNetworkByChainId(1)
			expect(mainnet).toBeDefined()
			expect(mainnet?.chainId).toBe(1)
			expect(mainnet?.name).toBe('Mainnet')
			expect(mainnet?.rpcUrl).toBeDefined()
			expect(mainnet?.rpcUrl.length).toBeGreaterThan(0)
		})

		it('should define sepolia with correct chainId and RPC URL', () => {
			const sepolia = getNetworkByChainId(11155111)
			expect(sepolia).toBeDefined()
			expect(sepolia?.chainId).toBe(11155111)
			expect(sepolia?.name).toBe('Sepolia')
			expect(sepolia?.rpcUrl).toBeDefined()
			expect(sepolia?.rpcUrl.length).toBeGreaterThan(0)
		})

		it('should define base with correct chainId and RPC URL', () => {
			const base = getNetworkByChainId(8453)
			expect(base).toBeDefined()
			expect(base?.chainId).toBe(8453)
			expect(base?.name).toBe('Base')
			expect(base?.rpcUrl).toBeDefined()
			expect(base?.rpcUrl.length).toBeGreaterThan(0)
		})

		it('should define arbitrum with correct chainId and RPC URL', () => {
			const arbitrum = getNetworkByChainId(42161)
			expect(arbitrum).toBeDefined()
			expect(arbitrum?.chainId).toBe(42161)
			expect(arbitrum?.name).toBe('Arbitrum')
			expect(arbitrum?.rpcUrl).toBeDefined()
			expect(arbitrum?.rpcUrl.length).toBeGreaterThan(0)
		})
	})

	describe('getCurrentNetwork()', () => {
		it('should return mainnet by default', () => {
			const network = getCurrentNetwork()
			expect(network.chainId).toBe(1)
			expect(network.name).toBe('Mainnet')
		})

		it('should return current network after switch', () => {
			switchNetwork(11155111)
			const network = getCurrentNetwork()
			expect(network.chainId).toBe(11155111)
			expect(network.name).toBe('Sepolia')
		})
	})

	describe('switchNetwork()', () => {
		it('should switch to sepolia', () => {
			switchNetwork(11155111)
			expect(getCurrentNetwork().chainId).toBe(11155111)
		})

		it('should switch to base', () => {
			switchNetwork(8453)
			expect(getCurrentNetwork().chainId).toBe(8453)
		})

		it('should switch to arbitrum', () => {
			switchNetwork(42161)
			expect(getCurrentNetwork().chainId).toBe(42161)
		})

		it('should switch back to mainnet', () => {
			switchNetwork(11155111)
			switchNetwork(1)
			expect(getCurrentNetwork().chainId).toBe(1)
		})

		it('should throw error for invalid chainId', () => {
			expect(() => switchNetwork(999999)).toThrow()
		})
	})

	describe('getNetworkByChainId()', () => {
		it('should return undefined for invalid chainId', () => {
			const network = getNetworkByChainId(999999)
			expect(network).toBeUndefined()
		})

		it('should return network object with all required properties', () => {
			const network = getNetworkByChainId(1)
			expect(network).toBeDefined()
			expect(network?.chainId).toBeDefined()
			expect(network?.name).toBeDefined()
			expect(network?.rpcUrl).toBeDefined()
		})
	})
})
