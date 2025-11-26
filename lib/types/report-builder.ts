/**
 * Report Builder Types - Samma struktur som gamla projektet
 */

export interface ReportFormData {
  // Grunddata
  projektId: string;
  datum: string;
  mottagare: string;
  foretag: string;
  adress: string;
  utredare: string;
  utredareEmail?: string;
  utredarePhone?: string;
  caseId?: string;
  customFilename?: string;
  
  // Textsektioner
  inledning?: string;
  bakgrund: string;
  matmetoder: string;
  slutsats: string;
  
  // Bilder
  images: string[]; // Galleri-bilder (data URLs eller http URLs)
  gannTableImage?: string; // GANN-tabell bild
  
  // Läckageområden
  leakAreas: LeakArea[];
  
  // Anpassade sektioner (från rapportmall)
  sections?: {
    id: string;
    title: string;
    content: string;
    type?: string;
  }[];
  
  // Mallar & låsning
  templateId?: string;
  lockedFields?: string[];
}

export interface LeakArea {
  id: string;
  name: string;
  description: string;
  images: string[];
}

/**
 * Legacy ReportTemplate för report-builder
 * @deprecated Använd ReportTemplate från lib/types/rapport.ts istället
 * Behålls för bakåtkompatibilitet med äldre kod
 */
export interface LegacyReportTemplate {
  id: string;
  name: string;
  description?: string;
  defaultInledning?: string;
  defaultBakgrund: string;
  defaultMatmetoder: string;
  defaultSlutsats: string;
  tokens?: string[];
}

/**
 * @deprecated Alias för bakåtkompatibilitet - använd LegacyReportTemplate eller ReportTemplate från rapport.ts
 */
export type ReportBuilderTemplate = LegacyReportTemplate;

export interface TemplateBindings {
  source: Record<string, string>; // Original malltext
  resolved: Record<string, string>; // Text efter token-ersättning
  manualOverrides: Record<string, boolean>; // Om användaren har ändrat manuellt
}

export interface SavedReport {
  id: string;
  name: string;
  date: string;
  customer: string;
  projectId: string;
  fileUrl: string;
  filename: string;
  size?: number;
  createdAt: string;
  metadata?: Partial<ReportFormData>;
}

export interface BrandingConfig {
  logoUrl?: string;
  companyName?: string;
  theme?: 'default' | 'modern' | 'classic';
  addressLine1?: string;
  addressLine2?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  orgNumber?: string;
  footerNote?: string;
}
