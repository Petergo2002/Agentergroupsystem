export type ReportStatus = "draft" | "review" | "approved";

export type ReportTrade = "bygg" | "läckage" | "elektriker";

// ============================================================================
// Annoteringar (behövs tidigt för AnnotatedImage)
// ============================================================================

export type AnnotationShapeType = "arrow" | "circle";

export interface AnnotationShape {
  id: string;
  type: AnnotationShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color: string;
  strokeWidth?: number;
  label?: string;
}

// ============================================================================
// NYA FÖRENKLADE SEKTIONSTYPER (v2)
// ============================================================================

/**
 * Förenklade sektionstyper - endast 2 typer:
 * - "text": Rubrik + fritext (markdown)
 * - "images": Bildgalleri med annoteringar
 */
export type SimpleSectionType = "text" | "images";

/**
 * Förenklad sektionsdefinition för mallbyggaren
 */
export interface SimpleSectionDefinition {
  id: string;
  type: SimpleSectionType;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  placeholder?: string;
  /** Förifylld text med stöd för variabler som {{kund}}, {{adress}} etc. */
  defaultContent?: string;
}

/**
 * Förenklad rapportmall
 */
export interface SimpleReportTemplate {
  id: string;
  name: string;
  description?: string;
  trade: ReportTrade;
  sections: SimpleSectionDefinition[];
  designId?: "standard" | "modern_hero";
  createdAt: string;
  updatedAt: string;
}

/**
 * Text-sektion innehåll (rubrik + text)
 */
export interface TextSectionContent {
  title: string;
  text: string; // Markdown eller HTML
}

/**
 * Bild med annotering
 */
export interface AnnotatedImage {
  id: string;
  url: string;
  caption?: string;
  annotations?: AnnotationShape[];
}

/**
 * Bilder-sektion innehåll
 */
export interface ImagesSectionContent {
  images: AnnotatedImage[];
}

/**
 * Förenklad sektionsinstans (i en rapport)
 */
export interface SimpleSectionInstance {
  id: string;
  definitionId: string; // Referens till SimpleSectionDefinition
  type: SimpleSectionType;
  title: string;
  
  // Innehåll baserat på typ
  textContent?: TextSectionContent;
  imagesContent?: ImagesSectionContent;
  
  // Status
  status: "pending" | "completed";
  
  // Ordning
  order: number;
}

/**
 * Mapping från gamla typer till nya
 * Används för bakåtkompatibilitet
 */
export const LEGACY_TO_SIMPLE_TYPE: Record<ReportSectionType, SimpleSectionType> = {
  text: "text",
  heading: "text",
  summary: "text",
  basic_info: "text",
  checklist: "text",
  signature: "text",
  divider: "text",
  links: "text",
  table: "text",
  chart: "text",
  image: "images",
  image_gallery: "images",
  image_annotated: "images",
};

// ============================================================================
// LEGACY Sektion-typer (behålls för bakåtkompatibilitet)
// @deprecated Använd SimpleSectionType istället
// ============================================================================

export type ReportSectionType =
  | "text"           // Brödtext
  | "heading"        // Rubrik/kapitel
  | "summary"        // Sammanfattning/TL;DR
  | "basic_info"     // Grundinformation (kund, adress, etc.)
  | "image"          // Statisk bild
  | "image_gallery"  // Bildgalleri
  | "image_annotated"// Annoterad bild
  | "checklist"      // Checklista med poäng
  | "table"          // Tabell/parametrar (mätvärden etc)
  | "signature"      // Signatur-sektion
  | "divider"        // Avdelare
  | "links"          // Länkar/bilagelista
  | "chart";         // Diagram

// ============================================================================
// Synlighet & villkor
// ============================================================================

export type SectionAudience = "all" | "internal" | "customer";

export interface SectionVisibility {
  /** Vem ser sektionen */
  audience: SectionAudience;
  /** Endast för specifika trades (tom = alla) */
  trades?: ReportTrade[];
  /** Endast för specifika statusar (tom = alla) */
  statuses?: ReportStatus[];
  /** Villkor baserat på annan sektion */
  dependsOn?: {
    sectionId: string;
    condition: "filled" | "empty" | "value";
    value?: string;
  };
}

// ============================================================================
// Sektion-mallar
// ============================================================================

export interface ReportSectionTemplate {
  id: string;
  title: string;
  description?: string;
  type?: ReportSectionType;
  /** Grupp/kapitel som sektionen tillhör */
  group?: string;
  /** Ordning inom gruppen */
  order?: number;
  /** Synlighetsregler */
  visibility?: SectionVisibility;
  /** Är sektionen obligatorisk? */
  required?: boolean;
  /** Placeholder-text */
  placeholder?: string;
  /** Förifylld text med stöd för variabler ({{client}}, {{location}}, etc) */
  defaultContent?: string;
  /** Föreslagna snippets för denna sektion */
  suggestedSnippets?: string[];
}

// ============================================================================
// Checklist
// ============================================================================

export interface ReportChecklistItem {
  id: string;
  label: string;
  required?: boolean;
  completed?: boolean;
  notes?: string;
  /** Poäng/vikt för denna punkt */
  weight?: number;
  /** Kategori */
  category?: string;
}

// ============================================================================
// Tabell/parametrar
// ============================================================================

export interface TableColumn {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  unit?: string;
  required?: boolean;
}

export interface TableRow {
  id: string;
  values: Record<string, string | number | boolean>;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
}

