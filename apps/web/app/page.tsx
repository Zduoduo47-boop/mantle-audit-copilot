"use client";

import { ClipboardCheck, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AgentCard } from "@/components/AgentCard";
import { AuditReport } from "@/components/AuditReport";
import { CodeInput } from "@/components/CodeInput";
import { OnchainProof } from "@/components/OnchainProof";
import { WalletConnect } from "@/components/WalletConnect";
import { hashJson, hashText } from "@/lib/hash";
import { saveAuditRecord, updateAuditRecord } from "@/lib/storage";
import type { AuditReport as AuditReportType, PublicAuditReport, StoredAuditRecord } from "@/lib/types";
import { AGENT_IDENTITY } from "@/lib/types";

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DemoVault {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient balance for withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] -= amount;
    }

    function sweep(address payable to) external {
        require(tx.origin == owner, "only owner can sweep funds");
        to.transfer(address(this).balance);
    }
}`;

async function saveToPublicApi(record: StoredAuditRecord) {
  const contractAddress = process.env.NEXT_PUBLIC_AUDIT_PROOF_ADDRESS as `0x${string}` | undefined;

  const publicReport: PublicAuditReport = {
    id: record.id,
    contractName: record.contractName,
    sourceHash: record.sourceHash,
    reportHash: record.reportHash,
    report: record.report,
    chainId: 5003,
    contractAddress: contractAddress ?? ("0x" as `0x${string}`),
    proofStatus: "not_minted",
    agentId: AGENT_IDENTITY.id,
    agentName: AGENT_IDENTITY.name,
    createdAt: record.createdAt
  };

  try {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publicReport)
    });
  } catch {
    // Public save is best-effort; localStorage is the fallback
  }
}

async function updatePublicApi(id: string, patch: Partial<PublicAuditReport>) {
  try {
    await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
  } catch {
    // Best-effort
  }
}

export default function Home() {
  const [contractName, setContractName] = useState("DemoVault");
  const [contractCode, setContractCode] = useState(SAMPLE_CONTRACT);
  const [record, setRecord] = useState<StoredAuditRecord | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportUrl = useMemo(() => (record ? `/audit/${encodeURIComponent(record.id)}` : null), [record]);

  const runAudit = useCallback(async () => {
    setIsAuditing(true);
    setError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractCode, contractName, targetChain: "Mantle Sepolia" })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Audit failed.");
      }

      const report = (await response.json()) as AuditReportType;
      const sourceHash = hashText(contractCode.trim());
      const reportHash = hashJson(report);
      const id = reportHash;
      const metadataUri = `${window.location.origin}/audit/${encodeURIComponent(id)}`;
      const nextRecord: StoredAuditRecord = {
        id,
        contractName: report.contractName || contractName || "UntitledContract",
        contractCode,
        sourceHash,
        reportHash,
        metadataUri,
        report,
        createdAt: new Date().toISOString()
      };

      saveAuditRecord(nextRecord);
      setRecord(nextRecord);
      saveToPublicApi(nextRecord);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Audit failed.");
    } finally {
      setIsAuditing(false);
    }
  }, [contractCode, contractName]);

  const handleMintSuccess = useCallback(
    (txHash: `0x${string}`, contractAddress: `0x${string}`) => {
      if (!record) {
        return;
      }

      const updated = updateAuditRecord(record.id, { txHash, contractAddress });
      if (updated) {
        setRecord(updated);
      }

      updatePublicApi(record.id, {
        txHash,
        contractAddress,
        proofStatus: "confirmed"
      });
    },
    [record]
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mantle Audit Copilot</h1>
              <p className="text-sm text-slate-600">Verifiable AI Security Agent for Mantle Builders</p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-6">
        <div className="grid gap-6">
          <AgentCard />

          <CodeInput
            contractName={contractName}
            contractCode={contractCode}
            onContractNameChange={setContractName}
            onContractCodeChange={setContractCode}
            onLoadSample={() => {
              setContractName("DemoVault");
              setContractCode(SAMPLE_CONTRACT);
            }}
            onAudit={runAudit}
            isAuditing={isAuditing}
          />

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          {record ? <AuditReport report={record.report} /> : null}
        </div>

        <aside className="grid h-fit gap-6">
          <section className="rounded-lg border border-line bg-panel p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" aria-hidden="true" />
              <h2 className="text-base font-semibold">Submission snapshot</h2>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>Track</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-ink">AI DevTools</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Chain</span>
                <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Mantle Sepolia</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Agent</span>
                <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">{AGENT_IDENTITY.id}</span>
              </div>
            </div>
          </section>

          {record ? (
            <>
              <OnchainProof record={record} onMintSuccess={handleMintSuccess} />
              <section className="rounded-lg border border-line bg-panel p-4 shadow-soft">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-mantle" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Report page</h2>
                </div>
                <Link
                  href={reportUrl || "#"}
                  className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold transition hover:border-mantle hover:text-mantle"
                >
                  Open audit report
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
            </>
          ) : (
            <section className="rounded-lg border border-line bg-panel p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-mantle" aria-hidden="true" />
                <h2 className="text-base font-semibold">Proof queue</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">Run an audit to create the report hash and unlock Proof of Audit minting.</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
