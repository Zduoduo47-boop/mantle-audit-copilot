import { beforeEach, describe, expect, it } from "vitest";
import { getAuditRecord, saveAuditRecord, updateAuditRecord } from "@/lib/storage";
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

  it("saves and gets audit records by id", () => {
    saveAuditRecord(makeRecord("a1"));
    saveAuditRecord(makeRecord("a2"));

    expect(getAuditRecord("a1")?.contractName).toBe("Vault");
    expect(getAuditRecord("a2")?.contractName).toBe("Vault");
    expect(getAuditRecord("missing")).toBeNull();
  });

  it("overwrites an existing record with the same id", () => {
    saveAuditRecord(makeRecord("a1"));
    saveAuditRecord({ ...makeRecord("a1"), contractName: "UpdatedVault" });

    expect(getAuditRecord("a1")?.contractName).toBe("UpdatedVault");
  });

  it("updates a record with partial patch", () => {
    saveAuditRecord(makeRecord("a1"));

    const updated = updateAuditRecord("a1", {
      txHash: "0xabc123" as `0x${string}`,
      contractAddress: "0xdef456" as `0x${string}`
    });

    expect(updated?.txHash).toBe("0xabc123");
    expect(updated?.contractAddress).toBe("0xdef456");
    expect(updated?.contractName).toBe("Vault");
    expect(getAuditRecord("a1")?.txHash).toBe("0xabc123");
  });

  it("returns null when updating a missing record", () => {
    const result = updateAuditRecord("missing", { txHash: "0xabc" as `0x${string}` });
    expect(result).toBeNull();
  });

  it("handles corrupted storage safely", () => {
    window.localStorage.setItem("mantle-audit:bad", "{bad json");

    expect(getAuditRecord("bad")).toBeNull();
  });
});
