"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fmt } from "@/lib/data";
import { useOnchain } from "@/components/OnchainProvider";
import { sendPayout } from "@/lib/onchain";
import { txUrl } from "@/lib/chain";

type Asset = "AED" | "USDT" | "ETH";
type Payout = { to: string; dest: string; asset: Asset; aed: number; status: "sent" | "queued"; ago: string };

const SEED: Payout[] = [
  { to: "Gulf Supplies LLC", dest: "AE12 ••• 8842", asset: "AED", aed: 6200, status: "sent", ago: "1h" },
  { to: "Rahul (contractor)", dest: "0x7a3f…2b1c", asset: "USDT", aed: 3400, status: "sent", ago: "5h" },
  { to: "Fatima (payroll)", dest: "AE07 ••• 0456", asset: "AED", aed: 4800, status: "sent", ago: "1d" },
  { to: "Cloud Kitchen Co", dest: "0x9c20…f4e2", asset: "USDT", aed: 1550, status: "queued", ago: "1d" },
];

export default function Payouts() {
  const [list, setList] = useState<Payout[]>(SEED);
  const [to, setTo] = useState("");
  const [dest, setDest] = useState("");
  const [amt, setAmt] = useState("");
  const [asset, setAsset] = useState<Asset>("AED");
  const { addr } = useOnchain();
  const [busy, setBusy] = useState(false);

  const sent = useMemo(() => list.filter((p) => p.status === "sent").reduce((s, p) => s + p.aed, 0), [list]);
  const queued = useMemo(() => list.filter((p) => p.status === "queued").reduce((s, p) => s + p.aed, 0), [list]);

  const isReal = !!addr && dest.trim().startsWith("0x") && (asset === "AED" || asset === "USDT");

  const send = async () => {
    if (!to.trim() || !dest.trim() || !(+amt > 0)) return toast.error("Fill in recipient, destination and amount");
    if (isReal) {
      try {
        setBusy(true);
        const hash = await sendPayout(asset as "AED" | "USDT", dest.trim(), +amt);
        setList((l) => [{ to: to.trim(), dest: dest.trim(), asset, aed: +amt, status: "sent", ago: "now" }, ...l]);
        toast.success(`Paid ${to.trim()} on-chain`, { description: `${asset} · AED ${fmt(+amt, 0)}`, action: { label: "View ↗", onClick: () => window.open(txUrl(hash), "_blank") } });
        setTo(""); setDest(""); setAmt("");
      } catch (e) {
        const m = (e as Error).message || "Payout failed";
        toast.error(m.length > 90 ? m.slice(0, 90) + "…" : m);
      } finally { setBusy(false); }
      return;
    }
    setList((l) => [{ to: to.trim(), dest: dest.trim(), asset, aed: +amt, status: "sent", ago: "now" }, ...l]);
    toast.success(`Payout queued to ${to.trim()}`, { description: `AED ${fmt(+amt, 0)} · same-day (demo)` });
    setTo(""); setDest(""); setAmt("");
  };

  const input = { height: 46, padding: "0 14px", borderRadius: 12, background: "var(--sunken)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, width: "100%" } as const;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-dim)" }}>Send</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 6 }}>Payouts</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 4 }}>Pay suppliers, staff and contractors from your AED balance — to a UAE bank or a crypto wallet, same day.</p>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Sent this month</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>AED {fmt(sent, 0)}</div>
        </div>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Queued</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>AED {fmt(queued, 0)}</div>
        </div>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 160 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Recipients</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{list.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>New payout</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient name" style={{ ...input, flex: 1, minWidth: 180 }} />
            <div style={{ display: "flex", gap: 4, background: "var(--sunken)", border: "1px solid var(--border)", borderRadius: 99, padding: 4, height: 46, alignItems: "center" }}>
              {(["AED", "USDT", "ETH"] as Asset[]).map((a) => (
                <button key={a} onClick={() => setAsset(a)} className="mono" style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: asset === a ? "var(--lime)" : "transparent", color: asset === a ? "var(--on-lime)" : "var(--text-mute)" }}>{a}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="IBAN or 0x wallet address" className="mono" style={{ ...input, flex: 1, minWidth: 220, fontSize: 13 }} />
            <input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" placeholder="Amount (AED)" className="mono" style={{ ...input, width: 150, flex: "0 0 auto" }} />
          </div>
          <button onClick={send} disabled={busy} className="btn-lime" style={{ height: 46, fontSize: 14, marginTop: 2 }}>{busy ? "Sending on-chain…" : isReal ? "Send payout on-chain" : "Send payout"}</button>
          <p style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: -4 }}>{isReal ? "Real transfer — signs in your wallet and settles on Polygon Amoy." : "Connect a wallet and use a 0x address (AED or USDT) for a real on-chain transfer."}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 8, marginTop: 16 }}>
        {list.map((p, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderBottom: idx < list.length - 1 ? "1px solid var(--hairline)" : "none", flexWrap: "wrap" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{p.to[0]}</span>
            <div style={{ minWidth: 130 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.to}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{p.dest} · {p.asset}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: p.status === "sent" ? "var(--emerald)" : "var(--text-dim)", background: p.status === "sent" ? "var(--emerald-wash)" : "var(--card-soft)", padding: "5px 11px", borderRadius: 99 }}>{p.status === "sent" ? "Sent" : "Queued"} · {p.ago}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: "right" }}>AED {fmt(p.aed, 0)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
