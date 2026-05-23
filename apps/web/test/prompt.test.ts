import { describe, expect, it } from "vitest";
import { buildAuditPrompt } from "@/lib/audit/prompt";

describe("buildAuditPrompt", () => {
  it("embeds schema requirements and contract code", () => {
    const messages = buildAuditPrompt({
      contractName: "Vault",
      targetChain: "Mantle Sepolia",
      contractCode: "contract Vault {}"
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain("Return only valid JSON");
    expect(messages[1].content).toContain("Mantle Sepolia");
    expect(messages[1].content).toContain("contract Vault {}");
    expect(messages[1].content).toContain("findings");
  });
});