// ============================================================================
// Signatur
// ============================================================================

export interface SignatureData {
  name: string;
  role: string;
  date: string;
  signatureUrl?: string;
  email?: string;
}

// ============================================================================
// Länkar/bilagor
// ============================================================================

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  type: "document" | "external" | "internal";
  description?: string;
}

// ============================================================================
// Asset & Visibility
// ============================================================================

export interface ReportAssetGuideline {
  id: string;
  label: string;
  required?: boolean;
  description?: string;
  tags?: string[];
}

export interface ReportVisibilityRule {
  id: string;
  audience: SectionAudience;
  label: string;
  description?: string;
}

// ============================================================================
// Sektion-grupper
// ============================================================================

export interface SectionGroup {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// ============================================================================
// Mall (Template)
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  trade: ReportTrade;
  description?: string;
  /** Sektion-grupper/kapitel */
  groups?: SectionGroup[];
  sections: ReportSectionTemplate[];
  checklist: ReportChecklistItem[];
  assetGuidelines: ReportAssetGuideline[];
  visibilityRules: ReportVisibilityRule[];
  /** Standard PDF-profil */
  defaultPdfProfile?: string;
  /** Vald PDF-design */
  designId?: "standard" | "modern_hero";
}

// ============================================================================
// Sektion-definition (byggsten i inställningar)
// ============================================================================

export interface ReportSectionDefinition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type?: ReportSectionType;
  /** Synlighetsregler */
  visibility?: SectionVisibility;
  /** Är sektionen obligatorisk? */
  required?: boolean;
  /** Placeholder-text */
  placeholder?: string;
  /** Grupp/kapitel */
  group?: string;
  /** Ordning */
  order?: number;
  /** Förifylld text med stöd för variabler ({{client}}, {{location}}, etc) */
  defaultContent?: string;
  /** Föreslagna snippets för denna sektion */
  suggestedSnippets?: string[];
  // För image-typ
  imageUrl?: string;
  imageAltText?: string;
  isDefaultSection?: boolean;
  // För tabell-typ
  tableColumns?: TableColumn[];
  // För checklist-typ
  checklistItems?: ReportChecklistItem[];
  // För links-typ
  defaultLinks?: LinkItem[];
}

// ============================================================================
// Sektion-instans (i en rapport)
// ============================================================================

export interface ReportSectionInstance {
  id: string;
  title: string;
  hint?: string;
  content: string;
  status: "pending" | "completed";
  type?: ReportSectionType;
  /** Synlighet (ärvs från definition men kan överstyras) */
  visibility?: SectionVisibility;
  /** Interna anteckningar (syns aldrig för kund) */
  internalNotes?: string;
  
  // För image_gallery
  assetIds?: string[];
  
  // För image_annotated
  assetId?: string;
  annotationData?: AnnotationShape[];
  annotatedImageUrl?: string;
  
  // För checklist
  checklistData?: ReportChecklistItem[];
  
  // För table
  tableData?: TableData;
  
  // För signature
  signatures?: SignatureData[];
  
  // För links
  links?: LinkItem[];
  
  // För heading
  headingLevel?: 1 | 2 | 3;
}

export interface ReportAsset {
  id: string;
  label: string;
  url: string;
  capturedAt: string;
  capturedBy: string;
  tags: string[];
}

export interface ReportMetadata {
  client: string;
  location: string;
  projectReference: string;
  assignedTo: string;
  phone?: string;
  email?: string;
  investigator?: string;
  scheduledAt: string;
  dueAt: string;
  priority: "low" | "medium" | "high";
  designId?: "standard" | "modern_hero";
}

// ============================================================================
// Export-historik
// ============================================================================

export interface ExportHistoryEntry {
  id: string;
  exportedAt: string;
  exportedBy: string;
  profileType: "internal" | "customer";
  profileName?: string;
  version: number;
  pdfUrl?: string;
}

// ============================================================================
// Rapport (huvudmodell)
// ============================================================================

export interface Report {
  id: string;
  title: string;
  status: ReportStatus;
  type: ReportTrade;
  templateId: string;
  metadata: ReportMetadata;
  sections: ReportSectionInstance[];
  checklist: ReportChecklistItem[];
  assets: ReportAsset[];
  
  // Tidsstämplar
  createdAt?: string;
  updatedAt: string;
  exportedAt?: string | null;
  
  // Publik delning
  publicId?: string | null;
  publicUrl?: string | null;
  
  // Kundgodkännande
  customerEmail?: string | null;
  customerApprovedAt?: string | null;
  customerApprovedBy?: string | null;
  
  // Export-historik
  exportHistory?: ExportHistoryEntry[];
  
  // Version
  version?: number;
  
  // Interna anteckningar (global)
  internalNotes?: string;
  
  // PDF-relaterat (från DB)
  pdfTemplateId?: string | null;
  coverImageUrl?: string | null;
  coverSubtitle?: string | null;
  
  // Organisation/användare (från DB)
  userId?: string | null;
  organizationId?: string | null;
}

// ============================================================================
// PDF Types
// ============================================================================

export interface PdfProfile {
  designId?: "standard" | "modern_hero";
  brandColor?: string;
  accentColor?: string;
  fontFamily?: string;
  displayLogo?: boolean;
  logoUrl?: string;
  footerText?: string;
  headerText?: string;
  displayInternalNotes?: boolean;
}
