"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconDeviceFloppy,
  IconFileText,
  IconLoader2,
  IconPalette,
  IconPlus,
  IconSection,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
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
import { ImageUpload } from "@/components/ui/image-upload";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import { DESIGN_TEMPLATES } from "@/lib/rapport/designTemplates";
import {
  createReportSectionRecord,
  createReportTemplateRecord,
  deleteReportSectionRecord,
  fetchReportSections,
  fetchReportTemplates,
  updateReportTemplateRecord,
  useReportSectionsStore,
  useReportTemplatesStore,
} from "@/lib/store";
import type {
  ReportSectionDefinition,
  ReportSectionType,
  ReportTemplate,
} from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

const SECTION_TYPES: {
  value: ReportSectionType;
  label: string;
  icon: string;
  hasDefaultContent: boolean;
}[] = [
  { value: "text", label: "Brödtext", icon: "📝", hasDefaultContent: true },
  { value: "heading", label: "Rubrik", icon: "📌", hasDefaultContent: false },
  {
    value: "summary",
    label: "Sammanfattning",
    icon: "📋",
    hasDefaultContent: true,
  },
  {
    value: "checklist",
    label: "Checklista",
    icon: "✅",
    hasDefaultContent: false,
  },
  { value: "table", label: "Tabell", icon: "📊", hasDefaultContent: false },
  {
    value: "signature",
    label: "Signatur",
    icon: "✍️",
    hasDefaultContent: false,
  },
  { value: "image", label: "Bild", icon: "🖼️", hasDefaultContent: false },
  {
    value: "image_gallery",
    label: "Bildgalleri",
    icon: "📷",
    hasDefaultContent: false,
  },
  {
    value: "image_annotated",
    label: "Annoterad bild",
    icon: "✏️",
    hasDefaultContent: false,
  },
  { value: "divider", label: "Avdelare", icon: "➖", hasDefaultContent: false },
  { value: "links", label: "Länkar", icon: "🔗", hasDefaultContent: false },
];

const TRADE_OPTIONS = [
  { value: "bygg", label: "Bygg", color: "bg-orange-100 text-orange-800" },
  { value: "läckage", label: "Läckage", color: "bg-blue-100 text-blue-800" },
  {
    value: "elektriker",
    label: "Elektriker",
    color: "bg-yellow-100 text-yellow-800",
  },
];

const FONTS = ["Inter", "Space Grotesk", "Roboto", "Arial", "Times New Roman"];

const PRESET_COLORS = [
  { name: "Professionell blå", brand: "#1e40af", accent: "#3b82f6" },
  { name: "Elegant grå", brand: "#1f2937", accent: "#6b7280" },
  { name: "Natur grön", brand: "#166534", accent: "#22c55e" },
];

