import { defineChain } from "viem";

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT"
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.mantle.xyz"]
    }
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://explorer.sepolia.mantle.xyz"
    }
  },
  testnet: true
});
