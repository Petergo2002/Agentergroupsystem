"use client";

import {
  IconCheck,
  IconFileText,
  IconLoader2,
} from "@tabler/icons-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rapportApi } from "@/lib/rapport/rapportApi";
import type { ReportTemplate, ReportTrade, ReportSectionInstance } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface CreateReportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ReportTemplate[];
  onCreated?: (reportId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TRADE_CONFIG: Record<ReportTrade, { label: string; color: string; icon: string }> = {
  bygg: { label: "Bygg", color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🏗️" },
  läckage: { label: "Läckage", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "💧" },
  elektriker: { label: "Elektriker", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⚡" },
};

// ============================================================================
// Component
// ============================================================================

export function CreateReportWizard({
  open,
  onOpenChange,
  templates,
  onCreated,
}: CreateReportWizardProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [reportTitle, setReportTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset state on close
  const handleClose = () => {
    if (isCreating) return;
    onOpenChange(false);
    setTimeout(() => {
      setSelectedTemplateId("");
      setReportTitle("");
    }, 200);
  };

  // Handle create report
  const handleCreate = async () => {
    if (!selectedTemplateId) return;

    try {
      setIsCreating(true);
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (!template) throw new Error("Mallen hittades inte");

      // Prepare sections - filter out basic_info since it's now in the sidebar
      const sections: ReportSectionInstance[] = template.sections
        .filter((s) => s.type !== "basic_info" && !s.title.toLowerCase().includes("grundinformation"))
        .map((s) => ({
          id: crypto.randomUUID(),
          type: s.type,
          title: s.title,
          content: s.defaultContent || "", // Use default content with variables
          internalNotes: "",
          status: "pending",
        }));

      // Default title
      const finalTitle = reportTitle.trim() || `${template.name} - ${new Date().toLocaleDateString("sv-SE")}`;

      // Create report
      const newReport = await rapportApi.createReport({
        title: finalTitle,
        templateId: template.id,
        trade: template.trade,
        metadata: {
          client: "",
          location: "",
          assignedTo: "",
          projectReference: "",
          priority: "medium",
        },
        sections: sections,
        status: "draft",
      });

      toast.success("Rapport skapad!");
      onCreated?.(newReport.id);
      
      // Navigate to editor
      router.push(`/rapport/${newReport.id}/edit`);
      
    } catch (error) {
      console.error("Failed to create report:", error);
      toast.error("Kunde inte skapa rapporten");
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden bg-card">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle>Ny Rapport</DialogTitle>
          <DialogDescription>
            Välj en mall för att börja.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Mall-val */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Välj mall</Label>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid gap-2">
                {templates.map((template) => {
                  const config = TRADE_CONFIG[template.trade] || TRADE_CONFIG.bygg;
                  const isSelected = selectedTemplateId === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full text-left rounded-lg border p-3 transition-all",
                        "hover:border-primary/50 hover:bg-accent/30",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card"
                      )}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground">{template.name}</p>
                          {isSelected && <IconCheck className="size-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {config.label} • {template.sections.length} sektioner
                        </p>
                      </div>
                    </button>
                  );
                })}

                {templates.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg opacity-50">
                    <IconFileText className="mx-auto size-8 mb-2" />
                    <p className="text-sm">Inga mallar hittades</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Rapportnamn (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="report-title">Rapportnamn (valfritt)</Label>
            <Input 
              id="report-title"
              placeholder="T.ex. Läckageutredning Storgatan 1" 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" onClick={handleClose} disabled={isCreating}>
            Avbryt
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedTemplateId || isCreating}
            className="min-w-[100px]"
          >
            {isCreating ? (
              <>
                <IconLoader2 className="size-4 animate-spin mr-2" />
                Skapar...
              </>
            ) : (
              "Skapa rapport"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
