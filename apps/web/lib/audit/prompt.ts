import type { AuditRequest } from "@/lib/types";

export function buildAuditPrompt(input: AuditRequest) {
  return [
    {
      role: "system",
      content:
        "You are Mantle Audit Copilot, an AI DevTools assistant for Solidity builders. Return only valid JSON matching the requested schema. Focus on security risks, Mantle-specific deployment assumptions, and gas optimization. Do not invent vulnerabilities not supported by evidence."
    },
    {
      role: "user",
      content: `Review this Solidity contract for ${input.targetChain || "Mantle Sepolia"}.

Return JSON with these keys:
contractName, targetChain, summary, riskScore, mantleReadiness, findings, gasOptimizations, mantleChecklist, recommendedFixes, disclaimer, generatedAt, model, auditMode, agentId, agentName.

Each finding must include id, title, severity, category, line (number), functionName, evidence (the actual code line), explanation, impact, recommendation, confidence.
Each gas optimization must include id, title, impact, description, recommendation.
Each Mantle checklist item must include id, title, status, detail.
mantleReadiness must include score (0-100), status (Ready with caution/Needs review/Not ready), recommendation.
Use severity values Critical, High, Medium, Low, or Info.
Use category values security, gas, or mantle-readiness.
Use status values Pass, Needs Review, or Missing.
Use confidence values high, medium, or low.
Set auditMode to "ai-enhanced", agentId to "MAC-001", agentName to "Mantle Audit Copilot".
Include this disclaimer exactly: AI audit output is assistive and does not replace a professional security review.

Contract name: ${input.contractName}

Solidity code:
\`\`\`solidity
${input.contractCode}
\`\`\``
    }
  ];
}
