"use client";

import { IconLayout2 } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import {
  createReportSectionRecord,
  createReportTemplateRecord,
  deleteReportSectionRecord,
  fetchReportSections,
  fetchReportTemplates,
  updateReportSectionRecord,
  updateReportTemplateRecord,
  useReportSectionsStore,
  useReportTemplatesStore,
} from "@/lib/store";
import type {
  ReportSectionDefinition,
  ReportTemplate,
} from "@/lib/types/rapport";
import DocumentDesigner from "./pdf/designer/DocumentDesigner";

const _fonts = ["Inter", "Space Grotesk", "Roboto", "Source Sans", "Times"];
export function RapportSettings() {
  const {
    templates,
    setTemplates,
    loading,
    setLoading,
    initialized: templatesInitialized,
    upsertTemplate,
  } = useReportTemplatesStore();
  const {
    sections: sectionLibrary,
    initialized: sectionsInitialized,
    setSections,
    setLoading: setSectionsLoading,
    updateSection,
  } = useReportSectionsStore();
  const { profile: pdfProfile, setProfile: setPdfProfile } =
    usePdfProfileStore();
  const [activeTab, setActiveTab] = useState("designer");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [_isAttachDialogOpen, _setIsAttachDialogOpen] = useState(false);
  const [_isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    type: "text" as
      | "text"
      | "image"
      | "chart"
      | "image_gallery"
      | "image_annotated",
    imageUrl: "",
    imageAltText: "",
    isDefaultSection: false,
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    trade: "bygg",
    description: "",
  });

  useEffect(() => {
    if (templatesInitialized) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchReportTemplates();
      if (active) setTemplates(data);
      if (active) setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [setLoading, setTemplates, templatesInitialized]);

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0 && templates[0]) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (sectionsInitialized) return;
    let active = true;
    const loadSections = async () => {
      setSectionsLoading(true);
      const data = await fetchReportSections();
      if (active) setSections(data);
      if (active) setSectionsLoading(false);
    };
    loadSections();
    return () => {
      active = false;
    };
  }, [sectionsInitialized, setSections, setSectionsLoading]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );
  const templateSections = selectedTemplate?.sections ?? [];

  const _handleToggleSectionForTemplate = async (
    definition: ReportSectionDefinition,
  ) => {
    if (!selectedTemplate) return;
    const exists = templateSections.some(
      (section) => section.id === definition.id,
    );
    const nextSections = exists
      ? templateSections.filter((section) => section.id !== definition.id)
      : [
          ...templateSections,
          {
            id: definition.id,
            title: definition.title,
            description: definition.description,
            type: definition.type,
          },
        ];
    await updateReportTemplateRecord(selectedTemplate.id, {
      sections: nextSections,
    });
  };

  const _handleReorderTemplateSection = async (
    sectionId: string,
    direction: "up" | "down",
  ) => {
    if (!selectedTemplate) return;
    const index = templateSections.findIndex(
      (section) => section.id === sectionId,
    );
    if (index === -1) return;
    const newIndex =
      direction === "up"
        ? Math.max(index - 1, 0)
        : Math.min(index + 1, templateSections.length - 1);
    if (newIndex === index) return;
    const copy = [...templateSections];
    const [item] = copy.splice(index, 1);
    if (!item) return;
    copy.splice(newIndex, 0, item);
    await updateReportTemplateRecord(selectedTemplate.id, { sections: copy });
  };

  const _handleSectionChange = (
    sectionId: string,
    updates: Partial<Pick<ReportSectionDefinition, "title" | "description">>,
  ) => {
    const current = useReportSectionsStore
      .getState()
      .sections.find((section) => section.id === sectionId);
    if (!current) return;
    updateSection(sectionId, { ...current, ...updates });
  };

  const _handleSectionBlur = async (sectionId: string) => {
    const current = useReportSectionsStore
      .getState()
      .sections.find((section) => section.id === sectionId);
    if (!current) return;
    try {
      await updateReportSectionRecord(current);
      toast.success("Sektion sparad", { id: sectionId });
    } catch (error) {
      console.error("Failed to update report section", error);
      toast.error("Kunde inte spara sektionen");
    }
  };

  const _handlePdfProfileChange = (
    key: keyof typeof pdfProfile,
    value: string | boolean,
  ) => {
    setPdfProfile({ [key]: value });
  };

  const _handleRemoveSection = async (sectionId: string) => {
    try {
      await detachSectionFromTemplates(sectionId);
      await deleteReportSectionRecord(sectionId);
      toast.success("Sektion borttagen");
    } catch (error) {
      console.error("Failed to delete section", error);
      toast.error("Kunde inte ta bort sektionen");
    }
  };

  const detachSectionFromTemplates = async (sectionId: string) => {
    await Promise.all(
      templates
        .filter((template) =>
          template.sections.some((section) => section.id === sectionId),
        )
        .map((template) =>
          updateReportTemplateRecord(template.id, {
            sections: template.sections.filter(
              (section) => section.id !== sectionId,
            ),
          }),
        ),
    );
  };

  const _handleAddSectionToLibrary = async () => {
    if (!newSection.title.trim()) {
      toast.error("Ange en titel för sektionen");
      return;
    }
    if (newSection.type === "image" && !newSection.imageUrl.trim()) {
      toast.error("Ange en bild-URL för bild-sektionen");
      return;
    }
    await createReportSectionRecord({
      title: newSection.title.trim(),
      description: newSection.description.trim(),
      category: undefined,
      type: newSection.type,
      imageUrl:
        newSection.type === "image" ? newSection.imageUrl.trim() : undefined,
      imageAltText:
        newSection.type === "image"
          ? newSection.imageAltText.trim()
          : undefined,
      isDefaultSection: newSection.isDefaultSection,
    });
    setNewSection({
      title: "",
      description: "",
      type: "text",
      imageUrl: "",
      imageAltText: "",
      isDefaultSection: false,
    });
    toast.success("Sektion skapad");
  };

  const _handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error("Ange ett namn på mallen");
      return;
    }
    const template = await createReportTemplateRecord({
      name: newTemplate.name.trim(),
      trade: newTemplate.trade as ReportTemplate["trade"],
      description: newTemplate.description.trim(),
    });
    setSelectedTemplateId(template.id);
    setIsTemplateDialogOpen(false);
    setNewTemplate({ name: "", trade: "bygg", description: "" });
    toast.success("Mall skapad");
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Rapportinställningar
          </h2>
          <p className="text-muted-foreground">
            Hantera mallar, sektioner och utseende för dina rapporter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/studio";
            }}
          >
            Öppna Report Studio
          </Button>
        </div>
      </div>

      <div className="grid flex-1 gap-8 md:grid-cols-[200px_1fr]">
        {/* Sidebar Navigation - simplified */}
        <aside className="flex flex-col gap-2">
          <h3 className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
            Designer
          </h3>
          <Button
            variant={activeTab === "designer" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setActiveTab("designer")}
          >
            <IconLayout2 className="mr-2 size-4" /> Dokumentdesigner
          </Button>
        </aside>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
          <DocumentDesigner />
        </main>
      </div>
    </div>
  );
}
