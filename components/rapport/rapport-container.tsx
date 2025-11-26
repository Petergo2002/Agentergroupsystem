"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCircle,
  IconClock,
  IconDownload,
  IconEye,
  IconFileText,
  IconLoader,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  IconCalendarEvent,
  IconCircleCheck,
  IconEdit,
  IconFilter,
  IconMapPin,
  IconPhoto,
  IconUser,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createReport,
  deleteReport,
  fetchReports,
  fetchReportSections,
  fetchReportTemplates,
  updateReport,
  exportReportAsPdf,
  useReportsStore,
  useReportTemplatesStore,
} from "@/lib/store";
import type { Report, ReportSectionDefinition, ReportTemplate, ReportSectionType, AnnotationShape, ReportAsset } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import { useReportBuilderStore } from "@/stores/reportBuilderStore";
import { convertImagesToBase64 } from "@/lib/utils/imageUtils";
import { ReportPreviewDialog } from "./report-preview-dialog";
import { ImageGallerySection } from "./image-gallery-section";
import { ImageAnnotationCanvas } from "./image-annotation-canvas";
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";

const statusStyles: Record<
  Report["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Utkast",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  review: {
    label: "Granskning",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  approved: {
    label: "Klar",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

const tradeLabels: Record<Report["type"], string> = {
  bygg: "Bygg",
  läckage: "Läckage",
  elektriker: "Elektriker",
};

const priorityLabels: Record<Report["metadata"]["priority"], string> = {
  high: "Hög",
  medium: "Medel",
  low: "Låg",
};

const workflowSteps: {
  key: Report["status"];
  label: string;
  description: string;
}[] = [
  { key: "draft", label: "Utkast", description: "Fälttekniker dokumenterar" },
  {
    key: "review",
    label: "Granskning",
    description: "Projektledare verifierar",
  },
  { key: "approved", label: "Godkänd", description: "Delas med kund" },
];

const isoInputValue = (date: Date) => date.toISOString().slice(0, 16);

type CreateFormState = {
  title: string;
  templateId: string;
  client: string;
  location: string;
  projectReference: string;
  assignedTo: string;
  priority: Report["metadata"]["priority"];
  scheduledAt: string;
  dueAt: string;
};

const defaultCreateForm = (templateId = ""): CreateFormState => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    title: "",
    templateId,
    client: "",
    location: "",
    projectReference: "",
    assignedTo: "",
    priority: "medium",
    scheduledAt: isoInputValue(now),
    dueAt: isoInputValue(tomorrow),
  };
};

type RapportContainerProps = {
  mode?: "new" | "saved";
};

export function RapportContainer({ mode = "new" }: RapportContainerProps) {
  const router = useRouter();
  const {
    reports,
    loading: reportsLoading,
    initialized: reportsInitialized,
    setReports,
    setLoading: setReportsLoading,
    upsertReport,
  } = useReportsStore();
  const {
    templates,
    loading: templatesLoading,
    initialized: templatesInitialized,
    setTemplates,
    setLoading: setTemplatesLoading,
  } = useReportTemplatesStore();
  const { profile: pdfProfile } = usePdfProfileStore();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() =>
    defaultCreateForm(),
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sectionDefinitions, setSectionDefinitions] = useState<ReportSectionDefinition[]>([]);

  useEffect(() => {
    if (reportsInitialized) return;
    let active = true;

    const loadReports = async () => {
      setReportsLoading(true);
      const data = await fetchReports();
      if (active) setReports(data);
      if (active) setReportsLoading(false);
    };

    loadReports();
    return () => {
      active = false;
    };
  }, [reportsInitialized, setReports, setReportsLoading]);

  useEffect(() => {
    if (templatesInitialized) return;
    let active = true;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      const data = await fetchReportTemplates();
      if (active) setTemplates(data);
      if (active) setTemplatesLoading(false);
    };

    loadTemplates();
    return () => {
      active = false;
    };
  }, [setTemplates, setTemplatesLoading, templatesInitialized]);

  useEffect(() => {
    const loadSections = async () => {
      const defs = await fetchReportSections();
      setSectionDefinitions(defs);
    };
    loadSections();
  }, []);

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    if (!selectedReportId) {
      setSelectedReportId(reports[0]?.id ?? null);
      return;
    }

    const exists = reports.some((report) => report.id === selectedReportId);
    if (!exists) {
      setSelectedReportId(reports[0]?.id ?? null);
    }
  }, [reports, selectedReportId]);

  const handleWizardSubmit = async (
    payload: Parameters<typeof createReport>[0],
  ) => {
    try {
      const created = await createReport(payload);
      setSelectedReportId(created.id);
      toast.success("Rapport skapad");
      return created;
    } catch (error) {
      console.error("Failed to create report", error);
      toast.error("Kunde inte skapa rapport");
      throw error;
    }
  };

  useEffect(() => {
    if (!createForm.templateId && templates.length > 0 && templates[0]) {
      setCreateForm((prev) => ({ ...prev, templateId: templates[0]!.id }));
    }
  }, [createForm.templateId, templates]);

  const filteredReports = useMemo(() => {
    const filteredByMode = reports.filter((report) => {
      if (mode === "saved") return !!report.exportedAt; // Arkiv = exporterade
      if (mode === "new") return !report.exportedAt; // Utkast = inte exporterade
      return true;
    });

    if (!search.trim()) return filteredByMode;
    const needle = search.toLowerCase();
    return filteredByMode.filter((report) => {
      const { client, location, projectReference } = report.metadata;
      return [report.title, client, location, projectReference]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [reports, search, mode]);

  const selectedReport = useMemo(
    () =>
      filteredReports.find((report) => report.id === selectedReportId) ??
      filteredReports[0] ??
      null,
    [filteredReports, selectedReportId],
  );

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.id === selectedReport?.templateId,
      ) ?? null,
    [selectedReport, templates],
  );

  const createTemplate = useMemo(
    () =>
      templates.find((template) => template.id === createForm.templateId) ??
      null,
    [createForm.templateId, templates],
  );


  const isLoadingInitial = reportsLoading && reports.length === 0;
  const workflowIndex = selectedReport
    ? Math.max(
        workflowSteps.findIndex((step) => step.key === selectedReport.status),
        0,
      )
    : 0;

  const handleOpenCreate = () => {
    setCreateForm(defaultCreateForm(templates[0]?.id ?? ""));
    setIsCreateOpen(true);
  };

  const handleCreateReport = async () => {
    if (!createForm.title.trim()) {
      toast.error("Ange en titel för rapporten");
      return;
    }
    if (!createForm.client.trim() || !createForm.location.trim()) {
      toast.error("Kund och plats måste fyllas i");
      return;
    }
    const template = templates.find((tpl) => tpl.id === createForm.templateId);
    if (!template) {
      toast.error("Välj en mall");
      return;
    }

    try {
      setIsCreating(true);
      const created = await createReport({
        title: createForm.title.trim(),
        templateId: template.id,
        trade: template.trade,
        priority: createForm.priority,
        metadata: {
          client: createForm.client.trim(),
          location: createForm.location.trim(),
          projectReference: createForm.projectReference.trim(),
          assignedTo: createForm.assignedTo.trim(),
          scheduledAt: createForm.scheduledAt
            ? new Date(createForm.scheduledAt).toISOString()
            : undefined,
          dueAt: createForm.dueAt
            ? new Date(createForm.dueAt).toISOString()
            : undefined,
          priority: createForm.priority,
        },
      });
      setIsCreateOpen(false);
      setSelectedReportId(created.id);
      toast.success("Rapport skapad");
    } catch (error) {
      console.error("Failed to create report", error);
      toast.error("Kunde inte skapa rapport");
    } finally {
      setIsCreating(false);
    }
  };

  const disableCreateButton =
    !createForm.title.trim() ||
    !createForm.client.trim() ||
    !createForm.location.trim() ||
    !createForm.templateId;

  const headerTitle = mode === "new" ? "Ny rapport" : "Rapportarkiv";
  const headerDescription =
    mode === "new"
      ? "Skapa ny rapport eller fortsätt redigera ett utkast."
      : "Tillgång till signerade rapporter och exporthistorik.";

  const handleOpenPreview = () => {
    if (!selectedReport) {
      toast.error("Välj en rapport att förhandsgranska");
      return;
    }
    // Öppna PDF i nytt fönster
    window.open(`/api/reports/${selectedReport.id}/pdf`, "_blank");
  };

  const handleExportReport = async () => {
    if (!selectedReport) return;
    
    try {
      // Generera och skriv ut PDF (kundvy för export)
      const printableHtml = generatePdfHtml({
        report: selectedReport,
        template: selectedTemplate,
        sectionDefinitions,
        pdfProfile,
        viewMode: "customer"
      });
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Kunde inte öppna PDF-fönster");
        return;
      }
      win.document.write(printableHtml);
      win.document.close();
      win.focus();
      win.print();
      
      // Arkivera rapporten
      const { exportReportAsPdf } = await import("@/lib/store");
      await exportReportAsPdf(selectedReport);
      
      toast.success("Rapport exporterad och arkiverad");
      setIsPreviewOpen(false);
      router.push("/rapport?tab=saved");
    } catch (error) {
      console.error("Failed to export report", error);
      toast.error("Kunde inte exportera rapporten");
    }
  };

  if (mode === "new") {
    return (
      <section className="flex h-full flex-col gap-6 p-6">
        <NewReportWizard
          templates={templates}
          loading={templatesLoading}
          onSubmit={handleWizardSubmit}
        />
      </section>
    );
  }

  // Utkast-rapporter (inte exporterade)
  const draftReports = reports.filter(r => !r.exportedAt);

  return (
    <>
      <section className="flex h-full flex-col gap-6 p-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Rapporter
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {headerTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {headerDescription}
              </p>
            </div>
          </div>
          {mode === "saved" && (
            <div className="flex flex-wrap gap-2 text-xs">
              {["Senaste 30 dagar", "Kvartal", "År", "Alla tider"].map(
                (label, index) => (
                  <Badge
                    key={label}
                    variant={index === 0 ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {label}
                  </Badge>
                ),
              )}
            </div>
          )}
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Alla rapporter</CardTitle>
                  <CardDescription>
                    Filtrera på kund, ort eller status
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {reports.length} st
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Sök efter kund eller projekt"
                      className="pl-10"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Visa filter"
                  >
                    <IconFilter className="size-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="mt-4 h-[540px] pr-3">
                <div className="space-y-3">
                  {isLoadingInitial && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Laddar rapporter...
                    </div>
                  )}
                  {!isLoadingInitial &&
                    filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-2xl border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold leading-tight truncate">
                              {report.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {report.metadata.client}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border shrink-0",
                              statusStyles[report.status].className,
                            )}
                          >
                            {statusStyles[report.status].label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <IconMapPin className="size-3.5" />
                            {report.metadata.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IconCalendarEvent className="size-3.5" />
                            {new Date(
                              report.metadata.scheduledAt || report.updatedAt,
                            ).toLocaleDateString("sv-SE")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => setSelectedReportId(report.id)}
                        >
                          <IconEye className="size-4" />
                          Visa detaljer
                        </Button>
                      </div>
                    ))}
                  {!isLoadingInitial && filteredReports.length === 0 && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Inga rapporter matchade din sökning.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-full">
            {selectedReport ? (
              <>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedReport.title}
                      </CardTitle>
                      <CardDescription>
                        {selectedReport.metadata.client} ·{" "}
                        {tradeLabels[selectedReport.type]} ·{" "}
                        {selectedReport.metadata.projectReference}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full border",
                          statusStyles[selectedReport.status].className,
                        )}
                      >
                        {statusStyles[selectedReport.status].label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/40 text-primary"
                      >
                        Prioritet:{" "}
                        {priorityLabels[selectedReport.metadata.priority]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <IconCalendarEvent className="size-4" />
                      Planerat{" "}
                      {new Date(
                        selectedReport.metadata.scheduledAt ||
                          selectedReport.updatedAt,
                      ).toLocaleString("sv-SE")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconUser className="size-4" />{" "}
                      {selectedReport.metadata.assignedTo || "Ej tilldelad"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconMapPin className="size-4" />{" "}
                      {selectedReport.metadata.location}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/40 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Mall
                      </p>
                      <p className="text-sm font-semibold">
                        {templatesLoading && !selectedTemplate
                          ? "Laddar mall..."
                          : selectedTemplate
                            ? selectedTemplate.name
                            : "Okänd mall"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {templatesLoading && !selectedTemplate
                          ? "Hämtar mallinställningar"
                          : selectedTemplate?.description ||
                            "Ingen mallbeskrivning."}
                      </p>
                    </div>
                    {mode !== "saved" && (
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            router.push(`/rapport/${selectedReport.id}/edit`);
                          }}
                        >
                          <IconEdit className="h-4 w-4" />
                          Fortsätt redigera
                        </Button>
                      </div>
                    )}
                  </div>

                  {mode !== "saved" && (
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Workflow
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {workflowSteps.map((step, index) => (
                            <div
                              key={step.key}
                              className="flex flex-1 items-center gap-3"
                            >
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                                  index <= workflowIndex
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground",
                                )}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  {step.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {step.description}
                                </p>
                              </div>
                              {index < workflowSteps.length - 1 && (
                                <div
                                  className={cn(
                                    "h-px flex-1",
                                    index < workflowIndex
                                      ? "bg-primary"
                                      : "bg-border",
                                  )}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Översikt - Grunddata */}
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Grunddata
                          </p>
                          <Separator className="my-3" />
                          <dl className="space-y-2 text-sm">
                            <div>
                              <dt className="text-muted-foreground">Kund</dt>
                              <dd className="font-medium">
                                {selectedReport.metadata.client}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">
                                Projektreferens
                              </dt>
                              <dd className="font-medium">
                                {selectedReport.metadata.projectReference ||
                                  "Inte angivet"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">
                                Senast uppdaterad
                              </dt>
                              <dd className="font-medium">
                                {new Date(
                                  selectedReport.updatedAt,
                                ).toLocaleString("sv-SE")}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <div className="rounded-2xl border p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Status & ansvar
                          </p>
                          <Separator className="my-3" />
                          <dl className="space-y-2 text-sm">
                            <div>
                              <dt className="text-muted-foreground">
                                Ansvarig
                              </dt>
                              <dd className="font-medium">
                                {selectedReport.metadata.assignedTo ||
                                  "Ej tilldelad"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">
                                Deadline
                              </dt>
                              <dd className="font-medium">
                                {selectedReport.metadata.dueAt
                                  ? new Date(
                                      selectedReport.metadata.dueAt,
                                    ).toLocaleString("sv-SE")
                                  : "Inte angivet"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">
                                Prioritet
                              </dt>
                              <dd className="font-medium">
                                {
                                  priorityLabels[
                                    selectedReport.metadata.priority
                                  ]
                                }
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>

                    {/* Snabb översikt */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Översikt
                      </h3>
                      <div className="rounded-2xl border p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sektioner</span>
                          <span className="font-medium">{selectedReport.sections.length} st</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ifyllda sektioner</span>
                          <span className="font-medium">
                            {selectedReport.sections.filter(s => s.status === "completed").length} / {selectedReport.sections.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Checklistpunkter</span>
                          <span className="font-medium">{selectedReport.checklist.length} st</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bilagor</span>
                          <span className="font-medium">{selectedReport.assets.length} st</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          className="w-full gap-2"
                          onClick={handleOpenPreview}
                        >
                          <IconEye className="size-4" />
                          Förhandsgranska rapport
                        </Button>
                        {mode === "saved" && (
                          <Button
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={async () => {
                              if (!selectedReport) return;
                              if (
                                confirm(
                                  `Är du säker på att du vill ta bort "${selectedReport.title}"?`,
                                )
                              ) {
                                try {
                                  await deleteReport(selectedReport.id);
                                  setSelectedReportId(null);
                                  toast.success("Rapport borttagen");
                                } catch (error) {
                                  console.error("Failed to delete report", error);
                                  toast.error("Kunde inte ta bort rapport");
                                }
                              }
                            }}
                          >
                            <IconTrash className="size-4" />
                            Ta bort rapport
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <IconPhoto className="size-12 text-muted-foreground" />
                <div>
                  <p className="text-xl font-semibold">Inga rapporter valda</p>
                  <p className="text-sm text-muted-foreground">
                    {isLoadingInitial
                      ? "Laddar rapportdata, ett ögonblick..."
                      : mode === "saved"
                        ? "Arkivet är tomt. Exportera en rapport för att se den här."
                        : "Välj en rapport i listan till vänster eller skapa en ny för att komma igång."}
                  </p>
                </div>
                <Button className="gap-2" onClick={handleOpenCreate}>
                  <IconPlus className="size-4" /> Ny rapport
                </Button>
              </div>
            )}
          </Card>
        </div>
      </section>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Skapa ny rapport</DialogTitle>
            <DialogDescription>
              Välj mall och fyll i grunddata - resten kan du fylla i senare.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Mall - mest viktigt */}
            <div className="grid gap-2">
              <Label>Mall *</Label>
              <Select
                value={createForm.templateId}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, templateId: value }))
                }
                disabled={templates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj mall" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({tradeLabels[template.trade]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createTemplate?.description && (
                <p className="text-xs text-muted-foreground">
                  {createTemplate.description}
                </p>
              )}
            </div>

            {/* Grunddata - obligatoriskt */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="report-client">Kund *</Label>
                <Input
                  id="report-client"
                  placeholder="Kund eller organisation"
                  value={createForm.client}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      client: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-location">Plats *</Label>
                <Input
                  id="report-location"
                  placeholder="Adress eller område"
                  value={createForm.location}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Titel - valfritt men rekommenderat */}
            <div className="grid gap-2">
              <Label htmlFor="report-title">Titel (valfritt)</Label>
              <Input
                id="report-title"
                placeholder="Lämna tom för automatisk titel"
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Om du lämnar tom genereras titel automatiskt från mall + kund
              </p>
            </div>

            <Separator />

            {/* Avancerade inställningar - collapse */}
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                <span>Avancerade inställningar (valfritt)</span>
                <span className="text-xs text-muted-foreground group-open:hidden">
                  Klicka för att visa
                </span>
              </summary>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="report-reference">Projektreferens</Label>
                    <Input
                      id="report-reference"
                      placeholder="Jobb-ID, order eller liknande"
                      value={createForm.projectReference}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          projectReference: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="report-assigned">Ansvarig</Label>
                    <Input
                      id="report-assigned"
                      placeholder="Tilldela tekniker"
                      value={createForm.assignedTo}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          assignedTo: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Prioritet</Label>
                    <Select
                      value={createForm.priority}
                      onValueChange={(value) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          priority: value as Report["metadata"]["priority"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Hög</SelectItem>
                        <SelectItem value="medium">Medel</SelectItem>
                        <SelectItem value="low">Låg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="report-start">Start</Label>
                    <Input
                      id="report-start"
                      type="datetime-local"
                      value={createForm.scheduledAt}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          scheduledAt: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="report-due">Deadline</Label>
                    <Input
                      id="report-due"
                      type="datetime-local"
                      value={createForm.dueAt}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          dueAt: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateReport}
              disabled={disableCreateButton || isCreating}
            >
              {isCreating ? "Skapar..." : "Skapa rapport"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

type WizardStepKey = "template" | "details" | "sections" | "final";

type WizardSection = {
  id: string;
  title: string;
  description?: string;
  content: string;
  type?: ReportSectionType;
  imageUrl?: string;
  assetIds?: string[];
  assetId?: string;
  annotatedImageUrl?: string;
  annotationData?: AnnotationShape[];
  // För annoteringssektion - flera bilder med annotationer
  annotatedImages?: Array<{
    id: string;
    url: string;
    annotationData?: AnnotationShape[];
  }>;
};

const wizardSteps: {
  key: WizardStepKey;
  title: string;
  description: string;
}[] = [
  {
    key: "template",
    title: "Välj mall",
    description: "Välj en mall som passar ditt projekt",
  },
  {
    key: "details",
    title: "Grunddata",
    description: "Fyll i grundläggande information",
  },
  {
    key: "sections",
    title: "Sektioner",
    description: "Fyll i rapportens innehåll",
  },
  {
    key: "final",
    title: "Granska & Ladda ner",
    description: "Granska PDF och ladda ner",
  },
];

function NewReportWizard({
  templates,
  loading,
  onSubmit,
}: {
  templates: ReportTemplate[];
  loading: boolean;
  onSubmit: (payload: Parameters<typeof createReport>[0]) => Promise<Report>;
}) {
  const router = useRouter();
  const { reports } = useReportsStore();
  const draftReports = reports.filter(r => !r.exportedAt);
  
  // Använd reportBuilderStore
  const {
    formData,
    currentStep: storeStep,
    updateFormData,
    applyTemplate: applyTemplateFromStore,
    saveReport,
    canProceed: canProceedFromStore,
  } = useReportBuilderStore();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    formData.templateId || null
  );
  const [form, setForm] = useState<CreateFormState>(() => defaultCreateForm());
  const [sections, setSections] = useState<WizardSection[]>([]);
  const [checklist, setChecklist] = useState<Report["checklist"]>([]);
  const [assets, setAssets] = useState<ReportAsset[]>([]);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sectionDefinitions, setSectionDefinitions] = useState<ReportSectionDefinition[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const currentStep = wizardSteps[stepIndex] ?? wizardSteps[0]!;
  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setSections([]);
      setChecklist([]);
      return;
    }

    setForm((prev) => ({
      ...prev,
      templateId: selectedTemplate.id,
      title: prev.title || `${selectedTemplate.name} rapport`,
    }));

    setSections(
      selectedTemplate.sections.map((section) => {
        // Hitta sektionsdefinition för att få imageUrl
        const definition = sectionDefinitions.find(d => d.id === section.id);
        return {
          id: section.id,
          title: section.title,
          description: section.description,
          content: section.description ?? "",
          type: section.type ?? "text",
          imageUrl: definition?.imageUrl,
          assetIds: [],
          assetId: undefined,
          annotationData: [],
        };
      }),
    );

    setChecklist(
      (selectedTemplate.checklist ?? []).map((item) => ({
        ...item,
        completed: false,
      })),
    );
  }, [selectedTemplate, sectionDefinitions]);

  useEffect(() => {
    const loadSections = async () => {
      const defs = await fetchReportSections();
      setSectionDefinitions(defs);
    };
    loadSections();
  }, []);

  const buildPreviewReport = (): Report => {
    return {
      id: "preview",
      title: form.title.trim() || `${selectedTemplate?.name || "Ny"} rapport`,
      status: "draft",
      type: selectedTemplate?.trade || "bygg",
      templateId: selectedTemplate?.id || "",
      metadata: {
        client: form.client.trim(),
        location: form.location.trim(),
        projectReference: form.projectReference.trim(),
        assignedTo: form.assignedTo.trim(),
        scheduledAt: form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : "",
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : "",
        priority: form.priority,
      },
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        hint: section.description,
        content: section.content,
        status: section.content.trim() ? "completed" : "pending",
        type: section.type,
        assetIds: section.assetIds,
        assetId: section.assetId,
        annotationData: section.annotationData,
      })),
      checklist,
      assets,
      updatedAt: new Date().toISOString(),
    };
  };

  const sectionsValid = selectedTemplate
    ? sections.length === selectedTemplate.sections.length
    : true;

  const canProceed = (() => {
    switch (currentStep.key) {
      case "template":
        return Boolean(selectedTemplateId);
      case "details":
        return Boolean(form.client.trim()) && Boolean(form.location.trim());
      case "sections":
        return sectionsValid;
      case "final":
        return Boolean(createdReport);
      default:
        return true;
    }
  })();

  const handleNext = () => {
    if (!canProceed) return;
    if (stepIndex < wizardSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  const handleSectionContentChange = (sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content,
            }
          : section,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || !canProceed) return;

    const sectionsPayload: Report["sections"] = sections.map((section) => ({
      id: section.id,
      title: section.title,
      hint: section.description,
      content: section.content,
      status: section.content.trim() ? "completed" : "pending",
      type: section.type,
      assetIds: section.assetIds,
      assetId: section.assetId,
      annotationData: section.annotationData,
    }));

    const scheduledAtIso = new Date(form.scheduledAt).toISOString();
    const dueAtIso = form.dueAt
      ? new Date(form.dueAt).toISOString()
      : scheduledAtIso;

    const metadata = {
      client: form.client.trim(),
      location: form.location.trim(),
      projectReference: form.projectReference.trim(),
      assignedTo: form.assignedTo.trim(),
      scheduledAt: scheduledAtIso,
      dueAt: dueAtIso,
      priority: form.priority,
    };

    try {
      setIsSubmitting(true);
      
      // Om vi redan har en rapport (fortsätter redigera), uppdatera den
      if (createdReport) {
        const updated = await updateReport(createdReport.id, {
          title: form.title.trim() || createdReport.title,
          metadata,
          sections: sectionsPayload,
          checklist,
          assets,
        });
        setCreatedReport(updated);
        toast.success("Rapport uppdaterad!");
      } else {
        // Annars skapa ny
        const payload: Parameters<typeof createReport>[0] = {
          title: form.title.trim() || `${selectedTemplate.name} rapport`,
          templateId: selectedTemplate.id,
          trade: selectedTemplate.trade,
          metadata,
          priority: form.priority,
          sections: sectionsPayload,
          checklist,
          assets,
          status: "draft",
        };
        const created = await onSubmit(payload);
        setCreatedReport(created);
        toast.success("Rapport skapad!");
      }
      
      // Förhandsgranska PDF via preview-API
      try {
        // Samla alla bilder från sektioner
        const allImages: string[] = [];
        let gannTableImage: string | undefined;
        
        sections.forEach((section) => {
          const isGannSection = section.title?.toLowerCase().includes("gann");
          
          // Bildgalleri-sektioner
          if (section.type === "image_gallery" && section.assetIds) {
            section.assetIds.forEach(assetId => {
              const asset = assets.find(a => a.id === assetId);
              if (asset?.url) {
                // Om det är GANN-sektion, ta första bilden som GANN-tabell
                if (isGannSection && !gannTableImage) {
                  gannTableImage = asset.url;
                } else {
                  allImages.push(asset.url);
                }
              }
            });
          }
          // Annoterade bilder (nya multi-image)
          if (section.type === "image_annotated" && section.annotatedImages) {
            section.annotatedImages.forEach(img => {
              // Om det är GANN-tabell, lägg i gannTableImage
              if (isGannSection) {
                if (!gannTableImage) gannTableImage = img.url;
              } else {
                allImages.push(img.url);
              }
            });
          }
          // Fallback för gamla annoterade bilder (single image)
          if (section.type === "image_annotated" && section.assetId && !section.annotatedImages) {
            if (isGannSection) {
              gannTableImage = section.annotatedImageUrl || section.assetId;
            } else {
              allImages.push(section.annotatedImageUrl || section.assetId);
            }
          }
          // Statiska bilder från sektionsdefinitioner
          if (section.type === "image" && section.imageUrl) {
            if (isGannSection) {
              if (!gannTableImage) gannTableImage = section.imageUrl;
            } else {
              allImages.push(section.imageUrl);
            }
          }
        });
        
        // Konvertera alla blob URLs till base64 (blob URLs fungerar inte i PDF-renderer)
        const convertedImages = await convertImagesToBase64(allImages);
        const convertedGannTable = gannTableImage ? (await convertImagesToBase64([gannTableImage]))[0] : undefined;
        
        // Bygg sektioner för PDF - skicka alla sektioner med titel och innehåll
        const pdfSections = sections
          .filter(s => (s.type === "text" || !s.type) && s.content?.trim())
          .map(s => ({
            id: s.id,
            title: s.title,
            content: s.content,
            type: s.type || "text",
          }));
        
        const previewBody = {
          // Grunddata
          mottagare: form.client.trim(),
          foretag: form.client.trim(),
          adress: form.location.trim(),
          utredare: form.assignedTo.trim() || form.client.trim() || "Utredare",
          datum: form.scheduledAt
            ? new Date(form.scheduledAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          // Skicka alla sektioner som anpassade sektioner
          sections: pdfSections,
          // Lämna de gamla fälten tomma - vi använder sections istället
          bakgrund: "",
          matmetoder: "",
          slutsats: "",
          // Bilder (konverterade till base64)
          images: convertedImages,
          gannTableImage: convertedGannTable,
        };

        // Kräv minst grunddata för att generera PDF
        if (previewBody.mottagare && previewBody.foretag && (pdfSections.length > 0 || convertedImages.length > 0 || convertedGannTable)) {
          const response = await fetch("/api/reports/preview/pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(previewBody),
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
          } else {
            console.error("Preview PDF error", await response.json().catch(() => null));
            toast.error("Kunde inte generera PDF, men rapporten sparades.");
            setPdfUrl(null);
          }
        } else {
          // Saknar nödvändig data för PDF
          setPdfUrl(null);
        }
      } catch (error) {
        console.error("Preview PDF fetch error", error);
        toast.error("Kunde inte generera PDF, men rapporten sparades.");
        setPdfUrl(null);
      }

      // Gå till steg 4 (final) för att granska PDF
      setStepIndex(3); // Index 3 = steg 4 (final)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCreatedReport = async () => {
    if (!createdReport) return;
    
    try {
      const template =
        templates.find((template) => template.id === createdReport.templateId) ??
        selectedTemplate ??
        null;
      
      // Generera och skriv ut PDF
      const printableHtml = generatePdfHtml({
        report: createdReport,
        template,
        sectionDefinitions,
        viewMode: "customer"
      });
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Kunde inte öppna PDF-fönster");
        return;
      }
      win.document.write(printableHtml);
      win.document.close();
      win.focus();
      win.print();
      
      // Arkivera rapporten
      const { exportReportAsPdf } = await import("@/lib/store");
      await exportReportAsPdf(createdReport);
      
      toast.success("Rapport exporterad och arkiverad!");
      setIsPreviewOpen(false);
      
      // Återställ wizard och navigera
      resetWizard();
    } catch (error) {
      console.error("Failed to export created report", error);
      toast.error("Kunde inte exportera rapporten");
    }
  };

  const resetWizard = () => {
    setStepIndex(0);
    setSelectedTemplateId(null);
    setForm(defaultCreateForm());
    setSections([]);
    setChecklist([]);
    setCreatedReport(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Skapa rapport
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Guidat arbetsflöde
          </h1>
          <p className="text-sm text-muted-foreground">
            Välj mall, skriv sektionerna och exportera rapporten steg för steg.
          </p>
        </div>
        <div className="grid gap-3 rounded-2xl border bg-muted/40 p-4 md:grid-cols-2 lg:grid-cols-5">
          {wizardSteps.map((step, index) => {
            const status =
              index < stepIndex
                ? "completed"
                : index === stepIndex
                  ? "current"
                  : "upcoming";
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                    status === "completed" &&
                      "bg-primary text-primary-foreground",
                    status === "current" &&
                      "border-2 border-primary text-primary",
                    status === "upcoming" &&
                      "border border-dashed text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6">
        {currentStep.key === "template" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading && !templates.length && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Laddar mallar...
              </div>
            )}
            {templates.map((template) => {
              const isSelected = template.id === selectedTemplateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setCreatedReport(null);
                  }}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold">{template.name}</p>
                    <Badge variant="outline">
                      {tradeLabels[template.trade]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {template.description || "Ingen beskrivning"}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{template.sections.length} sektioner</span>
                    <span>{template.checklist.length} checklistpunkter</span>
                  </div>
                </button>
              );
            })}
            {!loading && templates.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Inga mallar ännu. Skapa en i inställningsfliken.
              </div>
            )}
          </div>
        )}

        {currentStep.key === "template" && draftReports.length > 0 && (
          <div className="mt-8">
            <Separator className="mb-6" />
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Fortsätt redigera</h3>
              <p className="text-sm text-muted-foreground">
                Utkast som inte är klara än
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {draftReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate">{report.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.metadata.client}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", statusStyles[report.status].className)}>
                      {statusStyles[report.status].label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <IconMapPin className="size-3.5" />
                    {report.metadata.location}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        // Ladda rapporten i wizard och gå till steg 3
                        setCreatedReport(report);
                        setSelectedTemplateId(report.templateId);
                        setForm({
                          title: report.title,
                          client: report.metadata.client,
                          location: report.metadata.location,
                          projectReference: report.metadata.projectReference || "",
                          assignedTo: report.metadata.assignedTo || "",
                          priority: report.metadata.priority,
                          scheduledAt: report.metadata.scheduledAt || "",
                          dueAt: report.metadata.dueAt || "",
                          templateId: report.templateId,
                        });
                        setSections(report.sections.map(s => ({
                          id: s.id,
                          title: s.title,
                          description: s.hint,
                          content: s.content,
                          type: s.type,
                          assetIds: s.assetIds,
                          assetId: s.assetId,
                          annotationData: s.annotationData,
                        })));
                        setChecklist(report.checklist);
                        setAssets(report.assets);
                        setStepIndex(2); // Gå till steg 3 (sections)
                      }}
                    >
                      <IconEdit className="size-4" />
                      Fortsätt
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Är du säker på att du vill ta bort "${report.title}"?`)) {
                          try {
                            await deleteReport(report.id);
                            toast.success("Rapport borttagen");
                          } catch (error) {
                            console.error("Failed to delete report", error);
                            toast.error("Kunde inte ta bort rapport");
                          }
                        }
                      }}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep.key === "details" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Grundinformation</CardTitle>
                <CardDescription>
                  Vem gäller rapporten och vad heter den?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="wizard-title">Titel</Label>
                  <Input
                    id="wizard-title"
                    placeholder="Ex. Läcka Brf Talltitan"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wizard-client">Kund</Label>
                  <Input
                    id="wizard-client"
                    placeholder="Kund eller organisation"
                    value={form.client}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        client: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wizard-location">Plats</Label>
                  <Input
                    id="wizard-location"
                    placeholder="Adress eller objekt"
                    value={form.location}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tider & ansvar</CardTitle>
                <CardDescription>
                  Planera vem som ansvarar och när.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="wizard-assigned">Ansvarig</Label>
                  <Input
                    id="wizard-assigned"
                    placeholder="Tilldela tekniker"
                    value={form.assignedTo}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        assignedTo: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Prioritet</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: value as Report["metadata"]["priority"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Hög</SelectItem>
                      <SelectItem value="medium">Medel</SelectItem>
                      <SelectItem value="low">Låg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        scheduledAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dueAt: event.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep.key === "sections" && (
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription>
                    {section.description ||
                      "Använd den här sektionen för att skriva en tydlig rapporttext."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {section.type === "image" && section.imageUrl ? (
                    // Statisk bildsektion (t.ex. Ganttabell)
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-muted/10 p-4">
                        <img
                          src={section.imageUrl}
                          alt={section.title}
                          className="w-full rounded-md"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Detta är en fördefinierad mall-bild. Ingen input krävs.
                      </p>
                    </div>
                  ) : section.type === "image_gallery" ? (
                    // Bildgalleri-sektion
                    <ImageGallerySection
                      assets={assets.filter(a => section.assetIds?.includes(a.id))}
                      onAssetsChange={(newAssets: ReportAsset[]) => {
                        // Ta bort gamla assets för denna sektion
                        const otherAssets = assets.filter(a => !section.assetIds?.includes(a.id));
                        // Lägg till nya assets
                        setAssets([...otherAssets, ...newAssets]);
                        // Uppdatera sektion med nya asset IDs
                        setSections(prev => prev.map(s =>
                          s.id === section.id
                            ? { ...s, assetIds: newAssets.map((a: ReportAsset) => a.id) }
                            : s
                        ));
                      }}
                    />
                  ) : section.type === "image_annotated" ? (
                    // Annoterad bild-sektion - stöd för flera bilder
                    <div className="space-y-4">
                      {section.annotatedImages && section.annotatedImages.length > 0 ? (
                        section.annotatedImages.map((img, idx) => (
                          <div key={img.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Bild {idx + 1}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSections(prev => prev.map(s =>
                                    s.id === section.id
                                      ? { ...s, annotatedImages: s.annotatedImages?.filter(i => i.id !== img.id) }
                                      : s
                                  ));
                                }}
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </div>
                            <ImageAnnotationCanvas
                              imageUrl={img.url}
                              shapes={img.annotationData || []}
                              onChange={(shapes: AnnotationShape[]) => {
                                setSections(prev => prev.map(s =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        annotatedImages: s.annotatedImages?.map(i =>
                                          i.id === img.id ? { ...i, annotationData: shapes } : i
                                        )
                                      }
                                    : s
                                ));
                              }}
                            />
                          </div>
                        ))
                      ) : null}
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <IconPhoto className="mx-auto size-12 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                          {section.annotatedImages && section.annotatedImages.length > 0
                            ? "Lägg till fler bilder"
                            : "Ladda upp bild för att annotera"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Du kan ladda upp flera bilder och annotera var och en
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.multiple = true;
                            input.onchange = (e) => {
                              const files = Array.from((e.target as HTMLInputElement).files || []);
                              const newImages = files.map(file => ({
                                id: crypto.randomUUID(),
                                url: URL.createObjectURL(file),
                                annotationData: [],
                              }));
                              setSections(prev => prev.map(s =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      annotatedImages: [...(s.annotatedImages || []), ...newImages]
                                    }
                                  : s
                              ));
                              toast.success(`${files.length} bild(er) uppladdade`);
                            };
                            input.click();
                          }}
                        >
                          <IconPhoto className="mr-2 size-4" />
                          Ladda upp bild(er)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Text-sektion (standard)
                    <Textarea
                      rows={6}
                      placeholder="Skriv ditt utkast här..."
                      value={section.content}
                      onChange={(event) =>
                        handleSectionContentChange(section.id, event.target.value)
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {!sections.length && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Välj en mall i steg 1 för att se dess sektioner.
              </div>
            )}
          </div>
        )}

        {currentStep.key === "final" && createdReport && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Granska rapport</CardTitle>
                <CardDescription>
                  Din rapport är skapad. Granska innehållet nedan och ladda ner när du är klar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Titel</span>
                    <span className="font-medium">{createdReport.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kund</span>
                    <span className="font-medium">{createdReport.metadata.client}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plats</span>
                    <span className="font-medium">{createdReport.metadata.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sektioner</span>
                    <span className="font-medium">{createdReport.sections.length} st</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs rounded-lg border bg-emerald-50 border-emerald-200 p-3">
                  <IconCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-800">Rapporten är sparad som utkast. Du kan fortsätta redigera den senare.</span>
                </div>
              </CardContent>
            </Card>

            {/* PDF Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Förhandsgranskning</CardTitle>
                <CardDescription>
                  Se hur rapporten ser ut som PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white overflow-hidden">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-[700px] border-0"
                      title="Rapport förhandsgranskning"
                    />
                  ) : (
                    <iframe
                      src={`/api/reports/${createdReport.id}/pdf`}
                      className="w-full h-[700px] border-0"
                      title="Rapport förhandsgranskning"
                      onError={() => {
                        toast.error("Kunde inte ladda PDF-förhandsgranskning");
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
          Tillbaka
        </Button>
        <div className="flex flex-wrap gap-2">
          {currentStep.key === "final" && createdReport ? (
            <>
              <Button variant="outline" onClick={resetWizard}>
                Skapa ny rapport
              </Button>
              <Button
                onClick={() => {
                  if (pdfUrl) {
                    window.open(pdfUrl, "_blank");
                  } else {
                    window.open(`/api/reports/${createdReport.id}/pdf`, "_blank");
                  }
                }}
                className="gap-2"
              >
                <IconDownload className="h-4 w-4" />
                Ladda ner PDF
              </Button>
              <Button
                onClick={async () => {
                  await exportReportAsPdf(createdReport);
                  router.push("/rapport?tab=saved");
                }}
                className="gap-2"
              >
                <IconCheck className="h-4 w-4" />
                Klar - Till arkiv
              </Button>
            </>
          ) : (
            <Button
              onClick={currentStep.key === "sections" ? handleSubmit : handleNext}
              disabled={
                !canProceed || (currentStep.key === "sections" && isSubmitting)
              }
            >
              {currentStep.key === "sections"
                ? isSubmitting
                  ? "Skapar..."
                  : "Skapa rapport"
                : "Fortsätt"}
            </Button>
          )}
        </div>
      </div>


    </div>
  );
}

/**
 * Renderar en rapport till en iframe med given konfiguration
 * @deprecated Använd generatePdfHtml från @/lib/rapport/pdfGenerator istället
 */
export function renderReportToIframe(
  iframe: HTMLIFrameElement,
  report: Report,
  template: ReportTemplate | null,
  sectionDefinitions: ReportSectionDefinition[],
  pdfProfile?: {
    brandColor?: string;
    accentColor?: string;
    fontFamily?: string;
    displayLogo?: boolean;
    logoUrl?: string;
    footerText?: string;
    headerText?: string;
    displayInternalNotes?: boolean;
  },
  viewMode: "internal" | "customer" = "customer"
) {
  const html = generatePdfHtml({
    report,
    template,
    sectionDefinitions,
    pdfProfile,
    viewMode
  });
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }
}

/**
 * Legacy PDF HTML generator
 * @deprecated Använd generatePdfHtml från @/lib/rapport/pdfGenerator istället
 * Behålls för bakåtkompatibilitet med äldre kod
 */
export function buildPrintableHtml(
  report: Report, 
  template?: ReportTemplate | null,
  sectionDefinitions?: ReportSectionDefinition[],
  pdfProfile?: {
    brandColor?: string;
    accentColor?: string;
    fontFamily?: string;
    displayLogo?: boolean;
    logoUrl?: string;
    footerText?: string;
    headerText?: string;
    displayInternalNotes?: boolean;
  },
  viewMode: "internal" | "customer" = "customer"
) {
  const profile = {
    brandColor: pdfProfile?.brandColor || "#0f172a",
    accentColor: pdfProfile?.accentColor || "#22c55e",
    fontFamily: pdfProfile?.fontFamily || "Inter",
    displayLogo: pdfProfile?.displayLogo ?? false,
    logoUrl: pdfProfile?.logoUrl || "",
    footerText: pdfProfile?.footerText || "",
    headerText: pdfProfile?.headerText || "",
    displayInternalNotes: pdfProfile?.displayInternalNotes ?? false,
  };
  
  // I kundvy, visa bara det som är relevant för kund
  const showInternalInfo = viewMode === "internal" || profile.displayInternalNotes;
  // Skapa en map för snabb lookup av sektionsdefinitioner
  const defMap = new Map(
    (sectionDefinitions || []).map(def => [def.id, def])
  );

  const sectionHtml = report.sections
    .map((section) => {
      const definition = defMap.get(section.id);
      
      // Bildgalleri-sektion
      if (section.type === "image_gallery" && section.assetIds && section.assetIds.length > 0) {
        const galleryAssets = section.assetIds
          .map(id => report.assets.find(a => a.id === id))
          .filter(Boolean);
        
        const imagesHtml = galleryAssets
          .map(asset => `
            <div style="margin-bottom:16px;">
              <img 
                src="${asset!.url}" 
                alt="${asset!.label}"
                style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;"
              />
              ${asset!.label ? `<p style="margin-top:4px;font-size:12px;color:#64748b;">${asset!.label}</p>` : ""}
              ${asset!.tags.length > 0 ? `<p style="margin-top:2px;font-size:11px;color:#94a3b8;">Taggar: ${asset!.tags.join(", ")}</p>` : ""}
            </div>
          `)
          .join("");
        
        return `
      <section style="margin-bottom:24px;">
        <h2 style="margin-bottom:8px;font-size:18px;color:#0f172a;">${section.title}</h2>
        ${section.hint ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">${section.hint}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin:12px 0;">
          ${imagesHtml}
        </div>
      </section>
        `;
      }
      
      // Annoterad bild-sektion
      if (section.type === "image_annotated" && section.assetId) {
        const asset = report.assets.find(a => a.id === section.assetId);
        const imageUrl = section.annotatedImageUrl || asset?.url || section.assetId;
        
        return `
      <section style="margin-bottom:24px;">
        <h2 style="margin-bottom:8px;font-size:18px;color:#0f172a;">${section.title}</h2>
        ${section.hint ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">${section.hint}</p>` : ""}
        <div style="margin:12px 0;">
          <img 
            src="${imageUrl}" 
            alt="${section.title}"
            style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;"
          />
          ${section.annotationData && section.annotationData.length > 0 ? `<p style="margin-top:8px;font-size:12px;color:#64748b;font-style:italic;">${section.annotationData.length} annoteringar</p>` : ""}
        </div>
      </section>
        `;
      }
      
      // Statisk bildsektion (från mall)
      if (section.type === "image" && definition?.imageUrl) {
        return `
      <section style="margin-bottom:24px;">
        <h2 style="margin-bottom:8px;font-size:18px;color:#0f172a;">${section.title}</h2>
        ${section.hint ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">${section.hint}</p>` : ""}
        <div style="margin:12px 0;">
          <img 
            src="${definition.imageUrl}" 
            alt="${definition.imageAltText || section.title}"
            style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;"
          />
          ${definition.imageAltText ? `<p style="margin-top:8px;font-size:12px;color:#64748b;font-style:italic;">${definition.imageAltText}</p>` : ""}
        </div>
      </section>
        `;
      }
      
      // Vanlig textsektion
      return `
      <section style="margin-bottom:24px;">
        <h2 style="margin-bottom:8px;font-size:18px;color:#0f172a;">${section.title}</h2>
        ${section.hint ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">${section.hint}</p>` : ""}
        <p style="white-space:pre-wrap;margin:4px 0;font-size:13px;color:#1f2937;">
          ${section.content || "Ej ifyllt"}
        </p>
      </section>
      `;
    })
    .join("");

  const checklistHtml = report.checklist
    .map(
      (item) => `
        <li>${item.label} ${item.required ? "(obligatorisk)" : ""}</li>
      `,
    )
    .join("");

  return `
    <html>
      <head>
        <title>${report.title}</title>
        <meta charset="UTF-8">
        <style>
          @page { margin: 2cm; }
          body { 
            font-family: ${profile.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            padding: 0; 
            margin: 0;
            color: ${profile.brandColor}; 
          }
          .page-header {
            border-bottom: 3px solid ${profile.accentColor};
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo { max-width: 180px; max-height: 60px; margin-bottom: 12px; }
          h1 { font-size: 26px; margin: 8px 0 4px 0; color: ${profile.brandColor}; }
          h2 { font-size: 18px; color: ${profile.brandColor}; margin-top: 24px; }
          .meta { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 12px; 
            margin: 16px 0; 
          }
          .meta div { 
            background: #f8fafc; 
            padding: 8px 12px; 
            border-radius: 8px; 
            border-left: 3px solid ${profile.accentColor};
          }
          ul { padding-left: 20px; }
          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
            font-size: 11px;
            color: #64748b;
            text-align: center;
          }
          section { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="page-header">
          ${profile.displayLogo && profile.logoUrl ? `<img src="${profile.logoUrl}" alt="Logo" class="logo" />` : ""}
          ${profile.headerText ? `<p style="font-size:13px;color:#64748b;margin:0 0 8px 0;">${profile.headerText}</p>` : ""}
          <h1>${report.title}</h1>
          <p style="color:#64748b;margin:4px 0;">${report.metadata.client} · ${report.metadata.location}</p>
          ${template ? `<p style="color:#94a3b8;font-size:13px;margin:4px 0;">Mall: ${template.name}</p>` : ""}
        </div>
        
        <div class="meta">
          <div><strong>Kund:</strong> ${report.metadata.client}</div>
          <div><strong>Plats:</strong> ${report.metadata.location}</div>
          <div><strong>Projektreferens:</strong> ${report.metadata.projectReference || "-"}</div>
          <div><strong>Ansvarig:</strong> ${report.metadata.assignedTo || "Ej tilldelad"}</div>
          <div><strong>Prioritet:</strong> ${priorityLabels[report.metadata.priority]}</div>
          <div><strong>Datum:</strong> ${new Date(report.updatedAt).toLocaleDateString("sv-SE")}</div>
        </div>
        
        ${sectionHtml}
        
        ${report.checklist.length ? `<h2>Checklistor</h2><ul>${checklistHtml}</ul>` : ""}
        
        ${profile.footerText ? `<div class="footer">${profile.footerText}</div>` : ""}
      </body>
    </html>
  `;
}
