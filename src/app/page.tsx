"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import WalletConnect from "../components/WalletConnect";
import { uploadToWalrus } from "../lib/walrus";
import { CONTRACTS } from "../lib/contracts";
import { QRCodeSVG } from "qrcode.react";
import { TouristQRScanner } from "../components/TouristQRScanner";

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
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Query owned MerchantLicense object
  const { data: ownedLicenses, refetch: refetchLicenses } = useSuiClientQuery('getOwnedObjects', {
    owner: walletAddress,
    filter: {
      StructType: `${CONTRACTS.PACKAGE_ID}::merchant::MerchantLicense`,
    },
    options: {
      showContent: true,
    }
  }, { enabled: walletConnected });

  const hasLicense = ownedLicenses && ownedLicenses.data.length > 0;
  const licenseObject = hasLicense ? ownedLicenses.data[0].data : null;
  const licenseFields = (licenseObject?.content as any)?.fields;
  const merchantLicenseObjectId = licenseObject?.objectId || "";

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
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleTouristScanned = ({ touristAddress }: { touristAddress: string }) => {
    setCustomerAddress(touristAddress);
  };

  // Registration Form States
  const [registerBusinessName, setRegisterBusinessName] = useState("");
  const [registerTradeLicenseNo, setRegisterTradeLicenseNo] = useState("");
  const [registerVatRegNo, setRegisterVatRegNo] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleRegisterMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your merchant wallet first!");
      return;
    }
    setIsRegistering(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::merchant::register_merchant`,
        arguments: [
          tx.object(CONTRACTS.MERCHANT_REGISTRY_ID),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(registerBusinessName))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(registerTradeLicenseNo))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(registerVatRegNo))),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      alert(`Store successfully registered on Sui!\nTransaction hash: ${result.digest}`);
      refetchLicenses();
      setActiveCategory("overview");
    } catch (err: any) {
      alert(`Registration failed: ${err.message || err}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your merchant wallet first!");
      return;
    }
    if (!hasLicense) {
      alert("Please register your store trade license first in the 'License' tab!");
      return;
    }
    if (!customerAddress || !invoiceAmount) return;

    setIsIssuing(true);
    try {
      const calculatedVat = (parseFloat(invoiceAmount.replace(/,/g, '')) * 0.05).toFixed(2);
      const vatAmountBaseUnits = Math.floor(parseFloat(calculatedVat) * 1_000_000); // base units

      // Create invoice JSON representation
      const invoiceData = JSON.stringify({
        invoiceId: `INV-${Date.now()}`,
        businessName: licenseFields?.business_name || "Dubai Mall Store",
        customerAddress: customerAddress,
        amountAED: invoiceAmount,
        vatAED: calculatedVat,
        timestamp: Date.now()
      });
      const blob = new Blob([invoiceData], { type: "application/json" });

      // 1. Upload invoice to Walrus
      const walrusResult = await uploadToWalrus(blob);

      // 2. Mint Invoice NFT on Sui
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::issue_invoice_nft`,
        arguments: [
          tx.object(merchantLicenseObjectId),
          tx.pure.address(customerAddress),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(`INV-${Math.floor(1000 + Math.random() * 9000)}`))),
          tx.pure.u64(Math.floor(parseFloat(invoiceAmount) * 100)), // AED cents
          tx.pure.u64(vatAmountBaseUnits),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobId))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobUrl))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobUrl))),
        ],
      });

      const result = await signAndExecute({ transaction: tx });

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
      setMerchantUsdc(prev => (parseFloat(prev) + (vatUSDC * 0.1)).toFixed(2)); // 10% platform share

      setGeneratedInvoice(newInvoice);
      alert(`Invoice NFT successfully minted and sent to tourist wallet!\nTransaction Hash: ${result.digest}\nWalrus Blob: ${walrusResult.blobId.slice(0, 8)}...`);
      refetchLicenses();
      setActiveCategory("sales");
    } catch (err: any) {
      alert(`Invoice failed: ${err.message || err}`);
    } finally {
      setIsIssuing(false);
    }
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
                <h2>{hasLicense ? licenseFields?.business_name : "Dubai Mall Luxury Boutique"}</h2>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ margin: 0 }}>Tourist Sui Address</label>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    style={{
                      background: "rgba(212, 175, 55, 0.2)",
                      color: "var(--color-cyber-gold)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                  >
                    📷 Scan QR
                  </button>
                </div>
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
                <h2>{hasLicense ? "Trade License Details" : "Register Store License"}</h2>
              </div>
            </div>
            
            {!walletConnected ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ color: "var(--color-sage)", marginBottom: "16px" }}>Please connect your merchant wallet first to view or register a license.</p>
                <div style={{ display: "flex", justifyContent: "center" }}><WalletConnect /></div>
              </div>
            ) : hasLicense ? (
              <>
                <p className="hero-card-desc">
                  Your store is registered with the UAE Federal Tax Authority (FTA).
                </p>
                <div className="bento-grid" style={{ gap: "10px", gridTemplateColumns: "1fr" }}>
                  <div className="bento-metric-card">
                    <span className="bento-metric-label">STORE NAME</span>
                    <span className="bento-value" style={{ fontSize: "16px" }}>{licenseFields?.business_name}</span>
                  </div>
                  <div className="bento-metric-card">
                    <span className="bento-metric-label">TRADE LICENSE NO</span>
                    <span className="bento-value" style={{ fontSize: "16px" }}>{licenseFields?.trade_license_no}</span>
                  </div>
                  <div className="bento-metric-card">
                    <span className="bento-metric-label">VAT REGISTRATION NO (TRN)</span>
                    <span className="bento-value" style={{ fontSize: "16px" }}>{licenseFields?.vat_registration_no}</span>
                  </div>
                  <div className="bento-metric-card">
                    <span className="bento-metric-label">STATUS</span>
                    <span className="bento-value" style={{ color: licenseFields?.is_fta_verified ? "#10B981" : "#F59E0B" }}>
                      {licenseFields?.is_fta_verified ? "✓ FTA VERIFIED PARTNER" : "PENDING VERIFICATION"}
                    </span>
                  </div>
                </div>
                <div className="hero-alert-box" style={{ marginTop: "12px" }}>
                  <div className="hero-alert-text">
                    📝 Direct settlement is routed to: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}.
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="hero-card-desc">
                  Register your business trade license on Sui to enable instant tax-free invoicing.
                </p>
                <form onSubmit={handleRegisterMerchant} style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 10 }}>
                  <div className="form-group">
                    <label>Business / Store Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Dubai Mall Luxury Boutique" 
                      value={registerBusinessName}
                      onChange={(e) => setRegisterBusinessName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Trade License Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. DxB-9921-TAX" 
                      value={registerTradeLicenseNo}
                      onChange={(e) => setRegisterTradeLicenseNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>VAT Registration Number (TRN)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 100234567800003" 
                      value={registerVatRegNo}
                      onChange={(e) => setRegisterVatRegNo(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
                    {isRegistering ? "Registering on Sui..." : "Register Merchant License"}
                  </button>
                </form>
              </>
            )}
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
                {/* Dynamic QR Code */}
                <div style={{ background: "white", padding: "16px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeSVG value={generatedInvoice.id} size={120} />
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>Tourist Wallet Address / QR Code Scan</label>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      style={{
                        background: "rgba(212, 175, 55, 0.2)",
                        color: "var(--color-cyber-gold)",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                        fontSize: "11px",
                        fontWeight: "bold",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      📷 Scan QR
                    </button>
                  </div>
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
      {/* Tourist QR Scanner Modal */}
      <TouristQRScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onTouristScanned={handleTouristScanned}
      />
    </main>
  );
}
