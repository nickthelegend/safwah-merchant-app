export const RATE = 3.6725;
export const fmt = (n: number, dp = 2) => n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export type Tok = "USDT" | "ETH" | "AED";
export const TOK: Record<Tok, { aed: number; color: string }> = {
  USDT: { aed: RATE, color: "#26a17b" },
  ETH: { aed: RATE * 3150, color: "#8a92b2" },
  AED: { aed: 1, color: "#131316" },
};

export const WEEK = [
  { x: "Wed", y: 760 }, { x: "Thu", y: 1180 }, { x: "Fri", y: 910 }, { x: "Sat", y: 1340 },
  { x: "Sun", y: 1020 }, { x: "Mon", y: 1480 }, { x: "Tue", y: 917 },
];

export type Sale = { who: string; tok: Tok; tokAmt: number; aed: number; ago: string };
export const SALES: Sale[] = [
  { who: "Tourist · 0x7a3f", tok: "USDT", tokAmt: 67.53, aed: 248, ago: "6m ago" },
  { who: "Tourist · 0x44b1", tok: "USDT", tokAmt: 26.28, aed: 96.5, ago: "52m ago" },
  { who: "Tourist · 0x9c20", tok: "ETH", tokAmt: 0.0535, aed: 530, ago: "3h ago" },
  { who: "Walk-in", tok: "AED", tokAmt: 42, aed: 42, ago: "5h ago" },
  { who: "Tourist · 0x1f88", tok: "USDT", tokAmt: 50.99, aed: 187.25, ago: "1d ago" },
];

export const TOKEN_MIX = [
  { label: "USDT", value: 531.75, color: "#26a17b" },
  { label: "ETH", value: 530, color: "#8a92b2" },
  { label: "AED", value: 42, color: "#131316" },
];

export const initialAvailable = 1604.75;
export const IBAN = "AE07 ••• 0123 456";
