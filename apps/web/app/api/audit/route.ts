import { NextRequest, NextResponse } from "next/server";
import { analyzeContractLocally } from "@/lib/audit/offlineAuditor";
import { enhanceAudit } from "@/lib/ai/providers";
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

  const localReport = analyzeContractLocally(input);
  const report = await enhanceAudit(input, localReport);

  return NextResponse.json(report);
}
