import type { ReactNode } from "react";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "@/lib/feature-flags/types";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialFeatureFlags = await loadInitialFeatureFlags();
  return (
    <DashboardLayoutClient initialFeatureFlags={initialFeatureFlags}>
      {children}
    </DashboardLayoutClient>
  );
}

async function loadInitialFeatureFlags(): Promise<FeatureFlags> {
  try {
    const supabase = await createServerClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return DEFAULT_FEATURE_FLAGS;

    const { data: profile } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) return DEFAULT_FEATURE_FLAGS;

    const { data: flagsRow } = await serviceClient
      .from("feature_flags")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    return {
      ...DEFAULT_FEATURE_FLAGS,
      ...(flagsRow || {}),
    };
  } catch (error) {
    console.error("Failed to load feature flags:", error);
    return DEFAULT_FEATURE_FLAGS;
  }
}
