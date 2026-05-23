# Mantle Audit Copilot

AI smart contract audit assistant for the Turing Test Hackathon 2026 Phase 2, AI DevTools track.

Mantle Audit Copilot helps builders review Solidity contracts before shipping on Mantle. It generates a structured AI audit report, highlights security risks, suggests Mantle-aware gas improvements, and mints a non-transferable Proof of Audit on Mantle Sepolia.

## Hackathon Fit

- Track: AI DevTools
- Prompt match: smart gas optimisation tools and Mantle-specific audit assistants
- Chain: Mantle Sepolia
- Demo: add the deployed frontend URL after deployment
- Contract: add the Mantle Sepolia address after deployment
- Example transaction: add the first `submitAudit` transaction after deployment

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

Set these values:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_AUDIT_PROOF_ADDRESS` after contract deployment
- `OPENAI_API_KEY` only if you want live LLM output
- `PRIVATE_KEY` only for deploying the contract

## Contract Commands

```bash
npm --workspace contracts run compile
npm --workspace contracts run test
npm --workspace contracts run deploy:mantle
```

The deployment script writes `contracts/deployments/mantleSepolia.json` and prints the `NEXT_PUBLIC_AUDIT_PROOF_ADDRESS` value needed by the frontend.

## Deployment

See `docs/deployment.md` for the full contract and frontend deployment checklist. Actual Mantle Sepolia deployment requires a funded private key and must not be done with a committed secret.

## Submission Docs

- `docs/architecture.md` includes the architecture diagram and data flow.
- `docs/pitch.md` contains the project pitch.
- `docs/demo-script.md` contains the 2-3 minute demo video script.
- `docs/submission-checklist.md` contains the final hackathon submission checklist.

## Safety Boundary

This is a hackathon MVP. It stores only hashes and minimal metadata on-chain. It does not upload full source code or full reports to a permanent public store by default.
