"use client";

import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconLoader2,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rapportApi } from "@/lib/rapport/rapportApi";
import type {
  Report,
  ReportMetadata,
  ReportSectionInstance,
  ReportStatus,
} from "@/lib/types/rapport";
import { MetadataPanel } from "./MetadataPanel";
import SectionEditor from "./SectionEditor";
import { SectionNav } from "./SectionNav";

// ============================================================================
// Types
// ============================================================================

interface ReportEditorProps {
  reportId: string;
}

// ============================================================================
// Component
// ============================================================================

export function ReportEditor({ reportId }: ReportEditorProps) {
  const router = useRouter();

  // State
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for autosave
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<Report> | null>(null);

  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        const data = await rapportApi.getReport(reportId);
        if (data) {
          setReport(data);
          // Set first non-basic_info section as active
          if (data.sections.length > 0 && !activeSectionId) {
            const firstSection = data.sections.find(
              (s) =>
                s.type !== "basic_info" &&
                !s.title.toLowerCase().includes("grundinformation"),
            );
            if (firstSection) {
              setActiveSectionId(firstSection.id);
            }
          }
        } else {
          toast.error("Rapporten hittades inte");
          router.push("/rapport");
        }
      } catch (error) {
        console.error("Failed to load report", error);
        toast.error("Kunde inte ladda rapporten");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId, router]);

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------

  const triggerAutosave = useCallback(() => {
    if (!report || !pendingChangesRef.current) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout (2 seconds debounce)
    autosaveTimeoutRef.current = setTimeout(async () => {
      const changes = pendingChangesRef.current;
      if (!changes) return;

      try {
        setAutosaveStatus("saving");
        await rapportApi.updateReport(report.id, changes);
        setAutosaveStatus("saved");
        setHasUnsavedChanges(false);
        pendingChangesRef.current = null;

        // Reset status after 2 seconds
        setTimeout(() => setAutosaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Autosave failed", error);
        setAutosaveStatus("error");
      }
    }, 2000);
  }, [report]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // -------------------------------------------------------------------------
  // Update Handlers
  // -------------------------------------------------------------------------

  const updateReport = useCallback(
    (updates: Partial<Report>) => {
      if (!report) return;

      setReport((prev) => (prev ? { ...prev, ...updates } : prev));
      setHasUnsavedChanges(true);
      pendingChangesRef.current = { ...pendingChangesRef.current, ...updates };
      triggerAutosave();
    },
    [report, triggerAutosave],
  );

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<ReportSectionInstance>) => {
      if (!report) return;

      const newSections = report.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s,
      );
      updateReport({ sections: newSections });
    },
    [report, updateReport],
  );

  // Update assets
  const updateAssets = useCallback(
    (assets: Report["assets"]) => {
      updateReport({ assets });
    },
    [updateReport],
  );

  const updateMetadata = useCallback(
    (updates: Partial<ReportMetadata>) => {
      if (!report) return;
      updateReport({ metadata: { ...report.metadata, ...updates } });
    },
    [report, updateReport],
  );

  const updateStatus = useCallback(
    (status: ReportStatus) => {
      updateReport({ status });
    },
    [updateReport],
  );

  // -------------------------------------------------------------------------
  // Section Actions
  // -------------------------------------------------------------------------

  const activeSection = useMemo(
    () => report?.sections.find((s) => s.id === activeSectionId) ?? null,
    [report, activeSectionId],
  );

  const activeSectionIndex = useMemo(
    () => report?.sections.findIndex((s) => s.id === activeSectionId) ?? -1,
    [report, activeSectionId],
  );

  const goToPreviousSection = useCallback(() => {
    if (!report || activeSectionIndex <= 0) return;
    setActiveSectionId(report.sections[activeSectionIndex - 1]?.id ?? null);
  }, [report, activeSectionIndex]);

  const goToNextSection = useCallback(() => {
    if (!report || activeSectionIndex >= report.sections.length - 1) return;
    setActiveSectionId(report.sections[activeSectionIndex + 1]?.id ?? null);
  }, [report, activeSectionIndex]);

  const toggleSectionComplete = useCallback(() => {
    if (!activeSection) return;
    updateSection(activeSection.id, {
      status: activeSection.status === "completed" ? "pending" : "completed",
    });
  }, [activeSection, updateSection]);

  // -------------------------------------------------------------------------
  // Save & Export
  // -------------------------------------------------------------------------

  const handleManualSave = useCallback(async () => {
    if (!report) return;

    try {
      setIsSaving(true);
      await rapportApi.updateReport(report.id, report);
      setHasUnsavedChanges(false);
      pendingChangesRef.current = null;
      toast.success("Rapport sparad");
    } catch (error) {
      console.error("Failed to save report", error);
      toast.error("Kunde inte spara rapporten");
    } finally {
      setIsSaving(false);
    }
  }, [report]);

  const handleExport = useCallback(async () => {
    if (!report) return;

    try {
      setIsExporting(true);

      // Save first
      await rapportApi.updateReport(report.id, report);

      // Export
      await rapportApi.exportReport(report);

      toast.success("Rapport exporterad!");
      router.push("/rapport?tab=saved");
    } catch (error) {
      console.error("Failed to export report", error);
      toast.error("Kunde inte exportera rapporten");
    } finally {
      setIsExporting(false);
    }
  }, [report, router]);

  const _handlePreview = useCallback(() => {
    if (!report) return;
    rapportApi.openPdf(report.id);
  }, [report]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!confirm("Du har osparade ändringar. Vill du lämna ändå?")) {
        return;
      }
    }
    router.push("/rapport");
  }, [hasUnsavedChanges, router]);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Rapporten hittades inte</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <IconArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{report.title}</h1>
            <p className="text-sm text-muted-foreground">
              {report.metadata.client} · {report.metadata.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600">Osparade ändringar</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="mr-2 size-4" />
            )}
            Spara
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section navigation - filter out basic_info since it's in sidebar */}
        <div className="w-64 shrink-0">
          <SectionNav
            sections={report.sections.filter(
              (s) =>
                s.type !== "basic_info" &&
                !s.title.toLowerCase().includes("grundinformation"),
            )}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
          />
        </div>

        {/* Center: Section editor */}
        <div className="flex-1 overflow-hidden">
          {activeSection ? (
            <SectionEditor
              section={activeSection}
              onChange={(updates) => updateSection(activeSection.id, updates)}
              onMarkComplete={toggleSectionComplete}
              onPrevious={goToPreviousSection}
              onNext={goToNextSection}
              hasPrevious={activeSectionIndex > 0}
              hasNext={activeSectionIndex < report.sections.length - 1}
              report={report}
              assets={report.assets}
              onAssetsChange={updateAssets}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Välj en sektion att redigera
            </div>
          )}
        </div>

        {/* Right: Metadata panel */}
        <div className="w-80 shrink-0">
          <MetadataPanel
            report={report}
            onMetadataChange={updateMetadata}
            onStatusChange={updateStatus}
            onExport={handleExport}
            onAssetsChange={updateAssets}
            isExporting={isExporting}
            autosaveStatus={autosaveStatus}
          />
        </div>
      </div>
    </div>
  );
}

export default ReportEditor;
