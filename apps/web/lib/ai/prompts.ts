import type { AuditReport, AuditRequest } from "@/lib/types";

export function buildEnhancementPrompt(input: AuditRequest, localReport: AuditReport) {
  const findingsSummary = localReport.findings
    .map((f) => `- [${f.severity}] ${f.title} (line ${f.line ?? "N/A"}): ${f.explanation}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are Mantle Audit Copilot, a Solidity security assistant for Mantle builders.

You will receive:
1. Solidity source code
2. Deterministic static findings
3. Mantle readiness checklist

Your task:
- Do not invent vulnerabilities not supported by evidence.
- Improve explanations with developer-friendly language.
- Add concrete suggested fixes with code snippets where possible.
- Keep severity aligned with deterministic findings.
- Return strict JSON only.`
    },
    {
      role: "user",
      content: `Enhance this audit report for ${input.targetChain || "Mantle Sepolia"}.

Contract name: ${input.contractName}

Deterministic findings:
${findingsSummary}

Risk Score: ${localReport.riskScore}/100
Mantle Readiness: ${localReport.mantleReadiness.score}/100 (${localReport.mantleReadiness.status})

Return JSON with these keys:
summary (string), findings (array of {id, enhancedExplanation, suggestedPatch}), mantleRecommendation (string).

Only include findings that exist in the deterministic scan. Do not add new findings.

Solidity code:
\`\`\`solidity
${input.contractCode}
\`\`\``
    }
  ];
}
