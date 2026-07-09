// Thin client for the Safwah backend API (holds the Mongo credential).
// Resilient: any network/HTTP error falls back to a safe default so the
// console still renders (demo mode) when the backend is unreachable.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Stats = {
  txCount: number;
  totalSpentAED: number;
  totalVatAED: number;
  byCategory: Record<string, { count: number; amountAED: number }>;
  byToken: Record<string, number>;
  updatedAt?: number;
};

export const DEFAULT_STATS: Stats = {
  txCount: 0,
  totalSpentAED: 0,
  totalVatAED: 0,
  byCategory: {},
  byToken: {},
};

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export type Transaction = {
  _id?: string;
  merchant: string;
  category: string;
  amountAED: number;
  vatAED: number;
  token: "AED" | "USDT" | "ETH";
  status: string;
  ts: number;
};

export type Rates = { aedPerUsd: number; usdtPerUsd: number; updatedAt?: number };
export const DEFAULT_RATES: Rates = { aedPerUsd: 3.6725, usdtPerUsd: 1 };

export const getStats = () => apiGet<Stats>("/stats", DEFAULT_STATS);
export const getTransactions = () => apiGet<Transaction[]>("/transactions", []);
export const getRates = () => apiGet<Rates>("/rates", DEFAULT_RATES);

export type Holding = { sym: string; name: string; amt: number; aed: number };
export type Card = { holder: string; last4: string; type: "Virtual" | "Physical"; limit: number; spent: number; frozen: boolean };
export type Payout = { to: string; dest: string; asset: "AED" | "USDT" | "ETH"; aed: number; status: "sent" | "queued"; ts: number };

export const getTreasury = () => apiGet<Holding[]>("/treasury", []);
export const getCards = () => apiGet<Card[]>("/cards", []);
export const getPayouts = () => apiGet<Payout[]>("/payouts", []);

export const fmt = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export function ago(ts: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
