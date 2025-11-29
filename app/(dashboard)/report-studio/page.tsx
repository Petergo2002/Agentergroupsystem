"use client";

import { IconLoader2 } from "@tabler/icons-react";
import dynamic from "next/dynamic";

// A4: Lazy load ReportStudioV2 för snabbare initial sidladdning
const ReportStudioV2 = dynamic(
  () =>
    import("@/components/report-studio-v2").then((mod) => mod.ReportStudioV2),
  {
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar Report Studio...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
);

/**
 * User Dashboard - Report Studio
 *
 * Användare kan skapa och hantera sina egna rapportmallar här.
 * PDF Designs-tabben är dold eftersom designs hanteras av admin.
 */
export default function UserReportStudioPage() {
  return <ReportStudioV2 hideDesignsTab />;
}
