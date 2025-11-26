/**
 * PDF Generator för Rapport-systemet
 * 
 * Genererar professionell HTML för PDF-export med stöd för:
 * - Dynamiska variabler
 * - Intern/kund-profiler
 * - Moderna stilar
 * - Alla sektionstyper
 */

import type {
  Report,
  ReportTemplate,
  ReportSectionInstance,
  ReportSectionDefinition,
  ReportChecklistItem,
} from "@/lib/types/rapport";
import { renderTemplate, type TemplateContext } from "./templateEngine";

// ============================================================================
// Types
// ============================================================================

export type PdfViewMode = "internal" | "customer";

export interface PdfProfile {
  brandColor?: string;
  accentColor?: string;
  fontFamily?: string;
  displayLogo?: boolean;
  logoUrl?: string;
  footerText?: string;
  headerText?: string;
  displayInternalNotes?: boolean;
}

export interface PdfGeneratorOptions {
  report: Report;
  template?: ReportTemplate | null;
  sectionDefinitions?: ReportSectionDefinition[];
  pdfProfile?: PdfProfile;
  viewMode?: PdfViewMode;
}

// ============================================================================
// Constants
// ============================================================================

// Branschspecifika färger (matchar Report Studio)
const TRADE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  läckage: { primary: "#065f46", secondary: "#10b981", accent: "#d1fae5" },
  bygg: { primary: "#78350f", secondary: "#d97706", accent: "#fef3c7" },
  elektriker: { primary: "#1e3a5f", secondary: "#3b82f6", accent: "#dbeafe" },
};

const DEFAULT_PROFILE: PdfProfile = {
  brandColor: "#1e40af",
  accentColor: "#3b82f6",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  displayLogo: false,
  displayInternalNotes: false,
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Utkast",
  review: "Granskning",
  approved: "Godkänd",
};

const TRADE_LABELS: Record<string, string> = {
  bygg: "Bygg",
  läckage: "Läckage",
  elektriker: "Elektriker",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
};

// ============================================================================
// Main Generator
// ============================================================================

export function generatePdfHtml(options: PdfGeneratorOptions): string {
  const {
    report,
    template,
    sectionDefinitions = [],
    pdfProfile = DEFAULT_PROFILE,
    viewMode = "customer",
  } = options;

  // Hämta branschfärger baserat på rapporttyp
  const defaultTradeColors = { primary: "#78350f", secondary: "#d97706", accent: "#fef3c7" };
  const tradeColors = TRADE_COLORS[report.type] ?? defaultTradeColors;
  
  // Använd branschfärger som standard om ingen profil anges
  const profile = { 
    ...DEFAULT_PROFILE, 
    brandColor: tradeColors.primary,
    accentColor: tradeColors.secondary,
    ...pdfProfile 
  };
  const isInternal = viewMode === "internal";

  // Template context for variable replacement
  const templateContext: TemplateContext = {
    report,
    template: template || undefined,
    pdfProfile: profile,
  };

  // Filter sections based on view mode
  const visibleSections = report.sections.filter((section) => {
    if (!isInternal && section.visibility?.audience === "internal") {
      return false;
    }
    return true;
  });

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(report.title)}</title>
  <style>
    ${generateStyles(profile)}
  </style>
</head>
<body>
  <div class="document">
    ${generateHeader(report, template, profile, templateContext)}
    ${generateMetadata(report, isInternal)}
    ${generateSections(visibleSections, sectionDefinitions, templateContext, isInternal)}
    ${generateChecklist(report.checklist, isInternal)}
    ${generateFooter(profile, templateContext)}
  </div>
  <script>
    // Auto-print when opened
    window.onload = function() {
      // Uncomment to auto-print:
      // window.print();
    };
  </script>
