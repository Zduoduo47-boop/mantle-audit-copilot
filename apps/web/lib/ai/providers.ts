import type { AuditReport, AuditRequest } from "@/lib/types";
import { buildEnhancementPrompt } from "./prompts";

export type AIProvider = "local" | "openai" | "mimo";

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || "local") as AIProvider;

  if (provider === "mimo" && process.env.MIMO_API_KEY) {
    return {
      provider: "mimo",
      apiKey: process.env.MIMO_API_KEY,
      baseUrl: process.env.MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/v1",
      model: process.env.MIMO_MODEL || "mimo-v2.5-pro"
    };
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    };
  }

  return { provider: "local" };
}

function cleanJsonContent(content: string): string {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn("AI provider failed", {
        status: response.status,
        providerBaseUrl: baseUrl,
        model,
        errorText
      });
      return null;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return null;
    }

    return JSON.parse(cleanJsonContent(content));
  } catch (error) {
    console.warn("AI provider call threw:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeEnhancement(localReport: AuditReport, enhancement: Record<string, unknown>): AuditReport {
  const findings = Array.isArray(enhancement.findings) ? enhancement.findings : [];
  const enhancedFindings = localReport.findings.map((localFinding) => {
    const enhanced = findings.find((f: Record<string, unknown>) => f.id === localFinding.id);
    if (enhanced) {
      return {
        ...localFinding,
        explanation: (enhanced.enhancedExplanation as string) || localFinding.explanation,
        recommendation: (enhanced.suggestedPatch as string) || localFinding.recommendation
      };
    }
    return localFinding;
  });

  return {
    ...localReport,
    summary: (enhancement.summary as string) || localReport.summary,
    findings: enhancedFindings,
    mantleReadiness: {
      ...localReport.mantleReadiness,
      recommendation: (enhancement.mantleRecommendation as string) || localReport.mantleReadiness.recommendation
    }
  };
}

export async function enhanceAudit(
  input: AuditRequest,
  localReport: AuditReport
): Promise<AuditReport> {
  const config = getAIConfig();

  if (config.provider === "local" || !config.apiKey) {
    return {
      ...localReport,
      auditMode: "deterministic",
      model: "local-deterministic-auditor"
    };
  }

  const messages = buildEnhancementPrompt(input, localReport);
  const enhancement = await callOpenAICompatible(config.baseUrl!, config.apiKey, config.model!, messages);

  if (!enhancement) {
    return {
      ...localReport,
      auditMode: "deterministic",
      model: `local-deterministic-auditor (${config.provider} unavailable)`
    };
  }

  return {
    ...mergeEnhancement(localReport, enhancement),
    auditMode: "ai-enhanced",
    model:
      config.provider === "mimo"
        ? `MiMo:${config.model}`
        : `OpenAI:${config.model}`
  };
}
