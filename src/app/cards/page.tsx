"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fmt, getCards, type Card } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CardFace({ c }: { c: Card }) {
  return (
    <div style={{ position: "relative", borderRadius: 20, padding: 22, minHeight: 200, color: "#fff", overflow: "hidden", background: "linear-gradient(140deg, #1C4A12 0%, #15300C 55%, #050506 100%)", boxShadow: "0 20px 44px -20px rgba(21,48,12,0.5)", opacity: c.frozen ? 0.55 : 1 }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: 999, background: "radial-gradient(circle, rgba(202,255,184,0.14), transparent 70%)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--accent-lime)", display: "grid", placeItems: "center" }}><span style={{ width: 5, height: 5, borderRadius: 99, background: "#15300C" }} /></span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>safwah</span>
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
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getCards().then((c) => { setCards(c); setLoading(false); }); }, []);

  // POST a new card to the API, then reflect it locally.
  const issueCard = async () => {
    try {
      const res = await fetch(`${API}/cards`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ holder: "New team card", type: "Virtual", limit: 5000 }),
      });
      const card: Card = await res.json();
      setCards((c) => [...c, card]);
      toast.success("Virtual card issued", { description: "Ready to spend your AED balance instantly." });
    } catch { toast.error("Could not issue card"); }
  };
  const toggleFreeze = (last4: string) => {
    setCards((c) => c.map((x) => (x.last4 === last4 ? { ...x, frozen: !x.frozen } : x)));
    toast.success("Card updated");
  };

  return (
    <main style={{ maxWidth: 1040, padding: "34px 44px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow" style={{ display: "block" }}>Spend</span>
          <h1 className="display" style={{ fontSize: 34, marginTop: 6 }}>Corporate cards</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>Issue cards for every team, spend your AED balance anywhere Visa is accepted, set limits per card.</p>
        </div>
        <button onClick={issueCard} className="btn-lime" style={{ height: 46, padding: "0 20px", fontSize: 14 }}>+ Issue card</button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-mute)", marginTop: 30 }}>Loading cards…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18, marginTop: 24 }}>
          {cards.map((c) => (
            <div key={c.last4} className="pop-card" style={{ padding: 16, boxShadow: "3px 4px 0 0 var(--lime)" }}>
              <CardFace c={c} />
              <div style={{ padding: "14px 6px 4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-dim)" }}>
                  <span>Monthly spend</span>
                  <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>AED {fmt(c.spent, 0)} / {fmt(c.limit, 0)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "var(--sunken)", overflow: "hidden", marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (c.spent / c.limit) * 100)}%`, background: "var(--lime)" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => toggleFreeze(c.last4)} className="btn-ghost" style={{ flex: 1, height: 38, fontSize: 12.5 }}>{c.frozen ? "Unfreeze" : "Freeze"}</button>
                  <button onClick={() => toast("Limit controls open")} className="btn-ghost" style={{ flex: 1, height: 38, fontSize: 12.5 }}>Set limit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
