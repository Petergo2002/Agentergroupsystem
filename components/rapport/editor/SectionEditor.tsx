"use client";

import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconEyeOff,
  IconMessageCircle,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  LinkItem,
  Report,
  ReportAsset,
  ReportChecklistItem,
  ReportSectionInstance,
  ReportTemplate,
  SignatureData,
} from "@/lib/types/rapport";
import { cn } from "@/lib/utils";
import { type Annotation, ImageAnnotator } from "./ImageAnnotator";
import { SnippetPicker } from "./SnippetPicker";

// ============================================================================
// Types
// ============================================================================

interface SectionEditorProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  onMarkComplete: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  report?: Report;
  template?: ReportTemplate;
  assets?: ReportAsset[];
  onAssetsChange?: (assets: ReportAsset[]) => void;
}

// ============================================================================
// Component
// ============================================================================

export function SectionEditor({
  section,
  onChange,
  onMarkComplete,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  report,
  template,
  assets = [],
  onAssetsChange,
}: SectionEditorProps) {
  const [showInternalNotes, setShowInternalNotes] = useState(
    !!section.internalNotes,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert text at cursor position
  const insertTextAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        // Fallback: append to content
        onChange({ content: (section.content || "") + text });
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = section.content || "";
      const newContent =
        currentContent.substring(0, start) +
        text +
        currentContent.substring(end);

      onChange({ content: newContent });

      // Restore cursor position after text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    },
    [section.content, onChange],
  );

  const _handleContentChange = useCallback(
    (content: string) => {
      onChange({ content });
    },
    [onChange],
  );

  const handleInternalNotesChange = useCallback(
    (internalNotes: string) => {
      onChange({ internalNotes });
    },
    [onChange],
  );

  const isCompleted = section.status === "completed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.visibility?.audience === "internal" && (
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  <IconEyeOff className="mr-1 size-3" />
                  Endast intern
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-emerald-500">
                  <IconCheck className="mr-1 size-3" />
                  Klar
                </Badge>
              )}
            </div>
            {section.hint && (
              <p className="mt-1 text-sm text-muted-foreground">
                {section.hint}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInternalNotes(!showInternalNotes)}
              className={cn(
                showInternalNotes && "bg-amber-50 border-amber-200",
              )}
            >
              <IconMessageCircle className="mr-2 size-4" />
              Intern anteckning
            </Button>
            <Button
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              onClick={onMarkComplete}
            >
              <IconCheck className="mr-2 size-4" />
              {isCompleted ? "Markera som ej klar" : "Markera som klar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Internal notes (collapsible) */}
          {showInternalNotes && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                  <IconEyeOff className="size-4" />
                  Intern anteckning
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Denna text syns endast internt, aldrig för kund
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={section.internalNotes || ""}
                  onChange={(e) => handleInternalNotesChange(e.target.value)}
                  placeholder="Skriv interna anteckningar här..."
                  rows={3}
                  className="bg-white"
                />
              </CardContent>
            </Card>
          )}

          {/* Section-specific editor */}
          {renderSectionContent({
            section,
            onChange,
            onInsertText: insertTextAtCursor,
            report,
            template,
            assets,
            onAssetsChange,
          })}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="border-t bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onPrevious} disabled={!hasPrevious}>
            <IconChevronUp className="mr-2 size-4" />
            Föregående
          </Button>
          <div className="text-sm text-muted-foreground">
            {isCompleted
              ? "Sektion markerad som klar"
              : "Fyll i och markera som klar"}
          </div>
          <Button variant="ghost" onClick={onNext} disabled={!hasNext}>
            Nästa
            <IconChevronDown className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Section Content Renderers
// ============================================================================

interface RenderSectionContentProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  onInsertText?: (text: string) => void;
  report?: Report;
  template?: ReportTemplate;
  assets?: ReportAsset[];
  onAssetsChange?: (assets: ReportAsset[]) => void;
}

