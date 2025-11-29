"use client";

import { Loader2, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// A7: Lazy load RapportPageNew to reduce initial bundle size
const RapportPageNew = dynamic(
  () =>
    import("@/components/rapport/RapportPageNew").then(
      (mod) => mod.RapportPageNew,
    ),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    ),
    ssr: false,
  },
);

import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

export default function RapportPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [initialTab, setInitialTab] = useState<"new" | "saved" | "settings">(
    "new",
  );
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
              Denna funktion är inte tillgänglig. Kontakta administratören för
              att aktivera Rapporter.
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
