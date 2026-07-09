"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Address } from "viem";
import { WagmiProvider, useAccount, useDisconnect, useWalletClient } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";

import { wagmiConfig, queryClient } from "@/lib/appkit";
import { setWalletClientProvider, type WalletBundle } from "@/lib/chain";
import { readMerchantState, type MerchantState } from "@/lib/onchain";

type Ctx = {
  addr: Address | null;
  state: MerchantState | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const OnchainCtx = createContext<Ctx | null>(null);
export function useOnchain() {
  const c = useContext(OnchainCtx);
  if (!c) throw new Error("useOnchain must be used inside <OnchainProvider>");
  return c;
}

function useMerchant(addr: Address | null) {
  const [state, setState] = useState<MerchantState | null>(null);
  const refresh = useCallback(async () => {
    if (!addr) return;
    try { setState(await readMerchantState(addr)); } catch { /* rpc hiccup */ }
  }, [addr]);
  useEffect(() => {
    if (!addr) { setState(null); return; }
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [addr, refresh]);
  return { state, refresh };
}

function Inner({ children }: { children: React.ReactNode }) {
  const { address, isConnected, status } = useAccount();
  const { open } = useAppKit();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const addr = isConnected && address ? (address as Address) : null;
  const { state, refresh } = useMerchant(addr);
  const connecting = status === "connecting" || status === "reconnecting";

  useEffect(() => {
    if (!walletClient) { setWalletClientProvider(null); return; }
    setWalletClientProvider(async () => ({
      account: walletClient.account.address as Address,
      client: walletClient as unknown as WalletBundle["client"],
    }));
    return () => setWalletClientProvider(null);
  }, [walletClient]);

  const connect = useCallback(async () => { await open(); }, [open]);
  const disconnect = useCallback(() => wagmiDisconnect(), [wagmiDisconnect]);

  return <OnchainCtx.Provider value={{ addr, state, connecting, connect, disconnect, refresh }}>{children}</OnchainCtx.Provider>;
}

export function OnchainProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Inner>{children}</Inner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
