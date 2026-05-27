import type { StoredAuditRecord } from "@/lib/types";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveAuditRecord(record: StoredAuditRecord) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(`mantle-audit:${record.id}`, JSON.stringify(record));
}

export function getAuditRecord(id: string): StoredAuditRecord | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(`mantle-audit:${id}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuditRecord;
  } catch {
    return null;
  }
}

export function updateAuditRecord(id: string, patch: Partial<StoredAuditRecord>): StoredAuditRecord | null {
  const existing = getAuditRecord(id);
  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...patch, id };
  saveAuditRecord(updated);
  return updated;
}
