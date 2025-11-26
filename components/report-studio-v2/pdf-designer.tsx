"use client";

/**
 * PDF Designer Component
 * 
 * Visar hur PDF:en kommer att se ut med den valda mallen.
 * Inkluderar PDF-nedladdning och förhandsvisning.
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  IconPrinter, 
  IconDownload, 
  IconEye, 
  IconLoader2,
  IconFileTypePdf,
  IconCheck,
} from "@tabler/icons-react";
import { useSimpleReportStore } from "@/stores/simpleReportStore";
import { getTradeColors } from "@/lib/constants/colors";
import { PDF_DESIGNS, type PdfDesignId } from "@/lib/rapport/pdfDesigns";

export function PdfDesigner() {
  const { getActiveTemplate } = useSimpleReportStore();
  const template = getActiveTemplate();
  const [downloading, setDownloading] = useState(false);

  // Generera preview HTML
  const previewHtml = useMemo(() => {
    if (!template) return "";
    return generatePreviewHtml(template.name, template.sections, template.trade, template.designId);
  }, [template]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <IconEye className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">Välj en mall för att se förhandsvisning</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const handlePreview = () => {
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    }
  };

  // Ladda ner som PDF via print-to-PDF
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Öppna i nytt fönster med instruktioner för att spara som PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Lägg till instruktioner och auto-print
        const htmlWithInstructions = previewHtml.replace(
          "</body>",
          `
          <script>
            window.onload = function() {
              // Visa instruktioner kort
              const overlay = document.createElement('div');
              overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;';
              overlay.innerHTML = '<div style="background:white;padding:32px;border-radius:12px;text-align:center;max-width:400px;"><h2 style="margin:0 0 16px;font-size:20px;">Spara som PDF</h2><p style="margin:0 0 24px;color:#666;">Välj "Spara som PDF" som skrivare i utskriftsdialogen.</p><button onclick="this.parentElement.parentElement.remove();window.print();" style="background:#10b981;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer;">Fortsätt till utskrift</button></div>';
              document.body.appendChild(overlay);
            };
          </script>
          </body>`
        );
        printWindow.document.write(htmlWithInstructions);
        printWindow.document.close();
      }
      toast.success("PDF-förhandsvisning öppnad - välj 'Spara som PDF' i utskriftsdialogen");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    } finally {
      setDownloading(false);
    }
  };

  const selectedDesign = template.designId ? PDF_DESIGNS[template.designId] : PDF_DESIGNS.standard;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">PDF-förhandsvisning</h2>
          <p className="text-sm text-gray-400 mt-1">
            {template.name} • Design: {selectedDesign.name}
            {template.designId && (
              <span className="ml-2 text-emerald-400">
                • Aktiv design
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <IconEye className="w-4 h-4 mr-2" />
            Öppna
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <IconPrinter className="w-4 h-4 mr-2" />
            Skriv ut
          </Button>
          <Button 
            size="sm" 
            onClick={handleDownloadPdf} 
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {downloading ? (
              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <IconFileTypePdf className="w-4 h-4 mr-2" />
            )}
            Ladda ner PDF
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          {/* A4 Preview Container */}
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ 
              aspectRatio: "210 / 297",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Generate Preview HTML
// ============================================================================

function generatePreviewHtml(
  templateName: string, 
  sections: Array<{ type: string; title: string; description?: string }>,
  trade: string = "bygg",
  designId?: PdfDesignId
): string {
  const colors = getTradeColors(trade);
  const selectedDesign = designId ? PDF_DESIGNS[designId] : PDF_DESIGNS.standard;
  
  // Generera sektioner HTML
  const sectionsHtml = sections.map((section, index) => {
    const isText = section.type === "text";
    const isGrundinfo = section.title.toLowerCase().includes("grundinformation");
    
    return `
      <div style="
        margin-bottom: 24px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      ">
        <div style="
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          ${isText ? "📝" : "🖼️"} ${section.title}
          ${section.description ? `<span style="opacity: 0.8; font-size: 12px;">• ${section.description}</span>` : ""}
        </div>
        <div style="
          background: ${isGrundinfo ? colors.accent : (isText ? "#f8fafc" : "#faf5ff")};
          padding: 16px;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isGrundinfo ? colors.primary : "#6b7280"};
          font-size: 13px;
        ">
          ${isText ? 
            `<div style="text-align: center;">
              <div style="opacity: 0.6;">Här kommer textinnehållet att visas...</div>
              <div style="margin-top: 4px; font-size: 11px; opacity: 0.4;">${section.description || "Textsektion"}</div>
            </div>` : 
            `<div style="text-align: center;">
              <div style="opacity: 0.6;">📷 Bildgalleri</div>
              <div style="margin-top: 4px; font-size: 11px; opacity: 0.4;">${section.description || "Bildsektion"}</div>
            </div>`
          }
        </div>
      </div>
    `;
  }).join("");

  // Skapa mock report för design-rendering
  const mockReport = {
    id: "preview-report",
    title: templateName,
    status: "draft" as const,
    templateId: "preview-template",
    metadata: { 
      client: "Exempelkund", 
      location: "Exempeladress",
      projectReference: "PROJ-001",
      assignedTo: "Exempeltekniker",
      phone: "070-123 45 67",
      email: "exempel@foretag.se",
      investigator: "Exempelutredare",
      scheduledAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      designId: designId
    },
    sections: [],
    checklist: [],
    assets: [],
    updatedAt: new Date().toISOString(),
    type: trade as any
  };

  // Använd den valda designen för att rendera HTML
  return selectedDesign.render({
    report: mockReport,
    sectionsHtml,
    metadata: {
      "Kund": mockReport.metadata.client,
      "Adress": mockReport.metadata.location,
      "Projekt": mockReport.metadata.projectReference,
      "Tekniker": mockReport.metadata.assignedTo,
      "Datum": new Date().toLocaleDateString("sv-SE")
    },
    colors,
    profile: undefined
  });
}

export default PdfDesigner;
