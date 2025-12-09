"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * Root page - redirects to /trade after frame is ready.
 */
export default function Home() {
  const router = useRouter();
  const { setFrameReady, isFrameReady } = useMiniKit();

  // Signal frame ready to the host application
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirect to trade page once ready
  useEffect(() => {
    if (isFrameReady) {
      router.replace("/trade");
    }
  }, [isFrameReady, router]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
