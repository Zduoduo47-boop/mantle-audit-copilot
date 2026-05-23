import type {
  AuditFinding,
  AuditReport,
  AuditRequest,
  GasOptimization,
  MantleChecklistItem,
  RiskLevel
} from "@/lib/types";

const DISCLAIMER =
  "AI audit output is assistive and does not replace a professional security review.";

function includesAny(source: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(source));
}

function finding(
  id: string,
  title: string,
  severity: RiskLevel,
  category: string,
  description: string,
  evidence: string,
  recommendation: string
): AuditFinding {
  return { id, title, severity, category, description, evidence, recommendation };
}

function gas(
  id: string,
  title: string,
  impact: "High" | "Medium" | "Low",
  description: string,
  recommendation: string
): GasOptimization {
  return { id, title, impact, description, recommendation };
}

function checklist(
  id: string,
  title: string,
  status: MantleChecklistItem["status"],
  detail: string
): MantleChecklistItem {
  return { id, title, status, detail };
}

export function analyzeContractLocally(input: AuditRequest): AuditReport {
  const contractCode = input.contractCode.trim();
  const contractName = input.contractName.trim() || "UntitledContract";
  const targetChain = input.targetChain || "Mantle Sepolia";
  const lower = contractCode.toLowerCase();
  const findings: AuditFinding[] = [];
  const gasOptimizations: GasOptimization[] = [];
  const mantleChecklist: MantleChecklistItem[] = [];

  if (includesAny(contractCode, [/\.call\s*\{?\s*value\s*:/, /\.call\.value\s*\(/])) {
    findings.push(
      finding(
        "F-001",
        "External value transfer needs reentrancy protection",
        "High",
        "Reentrancy",
        "The contract appears to send native tokens through a low-level call. If state changes happen after this call, a receiver can attempt reentrant execution.",
        "Low-level value transfer detected.",
        "Apply checks-effects-interactions, add ReentrancyGuard, and update accounting before external calls."
      )
    );
  }

  if (includesAny(contractCode, [/tx\.origin/])) {
    findings.push(
      finding(
        "F-002",
        "tx.origin authorization is unsafe",
        "High",
        "Access Control",
        "Using tx.origin for authorization can let phishing contracts pass checks through a victim wallet.",
        "tx.origin detected.",
        "Use msg.sender based role checks such as Ownable or AccessControl."
      )
    );
  }

  if (includesAny(contractCode, [/delegatecall\s*\(/])) {
    findings.push(
      finding(
        "F-003",
        "Delegatecall requires strict target validation",
        "High",
        "Upgradeability",
        "delegatecall executes code in this contract storage context and can corrupt state if the target is user-controlled.",
        "delegatecall detected.",
        "Restrict delegatecall targets, emit changes, and consider a reviewed proxy pattern."
      )
    );
  }

  if (includesAny(contractCode, [/selfdestruct\s*\(/, /\bsuicide\s*\(/])) {
    findings.push(
      finding(
        "F-004",
        "Destructive opcode detected",
        "High",
        "Lifecycle",
        "A destructive opcode can permanently disable expected contract behavior and is rarely appropriate for new deployments.",
        "selfdestruct or suicide detected.",
        "Remove destructive flows unless the lifecycle is explicitly required and heavily documented."
      )
    );
  }

  if (includesAny(contractCode, [/block\.timestamp/, /\bnow\b/])) {
    findings.push(
      finding(
        "F-005",
        "Timestamp-dependent logic needs tolerance",
        "Medium",
        "Oracle Assumption",
        "Timestamp logic can be influenced within block production constraints and should not be used as a source of randomness.",
        "block.timestamp or now detected.",
        "Use tolerance windows for timing checks and avoid timestamp randomness."
      )
    );
  }

  if (includesAny(contractCode, [/require\s*\([^;]*(owner|admin)/i]) && !includesAny(contractCode, [/event\s+[A-Za-z0-9_]*Owner/, /event\s+[A-Za-z0-9_]*Admin/])) {
    findings.push(
      finding(
        "F-006",
        "Privileged operations need observability",
        "Medium",
        "Operations",
        "The code appears to include privileged checks but no obvious admin-change or ownership event was found.",
        "Owner/admin guard detected without a matching event pattern.",
        "Emit events for admin changes and privileged configuration updates."
      )
    );
  }

  if (includesAny(contractCode, [/random/i, /keccak256\s*\([^)]*block\./])) {
    findings.push(
      finding(
        "F-007",
        "Randomness source may be predictable",
        "Medium",
        "Randomness",
        "On-chain randomness built from block fields can be predicted or influenced.",
        "Randomness-like pattern detected.",
        "Use a verifiable randomness source or commit-reveal design."
      )
    );
  }

  if (findings.length === 0) {
    findings.push(
      finding(
        "F-000",
        "No high-signal issue found by the quick scan",
        "Info",
        "Coverage",
        "The heuristic pass did not detect common high-risk patterns. Manual review is still required.",
        "No matching high-risk heuristic pattern.",
        "Run a full test suite, static analyzer, and professional review before mainnet deployment."
      )
    );
  }

  if (includesAny(contractCode, [/function\s+\w+\s*\([^)]*(string|bytes|uint\[\]|address\[\])[^)]*\)\s*(external|public)/])) {
    gasOptimizations.push(
      gas(
        "G-001",
        "Use calldata for external read-only parameters",
        "Medium",
        "External functions with array, bytes, or string parameters can often avoid memory copies.",
        "Prefer calldata for external parameters that are not mutated."
      )
    );
  }

  if (includesAny(contractCode, [/for\s*\(/, /while\s*\(/])) {
    gasOptimizations.push(
      gas(
        "G-002",
        "Bound loops before deployment",
        "High",
        "Loops that grow with user or storage data can become expensive and fail under gas limits.",
        "Keep loops bounded, cache lengths, and move large iteration off-chain."
      )
    );
  }

  if (includesAny(contractCode, [/\berror\s+[A-Za-z0-9_]+\(/])) {
    gasOptimizations.push(
      gas(
        "G-003",
        "Custom errors already reduce revert cost",
        "Low",
        "The code uses custom errors, which are cheaper than long revert strings.",
        "Keep custom errors for frequently hit validation paths."
      )
    );
  } else if (includesAny(contractCode, [/require\s*\([^,]+,\s*"[^"]{24,}"/])) {
    gasOptimizations.push(
      gas(
        "G-003",
        "Replace long revert strings with custom errors",
        "Low",
        "Long revert strings increase bytecode size and revert cost.",
        "Use custom errors for validation failures."
      )
    );
  }

  if (includesAny(contractCode, [/address\s+public\s+\w+/, /uint\d*\s+public\s+\w+/]) && !includesAny(contractCode, [/\bimmutable\b/, /\bconstant\b/])) {
    gasOptimizations.push(
      gas(
        "G-004",
        "Consider immutable or constant values",
        "Low",
        "Constructor-time configuration values can be cheaper when marked immutable.",
        "Mark addresses and numeric constants as immutable or constant when they never change."
      )
    );
  }

  if (gasOptimizations.length === 0) {
    gasOptimizations.push(
      gas(
        "G-000",
        "No immediate gas issue detected",
        "Low",
        "The quick scan did not detect common gas anti-patterns.",
        "Profile hot paths with tests before production deployment."
      )
    );
  }

  mantleChecklist.push(
    checklist(
      "M-001",
      "Mantle Sepolia deployment target",
      targetChain.toLowerCase().includes("mantle") ? "Pass" : "Needs Review",
      `Target chain is ${targetChain}.`
    ),
    checklist(
      "M-002",
      "Chain ID assumptions",
      includesAny(contractCode, [/block\.chainid/, /\b5000\b/, /\b5003\b/]) ? "Needs Review" : "Pass",
      "Review hardcoded chain IDs when moving between Mantle Sepolia and Mantle mainnet."
    ),
    checklist(
      "M-003",
      "Bridge and token decimal assumptions",
      includesAny(lower, [/bridge/, /usdy/, /meth/, /weth/, /erc20/]) ? "Needs Review" : "Pass",
      "Mantle assets and bridged tokens should be checked for decimals, addresses, and oracle assumptions."
    ),
    checklist(
      "M-004",
      "L2 gas behavior",
      includesAny(contractCode, [/gasleft\s*\(/, /\.gas\s*\(/]) ? "Needs Review" : "Pass",
      "Avoid brittle gas assumptions when deploying on Mantle's L2 execution environment."
    )
  );

  const high = findings.filter((item) => item.severity === "High").length;
  const medium = findings.filter((item) => item.severity === "Medium").length;
  const low = findings.filter((item) => item.severity === "Low").length;
  const riskScore = Math.min(100, high * 30 + medium * 14 + low * 6 + (findings[0]?.severity === "Info" ? 12 : 18));

  return {
    contractName,
    targetChain,
    summary: `${contractName} was reviewed for common Solidity risks, Mantle deployment assumptions, and gas optimization opportunities. The quick scan found ${high} high, ${medium} medium, and ${low} low risk findings.`,
    riskScore,
    findings,
    gasOptimizations,
    mantleChecklist,
    recommendedFixes: [
      "Add unit tests for every privileged function and external value transfer.",
      "Run a static analyzer such as Slither before mainnet deployment.",
      "Verify Mantle Sepolia addresses, token decimals, and chain IDs before production.",
      "Document remaining trust assumptions in the README and audit report."
    ],
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
    model: "local-deterministic-auditor"
  };
}

export { DISCLAIMER };
