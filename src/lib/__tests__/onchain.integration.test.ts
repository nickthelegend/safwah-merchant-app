import { describe, it, expect } from "vitest";
import { readMerchantState, readTreasury } from "@/lib/onchain";
import { publicClient } from "@/lib/chain";

// Deployer/treasury: minted 1,000,000 MockUSDT + MockAED at deploy time; holds POL for gas.
const DEPLOYER = "0x0121Cb33BdAeEb8f400b27c0D5f3C7916C77F453" as const;

// Live Amoy reads — run locally, skip on CI (public RPC rate-limits). Unit suites still gate CI.
describe.skipIf(process.env.CI)("merchant on-chain integration — live Polygon Amoy (reads only)", () => {
  it("reads the live chain id (80002)", async () => {
    expect(await publicClient.getChainId()).toBe(80002);
  });

  it("readMerchantState() returns a well-formed record with live AED balance", async () => {
    const s = await readMerchantState(DEPLOYER);
    expect(typeof s.registered).toBe("boolean");
    expect(typeof s.active).toBe("boolean");
    expect(typeof s.name).toBe("string");
    expect(s.aed).toBeGreaterThan(0);
    expect(typeof s.vat).toBe("number");
  });

  it("readTreasury() returns live multi-asset balances (AED / USDT / POL)", async () => {
    const t = await readTreasury(DEPLOYER);
    expect(t.aed).toBeGreaterThan(0);
    expect(t.usdt).toBeGreaterThan(0);
    expect(t.pol).toBeGreaterThanOrEqual(0);
  });
});
