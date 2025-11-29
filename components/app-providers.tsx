"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Wraps the entire application with AuthProvider + Toaster,
 * except for /embed routes which must be anonymous (e.g. widgets).
 */
export function AppProviders({ children }: AppProvidersProps) {
  const pathname = usePathname();

  const isEmbedRoute = useMemo(
    () => pathname?.startsWith("/embed"),
    [pathname],
  );

  if (isEmbedRoute) {
    // Widgets should not be forced through auth redirects.
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
