import { keccak256, toBytes } from "viem";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue | undefined };

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, JsonValue | undefined>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function hashText(value: string): `0x${string}` {
  return keccak256(toBytes(value));
}

export function hashJson(value: unknown): `0x${string}` {
  return hashText(stableStringify(value));
}

export function shortHash(hash: string, size = 6) {
  if (hash.length <= size * 2 + 2) {
    return hash;
  }

  return `${hash.slice(0, size + 2)}...${hash.slice(-size)}`;
}
