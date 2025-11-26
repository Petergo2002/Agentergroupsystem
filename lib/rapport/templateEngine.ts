/**
 * Template Engine för Rapport-systemet
 * 
 * Hanterar dynamiska variabler i rapportmallar och PDF-export.
 * Syntax: {{variabelnamn}} eller {{objekt.fält}}
 * 
 * Exempel:
 * - {{client}} → Kundnamn
 * - {{location}} → Plats
 * - {{today}} → Dagens datum
 * - {{report.title}} → Rapportens titel
 */

import type { Report, ReportTemplate } from "@/lib/types/rapport";

// ============================================================================
// Types
// ============================================================================

export interface TemplateContext {
  report?: Report;
  template?: ReportTemplate;
  pdfProfile?: {
    brandColor?: string;
    accentColor?: string;
    fontFamily?: string;
    displayLogo?: boolean;
    logoUrl?: string;
    footerText?: string;
    headerText?: string;
  };
  custom?: Record<string, string | number | boolean>;
}

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  category: "report" | "metadata" | "date" | "template" | "custom";
  example: string;
}

// ============================================================================
// Available Variables
// ============================================================================

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Report
  { key: "report.title", label: "Rapporttitel", description: "Rapportens titel", category: "report", example: "Läckagerapport - Storgatan 5" },
  { key: "report.status", label: "Status", description: "Rapportens status", category: "report", example: "Utkast" },
  { key: "report.type", label: "Typ", description: "Rapporttyp (bygg/läckage/elektriker)", category: "report", example: "Läckage" },
  
  // Metadata
  { key: "client", label: "Kund", description: "Kundnamn", category: "metadata", example: "Fastighets AB" },
  { key: "location", label: "Plats", description: "Adress/plats", category: "metadata", example: "Storgatan 5, Stockholm" },
  { key: "projectReference", label: "Projektreferens", description: "Jobb-ID eller ordernummer", category: "metadata", example: "JOB-2024-001" },
  { key: "assignedTo", label: "Ansvarig", description: "Ansvarig person", category: "metadata", example: "Johan Andersson" },
  { key: "priority", label: "Prioritet", description: "Rapportens prioritet", category: "metadata", example: "Hög" },
  
  // Dates
  { key: "today", label: "Dagens datum", description: "Aktuellt datum", category: "date", example: "2024-01-15" },
  { key: "now", label: "Datum & tid", description: "Aktuellt datum och tid", category: "date", example: "2024-01-15 14:30" },
  { key: "scheduledAt", label: "Planerat datum", description: "När rapporten är planerad", category: "date", example: "2024-01-20" },
  { key: "dueAt", label: "Deadline", description: "Rapportens deadline", category: "date", example: "2024-01-25" },
  { key: "year", label: "År", description: "Aktuellt år", category: "date", example: "2024" },
  { key: "month", label: "Månad", description: "Aktuell månad", category: "date", example: "Januari" },
  { key: "week", label: "Vecka", description: "Aktuell veckonummer", category: "date", example: "3" },
  
  // Template
  { key: "template.name", label: "Mallnamn", description: "Namnet på mallen", category: "template", example: "Läckagerapport Standard" },
  { key: "template.trade", label: "Bransch", description: "Mallens bransch", category: "template", example: "Läckage" },
];

// ============================================================================
// Helper Functions
// ============================================================================

const MONTH_NAMES_SV = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Utkast",
  review: "Granskning",
  approved: "Godkänd",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
};

const TRADE_LABELS: Record<string, string> = {
  bygg: "Bygg",
  läckage: "Läckage",
  elektriker: "Elektriker",
};

