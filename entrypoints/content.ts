export default defineContentScript({
	matches: ['<all_urls>'],
	runAt: 'document_start',
	main() {
		console.log('[CONTENT] Content script starting on:', window.location.href)
		injectInpageScript()
		setupMessageBridge()
		console.log('[CONTENT] Content script initialized')
	},
})

function injectInpageScript() {
	console.log('[CONTENT] Injecting inpage script')
	const script = document.createElement('script')
	script.type = 'module'
	const scriptUrl = browser.runtime.getURL('inpage.js' as any)
	console.log('[CONTENT] Inpage script URL:', scriptUrl)
	script.src = scriptUrl
	script.onload = () => {
		console.log('[CONTENT] Inpage script loaded successfully')
		script.remove()
	}
	script.onerror = (error) => {
		console.error('[CONTENT] Failed to load inpage script:', error)
	}
	const target = document.head || document.documentElement
	target.appendChild(script)
	console.log('[CONTENT] Inpage script injected into', target.tagName)
}

function setupMessageBridge() {
	console.log('[CONTENT] Setting up message bridge')
	window.addEventListener('message', async (event) => {
		if (event.source !== window || event.data.type !== 'INPAGE_REQUEST') {
			return
		}

		const { id, method, params } = event.data
		console.log('[CONTENT] Received INPAGE_REQUEST:', method, params)

		try {
			const result = await browser.runtime.sendMessage({
				type: 'PROVIDER_REQUEST',
				method,
				params,
			})

			console.log('[CONTENT] Background response:', result)

			if (result && typeof result === 'object' && 'error' in result) {
				window.postMessage(
					{
						type: 'INPAGE_RESPONSE',
						id,
						error: result.error,
					},
					'*',
				)
			} else {
				window.postMessage(
					{
						type: 'INPAGE_RESPONSE',
						id,
						result,
					},
					'*',
				)
			}
		} catch (error) {
			console.error('[CONTENT] Background request failed:', error)
			window.postMessage(
				{
					type: 'INPAGE_RESPONSE',
					id,
					error: error instanceof Error ? error.message : 'Unknown error',
				},
				'*',
			)
		}
	})
	console.log('[CONTENT] Message bridge ready')
}
