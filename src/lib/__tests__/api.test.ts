import { describe, it, expect, vi, afterEach } from "vitest";
import { getStats, apiGet, DEFAULT_STATS } from "../api";

const okJson = (data: unknown) => ({ ok: true, json: async () => data });
const httpErr = (status: number) => ({ ok: false, status, json: async () => ({}) });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getStats", () => {
  it("returns parsed stats when the API responds 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okJson({ txCount: 5, totalSpentAED: 5380.4, totalVatAED: 269.02, byCategory: {}, byToken: { USDT: 5130 } })
      )
    );
    const s = await getStats();
    expect(s.txCount).toBe(5);
    expect(s.totalVatAED).toBe(269.02);
    expect(s.byToken.USDT).toBe(5130);
  });

  it("falls back to DEFAULT_STATS on an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(httpErr(500)));
    expect(await getStats()).toEqual(DEFAULT_STATS);
  });

  it("falls back to DEFAULT_STATS when the network throws (demo mode stays up)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getStats()).toEqual(DEFAULT_STATS);
  });
});

describe("apiGet", () => {
  it("returns the payload on success and the fallback on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okJson({ hi: 1 })));
    expect(await apiGet("/x", { hi: 0 })).toEqual({ hi: 1 });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await apiGet("/x", { hi: 0 })).toEqual({ hi: 0 });
  });
});
