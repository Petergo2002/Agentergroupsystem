"use client";

import {
  IconCalendar,
  IconChecklist,
  IconFileDescription,
  IconLayoutDashboard,
  IconMessageCircle,
  IconPhoneCall,
  IconReceipt2,
  IconReportAnalytics,
  IconRobot,
  IconSparkles,
  IconTarget,
  IconTemplate,
  IconTool,
  IconUsers,
  IconInnerShadowTop,
} from "@tabler/icons-react";
import Link from "next/link";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  type FeatureFlagKey,
  useFeatureFlags,
} from "@/lib/hooks/use-feature-flags";
import {
  BRANDING_EVENT,
  readBrandingCache,
  writeBrandingCache,
} from "@/lib/branding-cache";
import { useAuthStore } from "@/lib/store";

// Navigation groups
interface NavItem {
  title: string;
  url: string;
  icon: any;
  flag?: FeatureFlagKey;
}

const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconLayoutDashboard,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: IconSparkles,
    flag: "leads_enabled",
  },
  {
    title: "Kunder",
    url: "/customers",
    icon: IconUsers,
    flag: "customers_enabled",
  },
  {
    title: "Kalender",
    url: "/calendar",
    icon: IconCalendar,
    flag: "calendar_enabled",
  },
];

const managementNav: NavItem[] = [
  {
    title: "Jobb",
    url: "/jobs",
    icon: IconTool,
    flag: "jobs_enabled",
  },
  {
    title: "Uppgifter",
    url: "/tasks",
    icon: IconChecklist,
    flag: "tasks_enabled",
  },
  {
    title: "Kampanjer",
    url: "/campaigns",
    icon: IconTarget,
    flag: "campaigns_enabled",
  },
];

const financeNav: NavItem[] = [
  {
    title: "Offerter",
    url: "/quotes",
    icon: IconFileDescription,
    flag: "quotes_enabled",
  },
  {
    title: "Fakturor",
    url: "/invoices",
    icon: IconReceipt2,
    flag: "invoices_enabled",
  },
];

const rapportNav: NavItem[] = [
  {
    title: "Report Studio",
    url: "/report-studio",
    icon: IconTemplate,
    flag: "reports_enabled",
  },
  {
    title: "Rapporter",
    url: "/rapport",
    icon: IconReportAnalytics,
    flag: "reports_enabled",
  },
];

const performanceNav: NavItem[] = [
  {
    title: "AI Analytics – Chat",
    url: "/analytics/chat",
    icon: IconMessageCircle,
    flag: "chat_analytics_enabled",
  },
  {
    title: "AI Analytics – Call",
    url: "/analytics/calls",
    icon: IconPhoneCall,
    flag: "call_analytics_enabled",
  },
  {
    title: "AI-assistenter",
    url: "/ai-assistants",
    icon: IconRobot,
    flag: "ai_assistant_enabled",
  },
  {
    title: "Inställningar",
    url: "/settings/chat-widget",
    icon: IconTool,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  section?: "contractor" | "analytics";
}

export function AppSidebar({
  section = "contractor",
  ...props
}: AppSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const [branding, setBranding] = React.useState<{
    name: string | null;
    logoUrl: string | null;
    loaded: boolean;
  }>(() => {
    const cached = readBrandingCache();
    return {
      name: cached?.name ?? null,
      logoUrl: cached?.logoUrl ?? null,
      loaded: Boolean(cached),
    };
  });

  React.useEffect(() => {
    let isMounted = true;

    const handleBrandingUpdate = (
      event: CustomEvent<{ name: string | null; logoUrl: string | null }>,
    ) => {
      setBranding((prev) => ({
        name: event.detail.name,
        logoUrl: event.detail.logoUrl,
        loaded: prev.loaded || true,
      }));
    };

    window.addEventListener(BRANDING_EVENT, handleBrandingUpdate as EventListener);

    const loadBranding = async () => {
      try {
        const response = await fetch("/api/organization/branding");
        if (!response.ok) {
          if (!isMounted) return;
          setBranding((prev) => ({ ...prev, loaded: true }));
          return;
        }
        const json = await response.json();
        const data = json?.data || {};
        const nextBranding = {
          name:
            typeof data.name === "string" && data.name.trim()
              ? data.name
              : null,
          logoUrl:
            typeof data.logo_url === "string" && data.logo_url.trim()
              ? data.logo_url
              : null,
        } as const;

        if (!isMounted) return;
        setBranding({ ...nextBranding, loaded: true });
        writeBrandingCache(nextBranding);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setBranding((prev) => ({ ...prev, loaded: true }));
      }
    };

    loadBranding();

    return () => {
      isMounted = false;
      window.removeEventListener(
        BRANDING_EVENT,
        handleBrandingUpdate as EventListener,
      );
    };
  }, []);
  const { flags } = useFeatureFlags();

  const filterNav = (items: NavItem[]) => {
    if (!flags) return items;
    return items.filter((item) => {
      if (!item.flag) return true;
      return !!flags[item.flag];
    });
  };

  const userData = {
    name: user?.email?.split("@")[0] || "User",
    email: user?.email || "user@example.com",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0" {...props}>
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Företagslogotyp"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <IconInnerShadowTop className="!size-5 text-primary" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {branding.loaded ? branding.name || "Hantverkar CRM" : ""}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filterNav(mainNav)} label="MAIN" />
        <NavMain items={filterNav(managementNav)} label="MANAGEMENT" />
        <NavMain items={filterNav(financeNav)} label="FINANCE" />
        <NavMain items={filterNav(rapportNav)} label="RAPPORT" />
        <NavMain items={filterNav(performanceNav)} label="PERFORMANCE" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
