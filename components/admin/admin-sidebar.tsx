"use client";

import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  LayoutDashboard,
  Palette,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Building2,
  },
  {
    name: "AI assistenter",
    href: "/admin/ai-assistants",
    icon: Bot,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Activity Log",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    name: "PDF Designs",
    href: "/admin/report-studio",
    icon: Palette,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [impersonatedOrg, setImpersonatedOrg] = useState<string | null>(null);
  const dashboardHref = impersonatedOrg
    ? `/?org=${encodeURIComponent(impersonatedOrg)}`
    : "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setImpersonatedOrg(sessionStorage.getItem("admin_viewing_org"));
  }, []);

  return (
    <div className="flex h-screen w-64 flex-col border-r border-white/10 bg-[#111111]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg">
            A
          </div>
          <span className="text-lg font-bold text-white">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <Link href={dashboardHref}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
