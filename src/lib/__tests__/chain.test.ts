import { describe, it, expect } from "vitest";
import { ADDR, CHAIN, EXPLORER, RPC_URL, txUrl, a } from "@/lib/chain";

describe("chain config", () => {
  it("targets Polygon Amoy (chainId 80002)", () => {
    expect(CHAIN.id).toBe(80002);
    expect(RPC_URL).toMatch(/^https?:\/\//);
  });

  it("has a valid 0x address for every contract (env or fallback)", () => {
    const keys = Object.keys(ADDR) as (keyof typeof ADDR)[];
    expect(keys.length).toBeGreaterThanOrEqual(7);
    for (const k of keys) {
      expect(ADDR[k]).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });

  it("builds a Polygonscan tx url", () => {
    expect(txUrl("0xdeadbeef")).toBe(`${EXPLORER}/tx/0xdeadbeef`);
  });

  it("a() passes an address through as a 0x string", () => {
    expect(a(ADDR.MockUSDT)).toBe(ADDR.MockUSDT);
  });
});
