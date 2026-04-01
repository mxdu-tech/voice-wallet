import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { BalanceDisplay } from './components/BalanceDisplay'
import { CreateWalletForm } from './components/CreateWalletForm'
import { type Network, NetworkSelector } from './components/NetworkSelector'
import { UnlockWalletForm } from './components/UnlockWalletForm'
import { ImportWalletForm } from './components/ImportWalletForm'
import { WalletView } from './components/WalletView'
import type { Intent } from '@/lib/types/intent'
import { parseIntentWithAI } from '@/lib/ai/parseIntent'
import { TransactionStorage } from '@/lib/storage/transaction-storage'
import { TxRecord } from '@/lib/transport/types'

const NETWORKS: Network[] = [
	{ chainId: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
	{ chainId: 11155111, name: 'Sepolia Testnet', symbol: 'ETH' },
	{ chainId: 8453, name: 'Base', symbol: 'ETH' },
	{ chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
]

const DEFAULT_CHAIN_ID = 11155111

function App() {
	const [address, setAddress] = useState<string | null>(null)
	const [balance, setBalance] = useState('0')
	const [currentChainId, setCurrentChainId] = useState(DEFAULT_CHAIN_ID)
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingBalance, setIsLoadingBalance] = useState(false)
	const [walletExists, setWalletExists] = useState<boolean | null>(null)
	const [unlockError, setUnlockError] = useState('')
	const [voiceInput, setVoiceInput] = useState('')

	const [parsedIntent, setParsedIntent] = useState<Intent | null>(null)
	const [isParsing, setIsParsing] = useState(false)
	const [showAllHistory, setShowAllHistory] = useState(false)

	const [pendingIntent, setPendingIntent] = useState<Intent | null>(null)

	type TxResult = {
		status: 'sent' | 'failed'
		hash?: string
		amount?: string
		to?: string
		networkName?: string
		error?: string
	}

	const [txResult, setTxResult] = useState<TxResult | null>(null)

	const [authMode, setAuthMode] = useState<'create' | 'import'>('create')

	const [showReveal, setShowReveal] = useState(false)
	const [revealPassword, setRevealPassword] = useState('')
	const [mnemonic, setMnemonic] = useState('')
	const [revealError, setRevealError] = useState('')

	const [copied, setCopied] = useState(false)
	const [txHistory, setTxHistory] = useState<TxRecord[]>([])
	const [copiedHash, setCopiedHash] = useState<string | null>(null)

	const visibleHistory = showAllHistory ? txHistory : txHistory.slice(0, 1)

	useEffect(() => {
		if (!address) return

		const loadHistory = async () => {
			try {
				const records = await TransactionStorage.list()
				setTxHistory(records)
			} catch (error) {
				console.error('Failed to load tx history:', error)
			}
		}
		loadHistory()
	}, [address])

	useEffect(() => {
		const init = async () => {
			try {
				// console.log('[POPUP] Testing background connection...')
				const pingResponse = await chrome.runtime.sendMessage({ type: 'ping' })
				// console.log('[POPUP] Ping response:', pingResponse)

				if (!pingResponse || !pingResponse.pong) {
					console.error('[POPUP] Background not responding!')
					alert(
						'ERROR: Background script not responding.\n\nClick "service worker" on chrome://extensions to see errors.',
					)
					return
				}

				// console.log('[POPUP] ✓ Background connection OK')
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
				// console.log('[POPUP] checkWalletExists response:', existsResponse)
				const walletExists = existsResponse?.success
					? existsResponse.data
					: false
				setWalletExists(walletExists)

				if (walletExists) {
					const response = await chrome.runtime.sendMessage({
						type: 'getAddress',
					})
					// console.log('[POPUP] getAddress response:', response)
					if (response?.success && response?.data) {
						setAddress(response.data)
						const chainResponse = await chrome.runtime.sendMessage({
							type: 'getChainId',
						})
						if (chainResponse?.success) {
							setCurrentChainId(chainResponse.data)
						}
					} else {
						// console.log('[POPUP] Wallet exists but is locked')
					}
				} else {
					// console.log('[POPUP] No wallet exists yet')
				}
			} catch (error) {
				// console.log('[POPUP] Error during init:', error)
				setWalletExists(false)
			}
		}

		init()
	}, [])

	useEffect(() => {
		const handleMessage = (message: { type: string; chainId?: number }) => {
			if (message.type === 'chainChanged' && message.chainId) {
				// console.log('[POPUP] Chain changed event received:', message.chainId)
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

	const handleCopyMnemonic = async () => {
		try {
			await navigator.clipboard.writeText(mnemonic)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch (error) {
			console.error('Failed to copy mnemonic:', error)
		}
	}

	const handleCreateWallet = async (password: string) => {
		setIsLoading(true)
		try {
			// console.log('[POPUP] Creating wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'createWallet',
				password,
			})
			// console.log('[POPUP] Received response:', response)

			if (!response?.success) {
				console.error('[POPUP] Error from background:', response?.error)
				alert(`Failed to create wallet: ${response?.error || 'Unknown error'}`)
				return
			}

			if (response?.data) {
				// console.log('[POPUP] Setting address:', response.data)
				setAddress(response.data)
				setCurrentChainId(DEFAULT_CHAIN_ID)
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

	const handleImportWallet = async (mnemonic: string, password: string) => {
		setIsLoading(true)
		try {
			// console.log('[POPUP] Importing wallet...')
			const normalizedMnemonic = mnemonic.replace(/\s+/g, ' ').trim()
			const response = await chrome.runtime.sendMessage({
				type: 'importWallet',
				mnemonic: normalizedMnemonic,
				password,
			})
			// console.log('[POPUP] Received response:', response)

			if (!response?.success) {
				console.error('[POPUP] Error from background:', response?.error)
				alert(`Failed to create wallet: ${response?.error || 'Unknown error'}`)
				return
			}

			if (response?.data) {
				// console.log('[POPUP] Setting address:', response.data)
				setAddress(response.data)
				setCurrentChainId(DEFAULT_CHAIN_ID)
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
			// console.log('[POPUP] Unlocking wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'unlockWallet',
				password,
			})
			// console.log('[POPUP] Unlock response:', response)

			if (!response?.success) {
				console.error('[POPUP] Error from background:', response?.error)
				setUnlockError(response?.error || 'Failed to unlock wallet')
				return
			}

			if (response?.data) {
				// console.log('[POPUP] Wallet unlocked, setting address:', response.data)
				setAddress(response.data)
				setCurrentChainId(DEFAULT_CHAIN_ID)
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
			// console.log('[POPUP] Locking wallet...')
			const response = await chrome.runtime.sendMessage({
				type: 'lockWallet',
			})
			// console.log('[POPUP] Lock response:', response)

			if (response?.success) {
				setAddress(null)
				setBalance('0')
				setTxResult(null)
				setParsedIntent(null)
				setPendingIntent(null)
				setRevealPassword('')
				setMnemonic('')
				setRevealError('')
				setCopied(false)
				setCopiedHash(null)
				setShowReveal(false)
				setShowAllHistory(false)
				setTxHistory([])
				// // console.log('[POPUP] Wallet locked')
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

	const getExplorerTxUrl = (chainId: number, hash: string) => {
		switch (chainId) {
		  case 1:
			return `https://etherscan.io/tx/${hash}`
		  case 11155111:
			return `https://sepolia.etherscan.io/tx/${hash}`
		  case 8453:
			return `https://basescan.org/tx/${hash}`
		  case 42161:
			return `https://arbiscan.io/tx/${hash}`
		  default:
			return ''
		}
	}

	const handleRevealMnemonic = async () => {
		setRevealError('')
		try {
		  const response = await chrome.runtime.sendMessage({
			type: 'revealMnemonic',
			password: revealPassword,
		  })
	  
		  if (!response?.success) {
			setRevealError(response?.error || 'Failed')
			return
		  }
	  
		  setMnemonic(response.data)
		} catch (error) {
		  setRevealError(
			error instanceof Error ? error.message : 'Failed to reveal mnemonic',
		  )
		}
	  }

	const handleNetworkChange = async (chainId: number) => {
		try {
			const response = await chrome.runtime.sendMessage({
				type: 'switchChain',
				chainId,
			})
			if(response?.success) {
				setCurrentChainId(chainId)
			} else {
				console.error('Failed to switch network:', response?.error)
			}
		} catch (error) {
			console.error('Failed to switch network:', error)
		}
	}

	const shortenHash = (hash: string) => {
		return `${hash.slice(0, 6)}...${hash.slice(-4)}`
	}

	const handleConfirmIntent = async () => {
		if (!pendingIntent) return
	
		setTxResult(null)
		try {
			const response = await chrome.runtime.sendMessage({
				type: 'VOICE_INTENT',
				payload: pendingIntent,
			})
	
			const networkName =
				NETWORKS.find((n) => n.chainId === currentChainId)?.name || 'Unknown Network'
	
			if (response?.success) {
				setTxResult({
					status: 'sent',
					hash: response?.data?.hash,
					amount: pendingIntent.amount,
					to: pendingIntent.to,
					networkName,
				})
	
				if (response?.data?.hash && pendingIntent.amount && pendingIntent.to) {
					await TransactionStorage.add({
						hash: response.data.hash,
						amount: pendingIntent.amount,
						to: pendingIntent.to,
						chainId: currentChainId,
						networkName,
						status: 'sent',
						timestamp: Date.now(),
					})
					const records = await TransactionStorage.list()
					setTxHistory(records)
				}
			} else {
				setTxResult({
					status: 'failed',
					error: response?.error || 'Execution failed',
				})
			}
		} catch (error) {
			setTxResult({
				status: 'failed',
				error: 'Execution failed. Please try again.',
			})
		} finally {
			setPendingIntent(null)
		}
	}

	const handleCancelIntent = () => {
		setPendingIntent(null)
		setTxResult(null)
	}

	const handleParseVoiceInput = async () => {
		setTxResult(null)
		setPendingIntent(null)
		setIsParsing(true)
	
		try {
			const normalizedInput = voiceInput.replace(/\s+/g, ' ').trim()
			const intentObject = await parseIntentWithAI(normalizedInput)
	
			setParsedIntent(intentObject)
	
			if (intentObject.action === 'unknown') {
				setTxResult({
					status: 'failed',
					error: 'Command not recognized. Try "send 0.0001 ETH to 0x..."',
				})
				return
			}
	
			setPendingIntent(intentObject)
		} catch (error) {
			console.error('AI parsing failed:', error)
	
			setTxResult({
				status: 'failed',
				error: 'Could not parse command. Please try again.',
			})
	
			const fallbackIntent: Intent = {
				action: 'unknown',
				raw: voiceInput,
			}
	
			setParsedIntent(fallbackIntent)
			setPendingIntent(null)
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
							Try: send 0.0001 ETH to 0x8ed7af7d0B09B693a81f38947B9Df15c2f008296
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
									{parsedIntent.to && (
										<div className="break-all">
											To: {parsedIntent.to}
										</div>
									)}
								</div>
							)}
						</div>
					)}
					{pendingIntent && pendingIntent.action === 'send' && (
						<div className="rounded-md border p-4 space-y-2 text-sm">
							<div className="font-semibold">Confirm Transaction</div>
							{pendingIntent.amount && <div>Amount: {pendingIntent.amount} ETH</div>}
							{pendingIntent.to && (
								<div>
									<div>To:</div>
									<div className="break-all">{pendingIntent.to}</div>
								</div>
							)}
							<div>
								Network: {NETWORKS.find((n) => n.chainId === currentChainId)?.name}
							</div>

							<div className="grid grid-cols-2 gap-2">
								<Button type="button" variant="outline" onClick={handleCancelIntent}>
									Cancel
								</Button>
								<Button type="button" onClick={handleConfirmIntent}>
									Confirm
								</Button>
							</div>
						</div>
					)}
					{txResult && (
						<div className="rounded-md border p-4 space-y-2 text-sm">
							<div className="font-semibold">
							{txResult.status === 'sent' ? 'Transaction Sent' : 'Transaction Failed'}
							</div>

							{txResult.status === 'sent' ? (
							<>
								{txResult.amount && <div>Amount: {txResult.amount} ETH</div>}
								{txResult.to && <div className="break-all">To: {txResult.to}</div>}
								{txResult.networkName && <div>Network: {txResult.networkName}</div>}
								{txResult.hash && (
									<div
										className="break-all cursor-pointer hover:opacity-80"
										onClick={async () => {
											try {
												await navigator.clipboard.writeText(txResult.hash!)
												setCopiedHash(txResult.hash!)
												setTimeout(() => setCopiedHash(null), 1200)
											} catch (error) {
												console.error('Failed to copy hash:', error)
											}
										}}
									>
										Hash: {shortenHash(txResult.hash!)}{' '}
										{copiedHash === txResult.hash ? '(copied)' : ''}
									</div>
								)}

								{txResult.hash && (
								<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => {
								  const url = getExplorerTxUrl(currentChainId, txResult.hash!)
								  if (url) window.open(url, '_blank')
								}}
							  >
								View on Etherscan ↗
							  </Button>
								)}
							</>
							) : (
							<div className="text-red-500">
								{txResult.error || 'Unknown error'}
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
						<>
							{/* 模式切换 */}
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant={authMode === 'create' ? 'default' : 'outline'}
									onClick={() => {
										setAuthMode('create')
										setUnlockError('')
									}}
								>
									Create
								</Button>
								<Button
									variant={authMode === 'import' ? 'default' : 'outline'}
									onClick={() => {
										setAuthMode('import')
										setUnlockError('')
									}}
								>
									Import
								</Button>
							</div>
					
							{/* 表单 */}
							{authMode === 'create' ? (
								<CreateWalletForm
									onSubmit={handleCreateWallet}
									isLoading={isLoading}
								/>
							) : (
								<ImportWalletForm
									onSubmit={handleImportWallet}
									isLoading={isLoading}
								/>
							)}
						</>
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
						{txHistory.length > 0 ? (
							<div className="rounded-xl border p-4 space-y-3">
								<div className="text-sm font-semibold">Recent Transactions</div>

								<div className="space-y-3">
									{visibleHistory.map((tx) => (
										<div key={tx.hash} className="rounded-md bg-muted p-3 text-sm space-y-1">
											<div className="font-medium">
												{tx.status === 'sent' ? 'Sent' : 'Failed'}
											</div>
											<div>Amount: {tx.amount} ETH</div>
											<div className="break-all">To: {tx.to}</div>
											<div>Network: {tx.networkName}</div>
											<div>Time: {new Date(tx.timestamp).toLocaleString()}</div>
											<div>Hash: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}</div>
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => {
													const url = getExplorerTxUrl(tx.chainId, tx.hash)
													if (url) window.open(url, '_blank')
												}}
											>
												View on Explorer ↗
											</Button>
										</div>
									))}
									{txHistory.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										className="w-full"
										onClick={() => setShowAllHistory((prev) => !prev)}
									>
										{showAllHistory ? 'Show less' : `Show more (${txHistory.length - 1} more)`}
									</Button>
									)}
																	</div>
							</div>
						) : (
							<div className="rounded-xl border p-4 text-sm text-muted-foreground">
								No transactions yet.
							</div>
						)}
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
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setShowReveal(true)
								setRevealPassword('')
								setMnemonic('')
								setRevealError('')
								setCopied(false)
							}}
							>
							Show Recovery Phrase
						</Button>
						{showReveal && (
							<div className="space-y-3 rounded-xl border p-4">
								<h2 className="text-sm font-semibold">Reveal Recovery Phrase</h2>
								<label className="text-sm font-medium">Password</label>
								<input
								type="password"
								value={revealPassword}
								onChange={(e) => setRevealPassword(e.target.value)}
								placeholder="Enter password"
								className="w-full px-3 py-2 border rounded-md bg-background"
								/>

								<Button
								className="w-full"
								onClick={handleRevealMnemonic}
								>
								Confirm
								</Button>

								{revealError && (
								<div className="text-sm text-red-500">{revealError}</div>
								)}

								{mnemonic && (
								<div className="space-y-3 rounded-md bg-muted p-3">
									<div className="text-sm font-medium text-amber-600">
									⚠️ Never share your recovery phrase with anyone.
									</div>

									<div className="text-xs text-muted-foreground">
									Anyone with this phrase can control your wallet and funds.
									</div>

									<div className="text-sm break-words rounded-md border bg-background p-3">
									{mnemonic}
									</div>

									<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={handleCopyMnemonic}
									>
									{copied ? 'Copied' : 'Copy Recovery Phrase'}
									</Button>
								</div>
								)}

								<Button
								variant="ghost"
								className="w-full"
								onClick={() => {
									setShowReveal(false)
									setRevealPassword('')
									setMnemonic('')
									setRevealError('')
									setCopied(false)
								}}
								>
								Close
								</Button>
							</div>
							)}
					</>
				)}
			</div>
		</div>
	)
}

export default App
