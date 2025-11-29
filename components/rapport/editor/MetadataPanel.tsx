"use client";

import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconDownload,
  IconHistory,
  IconLoader2,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPhoto,
  IconUpload,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  Report,
  ReportAsset,
  ReportMetadata,
  ReportStatus,
} from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MetadataPanelProps {
  report: Report;
  onMetadataChange: (updates: Partial<ReportMetadata>) => void;
  onStatusChange: (status: ReportStatus) => void;
  onExport: () => void;
  onAssetsChange?: (assets: ReportAsset[]) => void;
  isExporting?: boolean;
  autosaveStatus?: "idle" | "saving" | "saved" | "error";
}

// ============================================================================
// Component
// ============================================================================

export function MetadataPanel({
  report,
  onMetadataChange,
  onStatusChange,
  onExport,
  onAssetsChange,
  isExporting = false,
  autosaveStatus = "idle",
}: MetadataPanelProps) {
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Get cover image from assets
  const coverImage = report.assets.find(
    (a) =>
      a.tags?.includes("cover") || a.label?.toLowerCase().includes("omslag"),
  );

  // Handle cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAssetsChange) return;

    setUploadingCover(true);
    try {
      const url = URL.createObjectURL(file);
      const newAsset: ReportAsset = {
        id: `cover-${Date.now()}`,
        label: "Omslagsbild",
        url: url,
        capturedAt: new Date().toISOString(),
        capturedBy: "Användare",
        tags: ["cover"],
      };

      // Remove old cover if exists, add new
      const filteredAssets = report.assets.filter(
        (a) =>
          !a.tags?.includes("cover") &&
          !a.label?.toLowerCase().includes("omslag"),
      );
      onAssetsChange([...filteredAssets, newAsset]);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  // Handle remove cover
  const handleRemoveCover = () => {
    if (!onAssetsChange || !coverImage) return;
    const filteredAssets = report.assets.filter((a) => a.id !== coverImage.id);
    onAssetsChange(filteredAssets);
  };

  // Handle export with confirmation
  const handleExportClick = () => {
    setShowExportConfirm(true);
  };

  const handleConfirmExport = () => {
    setShowExportConfirm(false);
    onExport();
  };

  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Rapportinfo</h3>
          <AutosaveIndicator status={autosaveStatus} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Cover Image */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <IconPhoto className="size-4" />
              Omslagsbild
            </Label>

            {coverImage ? (
              <div className="relative group">
                <img
                  src={coverImage.url}
                  alt="Omslagsbild"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveCover}
                >
                  <IconX className="size-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {uploadingCover ? (
                  <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <IconUpload className="size-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Klicka för att ladda upp
                    </span>
                  </>
                )}
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          <Separator />

          {/* Grundinfo */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Grundinformation
            </Label>

            <div>
              <Label className="text-xs">Kund / Företag</Label>
              <Input
                value={report.metadata.client || ""}
                onChange={(e) => onMetadataChange({ client: e.target.value })}
                className="mt-1"
                placeholder="Kundnamn..."
              />
            </div>

            <div>
              <Label className="text-xs">Adress</Label>
              <div className="relative mt-1">
                <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.location || ""}
                  onChange={(e) =>
                    onMetadataChange({ location: e.target.value })
                  }
                  className="pl-9"
                  placeholder="Gatuadress..."
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Kontaktperson</Label>
              <div className="relative mt-1">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.assignedTo || ""}
                  onChange={(e) =>
                    onMetadataChange({ assignedTo: e.target.value })
                  }
                  className="pl-9"
                  placeholder="Namn..."
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Telefon</Label>
              <div className="relative mt-1">
                <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.phone || ""}
                  onChange={(e) => onMetadataChange({ phone: e.target.value })}
                  className="pl-9"
                  placeholder="070-123 45 67"
                  type="tel"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">E-post</Label>
              <div className="relative mt-1">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.email || ""}
                  onChange={(e) => onMetadataChange({ email: e.target.value })}
                  className="pl-9"
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Projektreferens</Label>
              <Input
                value={report.metadata.projectReference || ""}
                onChange={(e) =>
                  onMetadataChange({ projectReference: e.target.value })
                }
                className="mt-1"
                placeholder="Jobb-ID, ordernr..."
              />
            </div>

            <div>
              <Label className="text-xs">Utredare</Label>
              <Input
                value={report.metadata.investigator || ""}
                onChange={(e) =>
                  onMetadataChange({ investigator: e.target.value })
                }
                className="mt-1"
                placeholder="Ditt namn..."
              />
            </div>

            <div>
              <Label className="text-xs">Datum</Label>
              <div className="relative mt-1">
                <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={
                    report.metadata.scheduledAt
                      ? report.metadata.scheduledAt.slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    onMetadataChange({
                      scheduledAt: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <IconHistory className="size-4" />
              Historik
            </Label>
            <div className="space-y-2 text-sm">
              {report.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconClock className="size-4" />
                  <span>
                    Skapad{" "}
                    {new Date(report.createdAt).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconClock className="size-4" />
                <span>
                  Uppdaterad{" "}
                  {new Date(report.updatedAt).toLocaleString("sv-SE")}
                </span>
              </div>
              {report.exportedAt && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <IconCheck className="size-4" />
                  <span>
                    Exporterad{" "}
                    {new Date(report.exportedAt).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Export history */}
          {report.exportHistory && report.exportHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Exporthistorik
                </Label>
                <div className="space-y-2">
                  {report.exportHistory.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          v{entry.version} -{" "}
                          {entry.profileType === "customer" ? "Kund" : "Intern"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.exportedAt).toLocaleString("sv-SE")}
                        </p>
                      </div>
                      {entry.pdfUrl && (
                        <Button variant="ghost" size="icon" className="size-8">
                          <IconDownload className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Single Action Button */}
      <div className="border-t p-4 space-y-3">
        <Button
          onClick={handleExportClick}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isExporting ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Exporterar...
            </>
          ) : (
            <>
              <IconDownload className="mr-2 size-4" />
              Ladda ner PDF & Arkivera
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Fyll i all information ovan, sedan ladda ner och arkivera rapporten
        </p>
      </div>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ladda ner PDF & Arkivera?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span>Detta kommer att:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Spara alla ändringar</li>
                  <li>Generera en PDF av rapporten</li>
                  <li>Arkivera rapporten (flytta till Arkiv)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ja, ladda ner & arkivera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Autosave Indicator
// ============================================================================

function AutosaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") return null;

  const config = {
    saving: { text: "Sparar...", className: "text-muted-foreground" },
    saved: { text: "Sparat", className: "text-emerald-600" },
    error: { text: "Fel", className: "text-destructive" },
  }[status];

  return <span className={cn("text-xs", config.className)}>{config.text}</span>;
}

export default MetadataPanel;
