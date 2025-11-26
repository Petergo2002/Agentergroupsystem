"use client";

import { type CSSProperties, memo, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataProvider } from "@/components/providers/data-provider";
import { FeatureFlagsProvider } from "@/components/providers/feature-flags-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { FeatureFlags } from "@/lib/feature-flags/types";

interface DashboardLayoutClientProps {
  children: ReactNode;
  initialFeatureFlags: FeatureFlags;
}

export const DashboardLayoutClient = memo(function DashboardLayoutClient({
  children,
  initialFeatureFlags,
}: DashboardLayoutClientProps) {
  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties;

  return (
    <ProtectedRoute>
      <FeatureFlagsProvider initialFlags={initialFeatureFlags}>
        <DataProvider>
          <SidebarProvider style={sidebarStyle}>
            <AppSidebar section="contractor" variant="inset" />
            <SidebarInset>
              <main className="flex flex-1 flex-col">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </DataProvider>
      </FeatureFlagsProvider>
    </ProtectedRoute>
  );
});
