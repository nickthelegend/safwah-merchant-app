"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { fmt, TOK, type Tok } from "@/lib/data";
import { useOnchain } from "@/components/OnchainProvider";
import { recordTx } from "@/lib/txHistory";

const TOURIST_URL = process.env.NEXT_PUBLIC_TOURIST_URL || "http://localhost:3001";
const short = (x: string) => `${x.slice(0, 6)}…${x.slice(-4)}`;

export default function ChargePage() {
  const { addr, state, connect, connecting, refresh } = useOnchain();
  const [amt, setAmt] = useState("");
  const [tok, setTok] = useState<Tok>("USDT");
  const [charge, setCharge] = useState<{ aed: number; link: string; baseline: number } | null>(null);
  const [paid, setPaid] = useState(false);

  const a = parseFloat(amt) || 0;
  const tokAmt = a / TOK[tok].aed;

  const onConnect = async () => {
    try { await connect(); toast.success("Wallet connected · Amoy"); } catch (e) { toast.error((e as Error).message); }
  };

  const create = () => {
    if (!addr) return toast.error("Connect your wallet first");
    if (a <= 0) return toast.error("Enter an amount");
    setCharge({ aed: a, link: `${TOURIST_URL}/live?to=${addr}&amt=${a}`, baseline: state?.aed ?? 0 });
    setPaid(false);
  };

  // Poll for the on-chain payment while a charge is open
  useEffect(() => {
    if (!charge || paid) return;
    const id = setInterval(() => refresh(), 4000);
    return () => clearInterval(id);
  }, [charge, paid, refresh]);

  // Detect settlement — the merchant's on-chain AED balance rose by ~the charged amount
  useEffect(() => {
    if (!charge || paid || !state) return;
    if (state.aed >= charge.baseline + charge.aed * 0.99) {
      setPaid(true);
      recordTx({ kind: "charge", label: "Payment received", sub: "settled to AED", aed: charge.aed, addr: addr! });
      toast.success(`Payment received · AED ${fmt(charge.aed)} settled on-chain`);
    }
  }, [state, charge, paid]);

  const reset = () => { setCharge(null); setPaid(false); setAmt(""); };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>New charge</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 22 }}>Enter an amount — the customer scans, pays in crypto, and AED settles to you on-chain.</p>

      {!charge && (
        <>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>Amount to charge</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28, color: "var(--text-dim)", fontWeight: 600 }}>AED</span>
              <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus className="mono" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 40, fontWeight: 700, minWidth: 0 }} />
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

          {addr ? (
            <button onClick={create} disabled={a <= 0} style={{ width: "100%", height: 54, marginTop: 20, fontSize: 16, fontWeight: 700, background: a > 0 ? "var(--lime)" : "var(--card)", color: a > 0 ? "var(--on-lime)" : "var(--text-mute)", borderRadius: 999, border: a > 0 ? "none" : "1px solid var(--border)" }}>
              {a > 0 ? `Charge AED ${fmt(a)}` : "Enter an amount"}
            </button>
          ) : (
            <button onClick={onConnect} disabled={connecting} className="btn-lime" style={{ width: "100%", height: 54, marginTop: 20, fontSize: 16, borderRadius: 999 }}>{connecting ? "Connecting…" : "Connect wallet to charge"}</button>
          )}
        </>
      )}

      {charge && !paid && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Scan to pay</div>
          <div className="mono" style={{ fontSize: 34, fontWeight: 700, marginTop: 4 }}>AED {fmt(charge.aed)}</div>
          <div style={{ background: "#fff", padding: 16, borderRadius: 16, display: "inline-block", marginTop: 18, border: "1px solid var(--border)" }}>
            <QRCode value={charge.link} size={180} bgColor="#ffffff" fgColor="#15300C" />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18, color: "var(--text-dim)", fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--emerald)" }} className="animate-pulse-ring" />
            Waiting for payment…
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={() => { navigator.clipboard?.writeText(charge.link); toast.success("Pay link copied"); }} className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 13.5 }}>Copy link</button>
            <button onClick={reset} className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 13.5 }}>Cancel</button>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 14 }}>To {short(addr!)} · settles automatically when the customer pays.</p>
        </div>
      )}

      {charge && paid && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ width: 66, height: 66, borderRadius: 99, background: "var(--emerald)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff" }}>✓</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginTop: 18 }}>Payment received</h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 6 }}>AED {fmt(charge.aed)} settled to your balance on Polygon Amoy.</p>
          <button onClick={reset} className="btn-lime" style={{ width: "100%", height: 50, fontSize: 15, marginTop: 22, borderRadius: 999 }}>New charge</button>
        </div>
      )}
    </main>
  );
}
