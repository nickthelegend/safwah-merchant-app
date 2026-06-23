"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fmt, SALES, TOK, WEEK, initialAvailable, IBAN } from "@/lib/data";
import { BarChart } from "@/lib/charts";

export default function Home() {
  const [available, setAvailable] = useState(initialAvailable);
  const today = SALES.slice(0, 4).reduce((s, x) => s + x.aed, 0);
  const vat = +(today * 0.05).toFixed(0);
  const bars = WEEK.map((d, i) => ({ label: d.x, value: d.y, color: i === WEEK.length - 1 ? "#CCFF00" : "#10b981" }));

  const withdraw = () => {
    if (available <= 0) return;
    toast.success(`AED ${fmt(available)} on its way to your bank`);
    setAvailable(0);
  };

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 80px" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Good afternoon,</p>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 2, marginBottom: 22 }}>Spice Route Café</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 14, fontWeight: 500 }}>Available to settle</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--emerald)", background: "var(--emerald-wash)", padding: "4px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--emerald)" }} /> Live
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 16 }}>
              <span style={{ fontSize: 20, color: "var(--text-dim)", fontWeight: 600, marginBottom: 8 }}>AED</span>
              <span className="mono" style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{fmt(available)}</span>
            </div>
            <p style={{ color: "var(--text-mute)", fontSize: 13, marginTop: 8 }}>Auto-converted from USDT · ETH at point of sale · 0% fee</p>
            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
              <button onClick={withdraw} className="btn-ghost" style={{ flex: 1, height: 48, fontWeight: 600, fontSize: 14.5 }}>↑ Withdraw to bank</button>
              <Link href="/charge" className="btn-lime" style={{ flex: 1.3, height: 48, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center" }}>+ New charge</Link>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Revenue</h3>
                <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Last 7 days · AED settled</p>
              </div>
              <Link href="/analytics" style={{ fontSize: 12, fontWeight: 600, color: "var(--lime)", background: "var(--lime-wash)", padding: "6px 11px", borderRadius: 99 }}>▲ Analytics</Link>
            </div>
            <BarChart data={bars} />
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent sales</h3>
              <Link href="/transactions" style={{ fontSize: 13, fontWeight: 600, color: "var(--lime)" }}>See all</Link>
            </div>
            {SALES.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < 3 ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOK[s.tok].color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: TOK[s.tok].color }}>{s.tok === "ETH" ? "Ξ" : s.tok[0]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.who}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{fmt(s.tokAmt, s.tok === "ETH" ? 4 : 2)} {s.tok} · {s.ago}</div>
                </div>
                <div className="mono" style={{ color: "var(--emerald)", fontWeight: 700, fontSize: 14.5 }}>+ AED {fmt(s.aed)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Revenue", `${fmt(today, 0)}`, "AED today"], ["Sales", "4", "today"], ["VAT", `${vat}`, "collected"], ["Avg", `${fmt(today / 4, 0)}`, "ticket"]].map(([l, v, u]) => (
              <div key={l} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{l}</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{v}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-mute)" }}>{u}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Payout bank</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--card-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>🏦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Emirates NBD · Business</div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{IBAN}</div>
              </div>
              <span style={{ color: "var(--emerald)" }}>✓</span>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 12 }}>Settled instantly · withdraw anytime · standard bank transfer.</p>
          </div>

          <div className="card hoverable" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Tools</h3>
            {([["New charge", "Charge a tourist by QR", "/charge"], ["Analytics", "Revenue & payment mix", "/analytics"], ["Sales", "Full history & VAT", "/transactions"]] as const).map(([t, s, href]) => (
              <Link key={t} href={href} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--lime-wash)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lime)" }}>→</span>
                <span style={{ flex: 1 }}><span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{t}</span><span style={{ fontSize: 12, color: "var(--text-mute)" }}>{s}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
