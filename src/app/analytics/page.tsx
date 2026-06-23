"use client";

import { fmt, WEEK, SALES, TOKEN_MIX } from "@/lib/data";
import { LineChart, BarChart, Doughnut } from "@/lib/charts";

export default function AnalyticsPage() {
  const total = SALES.reduce((s, x) => s + x.aed, 0);
  const vat = +(total * 0.05).toFixed(0);
  const avg = total / SALES.length;
  const bars = WEEK.map((d, i) => ({ label: d.x, value: d.y, color: i === WEEK.length - 1 ? "#CCFF00" : "#10b981" }));

  const tiles = [
    ["Total revenue", `AED ${fmt(total, 0)}`],
    ["Avg ticket", `AED ${fmt(avg, 0)}`],
    ["Sales", `${SALES.length}`],
    ["VAT collected", `AED ${vat}`],
  ];

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 18 }}>Analytics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {tiles.map(([l, v]) => (
          <div key={l} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{l}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Revenue trend</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>AED settled · last 7 days</p>
          <LineChart data={WEEK} />
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Daily revenue</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>Per weekday</p>
          <BarChart data={bars} />
        </div>
        <div className="card" style={{ padding: 22, gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Payment mix</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>Share of revenue by token paid</p>
          <Doughnut data={TOKEN_MIX} centerValue={`AED ${fmt(total, 0)}`} centerLabel="received" />
        </div>
      </div>
    </main>
  );
}
