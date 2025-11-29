"use client";

/**
 * PDF Designs Manager
 *
 * Visar och hanterar tillgängliga PDF-designs (Standard, Modern Hero)
 * Ger en fin UI för att se design-egenskaper och förhandsgranska dem
 * Inkluderar branding-inställningar (header, logo, färger)
 * Admin kan toggla vilka designer som är aktiva för användare
 */

import {
  IconBrush,
  IconCheck,
  IconEye,
  IconFileText,
  IconLoader2,
  IconPalette,
  IconSettings,
  IconToggleLeft,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getTradeColors } from "@/lib/constants/colors";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import { PDF_DESIGNS, type PdfDesignId } from "@/lib/rapport/pdfDesigns";
import { useSimpleReportStore } from "@/stores/simpleReportStore";

interface DesignCardProps {
  designId: PdfDesignId;
  onSelect: (id: PdfDesignId) => void;
  selectedDesign?: PdfDesignId;
  hasActiveTemplate: boolean;
  isEnabled: boolean;
  onToggleEnabled: (id: PdfDesignId, enabled: boolean) => void;
  isAdmin?: boolean;
}

function DesignCard({
  designId,
  onSelect,
  selectedDesign,
  hasActiveTemplate,
  isEnabled,
  onToggleEnabled,
  isAdmin = false,
}: DesignCardProps) {
  const design = PDF_DESIGNS[designId];

  // Hämta aktiv mall för att få rätt trade
  const { getActiveTemplate } = useSimpleReportStore();
  const { profile } = usePdfProfileStore();
  const activeTemplate = getActiveTemplate();
  const trade = activeTemplate?.trade || "bygg";
  const colors = getTradeColors(trade);

  // Använd profile-färger om de finns, annars trade-färger
  const effectiveColors = {
    primary: profile.brandColor || colors.primary,
    secondary: profile.accentColor || colors.secondary,
    accent: colors.accent,
  };

  // Skapa en enkel preview HTML för designen
  const generatePreviewHtml = () => {
    const mockReport = {
      id: "mock-report-id",
      title: profile.headerText || "Exempelrapport",
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
        designId: designId,
      },
      sections: [],
      checklist: [],
      assets: [],
      updatedAt: new Date().toISOString(),
      type: trade as any,
    };

    return design.render({
      report: mockReport,
      sectionsHtml: `
        <div style="padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${effectiveColors.primary}; margin-bottom: 16px;">Exempelsektion</h3>
          <p style="color: #374151; line-height: 1.6;">
            Detta är en förhandsvisning av hur text kommer att se ut i denna design.
            Designen använder dina branding-färger och inställningar.
          </p>
          <div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
            <small style="color: #6b7280;">Design: ${design.name}</small>
          </div>
        </div>
      `,
      metadata: {
        Kund: "Exempelkund",
        Adress: "Exempeladress",
        Datum: new Date().toLocaleDateString("sv-SE"),
      },
      colors: effectiveColors,
      profile: {
        brandColor: profile.brandColor,
        accentColor: profile.accentColor,
        logoUrl: profile.logoUrl,
        displayLogo: profile.displayLogo,
        headerText: profile.headerText,
        footerText: profile.footerText,
        displayInternalNotes: profile.displayInternalNotes,
      },
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
    <Card
      className={`bg-[#1a1a1a] border-white/10 hover:border-emerald-500/30 transition-all duration-200 ${!isEnabled ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <IconPalette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">
                {design.name}
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {design.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={selectedDesign === designId ? "default" : "outline"}
              className={
                selectedDesign === designId
                  ? "bg-emerald-500 text-white"
                  : isEnabled
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-gray-500/30 text-gray-400"
              }
            >
              {selectedDesign === designId
                ? "Vald"
                : isEnabled
                  ? "Aktiv"
                  : "Inaktiv"}
            </Badge>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Lanserad</span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    onToggleEnabled(designId, checked)
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Design-färg förhandsvisning */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Färgschema (med din branding):
          </p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: effectiveColors.primary }}
              />
              <span className="text-xs text-gray-300">Primär</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: effectiveColors.secondary }}
              />
              <span className="text-xs text-gray-300">Sekundär</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: effectiveColors.accent }}
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
              <span>Anpassade färger & branding</span>
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
            onClick={() => hasActiveTemplate && isEnabled && onSelect(designId)}
            disabled={!hasActiveTemplate || !isEnabled}
            className={
              selectedDesign === designId
                ? "bg-emerald-500 text-white"
                : hasActiveTemplate && isEnabled
                  ? "border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                  : "border-gray-500/30 text-gray-400 cursor-not-allowed"
            }
          >
            <IconCheck className="w-4 h-4 mr-1" />
            {selectedDesign === designId
              ? "Aktiv"
              : hasActiveTemplate
                ? "Använd"
                : "Välj mall"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DesignsManagerProps {
  isAdmin?: boolean;
}

export function DesignsManager({ isAdmin = false }: DesignsManagerProps) {
  const { getActiveTemplate, updateTemplate } = useSimpleReportStore();
  const {
    profile,
    setProfile,
    enabledPdfDesigns,
    setEnabledDesigns,
    loadProfile,
    saveProfile,
    saveEnabledDesigns,
    isLoading,
    isSaving,
  } = usePdfProfileStore();
  const activeTemplate = getActiveTemplate();

  // Ladda profil vid mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSelectDesign = async (designId: PdfDesignId) => {
    if (!activeTemplate) {
      toast.error("Ingen aktiv mall vald");
      return;
    }

    try {
      // Uppdatera mallen med ny designId
      await updateTemplate(activeTemplate.id, { designId });
      toast.success(
        `Design "${PDF_DESIGNS[designId].name}" har sparats på mallen "${activeTemplate.name}"`,
      );
    } catch (error) {
      console.error("Failed to update template design:", error);
      toast.error("Kunde inte spara designen");
    }
  };

  const handleToggleDesign = async (
    designId: PdfDesignId,
    enabled: boolean,
  ) => {
    const newEnabledDesigns = enabled
      ? [...enabledPdfDesigns, designId]
      : enabledPdfDesigns.filter((id) => id !== designId);

    // Säkerställ att minst en design alltid är aktiv
    if (newEnabledDesigns.length === 0) {
      toast.error("Minst en design måste vara aktiv");
      return;
    }

    setEnabledDesigns(newEnabledDesigns);
    const success = await saveEnabledDesigns();
    if (success) {
      toast.success(
        enabled
          ? `Design "${PDF_DESIGNS[designId].name}" är nu tillgänglig för användare`
          : `Design "${PDF_DESIGNS[designId].name}" är nu dold för användare`,
      );
    } else {
      toast.error("Kunde inte spara inställningen");
    }
  };

  const handleSaveBranding = async () => {
    const success = await saveProfile();
    if (success) {
      toast.success("Branding-inställningar sparade!");
    } else {
      toast.error("Kunde inte spara branding-inställningar");
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
              PDF Designs & Branding
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Hantera utseende, färger och branding för dina rapport-PDF:er
              {activeTemplate && (
                <span className="ml-2 text-emerald-400">
                  • Aktiv mall: {activeTemplate.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-400"
              >
                Admin
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400"
            >
              {enabledPdfDesigns.length} aktiva designs
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Branding-sektion */}
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <IconBrush className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      Branding & Header
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Anpassa header-text, logotyp och färger för dina rapporter
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={handleSaveBranding}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <IconCheck className="w-4 h-4 mr-2" />
                  )}
                  Spara branding
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header-text */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">Header-text</Label>
                  <Input
                    value={profile.headerText}
                    onChange={(e) => setProfile({ headerText: e.target.value })}
                    placeholder="T.ex. LÄCKAGERAPPORT eller Företagsnamn"
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-gray-500">
                    Visas i rapportens header
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Footer-text</Label>
                  <Input
                    value={profile.footerText}
                    onChange={(e) => setProfile({ footerText: e.target.value })}
                    placeholder="T.ex. © Företagsnamn 2024"
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-gray-500">
                    Visas i rapportens footer
                  </p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Logo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Logotyp</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Lägg till din företagslogotyp
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Visa logo</span>
                    <Switch
                      checked={profile.displayLogo}
                      onCheckedChange={(checked) =>
                        setProfile({ displayLogo: checked })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      value={profile.logoUrl}
                      onChange={(e) => setProfile({ logoUrl: e.target.value })}
                      placeholder="https://exempel.se/logo.png"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  {profile.logoUrl && (
                    <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                      <img
                        src={profile.logoUrl}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Färger */}
              <div className="space-y-4">
                <Label className="text-gray-300">Färgtema</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">
                      Primärfärg (brand)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={profile.brandColor}
                        onChange={(e) =>
                          setProfile({ brandColor: e.target.value })
                        }
                        className="w-12 h-9 p-1 bg-white/5 border-white/10 cursor-pointer"
                      />
                      <Input
                        value={profile.brandColor}
                        onChange={(e) =>
                          setProfile({ brandColor: e.target.value })
                        }
                        placeholder="#10b981"
                        className="flex-1 bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Accentfärg</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={profile.accentColor}
                        onChange={(e) =>
                          setProfile({ accentColor: e.target.value })
                        }
                        className="w-12 h-9 p-1 bg-white/5 border-white/10 cursor-pointer"
                      />
                      <Input
                        value={profile.accentColor}
                        onChange={(e) =>
                          setProfile({ accentColor: e.target.value })
                        }
                        placeholder="#059669"
                        className="flex-1 bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                </div>
                {/* Färg-preview */}
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">
                    Förhandsvisning:
                  </span>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: profile.brandColor }}
                      title="Primärfärg"
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: profile.accentColor }}
                      title="Accentfärg"
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    Dessa färger används i header, rubriker och knappar
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info-sektion */}
          {activeTemplate ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <IconPalette className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-1">
                    Välj design för "{activeTemplate.name}"
                  </h3>
                  <p className="text-sm text-gray-400">
                    Klicka på "Använd" för att välja en PDF-design för denna
                    mall. Designen kombineras med din branding ovan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <IconSettings className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-1">
                    Ingen mall vald
                  </h3>
                  <p className="text-sm text-gray-400">
                    Välj en mall för att kunna ange en PDF-design.
                    Branding-inställningarna ovan gäller för alla mallar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Design-grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <IconToggleLeft className="w-5 h-5 text-emerald-400" />
              Tillgängliga designer
              {isAdmin && (
                <span className="text-sm font-normal text-gray-400">
                  (Admin kan aktivera/inaktivera)
                </span>
              )}
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {designIds.map((designId) => (
                <DesignCard
                  key={designId}
                  designId={designId}
                  onSelect={handleSelectDesign}
                  selectedDesign={activeTemplate?.designId}
                  hasActiveTemplate={!!activeTemplate}
                  isEnabled={enabledPdfDesigns.includes(designId)}
                  onToggleEnabled={handleToggleDesign}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignsManager;
