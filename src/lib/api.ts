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

export const getStats = () => apiGet<Stats>("/stats", DEFAULT_STATS);
