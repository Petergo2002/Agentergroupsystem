"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconFileText,
  IconLoader2,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rapportApi } from "@/lib/rapport/rapportApi";
import { renderTemplate } from "@/lib/rapport/templateEngine";
import type { ReportTemplate, ReportTrade } from "@/lib/types/rapport";
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

interface FormData {
  templateId: string;
  title: string;
  client: string;
  location: string;
  projectReference: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  scheduledAt: string;
  dueAt: string;
  notes: string;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  {
    id: 1,
    title: "Välj mall & Grundinfo",
    description: "Välj mall och fyll i grunduppgifter",
  },
  { id: 2, title: "Bekräfta", description: "Granska och skapa rapport" },
] as const;

const TRADE_CONFIG: Record<
  ReportTrade,
  { label: string; color: string; icon: string }
> = {
  bygg: {
    label: "Bygg",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "🏗️",
  },
  läckage: {
    label: "Läckage",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "💧",
  },
  elektriker: {
    label: "Elektriker",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "⚡",
  },
};

const _PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Låg",
    description: "Ingen brådska",
    color: "text-slate-600",
  },
  {
    value: "medium",
    label: "Medel",
    description: "Normal prioritet",
    color: "text-amber-600",
  },
  {
    value: "high",
    label: "Hög",
    description: "Brådskande",
    color: "text-red-600",
  },
] as const;

