"use client";

import { fmt } from "@/lib/api";
import { useData } from "@/components/DataProvider";
import { LineChart, Doughnut } from "@/lib/charts";

const TOKEN_COLOR: Record<string, string> = { USDT: "#26a17b", ETH: "#7CC96A", AED: "#15300C" };
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const sameDay = (ts: number, d: Date) => {
  const x = new Date(ts);
  return x.getDate() === d.getDate() && x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
};

export default function AnalyticsPage() {
  const { stats, sales, loading } = useData();

  const total = stats.totalSpentAED;
  const avg = stats.txCount ? total / stats.txCount : 0;

  // real payment mix from the API aggregate
  const mix = Object.entries(stats.byToken)
    .map(([label, value]) => ({ label, value, color: TOKEN_COLOR[label] ?? "#7CC96A" }))
    .sort((a, b) => b.value - a.value);

  // real daily revenue trend from settled sales
  const trend = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const y = Math.round(sales.filter((t) => sameDay(t.ts, d)).reduce((s, t) => s + t.amountAED, 0));
    return { x: DOW[d.getDay()], y };
  });

  const tiles: [string, string][] = [
    ["Total revenue", `AED ${fmt(total, 0)}`],
    ["Avg ticket", `AED ${fmt(avg, 0)}`],
    ["Sales", `${stats.txCount}`],
    ["VAT collected", `AED ${fmt(stats.totalVatAED, 0)}`],
  ];

  return (
    <main style={{ padding: "34px 44px 80px", maxWidth: 1120 }}>
      <span className="eyebrow" style={{ display: "block" }}>Analytics</span>
      <h1 className="display" style={{ fontSize: 34, marginTop: 6, marginBottom: 22 }}>How the business is doing</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {tiles.map(([l, v]) => (
          <div key={l} className="pop-card" style={{ padding: 18, boxShadow: "3px 4px 0 0 var(--lime)" }}>
            <div className="eyebrow">{l}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: -0.5 }}>{loading ? "—" : v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="pop-card" style={{ padding: 24 }}>
          <span className="eyebrow">Revenue trend</span>
          <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "6px 0 14px" }}>AED settled · last 7 days</p>
          <LineChart data={trend} />
        </div>
        <div className="pop-card" style={{ padding: 24 }}>
          <span className="eyebrow">Payment mix</span>
          <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "6px 0 14px" }}>Share of revenue by token</p>
          {mix.length ? (
            <Doughnut data={mix} centerValue={`AED ${fmt(total, 0)}`} centerLabel="received" />
          ) : (
            <p style={{ color: "var(--text-mute)", fontSize: 13, padding: "30px 0" }}>No revenue yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
