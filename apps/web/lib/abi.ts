export const auditProofAbi = [
  {
    type: "function",
    name: "submitAudit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sourceHash", type: "bytes32" },
      { name: "reportHash", type: "bytes32" },
      { name: "metadataURI", type: "string" }
    ],
    outputs: [{ name: "auditId", type: "uint256" }]
  },
  {
    type: "function",
    name: "getAudit",
    stateMutability: "view",
    inputs: [{ name: "auditId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "submitter", type: "address" },
          { name: "sourceHash", type: "bytes32" },
          { name: "reportHash", type: "bytes32" },
          { name: "metadataURI", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "tokenId", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }]
  },
  {
    type: "event",
    name: "AuditSubmitted",
    inputs: [
      { name: "auditId", type: "uint256", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "submitter", type: "address", indexed: true },
      { name: "sourceHash", type: "bytes32", indexed: false },
      { name: "reportHash", type: "bytes32", indexed: false },
      { name: "metadataURI", type: "string", indexed: false }
    ]
  }
] as const;
