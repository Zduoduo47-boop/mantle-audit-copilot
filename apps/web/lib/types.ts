export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface AuditFinding {
  id: string;
  title: string;
  severity: RiskLevel;
  category: "security" | "gas" | "mantle-readiness";
  line?: number;
  functionName?: string;
  evidence?: string;
  explanation: string;
  impact: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
}

export interface GasOptimization {
  id: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  description: string;
  recommendation: string;
}

export interface MantleChecklistItem {
  id: string;
  title: string;
  status: "Pass" | "Needs Review" | "Missing";
  detail: string;
}

export interface MantleReadiness {
  score: number;
  status: "Ready with caution" | "Needs review" | "Not ready";
  recommendation: string;
}

export interface AuditReport {
  contractName: string;
  targetChain: string;
  summary: string;
  riskScore: number;
  mantleReadiness: MantleReadiness;
  findings: AuditFinding[];
  gasOptimizations: GasOptimization[];
  mantleChecklist: MantleChecklistItem[];
  recommendedFixes: string[];
  disclaimer: string;
  generatedAt: string;
  model: string;
  auditMode: "deterministic" | "ai-enhanced";
  agentId: string;
  agentName: string;
}

export interface AuditRequest {
  contractCode: string;
  contractName: string;
  targetChain?: string;
}

export interface AgentIdentity {
  id: string;
  name: string;
  version: string;
  network: string;
  specialization: string;
  auditMode: string;
  proofModel: string;
}

export const AGENT_IDENTITY: AgentIdentity = {
  id: "MAC-001",
  name: "Mantle Audit Copilot",
  version: "v0.1.0",
  network: "Mantle Sepolia",
  specialization: "Solidity security + Mantle deployment readiness",
  auditMode: "Deterministic scanner + optional AI enhancement",
  proofModel: "Source hash + report hash anchored on Mantle"
};

export interface OnchainProof {
  tokenId: string;
  transactionHash: `0x${string}`;
  contractAddress: `0x${string}`;
  chainId: number;
}

export interface PublicAuditReport {
  id: string;
  contractName: string;
  sourceHash: `0x${string}`;
  reportHash: `0x${string}`;
  sourceCode?: string;
  report: AuditReport;
  chainId: number;
  contractAddress: `0x${string}`;
  txHash?: `0x${string}`;
  proofStatus: "not_minted" | "pending" | "confirmed";
  agentId: string;
  agentName: string;
  createdAt: string;
}

export interface StoredAuditRecord {
  id: string;
  contractName: string;
  contractCode: string;
  sourceHash: `0x${string}`;
  reportHash: `0x${string}`;
  metadataUri: string;
  report: AuditReport;
  createdAt: string;
  txHash?: `0x${string}`;
  contractAddress?: `0x${string}`;
  onchain?: OnchainProof;
}
