/**
 * Rapport Module
 *
 * Centraliserad export av alla rapport-relaterade funktioner och hooks.
 */

export type {
  PdfGeneratorOptions,
  PdfProfile,
  PdfViewMode,
} from "./pdfGenerator";
// PDF Generator
export {
  generatePdfHtml,
  openPdfPreview,
} from "./pdfGenerator";
export type { PdfProfileKey } from "./pdfProfiles";
// PDF Profiles
export {
  getProfile,
  getProfileForTrade,
  PDF_PROFILES,
  PROFILE_BYGG,
  PROFILE_ELEKTRIKER,
  PROFILE_INTERNAL,
  PROFILE_LECKAGE,
  PROFILE_MINIMAL,
  PROFILE_MODERN,
  PROFILE_OPTIONS,
  PROFILE_PREMIUM,
} from "./pdfProfiles";
export type {
  CreateReportInput,
  PaginationOptions,
  ReportFilter,
  ReportListResult,
  ReportSortOptions,
  UpdateReportInput,
} from "./rapportApi";
// API Client
export { rapportApi, rapportSelectors } from "./rapportApi";
export type {
  TemplateContext,
  TemplateVariable,
  TextSnippet,
} from "./templateEngine";
// Template Engine
export {
  DEFAULT_SNIPPETS,
  extractVariables,
  getSnippets,
  getSnippetsByCategory,
  getVariablesByCategory,
  renderTemplate,
  renderTemplatePreview,
  TEMPLATE_VARIABLES,
  validateTemplate,
} from "./templateEngine";
export type {
  UseRapportDataOptions,
  UseRapportDataReturn,
} from "./useRapportData";
// Hooks
export { useRapportData } from "./useRapportData";