</body>
</html>
  `.trim();
}

// ============================================================================
// Styles
// ============================================================================

function generateStyles(profile: PdfProfile): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${profile.fontFamily};
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .document {
        padding: 0;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* Header - Report Studio Style */
    .header {
      background: linear-gradient(135deg, ${profile.brandColor} 0%, ${profile.brandColor}dd 100%);
      color: white;
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-logo {
      width: 48px;
      height: 48px;
      background: ${profile.accentColor};
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
    }
    
    .header-left h1 {
      font-size: 18pt;
      font-weight: 600;
      color: white;
      margin-bottom: 0;
    }
    
    .header-left .subtitle {
      font-size: 10pt;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header-right {
      text-align: right;
      font-size: 11pt;
      opacity: 0.9;
    }
    
    .header-right .logo {
      max-height: 60px;
      max-width: 150px;
    }
    
    .header-right .company-name {
      font-size: 14pt;
      font-weight: 600;
      color: white;
    }
    
    /* Metadata */
    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .metadata-item {
      display: flex;
      flex-direction: column;
    }
    
    .metadata-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .metadata-value {
      font-size: 11pt;
      font-weight: 500;
      color: #1f2937;
    }
    
    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 500;
    }
    
    .status-draft {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-review {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-approved {
      background: #d1fae5;
      color: #065f46;
    }
    
    /* Sections */
    .section {
      margin-bottom: 30px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${profile.accentColor};
    }
    
    .section-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: ${profile.brandColor};
      color: white;
      border-radius: 50%;
      font-size: 12pt;
      font-weight: 600;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #1f2937;
    }
    
    .section-content {
      font-size: 11pt;
      line-height: 1.7;
      white-space: pre-wrap;
    }
    
    .section-hint {
      font-size: 10pt;
      color: #6b7280;
      font-style: italic;
      margin-bottom: 10px;
    }
    
    /* Internal notes */
    .internal-note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin-top: 15px;
      border-radius: 0 8px 8px 0;
    }
    
    .internal-note-label {
      font-size: 9pt;
      text-transform: uppercase;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .internal-note-content {
      font-size: 10pt;
      color: #78350f;
    }
    
    /* Headings */
    .heading-1 {
      font-size: 20pt;
      font-weight: 700;
      color: ${profile.brandColor};
      margin: 30px 0 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${profile.brandColor};
    }
    
    .heading-2 {
      font-size: 16pt;
      font-weight: 600;
      color: #374151;
      margin: 25px 0 15px;
    }
    
    .heading-3 {
      font-size: 13pt;
      font-weight: 600;
      color: #4b5563;
      margin: 20px 0 10px;
    }
    
    /* Summary box */
    .summary-box {
      background: linear-gradient(135deg, ${profile.brandColor}10, ${profile.accentColor}10);
      border: 1px solid ${profile.accentColor}40;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .summary-box h3 {
      font-size: 12pt;
      color: ${profile.brandColor};
      margin-bottom: 10px;
    }
    
    /* Checklist */
    .checklist {
      margin-bottom: 30px;
    }
    
    .checklist-title {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1f2937;
    }
    
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .checklist-checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .checklist-checkbox.checked {
      background: ${profile.brandColor};
      border-color: ${profile.brandColor};
    }
    
    .checklist-checkbox.checked::after {
      content: "✓";
      color: white;
      font-size: 12px;
    }
    
    .checklist-label {
      flex: 1;
    }
    
    .checklist-notes {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 4px;
    }
    
    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .data-table th,
    .data-table td {
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #e5e7eb;
    }
    
    .data-table th {
      background: ${profile.brandColor};
      color: white;
      font-weight: 600;
      font-size: 10pt;
    }
    
    .data-table td {
      font-size: 10pt;
    }
    
    .data-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #1f2937;
      height: 60px;
      margin-bottom: 10px;
    }
    
    .signature-name {
      font-weight: 600;
      font-size: 11pt;
    }
    
    .signature-role {
      font-size: 10pt;
      color: #6b7280;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 4px;
    }
    
    /* Links */
    .links-list {
      list-style: none;
    }
    
    .links-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .links-list a {
      color: ${profile.brandColor};
      text-decoration: none;
    }
    
    .links-list a:hover {
      text-decoration: underline;
    }
    
    /* Divider */
    .divider {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 30px 0;
    }
    
    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
    }
    
    .footer-text {
      margin-bottom: 5px;
    }
    
    .footer-date {
      font-size: 8pt;
    }
    
    /* Image gallery */
    .image-gallery {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    
    .image-gallery img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .image-caption {
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
      margin-top: 5px;
    }
  `;
}

