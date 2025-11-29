/**
 * useRapportData Hook
 *
 * En kraftfull hook för att hantera all rapportdata med:
 * - Automatisk datahämtning och caching
 * - Filtrering och sökning
 * - Autosave-funktionalitet
 * - Optimistiska uppdateringar
 * - Felhantering
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  fetchReportSections,
  fetchReports,
  fetchReportTemplates,
  useReportSectionsStore,
  useReportsStore,
  useReportTemplatesStore,
} from "@/lib/store";
import type {
  Report,
  ReportSectionDefinition,
  ReportTemplate,
} from "@/lib/types/rapport";
import {
  type ReportFilter,
  type ReportSortOptions,
  rapportApi,
} from "./rapportApi";

// ============================================================================
// Types
// ============================================================================

export interface UseRapportDataOptions {
  /** Automatisk hämtning vid mount */
  autoFetch?: boolean;
  /** Initialt filter */
  initialFilter?: ReportFilter;
  /** Initial sortering */
  initialSort?: ReportSortOptions;
  /** Autosave-intervall i ms (0 = av) */
  autosaveInterval?: number;
  /** Callback vid fel */
  onError?: (error: Error) => void;
}

export interface UseRapportDataReturn {
  // Data
  reports: Report[];
  templates: ReportTemplate[];
  sections: ReportSectionDefinition[];

  // Filtrerade rapporter
  filteredReports: Report[];
  draftReports: Report[];
  archivedReports: Report[];

  // Loading states
  isLoading: boolean;
  isLoadingReports: boolean;
  isLoadingTemplates: boolean;
  isLoadingSections: boolean;
  isInitialized: boolean;

  // Selected report
  selectedReport: Report | null;
  selectedTemplate: ReportTemplate | null;
  selectReport: (id: string | null) => void;

  // Filter & Search
  filter: ReportFilter;
  setFilter: (filter: ReportFilter) => void;
  updateFilter: (updates: Partial<ReportFilter>) => void;
  clearFilter: () => void;
  search: string;
  setSearch: (search: string) => void;

  // Sort
  sort: ReportSortOptions;
  setSort: (sort: ReportSortOptions) => void;

  // CRUD Operations
  createReport: (
    input: Parameters<typeof rapportApi.createReport>[0],
  ) => Promise<Report>;
  updateReport: (
    id: string,
    updates: Parameters<typeof rapportApi.updateReport>[1],
  ) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  duplicateReport: (id: string, newTitle?: string) => Promise<Report>;

  // Export
  exportReport: (report: Report, customerEmail?: string) => Promise<Report>;
  openPdf: (reportId: string) => void;

  // Autosave
  autosaveStatus: "idle" | "saving" | "saved" | "error";
  triggerAutosave: () => void;

  // Refresh
  refresh: () => Promise<void>;

