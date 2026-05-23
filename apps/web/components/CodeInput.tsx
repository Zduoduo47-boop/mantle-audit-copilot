"use client";

import { FileCode2, Wand2 } from "lucide-react";

interface CodeInputProps {
  contractName: string;
  contractCode: string;
  onContractNameChange: (value: string) => void;
  onContractCodeChange: (value: string) => void;
  onLoadSample: () => void;
  onAudit: () => void;
  isAuditing: boolean;
}

export function CodeInput({
  contractName,
  contractCode,
  onContractNameChange,
  onContractCodeChange,
  onLoadSample,
  onAudit,
  isAuditing
}: CodeInputProps) {
  return (
    <section className="rounded-lg border border-line bg-panel shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5 text-mantle" aria-hidden="true" />
          <h2 className="text-base font-semibold">Contract input</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-mantle hover:text-mantle"
          >
            <FileCode2 className="h-4 w-4" aria-hidden="true" />
            Sample
          </button>
          <button
            type="button"
            onClick={onAudit}
            disabled={isAuditing || contractCode.trim().length < 40}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-mantle disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {isAuditing ? "Auditing" : "Run audit"}
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Contract name</span>
          <input
            value={contractName}
            onChange={(event) => onContractNameChange(event.target.value)}
            placeholder="VaultRewards"
            className="rounded-md border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-mantle focus:ring-2 focus:ring-mantle/20"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Solidity code</span>
          <textarea
            value={contractCode}
            onChange={(event) => onContractCodeChange(event.target.value)}
            placeholder="Paste Solidity code here..."
            className="code-scroll min-h-[460px] resize-y rounded-md border border-line bg-[#0b1020] p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-mantle focus:ring-2 focus:ring-mantle/20"
            spellCheck={false}
          />
        </label>
      </div>
    </section>
  );
}
