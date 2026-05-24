"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCurrentAccount } from "@mysten/dapp-kit";
import WalletConnect from "../components/WalletConnect";

// Types
type CategoryId = "overview" | "issue" | "sales" | "register";

interface Invoice {
  id: string;
  customerWallet: string;
  amount: string;
  vat: string;
  date: string;
  status: "Issued" | "Claimed" | "Settled (USDC)";
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("overview");
  
  // Real Sui Wallet connection hooks
  const currentAccount = useCurrentAccount();
  const walletConnected = !!currentAccount;
  const walletAddress = currentAccount?.address || "";

  // Merchant state
  const [merchantUsdc, setMerchantUsdc] = useState("459.20");
  const [totalSales, setTotalSales] = useState("89,500.00");
  const [totalVatRefunded, setTotalVatRefunded] = useState("4,475.00");

  // Invoices list state
  const [invoices, setInvoices] = useState<Invoice[]>(
    [
      { id: "INV-9021", customerWallet: "0x8c2a...f9de", amount: "5,499.00 AED", vat: "274.95 AED", date: "2026-05-23", status: "Settled (USDC)" },
      { id: "INV-9022", customerWallet: "0x3a9f...e42c", amount: "12,450.00 AED", vat: "622.50 AED", date: "2026-05-24", status: "Claimed" },
      { id: "INV-9020", customerWallet: "0xf19e...88ab", amount: "1,200.00 AED", vat: "60.00 AED", date: "2026-05-21", status: "Settled (USDC)" }
    ]
  );