function formatDate(date: Date | string | undefined, format: "date" | "datetime" | "time" = "date"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  const options: Intl.DateTimeFormatOptions = 
    format === "datetime" ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" } :
    format === "time" ? { hour: "2-digit", minute: "2-digit" } :
    { year: "numeric", month: "2-digit", day: "2-digit" };
  
  return d.toLocaleDateString("sv-SE", options);
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ============================================================================
// Variable Resolution
// ============================================================================

function resolveVariable(key: string, context: TemplateContext): string {
  const now = new Date();
  const { report, template, pdfProfile, custom } = context;

  // Custom variables first
  if (custom && key in custom) {
    return String(custom[key]);
  }

  // Date variables
  switch (key) {
    case "today":
      return formatDate(now);
    case "now":
      return formatDate(now, "datetime");
    case "year":
      return String(now.getFullYear());
    case "month":
      return MONTH_NAMES_SV[now.getMonth()] || "";
    case "week":
      return String(getWeekNumber(now));
  }

  // Report variables
  if (report) {
    switch (key) {
      case "report.title":
        return report.title || "";
      case "report.status":
        return STATUS_LABELS[report.status] || report.status || "";
      case "report.type":
        return TRADE_LABELS[report.type] || report.type || "";
      case "client":
        return report.metadata?.client || "";
      case "location":
        return report.metadata?.location || "";
      case "projectReference":
        return report.metadata?.projectReference || "";
      case "assignedTo":
        return report.metadata?.assignedTo || "";
      case "priority":
        return PRIORITY_LABELS[report.metadata?.priority] || report.metadata?.priority || "";
      case "scheduledAt":
        return formatDate(report.metadata?.scheduledAt);
      case "dueAt":
        return formatDate(report.metadata?.dueAt);
    }
  }

  // Template variables
  if (template) {
    switch (key) {
      case "template.name":
        return template.name || "";
      case "template.trade":
        return TRADE_LABELS[template.trade] || template.trade || "";
    }
  }

  // PDF Profile variables
  if (pdfProfile) {
    switch (key) {
      case "company.name":
        return pdfProfile.headerText || "";
    }
  }

  // Unknown variable - return empty string (safe fallback)
  return "";
}

// ============================================================================
// Main Template Function
// ============================================================================

/**
 * Ersätter alla {{variabel}}-placeholders i en sträng med faktiska värden.
 * 
 * @param template - Strängen med placeholders
 * @param context - Kontext med rapport, mall, profil etc.
 * @returns Strängen med ersatta värden
 * 
 * @example
 * const result = renderTemplate(
 *   "Rapport för {{client}} på {{location}} ({{today}})",
 *   { report: myReport }
 * );
 * // → "Rapport för Fastighets AB på Storgatan 5 (2024-01-15)"
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  if (!template) return "";
  
  // Match {{variabel}} pattern
  const regex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(regex, (match, key) => {
    const trimmedKey = key.trim();
    const value = resolveVariable(trimmedKey, context);
    
    // If variable is empty, keep the placeholder visible (for debugging) or return empty
    // For production, we return empty string
    return value || "";
  });
}

/**
 * Renderar en template och behåller okända variabler som placeholders.
 * Användbart för preview där användaren vill se vilka variabler som finns.
 */
export function renderTemplatePreview(template: string, context: TemplateContext): string {
  if (!template) return "";
  
  const regex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(regex, (match, key) => {
    const trimmedKey = key.trim();
    const value = resolveVariable(trimmedKey, context);
    
    // Om värdet är tomt, visa variabelnamnet i en tydlig stil
    return value || `[${trimmedKey}]`;
  });
}

/**
 * Extraherar alla variabelnamn från en template-sträng.
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];
  
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const key = match[1];
    if (key) {
      const trimmedKey = key.trim();
      if (trimmedKey && !variables.includes(trimmedKey)) {
        variables.push(trimmedKey);
      }
    }
  }
  
  return variables;
}

/**
 * Validerar att alla variabler i en template är kända.
 */
export function validateTemplate(template: string): { valid: boolean; unknownVariables: string[] } {
  const usedVariables = extractVariables(template);
  const knownKeys = TEMPLATE_VARIABLES.map((v) => v.key);
  const unknownVariables = usedVariables.filter((v) => !knownKeys.includes(v));
  
  return {
    valid: unknownVariables.length === 0,
    unknownVariables,
  };
}

/**
 * Grupperar tillgängliga variabler efter kategori.
 */
export function getVariablesByCategory(): Record<string, TemplateVariable[]> {
  const grouped: Record<string, TemplateVariable[]> = {};
  
  for (const variable of TEMPLATE_VARIABLES) {
    const cat = variable.category;
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat]!.push(variable);
  }
  
  return grouped;
}

// ============================================================================
// Snippet System
// ============================================================================

export interface TextSnippet {
  id: string;
  title: string;
  content: string;
  category: string;
  trade?: string;
  description?: string;
}

