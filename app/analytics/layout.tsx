"use client";

import { memo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataProvider } from "@/components/providers/data-provider";
import { FeatureFlagsProvider } from "@/components/providers/feature-flags-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AnalyticsLayout = memo(function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <FeatureFlagsProvider>
        <DataProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar section="analytics" variant="inset" />
            <SidebarInset>
              <main className="flex flex-1 flex-col">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </DataProvider>
      </FeatureFlagsProvider>
    </ProtectedRoute>
  );
});

export default AnalyticsLayout;
