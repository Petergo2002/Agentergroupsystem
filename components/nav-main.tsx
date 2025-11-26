"use client";

import {
  type Icon,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// Memoized nav item for better performance
const NavItem = memo(function NavItem({ 
  item, 
  onPrefetch 
}: { 
  item: { title: string; url?: string; icon?: Icon }; 
  onPrefetch: (url: string) => void;
}) {
  if (!item.url) return null;
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} asChild>
        <Link 
          href={item.url} 
          prefetch={true}
          onMouseEnter={() => onPrefetch(item.url!)}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

export const NavMain = memo(function NavMain({
  items,
  label,
}: {
  items: {
    title: string;
    url?: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
      icon?: Icon;
    }[];
  }[];
  label?: string;
}) {
  const router = useRouter();
  
  // Prefetch route on hover for instant navigation
  const handlePrefetch = useCallback((url: string) => {
    router.prefetch(url);
  }, [router]);

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) =>
            item.items ? (
              <Collapsible key={item.title} asChild defaultOpen={false}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link 
                              href={subItem.url}
                              prefetch={true}
                              onMouseEnter={() => handlePrefetch(subItem.url)}
                            >
                              {subItem.icon && <subItem.icon />}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <NavItem 
                key={item.title} 
                item={item} 
                onPrefetch={handlePrefetch} 
              />
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
