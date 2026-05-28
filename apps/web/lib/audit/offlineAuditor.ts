import type {
  AuditFinding,
  AuditReport,
  AuditRequest,
  GasOptimization,
  MantleChecklistItem,
  MantleReadiness,
  RiskLevel
} from "@/lib/types";

const DISCLAIMER =
  "AI audit output is assistive and does not replace a professional security review.";

function getLineNumber(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

function getFunctionAt(source: string, index: number): string | undefined {
  const before = source.slice(0, index);
  const match = before.match(/function\s+(\w+)\s*\(/g);
  return match ? match[match.length - 1].replace(/function\s+/, "").replace(/\s*\(/, "") : undefined;
}

function includesAny(source: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match;
  }
  return null;
}

function finding(
  id: string,
  title: string,
  severity: RiskLevel,
  category: AuditFinding["category"],
  line: number | undefined,
  functionName: string | undefined,
  evidence: string,
  explanation: string,
  impact: string,
  recommendation: string,
  confidence: AuditFinding["confidence"]
): AuditFinding {
  return { id, title, severity, category, line, functionName, evidence, explanation, impact, recommendation, confidence };
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

  // 1. Reentrancy-like external value transfer
  const reentrancyMatch = includesAny(contractCode, [/\.call\s*\{?\s*value\s*:/, /\.call\.value\s*\(/]);
  if (reentrancyMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, reentrancyMatch.index);
    const fn = getFunctionAt(contractCode, reentrancyMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    findings.push(
      finding(
        "REENTRANCY_EXTERNAL_CALL",
        "Reentrancy-like external value transfer",
        "High",
        "security",
        line,
        fn,
        evidenceLine,
        "External calls before state updates can allow reentrant execution. The receiver can call back into this contract before the balance is decremented.",
        "An attacker can drain funds by repeatedly calling withdraw before the balance is updated.",
        "Use checks-effects-interactions: update state before external calls. Add ReentrancyGuard from OpenZeppelin.",
        "high"
      )
    );
  }

  // 2. tx.origin authorization
  const txOriginMatch = includesAny(contractCode, [/tx\.origin/]);
  if (txOriginMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, txOriginMatch.index);
    const fn = getFunctionAt(contractCode, txOriginMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    findings.push(
      finding(
        "TX_ORIGIN_AUTH",
        "tx.origin authorization is unsafe",
        "High",
        "security",
        line,
        fn,
        evidenceLine,
        "Using tx.origin for authorization allows phishing contracts to pass checks through a victim wallet. Any contract the victim interacts with can call your contract on their behalf.",
        "A phishing contract can call sweep() through the owner's wallet, bypassing the tx.origin check.",
        "Use msg.sender-based role checks such as Ownable or AccessControl from OpenZeppelin.",
        "high"
      )
    );
  }

  // 3. Missing access control on privileged function
  const ownerGuardMatch = includesAny(contractCode, [/require\s*\([^;]*(owner|admin)/i]);
  if (ownerGuardMatch?.index !== undefined) {
    const hasEvent = includesAny(contractCode, [/event\s+[A-Za-z0-9_]*(Owner|Admin|Transfer|Change)/i]);
    if (!hasEvent) {
      const line = getLineNumber(contractCode, ownerGuardMatch.index);
      const fn = getFunctionAt(contractCode, ownerGuardMatch.index);
      findings.push(
        finding(
          "MISSING_EVENTS",
          "Privileged operations need observability",
          "Medium",
          "security",
          line,
          fn,
          ownerGuardMatch[0],
          "The code includes privileged checks but no matching admin-change or ownership event was found. Without events, off-chain monitoring cannot detect unauthorized admin actions.",
          "Admin actions happen silently, making it impossible to detect compromised admin keys.",
          "Emit events for admin changes and privileged configuration updates.",
          "medium"
        )
      );
    }
  }

  // 4. Unchecked low-level call return
  const uncheckedCallMatch = contractCode.match(/\.call\s*[\({]/);
  if (uncheckedCallMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, uncheckedCallMatch.index);
    const fn = getFunctionAt(contractCode, uncheckedCallMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    // Only flag if the return value is NOT checked
    const afterCall = contractCode.slice(uncheckedCallMatch.index, uncheckedCallMatch.index + 200);
    if (!afterCall.match(/require|if\s*\(/)) {
      findings.push(
        finding(
          "UNCHECKED_CALL",
          "Unchecked low-level call return value",
          "High",
          "security",
          line,
          fn,
          evidenceLine,
          "Low-level calls return false on failure instead of reverting. Ignoring the return means silent failures.",
          "ETH transfers can silently fail, leaving users with no indication their funds were not sent.",
          "Always check the return value: (bool ok, ) = ...; require(ok, \"transfer failed\");",
          "high"
        )
      );
    }
  }

  // 5. Dangerous delegatecall
  const delegatecallMatch = includesAny(contractCode, [/delegatecall\s*\(/]);
  if (delegatecallMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, delegatecallMatch.index);
    const fn = getFunctionAt(contractCode, delegatecallMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    findings.push(
      finding(
        "DELEGATECALL",
        "Delegatecall requires strict target validation",
        "High",
        "security",
        line,
        fn,
        evidenceLine,
        "delegatecall executes code in this contract's storage context. If the target is user-controlled, an attacker can corrupt any storage slot.",
        "Complete contract takeover: attacker can modify owner, balances, or any state variable.",
        "Restrict delegatecall targets to known, audited contracts. Consider a reviewed proxy pattern.",
        "high"
      )
    );
  }

  // 6. Block timestamp dependency
  const timestampMatch = includesAny(contractCode, [/block\.timestamp/, /\bnow\b/]);
  if (timestampMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, timestampMatch.index);
    const fn = getFunctionAt(contractCode, timestampMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    findings.push(
      finding(
        "TIMESTAMP_DEPENDENCY",
        "Timestamp-dependent logic needs tolerance",
        "Medium",
        "security",
        line,
        fn,
        evidenceLine,
        "Timestamp logic can be influenced by miners within block production constraints. It should not be used as a source of randomness or for time-critical logic.",
        "Miners can manipulate timestamps within ~15 seconds, affecting time-dependent logic.",
        "Use tolerance windows for timing checks and avoid timestamp randomness.",
        "medium"
      )
    );
  }

  // 7. Unbounded loop over storage
  const loopMatch = includesAny(contractCode, [/for\s*\(/, /while\s*\(/]);
  if (loopMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, loopMatch.index);
    const fn = getFunctionAt(contractCode, loopMatch.index);
    findings.push(
      finding(
        "UNBOUNDED_LOOP",
        "Unbounded loop can hit gas limits",
        "Medium",
        "security",
        line,
        fn,
        loopMatch[0],
        "Loops that grow with user or storage data can become expensive and fail under block gas limits.",
        "As the number of users or entries grows, the transaction gas cost can exceed the block gas limit, permanently blocking the function.",
        "Keep loops bounded, cache lengths, and move large iteration off-chain.",
        "medium"
      )
    );
  }

  // 8. Destructive opcode
  const selfdestructMatch = includesAny(contractCode, [/selfdestruct\s*\(/, /\bsuicide\s*\(/]);
  if (selfdestructMatch?.index !== undefined) {
    const line = getLineNumber(contractCode, selfdestructMatch.index);
    const fn = getFunctionAt(contractCode, selfdestructMatch.index);
    const evidenceLine = contractCode.split("\n")[line - 1]?.trim() ?? "";
    findings.push(
      finding(
        "SELFDESTRUCT",
        "Destructive opcode detected",
        "High",
        "security",
        line,
        fn,
        evidenceLine,
        "A destructive opcode can permanently disable expected contract behavior and is rarely appropriate for new deployments.",
        "All funds and contract code can be permanently destroyed.",
        "Remove destructive flows unless the lifecycle is explicitly required and heavily documented.",
        "high"
      )
    );
  }

  // Default if no findings
  if (findings.length === 0) {
    findings.push(
      finding(
        "NO_ISSUES",
        "No high-signal issue found by the quick scan",
        "Info",
        "security",
        undefined,
        undefined,
        "No matching high-risk heuristic pattern.",
        "The heuristic pass did not detect common high-risk patterns. Manual review is still required.",
        "Unknown risks may remain undetected.",
        "Run a full test suite, static analyzer, and professional review before mainnet deployment.",
        "medium"
      )
    );
  }

  // Gas optimizations
  if (includesAny(contractCode, [/function\s+\w+\s*\([^)]*(string|bytes|uint\[\]|address\[\])[^)]*\)\s*(external|public)/])) {
    gasOptimizations.push(
      gas(
        "GAS_CALLDATA",
        "Use calldata for external read-only parameters",
        "Medium",
        "External functions with array, bytes, or string parameters can avoid memory copies by using calldata.",
        "Prefer calldata for external parameters that are not mutated."
      )
    );
  }

  if (loopMatch) {
    gasOptimizations.push(
      gas(
        "GAS_BOUNDED_LOOPS",
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
        "GAS_CUSTOM_ERRORS",
        "Custom errors already reduce revert cost",
        "Low",
        "The code uses custom errors, which are cheaper than long revert strings.",
        "Keep custom errors for frequently hit validation paths."
      )
    );
  } else if (includesAny(contractCode, [/require\s*\([^,]+,\s*"[^"]{24,}"/])) {
    gasOptimizations.push(
      gas(
        "GAS_CUSTOM_ERRORS",
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
        "GAS_IMMUTABLE",
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
        "GAS_NONE",
        "No immediate gas issue detected",
        "Low",
        "The quick scan did not detect common gas anti-patterns.",
        "Profile hot paths with tests before production deployment."
      )
    );
  }

  // Mantle checklist
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

  // Calculate scores
  const critical = findings.filter((item) => item.severity === "Critical").length;
  const high = findings.filter((item) => item.severity === "High").length;
  const medium = findings.filter((item) => item.severity === "Medium").length;
  const low = findings.filter((item) => item.severity === "Low").length;
  const riskScore = Math.min(100, critical * 40 + high * 30 + medium * 14 + low * 6 + (findings[0]?.severity === "Info" ? 12 : 18));

  // Mantle Deployment Readiness Score
  let readinessScore = 100;
  if (critical > 0) readinessScore -= 50;
  if (high > 0) readinessScore -= 35;
  if (medium > 0) readinessScore -= 15;
  if (gasOptimizations.some((g) => g.impact === "High")) readinessScore -= 5;
  if (findings.some((f) => f.category === "security" && (f.severity === "High" || f.severity === "Critical"))) readinessScore -= 10;
  readinessScore = Math.max(0, readinessScore);

  let readinessStatus: MantleReadiness["status"];
  let readinessRecommendation: string;

  if (readinessScore >= 80) {
    readinessStatus = "Ready with caution";
    readinessRecommendation = "The contract can be deployed to Mantle with caution. Review remaining findings and run a full test suite.";
  } else if (readinessScore >= 50) {
    readinessStatus = "Needs review";
    readinessRecommendation = "The contract has issues that should be resolved before deploying to Mantle. Address high-severity findings first.";
  } else {
    readinessStatus = "Not ready";
    readinessRecommendation = "The contract has critical or high-severity issues that block Mantle deployment. Fix all security findings before proceeding.";
  }

  const mantleReadiness: MantleReadiness = {
    score: readinessScore,
    status: readinessStatus,
    recommendation: readinessRecommendation
  };

  return {
    contractName,
    targetChain,
    summary: `${contractName} was reviewed for common Solidity risks, Mantle deployment assumptions, and gas optimization opportunities. The quick scan found ${high} high, ${medium} medium, and ${low} low risk findings. Mantle deployment readiness: ${readinessScore}/100 (${readinessStatus}).`,
    riskScore,
    mantleReadiness,
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
    model: "local-deterministic-auditor",
    auditMode: "deterministic",
    agentId: "MAC-001",
    agentName: "Mantle Audit Copilot"
  };
}

export { DISCLAIMER };
