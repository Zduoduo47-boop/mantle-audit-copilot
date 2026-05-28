import { describe, expect, it } from "vitest";
import { analyzeContractLocally, DISCLAIMER } from "@/lib/audit/offlineAuditor";

const vulnerableContract = `pragma solidity ^0.8.24;
contract Vault {
  mapping(address => uint256) public balances;
  address public owner;
  function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "insufficient balance for withdraw");
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok, "transfer failed");
    balances[msg.sender] -= amount;
  }
  function sweep(address payable to) external {
    require(tx.origin == owner, "owner");
    to.transfer(address(this).balance);
  }
}`;

describe("analyzeContractLocally", () => {
  it("flags high-risk low-level calls and tx.origin usage", () => {
    const report = analyzeContractLocally({
      contractCode: vulnerableContract,
      contractName: "Vault",
      targetChain: "Mantle Sepolia"
    });

    expect(report.findings.some((finding) => finding.severity === "High")).toBe(true);
    expect(report.findings.map((finding) => finding.id)).toContain("REENTRANCY_EXTERNAL_CALL");
    expect(report.findings.map((finding) => finding.id)).toContain("TX_ORIGIN_AUTH");
    expect(report.disclaimer).toBe(DISCLAIMER);
    expect(report.mantleReadiness).toBeDefined();
    expect(report.mantleReadiness.score).toBeLessThan(100);
    expect(report.agentId).toBe("MAC-001");
  });

  it("returns Mantle checklist and gas suggestions for demo completeness", () => {
    const report = analyzeContractLocally({
      contractCode: vulnerableContract,
      contractName: "Vault",
      targetChain: "Mantle Sepolia"
    });

    expect(report.mantleChecklist.length).toBeGreaterThanOrEqual(4);
    expect(report.gasOptimizations.length).toBeGreaterThan(0);
    expect(report.riskScore).toBeGreaterThan(0);
  });

  it("covers advanced security and Mantle review branches", () => {
    const report = analyzeContractLocally({
      contractName: "AdvancedVault",
      targetChain: "Ethereum Sepolia",
      contractCode: `pragma solidity ^0.8.24;
        contract AdvancedVault {
          address public admin;
          uint256 public fee;
          function execute(address target, bytes calldata payload) external public {
            require(msg.sender == admin, "admin must call this function");
            target.delegatecall(payload);
          }
          function destroy() external { selfdestruct(payable(msg.sender)); }
          function drawRandom() external view returns (uint256) {
            return uint256(keccak256(abi.encodePacked(block.timestamp, block.chainid, gasleft())));
          }
          function bridgeErc20(address[] calldata users) external {
            for (uint256 i = 0; i < users.length; i++) {
              fee += users.length;
            }
          }
        }`
    });

    expect(report.findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining(["DELEGATECALL", "SELFDESTRUCT", "TIMESTAMP_DEPENDENCY", "UNBOUNDED_LOOP", "MISSING_EVENTS"])
    );
    expect(report.gasOptimizations.map((item) => item.id)).toEqual(
      expect.arrayContaining(["GAS_CALLDATA", "GAS_BOUNDED_LOOPS", "GAS_IMMUTABLE"])
    );
    expect(report.mantleChecklist.some((item) => item.status === "Needs Review")).toBe(true);
  });

  it("returns low-noise info output for simple contracts", () => {
    const report = analyzeContractLocally({
      contractName: "SimpleCounter",
      targetChain: "Mantle Sepolia",
      contractCode: `pragma solidity ^0.8.24;
        contract SimpleCounter {
          uint256 private count;
          function increment() external { count += 1; }
          function current() external view returns (uint256) { return count; }
        }`
    });

    expect(report.findings[0].id).toBe("NO_ISSUES");
    expect(report.gasOptimizations[0].id).toBe("GAS_NONE");
    expect(report.riskScore).toBe(12);
    expect(report.mantleReadiness.score).toBe(100);
    expect(report.mantleReadiness.status).toBe("Ready with caution");
  });
});
