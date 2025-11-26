"use client";

import {
  BarChart3,
  Calendar,
  CheckSquare,
  Key,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const crmNavigation = [
  { name: "Översikt", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Kontakter", href: "/contacts", icon: Users },
  { name: "Uppgifter", href: "/tasks", icon: CheckSquare },
  { name: "Kampanjer", href: "/campaigns", icon: Target },
];

const analyticsNavigation = [
  { name: "Översikt", href: "/analytics", icon: BarChart3 },
  { name: "Samtalsanalys", href: "/analytics/calls", icon: LineChart },
  { name: "Kampanjanalys", href: "/analytics/campaigns", icon: Target },
  { name: "Prestanda", href: "/analytics/performance", icon: BarChart3 },
];

const settingsNavigation = [
  { name: "Profil", href: "/settings/profile", icon: Settings },
  { name: "API-nycklar", href: "/settings/api-keys", icon: Key },
];

interface SidebarProps {
  section?: "crm" | "analytics";
}

export const Sidebar = memo(function Sidebar({
  section = "crm",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const navigation =
    section === "analytics" ? analyticsNavigation : crmNavigation;

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;

      setUser(null);
      toast.success("Signed out successfully");
      // Ensure immediate redirect even if auth listener is delayed
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  }, [router, setUser]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          {section === "analytics" ? "Analys" : "CRM"}
        </h1>
      </div>

      {/* Section Switcher */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              section === "crm"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:bg-gray-200/50",
            )}
          >
            CRM
          </button>
          <button
            type="button"
            onClick={() => router.push("/analytics")}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              section === "analytics"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:bg-gray-200/50",
            )}
          >
            Analys
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {section === "analytics" ? "Analys" : "Navigering"}
          </h3>

          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 mr-3 transition-colors",
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500",
                  )}
                />
                {item.name}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {section === "crm" && (
          <div className="mt-8 px-3">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Analys
            </h3>
            <nav className="space-y-1">
              <Link
                href="/analytics"
                prefetch={true}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors group"
              >
                <BarChart3 className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500 transition-colors" />
                Visa analys
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* User & Settings */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              asChild
            >
              <Link href="/settings/profile" title="Inställningar">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Logga ut"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
