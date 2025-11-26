/**
 * PDF Generator för Rapport-systemet
 * 
 * Genererar HTML för PDF-export baserat på vald design.
 */

import type {
  Report,
  ReportTemplate,
  ReportSectionInstance,
  ReportSectionDefinition,
  PdfProfile,
  ReportAsset,
} from "@/lib/types/rapport";
import { getPdfDesign } from "./pdfDesigns";
import { getTradeColors, DEFAULT_TRADE_COLORS } from "@/lib/constants/colors";

// ============================================================================
// Types
// ============================================================================

export type PdfViewMode = "internal" | "customer";

export interface PdfGeneratorOptions {
  report: Report;
  template?: ReportTemplate | null;
  sectionDefinitions?: ReportSectionDefinition[];
  pdfProfile?: PdfProfile;
  viewMode?: PdfViewMode;
}

// ============================================================================
// Main Generator
// ============================================================================

export function generatePdfHtml(options: PdfGeneratorOptions): string {
  const {
    report,
    template,
    pdfProfile,
    viewMode = "customer",
  } = options;

  // Determine colors
  const baseColors = getTradeColors(report.type);
  const colors = {
    primary: pdfProfile?.brandColor || baseColors.primary,
    secondary: pdfProfile?.accentColor || baseColors.secondary,
    accent: baseColors.accent,
  };

  const isInternal = viewMode === "internal";

  // Filter sections
  const visibleSections = report.sections.filter((section) => {
    if (!isInternal && section.visibility?.audience === "internal") return false;
    return true;
  });

  // Generate sections HTML
  const sectionsHtml = visibleSections.map((section, index) => 
    renderSectionContent(section, index + 1, colors, isInternal, report)
  ).join("");

  // Get metadata values
  const metadata = getMetadataFromReport(report);

  // Select design renderer
  const designId = pdfProfile?.designId || report.metadata.designId || "standard";
  const design = getPdfDesign(designId);

  // Render full HTML using the design template
  return design.render({
    report,
    sectionsHtml,
    metadata,
    colors,
    profile: pdfProfile,
  });
}

// ============================================================================
// Section Content Renderer
// ============================================================================

function renderSectionContent(
  section: ReportSectionInstance,
  index: number,
  colors: { primary: string; secondary: string; accent: string },
  isInternal: boolean,
  report: Report
): string {
  const title = escapeHtml(section.title);
  const isImage = section.type === "image" || section.type === "image_gallery" || section.type === "image_annotated";
  
  // Styling vars
  const bgColor = isImage ? "#faf5ff" : "#f8fafc";
  const borderColor = isImage ? "#a855f7" : colors.secondary;
  
  let contentHtml = "";

  if (isImage) {
    const assetIds = section.assetIds || (section.assetId ? [section.assetId] : []);
    // Lookup assets
    const assets = assetIds.map(id => report.assets?.find(a => a.id === id)).filter(Boolean) as ReportAsset[];

    if (assets.length === 0) {
      contentHtml = `<div style="color: #64748b; font-style: italic;">Inga bilder valda</div>`;
    } else {
      contentHtml = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          ${assets.map(asset => `
            <div>
              <img src="${asset.url}" alt="${escapeHtml(asset.label || '')}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb;" />
              ${asset.label ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; text-align: center;">${escapeHtml(asset.label)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      `;
    }
  } else {
    const content = section.content || "";
    contentHtml = content ? `
      <div style="padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(content)}</div>
    ` : `
      <div style="color: #64748b; font-style: italic;">Ingen text angiven</div>
    `;
  }

  // Internal Notes
  const notesHtml = isInternal && section.internalNotes ? `
    <div style="margin-top: 16px; padding: 12px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <div style="font-size: 10px; font-weight: 700; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">INTERN ANTECKNING</div>
      <div style="color: #92400e; font-size: 13px;">${escapeHtml(section.internalNotes)}</div>
    </div>
  ` : "";

  return `
    <div class="section-block" style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div class="section-header" style="background: linear-gradient(135deg, ${borderColor} 0%, ${borderColor}dd 100%); color: white; padding: 12px 16px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; font-size: 12px;">${index}</span>
        ${title}
      </div>
      <div class="section-body" style="padding: 20px; background: ${bgColor}; min-height: 80px;">
        ${contentHtml}
        ${notesHtml}
      </div>
    </div>
  `;
}

// ============================================================================
// Helpers
// ============================================================================

function getMetadataFromReport(report: Report): Record<string, string> {
  return {
    "Kund": report.metadata.client || "",
    "Adress": report.metadata.location || "",
    "Kontaktperson": report.metadata.assignedTo || "",
    "Projektreferens": report.metadata.projectReference || "",
    "Datum": formatDate(report.metadata.scheduledAt),
    "Utredare": report.metadata.investigator || "",
    "Telefon": report.metadata.phone || "",
    "E-post": report.metadata.email || "",
  };
}

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return new Date().toLocaleDateString("sv-SE");
  try {
    return new Date(dateString).toLocaleDateString("sv-SE");
  } catch {
    return dateString;
  }
}

/**
 * Öppnar PDF i nytt fönster för utskrift/nedladdning
 */
export function openPdfPreview(options: PdfGeneratorOptions): Window | null {
  const html = generatePdfHtml(options);
  
  const htmlWithInstructions = html.replace(
    "</body>",
    `
    <div id="print-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; padding: 32px; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #1f2937;">Ladda ner PDF</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          Klicka på knappen nedan för att öppna utskriftsdialogen.<br>
          Välj <strong>"Spara som PDF"</strong> som skrivare.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="this.closest('#print-overlay').remove(); window.print();" style="background: #065f46; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 500;">
            Öppna utskriftsdialog
          </button>
          <button onclick="this.closest('#print-overlay').remove();" style="background: transparent; color: #6b7280; border: 1px solid #e5e7eb; padding: 12px 24px; border-radius: 8px; font-size: 14px; cursor: pointer;">
            Bara visa
          </button>
        </div>
      </div>
    </div>
    </body>`
  );
  
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(htmlWithInstructions);
    win.document.close();
    win.focus();
  }
  
  return win;
}

export default { generatePdfHtml, openPdfPreview };
