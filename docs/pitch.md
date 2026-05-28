# Mantle Audit Copilot Pitch

## One-liner

Mantle Audit Copilot is a verifiable AI security agent that turns Solidity pre-audits into on-chain proof of audit decisions on Mantle Sepolia.

## Problem

Hackathon builders move fast and often deploy contracts without a structured review. Full professional audits are expensive and slow, while generic AI feedback rarely understands the deployment context and produces no verifiable output.

## Solution

Mantle Audit Copilot gives builders a fast, verifiable pre-audit workflow:

- Paste Solidity code.
- Receive structured security findings with line numbers, evidence, and fix suggestions.
- Receive a Mantle Deployment Readiness Score.
- Hash the source and report.
- Mint a Proof of Audit SBT on Mantle Sepolia.
- Share a public audit report link that works across devices.

Each audit is treated as an AI agent decision. The source hash and report hash are anchored on Mantle Sepolia as verifiable evidence of the agent output.

## Agent Identity

The auditor operates as an AI security agent (MAC-001) with a deterministic local scanner and optional MiMo/OpenAI enhancement. Each audit produces a verifiable artifact: source hash + report hash + on-chain transaction.

Designed to be extended toward ERC-8004-style agent identity and reputation.

## Why Mantle

The tool is built for the AI DevTools track and maps directly to Mantle-specific audit assistants and smart gas optimisation tools. It helps more builders ship safer contracts into Mantle's ecosystem with verifiable audit evidence.

## Demo Script

1. Connect a wallet on Mantle Sepolia.
2. Load the vulnerable demo contract.
3. Run the audit and show high-risk findings with line numbers and evidence.
4. Show the Mantle Deployment Readiness Score.
5. Show the Agent Identity card.
6. Mint the Proof of Audit.
7. Open the report page with Proof Verification.
8. Open the Mantle explorer transaction.
