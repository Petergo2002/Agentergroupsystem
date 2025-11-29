import { create } from "zustand";
import type {
  Report,
  ReportSectionDefinition,
  ReportSummary,
  ReportTemplate,
} from "@/lib/types/rapport";

// ============================================================================
// Types
// ============================================================================

interface ReportsStore {
  reports: Report[];
  loading: boolean;
  initialized: boolean;
  setReports: (reports: Report[]) => void;
  upsertReport: (report: Report) => void;
  removeReport: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

interface ReportTemplatesStore {
  templates: ReportTemplate[];
  loading: boolean;
  initialized: boolean;
  setTemplates: (templates: ReportTemplate[]) => void;
  upsertTemplate: (template: ReportTemplate) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

interface ReportSectionsStore {
  sections: ReportSectionDefinition[];
  loading: boolean;
  initialized: boolean;
  setSections: (sections: ReportSectionDefinition[]) => void;
  addSection: (section: ReportSectionDefinition) => void;
  updateSection: (id: string, section: ReportSectionDefinition) => void;
  removeSection: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

// ============================================================================
// Stores
// ============================================================================

export const useReportsStore = create<ReportsStore>((set) => ({
  reports: [],
  loading: false,
  initialized: false,
  setReports: (reports) => set({ reports, initialized: true }),
  upsertReport: (report) =>
    set((state) => {
      const exists = state.reports.some((item) => item.id === report.id);
      if (exists) {
        return {
          reports: state.reports.map((item) =>
            item.id === report.id ? report : item,
          ),
          initialized: true,
        };
      }
      return { reports: [report, ...state.reports], initialized: true };
    }),
  removeReport: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

export const useReportTemplatesStore = create<ReportTemplatesStore>((set) => ({
  templates: [],
  loading: false,
  initialized: false,
  setTemplates: (templates) => set({ templates, initialized: true }),
  upsertTemplate: (template) =>
    set((state) => {
      const exists = state.templates.some((item) => item.id === template.id);
      if (exists) {
        return {
          templates: state.templates.map((item) =>
            item.id === template.id ? template : item,
          ),
          initialized: true,
        };
      }
      return { templates: [template, ...state.templates], initialized: true };
    }),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

export const useReportSectionsStore = create<ReportSectionsStore>((set) => ({
  sections: [],
  loading: false,
  initialized: false,
  setSections: (sections) => set({ sections, initialized: true }),
  addSection: (section) =>
    set((state) => ({
      sections: [section, ...state.sections],
      initialized: true,
    })),
  updateSection: (id, section) =>
    set((state) => ({
      sections: state.sections.map((item) => (item.id === id ? section : item)),
      initialized: true,
    })),
  removeSection: (id) =>
    set((state) => ({
      sections: state.sections.filter((section) => section.id !== id),
      initialized: true,
    })),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

// ============================================================================
// Selectors (A1 - Performance Optimization)
// ============================================================================

// Reports selectors
export const useReports = () => useReportsStore((state) => state.reports);
export const useReportsLoading = () =>
  useReportsStore((state) => state.loading);
export const useReportsInitialized = () =>
  useReportsStore((state) => state.initialized);
export const useReportById = (id: string | null) =>
  useReportsStore((state) =>
    id ? (state.reports.find((r) => r.id === id) ?? null) : null,
  );

// Templates selectors
export const useTemplates = () =>
  useReportTemplatesStore((state) => state.templates);
export const useTemplatesLoading = () =>
  useReportTemplatesStore((state) => state.loading);
export const useTemplatesInitialized = () =>
  useReportTemplatesStore((state) => state.initialized);
export const useTemplateById = (id: string | null) =>
  useReportTemplatesStore((state) =>
    id ? (state.templates.find((t) => t.id === id) ?? null) : null,
  );

// Sections selectors
export const useSections = () =>
  useReportSectionsStore((state) => state.sections);
export const useSectionsLoading = () =>
  useReportSectionsStore((state) => state.loading);
export const useSectionsInitialized = () =>
  useReportSectionsStore((state) => state.initialized);
export const useSectionById = (id: string | null) =>
  useReportSectionsStore((state) =>
    id ? (state.sections.find((s) => s.id === id) ?? null) : null,
  );

// ============================================================================
// A6: Tunn Reports Summary Store (för listning utan tung data)
// ============================================================================

interface ReportSummaryStore {
  summaries: ReportSummary[];
  loading: boolean;
  initialized: boolean;
  setSummaries: (summaries: ReportSummary[]) => void;
  upsertSummary: (summary: ReportSummary) => void;
  removeSummary: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

/**
 * A6: Tunn store för rapportlistning.
 * Innehåller endast metadata som behövs för listning och filtrering.
 * Sektioner, assets och checklist laddas on-demand via useReportsStore.
 */
export const useReportSummaryStore = create<ReportSummaryStore>((set) => ({
  summaries: [],
  loading: false,
  initialized: false,
  setSummaries: (summaries) => set({ summaries, initialized: true }),
  upsertSummary: (summary) =>
    set((state) => {
      const exists = state.summaries.some((item) => item.id === summary.id);
      if (exists) {
        return {
          summaries: state.summaries.map((item) =>
            item.id === summary.id ? summary : item,
          ),
          initialized: true,
        };
      }
      return { summaries: [summary, ...state.summaries], initialized: true };
    }),
  removeSummary: (id) =>
    set((state) => ({
      summaries: state.summaries.filter((s) => s.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

// A6: Summary selectors
export const useReportSummaries = () =>
  useReportSummaryStore((state) => state.summaries);
export const useReportSummaryById = (id: string | null) =>
  useReportSummaryStore((state) =>
    id ? (state.summaries.find((s) => s.id === id) ?? null) : null,
  );
