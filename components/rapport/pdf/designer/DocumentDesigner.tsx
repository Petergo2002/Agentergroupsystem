"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDocumentDesignerStore } from "@/stores/documentDesignerStore";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDesignerTemplatesStore } from "@/stores/designerTemplatesStore";
import type { DesignerBlock } from "./DesignerDocument";
import {
  IconPlus,
  IconH1,
  IconH2,
  IconH3,
  IconAlignLeft,
  IconPhoto,
  IconPageBreak,
  IconArrowUp,
  IconArrowDown,
  IconTrash,
  IconDeviceFloppy,
  IconEye,
} from "@tabler/icons-react";

export default function DocumentDesigner() {
  const { blocks, addBlock, updateBlock, reorderBlock, deleteBlock } = useDocumentDesignerStore();
  const { profile: branding, setProfile: setBranding } = usePdfProfileStore();
  const { addTemplate, fetchTemplates } = useDesignerTemplatesStore();

  // Fetch PDF designs on mount (shared globally)
  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [hasUnsaved, setHasUnsaved] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");

  const fonts = ["Inter", "Space Grotesk", "Roboto", "Source Sans", "Times"];

  const add = (block: DesignerBlock) => {
    addBlock(block);
    setHasUnsaved(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      setHasUnsaved(false);
      toast.success("Designer sparad");
    } catch (e) {
      toast.error("Kunde inte spara");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const response = await fetch("/api/designer/preview/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, branding }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Fel vid generering");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("PDF-förhandsgranskning öppnad");
    } catch (e: any) {
      toast.error(e.message || "Okänt fel");
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header med åtgärder - kompakt */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">PDF-designer</h2>
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "heading", level: 1, text: "Rubrik" })}>
              <IconH1 className="mr-1 h-3.5 w-3.5" /> H1
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "heading", level: 2, text: "Sektion" })}>
              <IconH2 className="mr-1 h-3.5 w-3.5" /> H2
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "heading", level: 3, text: "Delrubrik" })}>
              <IconH3 className="mr-1 h-3.5 w-3.5" /> H3
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "paragraph", text: "Skriv text här..." })}>
              <IconAlignLeft className="mr-1 h-3.5 w-3.5" /> Text
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "image", url: "", caption: "" })}>
              <IconPhoto className="mr-1 h-3.5 w-3.5" /> Bild
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => add({ id: crypto.randomUUID(), type: "pageBreak" })}>
              <IconPageBreak className="mr-1 h-3.5 w-3.5" /> Sidbryt
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => setIsTemplateDialogOpen(true)}>
            Spara mall
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handlePreview} disabled={isPreviewing}>
            <IconEye className="mr-1 h-3.5 w-3.5" /> {isPreviewing ? "..." : "Förhandsgranska"}
          </Button>
          <Button size="sm" className="h-8" onClick={handleSave} disabled={!hasUnsaved || isSaving}>
            <IconDeviceFloppy className="mr-1 h-3.5 w-3.5" /> {isSaving ? "..." : hasUnsaved ? "Spara" : "Sparat"}
          </Button>
        </div>
      </div>

      {/* Main content - tre kolumner som fyller hela ytan */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-0 min-h-0 overflow-hidden">
        
        {/* Kolumn 1: Grundinformation & Branding */}
        <div className="border-r overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-4">Grundinformation</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Kundnamn</Label>
              <Input className="h-9" placeholder="Namn på kund" value={branding.customerName} onChange={(e) => setBranding({ customerName: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Projektreferens</Label>
              <Input className="h-9" placeholder="Ex. PRJ-2024-001" value={branding.projectRef} onChange={(e) => setBranding({ projectRef: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Adress</Label>
              <Textarea rows={2} placeholder="Gatuadress, postnummer, ort" value={branding.address} onChange={(e) => setBranding({ address: e.target.value })} />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase">Branding</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Logotyp</Label>
                <ImageUpload
                  value={branding.logoUrl}
                  onChange={(url) => setBranding({ logoUrl: url })}
                  onRemove={() => setBranding({ logoUrl: "" })}
                  maxSizeMB={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Brandfärg</Label>
                  <div className="flex gap-1">
                    <Input type="color" className="h-8 w-8 shrink-0 p-0.5" value={branding.brandColor} onChange={(e) => setBranding({ brandColor: e.target.value })} />
                    <Input className="h-8 text-xs" value={branding.brandColor} onChange={(e) => setBranding({ brandColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Accentfärg</Label>
                  <div className="flex gap-1">
                    <Input type="color" className="h-8 w-8 shrink-0 p-0.5" value={branding.accentColor} onChange={(e) => setBranding({ accentColor: e.target.value })} />
                    <Input className="h-8 text-xs" value={branding.accentColor} onChange={(e) => setBranding({ accentColor: e.target.value })} />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Typsnitt</Label>
                <Select value={branding.fontFamily} onValueChange={(val) => setBranding({ fontFamily: val })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fonts.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Header-text</Label>
                <Input className="h-8 text-xs" value={branding.headerText} onChange={(e) => setBranding({ headerText: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Footer-text</Label>
                <Textarea rows={2} className="text-xs" value={branding.footerText} onChange={(e) => setBranding({ footerText: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <span className="text-xs">Visa logotyp i header</span>
                <Switch checked={branding.displayLogo} onCheckedChange={(c: boolean) => setBranding({ displayLogo: c })} />
              </div>
            </div>
          </div>
        </div>

        {/* Kolumn 2: Dokumentinnehåll */}
        <div className="border-r overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-4">Dokumentinnehåll</h3>
          <div className="space-y-3">
            {blocks.map((b, index) => (
              <div key={b.id} className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    {b.type === "heading" ? `Rubrik H${(b as any).level}` : b.type === "paragraph" ? "Brödtext" : b.type === "image" ? "Bild" : "Sidbrytning"}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { reorderBlock(Math.max(index,0), Math.max(index - 1, 0)); setHasUnsaved(true); }} disabled={index === 0}>
                      <IconArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { reorderBlock(index, Math.min(index + 1, blocks.length - 1)); setHasUnsaved(true); }} disabled={index === blocks.length - 1}>
                      <IconArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteBlock(b.id); setHasUnsaved(true); }}>
                      <IconTrash className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {b.type === "heading" && (
                  <div className="grid gap-2 grid-cols-[80px_1fr]">
                    <div>
                      <Label className="text-xs">Nivå</Label>
                      <Select value={(b.level || 1).toString()} onValueChange={(val) => { updateBlock(b.id, { level: Number(val) as 1|2|3 }); setHasUnsaved(true); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">H1</SelectItem>
                          <SelectItem value="2">H2</SelectItem>
                          <SelectItem value="3">H3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input className="h-8 text-sm" value={b.text} onChange={(e) => { updateBlock(b.id, { text: e.target.value }); setHasUnsaved(true); }} />
                    </div>
                  </div>
                )}

                {b.type === "paragraph" && (
                  <div>
                    <Label className="text-xs">Text</Label>
                    <Textarea rows={3} className="text-sm" value={b.text} onChange={(e) => { updateBlock(b.id, { text: e.target.value }); setHasUnsaved(true); }} />
                  </div>
                )}

                {b.type === "image" && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Bild-URL</Label>
                      <Input className="h-8 text-xs" placeholder="https://..." value={b.url} onChange={(e) => { updateBlock(b.id, { url: e.target.value }); setHasUnsaved(true); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Bildtext</Label>
                      <Input className="h-8 text-xs" value={b.caption || ""} onChange={(e) => { updateBlock(b.id, { caption: e.target.value }); setHasUnsaved(true); }} />
                    </div>
                  </div>
                )}

                {b.type === "pageBreak" && (
                  <div className="flex items-center justify-center rounded border border-dashed py-1 text-xs text-muted-foreground">
                    ─── Sidbrytning ───
                  </div>
                )}
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Inga block ännu</p>
                <p className="mt-1 text-xs text-muted-foreground">Lägg till block från verktygsfältet</p>
              </div>
            )}
          </div>
        </div>

        {/* Kolumn 3: Live Preview */}
        <div className="overflow-y-auto p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-4">Förhandsvisning</h3>
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950 min-h-[400px]">
            {/* Header preview */}
            {branding.customerName && (
              <div className="mb-4 pb-3 border-b">
                <div className="text-xs text-muted-foreground">Kund</div>
                <div className="font-medium">{branding.customerName}</div>
                {branding.projectRef && <div className="text-xs text-muted-foreground mt-1">Ref: {branding.projectRef}</div>}
                {branding.address && <div className="text-xs text-muted-foreground">{branding.address}</div>}
              </div>
            )}
            
            {/* Content preview */}
            <div className="space-y-3">
              {blocks.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">Inga block att visa</p>
              ) : (
                blocks.map((b) => (
                  <div key={b.id}>
                    {b.type === "heading" ? (
                      <div className={cn(
                        b.level === 1 ? "text-lg font-bold" : 
                        b.level === 2 ? "text-base font-semibold" : 
                        "text-sm font-semibold"
                      )}>{b.text}</div>
                    ) : b.type === "paragraph" ? (
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{b.text}</p>
                    ) : b.type === "image" ? (
                      <div>
                        {b.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.url} alt={b.caption || ""} className="max-h-32 w-full rounded border object-contain" />
                        ) : (
                          <div className="flex h-16 items-center justify-center rounded border text-[10px] text-muted-foreground">Ingen bild</div>
                        )}
                        {b.caption && <div className="mt-1 text-center text-[10px] text-muted-foreground">{b.caption}</div>}
                      </div>
                    ) : (
                      <div className="border-t border-dashed my-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Save as template dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spara som mall</DialogTitle>
            <DialogDescription>Namnge mallen så kan du återanvända designen.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Mallnamn</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ex. Läckagerapport – standard" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Avbryt</Button>
            <Button
              onClick={async () => {
                const name = templateName.trim();
                if (!name) { toast.error("Ange ett namn"); return; }
                try {
                  await addTemplate(name, blocks, branding);
                  toast.success("Mall sparad");
                  setIsTemplateDialogOpen(false);
                  setTemplateName("");
                } catch (err) {
                  toast.error("Kunde inte spara mall");
                }
              }}
            >
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
