# Mantle Sepolia Deployment

## Network

- Network: Mantle Sepolia Testnet
- Chain ID: `5003`
- RPC: `https://rpc.sepolia.mantle.xyz`
- Explorer: `https://explorer.sepolia.mantle.xyz`

## Contract

- Contract Name: `MantleAuditProof`
- Contract Address: `0xd038B95D09831Fe264F0e357Ff9B4B745C0daa1C`

## Example Transaction

- Transaction Hash: `0x5fac6934a83d7c37c532d44b38badc6bb2a1c68cd153471ff63a7e2491d1a57b`
- Explorer: https://explorer.sepolia.mantle.xyz/tx/0x5fac6934a83d7c37c532d44b38badc6bb2a1c68cd153471ff63a7e2491d1a57b

## Live Demo

https://mantle-audit-copilot.netlify.app

## Deployment Steps

### 1. Configure Contract Deployment

Create `contracts/.env`:

```bash
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
PRIVATE_KEY=your_testnet_deployer_private_key
```

Deploy:

```bash
npm run deploy:mantle
```

The script writes deployment metadata to `contracts/deployments/mantleSepolia.json`.

Copy the printed contract address into the web app environment.

### 2. Configure Frontend

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_AUDIT_PROOF_ADDRESS=0xd038B95D09831Fe264F0e357Ff9B4B745C0daa1C
OPENAI_API_KEY=optional_openai_key
OPENAI_MODEL=gpt-4o-mini
```

### 3. Deploy Frontend

Recommended Netlify settings:

- Root directory: repository root
- Build command: `npm run build`
- Environment variables: same values from `apps/web/.env.local`

### 4. Smoke Test

1. Open the hosted demo URL.
2. Connect wallet on Mantle Sepolia.
3. Load sample contract.
4. Run audit.
5. Mint Proof of Audit.
6. Open the Mantle explorer transaction.
7. Open `/audit/:id` and verify hashes match the proof card.

## Security

Never commit `.env`, `.env.local`, private keys, or API keys.