  // Form states for generating digital invoice
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);



  const handleIssueInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerAddress || !invoiceAmount) return;

    setIsIssuing(true);
    setTimeout(() => {
      const calculatedVat = (parseFloat(invoiceAmount.replace(/,/g, '')) * 0.05).toFixed(2);
      const newInvoice: Invoice = {
        id: `INV-${Math.floor(9000 + Math.random() * 999)}`,
        customerWallet: customerAddress.slice(0, 6) + "..." + customerAddress.slice(-4),
        amount: `${parseFloat(invoiceAmount).toLocaleString()} AED`,
        vat: `${calculatedVat} AED`,
        date: new Date().toISOString().split('T')[0],
        status: "Issued"
      };

      setInvoices(prev => [newInvoice, ...prev]);
      
      // Update store analytics
      const amountUSDC = (parseFloat(invoiceAmount) / 3.67);
      const vatUSDC = amountUSDC * 0.05;
      setTotalSales(prev => (parseFloat(prev.replace(/,/g, '')) + amountUSDC).toFixed(2));
      setTotalVatRefunded(prev => (parseFloat(prev.replace(/,/g, '')) + vatUSDC).toFixed(2));
      setMerchantUsdc(prev => (parseFloat(prev) + (vatUSDC * 0.1)).toFixed(2)); // 10% platform kickback reward

      setGeneratedInvoice(newInvoice);
      setIsIssuing(false);
      
      // Go to invoice view category
      setActiveCategory("sales");
    }, 1500);
  };

  return (
    <main className="phone-frame">
      {/* Header section with wallet connection */}
      <header className="header">
        <div className="header-left">
          <span className="header-greeting-lbl">SAFWAH MERCHANT HUB</span>
          <h1 className="header-title-name">Store Portal</h1>
        </div>
        
        <div className="header-right">
          <WalletConnect />
        </div>
      </header>

      {/* Category selector */}
      <section className="category-scroll-container" ref={scrollContainerRef}>
        <div className="category-btn-wrapper" id="cat-btn-overview">
          {activeCategory === "overview" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("overview")}>
              <div className="active-circle">📈</div>
              <span className="active-label">Overview</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("overview")}>📈</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-issue">
          {activeCategory === "issue" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("issue")}>
              <div className="active-circle">🖨️</div>
              <span className="active-label">Invoice Tool</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("issue")}>🖨️</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-sales">
          {activeCategory === "sales" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("sales")}>
              <div className="active-circle">🧾</div>
              <span className="active-label">Sales Log</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("sales")}>🧾</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-register">
          {activeCategory === "register" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("register")}>
              <div className="active-circle">🏢</div>
              <span className="active-label">License</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("register")}>🏢</button>
          )}
        </div>
      </section>

      {/* Main card panel - simulates view transition */}
      <section key={activeCategory} className="hero-card fade-transition">
        <div className="decorative-blob" />

        {/* Overview Tab Content */}
        {activeCategory === "overview" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🏢</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">STORE SALES METRICS</span>
                <h2>Dubai Mall Luxury Boutique</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Your store is active! Issue digital invoices directly to tourists to boost sales. You receive a 10% platform share of processed refunds.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card">
                <span className="bento-metric-label">TOTAL TAX SALES</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span className="bento-value" style={{ fontSize: "12px" }}>{parseFloat(totalSales).toLocaleString()} USDC</span>
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">VAT GENERATED</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/></svg>
                  </div>
                  <span className="bento-value" style={{ fontSize: "12px" }}>{parseFloat(totalVatRefunded).toLocaleString()} USDC</span>
                </div>
              </div>
            </div>
            <div className="hero-alert-box">
              <div className="hero-alert-text">
                🌟 Instant direct payout model: Payments settle immediately to your Sui address upon government exit stamp.
              </div>
            </div>
          </>
        )}

        {/* Issue Tab Content */}
        {activeCategory === "issue" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🖨️</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">VAT INVOICING CORE</span>
                <h2>Issue Digital Refund Tag</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Input tourist's wallet address and invoice amount. Safwah calculates the 5% VAT and issues an instant on-chain invoice claimable on their app.
            </p>
            <form onSubmit={handleIssueInvoice} style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 10 }}>
              <div className="form-group">
                <label>Tourist Sui Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 0x8c2a...f9de" 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Invoice Amount (AED)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 5499" 
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
                {isIssuing ? "Generating On-chain Tag..." : "Generate Digital Tax-Free Tag"}
              </button>
            </form>
          </>
        )}

        {/* Sales Tab Content */}
        {activeCategory === "sales" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🧾</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">STORE SALES LOG</span>
                <h2>Refund Sales Logs</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Track past sales that offered tax-free refunds. Direct USDC rewards pay into your partner wallet upon tourist airport customs verification.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card">
                <span className="bento-metric-label">INVOICES ISSUED</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/></svg>
                  </div>
                  <span className="bento-value">{invoices.length} Issued</span>
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">PARTNER REVENUE</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2"/></svg>
                  </div>
                  <span className="bento-value">{merchantUsdc} USDC</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Register Tab Content */}
        {activeCategory === "register" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🛡️</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">GOVERNMENT COMPLIANCE</span>
                <h2>Trade License Status</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Trade license is verified by UAE Federal Tax Authority (FTA). Verified stores can issue on-chain claims instantly.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card" style={{ gridColumn: "span 2" }}>
                <span className="bento-metric-label">LICENSE STATUS</span>
                <div className="bento-content" style={{ justifyContent: "space-between" }}>
                  <span className="bento-value" style={{ color: "#10B981" }}>✓ VERIFIED PARTNER</span>
                  <span style={{ fontSize: "10px", color: "var(--color-sage)" }}>NO: DxB-9921-TAX</span>
                </div>
              </div>
            </div>
            <div className="hero-alert-box">
              <div className="hero-alert-text">
                📝 Direct settlement is routed to: {walletConnected ? walletAddress.slice(0, 8) + "..." + walletAddress.slice(-8) : "Connect wallet to view routing"}.
              </div>
            </div>
          </>
        )}
      </section>

      {/* Secondary Feed items list */}
      <section key={`feed-${activeCategory}`} className="feed-section fade-transition">
        {activeCategory === "sales" && (
          <>
            <div className="feed-header">
              <span className="label-caps">RECENT TAX-FREE INVOICES</span>
            </div>
            {invoices.map((inv) => (
              <div key={inv.id} className="feed-card">
                <div className="feed-card-left">
                  <div className="feed-icon-container">🏷️</div>
                  <div className="feed-text-area">
                    <span className="feed-title">{inv.id} • Customer: {inv.customerWallet}</span>
                    <span className="feed-subtitle">{inv.date} • {inv.amount} (VAT: {inv.vat})</span>
                  </div>
                </div>
                <span className="label-caps" style={{ color: inv.status.startsWith("Settled") ? "#10B981" : "var(--color-cyber-gold)" }}>
                  {inv.status}
                </span>
              </div>
            ))}
          </>
        )}

        {activeCategory === "overview" && (
          <>
            <div className="feed-header">
              <span className="label-caps">STORE PERFORMANCE</span>
            </div>
            <div className="feed-card">
              <div className="feed-card-left">
                <div className="feed-icon-container">📊</div>
                <div className="feed-text-area">
                  <span className="feed-title">Tourist Conversion Rate</span>
                  <span className="feed-subtitle">92% of tourists proceed with refund claims at checkouts</span>
                </div>
              </div>
              <span className="bento-value" style={{ color: "var(--color-emerald-glow)" }}>+15% Sales</span>
            </div>
          </>
        )}
      </section>

      {/* Floating navigation bar */}
      <div className="nav-wrapper">
        <nav className="nav-pill-bar">
          <button className={`nav-item-btn ${activeCategory === "overview" ? "active" : "inactive"}`} onClick={() => setActiveCategory("overview")}>
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </button>

          {/* FAB: Launch Invoicing tool */}
          <div className="fab-container">
            <button className={`fab-btn ${isModalOpen ? "open" : ""}`} onClick={() => setIsModalOpen(true)}>
              <svg viewBox="0 0 24 24" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <button className={`nav-item-btn ${activeCategory === "sales" ? "active" : "inactive"}`} onClick={() => setActiveCategory("sales")}>
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </button>
        </nav>
      </div>



      {/* Invoicing FAB Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)", fontSize: "12px" }}>GENERATE TAX-FREE DIGITAL TAG</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>
            
            {generatedInvoice ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px 0" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#10B981" }}>✓ DIGITAL INVOICE GENERATED SUCCESSFULLY</span>
                {/* Simulated QR Code */}
                <div style={{ background: "white", padding: "16px", borderRadius: "16px", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" style={{ width: "120px", height: "120px", fill: "#000" }}>
                    <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm0 8h2v2H5v-2zm8-10h6v6h-6V3zm2 2v2h2V5h-2zm-10 8h6v6H3v-6zm2 2v2h2v-2H5zm12 2h2v2h-2v-2zm2-4h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 2h2v2h-2v-2zM3 13h2v2H3v-2zm14 4v2h2v-2h-2zm2-2h2v2h-2v-2z"/>
                  </svg>
                </div>
                <div style={{ textAlign: "center", color: "var(--color-sage)" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>Invoice ID: {generatedInvoice.id}</div>
                  <div style={{ fontSize: "12px" }}>Value: {generatedInvoice.amount} (VAT: {generatedInvoice.vat})</div>
                  <div style={{ fontSize: "10px", color: "var(--color-sage)" }}>Recipient: {generatedInvoice.customerWallet}</div>
                </div>
                <button className="btn-secondary" style={{ width: "100%" }} onClick={() => { setGeneratedInvoice(null); setIsModalOpen(false); }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleIssueInvoice} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="form-group">
                  <label>Tourist Wallet Address / QR Code Scan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 0x8c2a71f09b558de0291ba207f6e3c4a20b08f9de" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Gross Value (AED)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 12000" 
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {isIssuing ? "Issuing on Sui..." : "Generate & Settle"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
