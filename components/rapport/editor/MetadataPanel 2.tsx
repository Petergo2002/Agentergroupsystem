"use client";

import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconDownload,
  IconEye,
  IconHistory,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Report, ReportMetadata, ReportStatus } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MetadataPanelProps {
  report: Report;
  onMetadataChange: (updates: Partial<ReportMetadata>) => void;
  onStatusChange: (status: ReportStatus) => void;
  onExport: () => void;
  onPreview: () => void;
  isExporting?: boolean;
  autosaveStatus?: "idle" | "saving" | "saved" | "error";
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Utkast",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  review: {
    label: "Granskning",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  approved: {
    label: "Godkänd",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

const _PRIORITY_CONFIG = {
  high: { label: "Hög", className: "text-red-600" },
  medium: { label: "Medel", className: "text-amber-600" },
  low: { label: "Låg", className: "text-slate-500" },
};

// ============================================================================
// Component
// ============================================================================

export function MetadataPanel({
  report,
  onMetadataChange,
  onStatusChange,
  onExport,
  onPreview,
  isExporting = false,
  autosaveStatus = "idle",
}: MetadataPanelProps) {
  const statusConfig = STATUS_CONFIG[report.status];

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
          {/* Status */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Status
            </Label>
            <Select
              value={report.status}
              onValueChange={(v) => onStatusChange(v as ReportStatus)}
            >
              <SelectTrigger className={cn("mt-2", statusConfig.className)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Utkast</SelectItem>
                <SelectItem value="review">Granskning</SelectItem>
                <SelectItem value="approved">Godkänd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Quick info */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Grunddata
            </Label>

            <div>
              <Label className="text-xs">Kund</Label>
              <Input
                value={report.metadata.client}
                onChange={(e) => onMetadataChange({ client: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Plats</Label>
              <div className="relative mt-1">
                <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.location}
                  onChange={(e) =>
                    onMetadataChange({ location: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Projektreferens</Label>
              <Input
                value={report.metadata.projectReference}
                onChange={(e) =>
                  onMetadataChange({ projectReference: e.target.value })
                }
                className="mt-1"
                placeholder="Jobb-ID, ordernr..."
              />
            </div>
          </div>

          <Separator />

          {/* Assignment */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Ansvar & tid
            </Label>

            <div>
              <Label className="text-xs">Ansvarig</Label>
              <div className="relative mt-1">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={report.metadata.assignedTo}
                  onChange={(e) =>
                    onMetadataChange({ assignedTo: e.target.value })
                  }
                  className="pl-9"
                  placeholder="Tilldela..."
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Prioritet</Label>
              <Select
                value={report.metadata.priority}
                onValueChange={(v) =>
                  onMetadataChange({ priority: v as "low" | "medium" | "high" })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Hög</SelectItem>
                  <SelectItem value="medium">Medel</SelectItem>
                  <SelectItem value="low">Låg</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Deadline</Label>
              <div className="relative mt-1">
                <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  value={
                    report.metadata.dueAt
                      ? report.metadata.dueAt.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    onMetadataChange({
                      dueAt: new Date(e.target.value).toISOString(),
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Tidslinje
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <IconHistory className="size-4" />
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

      {/* Workflow Actions */}
      <div className="border-t p-4 space-y-3">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Workflow</span>
          <span
            className={cn(
              "font-medium",
              report.status === "draft" && "text-amber-600",
              report.status === "review" && "text-blue-600",
              report.status === "approved" && "text-emerald-600",
            )}
          >
            {report.status === "draft" && "1/3 Redigera"}
            {report.status === "review" && "2/3 Granska"}
            {report.status === "approved" && "3/3 Klar"}
          </span>
        </div>

        {/* Step 1: Preview (always available) */}
        <Button
          variant="outline"
          onClick={onPreview}
          className="w-full justify-start"
        >
          <IconEye className="mr-2 size-4" />
          Förhandsgranska
        </Button>

        {/* Step 2: Move to review */}
        {report.status === "draft" && (
          <Button
            variant="outline"
            onClick={() => onStatusChange("review")}
            className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <IconCheck className="mr-2 size-4" />
            Markera för granskning
          </Button>
        )}

        {/* Step 3: Export & Archive */}
        <Button
          onClick={onExport}
          disabled={isExporting}
          className={cn(
            "w-full justify-start",
            report.status === "review" && "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          <IconDownload className="mr-2 size-4" />
          {isExporting ? "Exporterar..." : "Ladda ner PDF & Arkivera"}
        </Button>

        {/* Info text */}
        {report.status === "draft" && (
          <p className="text-xs text-muted-foreground text-center">
            Fyll i alla sektioner, granska sedan och ladda ner PDF
          </p>
        )}
        {report.status === "review" && (
          <p className="text-xs text-muted-foreground text-center">
            Granska rapporten och ladda sedan ner som PDF
          </p>
        )}
        {report.status === "approved" && (
          <p className="text-xs text-emerald-600 text-center">
            ✓ Rapporten är exporterad och arkiverad
          </p>
        )}
      </div>
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
