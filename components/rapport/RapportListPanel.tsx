"use client";

import {
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconFilter,
  IconMapPin,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report, ReportStatus } from "@/lib/types/rapport";
import type { ReportFilter, ReportSortOptions } from "@/lib/rapport/rapportApi";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface RapportListPanelProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
  sort: ReportSortOptions;
  onSortChange: (sort: ReportSortOptions) => void;
  isLoading?: boolean;
  showArchived?: boolean;
  title?: string;
  description?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; className: string; dotColor: string }
> = {
  draft: {
    label: "Utkast",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dotColor: "bg-amber-500",
  },
  review: {
    label: "Granskning",
    className: "border-blue-200 bg-blue-50 text-blue-800",
    dotColor: "bg-blue-500",
  },
  approved: {
    label: "Godkänd",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotColor: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<
  Report["metadata"]["priority"],
  { label: string; className: string }
> = {
  high: { label: "Hög", className: "text-red-600" },
  medium: { label: "Medel", className: "text-amber-600" },
  low: { label: "Låg", className: "text-slate-500" },
};

const SORT_OPTIONS: { field: ReportSortOptions["field"]; label: string }[] = [
  { field: "updatedAt", label: "Senast uppdaterad" },
  { field: "createdAt", label: "Skapad" },
  { field: "title", label: "Titel" },
  { field: "client", label: "Kund" },
  { field: "priority", label: "Prioritet" },
  { field: "status", label: "Status" },
];

const QUICK_FILTERS = [
  { key: "all", label: "Alla" },
  { key: "draft", label: "Utkast" },
  { key: "review", label: "Granskning" },
  { key: "approved", label: "Godkända" },
  { key: "high-priority", label: "Hög prioritet" },
] as const;

// ============================================================================
// Component
// ============================================================================

export function RapportListPanel({
  reports,
  selectedReportId,
  onSelectReport,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  isLoading = false,
  showArchived = false,
  title = "Rapporter",
  description = "Filtrera på kund, ort eller status",
}: RapportListPanelProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("all");

  // Handle search
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filter, search: value || undefined });
  };

  // Handle quick filter
  const handleQuickFilter = (key: string) => {
    setActiveQuickFilter(key);
    
    let newFilter: ReportFilter = { ...filter };
    
    // Clear status and priority filters first
    delete newFilter.status;
    delete newFilter.priority;
    
    switch (key) {
      case "draft":
        newFilter.status = "draft";
        break;
      case "review":
        newFilter.status = "review";
        break;
      case "approved":
        newFilter.status = "approved";
        break;
      case "high-priority":
        newFilter.priority = "high";
        break;
      // "all" - no additional filters
    }
    
    onFilterChange(newFilter);
  };

  // Handle sort change
  const handleSortFieldChange = (field: ReportSortOptions["field"]) => {
    onSortChange({ ...sort, field });
  };

  const toggleSortDirection = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === "asc" ? "desc" : "asc",
    });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.status) count++;
    if (filter.priority) count++;
    if (filter.client) count++;
    if (filter.location) count++;
    if (filter.assignedTo) count++;
    if (filter.dateFrom || filter.dateTo) count++;
    return count;
  }, [filter]);

  // Clear all filters
  const clearFilters = () => {
    setActiveQuickFilter("all");
    onFilterChange({ search: filter.search });
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full tabular-nums">
            {reports.length} st
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pb-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Sök kund, projekt, plats..."
                className="pl-10 pr-8"
                value={filter.search ?? ""}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {filter.search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  {sort.direction === "asc" ? (
                    <IconSortAscending className="size-4" />
                  ) : (
                    <IconSortDescending className="size-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.field}
                    checked={sort.field === option.field}
                    onCheckedChange={() => handleSortFieldChange(option.field)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sort.direction === "asc"}
                  onCheckedChange={toggleSortDirection}
                >
                  Stigande ordning
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Button */}
            <Button
              variant={activeFilterCount > 0 ? "default" : "outline"}
              size="icon"
              className="shrink-0 relative"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <IconFilter className="size-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map((qf) => (
              <Badge
                key={qf.key}
                variant={activeQuickFilter === qf.key ? "default" : "outline"}
                className="cursor-pointer transition-colors hover:bg-primary/10"
                onClick={() => handleQuickFilter(qf.key)}
              >
                {qf.label}
              </Badge>
            ))}
            {activeFilterCount > 0 && (
              <Badge
                variant="outline"
                className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                onClick={clearFilters}
              >
                <IconX className="mr-1 size-3" />
                Rensa filter
              </Badge>
            )}
          </div>
        </div>

        {/* Report List */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-2">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : reports.length === 0 ? (
              // Empty state
              <div className="rounded-xl border border-dashed p-8 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <IconSearch className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Inga rapporter hittades</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter.search || activeFilterCount > 0
                    ? "Prova att ändra dina filter"
                    : showArchived
                      ? "Arkivet är tomt"
                      : "Skapa din första rapport"}
                </p>
              </div>
            ) : (
              // Report cards
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isSelected={report.id === selectedReportId}
                  onClick={() => onSelectReport(report.id)}
                  showArchived={showArchived}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Report Card Sub-component
// ============================================================================

interface ReportCardProps {
  report: Report;
  isSelected: boolean;
  onClick: () => void;
  showArchived?: boolean;
}

function ReportCard({ report, isSelected, onClick, showArchived }: ReportCardProps) {
  const statusConfig = STATUS_CONFIG[report.status];
  const priorityConfig = PRIORITY_CONFIG[report.metadata.priority];
  const isExported = !!report.exportedAt;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        "hover:border-primary/40 hover:bg-accent/50",
        isSelected && "border-primary bg-primary/5 shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">{report.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground truncate">
            {report.metadata.client}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 rounded-full text-xs", statusConfig.className)}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Meta info */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconMapPin className="size-3.5" />
          {report.metadata.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconCalendarEvent className="size-3.5" />
          {new Date(
            report.metadata.scheduledAt || report.updatedAt
          ).toLocaleDateString("sv-SE")}
        </span>
        {report.metadata.priority === "high" && (
          <span className={cn("inline-flex items-center gap-1 font-medium", priorityConfig.className)}>
            <IconClock className="size-3.5" />
            {priorityConfig.label}
          </span>
        )}
        {isExported && showArchived && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <IconCheck className="size-3.5" />
            Exporterad
          </span>
        )}
      </div>

      {/* Progress indicator */}
      {!showArchived && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Sektioner</span>
            <span>
              {report.sections.filter((s) => s.status === "completed").length} /{" "}
              {report.sections.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${
                  report.sections.length > 0
                    ? (report.sections.filter((s) => s.status === "completed").length /
                        report.sections.length) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

export default RapportListPanel;
