"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fmt } from "@/lib/data";
import { useOnchain } from "@/components/OnchainProvider";

type Status = "paid" | "pending" | "overdue";
type Invoice = { id: string; client: string; memo: string; aed: number; status: Status; ago: string };

const SEED: Invoice[] = [
  { id: "INV-0231", client: "Al Habtoor Group", memo: "Catering — corporate event", aed: 12500, status: "pending", ago: "2d" },
  { id: "INV-0230", client: "Emaar Hospitality", memo: "Monthly retainer", aed: 8400, status: "paid", ago: "5d" },
  { id: "INV-0229", client: "Noon.com", memo: "Bulk order #4471", aed: 3260, status: "overdue", ago: "12d" },
  { id: "INV-0228", client: "Careem", memo: "Partnership fee", aed: 5000, status: "paid", ago: "18d" },
];

const STATUS: Record<Status, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "var(--emerald)", bg: "var(--emerald-wash)" },
  pending: { label: "Pending", color: "#b78103", bg: "rgba(183,129,3,0.10)" },
  overdue: { label: "Overdue", color: "var(--danger)", bg: "rgba(229,72,77,0.10)" },
};

export default function Invoices() {
  const [list, setList] = useState<Invoice[]>(SEED);
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [memo, setMemo] = useState("");
  const [amt, setAmt] = useState("");
  const [n, setN] = useState(232);
  const { addr } = useOnchain();
  const TOURIST_URL = process.env.NEXT_PUBLIC_TOURIST_URL || "http://localhost:3001";
  const payLink = (aed: number) => (addr ? `${TOURIST_URL}/live?to=${addr}&amt=${aed}` : `${TOURIST_URL}/live?amt=${aed}`);

  const totals = useMemo(() => ({
    outstanding: list.filter((i) => i.status !== "paid").reduce((s, i) => s + i.aed, 0),
    paid: list.filter((i) => i.status === "paid").reduce((s, i) => s + i.aed, 0),
    overdue: list.filter((i) => i.status === "overdue").reduce((s, i) => s + i.aed, 0),
  }), [list]);

  const create = () => {
    if (!client.trim() || !(+amt > 0)) return toast.error("Add a client and an amount");
    const id = `INV-0${n}`;
    setList((l) => [{ id, client: client.trim(), memo: memo.trim() || "Payment request", aed: +amt, status: "pending", ago: "now" }, ...l]);
    setN((x) => x + 1);
    navigator.clipboard?.writeText(payLink(+amt));
    toast.success("Invoice created — pay link copied", { description: addr ? "Real on-chain link. Client pays crypto → AED settles to you." : "Connect your wallet so the link routes payment to your address." });
    setClient(""); setMemo(""); setAmt(""); setOpen(false);
  };

  const markPaid = (id: string) => { setList((l) => l.map((i) => i.id === id ? { ...i, status: "paid" } : i)); toast.success(`${id} marked paid`); };
  const copyLink = (inv: Invoice) => { navigator.clipboard?.writeText(payLink(inv.aed)); toast.success(addr ? "On-chain pay link copied" : "Pay link copied — connect wallet for on-chain routing"); };

  const input = { height: 46, padding: "0 14px", borderRadius: 12, background: "var(--sunken)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, width: "100%" } as const;

  return (
    <main style={{ maxWidth: 1000, padding: "34px 44px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow" style={{ display: "block" }}>Collect</span>
          <h1 className="display" style={{ fontSize: 32, marginTop: 6 }}>Invoices</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>Send a request, your client pays in crypto, and AED settles to you — instantly.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-lime" style={{ height: 46, padding: "0 20px", fontSize: 14 }}>{open ? "Close" : "+ New invoice"}</button>
      </div>

      {/* summary */}
      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        {([["Outstanding", totals.outstanding, "var(--text)"], ["Paid this month", totals.paid, "var(--emerald)"], ["Overdue", totals.overdue, "var(--danger)"]] as const).map(([l, v, c]) => (
          <div key={l} className="pop-card" style={{ padding: 18, flex: 1, minWidth: 160 }}>
            <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>{l}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: c }}>AED {fmt(v, 0)}</div>
          </div>
        ))}
      </div>

      {/* create */}
      {open && (
        <div className="pop-card" style={{ padding: 22, marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>New invoice</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" style={{ ...input, flex: 1, minWidth: 200 }} />
              <input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" placeholder="Amount (AED)" className="mono" style={{ ...input, width: 160, flex: "0 0 auto" }} />
            </div>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What's it for?" style={input} />
            <button onClick={create} className="btn-lime" style={{ height: 46, fontSize: 14, marginTop: 2 }}>Create &amp; copy pay link</button>
          </div>
        </div>
      )}

      {/* list */}
      <div className="pop-card" style={{ padding: 8, marginTop: 16 }}>
        {list.map((i, idx) => {
          const s = STATUS[i.status];
          return (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", borderBottom: idx < list.length - 1 ? "1px solid var(--hairline)" : "none", flexWrap: "wrap" }}>
              <div style={{ minWidth: 130 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{i.client}</div>
                <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{i.memo}</div>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--text-dim)", marginLeft: "auto" }}>{i.id} · {i.ago}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: s.color, background: s.bg, padding: "5px 11px", borderRadius: 99 }}>{s.label}</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: "right" }}>AED {fmt(i.aed, 0)}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => copyLink(i)} className="btn-ghost" style={{ height: 34, padding: "0 12px", fontSize: 12 }}>Link</button>
                {i.status !== "paid" && <button onClick={() => markPaid(i.id)} className="btn-lime" style={{ height: 34, padding: "0 12px", fontSize: 12 }}>Mark paid</button>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
