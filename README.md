# Voice Wallet

🌐 Language: English | [中文](./README.zh.md)

> A lightweight self-custodial browser wallet for EVM networks, focused on natural-language transaction flows and local-first security.

---

## What It Is

Voice Wallet is a lightweight browser extension wallet designed for EVM networks.  
It enables users to create or import wallets, unlock locally, parse natural-language transaction commands, confirm transactions, and broadcast them on-chain.

The product emphasizes:

- Self-custody
- Local-first security
- Explicit transaction confirmation
- Minimal and focused UX

---

## Why Voice Wallet

Traditional wallet interactions can be complex and error-prone.

Voice Wallet explores a more intuitive flow:

- Natural-language input for transaction intent
- Clear separation between parsing and execution
- Mandatory confirmation before any on-chain action
- Reduced cognitive load for simple transfers

---

## Key Capabilities

- Create wallet with encrypted local vault
- Import wallet via BIP-39 mnemonic
- Password-based local unlock
- Recovery phrase reveal with re-authentication
- Natural-language transaction parsing
- Explicit confirmation before sending transactions
- Multi-network support
- RPC fallback for resilience
- Local transaction history
- Auto-lock mechanism
- Compact browser extension UI

---

## Supported Networks

- Ethereum Mainnet  
- Sepolia Testnet  
- Base  
- Arbitrum  

Default network: **Sepolia Testnet**

---

## Transaction Flow

1. Enter a natural-language command  
2. Parse into a structured intent  
3. Review amount, address, and network  
4. Confirm transaction  
5. Broadcast to network  
6. Display result and store locally  

> Parsing does not trigger execution. All transactions require explicit confirmation.

---

## Security Architecture

### Encrypted Vault
Sensitive wallet data is encrypted before being stored locally.

### Password Unlock
Wallet access requires password-based decryption.

### Memory-only Session
Unlocked state is stored only in runtime memory.  
A restart requires re-unlock.

### Recovery Phrase Protection
Revealing the mnemonic requires password re-authentication.

### Explicit Confirmation
No transaction is executed without user confirmation.

---

## Security Principles

- Local-first custody  
- Explicit transaction confirmation  
- Password-protected vault  
- Memory-only unlock session  
- Minimal permissions  

---

## Current Scope

The current version focuses on:

- Native ETH transfers  
- Selected EVM networks  
- Extension-based wallet UX  
- Local transaction history  

---

## Future Expansion

Planned improvements include:

- ERC-20 token support  
- Multi-account management  
- Enhanced transaction confirmation UX  
- Richer transaction history  
- dApp provider integration  
- Fine-grained permission control  
- Stronger security hardening  

---

## Demo

- Demo Video: Coming soon  
- Chrome Extension Preview: Coming soon  

---

## Getting Started (For Users)

### Install Extension

1. Build the project (see Developer section)
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select the build directory

---

### Create Wallet

- Open extension  
- Click "Create"  
- Set password  

---

### Import Wallet

- Click "Import"  
- Enter mnemonic  
- Set password  

---

### Unlock

- Enter password  

---

### Send Transaction

Example:
```
send 0.0001 ETH to 0x…
```
Steps:

1. Parse command  
2. Review intent  
3. Confirm  
4. View result  

---

## For Developers

### Setup
```
npm install
npm run dev
npm run build
```

---

### Load Extension

- Open Chrome Extensions  
- Enable Developer Mode  
- Load unpacked  
- Select build output  

---

---

### Extensibility

You can extend:

- Token support  
- Intent parsing  
- Network handling  
- Security model  
- UI/UX  

---

## Built With

- WXT  
- React  
- TypeScript  
- WDK Wallet EVM  
- viem  
- ethers  
- Web Crypto API  
- bip39  

---

## Attribution

This project builds on open-source tools and infrastructure including:

- Wallet Development Kit (WDK)  
- EVM ecosystem tooling  
- Chrome Extension APIs  

All dependencies remain subject to their respective licenses.

---

## Roadmap

- ERC-20 transfers  
- Improved UX  
- Better history system  
- Multi-account support  
- Security enhancements  
- dApp integration  

---

## Disclaimer

Voice Wallet is a self-custodial wallet.

Users are fully responsible for:

- Password management  
- Recovery phrase storage  
- Transaction verification  
- Operational environment security  

Blockchain transactions are irreversible.  
Any loss due to misuse, exposure, or environment risk is the user's responsibility.

---

## Links (to be added)

- GitHub Repository: [Voice Wallet](https://github.com/your-username/voice-wallet)
- Demo Video: （待补充）
- Chrome Web Store: （待补充）
- WDK Showcase: （待补充）


---

## License

This project is licensed under the MIT License.

See the [LICENSE](./LICENSE) file for details.

---

## Attribution

This project is built upon the WDK Starter Browser Extension (Apache-2.0).

Portions of the original implementation and structure are derived from the WDK ecosystem and its associated open-source components.