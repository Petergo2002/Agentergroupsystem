"use client";

/**
 * PDF Designs Manager
 * 
 * Visar och hanterar tillgängliga PDF-designs (Standard, Modern Hero)
 * Ger en fin UI för att se design-egenskaper och förhandsgranska dem
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  IconPalette, 
  IconEye, 
  IconDownload,
  IconSettings,
  IconFileText,
  IconBrush
} from "@tabler/icons-react";
import { PDF_DESIGNS, type PdfDesignId } from "@/lib/rapport/pdfDesigns";
import { getTradeColors } from "@/lib/constants/colors";
import { useSimpleReportStore } from "@/stores/simpleReportStore";

interface DesignCardProps {
  designId: PdfDesignId;
  onSelect: (id: PdfDesignId) => void;
  selectedDesign?: PdfDesignId;
  hasActiveTemplate: boolean;
}

function DesignCard({ designId, onSelect, selectedDesign, hasActiveTemplate }: DesignCardProps) {
  const design = PDF_DESIGNS[designId];
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Hämta aktiv mall för att få rätt trade
  const { getActiveTemplate } = useSimpleReportStore();
  const activeTemplate = getActiveTemplate();
  const trade = activeTemplate?.trade || "bygg";
  const colors = getTradeColors(trade);

  // Skapa en enkel preview HTML för designen
  const generatePreviewHtml = () => {
    const mockReport = {
      id: "mock-report-id",
      title: "Exempelrapport",
      status: "draft" as const,
      templateId: "mock-template-id",
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

    return design.render({
      report: mockReport,
      sectionsHtml: `
        <div style="padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${colors.primary}; margin-bottom: 16px;">Exempelsektion</h3>
          <p style="color: #374151; line-height: 1.6;">
            Detta är en förhandsvisning av hur text kommer att se ut i denna design.
            Designen använder färgschemat för branschen med anpassade typsnitt och layout.
          </p>
          <div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
            <small style="color: #6b7280;">Design: ${design.name}</small>
          </div>
        </div>
      `,
      metadata: {
        "Kund": "Exempelkund",
        "Adress": "Exempeladress",
        "Datum": new Date().toLocaleDateString("sv-SE")
      },
      colors,
      profile: undefined
    });
  };

  const handlePreview = () => {
    const previewHtml = generatePreviewHtml();
    const previewWindow = window.open("", "_blank", "width=800,height=600");
    if (previewWindow) {
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    }
  };

  return (
    <Card className="bg-[#1a1a1a] border-white/10 hover:border-emerald-500/30 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <IconPalette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{design.name}</CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {design.description}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={selectedDesign === designId ? "default" : "outline"} 
            className={selectedDesign === designId 
              ? "bg-emerald-500 text-white" 
              : "border-emerald-500/30 text-emerald-400"
            }
          >
            {selectedDesign === designId ? "Vald" : "Tillgänglig"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Design-färg förhandsvisning */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Färgschema ({activeTemplate ? activeTemplate.trade.charAt(0).toUpperCase() + activeTemplate.trade.slice(1) : "Bygg"}):
          </p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: colors.primary }}
              />
              <span className="text-xs text-gray-300">Primär</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: colors.secondary }}
              />
              <span className="text-xs text-gray-300">Sekundär</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: colors.accent }}
              />
              <span className="text-xs text-gray-300">Accent</span>
            </div>
          </div>
        </div>

        {/* Design-egenskaper */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Egenskaper:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <IconFileText className="w-3 h-3" />
              <span>Professionell layout</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <IconBrush className="w-3 h-3" />
              <span>Branschanpassade färger</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <IconSettings className="w-3 h-3" />
              <span>PDF-optimerad</span>
            </div>
          </div>
        </div>

        {/* Åtgärds-knappar */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex-1 border-white/20 hover:bg-white/10 text-white"
          >
            <IconEye className="w-4 h-4 mr-2" />
            Förhandsvisa
          </Button>
          <Button
            variant={selectedDesign === designId ? "default" : "outline"}
            size="sm"
            onClick={() => hasActiveTemplate && onSelect(designId)}
            disabled={!hasActiveTemplate}
            className={selectedDesign === designId
              ? "bg-emerald-500 text-white"
              : hasActiveTemplate
                ? "border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                : "border-gray-500/30 text-gray-400 cursor-not-allowed"
            }
          >
            <IconSettings className="w-4 h-4 mr-1" />
            {selectedDesign === designId ? "Aktiv" : hasActiveTemplate ? "Använd" : "Välj mall"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DesignsManager() {
  const { getActiveTemplate, updateTemplate } = useSimpleReportStore();
  const activeTemplate = getActiveTemplate();
  
  const handleSelectDesign = async (designId: PdfDesignId) => {
    if (!activeTemplate) {
      toast.error("Ingen aktiv mall vald");
      return;
    }

    try {
      // Uppdatera mallen med ny designId
      await updateTemplate(activeTemplate.id, { designId });
      toast.success(`Design "${PDF_DESIGNS[designId].name}" har sparats på mallen "${activeTemplate.name}"`);
    } catch (error) {
      console.error("Failed to update template design:", error);
      toast.error("Kunde inte spara designen");
    }
  };

  const designIds: PdfDesignId[] = ["standard", "modern_hero"];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 bg-[#111111]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <IconPalette className="w-5 h-5 text-emerald-400" />
              PDF Designs
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Hantera och anpassa utseendet på dina rapport-PDF:er
              {activeTemplate && (
                <span className="ml-2 text-emerald-400">
                  • Aktiv mall: {activeTemplate.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {designIds.length} designs
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Info-sektion */}
          {activeTemplate ? (
            <div className="mb-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <IconPalette className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-1">Välj design för "{activeTemplate.name}"</h3>
                  <p className="text-sm text-gray-400">
                    Klicka på "Använd" för att välja en PDF-design för denna mall. 
                    Designen kommer att användas när rapporter genereras från denna mall.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <IconSettings className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-1">Ingen mall vald</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Du måste välja en mall för att kunna ange en PDF-design.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-amber-300">📝 Steg 1: Gå tillbaka till mall-listan</p>
                    <p className="text-amber-300">📝 Steg 2: Välj en mall att redigera</p>
                    <p className="text-amber-300">📝 Steg 3: Klicka på "PDF Designs" tabben igen</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Design-grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {designIds.map((designId) => (
              <DesignCard
                key={designId}
                designId={designId}
                onSelect={handleSelectDesign}
                selectedDesign={activeTemplate?.designId}
                hasActiveTemplate={!!activeTemplate}
              />
            ))}
          </div>

          {/* Kommande funktioner */}
          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <IconSettings className="w-5 h-5" />
              Kommande funktioner
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <IconBrush className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-white text-sm font-medium mb-1">Anpassa färger</h4>
                <p className="text-xs text-gray-400">
                  Skapa egna färgscheman för din profil
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <IconFileText className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-white text-sm font-medium mb-1">Logotyp & branding</h4>
                <p className="text-xs text-gray-400">
                  Lägg till din logotyp och företagsinformation
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <IconDownload className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-white text-sm font-medium mb-1">Exportera inställningar</h4>
                <p className="text-xs text-gray-400">
                  Spara och dela dina design-konfigurationer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignsManager;
