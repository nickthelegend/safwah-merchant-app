"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fmt, TOK, type Tok } from "@/lib/data";

export default function ChargePage() {
  const [amt, setAmt] = useState("");
  const [tok, setTok] = useState<Tok>("USDT");
  const a = parseFloat(amt) || 0;
  const tokAmt = a / TOK[tok].aed;

  const markPaid = () => {
    if (a <= 0) return;
    toast.success(`Payment received · AED ${fmt(a)} settled to your balance`);
    setAmt("");
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>New charge</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 22 }}>Enter an amount — the tourist pays in crypto, you receive AED.</p>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>Amount to charge</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28, color: "var(--text-dim)", fontWeight: 600 }}>AED</span>
          <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus className="mono" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 40, fontWeight: 700 }} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 8 }}>Customer pays ≈ {fmt(tokAmt, tok === "ETH" ? 5 : 2)} {tok} · VAT AED {fmt(a * 0.05)}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
        {(Object.keys(TOK) as Tok[]).map((t) => (
          <button key={t} onClick={() => setTok(t)} className="mono" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 99, fontWeight: 700, background: tok === t ? "var(--card-soft)" : "var(--card)", border: `1px solid ${tok === t ? TOK[t].color : "var(--border)"}`, color: tok === t ? "var(--text)" : "var(--text-dim)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: TOK[t].color }} /> {t}
          </button>
        ))}
      </div>

      <button onClick={markPaid} disabled={a <= 0} style={{ width: "100%", height: 54, marginTop: 20, fontSize: 16, fontWeight: 700, background: a > 0 ? "var(--lime)" : "var(--card)", color: a > 0 ? "var(--on-lime)" : "var(--text-mute)", borderRadius: 14, border: a > 0 ? "none" : "1px solid var(--border)" }}>
        {a > 0 ? `Charge AED ${fmt(a)} → Mark paid` : "Enter an amount"}
      </button>
      <p style={{ fontSize: 12, color: "var(--text-mute)", textAlign: "center", marginTop: 14 }}>Demo confirms the on-chain payment for you. On mobile, this shows a scannable QR.</p>
    </main>
  );
}
