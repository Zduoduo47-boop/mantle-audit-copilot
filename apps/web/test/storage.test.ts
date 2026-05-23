import { beforeEach, describe, expect, it } from "vitest";
import { getAuditRecord, listAuditRecords, saveAuditRecord } from "@/lib/storage";
import type { StoredAuditRecord } from "@/lib/types";

function makeRecord(id: string): StoredAuditRecord {
  return {
    id,
    contractName: "Vault",
    contractCode: "contract Vault {}",
    sourceHash: `0x${"1".repeat(64)}`,
    reportHash: `0x${"2".repeat(64)}`,
    metadataUri: `http://localhost/audit/${id}`,
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    report: {
      contractName: "Vault",
      targetChain: "Mantle Sepolia",
      summary: "summary",
      riskScore: 10,
      findings: [],
      gasOptimizations: [],
      mantleChecklist: [],
      recommendedFixes: [],
      disclaimer: "AI audit output is assistive and does not replace a professional security review.",
      generatedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
      model: "test"
    }
  };
}

describe("audit storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves, lists, and gets audit records", () => {
    saveAuditRecord(makeRecord("a1"));
    saveAuditRecord(makeRecord("a2"));

    expect(listAuditRecords().map((record) => record.id)).toEqual(["a2", "a1"]);
    expect(getAuditRecord("a1")?.contractName).toBe("Vault");
    expect(getAuditRecord("missing")).toBeNull();
  });

  it("replaces an existing record with the same id", () => {
    saveAuditRecord(makeRecord("a1"));
    saveAuditRecord({ ...makeRecord("a1"), contractName: "UpdatedVault" });

    expect(listAuditRecords()).toHaveLength(1);
    expect(getAuditRecord("a1")?.contractName).toBe("UpdatedVault");
  });

  it("handles corrupted storage safely", () => {
    window.localStorage.setItem("mantle-audit-copilot.records", "{bad json");

    expect(listAuditRecords()).toEqual([]);
  });
});