function renderSectionContent({
  section,
  onChange,
  onInsertText,
  report,
  template,
  assets = [],
  onAssetsChange,
}: RenderSectionContentProps) {
  switch (section.type) {
    case "heading":
      return <HeadingEditor section={section} onChange={onChange} />;
    case "summary":
      return (
        <SummaryEditor
          section={section}
          onChange={onChange}
          onInsertText={onInsertText}
          report={report}
          template={template}
        />
      );
    case "basic_info":
      return (
        <BasicInfoEditor
          section={section}
          onChange={onChange}
          report={report}
        />
      );
    case "checklist":
      return <ChecklistEditor section={section} onChange={onChange} />;
    case "table":
      return <TableEditor section={section} onChange={onChange} />;
    case "signature":
      return <SignatureEditor section={section} onChange={onChange} />;
    case "links":
      return <LinksEditor section={section} onChange={onChange} />;
    case "divider":
      return <DividerEditor />;
    case "image":
    case "image_gallery":
    case "image_annotated":
      return (
        <ImageEditor
          section={section}
          onChange={onChange}
          assets={assets}
          onAssetsChange={onAssetsChange}
        />
      );
    default:
      return (
        <TextEditor
          section={section}
          onChange={onChange}
          onInsertText={onInsertText}
          report={report}
          template={template}
        />
      );
  }
}

// ============================================================================
// Text Editor
// ============================================================================

interface TextEditorProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  onInsertText?: (text: string) => void;
  report?: Report;
  template?: ReportTemplate;
}