export const DEFAULT_SNIPPETS: TextSnippet[] = [
  // Intro/Sammanfattning
  {
    id: "intro-standard",
    title: "Standard introduktion",
    content: "Denna rapport är utförd av {{assignedTo}} på uppdrag av {{client}}. Inspektionen genomfördes {{scheduledAt}} på {{location}}.",
    category: "intro",
    description: "Standardintroduktion med grundläggande information",
  },
  {
    id: "summary-standard",
    title: "Standard sammanfattning",
    content: "Sammanfattningsvis har inspektionen på {{location}} genomförts enligt plan. Nedan följer detaljerade observationer och rekommendationer.",
    category: "summary",
    description: "Kort sammanfattning för rapportens början",
  },
  
  // Läckage-specifika
  {
    id: "leakage-intro",
    title: "Läckageintroduktion",
    content: "Vid inspektion av {{location}} har följande observationer gjorts avseende fukt och eventuella läckage. Mätningar har utförts med kalibrerad fuktutrustning.",
    category: "intro",
    trade: "läckage",
    description: "Introduktion för läckagerapporter",
  },
  {
    id: "leakage-method",
    title: "Metodbeskrivning läckage",
    content: "Undersökningen har genomförts med hjälp av fuktmätare, värmekamera och visuell inspektion. Samtliga mätvärden är dokumenterade i bifogade tabeller.",
    category: "method",
    trade: "läckage",
    description: "Beskrivning av undersökningsmetod",
  },
  {
    id: "leakage-conclusion",
    title: "Slutsats läckage",
    content: "Baserat på genomförda mätningar och observationer rekommenderas följande åtgärder. Prioritering bör ske enligt angiven ordning för att minimera risken för ytterligare skador.",
    category: "conclusion",
    trade: "läckage",
    description: "Standardslutsats för läckagerapporter",
  },
  
  // Bygg-specifika
  {
    id: "construction-intro",
    title: "Byggintroduktion",
    content: "Denna besiktningsrapport avser {{location}} och är utförd på uppdrag av {{client}}. Besiktningen omfattar de områden som specificerats i uppdragsbeskrivningen.",
    category: "intro",
    trade: "bygg",
    description: "Introduktion för byggrapporter",
  },
  {
    id: "construction-scope",
    title: "Omfattning bygg",
    content: "Besiktningen omfattar visuell kontroll av konstruktion, ytskikt och installationer enligt gällande branschstandard. Dold konstruktion har ej besiktigats om ej annat anges.",
    category: "scope",
    trade: "bygg",
    description: "Beskrivning av besiktningens omfattning",
  },
  
  // Elektriker-specifika
  {
    id: "electrical-intro",
    title: "Elintroduktion",
    content: "Denna elbesiktning är utförd av behörig elektriker på {{location}}. Besiktningen omfattar kontroll av elinstallationer enligt gällande föreskrifter.",
    category: "intro",
    trade: "elektriker",
    description: "Introduktion för elrapporter",
  },
  {
    id: "electrical-safety",
    title: "Säkerhetsnotering",
    content: "OBS! Arbete med elektriska installationer ska endast utföras av behörig elektriker. Vid osäkerhet, kontakta alltid en auktoriserad elfirma.",
    category: "safety",
    trade: "elektriker",
    description: "Säkerhetsvarning för elrapporter",
  },
  
  // Generella
  {
    id: "disclaimer",
    title: "Ansvarsfriskrivning",
    content: "Denna rapport baseras på de förhållanden som rådde vid inspektionstillfället. Dolda fel eller brister som ej var möjliga att upptäcka vid inspektionen omfattas ej av denna rapport.",
    category: "disclaimer",
    description: "Standard ansvarsfriskrivning",
  },
  {
    id: "contact-info",
    title: "Kontaktinformation",
    content: "Vid frågor om denna rapport, vänligen kontakta {{assignedTo}}. Referens: {{projectReference}}.",
    category: "contact",
    description: "Kontaktinformation med variabler",
  },
];

/**
 * Hämtar snippets filtrerade på trade (eller alla om trade är undefined).
 */
export function getSnippets(trade?: string): TextSnippet[] {
  if (!trade) return DEFAULT_SNIPPETS;
  return DEFAULT_SNIPPETS.filter((s) => !s.trade || s.trade === trade);
}

/**
 * Hämtar snippets grupperade efter kategori.
 */
export function getSnippetsByCategory(trade?: string): Record<string, TextSnippet[]> {
  const snippets = getSnippets(trade);
  const grouped: Record<string, TextSnippet[]> = {};
  
  for (const snippet of snippets) {
    const cat = snippet.category;
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat]!.push(snippet);
  }
  
  return grouped;
}

export default {
  renderTemplate,
  renderTemplatePreview,
  extractVariables,
  validateTemplate,
  getVariablesByCategory,
  getSnippets,
  getSnippetsByCategory,
  TEMPLATE_VARIABLES,
  DEFAULT_SNIPPETS,
};
