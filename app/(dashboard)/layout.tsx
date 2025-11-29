import type { ReactNode } from "react";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { OnboardingProvider } from "@/components/providers/onboarding-provider";
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
  const { initialFeatureFlags, isFirstLogin } = await loadInitialData();
  return (
    <DashboardLayoutClient initialFeatureFlags={initialFeatureFlags}>
      <OnboardingProvider initialIsFirstLogin={isFirstLogin}>
        {children}
      </OnboardingProvider>
    </DashboardLayoutClient>
  );
}

async function loadInitialData(): Promise<{
  initialFeatureFlags: FeatureFlags;
  isFirstLogin: boolean;
}> {
  try {
    const supabase = await createServerClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { initialFeatureFlags: DEFAULT_FEATURE_FLAGS, isFirstLogin: false };
    }

    const { data: profile } = await serviceClient
      .from("users")
      .select("organization_id, is_first_login")
      .eq("id", user.id)
      .maybeSingle();

    const isFirstLogin = profile?.is_first_login ?? false;

    if (!profile?.organization_id) {
      return { initialFeatureFlags: DEFAULT_FEATURE_FLAGS, isFirstLogin };
    }

    const { data: flagsRow } = await serviceClient
      .from("feature_flags")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    return {
      initialFeatureFlags: {
        ...DEFAULT_FEATURE_FLAGS,
        ...(flagsRow || {}),
      },
      isFirstLogin,
    };
  } catch (error) {
    console.error("Failed to load initial data:", error);
    return { initialFeatureFlags: DEFAULT_FEATURE_FLAGS, isFirstLogin: false };
  }
}
