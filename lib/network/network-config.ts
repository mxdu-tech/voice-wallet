export interface Network {
	chainId: number
	name: string
	rpcUrl?: string
	rpcUrls?: string[]
}

const NETWORKS: Record<number, Network> = {
	1: {
		chainId: 1,
		name: 'Mainnet',
		rpcUrl: 'https://eth.llamarpc.com',
	},
	11155111: {
		chainId: 11155111,
		name: 'Sepolia',
		rpcUrls: [
			'https://sepolia.drpc.org',
			'https://ethereum-sepolia-rpc.publicnode.com',
			'https://rpc.sepolia.org',
		]
	},
	8453: {
		chainId: 8453,
		name: 'Base',
		rpcUrl: 'https://base.drpc.org',
	},
	42161: {
		chainId: 42161,
		name: 'Arbitrum',
		rpcUrl: 'https://arbitrum.drpc.org',
	},
}

let currentNetworkChainId = 11155111

export function getCurrentNetwork(): Network {
	const network = NETWORKS[currentNetworkChainId]
	if (!network) {
		throw new Error(`Network with chainId ${currentNetworkChainId} not found`)
	}
	return network
}

export function switchNetwork(chainId: number): void {
	const network = NETWORKS[chainId]
	if (!network) {
		throw new Error(`Network with chainId ${chainId} not found`)
	}
	currentNetworkChainId = chainId
}

export function getNetworkByChainId(chainId: number): Network | undefined {
	return NETWORKS[chainId]
}

export function getRpcUrl(network: Network): string {
	if (network.rpcUrls && network.rpcUrls.length > 0) {
		return network.rpcUrls[0] // 先用第一个
	}
	if (network.rpcUrl) {
		return network.rpcUrl
	}
	throw new Error('No RPC URL configured')
}