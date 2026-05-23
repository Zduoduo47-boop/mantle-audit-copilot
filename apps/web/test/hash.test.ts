import { describe, expect, it } from "vitest";
import { hashJson, hashText, stableStringify } from "@/lib/hash";

describe("hash helpers", () => {
  it("stableStringify sorts object keys recursively", () => {
    const first = stableStringify({ b: 2, a: { d: 4, c: 3 } });
    const second = stableStringify({ a: { c: 3, d: 4 }, b: 2 });

    expect(first).toBe(second);
  });

  it("hashJson returns the same hash for semantically equal objects", () => {
    const first = hashJson({ z: ["a", "b"], a: 1 });
    const second = hashJson({ a: 1, z: ["a", "b"] });

    expect(first).toBe(second);
    expect(first).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it("hashText returns a bytes32-like hash", () => {
    expect(hashText("Mantle Audit Copilot")).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
