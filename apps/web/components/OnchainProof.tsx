"use client";

import { ExternalLink, Link2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { auditProofAbi } from "@/lib/abi";
import { mantleSepolia } from "@/lib/chains";
import { shortHash } from "@/lib/hash";
import type { StoredAuditRecord } from "@/lib/types";

const contractAddress = process.env.NEXT_PUBLIC_AUDIT_PROOF_ADDRESS as `0x${string}` | undefined;

function isAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

export function OnchainProof({
  record,
  onMintSuccess
}: {
  record: StoredAuditRecord;
  onMintSuccess: (txHash: `0x${string}`, contractAddress: `0x${string}`) => void;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContract, data: transactionHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: transactionHash
  });
  const hasContract = isAddress(contractAddress);
  const isWrongChain = chainId !== mantleSepolia.id;

  useEffect(() => {
    if (!isSuccess || !transactionHash || !hasContract || record.txHash) {
      return;
    }

    onMintSuccess(transactionHash, contractAddress!);
  }, [hasContract, isSuccess, onMintSuccess, record.txHash, transactionHash]);

  function submitProof() {
    if (!hasContract) {
      return;
    }

    writeContract({
      address: contractAddress,
      abi: auditProofAbi,
      functionName: "submitAudit",
      args: [record.sourceHash, record.reportHash, record.metadataUri],
      chainId: mantleSepolia.id
    });
  }

  return (
    <section className="rounded-lg border border-line bg-panel shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-mantle" aria-hidden="true" />
          <h2 className="text-base font-semibold">On-chain proof</h2>
        </div>
        {record.txHash ? (
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Minted
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-2 rounded-lg border border-line bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-slate-500">Source hash</span>
            <code className="break-all font-mono text-xs text-ink">{shortHash(record.sourceHash, 10)}</code>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-slate-500">Report hash</span>
            <code className="break-all font-mono text-xs text-ink">{shortHash(record.reportHash, 10)}</code>
          </div>
        </div>

        {record.txHash ? (
          <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="font-semibold">Proof of Audit is recorded on Mantle Sepolia.</div>
            <a
              href={`${mantleSepolia.blockExplorers.default.url}/tx/${record.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-emerald-800 underline-offset-4 hover:underline"
            >
              View transaction
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div className="grid gap-3">
            {!hasContract ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-800">
                Set `NEXT_PUBLIC_AUDIT_PROOF_ADDRESS` after deploying the contract to enable minting.
              </div>
            ) : null}
            {isWrongChain && isConnected ? (
              <button
                type="button"
                onClick={() => switchChain({ chainId: mantleSepolia.id })}
                disabled={isSwitching}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-mantle hover:text-mantle disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                Switch to Mantle Sepolia
              </button>
            ) : (
              <button
                type="button"
                onClick={submitProof}
                disabled={!isConnected || !hasContract || isPending || isConfirming}
                className="inline-flex w-fit items-center gap-2 rounded-md bg-mantle px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                {isConfirming ? "Confirming" : "Mint Proof of Audit"}
              </button>
            )}
            {transactionHash ? (
              <a
                href={`${mantleSepolia.blockExplorers.default.url}/tx/${transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {shortHash(transactionHash, 8)}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
            {error ? <p className="text-sm leading-6 text-red-700">{error.message}</p> : null}
          </div>
        )}
      </div>
    </section>
  );
}
