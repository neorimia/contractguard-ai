"use client";

import { useEffect, useState } from "react";
import { BannerSlot } from "./BannerSlot";
import { Banner, BannerPlacement } from "./types/banner.types";

interface BannerManagerProps {
  placement: BannerPlacement;
  scanCount?: number;
  contractAddress?: string;
}

export function BannerManager({
  placement,
  scanCount,
  contractAddress,
}: BannerManagerProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get or create session ID
    const existingSessionId = localStorage.getItem("banner_session_id");
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("banner_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Fetch banner for this placement and user context
    const fetchBanner = async () => {
      try {
        const response = await fetch("/api/banners/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement,
            scanCount,
            contractAddress,
            sessionId,
          }),
        });

        const data = await response.json();

        if (data.banner) {
          setBanner(data.banner);
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [placement, scanCount, sessionId, contractAddress]);

  if (loading || !banner) return null;

  return (
    <BannerSlot
      banner={banner}
      sessionId={sessionId}
      placement={placement}
      scanCount={scanCount}
      contractAddress={contractAddress}
    />
  );
}
