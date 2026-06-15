# 🏪 Safwah Merchant Portal Frontend

This Next.js application serves as the storefront/boutique portal for retail merchants in the UAE. It allows them to register their trade license, mint digital tax-free invoices directly to tourist wallets, and collect payments atomically.

## 🌟 Features

* **Store Registration**: Submit business name, trade license number, and TRN to the UAE Federal Tax Authority (FTA) registry on-chain.
* **Generate Refund Tags**: Upload invoice files to Walrus and mint `InvoiceNFT` records directly to customer wallets.
* **Atomic Digital Sui Pay**: Generate a payment QR code for tourist checkouts. Collects 95% net purchase amount instantly while routing 5% VAT to the escrow contract, triggering the tourist's instant refund refund.
* **MongoDB Integration**: Stores issued invoice histories persistently in MongoDB via backend routes.

## ⚙️ Configuration (`.env`)

Configure the following variables in a `.env` file:
```env
VITE_SUI_PACKAGE_ID=0x96604c290f1467bf041b080bf945518d56f597cb6a07d0d698466c44ed0eabfb
VITE_MERCHANT_REGISTRY_ID=0x28659ebac204de2bdb7b76ae5336b12db82771edca09b60707d7422dea3cb4d1
VITE_BACKEND_URL=http://localhost:3001
```

## 🚀 Execution & Testing

### Install dependencies:
```bash
npm install
```

### Run in development mode:
```bash
npm run dev
```

### Run tests:
```bash
npm run test
```
