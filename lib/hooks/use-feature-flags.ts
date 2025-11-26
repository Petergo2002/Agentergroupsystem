"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFeatureFlagsContext } from "@/components/providers/feature-flags-provider";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "@/lib/feature-flags/types";

export type { FeatureFlagKey } from "@/lib/feature-flags/types";

interface UseFeatureFlagsResult {
  flags: FeatureFlags | null;
  loading: boolean;
  error: string | null;
}

export function useFeatureFlags(): UseFeatureFlagsResult {
  const { flags, setFlags } = useFeatureFlagsContext();
  const [loading, setLoading] = useState(!flags);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orgParam = searchParams?.get("org") || null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const url = orgParam
          ? `/api/feature-flags?org=${encodeURIComponent(orgParam)}`
          : "/api/feature-flags";

        const response = await fetch(url, {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load feature flags");
        }

        const data = await response.json();

        if (cancelled) return;

        setFlags({
          ...DEFAULT_FEATURE_FLAGS,
          ...(data || {}),
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load feature flags", err);
        const message =
          err instanceof Error ? err.message : "Failed to load feature flags";
        setError(message);
        setFlags((prev) => prev ?? DEFAULT_FEATURE_FLAGS);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orgParam, setFlags]);

  return { flags, loading, error };
}
