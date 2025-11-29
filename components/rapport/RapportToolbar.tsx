"use client";

import {
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconDots,
  IconDownload,
  IconEdit,
  IconEye,
  IconLoader2,
  IconPrinter,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Report, ReportStatus } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface RapportToolbarProps {
  report: Report | null;
  onStatusChange?: (status: ReportStatus) => void;
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  isSaving?: boolean;
  autosaveStatus?: "idle" | "saving" | "saved" | "error";
  isArchived?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS: {
  value: ReportStatus;
  label: string;
  description: string;
}[] = [
  { value: "draft", label: "Utkast", description: "Arbete pågår" },
  { value: "review", label: "Granskning", description: "Redo för granskning" },
  { value: "approved", label: "Godkänd", description: "Redo för export" },
];

const STATUS_STYLES: Record<ReportStatus, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

// ============================================================================
// Component
// ============================================================================

export function RapportToolbar({
  report,
  onStatusChange,
  onSave,
  onPreview,
  onExport,
  onPrint,
  onDuplicate,
  onDelete,
  onShare,
  onEdit,
  isSaving = false,
  autosaveStatus = "idle",
  isArchived = false,
  className,
}: RapportToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!report) {
    return null;
  }

  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = (value: string) => {
    onStatusChange?.(value as ReportStatus);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3",
          className,
        )}
      >
        {/* Left side - Status & Autosave */}
        <div className="flex items-center gap-3">
          {/* Status Selector */}
          {!isArchived && onStatusChange && (
            <Select value={report.status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={cn(
                  "h-8 w-auto gap-2 rounded-full border px-3 text-xs font-medium",
                  STATUS_STYLES[report.status],
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Archived badge */}
          {isArchived && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              <IconCheck className="mr-1 size-3" />
              Arkiverad
            </Badge>
          )}

          {/* Autosave Status */}
          <AutosaveIndicator status={autosaveStatus} />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Edit Button (for archived) */}
          {isArchived && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <IconEdit className="mr-2 size-4" />
                  Redigera
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skapa en kopia för redigering</TooltipContent>
            </Tooltip>
          )}

          {/* Save Button */}
          {!isArchived && onSave && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconDeviceFloppy className="mr-2 size-4" />
                  )}
                  Spara
                </Button>
              </TooltipTrigger>
              <TooltipContent>Spara ändringar (Ctrl+S)</TooltipContent>
            </Tooltip>
          )}

          {/* Preview Button */}
          {onPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onPreview}>
                  <IconEye className="mr-2 size-4" />
                  Förhandsgranska
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visa PDF-förhandsgranskning</TooltipContent>
            </Tooltip>
          )}

          {/* Export Button */}
          {onExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconDownload className="mr-2 size-4" />
                  )}
                  {isArchived ? "Ladda ner" : "Exportera PDF"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isArchived ? "Ladda ner PDF" : "Exportera och arkivera"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <IconDots className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Fler åtgärder</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {onPrint && (
                <DropdownMenuItem onClick={onPrint}>
                  <IconPrinter className="mr-2 size-4" />
                  Skriv ut
                </DropdownMenuItem>
              )}

              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <IconShare className="mr-2 size-4" />
                  Dela rapport
                </DropdownMenuItem>
              )}

              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <IconCopy className="mr-2 size-4" />
                  Duplicera
                </DropdownMenuItem>
              )}

              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="mr-2 size-4" />
                    Ta bort
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Autosave Indicator Sub-component
// ============================================================================

interface AutosaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  if (status === "idle") return null;

  const config = {
    saving: {
      icon: <IconLoader2 className="size-3 animate-spin" />,
      text: "Sparar...",
      className: "text-muted-foreground",
    },
    saved: {
      icon: <IconCheck className="size-3" />,
      text: "Sparat",
      className: "text-emerald-600",
    },
    error: {
      icon: <IconDots className="size-3" />,
      text: "Kunde inte spara",
      className: "text-destructive",
    },
  }[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

export default RapportToolbar;
