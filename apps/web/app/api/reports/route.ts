import { NextRequest, NextResponse } from "next/server";
import { savePublicReport } from "@/lib/reportStorage";
import type { PublicAuditReport } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: PublicAuditReport;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.id || !body.reportHash || !body.report) {
    return NextResponse.json({ error: "Missing required fields: id, reportHash, report." }, { status: 400 });
  }

  savePublicReport(body);
  return NextResponse.json({ id: body.id, ok: true });
}
