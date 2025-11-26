/**
 * Simple PDF Generator
 * 
 * Förenklad PDF-generator för det nya mallsystemet.
 * Endast 2 sektionstyper: text och images.
 */

import type {
  SimpleReportTemplate,
  SimpleSectionInstance,
  TextSectionContent,
  ImagesSectionContent,
  AnnotatedImage,
  ReportTrade,
} from "@/lib/types/rapport";
import { getTradeColors } from "@/lib/constants/colors";

// ============================================================================
// Types
// ============================================================================

export interface SimplePdfOptions {
  /** Rapporttitel */
  title: string;
  /** Undertitel */
  subtitle?: string;
  /** Omslagsbild URL */
  coverImageUrl?: string;
  /** Logotyp URL */
  logoUrl?: string;
  /** Mall som används */
  template: SimpleReportTemplate;
  /** Ifyllda sektioner */
  sections: SimpleSectionInstance[];
  /** Metadata */
  metadata: {
    customer?: string;
    address?: string;
    contact?: string;
    phone?: string;
    date?: string;
    inspector?: string;
    reportNumber?: string;
  };
  /** Företagsinfo */
  company?: {
    name: string;
    phone?: string;
    email?: string;
  };
}

// ============================================================================
// Color Schemes per Trade - Now imported from central location
// ============================================================================

// ============================================================================
// Section Renderers
// ============================================================================

function renderTextSection(
  section: SimpleSectionInstance,
  index: number,
  colors: { primary: string; secondary: string }
): string {
  const content = section.textContent;
  if (!content) {
    return `
      <div class="section" style="margin-bottom: 24px;">
        <div class="section-header" style="
          background: ${colors.primary};
          color: white;
          padding: 12px 16px;
          border-radius: 8px 8px 0 0;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span class="section-number" style="
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
        <div class="section-content" style="
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
          color: #64748b;
          font-style: italic;
        ">
          Ingen text ifylld
        </div>
      </div>
    `;
  }

  // Konvertera markdown till enkel HTML
  const formattedText = content.text
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return `
    <div class="section" style="margin-bottom: 24px;">
      <div class="section-header" style="
        background: ${colors.primary};
        color: white;
        padding: 12px 16px;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span class="section-number" style="
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
      <div class="section-content" style="
        padding: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 8px 8px;
        line-height: 1.7;
      ">
        <p>${formattedText}</p>
      </div>
    </div>
  `;
}

