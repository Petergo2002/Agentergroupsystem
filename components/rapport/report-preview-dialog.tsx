"use client";

import {
  IconDownload,
  IconEye,
  IconEyeOff,
  IconPrinter,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Report,
  ReportSectionDefinition,
  ReportTemplate,
} from "@/lib/types/rapport";
import { renderReportToIframe } from "./rapport-container";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
  template?: ReportTemplate | null;
  sectionDefinitions?: ReportSectionDefinition[];
  pdfProfile?: {
    brandColor?: string;
    accentColor?: string;
    fontFamily?: string;
    displayLogo?: boolean;
    logoUrl?: string;
    footerText?: string;
    headerText?: string;
    displayInternalNotes?: boolean;
  };
  onExport?: () => void;
  showExportButton?: boolean;
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  report,
  template = null,
  sectionDefinitions = [],
  pdfProfile,
  onExport,
  showExportButton = false,
}: ReportPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<"internal" | "customer">("customer");

  useEffect(() => {
    if (open && iframeRef.current) {
      renderReportToIframe(
        iframeRef.current,
        report,
        template,
        sectionDefinitions,
        pdfProfile,
        viewMode,
      );
    }
  }, [open, report, template, sectionDefinitions, pdfProfile, viewMode]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleExportPDF = () => {
    if (onExport) {
      onExport();
    } else {
      handlePrint();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Förhandsgranska rapport
              </DialogTitle>
              <DialogDescription className="mt-1">
                Så här kommer rapporten att se ut som PDF
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button
                  variant={viewMode === "customer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("customer")}
                  className="gap-1 h-8"
                >
                  <IconEye className="h-3.5 w-3.5" />
                  Kundvy
                </Button>
                <Button
                  variant={viewMode === "internal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("internal")}
                  className="gap-1 h-8"
                >
                  <IconEyeOff className="h-3.5 w-3.5" />
                  Intern
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <IconPrinter className="h-4 w-4" />
                Skriv ut
              </Button>
              {showExportButton && (
                <Button size="sm" onClick={handleExportPDF} className="gap-2">
                  <IconDownload className="h-4 w-4" />
                  Exportera & Arkivera
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Rapport förhandsgranskning"
          />
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