export function RapportSettingsV3() {
  const {
    templates,
    setTemplates,
    loading: tLoading,
    setLoading: setTLoading,
    initialized: tInit,
  } = useReportTemplatesStore();
  const {
    sections,
    setSections,
    loading: sLoading,
    setLoading: setSLoading,
    initialized: sInit,
  } = useReportSectionsStore();
  const {
    profile,
    setProfile,
    saveProfile,
    isSaving: profileSaving,
    lastSaved,
  } = usePdfProfileStore();

  const [tab, setTab] = useState("templates");
  const [selTplId, setSelTplId] = useState("");
  const [newSecOpen, setNewSecOpen] = useState(false);
  const [newTplOpen, setNewTplOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [installingDesign, setInstallingDesign] = useState(false);
  const [newSec, setNewSec] = useState({
    title: "",
    description: "",
    type: "text" as ReportSectionType,
    defaultContent: "",
    placeholder: "",
  });
  const [newTpl, setNewTpl] = useState({
    name: "",
    trade: "bygg" as ReportTemplate["trade"],
    description: "",
  });

  useEffect(() => {
    if (tInit) return;
    let active = true;
    const load = async () => {
      setTLoading(true);
      const data = await fetchReportTemplates();
      if (active) setTemplates(data);
      setTLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [tInit, setTemplates, setTLoading]);

  useEffect(() => {
    if (sInit) return;
    let active = true;
    const load = async () => {
      setSLoading(true);
      const data = await fetchReportSections();
      if (active) setSections(data);
      setSLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [sInit, setSections, setSLoading]);

  useEffect(() => {
    if (!selTplId && templates.length > 0) setSelTplId(templates[0]?.id ?? "");
  }, [selTplId, templates]);

  const selTpl = useMemo(
    () => templates.find((t) => t.id === selTplId),
    [templates, selTplId],
  );

  const createSec = async () => {
    if (!newSec.title.trim()) {
      toast.error("Ange titel");
      return;
    }
    try {
      await createReportSectionRecord({
        title: newSec.title.trim(),
        description: newSec.description.trim(),
        type: newSec.type,
        defaultContent: newSec.defaultContent.trim() || undefined,
        placeholder: newSec.placeholder.trim() || undefined,
        category: undefined,
        isDefaultSection: false,
      });
      setNewSec({
        title: "",
        description: "",
        type: "text",
        defaultContent: "",
        placeholder: "",
      });
      setNewSecOpen(false);
      toast.success("Sektion skapad!");
    } catch {
      toast.error("Kunde inte spara sektion");
    }
  };

  const delSec = async (id: string) => {
    if (!confirm("Ta bort sektion?")) return;
    try {
      await Promise.all(
        templates
          .filter((t) => t.sections.some((s) => s.id === id))
          .map((t) =>
            updateReportTemplateRecord(t.id, {
              sections: t.sections.filter((s) => s.id !== id),
            }),
          ),
      );
      await deleteReportSectionRecord(id);
      toast.success("Sektion borttagen!");
    } catch {
      toast.error("Kunde inte ta bort sektion");
    }
  };

  const createTpl = async () => {
    if (!newTpl.name.trim()) {
      toast.error("Ange namn");
      return;
    }
    try {
      const t = await createReportTemplateRecord({
        name: newTpl.name.trim(),
        trade: newTpl.trade,
        description: newTpl.description.trim(),
      });
      setSelTplId(t.id);
      setNewTpl({ name: "", trade: "bygg", description: "" });
      setNewTplOpen(false);
      toast.success("Mall skapad!");
    } catch {
      toast.error("Kunde inte spara mall");
    }
  };

  const toggleSec = async (sec: ReportSectionDefinition) => {
    if (!selTpl) return;
    const has = selTpl.sections.some((s) => s.id === sec.id);
    const next = has
      ? selTpl.sections.filter((s) => s.id !== sec.id)
      : [
          ...selTpl.sections,
          {
            id: sec.id,
            title: sec.title,
            description: sec.description,
            type: sec.type,
          },
        ];
    try {
      await updateReportTemplateRecord(selTpl.id, { sections: next });
      toast.success(has ? "Sektion borttagen" : "Sektion tillagd");
    } catch {
      toast.error("Kunde inte uppdatera mall");
    }
  };

  const reorder = async (id: string, dir: "up" | "down") => {
    if (!selTpl) return;
    const arr = [...selTpl.sections];
    const i = arr.findIndex((s) => s.id === id);
    if (i < 0) return;
    const ni =
      dir === "up" ? Math.max(0, i - 1) : Math.min(arr.length - 1, i + 1);
    if (ni === i) return;
    const [item] = arr.splice(i, 1);
    arr.splice(ni, 0, item!);
    try {
      await updateReportTemplateRecord(selTpl.id, { sections: arr });
    } catch {
      toast.error("Kunde inte ändra ordning");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const success = await saveProfile();
      if (success) {
        toast.success("PDF-styling sparad!");
      } else {
        toast.error("Kunde inte spara PDF-styling");
      }
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (p: (typeof PRESET_COLORS)[0]) => {
    setProfile({ brandColor: p.brand, accentColor: p.accent });
    toast.success(`Färgschema "${p.name}" applicerat`);
  };

  // Installera designmallar
  const installDesignTemplates = async () => {
    setInstallingDesign(true);
    try {
      let installed = 0;
      for (const design of DESIGN_TEMPLATES) {
        // Kolla om mallen redan finns
        const exists = templates.some((t) => t.name === design.name);
        if (exists) continue;

        await createReportTemplateRecord({
          name: design.name,
          trade: design.trade,
          description: design.description,
          sections: design.sections,
          checklist: design.checklist,
        });
        installed++;
      }

      if (installed > 0) {
        toast.success(`${installed} designmall(ar) installerade!`);
      } else {
        toast.info("Alla designmallar är redan installerade");
      }
    } catch (error) {
      console.error("Failed to install design templates", error);
      toast.error("Kunde inte installera designmallar");
    } finally {
      setInstallingDesign(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Rapportinställningar</h1>
            <p className="text-sm text-muted-foreground">
              Mallar, sektioner och PDF-styling
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{templates.length} mallar</Badge>
            <Badge variant="outline">{sections.length} sektioner</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={installDesignTemplates}
              disabled={installingDesign}
            >
              {installingDesign ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconSparkles className="mr-2 size-4" />
              )}
              Installera designmallar
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="border-b px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="templates" className="gap-2">
              <IconFileText className="size-4" />
              Mallar
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-2">
              <IconSection className="size-4" />
              Sektioner
            </TabsTrigger>
            <TabsTrigger value="styling" className="gap-2">
              <IconPalette className="size-4" />
              PDF-styling
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="templates" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full grid gap-6 lg:grid-cols-[300px_1fr]">
            <Card className="flex flex-col">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Mallar</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewTplOpen(true)}
                >
                  <IconPlus className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4 pt-0">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelTplId(t.id)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          t.id === selTplId
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent",
                        )}
                      >
                        <div className="font-medium">{t.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              TRADE_OPTIONS.find((o) => o.value === t.trade)
                                ?.color,
                            )}
                          >
                            {t.trade}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t.sections.length} sektioner
                          </span>
                        </div>
                      </button>
                    ))}
                    {templates.length === 0 && !tLoading && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Inga mallar ännu
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              {selTpl ? (
                <>
                  <CardHeader className="pb-2">
                    <CardTitle>{selTpl.name}</CardTitle>
                    <CardDescription>
                      {selTpl.description || "Ingen beskrivning"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0">
                    <div className="grid gap-4 lg:grid-cols-2 h-full">
                      <div className="flex flex-col min-h-0">
                        <h4 className="text-sm font-medium mb-2">
                          Tillgängliga sektioner
                        </h4>
                        <ScrollArea className="flex-1 border rounded-lg p-3">
                          <div className="space-y-2">
                            {sections.map((s) => {
                              const has = selTpl.sections.some(
                                (x) => x.id === s.id,
                              );
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => toggleSec(s)}
                                  className={cn(
                                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                    has
                                      ? "border-primary bg-primary/10"
                                      : "hover:bg-accent",
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={cn(
                                        "font-medium",
                                        has && "text-primary",
                                      )}
                                    >
                                      {s.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {
                                        SECTION_TYPES.find(
                                          (t) => t.value === s.type,
                                        )?.label
                                      }
                                    </Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="flex flex-col min-h-0">
                        <h4 className="text-sm font-medium mb-2">
                          I mallen ({selTpl.sections.length})
                        </h4>
                        <ScrollArea className="flex-1 border rounded-lg p-3">
                          <div className="space-y-2">
                            {selTpl.sections.map((s, i) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
                              >
                                <span className="text-xs text-muted-foreground w-5">
                                  {i + 1}.
                                </span>
                                <span className="flex-1 text-sm font-medium truncate">
                                  {s.title}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6"
                                  disabled={i === 0}
                                  onClick={() => reorder(s.id, "up")}
                                >
                                  <IconArrowUp className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6"
                                  disabled={i === selTpl.sections.length - 1}
                                  onClick={() => reorder(s.id, "down")}
                                >
                                  <IconArrowDown className="size-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Välj eller skapa en mall
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium">Sektioner</h2>
                <p className="text-sm text-muted-foreground">
                  Byggstenar för mallar
                </p>
              </div>
              <Button onClick={() => setNewSecOpen(true)}>
                <IconPlus className="mr-2 size-4" />
                Ny sektion
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((s) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {SECTION_TYPES.find((t) => t.value === s.type)
                              ?.icon || "📝"}
                          </span>
                          <CardTitle className="text-base">{s.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => delSec(s.id)}
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge variant="outline" className="text-xs">
                        {SECTION_TYPES.find((t) => t.value === s.type)?.label ||
                          "Text"}
                      </Badge>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Används i{" "}
                        {
                          templates.filter((t) =>
                            t.sections.some((x) => x.id === s.id),
                          ).length
                        }{" "}
                        mallar
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent
          value="styling"
          className="flex-1 min-h-0 m-0 p-6 overflow-auto"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">PDF-styling</h2>
                <p className="text-sm text-muted-foreground">
                  Utseende för alla rapporter
                </p>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={saving || profileSaving}
              >
                <IconDeviceFloppy className="mr-2 size-4" />
                {saving || profileSaving ? "Sparar..." : "Spara"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snabbval färgschema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <div
                        className="size-4 rounded-full"
                        style={{ backgroundColor: p.brand }}
                      />
                      <div
                        className="size-4 rounded-full"
                        style={{ backgroundColor: p.accent }}
                      />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Logotyp</Label>
                  <ImageUpload
                    value={profile.logoUrl}
                    onChange={(url) => setProfile({ logoUrl: url })}
                    onRemove={() => setProfile({ logoUrl: "" })}
                    maxSizeMB={2}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Visa logotyp i header</span>
                  <Switch
                    checked={profile.displayLogo}
                    onCheckedChange={(checked: boolean) =>
                      setProfile({ displayLogo: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Färger & Typsnitt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Primärfärg</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        className="h-9 w-12 p-1"
                        value={profile.brandColor}
                        onChange={(e) =>
                          setProfile({ brandColor: e.target.value })
                        }
                      />
                      <Input
                        value={profile.brandColor}
                        onChange={(e) =>
                          setProfile({ brandColor: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Accentfärg</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        className="h-9 w-12 p-1"
                        value={profile.accentColor}
                        onChange={(e) =>
                          setProfile({ accentColor: e.target.value })
                        }
                      />
                      <Input
                        value={profile.accentColor}
                        onChange={(e) =>
                          setProfile({ accentColor: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Typsnitt</Label>
                  <Select
                    value={profile.fontFamily}
                    onValueChange={(v) => setProfile({ fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Header & Footer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Header-text</Label>
                  <Input
                    value={profile.headerText}
                    onChange={(e) => setProfile({ headerText: e.target.value })}
                    placeholder="Text i header"
                  />
                </div>
                <div>
                  <Label>Footer-text</Label>
                  <Textarea
                    value={profile.footerText}
                    onChange={(e) => setProfile({ footerText: e.target.value })}
                    placeholder="Text i footer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={newSecOpen} onOpenChange={setNewSecOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Skapa ny sektion</DialogTitle>
            <DialogDescription>
              Sektioner är byggstenar för rapportmallar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={newSec.title}
                onChange={(e) =>
                  setNewSec((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Ex. Sammanfattning"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Typ</Label>
              <Select
                value={newSec.type}
                onValueChange={(v) =>
                  setNewSec((p) => ({ ...p, type: v as ReportSectionType }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beskrivning / Hjälptext</Label>
              <Textarea
                value={newSec.description}
                onChange={(e) =>
                  setNewSec((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Kort beskrivning som visas för användaren"
                rows={2}
                className="mt-1"
              />
            </div>
            {SECTION_TYPES.find((t) => t.value === newSec.type)
              ?.hasDefaultContent && (
              <div>
                <Label className="flex items-center gap-2">
                  Förifylld text
                  <Badge variant="outline" className="text-[10px]">
                    Stöder variabler
                  </Badge>
                </Label>
                <Textarea
                  value={newSec.defaultContent}
                  onChange={(e) =>
                    setNewSec((p) => ({ ...p, defaultContent: e.target.value }))
                  }
                  placeholder="Text som fylls i automatiskt. Använd {{client}}, {{location}}, {{today}} etc."
                  rows={4}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variabler: {"{{client}}"}, {"{{location}}"}, {"{{today}}"},{" "}
                  {"{{assignedTo}}"}, {"{{projectReference}}"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSecOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={createSec}>Skapa sektion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newTplOpen} onOpenChange={setNewTplOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny mall</DialogTitle>
            <DialogDescription>
              Mallar definierar vilka sektioner som ingår.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Namn *</Label>
              <Input
                value={newTpl.name}
                onChange={(e) =>
                  setNewTpl((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ex. Läckagerapport Standard"
              />
            </div>
            <div>
              <Label>Typ</Label>
              <Select
                value={newTpl.trade}
                onValueChange={(v) =>
                  setNewTpl((p) => ({
                    ...p,
                    trade: v as ReportTemplate["trade"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beskrivning</Label>
              <Textarea
                value={newTpl.description}
                onChange={(e) =>
                  setNewTpl((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Kort beskrivning"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTplOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={createTpl}>Skapa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RapportSettingsV3;
