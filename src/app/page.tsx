"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useOnchain } from "@/components/OnchainProvider";
import { useData } from "@/components/DataProvider";
import { fmt, ago } from "@/lib/api";

export default function Home() {
  const { addr, state } = useOnchain();
  const { sales, stats, loading } = useData();

  const available = state?.aed ?? 0;
  const avg = stats.txCount ? stats.totalSpentAED / stats.txCount : 0;
  const recent = sales.slice(0, 5);

  const kpis: [string, string, string][] = [
    ["Revenue", fmt(stats.totalSpentAED, 0), "AED settled"],
    ["Sales", `${stats.txCount}`, "transactions"],
    ["VAT", fmt(stats.totalVatAED, 0), "collected"],
    ["Avg", fmt(avg, 0), "ticket"],
  ];

  return (
    <main style={{ padding: "34px 44px 80px", maxWidth: 1180 }}>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>Good afternoon, Spice Route Café.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 22, alignItems: "stretch" }}>
        {/* available to settle */}
        <div className="hero-dark" style={{ padding: "26px 28px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="eyebrow">Available to settle</span>
            <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--base)", background: "var(--accent-lime)", padding: "4px 9px", borderRadius: 99 }}>{addr ? "● ON-CHAIN" : "DEMO"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 14 }}>
            <span className="display" style={{ fontSize: 24, color: "rgba(247,252,242,.7)", marginBottom: 7 }}>AED</span>
            <span className="display" style={{ fontSize: 50, color: "var(--paper)", lineHeight: 1 }}>{fmt(available)}</span>
          </div>
          <p className="mono" style={{ color: "rgba(247,252,242,.65)", fontSize: 13, marginTop: 12 }}>
            Auto-converted from USDT · ETH at point of sale · 0% fee
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: "auto", paddingTop: 24 }}>
            <button onClick={() => (available > 0 ? toast.success(`AED ${fmt(available)} on its way to your bank`) : toast("Nothing to withdraw yet"))} style={{ flex: 1, height: 48, borderRadius: 999, background: "rgba(247,252,242,.1)", border: "1px solid rgba(247,252,242,.2)", color: "var(--paper)", fontWeight: 700, fontSize: 14.5 }}>↑ Withdraw to bank</button>
            <Link href="/charge" style={{ flex: 1.2, height: 48, borderRadius: 999, background: "var(--accent-lime)", color: "var(--base)", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>＋ New charge</Link>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {kpis.map(([label, value, unit]) => (
            <div key={label} className="pop-card" style={{ padding: "18px 20px", boxShadow: "3px 4px 0 0 var(--lime)" }}>
              <div className="eyebrow">{label}</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: -1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* recent sales */}
      <div style={{ marginTop: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="eyebrow">Recent sales</span>
          <Link href="/transactions" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--emerald)" }}>See all →</Link>
        </div>
        <div className="pop-card" style={{ padding: recent.length ? "8px 8px" : "56px 24px" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-mute)", padding: "40px 0" }}>Loading…</p>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 62, height: 62, borderRadius: 99, background: "var(--card-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 26 }}>🧾</div>
              <div className="display" style={{ fontSize: 22 }}>No sales yet</div>
              <p style={{ color: "var(--text-mute)", fontSize: 13.5, marginTop: 8 }}>Charges you accept will land here.</p>
            </div>
          ) : (
            recent.map((t, i) => (
              <div key={t._id ?? i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < recent.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid var(--border-strong)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, color: "var(--lime)" }}>{t.token === "ETH" ? "Ξ" : t.token[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.category} · {t.merchant}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{t.token} · {ago(t.ts)}</div>
                </div>
                <div className="mono" style={{ color: "var(--emerald)", fontWeight: 700, fontSize: 14.5 }}>+ AED {fmt(t.amountAED)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
