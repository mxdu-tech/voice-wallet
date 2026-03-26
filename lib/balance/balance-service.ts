import { formatEther } from 'ethers'

export interface BalanceProvider {
	getBalance(): Promise<bigint>
}

export class BalanceService {
	async fetchBalance(account: BalanceProvider): Promise<string> {
		try {
			const balanceWei = await account.getBalance()
			const balanceEth = formatEther(balanceWei)
			return `${balanceEth} ETH`
		} catch (error) {
			console.warn(
				`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
			return '0 ETH'
		}
	}
}
