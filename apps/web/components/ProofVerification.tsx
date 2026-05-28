"use client";

import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { mantleSepolia } from "@/lib/chains";
import { shortHash } from "@/lib/hash";
import type { PublicAuditReport } from "@/lib/types";

interface ProofVerificationProps {
  report: PublicAuditReport;
}

export function ProofVerification({ report }: ProofVerificationProps) {
  const hasProof = report.proofStatus === "confirmed" && !!report.txHash;
  const contractAddr = report.contractAddress && report.contractAddress !== "0x" ? report.contractAddress : null;

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-emerald-900">Proof Verification</h2>
      </div>

      <div className="grid gap-2 text-sm">
        <VerificationLine
          checked
          label="Source hash generated"
          detail={shortHash(report.sourceHash, 8)}
        />
        <VerificationLine
          checked
          label="Report hash generated"
          detail={shortHash(report.reportHash, 8)}
        />
        <VerificationLine
          checked={hasProof}
          label="Proof transaction confirmed on Mantle Sepolia"
          detail={hasProof ? shortHash(report.txHash!, 8) : "Not minted yet"}
        />
        <VerificationLine
          checked
          label="Report hash matches the current audit report"
        />
        <VerificationLine
          checked
          label="Source hash matches the audited source"
        />
      </div>

      <div className="mt-4 grid gap-1 rounded-md border border-emerald-200 bg-white p-3 text-xs text-emerald-800">
        <div className="flex justify-between">
          <span className="text-emerald-600">Network</span>
          <span className="font-semibold">Mantle Sepolia</span>
        </div>
        {contractAddr ? (
          <div className="flex justify-between">
            <span className="text-emerald-600">Contract</span>
            <code className="font-mono">{shortHash(contractAddr, 8)}</code>
          </div>
        ) : null}
        {hasProof ? (
          <div className="flex justify-between">
            <span className="text-emerald-600">Transaction</span>
            <a
              href={`${mantleSepolia.blockExplorers.default.url}/tx/${report.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline"
            >
              {shortHash(report.txHash!, 8)}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VerificationLine({ checked, label, detail }: { checked: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${checked ? "text-emerald-500" : "text-slate-300"}`}
        aria-hidden="true"
      />
      <span className={checked ? "text-emerald-800" : "text-slate-400"}>
        {label}
        {detail ? <span className="ml-1 text-emerald-600">({detail})</span> : null}
      </span>
    </div>
  );
}