function TextEditor({
  section,
  onChange,
  onInsertText,
  report,
  template,
}: TextEditorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Innehåll</CardTitle>
            <CardDescription>
              Skriv rapporttext för denna sektion
            </CardDescription>
          </div>
          {onInsertText && (
            <SnippetPicker
              onInsert={onInsertText}
              trade={template?.trade}
              report={report}
              template={template}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={section.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Skriv ditt innehåll här..."
          rows={12}
          className="min-h-[300px] resize-y"
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Heading Editor
// ============================================================================

function HeadingEditor({
  section,
  onChange,
}: {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rubrik</CardTitle>
        <CardDescription>Kapitelrubrik i rapporten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Rubriktext</Label>
          <Input
            value={section.content || ""}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Ange rubrik..."
            className="text-lg font-semibold mt-1"
          />
        </div>
        <div>
          <Label>Rubriknivå</Label>
          <Select
            value={String(section.headingLevel || 1)}
            onValueChange={(v) =>
              onChange({ headingLevel: Number(v) as 1 | 2 | 3 })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nivå 1 (Huvudrubrik)</SelectItem>
              <SelectItem value="2">Nivå 2 (Underrubrik)</SelectItem>
              <SelectItem value="3">Nivå 3 (Mindre rubrik)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Summary Editor
// ============================================================================

interface SummaryEditorProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  onInsertText?: (text: string) => void;
  report?: Report;
  template?: ReportTemplate;
}

function SummaryEditor({
  section,
  onChange,
  onInsertText,
  report,
  template,
}: SummaryEditorProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-blue-800">
              Sammanfattning
            </CardTitle>
            <CardDescription>
              Kort sammanfattning (TL;DR) av rapporten
            </CardDescription>
          </div>
          {onInsertText && (
            <SnippetPicker
              onInsert={onInsertText}
              trade={template?.trade}
              report={report}
              template={template}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={section.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Skriv en kort sammanfattning..."
          rows={4}
          className="bg-white"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Tips: Håll sammanfattningen kort och koncis, max 3-4 meningar.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Basic Info Editor (Grundinformation)
// ============================================================================

interface BasicInfoEditorProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  report?: Report;
}

function BasicInfoEditor({ section, onChange, report }: BasicInfoEditorProps) {
  // Parse content as JSON or use defaults
  const parseContent = () => {
    try {
      return section.content ? JSON.parse(section.content) : {};
    } catch {
      return {};
    }
  };

  const basicInfo = parseContent();

  // Use report metadata as fallback
  const getValue = (key: string) => {
    if (basicInfo[key]) return basicInfo[key];
    if (report?.metadata) {
      const metadata = report.metadata;
      switch (key) {
        case "client":
          return metadata.client || "";
        case "location":
          return metadata.location || "";
        case "assignedTo":
          return metadata.assignedTo || "";
        case "projectReference":
          return metadata.projectReference || "";
        default:
          return "";
      }
    }
    return "";
  };

  const updateField = (key: string, value: string) => {
    const newInfo = { ...basicInfo, [key]: value };
    onChange({ content: JSON.stringify(newInfo) });
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader>
        <CardTitle className="text-base text-emerald-800">
          Grundinformation
        </CardTitle>
        <CardDescription>Grundläggande uppgifter om rapporten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm">Kund / Företag</Label>
            <Input
              value={getValue("client")}
              onChange={(e) => updateField("client", e.target.value)}
              placeholder="Företagsnamn"
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Adress</Label>
            <Input
              value={getValue("location")}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Gatuadress, stad"
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Kontaktperson</Label>
            <Input
              value={getValue("assignedTo")}
              onChange={(e) => updateField("assignedTo", e.target.value)}
              placeholder="Namn"
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Projektreferens</Label>
            <Input
              value={getValue("projectReference")}
              onChange={(e) => updateField("projectReference", e.target.value)}
              placeholder="Jobb-ID, ordernummer..."
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Datum</Label>
            <Input
              type="date"
              value={getValue("date") || new Date().toISOString().split("T")[0]}
              onChange={(e) => updateField("date", e.target.value)}
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Utredare</Label>
            <Input
              value={getValue("investigator")}
              onChange={(e) => updateField("investigator", e.target.value)}
              placeholder="Namn på utredare"
              className="mt-1 bg-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Checklist Editor
// ============================================================================

function ChecklistEditor({
  section,
  onChange,
}: {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
}) {
  const items = section.checklistData || [];

  const updateItem = (index: number, updates: Partial<ReportChecklistItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index]!, ...updates };
    onChange({ checklistData: newItems });
  };

  const addItem = () => {
    onChange({
      checklistData: [
        ...items,
        { id: crypto.randomUUID(), label: "", completed: false },
      ],
    });
  };

  const removeItem = (index: number) => {
    onChange({ checklistData: items.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Checklista</CardTitle>
        <CardDescription>Bocka av punkter när de är klara</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start gap-3">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) =>
                updateItem(index, { completed: !!checked })
              }
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Input
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                placeholder="Checklistpunkt..."
                className={cn(
                  item.completed && "line-through text-muted-foreground",
                )}
              />
              {item.notes !== undefined && (
                <Input
                  value={item.notes || ""}
                  onChange={(e) => updateItem(index, { notes: e.target.value })}
                  placeholder="Anteckning..."
                  className="text-sm"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="text-destructive"
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addItem} className="w-full">
          <IconPlus className="mr-2 size-4" />
          Lägg till punkt
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Table Editor
// ============================================================================

function TableEditor({
  section,
  onChange,
}: {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
}) {
  const tableData = section.tableData || { columns: [], rows: [] };

  const addColumn = () => {
    onChange({
      tableData: {
        ...tableData,
        columns: [
          ...tableData.columns,
          { id: crypto.randomUUID(), label: "Ny kolumn", type: "text" },
        ],
      },
    });
  };

  const addRow = () => {
    onChange({
      tableData: {
        ...tableData,
        rows: [...tableData.rows, { id: crypto.randomUUID(), values: {} }],
      },
    });
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    onChange({
      tableData: {
        ...tableData,
        rows: tableData.rows.map((row) =>
          row.id === rowId
            ? { ...row, values: { ...row.values, [colId]: value } }
            : row,
        ),
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tabell</CardTitle>
        <CardDescription>Mätvärden och parametrar</CardDescription>
      </CardHeader>
      <CardContent>
        {tableData.columns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ingen tabell skapad ännu
            </p>
            <Button onClick={addColumn}>
              <IconPlus className="mr-2 size-4" />
              Lägg till kolumn
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {tableData.columns.map((col) => (
                      <th
                        key={col.id}
                        className="border px-3 py-2 text-left text-sm font-medium bg-muted"
                      >
                        {col.label}
                        {col.unit && (
                          <span className="text-muted-foreground ml-1">
                            ({col.unit})
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row) => (
                    <tr key={row.id}>
                      {tableData.columns.map((col) => (
                        <td key={col.id} className="border px-1 py-1">
                          <Input
                            value={String(row.values[col.id] || "")}
                            onChange={(e) =>
                              updateCell(row.id, col.id, e.target.value)
                            }
                            className="border-0 h-8"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addColumn}>
                <IconPlus className="mr-2 size-4" />
                Kolumn
              </Button>
              <Button variant="outline" size="sm" onClick={addRow}>
                <IconPlus className="mr-2 size-4" />
                Rad
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Signature Editor
// ============================================================================

function SignatureEditor({
  section,
  onChange,
}: {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
}) {
  const signatures = section.signatures || [];

  const addSignature = () => {
    onChange({
      signatures: [
        ...signatures,
        { name: "", role: "", date: new Date().toISOString().split("T")[0]! },
      ],
    });
  };

  const updateSignature = (index: number, updates: Partial<SignatureData>) => {
    const newSigs = [...signatures];
    newSigs[index] = { ...newSigs[index]!, ...updates };
    onChange({ signatures: newSigs });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signaturer</CardTitle>
        <CardDescription>Signering av rapporten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatures.map((sig, index) => (
          <div key={index} className="grid gap-3 p-4 border rounded-lg">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Namn</Label>
                <Input
                  value={sig.name}
                  onChange={(e) =>
                    updateSignature(index, { name: e.target.value })
                  }
                  placeholder="Fullständigt namn"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Roll</Label>
                <Input
                  value={sig.role}
                  onChange={(e) =>
                    updateSignature(index, { role: e.target.value })
                  }
                  placeholder="T.ex. Projektledare"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={sig.date}
                  onChange={(e) =>
                    updateSignature(index, { date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>E-post (valfritt)</Label>
                <Input
                  type="email"
                  value={sig.email || ""}
                  onChange={(e) =>
                    updateSignature(index, { email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addSignature} className="w-full">
          <IconPlus className="mr-2 size-4" />
          Lägg till signatur
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Links Editor
// ============================================================================

function LinksEditor({
  section,
  onChange,
}: {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
}) {
  const links = section.links || [];

  const addLink = () => {
    onChange({
      links: [
        ...links,
        { id: crypto.randomUUID(), label: "", url: "", type: "external" },
      ],
    });
  };

  const updateLink = (index: number, updates: Partial<LinkItem>) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index]!, ...updates };
    onChange({ links: newLinks });
  };

  const removeLink = (index: number) => {
    onChange({ links: links.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Länkar & bilagor</CardTitle>
        <CardDescription>Referenser och externa dokument</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="flex items-start gap-3 p-3 border rounded-lg"
          >
            <div className="flex-1 grid gap-2 sm:grid-cols-2">
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Länktext"
              />
              <Input
                value={link.url}
                onChange={(e) => updateLink(index, { url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLink(index)}
              className="text-destructive"
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addLink} className="w-full">
          <IconPlus className="mr-2 size-4" />
          Lägg till länk
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Divider Editor
// ============================================================================

function DividerEditor() {
  return (
    <Card>
      <CardContent className="py-8">
        <Separator />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Avdelare - skapar visuell separation i rapporten
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Image Editor
// ============================================================================

interface ImageEditorProps {
  section: ReportSectionInstance;
  onChange: (updates: Partial<ReportSectionInstance>) => void;
  onAssetsChange?: (assets: ReportAsset[]) => void;
  assets?: ReportAsset[];
}

function ImageEditor({
  section,
  onChange,
  onAssetsChange,
  assets = [],
}: ImageEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [annotatingAsset, setAnnotatingAsset] = useState<ReportAsset | null>(
    null,
  );
  const inputId = `image-upload-${section.id}`;
  const sectionType = section.type || "image";
  const maxImages =
    sectionType === "image" ? 1 : sectionType === "image_gallery" ? 10 : 1;

  // Get assets for this section
  const sectionAssets = useMemo(() => {
    if (sectionType === "image_gallery") {
      return assets.filter((a) => section.assetIds?.includes(a.id));
    } else if (section.assetId) {
      const asset = assets.find((a) => a.id === section.assetId);
      return asset ? [asset] : [];
    }
    return [];
  }, [assets, section.assetIds, section.assetId, sectionType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAssetsChange) return;

    const remainingSlots = maxImages - sectionAssets.length;
    if (remainingSlots <= 0) {
      return;
    }

    setUploading(true);

    try {
      const newAssets: ReportAsset[] = [];
      const newAssetIds: string[] = [];

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (!file) continue;

        // Create local URL (in production, upload to Supabase Storage)
        const url = URL.createObjectURL(file);
        const assetId = `asset-${Date.now()}-${i}`;

        const asset: ReportAsset = {
          id: assetId,
          label: file.name,
          url: url,
          capturedAt: new Date().toISOString(),
          capturedBy: "Användare",
          tags: [],
        };

        newAssets.push(asset);
        newAssetIds.push(assetId);
      }

      // Update assets
      onAssetsChange([...assets, ...newAssets]);

      // Update section reference
      if (sectionType === "image_gallery") {
        onChange({
          assetIds: [...(section.assetIds || []), ...newAssetIds],
          status: "completed",
        });
      } else {
        onChange({
          assetId: newAssetIds[0],
          status: "completed",
        });
      }
    } catch (error) {
      console.error("Failed to upload images", error);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    if (!onAssetsChange) return;

    // Remove from assets
    onAssetsChange(assets.filter((a) => a.id !== assetId));

    // Update section reference
    if (sectionType === "image_gallery") {
      const newAssetIds = (section.assetIds || []).filter(
        (id) => id !== assetId,
      );
      onChange({
        assetIds: newAssetIds,
        status: newAssetIds.length > 0 ? "completed" : "pending",
      });
    } else {
      onChange({
        assetId: undefined,
        status: "pending",
      });
    }
  };

  const handleUpdateLabel = (assetId: string, newLabel: string) => {
    if (!onAssetsChange) return;
    onAssetsChange(
      assets.map((a) => (a.id === assetId ? { ...a, label: newLabel } : a)),
    );
  };

  // Handle annotation save
  const handleAnnotationSave = (
    _annotations: Annotation[],
    annotatedImageUrl: string,
  ) => {
    if (!onAssetsChange || !annotatingAsset) return;

    // Update the asset with the annotated image URL
    onAssetsChange(
      assets.map((a) =>
        a.id === annotatingAsset.id
          ? {
              ...a,
              url: annotatedImageUrl,
              tags: [...(a.tags || []), "annotated"],
            }
          : a,
      ),
    );
    setAnnotatingAsset(null);
  };

  const title =
    sectionType === "image_gallery"
      ? "Bildgalleri"
      : sectionType === "image_annotated"
        ? "Annoterad bild"
        : "Bild";

  const description =
    sectionType === "image_gallery"
      ? `Ladda upp upp till ${maxImages} bilder`
      : sectionType === "image_annotated"
        ? "Ladda upp en bild och lägg till markeringar"
        : "Ladda upp en bild";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {sectionAssets.length < maxImages && (
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <IconPhoto className="mr-2 size-4" />
              {uploading ? "Laddar upp..." : "Lägg till bild"}
            </Button>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple={sectionType === "image_gallery"}
          className="hidden"
          onChange={handleFileUpload}
        />
      </CardHeader>
      <CardContent>
        {sectionAssets.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <IconPhoto className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Klicka för att välja{" "}
              {sectionType === "image_gallery" ? "bilder" : "en bild"}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              sectionType === "image_gallery"
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "",
            )}
          >
            {sectionAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-lg border bg-muted/30"
              >
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={asset.url}
                    alt={asset.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Action buttons */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setAnnotatingAsset(asset)}
                    className="rounded-full bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                    title="Annotera bild"
                  >
                    <IconEdit className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset(asset.id)}
                    className="rounded-full bg-destructive p-1.5 text-destructive-foreground"
                    title="Ta bort bild"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                {/* Annotated badge */}
                {asset.tags?.includes("annotated") && (
                  <div className="absolute left-2 top-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 text-xs"
                    >
                      Annoterad
                    </Badge>
                  </div>
                )}
                <div className="p-3">
                  <Input
                    value={asset.label}
                    onChange={(e) =>
                      handleUpdateLabel(asset.id, e.target.value)
                    }
                    placeholder="Bildtext..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Caption/description for the section */}
        <div className="mt-4">
          <Label className="text-sm">Sektionsbeskrivning</Label>
          <Textarea
            value={section.content || ""}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Övergripande beskrivning av bilderna..."
            rows={2}
            className="mt-1"
          />
        </div>
      </CardContent>

      {/* Image Annotator Dialog */}
      {annotatingAsset && (
        <ImageAnnotator
          open={!!annotatingAsset}
          onOpenChange={(open) => !open && setAnnotatingAsset(null)}
          imageUrl={annotatingAsset.url}
          onSave={handleAnnotationSave}
        />
      )}
    </Card>
  );
}

export default SectionEditor;
