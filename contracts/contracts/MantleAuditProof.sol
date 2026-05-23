// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MantleAuditProof is ERC721URIStorage {
    struct AuditRecord {
        address submitter;
        bytes32 sourceHash;
        bytes32 reportHash;
        string metadataURI;
        uint256 timestamp;
        uint256 tokenId;
    }

    error EmptySourceHash();
    error EmptyReportHash();
    error EmptyMetadataURI();
    error SoulboundToken();
    error AuditNotFound();

    event AuditSubmitted(
        uint256 indexed auditId,
        uint256 indexed tokenId,
        address indexed submitter,
        bytes32 sourceHash,
        bytes32 reportHash,
        string metadataURI
    );

    uint256 private _nextAuditId = 1;
    mapping(uint256 auditId => AuditRecord record) private _audits;

    constructor() ERC721("Mantle Proof of Audit", "MPOA") {}

    function submitAudit(
        bytes32 sourceHash,
        bytes32 reportHash,
        string calldata metadataURI
    ) external returns (uint256 auditId) {
        if (sourceHash == bytes32(0)) {
            revert EmptySourceHash();
        }
        if (reportHash == bytes32(0)) {
            revert EmptyReportHash();
        }
        if (bytes(metadataURI).length == 0) {
            revert EmptyMetadataURI();
        }

        auditId = _nextAuditId++;
        _safeMint(msg.sender, auditId);
        _setTokenURI(auditId, metadataURI);

        _audits[auditId] = AuditRecord({
            submitter: msg.sender,
            sourceHash: sourceHash,
            reportHash: reportHash,
            metadataURI: metadataURI,
            timestamp: block.timestamp,
            tokenId: auditId
        });

        emit AuditSubmitted(auditId, auditId, msg.sender, sourceHash, reportHash, metadataURI);
    }

    function getAudit(uint256 auditId) external view returns (AuditRecord memory) {
        if (_ownerOf(auditId) == address(0)) {
            revert AuditNotFound();
        }

        return _audits[auditId];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundToken();
        }

        return super._update(to, tokenId, auth);
    }
}
