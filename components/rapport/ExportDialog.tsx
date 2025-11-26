"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFileText,
  IconLoader2,
  IconPrinter,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { rapportApi } from "@/lib/rapport/rapportApi";
import { generatePdfHtml, type PdfProfile, type PdfViewMode } from "@/lib/rapport/pdfGenerator";
import { PROFILE_OPTIONS, getProfile, getProfileForTrade, type PdfProfileKey } from "@/lib/rapport/pdfProfiles";
import type { Report, ReportTemplate, ReportSectionDefinition } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
  template?: ReportTemplate | null;
  sectionDefinitions?: ReportSectionDefinition[];
  pdfProfile?: PdfProfile;
  onExported?: () => void;
}

interface ValidationIssue {
  type: "error" | "warning";
  message: string;
  sectionId?: string;
  sectionTitle?: string;
}

// ============================================================================
// Export Profiles
// ============================================================================

const EXPORT_PROFILES = [
  {
    id: "customer",
    label: "Kundrapport",
    description: "Professionell rapport för kund, utan interna anteckningar",
    icon: IconUsers,
    viewMode: "customer" as PdfViewMode,
  },
  {
    id: "internal",
    label: "Intern rapport",
    description: "Full rapport med alla interna anteckningar",
    icon: IconFileText,
    viewMode: "internal" as PdfViewMode,
  },
] as const;

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({
  open,
  onOpenChange,
  report,
  template,
  sectionDefinitions = [],
  pdfProfile,
  onExported,
}: ExportDialogProps) {
  const router = useRouter();
  const [selectedViewMode, setSelectedViewMode] = useState<string>("customer");
  const [selectedStyleProfile, setSelectedStyleProfile] = useState<PdfProfileKey | "auto">("auto");
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Beräkna aktiv PDF-profil baserat på val
  const activePdfProfile = useMemo(() => {
    if (pdfProfile) return pdfProfile;
    if (selectedStyleProfile === "auto") {
      return getProfileForTrade(report.type);
    }
    return getProfile(selectedStyleProfile);
  }, [pdfProfile, selectedStyleProfile, report.type]);

  // Validate report
  const validation = useMemo(() => {
    const issues: ValidationIssue[] = [];

    // Check required sections
    const incompleteSections = report.sections.filter((s) => s.status !== "completed");
    if (incompleteSections.length > 0) {
      incompleteSections.forEach((section) => {
        issues.push({
          type: "warning",
          message: `Sektion "${section.title}" är inte markerad som klar`,
          sectionId: section.id,
          sectionTitle: section.title,
        });
      });
    }

    // Check required checklist items
    const incompleteRequired = report.checklist.filter((c) => c.required && !c.completed);
    if (incompleteRequired.length > 0) {
      incompleteRequired.forEach((item) => {
        issues.push({
          type: "error",
          message: `Obligatorisk checklistpunkt "${item.label}" är inte avklarad`,
        });
      });
    }

    // Check metadata
    if (!report.metadata.client?.trim()) {
      issues.push({ type: "error", message: "Kundnamn saknas" });
    }
    if (!report.metadata.location?.trim()) {
      issues.push({ type: "error", message: "Plats/adress saknas" });
    }

    // Check if report has content
    const hasContent = report.sections.some((s) => s.content?.trim());
    if (!hasContent) {
      issues.push({ type: "warning", message: "Rapporten har inget innehåll i någon sektion" });
    }

    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");

    return {
      issues,
      errors,
      warnings,
      canExport: errors.length === 0,
      isComplete: issues.length === 0,
    };
  }, [report]);

  // Calculate progress
  const progress = useMemo(() => {
    const total = report.sections.length;
    const completed = report.sections.filter((s) => s.status === "completed").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [report.sections]);

  // Handle preview - använder rapportApi.previewReport för konsekvent flöde
  const handlePreview = async () => {
    const profile = EXPORT_PROFILES.find((p) => p.id === selectedViewMode);
    if (!profile) return;

    setIsPreviewing(true);
    try {
      // Använd rapportApi.previewReport för konsekvent flöde
      await rapportApi.previewReport(report, {
        viewMode: profile.viewMode,
        pdfProfile: activePdfProfile,
      });
    } catch (error) {
      console.error("Preview failed", error);
      toast.error("Kunde inte öppna förhandsgranskning");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle download as HTML (can be printed to PDF)
  const handleDownload = async () => {
    if (!validation.canExport) {
      toast.error("Rapporten kan inte exporteras. Åtgärda felen först.");
      return;
    }

    const profile = EXPORT_PROFILES.find((p) => p.id === selectedViewMode);
    if (!profile) return;

    setIsDownloading(true);
    try {
      // Generera HTML
      const html = generatePdfHtml({
        report,
        template,
        sectionDefinitions,
        viewMode: profile.viewMode,
        pdfProfile: activePdfProfile,
      });

      // Skapa blob och ladda ner
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = report.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, "").trim();
      a.download = `${safeName}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Rapport nedladdad! Öppna filen och skriv ut som PDF.");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Kunde inte ladda ner rapporten");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle open print page
  const handleOpenPrintPage = () => {
    const profile = EXPORT_PROFILES.find((p) => p.id === selectedViewMode);
    if (!profile) return;

    // Spara rapport till localStorage för print-sidan
    if (typeof window !== "undefined") {
      localStorage.setItem(`rapport-${report.id}`, JSON.stringify(report));
    }

    // Öppna print-sidan i nytt fönster
    const printUrl = `/rapport/${report.id}/print?profile=${profile.viewMode}`;
    window.open(printUrl, "_blank");
  };

  // Handle export (archive + print)
  const handleExport = async () => {
    if (!validation.canExport) {
      toast.error("Rapporten kan inte exporteras. Åtgärda felen först.");
      return;
    }

    const profile = EXPORT_PROFILES.find((p) => p.id === selectedViewMode);
    if (!profile) return;

    setIsExporting(true);
    try {
      // Exportera och arkivera rapporten via rapportApi
      // Detta öppnar PDF i nytt fönster OCH arkiverar rapporten
      await rapportApi.exportReport(report, undefined, {
        viewMode: profile.viewMode,
        pdfProfile: activePdfProfile,
      });

      toast.success("Rapport exporterad och arkiverad!");
      onOpenChange(false);
      onExported?.();
      
      // Navigera till arkiv efter kort fördröjning
      setTimeout(() => {
        router.push("/rapport?tab=saved");
      }, 500);
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Kunde inte exportera rapporten");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportera rapport</DialogTitle>
          <DialogDescription>
            Välj exportprofil och granska rapporten innan export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Framsteg</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Separator />

          {/* Export Profile Selection */}
          <div className="space-y-3">
            <Label>Exportprofil</Label>
            <div className="grid gap-3">
              {EXPORT_PROFILES.map((profile) => {
                const Icon = profile.icon;
                const isSelected = selectedViewMode === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedViewMode(profile.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{profile.label}</p>
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                    </div>
                    {isSelected && (
                      <IconCheck className="size-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Validation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Validering</Label>
              {validation.isComplete ? (
                <Badge className="bg-emerald-500">
                  <IconCheck className="mr-1 size-3" />
                  Redo för export
                </Badge>
              ) : validation.canExport ? (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  <IconAlertCircle className="mr-1 size-3" />
                  {validation.warnings.length} varningar
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <IconX className="mr-1 size-3" />
                  {validation.errors.length} fel
                </Badge>
              )}
            </div>

            {validation.issues.length > 0 && (
              <ScrollArea className="h-[150px] rounded-lg border p-3">
                <div className="space-y-2">
                  {validation.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-2 text-sm",
                        issue.type === "error" ? "text-destructive" : "text-amber-600"
                      )}
                    >
                      {issue.type === "error" ? (
                        <IconX className="size-4 shrink-0 mt-0.5" />
                      ) : (
                        <IconAlertCircle className="size-4 shrink-0 mt-0.5" />
                      )}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={isPreviewing}>
              {isPreviewing ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconEye className="mr-2 size-4" />
              )}
              Förhandsgranska
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenPrintPage}>
              <IconExternalLink className="mr-2 size-4" />
              Öppna print-vy
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={!validation.canExport || isDownloading}
            >
              {isDownloading ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconDownload className="mr-2 size-4" />
              )}
              Ladda ner
            </Button>
            <Button
              onClick={handleExport}
              disabled={!validation.canExport || isExporting}
            >
              {isExporting ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconPrinter className="mr-2 size-4" />
              )}
              Exportera & Arkivera
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
