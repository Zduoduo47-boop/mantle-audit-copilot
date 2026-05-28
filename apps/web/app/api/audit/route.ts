import { NextRequest, NextResponse } from "next/server";
import { analyzeContractLocally } from "@/lib/audit/offlineAuditor";
import { enhanceAudit, getProviderName } from "@/lib/ai/providers";
import type { AuditRequest } from "@/lib/types";

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

  // Always run local deterministic scanner first
  const localReport = analyzeContractLocally(input);

  // Try to enhance with AI provider (MiMo or OpenAI)
  try {
    const enhanced = await enhanceAudit(input, localReport);
    const provider = getProviderName();
    const response = {
      ...enhanced,
      model: provider === "local" ? "local-deterministic-auditor" : `${provider} + local-deterministic`
    };
    return NextResponse.json(response);
  } catch {
    // AI enhancement failed, return local report
    return NextResponse.json(localReport);
  }
}
