"use client";

/**
 * Template Editor Component
 *
 * Redigera en mall - lägg till/ta bort/ordna sektioner.
 */

import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconFileText,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  ReportTrade,
  SimpleSectionDefinition,
  SimpleSectionType,
} from "@/lib/types/rapport";
import { useSimpleReportStore } from "@/stores/simpleReportStore";

// Sektionstyp-konfiguration
const SECTION_TYPES: Record<
  SimpleSectionType,
  { icon: typeof IconFileText; label: string; description: string }
> = {
  text: {
    icon: IconFileText,
    label: "Rubrik + Text",
    description: "En rubrik med fritext (markdown)",
  },
  images: {
    icon: IconPhoto,
    label: "Bilder",
    description: "Bildgalleri med annoteringar",
  },
};

interface TemplateEditorProps {
  onBack: () => void;
}

export function TemplateEditor({ onBack }: TemplateEditorProps) {
  const {
    getActiveTemplate,
    updateTemplate,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
  } = useSimpleReportStore();

  const template = getActiveTemplate();
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] =
    useState<SimpleSectionDefinition | null>(null);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Välj en mall att redigera</p>
      </div>
    );
  }

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const currentIndex = template.sections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= template.sections.length) return;

    const newOrder = [...template.sections.map((s) => s.id)];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[newIndex]!;
    newOrder[newIndex] = temp!;
    reorderSections(template.id, newOrder);
  };

  const handleEditSection = (section: SimpleSectionDefinition) => {
    setEditingSection(section);
    setEditSectionDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Redigera mall</h2>
          </div>
        </div>

        {/* Mall-info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Namn</Label>
            <Input
              value={template.name}
              onChange={(e) =>
                updateTemplate(template.id, { name: e.target.value })
              }
              className="mt-1 bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-400">Bransch</Label>
            <Select
              value={template.trade}
              onValueChange={(value) =>
                updateTemplate(template.id, { trade: value as ReportTrade })
              }
            >
              <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="läckage">Läckage</SelectItem>
                <SelectItem value="bygg">Bygg</SelectItem>
                <SelectItem value="elektriker">Elektriker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-gray-400">Beskrivning</Label>
            <Textarea
              value={template.description || ""}
              onChange={(e) =>
                updateTemplate(template.id, { description: e.target.value })
              }
              className="mt-1 bg-white/5 border-white/10 resize-none"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Sektioner */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Sektioner</h3>
          <Button
            size="sm"
            onClick={() => setAddSectionDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <IconPlus className="w-4 h-4 mr-2" />
            Lägg till
          </Button>
        </div>

        {template.sections.length === 0 ? (
          <Card className="bg-white/5 border-white/10 border-dashed">
            <CardContent className="py-12 text-center">
              <IconFileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 mb-4">Inga sektioner ännu</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddSectionDialogOpen(true)}
              >
                Lägg till första sektionen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {template.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  total={template.sections.length}
                  onEdit={() => handleEditSection(section)}
                  onDelete={() => deleteSection(template.id, section.id)}
                  onMoveUp={() => handleMoveSection(section.id, "up")}
                  onMoveDown={() => handleMoveSection(section.id, "down")}
                />
              ))}
          </div>
        )}
      </div>

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={addSectionDialogOpen}
        onOpenChange={setAddSectionDialogOpen}
        onAdd={(section) => {
          addSection(template.id, section);
          setAddSectionDialogOpen(false);
        }}
      />

      {/* Edit Section Dialog */}
      {editingSection && (
        <EditSectionDialog
          open={editSectionDialogOpen}
          onOpenChange={setEditSectionDialogOpen}
          section={editingSection}
          onSave={(updates) => {
            updateSection(template.id, editingSection.id, updates);
            setEditSectionDialogOpen(false);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Section Card
// ============================================================================

interface SectionCardProps {
  section: SimpleSectionDefinition;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionCard({
  section,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const config = SECTION_TYPES[section.type];
  const Icon = config.icon;

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Drag Handle & Order */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={index === 0}
              onClick={onMoveUp}
            >
              <IconChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-500 font-mono">{index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={index === total - 1}
              onClick={onMoveDown}
            >
              <IconChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Icon */}
          <div
            className={`p-2 rounded-lg ${section.type === "text" ? "bg-blue-500/20" : "bg-purple-500/20"}`}
          >
            <Icon
              className={`w-4 h-4 ${section.type === "text" ? "text-blue-400" : "text-purple-400"}`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white truncate">
                {section.title}
              </span>
              {section.required && (
                <Badge
                  variant="secondary"
                  className="bg-red-500/20 text-red-400 text-xs"
                >
                  Obligatorisk
                </Badge>
              )}
            </div>
            {section.description && (
              <p className="text-sm text-gray-400 truncate">
                {section.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <IconPencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
              onClick={onDelete}
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Add Section Dialog
// ============================================================================

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (section: Omit<SimpleSectionDefinition, "id" | "order">) => void;
}

// Tillgängliga variabler för förifylld text
const AVAILABLE_VARIABLES = [
  { key: "{{kund}}", label: "Kund/Företag", description: "Kundens namn" },
  { key: "{{adress}}", label: "Adress", description: "Projektets adress" },
  { key: "{{datum}}", label: "Datum", description: "Dagens datum" },
  { key: "{{utredare}}", label: "Utredare", description: "Utredarens namn" },
  {
    key: "{{projektreferens}}",
    label: "Projektreferens",
    description: "Projekt-ID",
  },
];

function AddSectionDialog({
  open,
  onOpenChange,
  onAdd,
}: AddSectionDialogProps) {
  const [type, setType] = useState<SimpleSectionType>("text");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultContent, setDefaultContent] = useState("");
  const [required, setRequired] = useState(false);

  const insertVariable = (variable: string) => {
    setDefaultContent((prev) => prev + variable);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      defaultContent: defaultContent.trim() || undefined,
      required,
    });
    // Reset
    setType("text");
    setTitle("");
    setDescription("");
    setDefaultContent("");
    setRequired(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle>Lägg till sektion</DialogTitle>
          <DialogDescription>
            Välj typ och fyll i information för den nya sektionen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Typ-väljare */}
          <div className="grid grid-cols-2 gap-3">
            {(
              Object.entries(SECTION_TYPES) as [
                SimpleSectionType,
                (typeof SECTION_TYPES)["text"],
              ][]
            ).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all ${
                    type === key
                      ? "bg-emerald-500/20 border-emerald-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                  onClick={() => setType(key)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon
                      className={`w-8 h-8 mx-auto mb-2 ${type === key ? "text-emerald-400" : "text-gray-400"}`}
                    />
                    <p className="font-medium text-white">{config.label}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {config.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Titel */}
          <div>
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Inledning, Dokumentation..."
              className="mt-1 bg-white/5 border-white/10"
            />
          </div>

          {/* Beskrivning */}
          <div>
            <Label>Beskrivning (valfritt)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hjälptext för användaren..."
              className="mt-1 bg-white/5 border-white/10 resize-none"
              rows={2}
            />
          </div>

          {/* Förifylld text (endast för text-sektioner) */}
          {type === "text" && (
            <div>
              <Label>Förifylld text (valfritt)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Text som fylls i automatiskt. Använd variabler för dynamiskt
                innehåll.
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={defaultContent}
                onChange={(e) => setDefaultContent(e.target.value)}
                placeholder="T.ex. Denna rapport avser {{kund}} på {{adress}}..."
                className="mt-1 bg-white/5 border-white/10 resize-none font-mono text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Obligatorisk */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Obligatorisk</Label>
              <p className="text-xs text-gray-400">
                Måste fyllas i för att slutföra rapporten
              </p>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Lägg till
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Edit Section Dialog
// ============================================================================

interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SimpleSectionDefinition;
  onSave: (updates: Partial<SimpleSectionDefinition>) => void;
}

function EditSectionDialog({
  open,
  onOpenChange,
  section,
  onSave,
}: EditSectionDialogProps) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || "");
  const [defaultContent, setDefaultContent] = useState(
    section.defaultContent || "",
  );
  const [required, setRequired] = useState(section.required);

  const insertVariable = (variable: string) => {
    setDefaultContent((prev) => prev + variable);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      defaultContent: defaultContent.trim() || undefined,
      required,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle>Redigera sektion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Typ (readonly) */}
          <div>
            <Label className="text-gray-400">Typ</Label>
            <div className="mt-1 flex items-center gap-2 p-3 bg-white/5 rounded-lg">
              {section.type === "text" ? (
                <IconFileText className="w-5 h-5 text-blue-400" />
              ) : (
                <IconPhoto className="w-5 h-5 text-purple-400" />
              )}
              <span className="text-white">
                {SECTION_TYPES[section.type].label}
              </span>
            </div>
          </div>

          {/* Titel */}
          <div>
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 bg-white/5 border-white/10"
            />
          </div>

          {/* Beskrivning */}
          <div>
            <Label>Beskrivning</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-white/5 border-white/10 resize-none"
              rows={2}
            />
          </div>

          {/* Förifylld text (endast för text-sektioner) */}
          {section.type === "text" && (
            <div>
              <Label>Förifylld text</Label>
              <p className="text-xs text-gray-400 mb-2">
                Text som fylls i automatiskt. Använd variabler för dynamiskt
                innehåll.
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={defaultContent}
                onChange={(e) => setDefaultContent(e.target.value)}
                placeholder="T.ex. Denna rapport avser {{kund}} på {{adress}}..."
                className="mt-1 bg-white/5 border-white/10 resize-none font-mono text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Obligatorisk */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Obligatorisk</Label>
              <p className="text-xs text-gray-400">
                Måste fyllas i för att slutföra rapporten
              </p>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateEditor;