  // Statistics
  statistics: {
    total: number;
    drafts: number;
    inReview: number;
    approved: number;
    exported: number;
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRapportData(
  options: UseRapportDataOptions = {},
): UseRapportDataReturn {
  const {
    autoFetch = true,
    initialFilter = {},
    initialSort = { field: "updatedAt", direction: "desc" },
    autosaveInterval = 0,
    onError,
  } = options;

  // Zustand stores (selector-baserade för att minska onödiga re-renders)
  const reports = useReportsStore((state) => state.reports);
  const reportsLoading = useReportsStore((state) => state.loading);
  const reportsInitialized = useReportsStore((state) => state.initialized);
  const setReports = useReportsStore((state) => state.setReports);
  const setReportsLoading = useReportsStore((state) => state.setLoading);
  const _upsertReport = useReportsStore((state) => state.upsertReport);

  const templates = useReportTemplatesStore((state) => state.templates);
  const templatesLoading = useReportTemplatesStore((state) => state.loading);
  const templatesInitialized = useReportTemplatesStore(
    (state) => state.initialized,
  );
  const setTemplates = useReportTemplatesStore((state) => state.setTemplates);
  const setTemplatesLoading = useReportTemplatesStore(
    (state) => state.setLoading,
  );

  const sections = useReportSectionsStore((state) => state.sections);
  const sectionsLoading = useReportSectionsStore((state) => state.loading);
  const sectionsInitialized = useReportSectionsStore(
    (state) => state.initialized,
  );
  const setSections = useReportSectionsStore((state) => state.setSections);
  const setSectionsLoading = useReportSectionsStore(
    (state) => state.setLoading,
  );

  // Local state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportFilter>(initialFilter);
  const [sort, setSort] = useState<ReportSortOptions>(initialSort);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Refs for autosave
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<{
    id: string;
    updates: Partial<Report>;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------------------

  const loadReports = useCallback(async () => {
    if (reportsInitialized) return;

    try {
      setReportsLoading(true);
      const data = await fetchReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      onError?.(error as Error);
    } finally {
      setReportsLoading(false);
    }
  }, [reportsInitialized, setReports, setReportsLoading, onError]);

  const loadTemplates = useCallback(async () => {
    if (templatesInitialized) return;

    try {
      setTemplatesLoading(true);
      const data = await fetchReportTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates", error);
      onError?.(error as Error);
    } finally {
      setTemplatesLoading(false);
    }
  }, [templatesInitialized, setTemplates, setTemplatesLoading, onError]);

  const loadSections = useCallback(async () => {
    if (sectionsInitialized) return;

    try {
      setSectionsLoading(true);
      const data = await fetchReportSections();
      setSections(data);
    } catch (error) {
      console.error("Failed to fetch sections", error);
      onError?.(error as Error);
    } finally {
      setSectionsLoading(false);
    }
  }, [sectionsInitialized, setSections, setSectionsLoading, onError]);

  const refresh = useCallback(async () => {
    try {
      setReportsLoading(true);
      setTemplatesLoading(true);
      setSectionsLoading(true);

      const [reportsData, templatesData, sectionsData] = await Promise.all([
        fetchReports(),
        fetchReportTemplates(),
        fetchReportSections(),
      ]);

      setReports(reportsData);
      setTemplates(templatesData);
      setSections(sectionsData);
    } catch (error) {
      console.error("Failed to refresh data", error);
      onError?.(error as Error);
      toast.error("Kunde inte uppdatera data");
    } finally {
      setReportsLoading(false);
      setTemplatesLoading(false);
      setSectionsLoading(false);
    }
  }, [
    setReports,
    setTemplates,
    setSections,
    setReportsLoading,
    setTemplatesLoading,
    setSectionsLoading,
    onError,
  ]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      loadReports();
      loadTemplates();
      loadSections();
    }
  }, [autoFetch, loadReports, loadTemplates, loadSections]);

  // -------------------------------------------------------------------------
  // Filtering & Sorting (A3: Optimerade med tidig retur)
  // -------------------------------------------------------------------------

  const filteredReports = useMemo(() => {
    // A3: Tidig retur om inga rapporter
    if (reports.length === 0) return [];

    // A3: Tidig retur om default filter/sort (ingen filtrering behövs)
    const isDefaultFilter =
      !filter.search && !filter.status && !filter.templateId;
    const isDefaultSort =
      sort.field === "updatedAt" && sort.direction === "desc";

    if (isDefaultFilter && isDefaultSort) {
      // Rapporter är redan sorterade efter updatedAt desc från API
      return reports;
    }

    let result = rapportApi.applyFilter(reports, filter);
    result = rapportApi.applySort(result, sort);
    return result;
  }, [reports, filter, sort]);

  const draftReports = useMemo(() => {
    // A3: Tidig retur om inga rapporter
    if (reports.length === 0) return [];
    return reports.filter((r) => !r.exportedAt);
  }, [reports]);

  const archivedReports = useMemo(() => {
    // A3: Tidig retur om inga rapporter
    if (reports.length === 0) return [];
    return reports.filter((r) => !!r.exportedAt);
  }, [reports]);

  const updateFilter = useCallback((updates: Partial<ReportFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search }));
  }, []);

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const selectedTemplate = useMemo(
    () =>
      selectedReport
        ? (templates.find((t) => t.id === selectedReport.templateId) ?? null)
        : null,
    [selectedReport, templates],
  );

  const selectReport = useCallback((id: string | null) => {
    setSelectedReportId(id);
  }, []);

  // Auto-select first report if none selected
  useEffect(() => {
    if (!selectedReportId && filteredReports.length > 0) {
      setSelectedReportId(filteredReports[0]?.id ?? null);
    } else if (selectedReportId) {
      // Verify selected report still exists
      const exists = reports.some((r) => r.id === selectedReportId);
      if (!exists && filteredReports.length > 0) {
        setSelectedReportId(filteredReports[0]?.id ?? null);
      } else if (!exists) {
        setSelectedReportId(null);
      }
    }
  }, [selectedReportId, filteredReports, reports]);

  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------

  const createReport = useCallback(
    async (input: Parameters<typeof rapportApi.createReport>[0]) => {
      try {
        const created = await rapportApi.createReport(input);
        setSelectedReportId(created.id);
        toast.success("Rapport skapad");
        return created;
      } catch (error) {
        console.error("Failed to create report", error);
        toast.error("Kunde inte skapa rapport");
        throw error;
      }
    },
    [],
  );

  const updateReport = useCallback(
    async (
      id: string,
      updates: Parameters<typeof rapportApi.updateReport>[1],
    ) => {
      try {
        const updated = await rapportApi.updateReport(id, updates);
        return updated;
      } catch (error) {
        console.error("Failed to update report", error);
        toast.error("Kunde inte uppdatera rapport");
        throw error;
      }
    },
    [],
  );

  const deleteReport = useCallback(
    async (id: string) => {
      try {
        await rapportApi.deleteReport(id);
        if (selectedReportId === id) {
          setSelectedReportId(null);
        }
        toast.success("Rapport borttagen");
      } catch (error) {
        console.error("Failed to delete report", error);
        toast.error("Kunde inte ta bort rapport");
        throw error;
      }
    },
    [selectedReportId],
  );

  const duplicateReport = useCallback(async (id: string, newTitle?: string) => {
    try {
      const duplicated = await rapportApi.duplicateReport(id, newTitle);
      setSelectedReportId(duplicated.id);
      toast.success("Rapport duplicerad");
      return duplicated;
    } catch (error) {
      console.error("Failed to duplicate report", error);
      toast.error("Kunde inte duplicera rapport");
      throw error;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------

  const exportReport = useCallback(
    async (report: Report, customerEmail?: string) => {
      try {
        const exported = await rapportApi.exportReport(report, customerEmail);
        toast.success("Rapport exporterad och arkiverad");
        return exported;
      } catch (error) {
        console.error("Failed to export report", error);
        toast.error("Kunde inte exportera rapport");
        throw error;
      }
    },
    [],
  );

  const openPdf = useCallback((reportId: string) => {
    rapportApi.openPdf(reportId);
  }, []);

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------

  const triggerAutosave = useCallback(() => {
    if (!autosaveInterval || !pendingChangesRef.current) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout
    autosaveTimeoutRef.current = setTimeout(async () => {
      const pending = pendingChangesRef.current;
      if (!pending) return;

      try {
        setAutosaveStatus("saving");
        await rapportApi.updateReport(
          pending.id,
          pending.updates as Parameters<typeof rapportApi.updateReport>[1],
        );
        setAutosaveStatus("saved");
        pendingChangesRef.current = null;

        // Reset status after 2 seconds
        setTimeout(() => setAutosaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Autosave failed", error);
        setAutosaveStatus("error");
      }
    }, autosaveInterval);
  }, [autosaveInterval]);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Statistics
  // -------------------------------------------------------------------------

  const statistics = useMemo(
    () => ({
      total: reports.length,
      drafts: reports.filter((r) => r.status === "draft").length,
      inReview: reports.filter((r) => r.status === "review").length,
      approved: reports.filter((r) => r.status === "approved").length,
      exported: reports.filter((r) => !!r.exportedAt).length,
    }),
    [reports],
  );

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // Data
    reports,
    templates,
    sections,

    // Filtered reports
    filteredReports,
    draftReports,
    archivedReports,

    // Loading states
    isLoading: reportsLoading || templatesLoading || sectionsLoading,
    isLoadingReports: reportsLoading,
    isLoadingTemplates: templatesLoading,
    isLoadingSections: sectionsLoading,
    isInitialized:
      reportsInitialized && templatesInitialized && sectionsInitialized,

    // Selected report
    selectedReport,
    selectedTemplate,
    selectReport,

    // Filter & Search
    filter,
    setFilter,
    updateFilter,
    clearFilter,
    search: filter.search ?? "",
    setSearch,

    // Sort
    sort,
    setSort,

    // CRUD Operations
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,

    // Export
    exportReport,
    openPdf,

    // Autosave
    autosaveStatus,
    triggerAutosave,

    // Refresh
    refresh,

    // Statistics
    statistics,
  };
}

export default useRapportData;
