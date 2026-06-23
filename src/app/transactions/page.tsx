"use client";

import { fmt, SALES, TOK } from "@/lib/data";

export default function SalesPage() {
  const total = SALES.reduce((s, x) => s + x.aed, 0);
  const vat = +(total * 0.05).toFixed(2);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>Sales</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>Auto-settled to AED · recorded on Polygon Amoy.</p>

      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Total received</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: "var(--emerald)" }}>AED {fmt(total)}</div>
          </div>
          <div style={{ width: 1, background: "var(--hairline)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>VAT collected</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>AED {fmt(vat)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "6px 22px" }}>
        {SALES.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i < SALES.length - 1 ? "1px solid var(--hairline)" : "none" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${TOK[s.tok].color}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOK[s.tok].color, fontWeight: 700, fontSize: 13 }}>{s.tok === "ETH" ? "Ξ" : s.tok[0]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.who}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{fmt(s.tokAmt, s.tok === "ETH" ? 4 : 2)} {s.tok} · {s.ago}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontWeight: 700, fontSize: 14.5, color: "var(--emerald)" }}>+ AED {fmt(s.aed)}</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>Settled</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
