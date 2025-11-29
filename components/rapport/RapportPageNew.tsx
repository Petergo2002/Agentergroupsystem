"use client";

import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRapportData } from "@/lib/rapport/useRapportData";
import { CreateReportWizard } from "./CreateReportWizard";
import { RapportDetailPanel } from "./RapportDetailPanel";
import { RapportListPanel } from "./RapportListPanel";
import { RapportSettingsSimple } from "./rapport-settings-simple";

// ============================================================================
// Types
// ============================================================================

interface RapportPageNewProps {
  initialTab?: "new" | "saved" | "settings";
}

const TABS = [
  {
    key: "new",
    label: "Ny rapport",
    description: "Skapa ny eller fortsätt redigera utkast",
  },
  {
    key: "saved",
    label: "Arkiv",
    description: "Sparade & exporterade rapporter",
  },
  {
    key: "settings",
    label: "Inställningar",
    description: "Mallar & PDF-styling",
  },
] as const;

// ============================================================================
// Component
// ============================================================================

export function RapportPageNew({ initialTab = "new" }: RapportPageNewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const {
    reports,
    templates,
    filteredReports,
    draftReports,
    archivedReports,
    isLoading,
    isLoadingReports,
    selectedReport,
    selectedTemplate,
    selectReport,
    filter,
    setFilter,
    sort,
    setSort,
    updateReport,
    deleteReport,
    duplicateReport,
    exportReport,
    openPdf,
    autosaveStatus,
    statistics,
  } = useRapportData();

  // Get reports based on active tab
  const _displayReports =
    activeTab === "saved" ? archivedReports : draftReports;

  // Filter selectedReport to only show if it belongs to current tab
  const filteredSelectedReport = useMemo(() => {
    if (!selectedReport) return null;

    if (activeTab === "saved") {
      // Only show if report is in archived list
      return archivedReports.some((r) => r.id === selectedReport.id)
        ? selectedReport
        : null;
    } else {
      // Only show if report is in draft list
      return draftReports.some((r) => r.id === selectedReport.id)
        ? selectedReport
        : null;
    }
  }, [selectedReport, activeTab, archivedReports, draftReports]);

  // Handle tab change - clear selection when switching tabs
  const handleTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab);
      selectReport(null); // Clear selection when switching tabs
    },
    [selectReport],
  );

  // Handle status change
  const handleStatusChange = useCallback(
    async (status: "draft" | "review" | "approved") => {
      if (!selectedReport) return;
      try {
        await updateReport(selectedReport.id, { status });
        toast.success(
          `Status ändrad till ${status === "draft" ? "Utkast" : status === "review" ? "Granskning" : "Godkänd"}`,
        );
      } catch (_error) {
        // Error handled in hook
      }
    },
    [selectedReport, updateReport],
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!selectedReport) return;
    try {
      await updateReport(selectedReport.id, {});
      toast.success("Rapport sparad");
    } catch (_error) {
      // Error handled in hook
    }
  }, [selectedReport, updateReport]);

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!selectedReport) return;
    openPdf(selectedReport.id);
  }, [selectedReport, openPdf]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!selectedReport) return;
    try {
      await exportReport(selectedReport);
      router.push("/rapport?tab=saved");
    } catch (_error) {
      // Error handled in hook
    }
  }, [selectedReport, exportReport, router]);

  // Handle duplicate
  const handleDuplicate = useCallback(async () => {
    if (!selectedReport) return;
    try {
      const duplicated = await duplicateReport(selectedReport.id);
      setActiveTab("new");
      selectReport(duplicated.id);
    } catch (_error) {
      // Error handled in hook
    }
  }, [selectedReport, duplicateReport, selectReport]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedReport) return;
    if (
      !confirm(`Är du säker på att du vill ta bort "${selectedReport.title}"?`)
    )
      return;
    try {
      await deleteReport(selectedReport.id);
    } catch (_error) {
      // Error handled in hook
    }
  }, [selectedReport, deleteReport]);

  // Handle create new report
  const handleCreateNew = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  // Handle wizard created
  const handleWizardCreated = useCallback(
    (reportId: string) => {
      router.push(`/rapport/${reportId}/edit`);
    },
    [router],
  );

  // Get subtitle based on active tab
  const subtitle = TABS.find((tab) => tab.key === activeTab)?.description ?? "";

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rapporter</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Statistics badges */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                {statistics.drafts} utkast
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                {statistics.inReview} granskning
              </span>
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                {statistics.exported} arkiverade
              </span>
            </div>
            {activeTab !== "settings" && (
              <Button onClick={handleCreateNew} className="gap-2">
                <IconPlus className="size-4" />
                Ny rapport
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col min-h-0"
      >
        <div className="border-b px-6">
          <TabsList className="h-12 w-full justify-start gap-1 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                {tab.label}
                {tab.key === "new" && statistics.drafts > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {statistics.drafts}
                  </span>
                )}
                {tab.key === "saved" && statistics.exported > 0 && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    {statistics.exported}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* New Reports Tab */}
        <TabsContent value="new" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full grid gap-6 lg:grid-cols-[380px_1fr]">
            <RapportListPanel
              reports={draftReports}
              selectedReportId={filteredSelectedReport?.id ?? null}
              onSelectReport={selectReport}
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              isLoading={isLoadingReports}
              showArchived={false}
              title="Utkast & pågående"
              description="Rapporter som inte är exporterade"
            />
            <RapportDetailPanel
              report={filteredSelectedReport}
              template={selectedTemplate}
              isLoading={isLoading}
              isArchived={false}
              onStatusChange={handleStatusChange}
              onSave={handleSave}
              onPreview={handlePreview}
              onExport={handleExport}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              autosaveStatus={autosaveStatus}
            />
          </div>
        </TabsContent>

        {/* Saved/Archive Tab */}
        <TabsContent value="saved" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full grid gap-6 lg:grid-cols-[380px_1fr]">
            <RapportListPanel
              reports={archivedReports}
              selectedReportId={filteredSelectedReport?.id ?? null}
              onSelectReport={selectReport}
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              isLoading={isLoadingReports}
              showArchived={true}
              title="Rapportarkiv"
              description="Exporterade och signerade rapporter"
            />
            <RapportDetailPanel
              report={filteredSelectedReport}
              template={selectedTemplate}
              isLoading={isLoading}
              isArchived={true}
              onPreview={handlePreview}
              onExport={handlePreview} // For archived, export = download
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              autosaveStatus="idle"
            />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent
          value="settings"
          className="flex-1 min-h-0 m-0 overflow-auto"
        >
          <RapportSettingsSimple />
        </TabsContent>
      </Tabs>

      {/* Create Report Wizard */}
      <CreateReportWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        templates={templates}
        onCreated={handleWizardCreated}
      />
    </div>
  );
}

export default RapportPageNew;
