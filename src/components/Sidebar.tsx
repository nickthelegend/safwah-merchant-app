"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useOnchain } from "@/components/OnchainProvider";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const I = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5",
  charge: "M4 7h16v10H4zM4 11h16M8 15h3",
  payouts: "M7 8h10M7 8l3-3M7 8l3 3M17 16H7M17 16l-3-3M17 16l-3 3",
  cards: "M3 6h18v12H3zM3 10h18M7 15h4",
  treasury: "M3 10 12 4l9 6M5 10v8h14v-8M9 18v-5M15 18v-5",
  analytics: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  live: "M3 12h4l2 6 4-14 2 8h6",
};
function Ic({ d }: { d: string }) {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

const MAIN = [
  { href: "/", label: "Home", icon: I.home },
  { href: "/charge", label: "Charge", icon: I.charge },
  { href: "/payouts", label: "Payouts", icon: I.payouts },
  { href: "/cards", label: "Cards", icon: I.cards },
  { href: "/treasury", label: "Treasury", icon: I.treasury },
  { href: "/analytics", label: "Analytics", icon: I.analytics },
  { href: "/live", label: "Live", icon: I.live },
];

export function Sidebar() {
  const path = usePathname();
  const { addr, connect, disconnect, connecting } = useOnchain();

  const onWallet = async () => {
    if (addr) { disconnect(); return; }
    try { await connect(); toast.success("Wallet connected · Polygon Amoy"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <aside className="sidebar">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 10px 20px" }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--lime)", display: "grid", placeItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--accent-lime)" }} />
        </span>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>safwah</span>
        <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "var(--emerald)", background: "var(--emerald-wash)", padding: "3px 6px", borderRadius: 6 }}>MERCHANT</span>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {MAIN.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-item${path === l.href ? " active" : ""}`}>
            <Ic d={l.icon} /> {l.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="pill mono" style={{ justifyContent: "center", fontSize: 12, padding: "8px 12px" }}>
          ● Polygon Amoy
        </div>
        <button onClick={onWallet} className="pop-card pop-flat" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", textAlign: "left", boxShadow: "3px 4px 0 0 var(--lime)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 12, background: "linear-gradient(135deg, var(--emerald), var(--hero))", flexShrink: 0 }} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: 13.5 }}>{connecting ? "Connecting…" : addr ? "Spice Route Café" : "Connect Wallet"}</span>
            <span className="mono" style={{ display: "block", fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }}>{addr ? short(addr) : "Merchant console"}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
