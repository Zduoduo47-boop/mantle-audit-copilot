import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Mantle Audit Copilot",
  description: "AI smart contract audit assistant with Mantle Sepolia proof of audit."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