function renderImagesSection(
  section: SimpleSectionInstance,
  index: number,
  colors: { primary: string; secondary: string }
): string {
  const content = section.imagesContent;
  const images = content?.images || [];

  if (images.length === 0) {
    return `
      <div class="section" style="margin-bottom: 24px;">
        <div class="section-header" style="
          background: ${colors.primary};
          color: white;
          padding: 12px 16px;
          border-radius: 8px 8px 0 0;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span class="section-number" style="
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
        <div class="section-content" style="
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
          color: #64748b;
          font-style: italic;
          text-align: center;
        ">
          Inga bilder uppladdade
        </div>
      </div>
    `;
  }

  const imagesHtml = images.map((img, imgIndex) => `
    <div class="image-item" style="break-inside: avoid;">
      <img 
        src="${img.url}" 
        alt="${img.caption || `Bild ${imgIndex + 1}`}"
        style="
          width: 100%;
          height: auto;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        "
      />
      ${img.caption ? `
        <p style="
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
          text-align: center;
        ">${img.caption}</p>
      ` : ""}
      ${img.annotations && img.annotations.length > 0 ? `
        <p style="
          margin-top: 4px;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        ">${img.annotations.length} annotering(ar)</p>
      ` : ""}
    </div>
  `).join("");

  // Bestäm antal kolumner baserat på antal bilder
  const columns = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;

  return `
    <div class="section" style="margin-bottom: 24px;">
      <div class="section-header" style="
        background: ${colors.primary};
        color: white;
        padding: 12px 16px;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="section-number" style="
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
        <span style="font-size: 12px; opacity: 0.8;">${images.length} bilder</span>
      </div>
      <div class="section-content" style="
        padding: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 8px 8px;
      ">
        <div style="
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          gap: 16px;
        ">
          ${imagesHtml}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Main Generator
// ============================================================================

export function generateSimplePdfHtml(options: SimplePdfOptions): string {
  const {
    title,
    subtitle,
    coverImageUrl,
    logoUrl,
    template,
    sections,
    metadata,
    company,
  } = options;

  const tradeColors = getTradeColors(template.trade);
  const colors = { primary: tradeColors.primary, secondary: tradeColors.secondary };

  // Rendera sektioner
  const sectionsHtml = sections
    .sort((a, b) => a.order - b.order)
    .map((section, index) => {
      if (section.type === "text") {
        return renderTextSection(section, index, colors);
      } else {
        return renderImagesSection(section, index, colors);
      }
    })
    .join("");

  // Metadata HTML
  const metadataFields = [
    { label: "Kund", value: metadata.customer },
    { label: "Adress", value: metadata.address },
    { label: "Kontakt", value: metadata.contact },
    { label: "Telefon", value: metadata.phone },
    { label: "Datum", value: metadata.date },
    { label: "Besiktningsman", value: metadata.inspector },
    { label: "Rapportnummer", value: metadata.reportNumber },
  ].filter(f => f.value);

  const metadataHtml = metadataFields.length > 0 ? `
    <div style="
      padding: 24px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    ">
      ${metadataFields.map(f => `
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${f.label}</div>
          <div style="font-size: 14px; font-weight: 500; color: #1f2937; margin-top: 2px;">${f.value}</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        body {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #1f2937;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        @media print {
          .section {
            page-break-inside: avoid;
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
          ${logoUrl ? `
            <img src="${logoUrl}" alt="Logo" style="max-height: 48px; width: auto;" />
          ` : `
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
            ">${company?.name?.[0] || "R"}</div>
          `}
          <div>
            <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">RAPPORT</div>
            <div style="font-size: 18px; font-weight: 600;">${template.name}</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 13px;">
          <div>${metadata.date || new Date().toLocaleDateString("sv-SE")}</div>
          ${metadata.reportNumber ? `<div style="opacity: 0.8;">#${metadata.reportNumber}</div>` : ""}
        </div>
      </header>

      <!-- Title Section -->
      <div style="padding: 40px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="
          font-size: 28px;
          font-weight: 700;
          color: ${colors.primary};
          margin-bottom: 8px;
        ">${title}</h1>
        ${subtitle ? `<p style="color: #64748b; font-size: 15px;">${subtitle}</p>` : ""}
        
        ${coverImageUrl ? `
          <div style="margin-top: 24px;">
            <img 
              src="${coverImageUrl}" 
              alt="Omslagsbild"
              style="
                width: 100%;
                max-height: 300px;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              "
            />
          </div>
        ` : ""}
      </div>

      <!-- Metadata -->
      ${metadataHtml}

      <!-- Sections -->
      <div style="padding: 40px;">
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
        font-size: 11px;
      ">
        <div>
          ${company?.name ? `<span>${company.name}</span>` : ""}
          ${company?.phone ? `<span style="margin-left: 16px; opacity: 0.8;">${company.phone}</span>` : ""}
          ${company?.email ? `<span style="margin-left: 16px; opacity: 0.8;">${company.email}</span>` : ""}
        </div>
        <div style="opacity: 0.8;">Genererad med Agenter Rapport System</div>
      </footer>
    </body>
    </html>
  `;
}

/**
 * Öppnar PDF i nytt fönster
 */
export function openSimplePdfPreview(html: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Skriver ut PDF
 */
export function printSimplePdf(html: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
}

export default generateSimplePdfHtml;
