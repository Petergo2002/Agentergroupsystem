/**
 * Report Studio - Publish Module
 * 
 * Hanterar publicering av mallar från Report Studio till User Dashboard.
 * Synkar mallar med Supabase och genererar PDF:er.
 */

import { createSupabaseClient, IS_DEMO_MODE } from "../supabase";
import type { 
  SimpleReportTemplate, 
  SimpleSectionDefinition,
  ReportTrade,
} from "../types/rapport";
import { TRADE_COLORS, getTradeColors } from "../constants/colors";

// ============================================================================
// Types
// ============================================================================

export interface PublishOptions {
  templateId: string;
  includePreview?: boolean;
}

export interface PublishResult {
  success: boolean;
  templateId: string;
  message: string;
  previewUrl?: string;
}

// ============================================================================
// Trade Colors - Now imported from central location
// ============================================================================
// TRADE_COLORS is now imported from @/lib/constants/colors

// ============================================================================
// Publish Functions
// ============================================================================

/**
 * Publicerar en mall till Supabase så att den blir tillgänglig i User Dashboard
 */
export async function publishTemplate(options: PublishOptions): Promise<PublishResult> {
  const { templateId, includePreview = false } = options;

  try {
    if (IS_DEMO_MODE) {
      return {
        success: true,
        templateId,
        message: "Mall publicerad (demo-läge)",
      };
    }

    const supabase = createSupabaseClient();
    
    // Hämta mallen från local store eller Supabase
    const { data: template, error } = await supabase
      .from("report_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error || !template) {
      return {
        success: false,
        templateId,
        message: "Mall hittades inte",
      };
    }

    // Uppdatera mallen som "publicerad"
    const { error: updateError } = await supabase
      .from("report_templates")
      .update({ 
        updated_at: new Date().toISOString(),
        // Lägg till en "published" flagga om den finns i schemat
      })
      .eq("id", templateId);

    if (updateError) {
      return {
        success: false,
        templateId,
        message: `Kunde inte publicera: ${updateError.message}`,
      };
    }

    return {
      success: true,
      templateId,
      message: "Mall publicerad framgångsrikt",
    };
  } catch (error) {
    console.error("Failed to publish template:", error);
    return {
      success: false,
      templateId,
      message: "Ett oväntat fel uppstod",
    };
  }
}

// ============================================================================
// PDF Generation (matchar Report Studio design)
// ============================================================================

/**
 * Genererar PDF HTML för en mall med Report Studio-design
 */
