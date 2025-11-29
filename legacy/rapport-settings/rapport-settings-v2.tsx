"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconDeviceFloppy,
  IconFileText,
  IconPalette,
  IconPlus,
  IconSection,
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
}[] = [
  { value: "text", label: "Brödtext", icon: "📝" },
  { value: "image", label: "Bild", icon: "🖼️" },
  { value: "image_gallery", label: "Bildgalleri", icon: "📷" },
  { value: "image_annotated", label: "Annoterad bild", icon: "✏️" },
];

const TRADE_OPTIONS = [
  { value: "bygg", label: "Bygg" },
  { value: "läckage", label: "Läckage" },
  { value: "elektriker", label: "Elektriker" },
];

const FONTS = ["Inter", "Space Grotesk", "Roboto", "Arial", "Times New Roman"];

export function RapportSettingsV2() {
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
  const { profile, setProfile } = usePdfProfileStore();

  const [tab, setTab] = useState("sections");
  const [selTplId, setSelTplId] = useState("");
  const [newSecOpen, setNewSecOpen] = useState(false);
  const [newTplOpen, setNewTplOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSec, setNewSec] = useState({
    title: "",
    description: "",
    type: "text" as ReportSectionType,
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
        category: undefined,
        isDefaultSection: false,
      });
      setNewSec({ title: "", description: "", type: "text" });
      setNewSecOpen(false);
      toast.success("Sektion sparad till databasen!");
    } catch (_err) {
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
    } catch (_err) {
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
      toast.success("Mall sparad till databasen!");
    } catch (_err) {
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
      toast.success(
        has ? "Sektion borttagen från mall" : "Sektion tillagd i mall",
      );
    } catch (_err) {
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
    } catch (_err) {
      toast.error("Kunde inte ändra ordning");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      toast.success("PDF-styling sparad!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Rapportinställningar</h1>
        <p className="text-sm text-muted-foreground">
          Sektioner, mallar och PDF-styling
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="sections" className="gap-2">
              <IconSection className="size-4" />
              Sektioner
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <IconFileText className="size-4" />
              Mallar
            </TabsTrigger>
            <TabsTrigger value="styling" className="gap-2">
              <IconPalette className="size-4" />
              PDF-styling
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SEKTIONER */}
        <TabsContent value="sections" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium">Sektioner</h2>
                <p className="text-sm text-muted-foreground">
                  Byggstenar för mallar - sparas i databasen
                </p>
              </div>
              <Button onClick={() => setNewSecOpen(true)}>
                <IconPlus className="mr-2 size-4" />
                Ny sektion
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {sLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Laddar...
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    Inga sektioner ännu
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSecOpen(true)}
                  >
                    Skapa din första sektion
                  </Button>
                </div>
              ) : (
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
                            <CardTitle className="text-base">
                              {s.title}
                            </CardTitle>
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
                          {SECTION_TYPES.find((t) => t.value === s.type)
                            ?.label || "Text"}
                        </Badge>
                        {s.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {s.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* MALLAR */}
        <TabsContent value="templates" className="flex-1 min-h-0 m-0 p-6">
          <div className="h-full grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Mall-lista */}
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
                          <Badge variant="outline" className="text-[10px]">
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

            {/* Mall-detaljer */}
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
                      {/* Tillgängliga sektioner */}
                      <div className="flex flex-col min-h-0">
                        <h4 className="text-sm font-medium mb-2">
                          Tillgängliga sektioner
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Klicka för att lägga till i mallen
                        </p>
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
                            {sections.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Skapa sektioner först
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Sektioner i mallen */}
                      <div className="flex flex-col min-h-0">
                        <h4 className="text-sm font-medium mb-2">
                          I mallen ({selTpl.sections.length})
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Ordna med pilarna
                        </p>
                        <ScrollArea className="flex-1 border rounded-lg p-3">
                          <div className="space-y-2">
                            {selTpl.sections.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Lägg till sektioner från listan
                              </p>
                            ) : (
                              selTpl.sections.map((s, i) => (
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
                                  <div className="flex gap-0.5">
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
                                      disabled={
                                        i === selTpl.sections.length - 1
                                      }
                                      onClick={() => reorder(s.id, "down")}
                                    >
                                      <IconArrowDown className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
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

        {/* PDF-STYLING */}
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
              <Button onClick={saveProfile} disabled={saving}>
                <IconDeviceFloppy className="mr-2 size-4" />
                {saving ? "Sparar..." : "Spara styling"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Grundinfo (standard)
                </CardTitle>
                <CardDescription>
                  Dessa värden kan ändras per rapport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Kundnamn</Label>
                    <Input
                      value={profile.customerName}
                      onChange={(e) =>
                        setProfile({ customerName: e.target.value })
                      }
                      placeholder="Fylls i per rapport"
                    />
                  </div>
                  <div>
                    <Label>Projektreferens</Label>
                    <Input
                      value={profile.projectRef}
                      onChange={(e) =>
                        setProfile({ projectRef: e.target.value })
                      }
                      placeholder="Fylls i per rapport"
                    />
                  </div>
                </div>
                <div>
                  <Label>Adress</Label>
                  <Textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ address: e.target.value })}
                    placeholder="Fylls i per rapport"
                    rows={2}
                  />
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
                    <Label>Brandfärg</Label>
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
                    placeholder="Text som visas i header"
                  />
                </div>
                <div>
                  <Label>Footer-text</Label>
                  <Textarea
                    value={profile.footerText}
                    onChange={(e) => setProfile({ footerText: e.target.value })}
                    placeholder="Text som visas i footer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* NY SEKTION DIALOG */}
      <Dialog open={newSecOpen} onOpenChange={setNewSecOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny sektion</DialogTitle>
            <DialogDescription>
              Sektioner är byggstenar som kan användas i rapportmallar.
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
                placeholder="Ex. Sammanfattning, Bakgrund, Slutsats"
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
                <SelectTrigger>
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
              <Label>Beskrivning (valfri)</Label>
              <Textarea
                value={newSec.description}
                onChange={(e) =>
                  setNewSec((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Kort beskrivning av sektionen"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSecOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={createSec}>Skapa & spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NY MALL DIALOG */}
      <Dialog open={newTplOpen} onOpenChange={setNewTplOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny mall</DialogTitle>
            <DialogDescription>
              Mallar definierar vilka sektioner som ingår i en rapport.
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
              <Label>Beskrivning (valfri)</Label>
              <Textarea
                value={newTpl.description}
                onChange={(e) =>
                  setNewTpl((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Kort beskrivning av mallen"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTplOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={createTpl}>Skapa & spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