// ============================================================================
// Header
// ============================================================================

function generateHeader(
  report: Report,
  template: ReportTemplate | null | undefined,
  profile: PdfProfile,
  context: TemplateContext
): string {
  const headerText = profile.headerText
    ? renderTemplate(profile.headerText, context)
    : "";

  return `
    <header class="header">
      <div class="header-left">
        <div class="header-logo">R</div>
        <div>
          <div class="subtitle">RAPPORT</div>
          <h1>${escapeHtml(report.title)}</h1>
        </div>
      </div>
      <div class="header-right">
        ${profile.displayLogo && profile.logoUrl
          ? `<img src="${escapeHtml(profile.logoUrl)}" alt="Logo" class="logo">`
          : `<div>${formatDate(report.metadata.scheduledAt || report.updatedAt)}</div>`
        }
        ${headerText ? `<div class="company-name">${escapeHtml(headerText)}</div>` : ""}
      </div>
    </header>
  `;
}

// ============================================================================
// Metadata
// ============================================================================

function generateMetadata(report: Report, isInternal: boolean): string {
  const statusClass = `status-${report.status}`;
  
  return `
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Kund</span>
        <span class="metadata-value">${escapeHtml(report.metadata.client)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Plats</span>
        <span class="metadata-value">${escapeHtml(report.metadata.location)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Datum</span>
        <span class="metadata-value">${formatDate(report.metadata.scheduledAt)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Status</span>
        <span class="metadata-value">
          <span class="status-badge ${statusClass}">${STATUS_LABELS[report.status] || report.status}</span>
        </span>
      </div>
      ${isInternal ? `
        <div class="metadata-item">
          <span class="metadata-label">Ansvarig</span>
          <span class="metadata-value">${escapeHtml(report.metadata.assignedTo || "Ej tilldelad")}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Prioritet</span>
          <span class="metadata-value">${PRIORITY_LABELS[report.metadata.priority] || report.metadata.priority}</span>
        </div>
      ` : ""}
    </div>
  `;
}

// ============================================================================
// Sections
// ============================================================================

function generateSections(
  sections: ReportSectionInstance[],
  definitions: ReportSectionDefinition[],
  context: TemplateContext,
  isInternal: boolean
): string {
  return sections
    .map((section, index) => generateSection(section, index + 1, definitions, context, isInternal))
    .join("");
}

function generateSection(
  section: ReportSectionInstance,
  number: number,
  definitions: ReportSectionDefinition[],
  context: TemplateContext,
  isInternal: boolean
): string {
  const type = section.type || "text";
  
  // Render content with variables
  const renderedContent = renderTemplate(section.content || "", context);
  
  // Generate section-specific content
  let sectionContent = "";
  
  switch (type) {
    case "heading":
      const level = section.headingLevel || 1;
      return `<h${level} class="heading-${level}">${escapeHtml(renderedContent)}</h${level}>`;
    
    case "summary":
      return `
        <div class="summary-box">
          <h3>Sammanfattning</h3>
          <p>${escapeHtml(renderedContent)}</p>
        </div>
      `;
    
    case "divider":
      return `<hr class="divider">`;
    
    case "checklist":
      sectionContent = generateSectionChecklist(section.checklistData || []);
      break;
    
    case "table":
      sectionContent = generateSectionTable(section.tableData);
      break;
    
    case "signature":
      sectionContent = generateSectionSignatures(section.signatures || []);
      break;
    
    case "links":
      sectionContent = generateSectionLinks(section.links || []);
      break;
    
    case "image_gallery":
      sectionContent = `<div class="image-gallery">${(section.assetIds || []).map((id) => 
        `<div><img src="" alt="Bild"><div class="image-caption">Bild ${id}</div></div>`
      ).join("")}</div>`;
      break;
    
    default:
      sectionContent = `<div class="section-content">${escapeHtml(renderedContent)}</div>`;
  }
  
  // Internal notes
  const internalNotes = isInternal && section.internalNotes
    ? `
      <div class="internal-note">
        <div class="internal-note-label">Intern anteckning</div>
        <div class="internal-note-content">${escapeHtml(section.internalNotes)}</div>
      </div>
    `
    : "";
  
  return `
    <div class="section">
      <div class="section-header">
        <span class="section-number">${number}</span>
        <span class="section-title">${escapeHtml(section.title)}</span>
      </div>
      ${section.hint ? `<div class="section-hint">${escapeHtml(section.hint)}</div>` : ""}
      ${sectionContent}
      ${internalNotes}
    </div>
  `;
}

