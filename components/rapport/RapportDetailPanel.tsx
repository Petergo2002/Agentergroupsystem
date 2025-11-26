"use client";

import {
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconFileText,
  IconMapPin,
  IconPhoto,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report, ReportTemplate } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";
import { RapportToolbar } from "./RapportToolbar";

// ============================================================================
// Types
// ============================================================================

interface RapportDetailPanelProps {
  report: Report | null;
  template: ReportTemplate | null;
  isLoading?: boolean;
  isArchived?: boolean;
  onStatusChange?: (status: Report["status"]) => void;
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  autosaveStatus?: "idle" | "saving" | "saved" | "error";
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  Report["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Utkast",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  review: {
    label: "Granskning",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  approved: {
    label: "Godkänd",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

const PRIORITY_CONFIG: Record<
  Report["metadata"]["priority"],
  { label: string; className: string }
> = {
  high: { label: "Hög", className: "text-red-600 bg-red-50 border-red-200" },
  medium: { label: "Medel", className: "text-amber-600 bg-amber-50 border-amber-200" },
  low: { label: "Låg", className: "text-slate-600 bg-slate-50 border-slate-200" },
};

const TRADE_LABELS: Record<Report["type"], string> = {
  bygg: "Bygg",
  läckage: "Läckage",
  elektriker: "Elektriker",
};

// ============================================================================
// Component
// ============================================================================

export function RapportDetailPanel({
  report,
  template,
  isLoading = false,
  isArchived = false,
  onStatusChange,
  onSave,
  onPreview,
  onExport,
  onDuplicate,
  onDelete,
  autosaveStatus = "idle",
}: RapportDetailPanelProps) {
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!report) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <IconFileText className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Ingen rapport vald</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {isArchived
            ? "Välj en rapport från arkivet för att se detaljer"
            : "Välj en rapport från listan eller skapa en ny för att komma igång"}
        </p>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[report.status];
  const priorityConfig = PRIORITY_CONFIG[report.metadata.priority];
  const completedSections = report.sections.filter((s) => s.status === "completed").length;
  const totalSections = report.sections.length;
  const progressPercent = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const handleEditClick = () => {
    router.push(`/rapport/${report.id}/edit`);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl truncate">{report.title}</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <span>{report.metadata.client}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{TRADE_LABELS[report.type]}</span>
              {report.metadata.projectReference && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{report.metadata.projectReference}</span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("rounded-full", statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("rounded-full", priorityConfig.className)}
            >
              Prioritet: {priorityConfig.label}
            </Badge>
          </div>
        </div>

        {/* Quick meta */}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <IconCalendarEvent className="size-4" />
            {new Date(
              report.metadata.scheduledAt || report.updatedAt
            ).toLocaleDateString("sv-SE", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconUser className="size-4" />
            {report.metadata.assignedTo || "Ej tilldelad"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin className="size-4" />
            {report.metadata.location}
          </span>
        </div>
      </CardHeader>

      {/* Toolbar */}
      <div className="px-6">
        <RapportToolbar
          report={report}
          onStatusChange={onStatusChange}
          onSave={onSave}
          onPreview={onPreview}
          onExport={onExport}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          autosaveStatus={autosaveStatus}
          isArchived={isArchived}
          onEdit={isArchived ? () => onDuplicate?.() : undefined}
        />
      </div>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto space-y-6 pt-6">
        {/* Template Info */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mall
              </p>
              <p className="mt-1 font-semibold">
                {template?.name ?? "Okänd mall"}
              </p>
              <p className="text-sm text-muted-foreground">
                {template?.description ?? "Ingen beskrivning"}
              </p>
            </div>
            {!isArchived && (
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleEditClick}
              >
                <IconEdit className="size-4" />
                Redigera
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        {!isArchived && (
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Framsteg
              </p>
              <span className="text-sm font-medium">
                {completedSections} / {totalSections} sektioner
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="mt-3 flex flex-wrap gap-2">
              {report.sections.map((section) => (
                <Badge
                  key={section.id}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    section.status === "completed"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {section.status === "completed" && (
                    <IconCheck className="mr-1 size-3" />
                  )}
                  {section.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Info */}
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Grunddata
            </p>
            <Separator className="mb-3" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Kund</dt>
                <dd className="font-medium text-right">{report.metadata.client}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Projektreferens</dt>
                <dd className="font-medium text-right">
                  {report.metadata.projectReference || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plats</dt>
                <dd className="font-medium text-right">{report.metadata.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Senast uppdaterad</dt>
                <dd className="font-medium text-right">
                  {new Date(report.updatedAt).toLocaleString("sv-SE")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status & Responsibility */}
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Status & ansvar
            </p>
            <Separator className="mb-3" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ansvarig</dt>
                <dd className="font-medium text-right">
                  {report.metadata.assignedTo || "Ej tilldelad"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd className="font-medium text-right">
                  {report.metadata.dueAt
                    ? new Date(report.metadata.dueAt).toLocaleDateString("sv-SE")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prioritet</dt>
                <dd className="font-medium text-right">{priorityConfig.label}</dd>
              </div>
              {report.exportedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Exporterad</dt>
                  <dd className="font-medium text-right text-emerald-600">
                    {new Date(report.exportedAt).toLocaleDateString("sv-SE")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Översikt
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Sektioner"
              value={report.sections.length}
              icon={<IconFileText className="size-4" />}
            />
            <StatCard
              label="Ifyllda"
              value={completedSections}
              icon={<IconCheck className="size-4" />}
              highlight={completedSections === totalSections && totalSections > 0}
            />
            <StatCard
              label="Checklistor"
              value={report.checklist.length}
              icon={<IconCheck className="size-4" />}
            />
            <StatCard
              label="Bilagor"
              value={report.assets.length}
              icon={<IconPhoto className="size-4" />}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full gap-2"
            onClick={onPreview}
          >
            <IconFileText className="size-4" />
            Förhandsgranska rapport
          </Button>
          {isArchived && onDelete && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={onDelete}
            >
              <IconPhoto className="size-4" />
              Ta bort rapport
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Stat Card Sub-component
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-center",
        highlight && "border-emerald-200 bg-emerald-50"
      )}
    >
      <div
        className={cn(
          "mx-auto mb-1 flex size-8 items-center justify-center rounded-full",
          highlight ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <p className={cn("text-2xl font-bold", highlight && "text-emerald-600")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default RapportDetailPanel;
