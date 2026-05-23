import { expect } from "chai";
import { ethers } from "hardhat";

describe("MantleAuditProof", function () {
  async function deployProof() {
    const [owner, other] = await ethers.getSigners();
    const proof = await ethers.deployContract("MantleAuditProof");
    await proof.waitForDeployment();

    const sourceHash = ethers.keccak256(ethers.toUtf8Bytes("source"));
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
    const metadataURI = "https://example.com/audit/1";

    return { proof, owner, other, sourceHash, reportHash, metadataURI };
  }

  it("submits an audit and mints a Proof of Audit token", async function () {
    const { proof, owner, sourceHash, reportHash, metadataURI } = await deployProof();

    await expect(proof.submitAudit(sourceHash, reportHash, metadataURI))
      .to.emit(proof, "AuditSubmitted")
      .withArgs(1, 1, owner.address, sourceHash, reportHash, metadataURI);

    expect(await proof.ownerOf(1)).to.equal(owner.address);
    expect(await proof.tokenURI(1)).to.equal(metadataURI);
  });

  it("stores the audit record fields", async function () {
    const { proof, owner, sourceHash, reportHash, metadataURI } = await deployProof();

    await proof.submitAudit(sourceHash, reportHash, metadataURI);
    const record = await proof.getAudit(1);

    expect(record.submitter).to.equal(owner.address);
    expect(record.sourceHash).to.equal(sourceHash);
    expect(record.reportHash).to.equal(reportHash);
    expect(record.metadataURI).to.equal(metadataURI);
    expect(record.tokenId).to.equal(1);
    expect(record.timestamp).to.be.greaterThan(0);
  });

  it("rejects empty hashes and metadata", async function () {
    const { proof, sourceHash, reportHash, metadataURI } = await deployProof();

    await expect(proof.submitAudit(ethers.ZeroHash, reportHash, metadataURI)).to.be.revertedWithCustomError(
      proof,
      "EmptySourceHash"
    );
    await expect(proof.submitAudit(sourceHash, ethers.ZeroHash, metadataURI)).to.be.revertedWithCustomError(
      proof,
      "EmptyReportHash"
    );
    await expect(proof.submitAudit(sourceHash, reportHash, "")).to.be.revertedWithCustomError(
      proof,
      "EmptyMetadataURI"
    );
  });

  it("prevents token transfers", async function () {
    const { proof, owner, other, sourceHash, reportHash, metadataURI } = await deployProof();

    await proof.submitAudit(sourceHash, reportHash, metadataURI);

    await expect(proof.transferFrom(owner.address, other.address, 1)).to.be.revertedWithCustomError(
      proof,
      "SoulboundToken"
    );
  });

  it("reverts when reading a missing audit", async function () {
    const { proof } = await deployProof();

    await expect(proof.getAudit(99)).to.be.revertedWithCustomError(proof, "AuditNotFound");
  });
});
