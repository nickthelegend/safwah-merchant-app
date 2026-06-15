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
import { toast } from "sonner";

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
  const [merchantUsdc, setMerchantUsdc] = useState("0.00");
  const [totalSales, setTotalSales] = useState("0.00");
  const [totalVatRefunded, setTotalVatRefunded] = useState("0.00");

  const { data: licenseObj } = useSuiClientQuery('getObject', {
    id: merchantLicenseObjectId || '',
    options: { showContent: true },
  }, { enabled: !!merchantLicenseObjectId, refetchInterval: 10000 });

  useEffect(() => {
    if (licenseObj?.data?.content) {
      const fields = (licenseObj.data.content as any).fields ?? {};
      const totalVatCollectedBase = Number(fields.total_vat_collected ?? 0);
      const merchantUsdcVal = (totalVatCollectedBase / 1_000_000).toFixed(2);
      const totalSalesVal = ((totalVatCollectedBase / 1_000_000) * 20).toFixed(2);
      const totalVatRefundedVal = (totalVatCollectedBase / 1_000_000).toFixed(2);
      setMerchantUsdc(merchantUsdcVal);
      setTotalSales(totalSalesVal);
      setTotalVatRefunded(totalVatRefundedVal);
    }
  }, [licenseObj]);

  // Invoices list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load invoices from MongoDB on mount
  useEffect(() => {
    if (!walletAddress) return;
    const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
    fetch(`${backendUrl}/api/invoices/merchant/${walletAddress}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            id: item.invoiceNumber,
            customerWallet: item.customerAddress.length > 15 ? (item.customerAddress.slice(0, 6) + "..." + item.customerAddress.slice(-4)) : item.customerAddress,
            amount: `${parseFloat(item.amountAED).toLocaleString()} AED`,
            vat: `${parseFloat(item.vatAED).toLocaleString()} AED`,
            date: new Date(item.timestamp).toISOString().split('T')[0],
            status: item.status
          }));
          setInvoices(mapped);
        }
      })
      .catch(err => console.warn("Failed to load invoices from MongoDB", err));
  }, [walletAddress]);


  // Form states for generating digital invoice
  const [paymentMode, setPaymentMode] = useState<"physical" | "digital">("physical");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<(Invoice & { qrValue?: string }) | null>(null);
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
      toast.error("Please connect your merchant wallet first!");
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
      toast.success(`Store successfully registered on Sui!\nTransaction hash: ${result.digest}`);
      refetchLicenses();
      setActiveCategory("overview");
    } catch (err: any) {
      toast.error(`Registration failed: ${err.message || err}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      toast.error("Please connect your merchant wallet first!");
      return;
    }
    if (!hasLicense) {
      toast.error("Please register your store trade license first in the 'License' tab!");
      return;
    }
    if (!invoiceAmount) return;
    if (paymentMode === 'physical' && !customerAddress) {
      toast.error("Please specify the tourist wallet address.");
      return;
    }

    setIsIssuing(true);
    try {
      const calculatedVat = (parseFloat(invoiceAmount.replace(/,/g, '')) * 0.05).toFixed(2);
      const vatAmountBaseUnits = Math.floor(parseFloat(calculatedVat) * 1_000_000); // base units
      const totalInvoicesIssued = Number(licenseFields?.total_invoices_issued ?? 0);
      const invoiceNumber = `INV-${totalInvoicesIssued + 1}-${Date.now().toString().slice(-4)}`;

      // Create invoice JSON representation
      const invoiceData = JSON.stringify({
        invoiceId: invoiceNumber,
        businessName: licenseFields?.business_name || "Dubai Mall Store",
        customerAddress: paymentMode === 'physical' ? customerAddress : "Digital SUI Pay",
        amountAED: invoiceAmount,
        vatAED: calculatedVat,
        timestamp: Date.now()
      });
      const blob = new Blob([invoiceData], { type: "application/json" });

      // 1. Upload invoice to Walrus
      const walrusResult = await uploadToWalrus(blob);

      if (paymentMode === 'physical') {
        // 2. Mint Invoice NFT on Sui
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACTS.PACKAGE_ID}::safwah::issue_invoice_nft`,
          arguments: [
            tx.object(merchantLicenseObjectId),
            tx.pure.address(customerAddress),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(invoiceNumber))),
            tx.pure.u64(Math.floor(parseFloat(invoiceAmount) * 100)), // AED cents
            tx.pure.u64(vatAmountBaseUnits),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobId))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobUrl))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusResult.blobUrl))),
          ],
        });

        const result = await signAndExecute({ transaction: tx });

        const newInvoice: Invoice = {
          id: invoiceNumber,
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

        // Save to MongoDB
        const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
        fetch(`${backendUrl}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber,
            merchantAddress: walletAddress,
            customerAddress: customerAddress,
            businessName: licenseFields?.business_name || "Dubai Mall Store",
            amountAED: invoiceAmount,
            vatAED: calculatedVat,
            status: "Issued",
            walrusBlobId: walrusResult.blobId,
            walrusUrl: walrusResult.blobUrl
          })
        }).catch(err => console.error("Failed to save invoice to MongoDB", err));

        setGeneratedInvoice(newInvoice);
        toast.success(`Invoice NFT successfully minted and sent to tourist wallet!\nTransaction Hash: ${result.digest}\nWalrus Blob: ${walrusResult.blobId.slice(0, 8)}...`);
      } else {
        // Digital SUI Pay mode (No on-chain TX from merchant; generate bill payload for tourist QR scanner)
        const billPayload = JSON.stringify({
          type: "safwah_bill_v1",
          merchantAddress: walletAddress,
          merchantLicenseId: merchantLicenseObjectId,
          businessName: licenseFields?.business_name || "Dubai Mall Store",
          amountAED: invoiceAmount,
          vatAED: calculatedVat,
          invoiceNumber: invoiceNumber,
          walrusBlobId: walrusResult.blobId,
          walrusUrl: walrusResult.blobUrl,
        });

        const newInvoice = {
          id: invoiceNumber,
          customerWallet: "Digital SUI Pay",
          amount: `${parseFloat(invoiceAmount).toLocaleString()} AED`,
          vat: `${calculatedVat} AED`,
          date: new Date().toISOString().split('T')[0],
          status: "Issued" as const,
          qrValue: billPayload
        };

        setInvoices(prev => [newInvoice, ...prev]);

        // Save to MongoDB
        const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
        fetch(`${backendUrl}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber,
            merchantAddress: walletAddress,
            customerAddress: "Digital SUI Pay",
            businessName: licenseFields?.business_name || "Dubai Mall Store",
            amountAED: invoiceAmount,
            vatAED: calculatedVat,
            status: "Issued",
            walrusBlobId: walrusResult.blobId,
            walrusUrl: walrusResult.blobUrl
          })
        }).catch(err => console.error("Failed to save invoice to MongoDB", err));

        // Update store analytics locally
        const amountUSDC = (parseFloat(invoiceAmount) / 3.67);
        const vatUSDC = amountUSDC * 0.05;
        setTotalSales(prev => (parseFloat(prev.replace(/,/g, '')) + amountUSDC).toFixed(2));
        setTotalVatRefunded(prev => (parseFloat(prev.replace(/,/g, '')) + vatUSDC).toFixed(2));

        setGeneratedInvoice(newInvoice);
        toast.success(`Digital Bill QR Code generated!\nShow this QR to the tourist to make the atomic payment on Sui.\nWalrus Blob: ${walrusResult.blobId.slice(0, 8)}...`);
      }
      refetchLicenses();
      setActiveCategory("sales");
    } catch (err: any) {
      toast.error(`Invoice failed: ${err.message || err}`);
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
              Choose payment checkout method: Physical cash/card (mint directly to tourist) or Digital SUI Pay (atomic QR settlement).
            </p>

            {/* Payment Mode Selector Toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', padding: '4px', borderRadius: '14px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('physical')}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: paymentMode === 'physical' ? 'var(--color-cyber-gold-dark)' : 'none', color: paymentMode === 'physical' ? 'var(--color-void-black)' : 'var(--color-sage)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                💵 Physical Checkout
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('digital')}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: paymentMode === 'digital' ? 'var(--color-cyber-gold-dark)' : 'none', color: paymentMode === 'digital' ? 'var(--color-void-black)' : 'var(--color-sage)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ⚡ Digital SUI Pay (QR)
              </button>
            </div>

            <form onSubmit={handleIssueInvoice} style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 10 }}>
              {paymentMode === 'physical' && (
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
              )}
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
                {isIssuing ? "Processing..." : paymentMode === 'physical' ? "Generate Digital Tax-Free Tag" : "Generate Bill QR Code"}
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
      {/* Invoicing FAB Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)", fontSize: "12px" }}>GENERATE TAX-FREE DIGITAL TAG</span>
              <button onClick={() => { setIsModalOpen(false); setGeneratedInvoice(null); }} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>
            
            {generatedInvoice ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px 0" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#10B981", textAlign: "center" }}>
                  {generatedInvoice.customerWallet === "Digital SUI Pay" ? "✓ DIGITAL BILL QR CODE GENERATED" : "✓ DIGITAL INVOICE MINTED SUCCESSFULLY"}
                </span>
                {/* Dynamic QR Code */}
                <div style={{ background: "white", padding: "16px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeSVG value={generatedInvoice.qrValue || generatedInvoice.id} size={160} />
                </div>
                <div style={{ textAlign: "center", color: "var(--color-sage)" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>Invoice ID: {generatedInvoice.id}</div>
                  <div style={{ fontSize: "12px" }}>Value: {generatedInvoice.amount} (VAT: {generatedInvoice.vat})</div>
                  <div style={{ fontSize: "10px", color: "var(--color-sage)" }}>Method: {generatedInvoice.customerWallet}</div>
                </div>
                <button className="btn-secondary" style={{ width: "100%" }} onClick={() => { setGeneratedInvoice(null); setIsModalOpen(false); }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleIssueInvoice} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Payment Mode Selector Toggle */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', padding: '4px', borderRadius: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('physical')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: paymentMode === 'physical' ? 'var(--color-cyber-gold-dark)' : 'none', color: paymentMode === 'physical' ? 'var(--color-void-black)' : 'var(--color-sage)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    💵 Physical
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('digital')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: paymentMode === 'digital' ? 'var(--color-cyber-gold-dark)' : 'none', color: paymentMode === 'digital' ? 'var(--color-void-black)' : 'var(--color-sage)', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    ⚡ SUI Pay (QR)
                  </button>
                </div>

                {paymentMode === 'physical' && (
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ margin: 0 }}>Tourist Wallet Address</label>
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
                      placeholder="0x8c2a...f9de" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Gross Invoice Value (AED)</label>
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
                    {isIssuing ? "Processing..." : paymentMode === 'physical' ? "Generate & Settle" : "Generate Bill QR"}
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
