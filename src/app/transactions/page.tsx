"use client";

import { useEffect, useState } from "react";
import { fmt, SALES, TOK } from "@/lib/data";
import { useOnchain } from "@/components/OnchainProvider";
import { getTxns, agoOf, type TxRecord } from "@/lib/txHistory";
import { txUrl } from "@/lib/chain";

const KIND: Record<string, { label: string; icon: string }> = {
  charge: { label: "Charge", icon: "+" },
  payout: { label: "Payout", icon: "↑" },
  register: { label: "Register", icon: "★" },
  pay: { label: "Payment", icon: "→" },
  swap: { label: "Swap", icon: "⇄" },
  faucet: { label: "Faucet", icon: "↓" },
};

export default function SalesPage() {
  const { addr } = useOnchain();
  const [txns, setTxns] = useState<TxRecord[]>([]);

  useEffect(() => {
    const load = () => setTxns(getTxns(addr));
    load();
    window.addEventListener("safwah:tx", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("safwah:tx", load); window.removeEventListener("storage", load); };
  }, [addr]);

  const hasReal = txns.length > 0;
  const received = txns.filter((t) => t.kind === "charge").reduce((s, t) => s + (t.aed || 0), 0);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>Sales</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>Your on-chain activity, settled to AED on Polygon Amoy.</p>

      {hasReal ? (
        <>
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Received</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: "var(--emerald)" }}>AED {fmt(received)}</div>
              </div>
              <div style={{ width: 1, background: "var(--hairline)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Transactions</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{txns.length}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "6px 22px" }}>
            {txns.map((t, i) => {
              const k = KIND[t.kind] || { label: t.kind, icon: "•" };
              const positive = t.kind === "charge";
              const row = (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i < txns.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--card-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{k.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.label}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{t.sub ? `${t.sub} · ` : ""}{agoOf(t.ts)}{t.hash ? " · view ↗" : ""}</div>
                  </div>
                  {typeof t.aed === "number" && <div className="mono" style={{ fontWeight: 700, fontSize: 14.5, color: positive ? "var(--emerald)" : "var(--text)" }}>{positive ? "+ " : "− "}AED {fmt(t.aed)}</div>}
                </div>
              );
              return t.hash ? <a key={i} href={txUrl(t.hash)} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>{row}</a> : <div key={i}>{row}</div>;
            })}
          </div>
        </>
      ) : (
        <>
          <div className="card" style={{ padding: 28, textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>No sales yet</div>
            <p style={{ color: "var(--text-mute)", fontSize: 13, marginTop: 6 }}>Create a charge and take a payment — settled sales, payouts and registrations appear here with Polygonscan links.</p>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", margin: "0 4px 10px", textTransform: "uppercase", letterSpacing: 1, fontFamily: "var(--font-mono)" }}>Sample sales</div>
          <div className="card" style={{ padding: "6px 22px", opacity: 0.7 }}>
            {SALES.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: i < SALES.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOK[s.tok].color}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOK[s.tok].color, fontWeight: 700, fontSize: 13 }}>{s.tok === "ETH" ? "Ξ" : s.tok[0]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.who}</div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{fmt(s.tokAmt, s.tok === "ETH" ? 4 : 2)} {s.tok} · {s.ago}</div>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--emerald)" }}>+ AED {fmt(s.aed)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
