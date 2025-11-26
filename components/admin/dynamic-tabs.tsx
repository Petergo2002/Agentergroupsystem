"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Tabs } from "@/components/ui/tabs";

interface DynamicTabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export function DynamicTabs({
  defaultValue = "credentials",
  children,
  className,
}: DynamicTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [defaultValue, pathname, router, searchParams],
  );

  return (
    <Tabs onValueChange={handleTabChange} className={className}>
      {children}
    </Tabs>
  );
}
