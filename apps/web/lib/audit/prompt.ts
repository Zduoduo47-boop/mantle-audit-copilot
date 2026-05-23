import type { AuditRequest } from "@/lib/types";

export function buildAuditPrompt(input: AuditRequest) {
  return [
    {
      role: "system",
      content:
        "You are Mantle Audit Copilot, an AI DevTools assistant for Solidity builders. Return only valid JSON matching the requested schema. Focus on security risks, Mantle-specific deployment assumptions, and gas optimization."
    },
    {
      role: "user",
      content: `Review this Solidity contract for ${input.targetChain || "Mantle Sepolia"}.

Return JSON with these keys:
contractName, targetChain, summary, riskScore, findings, gasOptimizations, mantleChecklist, recommendedFixes, disclaimer, generatedAt, model.

Each finding must include id, title, severity, category, description, evidence, recommendation.
Each gas optimization must include id, title, impact, description, recommendation.
Each Mantle checklist item must include id, title, status, detail.
Use severity values High, Medium, Low, or Info.
Use status values Pass, Needs Review, or Missing.
Include this disclaimer exactly: AI audit output is assistive and does not replace a professional security review.

Contract name: ${input.contractName}

Solidity code:
\`\`\`solidity
${input.contractCode}
\`\`\``
    }
  ];
}
