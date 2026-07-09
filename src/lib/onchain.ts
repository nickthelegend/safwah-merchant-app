// Merchant-side SAFWAH on-chain actions. Reads via public RPC; register signs in the wallet.
import { keccak256, toHex, formatUnits, parseUnits, type Address } from "viem";
import { publicClient, getWalletClient, ADDR, a, CHAIN, erc20Abi, registryAbi, vatAbi } from "./chain";
import { recordTx } from "./txHistory";

export const AED_DECIMALS = 18;
export const USDT_DECIMALS = 6;
const RATE = 3.6725; // AED per USD

export type MerchantState = {
  registered: boolean; verified: boolean; active: boolean; name: string; aed: number; vat: number;
};

export async function readMerchantState(address: Address): Promise<MerchantState> {
  const [info, aed, vat] = await Promise.all([
    publicClient.readContract({ address: a(ADDR.MerchantRegistry), abi: registryAbi, functionName: "getMerchant", args: [address] }).catch(() => null),
    publicClient.readContract({ address: a(ADDR.MockAED), abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    publicClient.readContract({ address: a(ADDR.VATTracker), abi: vatAbi, functionName: "getTotalClaimable", args: [address] }).catch(() => 0n),
  ]);
  const m = info as { name: string; isVerified: boolean; isActive: boolean; registeredAt: bigint } | null;
  return {
    registered: !!(m && m.registeredAt > 0n),
    verified: !!m?.isVerified,
    active: !!m?.isActive,
    name: m?.name ?? "",
    aed: +formatUnits(aed as bigint, AED_DECIMALS),
    vat: +formatUnits(vat as bigint, AED_DECIMALS),
  };
}

// Register the connected wallet as a merchant. The bank account is stored as a
// keccak256 hash on-chain — the plaintext IBAN never touches the chain.
export async function registerMerchant(name: string, license: string, iban: string): Promise<string> {
  const { client, account } = await getWalletClient();
  const bankHash = keccak256(toHex(iban && iban.trim() ? iban.trim() : "SAFWAH-DEMO-IBAN"));
  const hash = await client.writeContract({
    address: a(ADDR.MerchantRegistry), abi: registryAbi, functionName: "registerMerchant",
    args: [name, license, bankHash], account, chain: CHAIN,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  recordTx({ hash, kind: "register", label: "Registered merchant", sub: name, addr: account });
  return hash;
}

export type Treasury = { aed: number; usdt: number; pol: number };

export async function readTreasury(address: Address): Promise<Treasury> {
  const [aed, usdt, pol] = await Promise.all([
    publicClient.readContract({ address: a(ADDR.MockAED), abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    publicClient.readContract({ address: a(ADDR.MockUSDT), abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    publicClient.getBalance({ address }),
  ]);
  return {
    aed: +formatUnits(aed as bigint, AED_DECIMALS),
    usdt: +formatUnits(usdt as bigint, USDT_DECIMALS),
    pol: +formatUnits(pol, 18),
  };
}

// Real on-chain payout — transfer AED or USDT to a wallet address. `aedAmount` is in
// AED; a USDT payout is converted at the on-chain reference rate.
export async function sendPayout(asset: "AED" | "USDT", to: string, aedAmount: number): Promise<string> {
  const { client, account } = await getWalletClient();
  const token = asset === "USDT" ? ADDR.MockUSDT : ADDR.MockAED;
  const decimals = asset === "USDT" ? USDT_DECIMALS : AED_DECIMALS;
  const tokenAmount = asset === "USDT" ? aedAmount / RATE : aedAmount;
  const amt = parseUnits(tokenAmount.toFixed(6), decimals);
  const hash = await client.writeContract({ address: a(token), abi: erc20Abi, functionName: "transfer", args: [a(to), amt], account, chain: CHAIN });
  await publicClient.waitForTransactionReceipt({ hash });
  recordTx({ hash, kind: "payout", label: `Payout · ${asset}`, sub: `${to.slice(0, 8)}…`, aed: aedAmount, addr: account });
  return hash;
}

export { txUrl } from "./chain";
