import type { StoredAuditRecord } from "@/lib/types";

const STORAGE_KEY = "mantle-audit-copilot.records";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listAuditRecords(): StoredAuditRecord[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAuditRecord(id: string): StoredAuditRecord | null {
  return listAuditRecords().find((record) => record.id === id) || null;
}

export function saveAuditRecord(record: StoredAuditRecord) {
  if (!canUseStorage()) {
    return;
  }

  const existing = listAuditRecords().filter((item) => item.id !== record.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing].slice(0, 20)));
}
