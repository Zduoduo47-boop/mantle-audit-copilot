"use client";

import { Bot, Cpu, Globe, Shield } from "lucide-react";
import { AGENT_IDENTITY } from "@/lib/types";

export function AgentCard() {
  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-blue-900">Auditor Agent</h2>
      </div>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="text-blue-700">
            <strong>{AGENT_IDENTITY.name}</strong> ({AGENT_IDENTITY.id}) — {AGENT_IDENTITY.version}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="text-blue-700">{AGENT_IDENTITY.network} — {AGENT_IDENTITY.specialization}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="text-blue-700">{AGENT_IDENTITY.proofModel}</span>
        </div>
      </div>
    </section>
  );
}
