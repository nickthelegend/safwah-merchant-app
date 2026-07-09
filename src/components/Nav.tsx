"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useOnchain } from "@/components/OnchainProvider";
import { fmt } from "@/lib/data";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payouts", label: "Payouts" },
  { href: "/cards", label: "Cards" },
  { href: "/treasury", label: "Treasury" },
  { href: "/analytics", label: "Analytics" },
  { href: "/live", label: "Live" },
];

export function Nav() {
  const path = usePathname();
  const { addr, state, connecting, connect, disconnect } = useOnchain();

  const onConnect = async () => {
    try { await connect(); toast.success("Wallet connected · Polygon Amoy"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.8)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#fff" }} />
          </span>
          <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: -0.4 }}>safwah</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", background: "var(--card-soft)", padding: "3px 9px", borderRadius: 99 }}>merchant</span>
        </Link>
        <nav style={{ display: "flex", gap: 2, marginLeft: 18 }}>
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 600, padding: "8px 15px", borderRadius: 99, color: active ? "var(--text)" : "var(--text-dim)", background: active ? "var(--card-soft)" : "transparent" }}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 99, background: "var(--card)", border: "1px solid var(--border)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--emerald)" }} /> Polygon Amoy
          </span>
          {addr ? (
            <>
              {state && (
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, padding: "9px 13px", borderRadius: 99, background: "var(--card-soft)" }}>
                  AED {fmt(state.aed)}
                </span>
              )}
              <button onClick={disconnect} className="mono" title="Disconnect" style={{ fontSize: 12.5, color: "var(--text)", display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 99, background: "var(--card)", border: "1px solid var(--border-strong)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--emerald)" }} /> {short(addr)}
              </button>
            </>
          ) : (
            <button onClick={onConnect} disabled={connecting} className="btn-lime" style={{ padding: "10px 18px", fontSize: 13.5 }}>{connecting ? "Connecting…" : "Connect Wallet"}</button>
          )}
        </div>
      </div>
    </header>
  );
}
