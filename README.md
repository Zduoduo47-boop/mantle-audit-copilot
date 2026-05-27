# Mantle Audit Copilot

AI smart contract audit assistant for the Turing Test Hackathon 2026 Phase 2, AI DevTools track.

Mantle Audit Copilot helps builders review Solidity contracts before shipping on Mantle. It generates a structured AI audit report, highlights security risks, suggests Mantle-aware gas improvements, and mints a non-transferable Proof of Audit on Mantle Sepolia.

## Live Demo

**https://mantle-audit-copilot.netlify.app**

## Network

Mantle Sepolia Testnet (Chain ID: 5003)

## Contract

| Item | Value |
|------|-------|
| Contract Address | `0xd038B95D09831Fe264F0e357Ff9B4B745C0daa1C` |
| Demo Wallet | `0x5C198c7a84cC8bb46A5a39dcc6d661eFA941a50A` |
| Example Transaction | [0x5fac69...1a57b](https://explorer.sepolia.mantle.xyz/tx/0x5fac6934a83d7c37c532d44b38badc6bb2a1c68cd153471ff63a7e2491d1a57b) |

## Hackathon Fit

- Track: AI DevTools
- Prompt match: smart gas optimisation tools and Mantle-specific audit assistants
- Chain: Mantle Sepolia

## Core Flow

1. Connect a wallet on Mantle Sepolia.
2. Paste Solidity code or load the demo contract.
3. Generate a structured audit report with risk score, findings, fixes, and Mantle checklist.
4. Hash the source and report.
5. Submit both hashes on-chain and mint a non-transferable Proof of Audit.
6. Share the local report page at `/audit/:id` for demo review.

## Mantle Touchpoints

- Mantle Sepolia is configured as the primary chain in wagmi and RainbowKit.
- `MantleAuditProof.sol` stores source/report hashes and mints Proof of Audit SBTs.
- The UI links transactions to the Mantle Sepolia explorer.
- The report includes Mantle deployment checks such as L2 gas behavior, chain ID assumptions, bridge assumptions, and token decimal handling.

## AI Behavior

The API route uses `OPENAI_API_KEY` when available. Without a key, it falls back to a deterministic local analyzer so the demo remains usable during judging.

The report always includes this disclaimer: AI audit output is assistive and does not replace a professional security review.

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
└── docs/                  # Pitch and demo script
```

## Local Setup

```bash
npm install
npm run test
npm run contracts:compile
npm run dev
```

The web app runs at `http://localhost:3000` unless that port is already in use.

## Environment

Copy the examples before running:

```bash
cp apps/web/.env.example apps/web/.env.local
cp contracts/.env.example contracts/.env
```

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

## Contract Commands

```bash
npm --workspace contracts run compile
npm --workspace contracts run test
npm --workspace contracts run deploy:mantle
```

The deployment script writes `contracts/deployments/mantleSepolia.json` and prints the `NEXT_PUBLIC_AUDIT_PROOF_ADDRESS` value needed by the frontend.

## Submission Docs

- `docs/pitch.md` contains the project pitch.
- `docs/demo-script.md` contains the 2-3 minute demo video script.

## Safety Boundary

This is a hackathon MVP. It stores only hashes and minimal metadata on-chain. It does not upload full source code or full reports to a permanent public store by default.
