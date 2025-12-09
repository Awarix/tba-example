import { defineChain } from "viem";

/**
 * HyperEVM chain configuration.
 * HyperEVM is Hyperliquid's EVM-compatible layer for smart contracts.
 */
export const hyperEvm = defineChain({
  id: 999,
  name: "HyperEVM",
  nativeCurrency: {
    name: "HYPE",
    symbol: "HYPE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperScan",
      url: "https://hyperscan.xyz",
    },
  },
});

/**
 * HyperEVM Testnet configuration.
 */
export const hyperEvmTestnet = defineChain({
  id: 998,
  name: "HyperEVM Testnet",
  nativeCurrency: {
    name: "HYPE",
    symbol: "HYPE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid-testnet.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperScan Testnet",
      url: "https://testnet.hyperscan.xyz",
    },
  },
  testnet: true,
});

/**
 * Contract addresses on HyperEVM.
 */
export const HYPEREVM_CONTRACTS = {
  /** USDHL - Hyperliquid's native USD stablecoin (fiat-backed, T-bills) */
  USDHL: "0xb50a96253abdf803d85efcdce07ad8becbc52bd5" as const,
  /** Native USDC on HyperEVM (from CCTP) */
  USDC: "0x..." as const, // TODO: Get actual USDC address
} as const;

/**
 * Contract addresses on Base.
 */
export const BASE_CONTRACTS = {
  /** USDC on Base */
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
} as const;

/**
 * ERC20 ABI for balance checks and approvals.
 */
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

