# Mantle Audit Copilot

Mantle Audit Copilot is an AI DevTool for Solidity audit reports and proof-of-audit on Mantle Sepolia.

It helps Mantle developers scan Solidity contracts, generate audit findings, compute source/report hashes, and record proof of audit on-chain.

## Live Demo

- App: https://mantle-audit-copilot.netlify.app
- Network: Mantle Sepolia Testnet
- Chain ID: 5003

## Deployment

| Item | Value |
|------|-------|
| Network | Mantle Sepolia Testnet |
| Chain ID | `5003` |
| Contract Address | `0xd038B95D09831Fe264F0e357Ff9B4B745C0daa1C` |
| Demo Wallet | `0x5C198c7a84cC8bb46A5a39dcc6d661eFA941a50A` |
| Example Transaction | [View on Mantle Explorer](https://explorer.sepolia.mantle.xyz/tx/0x5fac6934a83d7c37c532d44b38badc6bb2a1c68cd153471ff63a7e2491d1a57b) |

## Features

- Solidity contract input
- Sample vulnerable contract
- Local fallback audit engine
- Risk score and categorized findings
- Reentrancy, tx.origin, privileged operation, and gas optimization checks
- Mantle deployment checklist
- Source hash and report hash generation
- Proof of audit recorded on Mantle Sepolia
- Shareable local audit report page
- Wallet connection through RainbowKit / wagmi

## Mantle Integration

Mantle Audit Copilot is built specifically for Mantle builders.

- Uses Mantle Sepolia Testnet
- Records proof-of-audit transactions on Mantle
- Uses Mantle chain ID `5003`
- Includes a Mantle deployment checklist
- Helps developers review contracts before deploying to Mantle
- Stores source/report hashes on-chain for verifiable audit evidence

## Demo Flow

1. Open the live demo.
2. Connect MetaMask on Mantle Sepolia.
3. Click `Sample` to load the demo vulnerable contract.
4. Click `Run audit`.
5. Review the risk score, security findings, gas suggestions, and Mantle checklist.
6. Click the on-chain proof button.
7. Confirm the MetaMask transaction.
8. Open the Mantle Explorer transaction.
9. Open the audit report page.

## Run Locally

```bash
git clone https://github.com/Zduoduo47-boop/mantle-audit-copilot.git
cd mantle-audit-copilot

# Install dependencies
npm install

# Run web dev server
npm run dev
```

Then open: http://localhost:3000

## Deploy Contract

```bash
cd contracts
cp .env.example .env
# Edit .env with your testnet private key

npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

Required environment variables:

```
PRIVATE_KEY=your_testnet_deployer_private_key
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
```

Do not commit your real `.env` file.

## Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS
- **Wallet**: RainbowKit, wagmi, viem
- **Smart Contract**: Solidity 0.8.24, OpenZeppelin ERC721, Hardhat
- **Audit Engine**: OpenAI (optional) + local deterministic fallback

## Project Structure

```
mantle-audit-copilot/
├── apps/web/              # Next.js frontend
│   ├── app/               # Pages and API routes
│   ├── components/        # React components
│   └── lib/               # Utilities, types, audit engine
├── contracts/             # Solidity contracts
│   ├── contracts/         # MantleAuditProof.sol
│   ├── scripts/           # Deploy script
│   └── test/              # Contract tests
└── docs/                  # Pitch, demo script, deployment info
```

## Environment Variables

### Web (Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_AUDIT_PROOF_ADDRESS` | Yes | Deployed contract address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Recommended | WalletConnect project ID |
| `OPENAI_API_KEY` | Optional | Enables AI-powered audits |

### Contracts (local only)

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key for deployment |
| `MANTLE_SEPOLIA_RPC_URL` | Mantle Sepolia RPC endpoint |

## Disclaimer

Mantle Audit Copilot provides assistive security feedback and does not replace a professional smart contract audit.

## Track

AI DevTools — Mantle Turing Test Hackathon 2026
