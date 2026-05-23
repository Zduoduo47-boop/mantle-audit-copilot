import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantleSepolia } from "@/lib/chains";

export const config = getDefaultConfig({
  appName: "Mantle Audit Copilot",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [mantleSepolia],
  ssr: true
});
