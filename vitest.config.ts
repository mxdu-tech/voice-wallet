import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		globals: true,
		mockReset: true,
		restoreMocks: true,
		environment: 'happy-dom',
	},
})
