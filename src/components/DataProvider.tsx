"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getTransactions, getStats, getRates,
  DEFAULT_STATS, DEFAULT_RATES,
  type Transaction, type Stats, type Rates,
} from "@/lib/api";

type MerchantData = {
  sales: Transaction[];
  stats: Stats;
  rates: Rates;
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<MerchantData | null>(null);
export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData must be used inside <SafwahDataProvider>");
  return c;
}

export function SafwahDataProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getTransactions(), getStats(), getRates()]).then(([tx, st, rt]) => {
      if (!alive) return;
      setSales(tx); setStats(st); setRates(rt); setLoading(false);
    });
    return () => { alive = false; };
  }, [tick]);

  return (
    <Ctx.Provider value={{ sales, stats, rates, loading, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </Ctx.Provider>
  );
}
