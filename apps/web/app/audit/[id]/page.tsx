"use client";

import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuditReport } from "@/components/AuditReport";
import { mantleSepolia } from "@/lib/chains";
import { getAuditRecord } from "@/lib/storage";
import type { StoredAuditRecord } from "@/lib/types";

export default function AuditDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [record, setRecord] = useState<StoredAuditRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoaded(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setRecord(getAuditRecord(id));
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [id]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-mantle">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Workbench
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-mantle" aria-hidden="true" />
            Audit #{id ? id.slice(0, 10) : ""}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
        {loaded && !record ? (
          <section className="rounded-lg border border-line bg-panel p-6 shadow-soft">
            <h1 className="text-xl font-bold">Audit report not found</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This MVP stores generated reports in local browser storage. Open the report from the same browser used to create it, or deploy a metadata store for public sharing.
            </p>
          </section>
        ) : null}

        {record ? (
          <>
            <section className="rounded-lg border border-line bg-panel p-4 shadow-soft">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Contract</p>
                  <h1 className="mt-1 text-xl font-bold">{record.contractName}</h1>
                </div>
                <div className="grid gap-2 text-sm sm:text-right">
                  <div>
                    <span className="text-slate-500">Source hash </span>
                    <code className="break-all font-mono text-xs">{record.sourceHash}</code>
                  </div>
                  <div>
                    <span className="text-slate-500">Report hash </span>
                    <code className="break-all font-mono text-xs">{record.reportHash}</code>
                  </div>
                </div>
              </div>
              {record.txHash ? (
                <a
                  href={`${mantleSepolia.blockExplorers.default.url}/tx/${record.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:border-emerald-400"
                >
                  Proof of Audit on Mantle Sepolia
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </section>
            <AuditReport report={record.report} />
          </>
        ) : null}
      </div>
    </main>
  );
}
