"use client";

import { IconLoader2 } from "@tabler/icons-react";
import dynamic from "next/dynamic";

/**
 * Report Studio Page - Entry point för mallbyggaren
 * A4: Lazy load för snabbare initial sidladdning
 */

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

export default function StudioPage() {
  return <ReportStudioV2 />;
}
