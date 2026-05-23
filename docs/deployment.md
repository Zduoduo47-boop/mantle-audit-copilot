# Deployment Guide

## Prerequisites

- A wallet private key with Mantle Sepolia test MNT.
- A WalletConnect project ID.
- Optional `OPENAI_API_KEY` for live LLM reports.
- A frontend host such as Vercel.

Never commit `.env`, `.env.local`, private keys, or API keys.

## 1. Configure Contract Deployment

Create `contracts/.env`:

```bash
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
PRIVATE_KEY=0x...
```

Deploy:

```bash
npm run deploy:mantle
```

The script writes deployment metadata to:

```text
contracts/deployments/mantleSepolia.json
```

Copy the printed contract address into the web app environment.

## 2. Configure Frontend

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_AUDIT_PROOF_ADDRESS=0x_deployed_contract_address
OPENAI_API_KEY=optional_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Build locally before hosting:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

## 3. Deploy Frontend

Recommended Vercel settings:

- Root directory: repository root
- Install command: `npm install`
- Build command: `npm run build`
- Framework preset: Next.js
- Environment variables: same values from `apps/web/.env.local`

After deploy, update `README.md` with:

- Demo URL
- Mantle Sepolia contract address
- First `submitAudit` transaction URL

## 4. Smoke Test

1. Open the hosted demo URL.
2. Connect wallet on Mantle Sepolia.
3. Load sample contract.
4. Run audit.
5. Mint Proof of Audit.
6. Open the Mantle explorer transaction.
7. Open `/audit/:id` and verify hashes match the proof card.
