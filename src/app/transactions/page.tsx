"use client";

import { useEffect, useState } from "react";
import { fmt, ago } from "@/lib/api";
import { useOnchain } from "@/components/OnchainProvider";
import { useData } from "@/components/DataProvider";
import { getTxns, agoOf, type TxRecord } from "@/lib/txHistory";
import { txUrl } from "@/lib/chain";

const KIND: Record<string, string> = {
  charge: "+", payout: "↑", register: "★", pay: "→", swap: "⇄", faucet: "↓",
};

export default function SalesPage() {
  const { addr } = useOnchain();
  const { sales, stats, loading } = useData(); // real sales feed + aggregates from the API
  const [chain, setChain] = useState<TxRecord[]>([]); // real on-chain history (local)

  useEffect(() => {
    const load = () => setChain(getTxns(addr));
    load();
    window.addEventListener("safwah:tx", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("safwah:tx", load); window.removeEventListener("storage", load); };
  }, [addr]);

  const received = stats.totalSpentAED + chain.filter((t) => t.kind === "charge").reduce((s, t) => s + (t.aed || 0), 0);
  const count = sales.length + chain.length;
  const empty = !loading && count === 0;

  return (
    <main style={{ padding: "34px 44px 80px", maxWidth: 900 }}>
      <span className="eyebrow" style={{ display: "block" }}>Sales</span>
      <h1 className="display" style={{ fontSize: 34, marginTop: 6, marginBottom: 8 }}>Every charge you took</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 22 }}>Settled to AED on Polygon Amoy — customers pay in crypto, you bank Dirhams.</p>

      {!empty && (
        <div className="pop-card" style={{ padding: 24, marginBottom: 20, display: "flex", gap: 28, boxShadow: "3px 4px 0 0 var(--lime)" }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Received</div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 8, letterSpacing: -1, color: "var(--emerald)" }}>AED {fmt(received)}</div>
          </div>
          <div style={{ width: 1, background: "var(--hairline)" }} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Transactions</div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 8, letterSpacing: -1 }}>{count}</div>
          </div>
        </div>
      )}

      <div className="pop-card" style={{ padding: empty ? "56px 24px" : "8px 10px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-mute)", padding: "40px 0" }}>Loading…</p>
        ) : empty ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 62, height: 62, borderRadius: 99, background: "var(--card-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 26 }}>🧾</div>
            <div className="display" style={{ fontSize: 22 }}>No sales yet</div>
            <p style={{ color: "var(--text-mute)", fontSize: 13.5, marginTop: 8 }}>Create a charge and take a payment — it lands here with a Polygonscan link.</p>
          </div>
        ) : (
          <>
            {chain.map((t, i) => {
              const positive = t.kind === "charge";
              const row = (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderBottom: "1px solid var(--hairline)" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-lime)", display: "grid", placeItems: "center", fontWeight: 700, color: "var(--base)" }}>{KIND[t.kind] || "•"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.label}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{t.sub ? `${t.sub} · ` : ""}{agoOf(t.ts)}{t.hash ? " · view ↗" : ""}</div>
                  </div>
                  {typeof t.aed === "number" && <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: positive ? "var(--emerald)" : "var(--text)" }}>{positive ? "+ " : "− "}AED {fmt(t.aed)}</div>}
                </div>
              );
              return t.hash ? <a key={`c${i}`} href={txUrl(t.hash)} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>{row}</a> : <div key={`c${i}`}>{row}</div>;
            })}
            {sales.map((t, i) => (
              <div key={t._id ?? `s${i}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderBottom: i < sales.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid var(--border-strong)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, color: "var(--lime)" }}>{t.token === "ETH" ? "Ξ" : t.token[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.category} · {t.merchant}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{t.token} · {ago(t.ts)}</div>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--emerald)" }}>+ AED {fmt(t.amountAED)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
