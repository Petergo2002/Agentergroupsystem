"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

import { RapportPageNew } from "@/components/rapport/RapportPageNew";
import { SiteHeader } from "@/components/site-header";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RapportPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [initialTab, setInitialTab] = useState<"new" | "saved" | "settings">("new");
  const { flags, loading } = useFeatureFlags();

  useEffect(() => {
    if (tabParam === "new" || tabParam === "saved" || tabParam === "settings") {
      setInitialTab(tabParam);
    }
  }, [tabParam]);

  if (!loading && !flags?.reports_enabled) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="Rapporter" showAddButton={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Denna funktion är inte tillgänglig. Kontakta administratören för att aktivera Rapporter.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Rapporter" showAddButton={false} />
      <RapportPageNew initialTab={initialTab} />
    </div>
  );
}
