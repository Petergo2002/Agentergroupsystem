/**
 * Rapport API Client
 * 
 * Centraliserad API-klient för alla rapportrelaterade operationer.
 * Hanterar CRUD, export, filtrering och caching.
 */

import {
  createReport as storeCreateReport,
  updateReport as storeUpdateReport,
  deleteReport as storeDeleteReport,
  fetchReports as storeFetchReports,
  fetchReportTemplates as storeFetchTemplates,
  fetchReportSections as storeFetchSections,
  exportReportAsPdf as storeExportReport,
  createReportTemplateRecord,
  updateReportTemplateRecord,
  createReportSectionRecord,
  deleteReportSectionRecord,
  useReportsStore,
  useReportTemplatesStore,
  useReportSectionsStore,
} from "@/lib/store";
import type {
  Report,
  ReportTemplate,
  ReportSectionDefinition,
  ReportStatus,
  ReportMetadata,
  ReportSectionInstance,
} from "@/lib/types/rapport";
import { renderTemplate, type TemplateContext } from "./templateEngine";
import { generatePdfHtml, openPdfPreview, type PdfProfile, type PdfViewMode } from "./pdfGenerator";

// ============================================================================
// Types
// ============================================================================

export interface ReportFilter {
  status?: ReportStatus | ReportStatus[];
  search?: string;
  client?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  priority?: ReportMetadata["priority"];
  templateId?: string;
  isExported?: boolean;
  tags?: string[];
}

