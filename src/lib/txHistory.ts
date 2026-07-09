// Real on-chain activity log. Every transaction the app sends is recorded here with
// its real tx hash, so /transactions shows genuine history without needing an indexer.
export type TxKind = "faucet" | "swap" | "pay" | "payout" | "register" | "charge";
export type TxRecord = { hash?: string; kind: TxKind; label: string; sub?: string; aed?: number; ts: number; addr: string };

const KEY = "safwah_txns_v1";

function readAll(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function recordTx(rec: Omit<TxRecord, "ts">) {
  if (typeof window === "undefined") return;
  const list = readAll();
  list.unshift({ ...rec, ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  try { window.dispatchEvent(new Event("safwah:tx")); } catch { /* noop */ }
}

export function getTxns(addr?: string | null): TxRecord[] {
  const list = readAll();
  return addr ? list.filter((t) => t.addr?.toLowerCase() === addr.toLowerCase()) : list;
}

export function agoOf(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
