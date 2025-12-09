"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { formatUnits } from "viem";
import {
  useUserStateQuery,
  useUsdClassTransferMutation,
} from "@/store/api/hyperliquidApi";
import {
  hyperEvm,
  HYPEREVM_CONTRACTS,
  BASE_CONTRACTS,
  ERC20_ABI,
} from "@/lib/chains";

/**
 * Balances across different locations.
 */
export interface FundingBalances {
  baseUsdc: string; // USDC on Base chain
  hyperEvmUsdhl: string; // USDHL on HyperEVM
  hlPerpMargin: string; // Margin in HL perp wallet
  hlSpotBalance: string; // Balance in HL spot wallet
  isLoading: boolean;
  error: string | null;
}

/**
 * Funding flow state.
 */
export interface FundingState {
  step: "idle" | "swapping" | "transferring" | "complete" | "error";
  txHash: string | null;
  error: string | null;
}

/**
 * Hook for funding Hyperliquid account.
 * Handles the full flow: Base USDC → HyperEVM USDHL → HL perp/spot wallet.
 */
export function useFundHL() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const basePublicClient = usePublicClient({ chainId: base.id });
  const hyperEvmPublicClient = usePublicClient({ chainId: hyperEvm.id });

  const [fundingState, setFundingState] = useState<FundingState>({
    step: "idle",
    txHash: null,
    error: null,
  });

  // Get HL user state for perp margin
  const { data: userState, refetch: refetchUserState } = useUserStateQuery(
    { user: address ?? "" },
    { skip: !address }
  );

  const [transferToPerp] = useUsdClassTransferMutation();

  /**
   * Get current balances across all locations.
   */
  const getBalances = useCallback(async (): Promise<FundingBalances> => {
    if (!address) {
      return {
        baseUsdc: "0",
        hyperEvmUsdhl: "0",
        hlPerpMargin: "0",
        hlSpotBalance: "0",
        isLoading: false,
        error: "No wallet connected",
      };
    }

    try {
      // Get Base USDC balance
      let baseUsdc = "0";
      if (basePublicClient) {
        const balance = await basePublicClient.readContract({
          address: BASE_CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        baseUsdc = formatUnits(balance as bigint, 6);
      }

      // Get HyperEVM USDHL balance
      let hyperEvmUsdhl = "0";
      if (hyperEvmPublicClient) {
        try {
          const balance = await hyperEvmPublicClient.readContract({
            address: HYPEREVM_CONTRACTS.USDHL,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          hyperEvmUsdhl = formatUnits(balance as bigint, 6);
        } catch {
          // HyperEVM might not be available
          console.warn("Could not fetch HyperEVM USDHL balance");
        }
      }

      // Get HL perp margin from user state
      const hlPerpMargin = userState?.marginSummary?.accountValue ?? "0";

      // Get HL spot balance (simplified - would need spotClearinghouseState)
      const hlSpotBalance = "0"; // TODO: Implement spot balance fetch

      return {
        baseUsdc,
        hyperEvmUsdhl,
        hlPerpMargin,
        hlSpotBalance,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        baseUsdc: "0",
        hyperEvmUsdhl: "0",
        hlPerpMargin: "0",
        hlSpotBalance: "0",
        isLoading: false,
        error: String(error),
      };
    }
  }, [address, basePublicClient, hyperEvmPublicClient, userState]);

  /**
   * Swap Base USDC to HyperEVM USDHL via 1inch Fusion.
   * Note: 1inch Fusion SDK integration - placeholder for now.
   */
  const swapVia1inch = useCallback(
    async (amountUsdc: string): Promise<string | null> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setFundingState({ step: "swapping", txHash: null, error: null });

      try {
        // TODO: Implement 1inch Fusion SDK integration
        // For MVP, we'll show a fallback message directing users to bridge manually
        
        // Placeholder: In production, this would be:
        // 1. Get quote from 1inch Fusion API
        // 2. Build swap transaction
        // 3. Sign with wallet
        // 4. Submit and wait for confirmation

        throw new Error(
          "1inch Fusion SDK integration pending. " +
          "Please use https://bridge.hyperliquid.xyz to bridge USDC manually."
        );
      } catch (error) {
        setFundingState({
          step: "error",
          txHash: null,
          error: String(error),
        });
        throw error;
      }
    },
    [walletClient, address]
  );

  /**
   * Swap Base USDC to HyperEVM USDHL via Circle CCTP.
   * Note: CCTP SDK integration - placeholder for now.
   */
  const swapViaCCTP = useCallback(
    async (amountUsdc: string): Promise<string | null> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setFundingState({ step: "swapping", txHash: null, error: null });

      try {
        // TODO: Implement Circle CCTP SDK integration
        // For MVP, we'll show a fallback message
        
        throw new Error(
          "CCTP SDK integration pending. " +
          "Please use https://bridge.hyperliquid.xyz to bridge USDC manually."
        );
      } catch (error) {
        setFundingState({
          step: "error",
          txHash: null,
          error: String(error),
        });
        throw error;
      }
    },
    [walletClient, address]
  );

  /**
   * Transfer USDHL from HyperEVM wallet to HL perp or spot wallet.
   * Uses Hyperliquid's usdClassTransfer action.
   */
  const transferToHLWallet = useCallback(
    async (amount: string, toPerp: boolean): Promise<void> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      setFundingState({ step: "transferring", txHash: null, error: null });

      try {
        await transferToPerp({
          wallet: walletClient,
          amount,
          toPerp,
        }).unwrap();

        // Refetch user state to update balances
        await refetchUserState();

        setFundingState({
          step: "complete",
          txHash: null,
          error: null,
        });
      } catch (error) {
        setFundingState({
          step: "error",
          txHash: null,
          error: String(error),
        });
        throw error;
      }
    },
    [walletClient, transferToPerp, refetchUserState]
  );

  /**
   * One-click fund: Swap USDC → USDHL → Transfer to HL perp wallet.
   * This is the main entry point for funding.
   */
  const oneClickFund = useCallback(
    async (amountUsdc: string, useAuto: boolean = true): Promise<void> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      try {
        // Step 1: Swap Base USDC → HyperEVM USDHL
        if (useAuto) {
          // Try 1inch first, fall back to CCTP
          try {
            await swapVia1inch(amountUsdc);
          } catch {
            await swapViaCCTP(amountUsdc);
          }
        }

        // Step 2: Transfer USDHL → HL perp wallet
        await transferToHLWallet(amountUsdc, true);

        setFundingState({
          step: "complete",
          txHash: null,
          error: null,
        });
      } catch (error) {
        setFundingState({
          step: "error",
          txHash: null,
          error: String(error),
        });
        throw error;
      }
    },
    [walletClient, address, swapVia1inch, swapViaCCTP, transferToHLWallet]
  );

  /**
   * Reset funding state.
   */
  const reset = useCallback(() => {
    setFundingState({
      step: "idle",
      txHash: null,
      error: null,
    });
  }, []);

  return {
    // Balances
    getBalances,
    hlPerpMargin: userState?.marginSummary?.accountValue ?? "0",

    // Funding actions
    swapVia1inch,
    swapViaCCTP,
    transferToHLWallet,
    oneClickFund,

    // State
    fundingState,
    reset,

    // Refetch
    refetchUserState,
  };
}

/**
 * Get the manual bridge URL for fallback.
 */
export function getBridgeUrl(): string {
  return "https://bridge.hyperliquid.xyz";
}

/**
 * Get the HyperUnit widget URL for alternative funding.
 */
export function getHyperUnitUrl(): string {
  return "https://hyperunit.xyz";
}
