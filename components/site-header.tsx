"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/store";

interface SiteHeaderProps {
  title?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function SiteHeader({
  title = "Översikt",
  showAddButton = true,
  onAddClick,
}: SiteHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Användare";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex-1">
          <h1 className="text-base font-medium">{title}</h1>
          <p className="text-xs text-muted-foreground">
            Välkommen tillbaka, {userName}!
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showAddButton && (
            <Button size="sm" onClick={onAddClick}>
              <Plus className="w-4 h-4 mr-2" />
              Ny post
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
