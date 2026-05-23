"use client";

import { AlertTriangle, CheckCircle2, Gauge, ShieldCheck, Wrench } from "lucide-react";
import type { AuditReport as AuditReportType, RiskLevel } from "@/lib/types";

function severityClass(severity: RiskLevel) {
  if (severity === "High") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (severity === "Medium") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (severity === "Low") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function AuditReport({ report }: { report: AuditReportType }) {
  return (
    <section className="rounded-lg border border-line bg-panel shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-mantle" aria-hidden="true" />
          <h2 className="text-base font-semibold">Audit report</h2>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-warning" aria-hidden="true" />
          Risk {report.riskScore}/100
        </div>
      </div>

      <div className="grid gap-5 p-4">
        <p className="text-sm leading-6 text-slate-700">{report.summary}</p>

        <div className="grid gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-slate-500">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Findings
          </h3>
          <div className="grid gap-3">
            {report.findings.map((finding) => (
              <article key={finding.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${severityClass(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className="text-sm font-semibold">{finding.title}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{finding.description}</p>
                <p className="mt-2 text-xs text-slate-500">{finding.evidence}</p>
                <p className="mt-3 text-sm font-medium text-ink">{finding.recommendation}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-slate-500">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Gas optimization
          </h3>
          <div className="grid gap-3">
            {report.gasOptimizations.map((item) => (
              <article key={item.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {item.impact}
                  </span>
                  <span className="text-sm font-semibold">{item.title}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
                <p className="mt-3 text-sm font-medium text-ink">{item.recommendation}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-slate-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Mantle checklist
          </h3>
          <div className="grid gap-2">
            {report.mantleChecklist.map((item) => (
              <div key={item.id} className="grid gap-1 rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800">
          {report.disclaimer}
        </div>
      </div>
    </section>
  );
}
