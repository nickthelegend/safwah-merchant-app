"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fmt } from "@/lib/data";

type Card = { holder: string; last4: string; type: "Virtual" | "Physical"; limit: number; spent: number; frozen: boolean };

const SEED: Card[] = [
  { holder: "Spice Route Café", last4: "6041", type: "Physical", limit: 20000, spent: 8420, frozen: false },
  { holder: "Ops — Fatima", last4: "2288", type: "Virtual", limit: 5000, spent: 1260, frozen: false },
];

const TXNS = [
  { m: "Talabat Business", cat: "Supplies", aed: 640, ago: "2h", card: "6041" },
  { m: "ADNOC Station", cat: "Fuel", aed: 180, ago: "6h", card: "6041" },
  { m: "Amazon.ae", cat: "Equipment", aed: 1250, ago: "1d", card: "2288" },
  { m: "Union Coop", cat: "Groceries", aed: 415, ago: "1d", card: "6041" },
];

function CardFace({ c }: { c: Card }) {
  return (
    <div style={{ position: "relative", borderRadius: 20, padding: 22, minHeight: 200, color: "#fff", overflow: "hidden", background: "linear-gradient(140deg, #1c1c22 0%, #131316 55%, #050506 100%)", boxShadow: "0 20px 44px -20px rgba(19,19,22,0.5)", opacity: c.frozen ? 0.55 : 1 }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: 999, background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 5, height: 5, borderRadius: 99, background: "#131316" }} /></span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: -0.3 }}>safwah</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{c.type}</span>
      </div>
      <div style={{ width: 38, height: 27, borderRadius: 6, marginTop: 26, background: "linear-gradient(135deg, #d9c56a, #b89b3e)" }} />
      <div className="mono" style={{ fontSize: 18, letterSpacing: 3, marginTop: 16 }}>•••• •••• •••• {c.last4}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Card holder</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.holder}</div>
        </div>
        <span style={{ fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>VISA</span>
      </div>
    </div>
  );
}

export default function Cards() {
  const [cards, setCards] = useState<Card[]>(SEED);

  const issue = () => {
    const last4 = String(Math.floor(1000 + (cards.length * 1471) % 9000));
    setCards((c) => [...c, { holder: "New team card", last4, type: "Virtual", limit: 5000, spent: 0, frozen: false }]);
    toast.success("Virtual card issued", { description: "Ready to spend your AED balance instantly." });
  };
  const toggleFreeze = (last4: string) => {
    setCards((c) => c.map((x) => x.last4 === last4 ? { ...x, frozen: !x.frozen } : x));
    toast.success("Card updated");
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-dim)" }}>Spend</span>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 6 }}>Corporate cards</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 4 }}>Issue cards for every team, spend your AED balance anywhere Visa is accepted, and set limits per card.</p>
        </div>
        <button onClick={issue} className="btn-lime" style={{ height: 46, padding: "0 20px", fontSize: 14 }}>+ Issue card</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18, marginTop: 24 }}>
        {cards.map((c) => (
          <div key={c.last4} className="card" style={{ padding: 16 }}>
            <CardFace c={c} />
            <div style={{ padding: "14px 6px 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-dim)" }}>
                <span>Monthly spend</span>
                <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>AED {fmt(c.spent, 0)} / {fmt(c.limit, 0)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "var(--sunken)", overflow: "hidden", marginTop: 8 }}>
                <div style={{ height: "100%", width: `${Math.min(100, (c.spent / c.limit) * 100)}%`, background: "var(--text)" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => toggleFreeze(c.last4)} className="btn-ghost" style={{ flex: 1, height: 38, fontSize: 12.5 }}>{c.frozen ? "Unfreeze" : "Freeze"}</button>
                <button onClick={() => toast("Limit controls open")} className="btn-ghost" style={{ flex: 1, height: 38, fontSize: 12.5 }}>Set limit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Recent card spend</h3>
      <div className="card" style={{ padding: 8 }}>
        {TXNS.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < TXNS.length - 1 ? "1px solid var(--hairline)" : "none" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{t.m[0]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.m}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{t.cat} · card ••{t.card} · {t.ago}</div>
            </div>
            <span className="mono" style={{ fontWeight: 700, fontSize: 14.5 }}>− AED {fmt(t.aed, 0)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
