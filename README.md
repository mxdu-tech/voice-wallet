# WDK Browser Extension Starter

A starter template for building browser extension wallets with the [Tether Wallet Development Kit (WDK)](https://docs.wallet.tether.io/sdk/get-started). Clone, customize, and ship your own self-custodial wallet.

<p align="center">
  <img src="docs/showcase.gif" alt="Showcase" width="600" />
</p>

<p align="center">
  <img src="docs/create-new-wallet.png" alt="Create new wallet" width="250" />
  <img src="docs/dashboard.png" alt="Wallet dashboard" width="250" />
  <img src="docs/switch-network.png" alt="Network switcher" width="250" />
</p>

## Overview

This project is a ready-to-use starting point for building a non-custodial browser extension wallet on top of **[WDK](https://wallet.tether.io/)** - Tether's modular, stateless, self-custodial SDK for multi-chain wallet development. Private keys never leave the user's device and no data is stored by WDK.

The starter comes pre-wired with EVM support (via `@tetherto/wdk-wallet-evm`), password-encrypted vault storage, EIP-1193/EIP-6963 dApp integration, and a popup UI built with React 19 and shadcn/ui. Extend it with additional WDK wallet modules (Bitcoin, TON, TRON, Solana, etc.) or protocol modules (swaps, bridges, lending) as needed.

## Technology Stack

### Wallet

- **[WDK (Wallet Development Kit)](https://docs.wallet.tether.io/sdk/get-started)** - Tether's self-custodial, stateless wallet SDK
  - `@tetherto/wdk-wallet-evm` - EVM wallet module with BIP-39/BIP-44 support
- **ethers.js 6** - Ethereum library for blockchain interactions
- **bip39** - Mnemonic seed phrase generation and validation

### Extension Framework

- **[WXT](https://wxt.dev/)** - Modern web extension framework with hot-reload, TypeScript support, and cross-browser compatibility (Chrome, Firefox)
- **React 19** - Latest React with concurrent features and improved hooks
- **TypeScript 5.9** - Type-safe development with strict mode enabled

### UI & Styling

- **Tailwind CSS v4** - Utility-first CSS framework with custom design system
- **shadcn/ui** - High-quality, accessible component library
- **class-variance-authority** - Type-safe variant management for components

### Build & Development

- **Vite** - Lightning-fast bundler with HMR
- **Vitest** - Unit testing framework

## Security & Web3 Architecture

### Secret Recovery Phrase Encryption

The wallet uses **military-grade encryption** to protect your secret recovery phrase:

**Encryption Algorithm**: AES-256-GCM (Galois/Counter Mode)

- **Key Length**: 256 bits (strongest AES variant)
- **Authentication**: Built-in authentication tag prevents tampering
- **IV (Initialization Vector)**: 12 bytes, randomly generated per encryption

**Key Derivation**: PBKDF2 (Password-Based Key Derivation Function 2)

- **Hash Algorithm**: SHA-256
- **Iterations**: 600,000 (OWASP recommended as of 2023)
- **Salt**: 16 bytes, cryptographically random per password

**Implementation** (`lib/crypto/vault.ts`):

```typescript
// User's password → PBKDF2 (600k iterations) → 256-bit key
// Mnemonic → AES-256-GCM encryption → Ciphertext + IV + Salt
// Stored: { ciphertext, iv, salt, kdf, encryption, createdAt }
```

The encrypted vault is **never decrypted** except when:

1. User unlocks wallet with password
2. Mnemonic is needed to sign transactions
3. Immediately cleared from memory after use via `dispose()` methods

### WXT Storage: Why We Use It

**[WXT Storage](https://wxt.dev/guide/storage.html)** is used instead of raw `chrome.storage` for several critical reasons:

1. **Type-Safe API**: TypeScript-first with automatic serialization
2. **Cross-Browser Compatibility**: Abstracts browser differences (Chrome vs Firefox)
3. **Reactive Updates**: Built-in watchers for storage changes across extension contexts
4. **Migration Support**: Versioned storage with automatic migration paths
5. **Prefix Isolation**: Automatic key prefixing prevents collisions

**Usage** (`lib/storage/vault-storage.ts`):

```typescript
import { storage } from 'wxt/utils/storage'

// Stores in chrome.storage.local with 'local:' prefix
await storage.setItem('local:vault', encryptedVault)
```

**Storage Location**: Browser's encrypted storage API (`chrome.storage.local`)

- Encrypted at rest by the browser
- Isolated per extension
- Survives browser restarts
- **NOT** synced across devices (sensitive data stays local)

### EIP-6963: Multi-Wallet Discovery

**[EIP-6963](https://eips.ethereum.org/EIPS/eip-6963)** is a standard for **multi-wallet discovery** in web3.

**The Problem It Solves**:

- Old approach: Every wallet fights for `window.ethereum`
- Result: Last-loaded wallet wins, others get overwritten
- Users couldn't choose their preferred wallet

**How EIP-6963 Works**:

1. **Wallet Announces**: Extension dispatches `eip6963:announceProvider` event with metadata
2. **dApp Requests**: dApp dispatches `eip6963:requestProvider` to discover all wallets
3. **User Chooses**: dApp shows wallet selector, user picks WDK Browser Extension Wallet
4. **Clean Coexistence**: All wallets available without conflicts

**Implementation** (`entrypoints/inpage.ts`):

```typescript
// Announce Wallet to dApps
const providerInfo = {
  uuid: crypto.randomUUID(), // Unique session ID
  name: 'WDK Browser Extension Wallet', // Display name
  icon: 'data:image/svg+xml,...', // Base64 SVG logo
  rdns: 'com.wdk.wallet', // Reverse DNS identifier
}

window.dispatchEvent(
  new CustomEvent('eip6963:announceProvider', {
    detail: { info: providerInfo, provider: inpageProvider },
  }),
)
```

**Result**: WDK Browser Extension Wallet appears in dApp wallet selectors alongside MetaMask, Coinbase Wallet, etc.

### window.ethereum: Legacy Compatibility

**Why We Still Inject `window.ethereum`**:

```typescript
Object.defineProperty(window, 'ethereum', {
  value: provider,
  writable: false,
  configurable: false,
})
```

**Reasons**:

1. **Backward Compatibility**: Many dApps built before EIP-6963 only check `window.ethereum`
2. **Default Wallet UX**: Users who only have WDK Browser Extension Wallet installed get instant access
3. **Standard Compliance**: EIP-1193 (Ethereum Provider API) requires this pattern

**Trade-off**: If multiple wallets are installed, the last-loaded wallet "wins" `window.ethereum`. This is why EIP-6963 exists—it lets users choose explicitly.

### Extension Architecture

**Three-Layer Isolation**:

1. **Background Script** (`entrypoints/background.ts`)
   - Runs in isolated extension context
   - Manages wallet session and encrypted vault
   - Has access to `chrome.storage` and extension APIs
   - **Never exposed to web pages**

2. **Content Script** (`entrypoints/content.ts`)
   - Runs in page context but isolated from page JS
   - Acts as **message bridge** between inpage ↔ background
   - Prevents page scripts from accessing extension APIs

3. **Inpage Script** (`entrypoints/inpage.ts`)
   - Runs in **page's JavaScript context** (same as dApp code)
   - Exposes `window.ethereum` provider
   - Sends requests via `postMessage` to content script
   - **No direct access** to wallet keys or extension APIs

**Security Model**:

```
dApp JS → window.ethereum.request()
    ↓ (postMessage)
Content Script → browser.runtime.sendMessage()
    ↓ (chrome messaging)
Background Script → WalletSession → Decrypt Vault → Sign TX
    ↓ (response)
Content Script → window.postMessage()
    ↓ (response)
dApp JS ← transaction hash
```

**Key Security Properties**:

- dApp **never** sees your private keys or mnemonic
- All signatures happen in background script
- User must explicitly unlock wallet with password
- Session expires after inactivity
- Content Security Policy prevents inline scripts

## Project Structure

```
wdk-starter-browser-extension/
├── entrypoints/             # Extension entry points
│   ├── popup/               # Extension popup UI (React)
│   ├── background.ts
│   ├── content.ts
│   └── inpage.ts
├── lib/
│   ├── crypto/              # Vault encryption (AES-256-GCM)
│   ├── storage/             # WXT storage abstractions
│   ├── session/             # Wallet session management
│   ├── providers/           # EIP-1193 & EIP-6963 providers
│   ├── balance/             # Token balance queries
│   ├── network/             # Network/chain configuration
│   └── transport/           # Extension messaging layer
├── components/
│   └── ui/                  # shadcn/ui components
├── assets/                  # Static assets (CSS, SVGs)
├── public/                  # Extension icons
├── wxt.config.ts
├── vitest.config.ts
└── tsconfig.json
```

### Quick Start

```bash
# Install dependencies
npm install

# Start extension in dev mode (Chrome)
npm run dev

# Start extension in dev mode (Firefox)
npm run dev:firefox

# Run tests
npm test

# Lint and format
npm run lint
```

### Building for Production

```bash
# Build for Chrome
npm run build

# Build for Firefox
npm run build:firefox

# Create distribution zips
npm run zip
```

### Loading the Extension

**Chrome:**

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `.output/chrome-mv3/` directory

**Firefox:**

1. Run `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select any file inside `.output/firefox-mv3/`

### Testing the Extension

1. Click the extension icon in the toolbar and create a wallet
2. Open any dApp (e.g. [app.uniswap.org](https://app.uniswap.org)) and click **Connect Wallet** — the extension should appear via EIP-6963

A bundled test dApp is included at [`test-dapp.html`](test-dapp.html) for verifying provider detection, wallet connection, and network switching without a real dApp:

```bash
# serve it locally
npx serve . -l 8080
# then open http://localhost:8080/test-dapp.html
```

![Test dApp connection](docs/dapp-connection.png)

To debug, inspect the background service worker from `chrome://extensions/` → **service worker** link.

### Running Tests

```bash
npm test
```

## Standards Compliance

- **[EIP-1193](https://eips.ethereum.org/EIPS/eip-1193)**: Ethereum Provider JavaScript API
- **[EIP-6963](https://eips.ethereum.org/EIPS/eip-6963)**: Multi-Wallet Discovery Standard
- **[BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)**: Mnemonic Seed Phrases
- **[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)**: Multi-Account Hierarchy (m/44'/60'/0'/0/n)

## License

Apache-2.0 - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please open an issue on the GitHub repository.

## Additional Resources

- **[WDK Documentation](https://docs.wallet.tether.io)** - Wallet Development Kit guides
- **[WXT Documentation](https://wxt.dev/)** - Web Extension Framework
- **[WDK Wallet Cosmos](https://github.com/base58-io/wdk-wallet-cosmos)** - A simple and secure package to manage BIP-44 wallets for Cosmos-compatible blockchains.
