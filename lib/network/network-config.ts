export interface Network {
	chainId: number
	name: string
	rpcUrls: string[]
}

const NETWORKS: Record<number, Network> = {
	1: {
	  chainId: 1,
	  name: 'Mainnet',
	  rpcUrls: [
		'https://eth.llamarpc.com',
		'https://ethereum.publicnode.com',
	  ],
	},
  
	11155111: {
	  chainId: 11155111,
	  name: 'Sepolia',
	  rpcUrls: [
		'https://sepolia.drpc.org',
		'https://ethereum-sepolia-rpc.publicnode.com',
		'https://rpc.sepolia.org',
	  ],
	},
  
	8453: {
	  chainId: 8453,
	  name: 'Base',
	  rpcUrls: [
		'https://base.drpc.org',
		'https://base.publicnode.com',
	  ],
	},
  
	42161: {
	  chainId: 42161,
	  name: 'Arbitrum',
	  rpcUrls: [
		'https://arbitrum.drpc.org',
		'https://arbitrum.publicnode.com',
	  ],
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

