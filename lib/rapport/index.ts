/**
 * Rapport Module
 * 
 * Centraliserad export av alla rapport-relaterade funktioner och hooks.
 */

// API Client
export { rapportApi, rapportSelectors } from "./rapportApi";
export type {
  ReportFilter,
  ReportSortOptions,
  PaginationOptions,
  ReportListResult,
  CreateReportInput,
  UpdateReportInput,
} from "./rapportApi";

// Hooks
export { useRapportData } from "./useRapportData";
export type { UseRapportDataOptions, UseRapportDataReturn } from "./useRapportData";

// Template Engine
export {
  renderTemplate,
  renderTemplatePreview,
  extractVariables,
  validateTemplate,
  getVariablesByCategory,
  getSnippets,
  getSnippetsByCategory,
  TEMPLATE_VARIABLES,
  DEFAULT_SNIPPETS,
} from "./templateEngine";
export type { TemplateContext, TemplateVariable, TextSnippet } from "./templateEngine";

// PDF Generator
export {
  generatePdfHtml,
  openPdfPreview,
} from "./pdfGenerator";
export type { PdfProfile, PdfViewMode, PdfGeneratorOptions } from "./pdfGenerator";

// PDF Profiles
export {
  PDF_PROFILES,
  PROFILE_OPTIONS,
  getProfile,
  getProfileForTrade,
  PROFILE_MODERN,
  PROFILE_LECKAGE,
  PROFILE_BYGG,
  PROFILE_ELEKTRIKER,
  PROFILE_MINIMAL,
  PROFILE_INTERNAL,
  PROFILE_PREMIUM,
} from "./pdfProfiles";
export type { PdfProfileKey } from "./pdfProfiles";
