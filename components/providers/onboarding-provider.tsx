"use client";

import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useAuthStore } from "@/lib/store";

interface OnboardingProviderProps {
  children: React.ReactNode;
  /** Initial value for is_first_login from server */
  initialIsFirstLogin?: boolean;
}

/**
 * Provider that shows onboarding wizard for first-time users
 */
export function OnboardingProvider({
  children,
  initialIsFirstLogin = false,
}: OnboardingProviderProps) {
  const { user } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if we should show onboarding
    const checkOnboarding = async () => {
      // Check sessionStorage for welcome flag (set during login)
      const showWelcome = sessionStorage.getItem("show_welcome");

      if (showWelcome === "true" || initialIsFirstLogin) {
        setShowOnboarding(true);
        // Clear the flag so it doesn't show again on refresh
        sessionStorage.removeItem("show_welcome");
      }

      setHasChecked(true);
    };

    if (user) {
      checkOnboarding();
    } else {
      setHasChecked(true);
    }
  }, [user, initialIsFirstLogin]);

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  // Don't render anything until we've checked
  if (!hasChecked) {
    return null;
  }

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingWizard
          userName={user?.user_metadata?.name || user?.email?.split("@")[0]}
          onComplete={handleComplete}
          onSkip={handleComplete}
        />
      )}
    </>
  );
}
