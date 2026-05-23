import { ethers, network } from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const proof = await ethers.deployContract("MantleAuditProof");
  await proof.waitForDeployment();

  const address = await proof.getAddress();
  const deploymentTransaction = proof.deploymentTransaction();
  const explorerBase =
    network.name === "mantleSepolia" ? "https://explorer.sepolia.mantle.xyz" : undefined;
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contractName: "MantleAuditProof",
    address,
    deployer: deploymentTransaction?.from,
    transactionHash: deploymentTransaction?.hash,
    explorerUrl: explorerBase ? `${explorerBase}/address/${address}` : undefined,
    deployedAt: new Date().toISOString()
  };

  const outputDir = join(__dirname, "..", "deployments");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    join(outputDir, `${network.name}.json`),
    `${JSON.stringify(deployment, null, 2)}\n`
  );

  console.log(`MantleAuditProof deployed to ${address} on ${network.name}`);
  if (deployment.transactionHash && explorerBase) {
    console.log(`Transaction: ${explorerBase}/tx/${deployment.transactionHash}`);
  }
  console.log(`Set NEXT_PUBLIC_AUDIT_PROOF_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