const INITIAL_FORM: FormData = {
  templateId: "",
  title: "",
  client: "",
  location: "",
  projectReference: "",
  assignedTo: "",
  priority: "medium",
  scheduledAt: new Date().toISOString().slice(0, 16),
  dueAt: "",
  notes: "",
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isCreating, setIsCreating] = useState(false);

  // Get selected template
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === form.templateId),
    [templates, form.templateId],
  );

  // Group templates by trade
  const templatesByTrade = useMemo(() => {
    const grouped: Record<ReportTrade, ReportTemplate[]> = {
      bygg: [],
      läckage: [],
      elektriker: [],
    };
    templates.forEach((t) => {
      grouped[t.trade].push(t);
    });
    return grouped;
  }, [templates]);

  // Update form field
  const updateForm = useCallback((updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        // Steg 1: Mall vald + grundinfo ifylld
        return (
          !!form.templateId &&
          !!form.title.trim() &&
          !!form.client.trim() &&
          !!form.location.trim()
        );
      case 2:
        // Steg 2: Alltid kan skapa
        return true;
      default:
        return false;
    }
  }, [step, form]);

  // Handle next step
  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle create report
  const handleCreate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsCreating(true);

      const report = await rapportApi.createReport({
        title: form.title,
        templateId: form.templateId,
        trade: selectedTemplate.trade,
        metadata: {
          client: form.client,
          location: form.location,
          projectReference: form.projectReference,
          assignedTo: form.assignedTo,
          scheduledAt: form.scheduledAt,
          dueAt: form.dueAt || form.scheduledAt,
          priority: form.priority,
        },
        priority: form.priority,
        status: "draft",
        sections: selectedTemplate.sections.map((s) => {
          // Render default content with variables
          const defaultContent = s.defaultContent
            ? renderTemplate(s.defaultContent, {
                report: {
                  id: "",
                  title: form.title,
                  status: "draft",
                  type: selectedTemplate.trade,
                  templateId: selectedTemplate.id,
                  metadata: {
                    client: form.client,
                    location: form.location,
                    projectReference: form.projectReference,
                    assignedTo: form.assignedTo,
                    scheduledAt: form.scheduledAt,
                    dueAt: form.dueAt || form.scheduledAt,
                    priority: form.priority,
                  },
                  sections: [],
                  checklist: [],
                  assets: [],
                  updatedAt: new Date().toISOString(),
                },
                template: selectedTemplate,
              })
            : "";

          return {
            id: crypto.randomUUID(),
            title: s.title,
            hint: s.description,
            content: defaultContent,
            status: defaultContent ? "completed" : ("pending" as const),
            type: s.type,
          };
        }),
        checklist: selectedTemplate.checklist.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          completed: false,
        })),
      });

      toast.success("Rapport skapad!");
      onOpenChange(false);

      // Reset form
      setForm(INITIAL_FORM);
      setStep(1);

      // Navigate to editor
      if (onCreated) {
        onCreated(report.id);
      } else {
        router.push(`/rapport/${report.id}/edit`);
      }
    } catch (error) {
      console.error("Failed to create report", error);
      toast.error("Kunde inte skapa rapport");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      // Reset after animation
      setTimeout(() => {
        setForm(INITIAL_FORM);
        setStep(1);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header - Enklare design */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Ny rapport</DialogTitle>
              <DialogDescription className="text-sm">
                Steg {step} av {STEPS.length}: {STEPS[step - 1]?.title}
              </DialogDescription>
            </div>
            {/* Enkel progress */}
            <div className="flex items-center gap-1">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    step >= s.id ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {step === 1 && (
            <Step1TemplateAndBasicInfo
              templates={templates}
              templatesByTrade={templatesByTrade}
              form={form}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={(id) => {
                updateForm({ templateId: id });
                // Auto-generate title
                const template = templates.find((t) => t.id === id);
                if (template && !form.title) {
                  updateForm({
                    title: `${template.name} - ${new Date().toLocaleDateString("sv-SE")}`,
                  });
                }
              }}
              onChange={updateForm}
            />
          )}

          {step === 2 && (
            <Step2Confirm form={form} selectedTemplate={selectedTemplate} />
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={step === 1 || isCreating}
          >
            <IconArrowLeft className="mr-2 size-4" />
            Tillbaka
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Avbryt
            </Button>
            <Button onClick={handleNext} disabled={!canProceed || isCreating}>
              {isCreating ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Skapar...
                </>
              ) : step === 2 ? (
                <>
                  <IconCheck className="mr-2 size-4" />
                  Skapa rapport
                </>
              ) : (
                <>
                  Nästa
                  <IconArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Step 1: Template + Basic Info (kombinerat)
// ============================================================================

function Step1TemplateAndBasicInfo({
  templates,
  templatesByTrade,
  form,
  selectedTemplate,
  onSelectTemplate,
  onChange,
}: {
  templates: ReportTemplate[];
  templatesByTrade: Record<ReportTrade, ReportTemplate[]>;
  form: FormData;
  selectedTemplate: ReportTemplate | undefined;
  onSelectTemplate: (id: string) => void;
  onChange: (updates: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Mall-val - Kompakt design */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Välj mall</Label>
        <div className="grid gap-2">
          {templates.map((template) => {
            const config = TRADE_CONFIG[template.trade];
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className={cn(
                  "flex items-center gap-3 text-left rounded-lg border p-3 transition-all",
                  "hover:border-primary/50 hover:bg-accent/30",
                  form.templateId === template.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.label} • {template.sections.length} sektioner
                  </p>
                </div>
                {form.templateId === template.id && (
                  <IconCheck className="size-5 text-primary shrink-0" />
                )}
              </button>
            );
          })}

          {templates.length === 0 && (
            <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
              <IconFileText className="mx-auto size-8 text-muted-foreground opacity-50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Inga mallar tillgängliga
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grundinformation - visas endast om mall är vald */}
      {selectedTemplate && (
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium block">Grundinformation</Label>
          <div className="grid gap-4">
            {/* Rapporttitel */}
            <div>
              <Label htmlFor="title">Rapporttitel *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="T.ex. Läckagerapport - Storgatan 5"
                className="mt-1"
              />
            </div>

            {/* Kund & Adress på samma rad */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="client">Företag / Kund *</Label>
                <div className="relative mt-1">
                  <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="client"
                    value={form.client}
                    onChange={(e) => onChange({ client: e.target.value })}
                    placeholder="Företagsnamn"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Adress *</Label>
                <div className="relative mt-1">
                  <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => onChange({ location: e.target.value })}
                    placeholder="Gatuadress, stad"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Kontaktperson & Utredare */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="assignedTo">Kontaktperson</Label>
                <div className="relative mt-1">
                  <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="assignedTo"
                    value={form.assignedTo}
                    onChange={(e) => onChange({ assignedTo: e.target.value })}
                    placeholder="Namn på kontaktperson"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="projectReference">Projektreferens</Label>
                <Input
                  id="projectReference"
                  value={form.projectReference}
                  onChange={(e) =>
                    onChange({ projectReference: e.target.value })
                  }
                  placeholder="Jobb-ID, ordernummer..."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Datum */}
            <div>
              <Label htmlFor="scheduledAt">Datum</Label>
              <div className="relative mt-1">
                <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => onChange({ scheduledAt: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step 2: Confirm (Sammanfattning och bekräftelse)
// ============================================================================

function Step2Confirm({
  form,
  selectedTemplate,
}: {
  form: FormData;
  selectedTemplate: ReportTemplate | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Sammanfattning */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <IconCheck className="size-5 text-primary" />
            Redo att skapa rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mall */}
          {selectedTemplate && (
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <span className="text-2xl">
                {TRADE_CONFIG[selectedTemplate.trade].icon}
              </span>
              <div>
                <p className="font-medium">{selectedTemplate.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.sections.length} sektioner att fylla i
                </p>
              </div>
            </div>
          )}

          {/* Grundinfo */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Rapporttitel
              </p>
              <p className="font-medium">{form.title || "-"}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Företag / Kund
              </p>
              <p className="font-medium">{form.client || "-"}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Adress
              </p>
              <p className="font-medium">{form.location || "-"}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Kontaktperson
              </p>
              <p className="font-medium">{form.assignedTo || "-"}</p>
            </div>
            {form.projectReference && (
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Projektreferens
                </p>
                <p className="font-medium">{form.projectReference}</p>
              </div>
            )}
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Datum
              </p>
              <p className="font-medium">
                {form.scheduledAt
                  ? new Date(form.scheduledAt).toLocaleDateString("sv-SE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nästa steg info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Efter att rapporten skapats kan du:</p>
        <ul className="mt-2 space-y-1">
          <li>✏️ Fylla i alla sektioner</li>
          <li>📷 Ladda upp bilder och annoteringar</li>
          <li>👁️ Förhandsgranska rapporten</li>
          <li>📄 Ladda ner som PDF</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateReportWizard;
