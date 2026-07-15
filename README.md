# SAFWAH Merchant

> **The SAFWAH merchant console — accept crypto, settle instantly in AED, and track revenue & VAT. Built on Polygon.**

## Overview

SAFWAH Merchant is the web console a UAE merchant uses to take crypto payments and settle in dirhams. A merchant registers on-chain, opens a charge, and the customer scans a QR code to pay in USDT, ETH, or AED — the app watches the merchant's on-chain AED balance and confirms the moment settlement lands. Everything runs against live contracts on the Polygon Amoy testnet (chainId 80002); reads go through a public RPC with no wallet required, while every write is signed by the merchant's own wallet.

Alongside payments it provides a treasury view, on-chain payouts, and a revenue/VAT dashboard, with an optional backend for aggregated stats that gracefully degrades to a demo mode when unreachable.

## Features

- **Wallet connect** via Reown AppKit (WalletConnect) + wagmi, with an injected-wallet (MetaMask) fallback and automatic network-switch/add for Polygon Amoy.
- **On-chain merchant registration** — name, trade license, and a `keccak256`-hashed bank IBAN (the plaintext IBAN never touches the chain).
- **QR charge flow** — enter an AED amount, generate a pay link + QR, and auto-detect settlement by polling the merchant's on-chain AED balance.
- **Treasury** — live AED, USDT, and POL balances read straight from chain.
- **On-chain payouts** — transfer AED or USDT to any address, with USDT converted at the on-chain reference rate.
- **VAT tracking** — reads claimable VAT from the on-chain VAT tracker; charge flow surfaces the 5% VAT line.
- **Revenue analytics & dashboard** — stats, token mix, and weekly charts, backed by an optional stats API.
- **Local transaction log** — every tx the app sends is recorded with its real hash, so history renders without an indexer.
- **Contract surface** — mock USDT/AED tokens, a swap contract (quote/swap), a payment contract (with IPFS receipt hash), merchant registry, VAT tracker, and a loyalty minter.
- **CI + tests** — Vitest unit and integration suites (live-RPC suites auto-skip on CI) plus a lint · test · build GitHub Actions workflow.

## Tech Stack

**Next.js 16** · **React 19** · **TypeScript 5** · **viem** · **wagmi 3** · **Reown AppKit** · **TanStack React Query** · **react-qr-code** · **sonner** · **Vitest** (jsdom) · **ESLint**

Target chain: **Polygon Amoy** testnet (chainId 80002).

## Getting Started

```bash
# clone
git clone https://github.com/nickthelegend/safwah-merchant-app.git
cd safwah-merchant-app

# install dependencies
npm install

# run the dev server (http://localhost:3000)
npm run dev

# other scripts
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npm test        # vitest run
```

Configuration is via environment variables (all optional — sensible on-chain defaults are baked in): `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_REOWN_PROJECT_ID`, the `NEXT_PUBLIC_*_ADDRESS` contract addresses, and `NEXT_PUBLIC_API_URL` for the stats backend.

## Project Structure

```
src/
  app/                 Next.js App Router pages
    page.tsx           dashboard
    charge/            QR charge + auto-settlement
    payouts/           on-chain payouts
    treasury/          on-chain balances
    transactions/      transaction history
    analytics/         revenue & VAT charts
    invoices/  cards/  live/
    layout.tsx  globals.css
  components/          Sidebar, Nav, OnchainProvider, DataProvider
  lib/                 chain, onchain, appkit, api, data, charts, txHistory
    __tests__/         vitest unit + integration suites
  test/setup.ts
.github/workflows/ci.yml
next.config.ts  vitest.config.ts  tsconfig.json  eslint.config.mjs
package.json
```

---

Built by [nickthelegend](https://github.com/nickthelegend) · [nickthelegend.tech](https://nickthelegend.tech)
