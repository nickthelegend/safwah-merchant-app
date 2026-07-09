import { describe, it, expect } from "vitest";
import { fmt, TOK, RATE } from "@/lib/data";

describe("fmt()", () => {
  it("formats to 2 decimals with thousands separators", () => {
    expect(fmt(1234.5)).toBe("1,234.50");
    expect(fmt(1000)).toBe("1,000.00");
  });
  it("respects a custom decimal count", () => {
    expect(fmt(1234, 0)).toBe("1,234");
  });
});

describe("token metadata (TOK)", () => {
  it("uses the on-chain AED/USD reference rate", () => {
    expect(RATE).toBeCloseTo(3.6725, 4);
  });
  it("prices tokens in AED", () => {
    expect(TOK.AED.aed).toBe(1);
    expect(TOK.USDT.aed).toBe(RATE);
    expect(TOK.ETH.aed).toBeGreaterThan(0);
  });
  it("uses the Talise dark-green ink color for AED", () => {
    expect(TOK.AED.color).toBe("#15300C");
  });
});
