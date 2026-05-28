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
      baseUrl: process.env.MIMO_BASE_URL || "https://api.xiaomimimo.com/v1",
      model: process.env.MIMO_MODEL || "mimo-v2-pro"
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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return null;
    }

    return JSON.parse(cleanJsonContent(content));
  } catch {
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
    },
    auditMode: "ai-enhanced"
  };
}

export async function enhanceAudit(
  input: AuditRequest,
  localReport: AuditReport
): Promise<AuditReport> {
  const config = getAIConfig();

  if (config.provider === "local" || !config.apiKey) {
    return localReport;
  }

  const messages = buildEnhancementPrompt(input, localReport);
  const enhancement = await callOpenAICompatible(config.baseUrl!, config.apiKey, config.model!, messages);

  if (!enhancement) {
    return localReport;
  }

  return mergeEnhancement(localReport, enhancement);
}

export function getProviderName(): string {
  const config = getAIConfig();
  if (config.provider === "mimo") return "MiMo";
  if (config.provider === "openai") return "OpenAI";
  return "local";
}