function generateSectionChecklist(items: ReportChecklistItem[]): string {
  if (items.length === 0) return "<p>Ingen checklista</p>";
  
  return `
    <div class="checklist">
      ${items.map((item) => `
        <div class="checklist-item">
          <div class="checklist-checkbox ${item.completed ? "checked" : ""}"></div>
          <div class="checklist-label">
            ${escapeHtml(item.label)}
            ${item.notes ? `<div class="checklist-notes">${escapeHtml(item.notes)}</div>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function generateSectionTable(tableData: ReportSectionInstance["tableData"]): string {
  if (!tableData || tableData.columns.length === 0) {
    return "<p>Ingen tabell</p>";
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          ${tableData.columns.map((col) => `
            <th>${escapeHtml(col.label)}${col.unit ? ` (${escapeHtml(col.unit)})` : ""}</th>
          `).join("")}
        </tr>
      </thead>
      <tbody>
        ${tableData.rows.map((row) => `
          <tr>
            ${tableData.columns.map((col) => `
              <td>${escapeHtml(String(row.values[col.id] || ""))}</td>
            `).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateSectionSignatures(signatures: NonNullable<ReportSectionInstance["signatures"]>): string {
  if (signatures.length === 0) return "";
  
  return `
    <div class="signatures">
      ${signatures.map((sig) => `
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(sig.name)}</div>
          <div class="signature-role">${escapeHtml(sig.role)}</div>
          <div class="signature-date">${formatDate(sig.date)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function generateSectionLinks(links: NonNullable<ReportSectionInstance["links"]>): string {
  if (links.length === 0) return "<p>Inga länkar</p>";
  
  return `
    <ul class="links-list">
      ${links.map((link) => `
        <li>
          <a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.label)}</a>
          ${link.description ? `<br><small>${escapeHtml(link.description)}</small>` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

// ============================================================================
// Checklist
// ============================================================================

function generateChecklist(checklist: ReportChecklistItem[], isInternal: boolean): string {
  if (checklist.length === 0) return "";
  
  return `
    <div class="checklist">
      <h2 class="checklist-title">Checklista</h2>
      ${checklist.map((item) => `
        <div class="checklist-item">
          <div class="checklist-checkbox ${item.completed ? "checked" : ""}"></div>
          <div class="checklist-label">
            ${escapeHtml(item.label)}
            ${item.required ? " <small>(obligatorisk)</small>" : ""}
            ${item.notes ? `<div class="checklist-notes">${escapeHtml(item.notes)}</div>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================================================
// Footer
// ============================================================================

function generateFooter(profile: PdfProfile, context: TemplateContext): string {
  const footerText = profile.footerText
    ? renderTemplate(profile.footerText, context)
    : "";
  
  const now = new Date();
  
  return `
    <footer class="footer">
      ${footerText ? `<div class="footer-text">${escapeHtml(footerText)}</div>` : ""}
      <div class="footer-date">
        Genererad ${now.toLocaleDateString("sv-SE")} ${now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </footer>
  `;
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function formatDate(date: string | undefined): string {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("sv-SE");
  } catch {
    return date;
  }
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Öppnar PDF i nytt fönster för utskrift
 */
export function openPdfPreview(options: PdfGeneratorOptions): Window | null {
  const html = generatePdfHtml(options);
  const win = window.open("", "_blank");
  
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
  }
  
  return win;
}

/**
 * Öppnar PDF och triggar utskrift direkt
 */
export function printPdf(options: PdfGeneratorOptions): void {
  const win = openPdfPreview(options);
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
}

export default {
  generatePdfHtml,
  openPdfPreview,
  printPdf,
};
