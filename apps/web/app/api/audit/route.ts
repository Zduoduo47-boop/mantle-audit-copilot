import { NextRequest, NextResponse } from "next/server";
import { buildAuditPrompt } from "@/lib/audit/prompt";
import { analyzeContractLocally, DISCLAIMER } from "@/lib/audit/offlineAuditor";
import type { AuditReport, AuditRequest } from "@/lib/types";

function cleanJsonContent(content: string) {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

function normalizeReport(report: Partial<AuditReport>, fallback: AuditReport): AuditReport {
  return {
    ...fallback,
    ...report,
    contractName: report.contractName || fallback.contractName,
    targetChain: report.targetChain || fallback.targetChain,
    summary: report.summary || fallback.summary,
    riskScore: typeof report.riskScore === "number" ? Math.max(0, Math.min(100, report.riskScore)) : fallback.riskScore,
    findings: Array.isArray(report.findings) && report.findings.length > 0 ? report.findings : fallback.findings,
    gasOptimizations:
      Array.isArray(report.gasOptimizations) && report.gasOptimizations.length > 0
        ? report.gasOptimizations
        : fallback.gasOptimizations,
    mantleChecklist:
      Array.isArray(report.mantleChecklist) && report.mantleChecklist.length > 0
        ? report.mantleChecklist
        : fallback.mantleChecklist,
    recommendedFixes:
      Array.isArray(report.recommendedFixes) && report.recommendedFixes.length > 0
        ? report.recommendedFixes
        : fallback.recommendedFixes,
    disclaimer: DISCLAIMER,
    generatedAt: report.generatedAt || new Date().toISOString(),
    model: report.model || fallback.model
  };
}

async function runOpenAiAudit(input: AuditRequest, fallback: AuditReport): Promise<AuditReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: buildAuditPrompt(input),
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return null;
  }

  const parsed = JSON.parse(cleanJsonContent(content));
  return normalizeReport(parsed, {
    ...fallback,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  });
}

export async function POST(request: NextRequest) {
  let body: AuditRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.contractCode || body.contractCode.trim().length < 40) {
    return NextResponse.json({ error: "Contract code is too short to audit." }, { status: 400 });
  }

  const input: AuditRequest = {
    contractCode: body.contractCode,
    contractName: body.contractName || "UntitledContract",
    targetChain: body.targetChain || "Mantle Sepolia"
  };
  const fallback = analyzeContractLocally(input);

  try {
    const aiReport = await runOpenAiAudit(input, fallback);
    return NextResponse.json(aiReport || fallback);
  } catch {
    return NextResponse.json(fallback);
  }
}
