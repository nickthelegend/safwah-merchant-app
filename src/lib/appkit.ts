"use client";

// Reown AppKit (WalletConnect) + wagmi — the wallet stack for the SAFWAH web apps,
// matching the mobile apps. Get your own projectId at https://dashboard.reown.com;
// the fallback below is the shared demo id used across the SAFWAH apps.
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { polygonAmoy } from "@reown/appkit/networks";
import { QueryClient } from "@tanstack/react-query";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "22260d6680223859f9b07dadfafce02d";


export const wagmiAdapter = new WagmiAdapter({
  networks: [polygonAmoy],
  projectId,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
export const queryClient = new QueryClient();

// Initialise the modal once (module load, client-only via "use client").
createAppKit({
  adapters: [wagmiAdapter],
  networks: [polygonAmoy],
  projectId,
  defaultNetwork: polygonAmoy,
  metadata: {
    name: "SAFWAH Merchant",
    description: "Accept crypto, settle instantly in AED.",
    url: "https://safwah.ae",
    icons: ["https://avatars.githubusercontent.com/u/179229932"],
  },
  themeMode: "light",
  themeVariables: { "--w3m-accent": "#131316" },
  features: { analytics: false, email: true, socials: ["google", "apple", "x", "discord"] },
});
