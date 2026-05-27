export type RiskLevel = "High" | "Medium" | "Low" | "Info";

export interface AuditFinding {
  id: string;
  title: string;
  severity: RiskLevel;
  category: string;
  description: string;
  evidence: string;
  recommendation: string;
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

export interface AuditReport {
  contractName: string;
  targetChain: string;
  summary: string;
  riskScore: number;
  findings: AuditFinding[];
  gasOptimizations: GasOptimization[];
  mantleChecklist: MantleChecklistItem[];
  recommendedFixes: string[];
  disclaimer: string;
  generatedAt: string;
  model: string;
}

export interface AuditRequest {
  contractCode: string;
  contractName: string;
  targetChain?: string;
}

export interface OnchainProof {
  tokenId: string;
  transactionHash: `0x${string}`;
  contractAddress: `0x${string}`;
  chainId: number;
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
