// On-chain layer for SAFWAH — live contracts on Polygon Amoy (chainId 80002).
// Reads go through a public RPC (no wallet needed); writes go through the user's
// injected wallet (MetaMask) — the user signs every transaction themselves.
import { createPublicClient, createWalletClient, custom, http, parseAbi, type Address } from "viem";
import { polygonAmoy } from "viem/chains";

export const CHAIN = polygonAmoy; // id 80002
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology";
export const EXPLORER = "https://amoy.polygonscan.com";

const env = (k: string, fallback: string) => (process.env[k] && process.env[k] !== "" ? (process.env[k] as string) : fallback);

export const ADDR = {
  MockUSDT: env("NEXT_PUBLIC_MOCK_USDT_ADDRESS", "0xAD4E088032cFfA6faDF3f085E34a04386A31A3Ce"),
  MockAED: env("NEXT_PUBLIC_MOCK_AED_ADDRESS", "0xb0ab8015Ce10593eE9a26E78B0BeDBc21330ba23"),
  SafwahSwap: env("NEXT_PUBLIC_SAFWAH_SWAP_ADDRESS", "0x44231038042759AC56fc1e10e7eaF83D375af687"),
  SafwahPayment: env("NEXT_PUBLIC_SAFWAH_PAYMENT_ADDRESS", "0x2Fb74bC2ecC3F67C8C0984186c38645949e5e6E6"),
  MerchantRegistry: env("NEXT_PUBLIC_MERCHANT_REGISTRY_ADDRESS", "0xDeC4574c162d4CB4A906EEEA09d29aDc213b0bD6"),
  VATTracker: env("NEXT_PUBLIC_VAT_TRACKER_ADDRESS", "0x11ba0F051f6859a8BBb98cCa14B40F280FcB96F0"),
  LoyaltyMinter: env("NEXT_PUBLIC_LOYALTY_MINTER_ADDRESS", "0x99e7D79d61DF2EDFf28385de92D787fa2accA223"),
} as const satisfies Record<string, string>;

export const a = (s: string) => s as Address;

// --- ABIs (only the surface we call) ---
export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function faucet()",
]);

export const swapAbi = parseAbi([
  "function quote(address tokenIn, uint256 amountIn) view returns (uint256)",
  "function swap(address tokenIn, uint256 amountIn, uint256 minAedOut, uint256 deadline) returns (uint256)",
]);

export const paymentAbi = parseAbi([
  "function pay(address merchant, uint256 amountAED, string receiptIPFSHash)",
]);

export const registryAbi = parseAbi([
  "function registerMerchant(string name, string tradeLicense, bytes32 bankAccountHash)",
  "function isVerifiedMerchant(address) view returns (bool)",
  "function isActiveMerchant(address) view returns (bool)",
  "function getMerchant(address) view returns ((string name, string tradeLicense, bytes32 bankAccountHash, bool isVerified, bool isActive, uint64 registeredAt))",
]);

export const vatAbi = parseAbi(["function getTotalClaimable(address) view returns (uint256)"]);
export const loyaltyAbi = parseAbi([
  "function getBalance(address) view returns (uint256)",
  "function redeem(uint256 amount)",
]);

// --- clients ---
export const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
export function getInjected(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;
}

export type WalletBundle = { account: Address; client: ReturnType<typeof createWalletClient> };

// Pluggable wallet-client source. Privy registers one via setWalletClientProvider();
// without it we fall back to the injected wallet (MetaMask).
let _walletProvider: (() => Promise<WalletBundle>) | null = null;
export function setWalletClientProvider(fn: (() => Promise<WalletBundle>) | null) { _walletProvider = fn; }

async function injectedWalletClient(): Promise<WalletBundle> {
  const eth = getInjected();
  if (!eth) throw new Error("No EVM wallet found — connect with Privy or install MetaMask.");
  const [account] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  await ensureAmoy(eth);
  return { account: account as Address, client: createWalletClient({ account: account as Address, chain: CHAIN, transport: custom(eth) }) };
}

export async function getWalletClient(): Promise<WalletBundle> {
  return _walletProvider ? _walletProvider() : injectedWalletClient();
}

// Switch the wallet to Amoy, adding the network if it isn't there yet.
export async function ensureAmoy(eth: Eip1193) {
  const hexId = "0x13882"; // 80002
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err) {
    const e = err as { code?: number };
    if (e.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: hexId,
          chainName: "Polygon Amoy",
          nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER],
        }],
      });
    } else if (e.code !== 4001) {
      throw err;
    }
  }
}

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
