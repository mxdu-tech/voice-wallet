import type { Message } from '@/lib'
import { MessageHandler, WalletSession } from '@/lib'

class ExpectedUserError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ExpectedUserError'
	}
}

export default defineBackground(async () => {
	console.log('=== BACKGROUND SCRIPT STARTING ===')

	let session: WalletSession
	let messageHandler: MessageHandler

	const AUTO_LOCK_ALARM = 'wallet-auto-lock'
	const AUTO_LOCK_MINUTES = 15

	async function resetAutoLockAlarm() {
		await chrome.alarms.clear(AUTO_LOCK_ALARM)

		if (session.isUnlocked()) {
			await chrome.alarms.create(AUTO_LOCK_ALARM, {
				delayInMinutes: AUTO_LOCK_MINUTES,
			})
		}
	}

	chrome.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name === AUTO_LOCK_ALARM && session.isUnlocked()) {
			console.log('=== AUTO-LOCK: Locking wallet after inactivity ===')
			await session.lock()
		}
	})

	try {
		session = new WalletSession()
		messageHandler = new MessageHandler(session)

		const restored = await session.restore()
		if (restored) {
			console.log('=== SESSION RESTORED ===')
			await resetAutoLockAlarm()
		}
	} catch (error) {
		console.error('=== FATAL: Failed to initialize ===', error)
		throw error
	}

	chrome.runtime.onMessage.addListener(
		(
			message: Message | any,
			_sender,
			sendResponse: (response: any) => void,
		) => {
			console.log('=== MESSAGE RECEIVED ===', message)

			resetAutoLockAlarm().catch(console.error)

			if ((message as any).type === 'ping') {
				sendResponse({ pong: true })
				return true
			}

			if ((message as any).type === 'PROVIDER_REQUEST') {
				console.log(
					'=== PROVIDER_REQUEST from dApp ===',
					message.method,
					'params:',
					message.params,
				)
				handleProviderRequest(message.method, message.params || [])
					.then((result) => {
						console.log(
							'=== Provider result (SUCCESS) ===',
							result,
							'type:',
							typeof result,
							'isArray:',
							Array.isArray(result),
						)
						sendResponse(result)
					})
					.catch((error) => {
						const errorMessage =
							error instanceof Error ? error.message : 'Unknown error'

						if (error instanceof ExpectedUserError) {
							console.warn('=== User action needed ===', errorMessage)
							chrome.action.openPopup().catch(() => {
								console.warn(
									'Could not open popup automatically. User needs to click extension icon.',
								)
							})
						} else {
							console.error('=== Provider error ===', error)
							console.error('Error details:', error.message, error.stack)
						}

						sendResponse({
							error: errorMessage,
						})
					})
				return true
			}

			console.log('=== Calling messageHandler.handle() ===')
			messageHandler
				.handle(message)
				.then((response) => {
					console.log('=== MessageHandler response ===', response)

					if (!response.success) {
						const isExpectedError =
							response.error === 'No wallet created' ||
							response.error?.includes('No wallet found')

						if (!isExpectedError) {
							console.error('=== Handler returned error ===', response.error)
						}

						sendResponse({ success: false, error: response.error })
						return
					}

					if (message.type === 'switchChain' && response.success) {
						chrome.runtime
							.sendMessage({
								type: 'chainChanged',
								chainId: response.data,
							})
							.catch(() => {})
					}

					sendResponse(response)
				})
				.catch((error) => {
					console.error('=== MessageHandler.handle() threw error ===', error)
					sendResponse({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
					})
				})

			return true
		},
	)

	async function handleProviderRequest(
		method: string,
		params: unknown[],
	): Promise<unknown> {
		console.log(`=== Handling ${method} ===`)

		switch (method) {
			case 'eth_chainId': {
				const chainId = messageHandler.getCurrentChainId()
				return `0x${chainId.toString(16)}`
			}

			case 'eth_accounts': {
				console.log('=== eth_accounts: checking wallet ===')
				const wallet = session.get()
				console.log('=== Wallet exists? ===', !!wallet)
				if (!wallet) {
					console.log('=== No wallet, returning empty array ===')
					return []
				}
				console.log('=== Getting account 0 ===')
				const account = await wallet.getAccount(0)
				const address = await account.getAddress()
				console.log('=== Returning address ===', address)
				return [address]
			}

			case 'eth_requestAccounts': {
				console.log('=== eth_requestAccounts: checking wallet ===')
				const wallet = session.get()
				console.log('=== Wallet exists? ===', !!wallet)
				if (!wallet) {
					console.warn(
						'=== No wallet created - user needs to create wallet ===',
					)
					throw new ExpectedUserError(
						'No wallet created. Please create a wallet first.',
					)
				}
				console.log('=== Getting account 0 ===')
				const account = await wallet.getAccount(0)
				console.log('=== Account retrieved, getting address ===')
				const address = await account.getAddress()
				console.log('=== Address retrieved ===', address)
				const result = [address]
				console.log('=== Returning result ===', result)
				return result
			}

			case 'wallet_switchEthereumChain': {
				const chainIdParam = (params[0] as any)?.chainId
				if (!chainIdParam) {
					throw new Error('Missing chainId parameter')
				}
				const chainId = Number.parseInt(chainIdParam, 16)
				const response = await messageHandler.handle({
					type: 'switchChain',
					chainId,
				})
				if (!response.success) {
					const isExpectedError =
						response.error?.includes('locked') ||
						response.error?.includes('No wallet')
					if (isExpectedError) {
						console.warn(
							'=== Expected error during chain switch ===',
							response.error,
						)
						throw new ExpectedUserError(
							response.error || 'Failed to switch chain',
						)
					}
					throw new Error(response.error || 'Failed to switch chain')
				}

				chrome.runtime
					.sendMessage({
						type: 'chainChanged',
						chainId,
					})
					.catch(() => {})

				return null
			}

			case 'eth_sendTransaction':
				throw new Error('Transaction signing not implemented in demo')

			default:
				throw new Error(`Method ${method} not supported`)
		}
	}

	console.log('=== BACKGROUND SCRIPT READY ===')
})
