import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { BalanceDisplay } from './components/BalanceDisplay'
import { CreateWalletForm } from './components/CreateWalletForm'
import { type Network, NetworkSelector } from './components/NetworkSelector'
import { UnlockWalletForm } from './components/UnlockWalletForm'
import { WalletView } from './components/WalletView'
import type { Intent } from '@/lib/types/intent'
import { parseIntentWithAI } from '@/lib/ai/parseIntent'

const NETWORKS: Network[] = [
	{ chainId: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
	{ chainId: 11155111, name: 'Sepolia Testnet', symbol: 'ETH' },
	{ chainId: 8453, name: 'Base', symbol: 'ETH' },
	{ chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
]

function App() {
	const [address, setAddress] = useState<string | null>(null)
	const [balance, setBalance] = useState('0')
	const [currentChainId, setCurrentChainId] = useState(1)
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingBalance, setIsLoadingBalance] = useState(false)
	const [walletExists, setWalletExists] = useState<boolean | null>(null)
	const [unlockError, setUnlockError] = useState('')
	const [voiceInput, setVoiceInput] = useState('')

	const [parsedIntent, setParsedIntent] = useState<Intent | null>(null)
	const [isParsing, setIsParsing] = useState(false)

	useEffect(() => {
		const init = async () => {
			try {
				console.log('[POPUP] Testing background connection...')
				const pingResponse = await chrome.runtime.sendMessage({ type: 'ping' })
				console.log('[POPUP] Ping response:', pingResponse)

				if (!pingResponse || !pingResponse.pong) {
					console.error('[POPUP] Background not responding!')
					alert(
						'ERROR: Background script not responding.\n\nClick "service worker" on chrome://extensions to see errors.',
					)
					return
				}

				console.log('[POPUP] ✓ Background connection OK')
			} catch (error) {
				console.error('[POPUP] Ping failed:', error)
				alert(
					`Cannot connect to background:\n${error}\n\nCheck service worker console.`,
				)
				return
			}

			try {
				const existsResponse = await chrome.runtime.sendMessage({
					type: 'checkWalletExists',
				})
				console.log('[POPUP] checkWalletExists response:', existsResponse)
				const walletExists = existsResponse?.success
					? existsResponse.data
					: false
				setWalletExists(walletExists)

				if (walletExists) {
					const response = await chrome.runtime.sendMessage({
						type: 'getAddress',
					})
					console.log('[POPUP] getAddress response:', response)
					if (response?.success && response?.data) {
						setAddress(response.data)
						const chainResponse = await chrome.runtime.sendMessage({
							type: 'getChainId',
						})
						if (chainResponse?.success) {
							setCurrentChainId(chainResponse.data)
						}
					} else {
						console.log('[POPUP] Wallet exists but is locked')
					}
				} else {
					console.log('[POPUP] No wallet exists yet')
				}
			} catch (error) {
				console.log('[POPUP] Error during init:', error)
				setWalletExists(false)
			}
		}

		init()
	}, [])

	useEffect(() => {
		const handleMessage = (message: { type: string; chainId?: number }) => {
			if (message.type === 'chainChanged' && message.chainId) {
				console.log('[POPUP] Chain changed event received:', message.chainId)
				setCurrentChainId(message.chainId)
			}
		}

		chrome.runtime.onMessage.addListener(handleMessage)
		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage)
		}
	}, [])

	// Fetch balance when address or chain changes
	useEffect(() => {
		if (!address) return

		const fetchBalance = async () => {
			setIsLoadingBalance(true)
			try {
				const response = await chrome.runtime.sendMessage({
					type: 'getBalance',
					chainId: currentChainId,
				})
				setBalance(response?.success ? response.data : '0')
			} catch (error) {
				console.error('Failed to fetch balance:', error)
				setBalance('0')
			} finally {
				setIsLoadingBalance(false)
			}
		}

		fetchBalance()
	}, [address, currentChainId])

	const handleCreateWallet = async (password: string) => {
		setIsLoading(true)
		try {
			console.log('[POPUP] Creating wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'createWallet',
				password,
			})
			console.log('[POPUP] Received response:', response)

			if (!response?.success) {
				console.error('[POPUP] Error from background:', response?.error)
				alert(`Failed to create wallet: ${response?.error || 'Unknown error'}`)
				return
			}

			if (response?.data) {
				console.log('[POPUP] Setting address:', response.data)
				setAddress(response.data)
				setCurrentChainId(1)
				setWalletExists(true)
			} else {
				console.error('[POPUP] No address in response:', response)
				alert('Failed to create wallet: No address returned')
			}
		} catch (error) {
			console.error('[POPUP] Exception during wallet creation:', error)
			alert(
				`Exception: ${error instanceof Error ? error.message : String(error)}`,
			)
		} finally {
			setIsLoading(false)
		}
	}

	const handleUnlockWallet = async (password: string) => {
		setIsLoading(true)
		setUnlockError('')
		try {
			console.log('[POPUP] Unlocking wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'unlockWallet',
				password,
			})
			console.log('[POPUP] Unlock response:', response)

			if (!response?.success) {
				console.error('[POPUP] Error from background:', response?.error)
				setUnlockError(response?.error || 'Failed to unlock wallet')
				return
			}

			if (response?.data) {
				console.log('[POPUP] Wallet unlocked, setting address:', response.data)
				setAddress(response.data)
				setCurrentChainId(1)
			} else {
				console.error('[POPUP] No address in unlock response:', response)
				setUnlockError('Failed to unlock wallet: No address returned')
			}
		} catch (error) {
			console.error('[POPUP] Exception during unlock:', error)
			setUnlockError(
				error instanceof Error ? error.message : 'Failed to unlock wallet',
			)
		} finally {
			setIsLoading(false)
		}
	}

	const handleLockWallet = async () => {
		try {
			console.log('[POPUP] Locking wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'lockWallet',
			})
			console.log('[POPUP] Lock response:', response)

			if (response?.success) {
				setAddress(null)
				console.log('[POPUP] Wallet locked')
			} else {
				console.error('[POPUP] Failed to lock wallet:', response?.error)
				alert(`Failed to lock wallet: ${response?.error || 'Unknown error'}`)
			}
		} catch (error) {
			console.error('[POPUP] Exception during lock:', error)
			alert(
				`Exception: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	const handleNetworkChange = async (chainId: number) => {
		setCurrentChainId(chainId)
		try {
			await chrome.runtime.sendMessage({
				type: 'switchChain',
				chainId,
			})
		} catch (error) {
			console.error('Failed to switch network:', error)
		}
	}

	const handleParseVoiceInput = async () => {
		setIsParsing(true)
		try {
			const intentObject = await parseIntentWithAI(voiceInput)
	
			setParsedIntent(intentObject)
	
			chrome.runtime.sendMessage({
				type: 'VOICE_INTENT',
				payload: intentObject,
			})
		} catch (error) {
			console.error('AI parsing failed:', error)
	
			const fallbackIntent: Intent = {
				action: 'unknown',
				raw: voiceInput,
			}
	
			setParsedIntent(fallbackIntent)
		} finally {
			setIsParsing(false)
		}
	}

	return (
		<div className="w-96 bg-background text-foreground">
			<div className="p-6 space-y-4">
				<div className="text-center mb-6">
					<h1 className="text-2xl font-bold">Voice Wallet</h1>
					<p className="text-sm text-muted-foreground">
						Speak to pay
					</p>
				</div>

				<div className="space-y-3 rounded-xl border p-4">
					<div>
						<h2 className="text-sm font-semibold">Voice Command</h2>
						<p className="text-xs text-muted-foreground">
							Try: send 0.01 ETH to alice
						</p>
					</div>

					<textarea
						value={voiceInput}
						onChange={(e) => setVoiceInput(e.target.value)}
						placeholder="Type your command here..."
						className="w-full min-h-[96px] rounded-md border bg-background px-3 py-2 text-sm"
					/>

					<Button onClick={handleParseVoiceInput} className="w-full" disabled={isParsing}>
						{isParsing ? 'Parsing...' : 'Parse Command'}
					</Button>

					{parsedIntent && (
						<div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
							{parsedIntent && (
								<div className="rounded-md bg-muted p-3 text-sm space-y-1">
									<div>Action: {parsedIntent.action}</div>
									{parsedIntent.amount && <div>Amount: {parsedIntent.amount}</div>}
									{parsedIntent.token && <div>Token: {parsedIntent.token}</div>}
									{parsedIntent.to && <div>To: {parsedIntent.to}</div>}
								</div>
							)}
						</div>
					)}
				</div>

				{walletExists === null ? (
					<div className="text-center text-muted-foreground">Loading...</div>
				) : !address ? (
					walletExists ? (
						<UnlockWalletForm
							onSubmit={handleUnlockWallet}
							isLoading={isLoading}
							error={unlockError}
						/>
					) : (
						<CreateWalletForm
							onSubmit={handleCreateWallet}
							isLoading={isLoading}
						/>
					)
				) : (
					<>
						<WalletView address={address} />
						<BalanceDisplay
							balance={balance}
							symbol={
								NETWORKS.find((n) => n.chainId === currentChainId)?.symbol ||
								'ETH'
							}
							isLoading={isLoadingBalance}
						/>
						<NetworkSelector
							networks={NETWORKS}
							currentChainId={currentChainId}
							onNetworkChange={handleNetworkChange}
						/>
						<Button
							onClick={handleLockWallet}
							variant="secondary"
							className="w-full"
						>
							Lock Wallet
						</Button>
					</>
				)}
			</div>
		</div>
	)
}

export default App
