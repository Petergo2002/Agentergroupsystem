"use client";

import { DesignsManager } from "@/components/report-studio-v2/designs-manager";
import { IconPalette } from "@tabler/icons-react";

/**
 * Admin - PDF Designs Manager
 * 
 * Admins hanterar globala PDF-designs här.
 * Mallar hanteras nu av användare i deras egna dashboards.
 */
export default function AdminPdfDesignsPage() {
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#111111]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <IconPalette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PDF Designs</h1>
              <p className="text-sm text-gray-400">
                Hantera globala PDF-designs för alla användare
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <DesignsManager />
      </div>
    </div>
  );
}