export function generateTemplatePdfHtml(
  template: SimpleReportTemplate,
  metadata?: {
    client?: string;
    location?: string;
    projectReference?: string;
    assignedTo?: string;
    date?: string;
  }
): string {
  const colors = getTradeColors(template.trade);
  
  const sectionsHtml = template.sections
    .sort((a: SimpleSectionDefinition, b: SimpleSectionDefinition) => a.order - b.order)
    .map((section: SimpleSectionDefinition, index: number) => {
      const isText = section.type === "text";
      const isGrundinfo = section.title.toLowerCase().includes("grundinformation");
      const bgColor = isGrundinfo ? colors.accent : (isText ? "#f8fafc" : "#faf5ff");
      const borderColor = isGrundinfo ? colors.primary : (isText ? colors.secondary : "#a855f7");
      
      // Grundinformation-sektion med metadata
      if (isGrundinfo && metadata) {
        return `
          <div style="
            margin-bottom: 24px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          ">
            <div style="
              background: linear-gradient(135deg, ${borderColor} 0%, ${borderColor}dd 100%);
              color: white;
              padding: 12px 16px;
              font-size: 14px;
              font-weight: 600;
            ">
              ${section.title}
            </div>
            <div style="padding: 20px; background: ${bgColor};">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                ${metadata.client ? `<div><strong>Kund:</strong> ${metadata.client}</div>` : ""}
                ${metadata.location ? `<div><strong>Adress:</strong> ${metadata.location}</div>` : ""}
                ${metadata.assignedTo ? `<div><strong>Kontaktperson:</strong> ${metadata.assignedTo}</div>` : ""}
                ${metadata.projectReference ? `<div><strong>Projektreferens:</strong> ${metadata.projectReference}</div>` : ""}
                ${metadata.date ? `<div><strong>Datum:</strong> ${metadata.date}</div>` : ""}
              </div>
            </div>
          </div>
        `;
      }
      
      return `
        <div style="
          margin-bottom: 24px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        ">
          <div style="
            background: linear-gradient(135deg, ${borderColor} 0%, ${borderColor}dd 100%);
            color: white;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              font-size: 12px;
            ">${index + 1}</span>
            ${section.title}
          </div>
          <div style="
            padding: 20px;
            background: ${bgColor};
            min-height: 80px;
          ">
            ${isText ? `
              <div style="color: #64748b; font-size: 13px; font-style: italic;">
                ${section.description || "Här skriver användaren text..."}
              </div>
              <div style="
                margin-top: 12px;
                padding: 12px;
                background: white;
                border-radius: 6px;
                border: 1px dashed #cbd5e1;
                color: #94a3b8;
                font-size: 12px;
              ">
                [Textinnehåll fylls i av användaren]
              </div>
            ` : `
              <div style="color: #64748b; font-size: 13px; font-style: italic; margin-bottom: 12px;">
                ${section.description || "Här laddas bilder upp..."}
              </div>
              <div style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
              ">
                ${[1, 2, 3].map(() => `
                  <div style="
                    aspect-ratio: 4/3;
                    background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px dashed #cbd5e1;
                  ">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </svg>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `;
    }).join("");

  return `
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: white;
          color: #1f2937;
          line-height: 1.6;
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
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <header style="
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%);
        color: white;
        padding: 24px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="
            width: 48px;
            height: 48px;
            background: ${colors.secondary};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 20px;
          ">R</div>
          <div>
            <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">RAPPORT</div>
            <div style="font-size: 18px; font-weight: 600;">${template.name}</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 13px; opacity: 0.9;">
          <div>${metadata?.date || new Date().toLocaleDateString("sv-SE")}</div>
        </div>
      </header>

      <!-- Title Section -->
      <div style="padding: 40px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="
          font-size: 28px;
          font-weight: 700;
          color: ${colors.primary};
          margin-bottom: 8px;
        ">${metadata?.client || "[Rapporttitel]"}</h1>
        <p style="color: #64748b; font-size: 15px;">${metadata?.location || "[Adress]"}</p>
      </div>

      <!-- Sections -->
      <div style="padding: 40px;">
        <h2 style="
          font-size: 18px;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        ">Innehåll</h2>
        
        ${sectionsHtml}
      </div>

      <!-- Footer -->
      <footer style="
        background: ${colors.primary};
        color: white;
        padding: 20px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        margin-top: auto;
      ">
        <div style="opacity: 0.8;">Genererad med Agenter Rapport System</div>
        <div style="opacity: 0.8;">Sida 1</div>
      </footer>
    </body>
    </html>
  `;
}

/**
 * Öppnar PDF i nytt fönster
 */
export function openTemplatePdf(template: SimpleReportTemplate, metadata?: Parameters<typeof generateTemplatePdfHtml>[1]): void {
  const html = generateTemplatePdfHtml(template, metadata);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/**
 * Öppnar PDF med print-dialog
 */
export function printTemplatePdf(template: SimpleReportTemplate, metadata?: Parameters<typeof generateTemplatePdfHtml>[1]): void {
  const html = generateTemplatePdfHtml(template, metadata);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
}

export default {
  publishTemplate,
  generateTemplatePdfHtml,
  openTemplatePdf,
  printTemplatePdf,
  TRADE_COLORS,
};
