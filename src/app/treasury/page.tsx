"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fmt } from "@/lib/data";
import { useOnchain } from "@/components/OnchainProvider";
import { readTreasury, type Treasury } from "@/lib/onchain";

const ASSETS = [
  { sym: "AED", name: "Dirham balance", amt: 48920, aed: 48920, color: "#15300C" },
  { sym: "USDT", name: "Tether (idle treasury)", amt: 12000, aed: 44070, color: "#26a17b" },
  { sym: "ETH", name: "Ethereum", amt: 3.2, aed: 37632, color: "#8a92b2" },
];

export default function Treasury() {
  const { addr } = useOnchain();
  const [real, setReal] = useState<Treasury | null>(null);
  const [earning, setEarning] = useState(false);
  useEffect(() => {
    if (!addr) { setReal(null); return; }
    let live = true;
    const load = () => readTreasury(addr).then((t) => { if (live) setReal(t); }).catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => { live = false; clearInterval(id); };
  }, [addr]);
  const onchain = !!addr && !!real;
  const RATE = 3.6725;
  const assets = onchain ? [
    { sym: "AED", name: "Dirham balance", amt: real!.aed, aed: real!.aed, color: "#15300C" },
    { sym: "USDT", name: "Tether (on-chain)", amt: real!.usdt, aed: real!.usdt * RATE, color: "#26a17b" },
    { sym: "POL", name: "Gas (native)", amt: real!.pol, aed: real!.pol * 1.8, color: "#8247e5" },
  ] : ASSETS;
  const total = assets.reduce((s, a) => s + a.aed, 0) || 1;
  const idle = assets.find((a) => a.sym === "USDT")?.aed ?? 0;
  const apy = 4.1;

  return (
    <main style={{ maxWidth: 1000, padding: "34px 44px 80px" }}>
      <div>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-dim)" }}>Hold</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 6 }}>Treasury</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 4 }}>Hold AED and digital dollars in one account. Convert at fair on-chain rates, and put idle funds to work.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 14, fontWeight: 500 }}>Total treasury value</span>
              {onchain
                ? <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--emerald)", background: "var(--emerald-wash)", padding: "3px 8px", borderRadius: 99 }}>● LIVE</span>
                : <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-mute)", background: "var(--card-soft)", padding: "3px 8px", borderRadius: 99 }}>DEMO</span>}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 12 }}>
              <span style={{ fontSize: 20, color: "var(--text-dim)", fontWeight: 600, marginBottom: 8 }}>AED</span>
              <span className="mono" style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{fmt(total, 0)}</span>
            </div>
            {/* allocation bar */}
            <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginTop: 20 }}>
              {assets.map((a) => <div key={a.sym} title={a.sym} style={{ width: `${(a.aed / total) * 100}%`, background: a.color }} />)}
            </div>
            <div style={{ marginTop: 18 }}>
              {assets.map((a, i) => (
                <div key={a.sym} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < assets.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 99, background: a.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{a.sym === "ETH" ? "Ξ" : a.sym[0]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{a.sym}</div>
                    <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{a.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 14.5 }}>{fmt(a.amt, a.sym === "ETH" ? 4 : 0)} {a.sym}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>AED {fmt(a.aed, 0)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => toast("Convert between AED · USDT · ETH at the on-chain rate")} className="btn-ghost" style={{ width: "100%", height: 46, fontSize: 14, marginTop: 18 }}>⇄ Convert assets</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 13, fontWeight: 500 }}>Earn on idle funds</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--emerald)", background: "var(--emerald-wash)", padding: "4px 10px", borderRadius: 99 }}>{apy}% APY</span>
            </div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 14 }}>AED {fmt(idle, 0)}</div>
            <p style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>Idle USDT parked in a regulated, redeemable stablecoin vault. Withdraw anytime.</p>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 10 }}>Projected · <b className="mono" style={{ color: "var(--text)" }}>AED {fmt((idle * apy) / 100, 0)}</b> / yr</p>
            <button onClick={() => { setEarning((v) => !v); toast.success(earning ? "Funds moved to available" : "Idle funds now earning"); }} className="btn-lime" style={{ width: "100%", height: 46, fontSize: 14, marginTop: 16 }}>{earning ? "Stop earning" : "Start earning"}</button>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Compliance</h3>
            {[["PTSR VAT tracking", "on"], ["AML / KYC screening", "on"], ["Licensed custody partner", "on"]].map(([l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{l}</span>
                <span style={{ color: "var(--emerald)", fontSize: 13 }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
