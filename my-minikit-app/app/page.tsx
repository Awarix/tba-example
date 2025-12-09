"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Wallet } from "@coinbase/onchainkit/wallet";
import {
  useMiniKit,
  useQuickAuth,
  useComposeCast,
  useOpenUrl,
  useIsInMiniApp,
  useViewProfile,
  useAuthenticate,
} from "@coinbase/onchainkit/minikit";
import {
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
} from "@coinbase/onchainkit/identity";
import { Swap, SwapAmountInput, SwapButton } from "@coinbase/onchainkit/swap";
import { useAccount } from "wagmi";
import type { Token } from "@coinbase/onchainkit/token";
import styles from "./page.module.css";

// Token definitions for Base chain
const ETH: Token = {
  name: "Ethereum",
  address: "",
  symbol: "ETH",
  decimals: 18,
  image:
    "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
  chainId: 8453,
};

const USDC: Token = {
  name: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  symbol: "USDC",
  decimals: 6,
  image:
    "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
  chainId: 8453,
};

export default function Home() {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // MiniKit core hook - setFrameReady signals the host app we're ready
  const { setFrameReady, isFrameReady, context } = useMiniKit();

  // QuickAuth hook for verified authentication
  const {
    data: authData,
    isLoading: authLoading,
    error: authError,
  } = useQuickAuth<{
    userFid: string;
  }>("/api/auth");

  // Share/Compose Cast hook
  const { composeCast } = useComposeCast();

  // Open URL hook
  const openUrl = useOpenUrl();

  // Check if in Mini App environment
  const { isInMiniApp } = useIsInMiniApp();

  // View Profile hook
  const viewProfile = useViewProfile();

  // useAuthenticate hook (alternative to QuickAuth)
  const { signIn } = useAuthenticate();

  // Wallet account
  const { address, isConnected } = useAccount();

  // Signal frame ready to the host application
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Test handlers
  const handleShareTest = () => {
    composeCast({
      text: "Testing MiniKit hooks! 🚀 This share was triggered from my Mini App.",
      embeds: [window.location.href],
    });
  };

  const handleOpenUrlTest = () => {
    openUrl("https://docs.base.org/mini-apps");
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Wallet />
      </header>

      <div className={styles.content}>
        <Image
          priority
          src="/sphere.svg"
          alt="Sphere"
          width={120}
          height={120}
        />
        <h1 className={styles.title}>MiniKit Test</h1>
        <p className={styles.subtitle}>Testing all MiniKit hooks & features</p>

        {/* Test Sections */}
        <div className={styles.testGrid}>
          {/* 1. User Context / Identity */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>👤 User Identity & Context</h2>
            <div className={styles.cardContent}>
              {context?.user ? (
                <div className={styles.contextInfo}>
                  <p>
                    <strong>FID:</strong> {context.user.fid}
                  </p>
                  <p>
                    <strong>Username:</strong> {context.user.username || "N/A"}
                  </p>
                  <p>
                    <strong>Display Name:</strong>{" "}
                    {context.user.displayName || "N/A"}
                  </p>
                  {context.user.pfpUrl && (
                    <img
                      src={context.user.pfpUrl}
                      alt="Profile"
                      className={styles.avatar}
                    />
                  )}
                </div>
              ) : (
                <p className={styles.statusPending}>
                  Context not available (not in Mini App)
                </p>
              )}

              {/* OnchainKit Identity Component */}
              {isConnected && address && (
                <div className={styles.identityWrapper}>
                  <p className={styles.sectionLabel}>Wallet Identity:</p>
                  <Identity
                    address={address}
                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                  >
                    <Avatar />
                    <Name>
                      <Badge />
                    </Name>
                    <Address />
                  </Identity>
                </div>
              )}

              <div className={styles.statusBadge}>
                {context?.user ? "✅ Working" : "⏳ Needs Mini App Context"}
              </div>
            </div>
          </section>

          {/* 2. QuickAuth */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>🔐 QuickAuth</h2>
            <div className={styles.cardContent}>
              {authLoading ? (
                <p className={styles.statusPending}>Authenticating...</p>
              ) : authError ? (
                <div>
                  <p className={styles.statusError}>Auth Error</p>
                  <p className={styles.errorDetail}>
                    {authError instanceof Error
                      ? authError.message
                      : "Unknown error"}
                  </p>
                </div>
              ) : authData?.userFid ? (
                <div className={styles.successInfo}>
                  <p>
                    <strong>Verified FID:</strong> {authData.userFid}
                  </p>
                  <p className={styles.statusSuccess}>
                    ✅ Cryptographically Verified
                  </p>
                </div>
              ) : (
                <p className={styles.statusPending}>
                  Awaiting authentication...
                </p>
              )}

              <div className={styles.statusBadge}>
                {authData?.userFid
                  ? "✅ Working"
                  : authLoading
                    ? "⏳ Loading"
                    : "❌ Not Authenticated"}
              </div>
            </div>
          </section>

          {/* 3. Share / Compose Cast */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>📤 Share (composeCast)</h2>
            <div className={styles.cardContent}>
              <p>Test sharing functionality with prefilled text and embed.</p>
              <button className={styles.testButton} onClick={handleShareTest}>
                Share Test Cast
              </button>
              <div className={styles.statusBadge}>
                {context ? "✅ Ready in Mini App" : "⏳ Needs Mini App"}
              </div>
            </div>
          </section>

          {/* 4. Open URL */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>🔗 Open URL</h2>
            <div className={styles.cardContent}>
              <p>Test opening external URLs in the in-app browser.</p>
              <button className={styles.testButton} onClick={handleOpenUrlTest}>
                Open Base Docs
              </button>
              <div className={styles.statusBadge}>
                {context ? "✅ Ready in Mini App" : "⏳ Needs Mini App"}
              </div>
            </div>
          </section>

          {/* 4b. View Profile */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>👁️ View Profile</h2>
            <div className={styles.cardContent}>
              <p>Test viewing a Farcaster profile (FID: 3).</p>
              <button
                className={styles.testButton}
                onClick={() => viewProfile(3)}
              >
                View @dwr Profile
              </button>
              <div className={styles.statusBadge}>
                {isInMiniApp ? "✅ Ready in Mini App" : "⏳ Needs Mini App"}
              </div>
            </div>
          </section>

          {/* 4c. useAuthenticate (signIn) */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>🔑 useAuthenticate</h2>
            <div className={styles.cardContent}>
              <p>Test Sign In with Farcaster flow.</p>
              <button
                className={styles.testButton}
                onClick={async () => {
                  const result = await signIn();
                  if (result) {
                    console.log("Signed in:", result);
                    alert(`Signed in successfully! Check console for details.`);
                  }
                }}
              >
                Sign In with Farcaster
              </button>
              <div className={styles.statusBadge}>
                {isInMiniApp ? "✅ Ready in Mini App" : "⏳ Needs Mini App"}
              </div>
            </div>
          </section>

          {/* 5. Wallet */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>💳 Wallet</h2>
            <div className={styles.cardContent}>
              {isConnected ? (
                <div className={styles.successInfo}>
                  <p>
                    <strong>Connected:</strong>
                  </p>
                  <p className={styles.address}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              ) : (
                <p className={styles.statusPending}>
                  Wallet not connected. Use button above.
                </p>
              )}
              <div className={styles.statusBadge}>
                {isConnected ? "✅ Connected" : "⏳ Not Connected"}
              </div>
            </div>
          </section>

          {/* 6. Swap */}
          <section className={styles.testCard}>
            <h2 className={styles.cardTitle}>🔄 Swap</h2>
            <div className={styles.cardContent}>
              {isConnected ? (
                <div className={styles.swapWrapper}>
                  <Swap>
                    <SwapAmountInput
                      label="Sell"
                      swappableTokens={[ETH, USDC]}
                      token={ETH}
                      type="from"
                    />
                    <SwapAmountInput
                      label="Buy"
                      swappableTokens={[ETH, USDC]}
                      token={USDC}
                      type="to"
                    />
                    <SwapButton />
                  </Swap>
                </div>
              ) : (
                <p className={styles.statusPending}>
                  Connect wallet to test swap
                </p>
              )}
              <div className={styles.statusBadge}>
                {isConnected ? "✅ Ready" : "⏳ Needs Wallet"}
              </div>
            </div>
          </section>
        </div>

        {/* Client Info */}
        <section className={styles.clientInfo}>
          <h3>Client Info</h3>
          <p>
            <strong>isInMiniApp:</strong> {isInMiniApp ? "Yes ✅" : "No"}
          </p>
          {context?.client && (
            <>
              <p>
                <strong>Client FID:</strong> {context.client.clientFid}
              </p>
              <p>
                <strong>Is Base App:</strong>{" "}
                {String(context.client.clientFid) === "309857" ? "Yes ✅" : "No"}
              </p>
              <p>
                <strong>App Saved:</strong> {context.client.added ? "Yes" : "No"}
              </p>
            </>
          )}
        </section>

        {/* Overall Status */}
        <section className={styles.statusOverview}>
          <h3>Test Summary</h3>
          <ul className={styles.statusList}>
            <li>isInMiniApp: {isInMiniApp ? "✅" : "⏳"}</li>
            <li>User Context: {context?.user ? "✅" : "⏳"}</li>
            <li>QuickAuth: {authData?.userFid ? "✅" : "⏳"}</li>
            <li>useAuthenticate: {isInMiniApp ? "✅" : "⏳"}</li>
            <li>composeCast: {isInMiniApp ? "✅" : "⏳"}</li>
            <li>openUrl: {isInMiniApp ? "✅" : "⏳"}</li>
            <li>viewProfile: {isInMiniApp ? "✅" : "⏳"}</li>
            <li>Wallet: {isConnected ? "✅" : "⏳"}</li>
            <li>Swap: {isConnected ? "✅" : "⏳"}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
