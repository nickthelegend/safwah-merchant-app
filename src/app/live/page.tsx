"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fmt } from "@/lib/data";
import { txUrl, ADDR } from "@/lib/chain";
import { registerMerchant } from "@/lib/onchain";
import { useOnchain } from "@/components/OnchainProvider";

const short = (x: string) => `${x.slice(0, 6)}…${x.slice(-4)}`;

export default function Live() {
  const { addr, state: st, connecting, connect, refresh } = useOnchain();
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("Gold Souk Jewellery");
  const [license, setLicense] = useState("DXB-2291-A");
  const [iban, setIban] = useState("AE07 0331 2345 6789 0123 456");

  const onConnect = async () => {
    try { await connect(); toast.success("Wallet connected · Amoy"); }
    catch (e) { toast.error((e as Error).message); }
  };

  const register = async () => {
    if (!addr) return toast.error("Connect your wallet first");
    try {
      setBusy("register");
      const hash = await registerMerchant(name, license, iban);
      toast.success("Merchant registered on-chain", { action: { label: "View ↗", onClick: () => window.open(txUrl(hash), "_blank") } });
      await refresh();
    } catch (e) {
      const m = (e as Error).message || "Registration failed";
      toast.error(m.length > 90 ? m.slice(0, 90) + "…" : m);
    } finally { setBusy(null); }
  };

  const copyAddr = () => { if (addr) { navigator.clipboard?.writeText(addr); toast.success("Address copied"); } };
  const input = { height: 46, padding: "0 14px", borderRadius: 12, background: "var(--sunken)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 } as const;

  return (
    <main style={{ maxWidth: 920, padding: "34px 44px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--emerald)", background: "var(--emerald-wash)", padding: "5px 11px", borderRadius: 99 }}>● Live · Polygon Amoy</span>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, marginTop: 14 }}>On-chain merchant</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 4, maxWidth: 520 }}>
            Register on the live MerchantRegistry, then share your address with a customer. Their AED payment settles to you on-chain — watch the balance update here.
          </p>
        </div>
        {addr ? (
          <span className="mono" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 99, background: "var(--card)", border: "1px solid var(--border-strong)" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--emerald)" }} /> {short(addr)}
          </span>
        ) : (
          <button onClick={onConnect} disabled={connecting} className="btn-lime" style={{ height: 46, padding: "0 20px", fontSize: 14 }}>{connecting ? "Connecting…" : "Connect Wallet"}</button>
        )}
      </div>

      <a href="https://faucet.polygon.technology" target="_blank" rel="noopener noreferrer" className="card" style={{ display: "block", padding: "12px 16px", marginTop: 20, fontSize: 12.5, color: "var(--text-dim)" }}>
        Registering needs a little test <b style={{ color: "var(--text)", fontWeight: 600 }}>POL</b> for gas — get it free from the Amoy faucet ↗
      </a>

      <div style={{ display: "flex", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 150 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Status</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8, color: st?.active ? "var(--emerald)" : "var(--text)" }}>
            {!st ? "—" : st.active ? "Active" : st.registered ? "Registered" : "Not registered"}
          </div>
          <div style={{ color: "var(--text-mute)", fontSize: 11, marginTop: 3 }}>{st?.verified ? "Verified" : st?.registered ? "Pending verification" : "Register below"}</div>
        </div>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 150 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Settled balance</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{fmt(st?.aed ?? 0)}</div>
          <div style={{ color: "var(--text-mute)", fontSize: 11, marginTop: 2 }}>AED</div>
        </div>
        <div className="card" style={{ padding: 18, flex: 1, minWidth: 150 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>VAT recorded</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{fmt(st?.vat ?? 0)}</div>
          <div style={{ color: "var(--text-mute)", fontSize: 11, marginTop: 2 }}>AED</div>
        </div>
      </div>

      {addr && (
        <div className="card" style={{ padding: 18, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 500 }}>Your merchant address — give this to a customer to pay</div>
            <div className="mono" style={{ fontSize: 13, marginTop: 4 }}>{addr}</div>
          </div>
          <button onClick={copyAddr} className="btn-ghost" style={{ height: 40, padding: "0 16px", fontSize: 13 }}>Copy</button>
        </div>
      )}

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Register your business</h3>
        <p style={{ color: "var(--text-mute)", fontSize: 12.5, marginTop: 4, marginBottom: 16 }}>Writes to MerchantRegistry. Your IBAN is hashed (keccak256) before it goes on-chain — the plaintext never leaves your device.</p>
        <div style={{ display: "grid", gap: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" style={input} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Trade license" style={{ ...input, flex: 1, minWidth: 160 }} />
            <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" className="mono" style={{ ...input, flex: 1.4, minWidth: 200 }} />
          </div>
          <button onClick={register} disabled={!!busy || !addr} className="btn-lime" style={{ height: 48, fontSize: 14.5, marginTop: 4 }}>
            {busy === "register" ? "Registering…" : st?.registered ? "Update registration" : "Register on-chain"}
          </button>
        </div>
      </div>

      <p style={{ color: "var(--text-mute)", fontSize: 11.5, marginTop: 20, fontFamily: "var(--font-mono)" }}>
        Contracts · Registry {short(ADDR.MerchantRegistry)} · Payment {short(ADDR.SafwahPayment)} · VAT {short(ADDR.VATTracker)}
      </p>
    </main>
  );
}
