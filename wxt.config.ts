import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'wxt'


export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Voice Wallet',
    short_name: 'Voice Wallet',
    description: 'Speak to Pay. A lightweight self-custodial browser wallet for EVM networks with natural-language transaction support.',
    version: '0.1.0',
    action: {
      default_title: 'Voice Wallet'
    },
    permissions: ['storage', 'alarms'],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    web_accessible_resources: [
      {
        resources: ['inpage.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
      nodePolyfills({ include: ['buffer', 'crypto', 'stream', 'util'] }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'), // or "./src" if using src directory
      },
    },
  }),
})
