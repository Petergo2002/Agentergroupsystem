"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { FeatureFlags } from "@/lib/feature-flags/types";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/feature-flags/types";

type FeatureFlagsSetter =
  | FeatureFlags
  | ((prev: FeatureFlags | null) => FeatureFlags);

type FeatureFlagsContextValue = {
  flags: FeatureFlags | null;
  setFlags: (update: FeatureFlagsSetter) => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(
  undefined,
);

export function FeatureFlagsProvider({
  initialFlags = DEFAULT_FEATURE_FLAGS,
  children,
}: {
  initialFlags?: FeatureFlags | null;
  children: React.ReactNode;
}) {
  const [flags, setFlagsState] = useState<FeatureFlags | null>(
    initialFlags ?? DEFAULT_FEATURE_FLAGS,
  );

  const setFlags = useMemo(
    () => (update: FeatureFlagsSetter) => {
      setFlagsState((prev) =>
        typeof update === "function"
          ? (update as (prev: FeatureFlags | null) => FeatureFlags)(prev)
          : update,
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      flags,
      setFlags,
    }),
    [flags, setFlags],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlagsContext must be used within a FeatureFlagsProvider",
    );
  }
  return context;
}
