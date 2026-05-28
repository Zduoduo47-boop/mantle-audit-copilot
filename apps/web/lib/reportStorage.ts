import type { PublicAuditReport } from "@/lib/types";

const store = new Map<string, PublicAuditReport>();

export function savePublicReport(report: PublicAuditReport): void {
  store.set(report.id, report);
}

export function getPublicReport(id: string): PublicAuditReport | null {
  return store.get(id) ?? null;
}

export function updatePublicReport(id: string, patch: Partial<PublicAuditReport>): PublicAuditReport | null {
  const existing = store.get(id);
  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...patch, id };
  store.set(id, updated);
  return updated;
}