export interface ReportSortOptions {
  field: "updatedAt" | "createdAt" | "title" | "client" | "status" | "priority";
  direction: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface ReportListResult {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateReportInput {
  title: string;
  templateId: string;
  trade: Report["type"];
  metadata: Partial<ReportMetadata> & { client: string; location: string };
  priority?: ReportMetadata["priority"];
  status?: ReportStatus;
  sections?: Report["sections"];
  checklist?: Report["checklist"];
  assets?: Report["assets"];
}

export interface UpdateReportInput {
  title?: string;
  status?: ReportStatus;
  metadata?: Partial<ReportMetadata>;
  sections?: Report["sections"];
  checklist?: Report["checklist"];
  assets?: Report["assets"];
}

// ============================================================================
// Rapport API
// ============================================================================

export const rapportApi = {
  // --------------------------------------------------------------------------
  // Reports CRUD
  // --------------------------------------------------------------------------

  /**
   * Hämtar alla rapporter med valfri filtrering, sortering och paginering
   */
  async getReports(
    filter?: ReportFilter,
    sort?: ReportSortOptions,
    pagination?: PaginationOptions
  ): Promise<ReportListResult> {
    // Hämta alla rapporter från store
    let reports = await storeFetchReports();

    // Applicera filter
    if (filter) {
      reports = this.applyFilter(reports, filter);
    }

    // Applicera sortering
    if (sort) {
      reports = this.applySort(reports, sort);
    }

    // Beräkna totalt antal innan paginering
    const total = reports.length;

    // Applicera paginering
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      reports = reports.slice(start, end);
    }

    return {
      reports,
      total,
      page: pagination?.page ?? 1,
      pageSize: pagination?.pageSize ?? total,
      hasMore: pagination
        ? pagination.page * pagination.pageSize < total
        : false,
    };
  },

  /**
   * Hämtar en specifik rapport
   */
  async getReport(id: string): Promise<Report | null> {
    const reports = await storeFetchReports();
    return reports.find((r) => r.id === id) ?? null;
  },

  /**
   * Skapar en ny rapport
   */
  async createReport(input: CreateReportInput): Promise<Report> {
    return storeCreateReport(input);
  },

  /**
   * Uppdaterar en rapport
   */
  async updateReport(id: string, updates: UpdateReportInput): Promise<Report> {
    return storeUpdateReport(id, updates as Partial<Report>);
  },

  /**
   * Tar bort en rapport
   */
  async deleteReport(id: string): Promise<void> {
    return storeDeleteReport(id);
  },

  /**
   * Duplicerar en rapport
   */
  async duplicateReport(id: string, newTitle?: string): Promise<Report> {
    const original = await this.getReport(id);
    if (!original) {
      throw new Error("Rapport hittades inte");
    }

    return this.createReport({
      title: newTitle ?? `${original.title} (kopia)`,
      templateId: original.templateId,
      trade: original.type,
      metadata: { ...original.metadata },
      priority: original.metadata.priority,
      status: "draft",
      sections: original.sections.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        status: "pending",
      })),
      checklist: original.checklist.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        completed: false,
      })),
      assets: [],
    });
  },

  // --------------------------------------------------------------------------
  // Export & Arkivering
  // --------------------------------------------------------------------------

  /**
   * Exporterar en rapport som PDF och arkiverar den.
   * 
   * Flödet:
   * 1. Öppnar PDF i nytt fönster för utskrift/nedladdning
   * 2. Markerar rapporten som exporterad (sätter exportedAt)
   * 3. Sätter status till "approved"
   * 4. Returnerar den uppdaterade rapporten
   */
  async exportReport(
    report: Report,
    customerEmail?: string,
    options?: { viewMode?: PdfViewMode; pdfProfile?: PdfProfile; skipPdfOpen?: boolean }
  ): Promise<Report> {
    // Hämta template och sections för PDF-generering
    const template = await this.getTemplate(report.templateId);
    const sections = await this.getSections();

    // Öppna PDF i nytt fönster (om inte skipPdfOpen är satt)
    if (!options?.skipPdfOpen) {
      openPdfPreview({
        report,
        template,
        sectionDefinitions: sections,
        viewMode: options?.viewMode || "customer",
        pdfProfile: options?.pdfProfile,
      });
    }

    // Arkivera rapporten via store
    return storeExportReport(report, customerEmail);
  },

  /**
   * Exporterar rapport och öppnar PDF, men arkiverar INTE.
   * Användbart för förhandsgranskning innan slutgiltig export.
   */
  async previewReport(
    report: Report,
    options?: { viewMode?: PdfViewMode; pdfProfile?: PdfProfile }
  ): Promise<void> {
    const template = await this.getTemplate(report.templateId);
    const sections = await this.getSections();

    openPdfPreview({
      report,
      template,
      sectionDefinitions: sections,
      viewMode: options?.viewMode || "customer",
      pdfProfile: options?.pdfProfile,
    });
  },

  /**
   * Genererar PDF-URL för en rapport
   */
  getPdfUrl(reportId: string): string {
    return `/api/reports/${reportId}/pdf`;
  },

  /**
   * Öppnar PDF i nytt fönster med nya PDF-generatorn
   */
  async openPdf(
    reportId: string,
    options?: { viewMode?: PdfViewMode; pdfProfile?: PdfProfile }
  ): Promise<void> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error("Rapport hittades inte");
    }

    const template = await this.getTemplate(report.templateId);
    const sections = await this.getSections();

    openPdfPreview({
      report,
      template,
      sectionDefinitions: sections,
      viewMode: options?.viewMode || "customer",
      pdfProfile: options?.pdfProfile,
    });
  },

  /**
   * Genererar PDF HTML för en rapport
   */
  async generatePdfHtml(
    reportId: string,
    options?: { viewMode?: PdfViewMode; pdfProfile?: PdfProfile }
  ): Promise<string> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error("Rapport hittades inte");
    }

    const template = await this.getTemplate(report.templateId);
    const sections = await this.getSections();

    return generatePdfHtml({
      report,
      template,
      sectionDefinitions: sections,
      viewMode: options?.viewMode || "customer",
      pdfProfile: options?.pdfProfile,
    });
  },

  // --------------------------------------------------------------------------
  // Sektioner med förifylld text
  // --------------------------------------------------------------------------

  /**
   * Skapar sektioner från en mall med förifylld text och variabler
   */
  createSectionsFromTemplate(
    template: ReportTemplate,
    metadata: Partial<ReportMetadata>
  ): ReportSectionInstance[] {
    // Skapa template context för variabel-ersättning
    const context: TemplateContext = {
      report: {
        id: "",
        title: "",
        status: "draft",
        type: template.trade,
        templateId: template.id,
        metadata: {
          client: metadata.client || "",
          location: metadata.location || "",
          projectReference: metadata.projectReference || "",
          assignedTo: metadata.assignedTo || "",
          scheduledAt: metadata.scheduledAt || new Date().toISOString(),
          dueAt: metadata.dueAt || "",
          priority: metadata.priority || "medium",
        },
        sections: [],
        checklist: [],
        assets: [],
        updatedAt: new Date().toISOString(),
      },
      template,
    };

    return template.sections.map((sectionTemplate) => {
      // Rendera förifylld text med variabler
      const defaultContent = sectionTemplate.defaultContent
        ? renderTemplate(sectionTemplate.defaultContent, context)
        : "";

      return {
        id: crypto.randomUUID(),
        title: sectionTemplate.title,
        hint: sectionTemplate.description,
        content: defaultContent,
        status: defaultContent ? "completed" : "pending",
        type: sectionTemplate.type,
        visibility: sectionTemplate.visibility,
      } as ReportSectionInstance;
    });
  },

  // --------------------------------------------------------------------------
  // Templates
  // --------------------------------------------------------------------------

  /**
   * Hämtar alla mallar
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    return storeFetchTemplates();
  },

  /**
   * Hämtar en specifik mall
   */
  async getTemplate(id: string): Promise<ReportTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id) ?? null;
  },

  /**
   * Skapar en ny mall
   */
  async createTemplate(
    input: Pick<ReportTemplate, "name" | "trade" | "description">
  ): Promise<ReportTemplate> {
    return createReportTemplateRecord(input);
  },

  /**
   * Uppdaterar en mall
   */
  async updateTemplate(
    id: string,
    updates: Partial<ReportTemplate>
  ): Promise<ReportTemplate | null> {
    return updateReportTemplateRecord(id, updates);
  },

  // --------------------------------------------------------------------------
  // Sections
  // --------------------------------------------------------------------------

  /**
   * Hämtar alla sektionsdefinitioner
   */
  async getSections(): Promise<ReportSectionDefinition[]> {
    return storeFetchSections();
  },

  /**
   * Skapar en ny sektionsdefinition
   */
  async createSection(
    input: Omit<ReportSectionDefinition, "id">
  ): Promise<ReportSectionDefinition> {
    return createReportSectionRecord(input);
  },

  /**
   * Tar bort en sektionsdefinition
   */
  async deleteSection(id: string): Promise<void> {
    return deleteReportSectionRecord(id);
  },

  // --------------------------------------------------------------------------
  // Filtering & Sorting Helpers
  // --------------------------------------------------------------------------

  applyFilter(reports: Report[], filter: ReportFilter): Report[] {
    return reports.filter((report) => {
      // Status filter
      if (filter.status) {
        const statuses = Array.isArray(filter.status)
          ? filter.status
          : [filter.status];
        if (!statuses.includes(report.status)) return false;
      }

      // Export filter
      if (filter.isExported !== undefined) {
        const isExported = !!report.exportedAt;
        if (filter.isExported !== isExported) return false;
      }

      // Search filter (söker i titel, kund, plats, projektreferens)
      if (filter.search) {
        const needle = filter.search.toLowerCase();
        const searchFields = [
          report.title,
          report.metadata.client,
          report.metadata.location,
          report.metadata.projectReference,
          report.metadata.assignedTo,
        ]
          .filter(Boolean)
          .map((s) => s.toLowerCase());

        if (!searchFields.some((field) => field.includes(needle))) {
          return false;
        }
      }

      // Client filter
      if (filter.client) {
        if (
          !report.metadata.client
            .toLowerCase()
            .includes(filter.client.toLowerCase())
        ) {
          return false;
        }
      }

      // Location filter
      if (filter.location) {
        if (
          !report.metadata.location
            .toLowerCase()
            .includes(filter.location.toLowerCase())
        ) {
          return false;
        }
      }

      // Date range filter
      if (filter.dateFrom || filter.dateTo) {
        const reportDate = new Date(
          report.metadata.scheduledAt || report.updatedAt
        );
        if (filter.dateFrom && reportDate < new Date(filter.dateFrom)) {
          return false;
        }
        if (filter.dateTo && reportDate > new Date(filter.dateTo)) {
          return false;
        }
      }

      // Assigned to filter
      if (filter.assignedTo) {
        if (
          !report.metadata.assignedTo
            ?.toLowerCase()
            .includes(filter.assignedTo.toLowerCase())
        ) {
          return false;
        }
      }

      // Priority filter
      if (filter.priority) {
        if (report.metadata.priority !== filter.priority) return false;
      }

      // Template filter
      if (filter.templateId) {
        if (report.templateId !== filter.templateId) return false;
      }

      return true;
    });
  },

  applySort(reports: Report[], sort: ReportSortOptions): Report[] {
    const sorted = [...reports];
    const direction = sort.direction === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "createdAt":
          comparison =
            new Date(a.metadata.scheduledAt || a.updatedAt).getTime() -
            new Date(b.metadata.scheduledAt || b.updatedAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title, "sv");
          break;
        case "client":
          comparison = a.metadata.client.localeCompare(b.metadata.client, "sv");
          break;
        case "status":
          const statusOrder = { draft: 0, review: 1, approved: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison =
            priorityOrder[a.metadata.priority] -
            priorityOrder[b.metadata.priority];
          break;
      }

      return comparison * direction;
    });

    return sorted;
  },

  // --------------------------------------------------------------------------
  // Statistics & Analytics
  // --------------------------------------------------------------------------

  /**
   * Hämtar statistik för rapporter
   */
  async getStatistics(): Promise<{
    total: number;
    drafts: number;
    inReview: number;
    approved: number;
    exported: number;
    thisMonth: number;
    byPriority: { high: number; medium: number; low: number };
  }> {
    const reports = await storeFetchReports();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: reports.length,
      drafts: reports.filter((r) => r.status === "draft").length,
      inReview: reports.filter((r) => r.status === "review").length,
      approved: reports.filter((r) => r.status === "approved").length,
      exported: reports.filter((r) => !!r.exportedAt).length,
      thisMonth: reports.filter(
        (r) => new Date(r.updatedAt) >= startOfMonth
      ).length,
      byPriority: {
        high: reports.filter((r) => r.metadata.priority === "high").length,
        medium: reports.filter((r) => r.metadata.priority === "medium").length,
        low: reports.filter((r) => r.metadata.priority === "low").length,
      },
    };
  },
};

// ============================================================================
// Store Selectors (för direkt åtkomst till zustand stores)
// ============================================================================

export const rapportSelectors = {
  useReports: () => useReportsStore((state) => state.reports),
  useReportsLoading: () => useReportsStore((state) => state.loading),
  useReportsInitialized: () => useReportsStore((state) => state.initialized),

  useTemplates: () => useReportTemplatesStore((state) => state.templates),
  useTemplatesLoading: () => useReportTemplatesStore((state) => state.loading),

  useSections: () => useReportSectionsStore((state) => state.sections),
  useSectionsLoading: () => useReportSectionsStore((state) => state.loading),

  // Computed selectors
  useDraftReports: () =>
    useReportsStore((state) =>
      state.reports.filter((r) => !r.exportedAt)
    ),
  useArchivedReports: () =>
    useReportsStore((state) =>
      state.reports.filter((r) => !!r.exportedAt)
    ),
  useReportById: (id: string) =>
    useReportsStore((state) =>
      state.reports.find((r) => r.id === id) ?? null
    ),
  useTemplateById: (id: string) =>
    useReportTemplatesStore((state) =>
      state.templates.find((t) => t.id === id) ?? null
    ),
};

export default rapportApi;
