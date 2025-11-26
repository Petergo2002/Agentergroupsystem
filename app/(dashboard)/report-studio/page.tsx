"use client";

import { ReportStudioV2 } from "@/components/report-studio-v2";

/**
 * User Dashboard - Report Studio
 * 
 * Användare kan skapa och hantera sina egna rapportmallar här.
 * PDF Designs-tabben är dold eftersom designs hanteras av admin.
 */
export default function UserReportStudioPage() {
  return <ReportStudioV2 hideDesignsTab />;
}
