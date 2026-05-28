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
    mantleReadiness: report.mantleReadiness || fallback.mantleReadiness,
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
    model: report.model || fallback.model,
    auditMode: report.auditMode || fallback.auditMode,
    agentId: report.agentId || fallback.agentId,
    agentName: report.agentName || fallback.agentName
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAICompatibleChat({
  baseUrl,
  apiKey,
  model,
  input,
  fallback
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  input: AuditRequest;
  fallback: AuditReport;
}): Promise<AuditReport | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildAuditPrompt(input),
        temperature: 0.2
      })
    },
    20_000
  );

  if (!response.ok) {
    console.warn("AI provider failed:", response.status, await response.text());
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(cleanJsonContent(content));
    return normalizeReport(parsed, { ...fallback, model });
  } catch (error) {
    console.warn("AI provider returned invalid JSON:", error);
    return null;
  }
}

async function runMimoAudit(input: AuditRequest, fallback: AuditReport): Promise<AuditReport | null> {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) return null;

  return callOpenAICompatibleChat({
    baseUrl: process.env.MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/v1",
    apiKey,
    model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
    input,
    fallback
  });
}

async function runOpenAiAudit(input: AuditRequest, fallback: AuditReport): Promise<AuditReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return callOpenAICompatibleChat({
    baseUrl: "https://api.openai.com/v1",
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input,
    fallback
  });
}

async function runAiEnhancedAudit(input: AuditRequest, fallback: AuditReport): Promise<AuditReport> {
  const provider = process.env.AI_PROVIDER || "local";

  try {
    if (provider === "mimo") {
      const mimoReport = await runMimoAudit(input, fallback);
      if (mimoReport) {
        return { ...mimoReport, model: `mimo:${process.env.MIMO_MODEL || mimoReport.model}`, auditMode: "ai-enhanced" as const };
      }
    }

    if (provider === "openai") {
      const openAiReport = await runOpenAiAudit(input, fallback);
      if (openAiReport) {
        return { ...openAiReport, model: `openai:${process.env.OPENAI_MODEL || openAiReport.model}`, auditMode: "ai-enhanced" as const };
      }
    }

    return fallback;
  } catch (error) {
    console.warn("AI audit failed, using local fallback:", error);
    return fallback;
  }
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
  const report = await runAiEnhancedAudit(input, fallback);

  return NextResponse.json(report);
}
