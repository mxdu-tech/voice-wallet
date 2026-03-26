import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
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
