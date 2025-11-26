"use client";

import {
  IconChevronDown,
  IconFileText,
  IconSearch,
  IconSparkles,
  IconVariable,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSnippetsByCategory,
  getVariablesByCategory,
  renderTemplatePreview,
  type TextSnippet,
  type TemplateVariable,
  type TemplateContext,
} from "@/lib/rapport/templateEngine";
import type { Report, ReportTemplate } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SnippetPickerProps {
  onInsert: (text: string) => void;
  trade?: string;
  report?: Report;
  template?: ReportTemplate;
  className?: string;
}

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  className?: string;
}

// ============================================================================
// Category Labels
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  intro: "Introduktion",
  summary: "Sammanfattning",
  method: "Metod",
  scope: "Omfattning",
  conclusion: "Slutsats",
  safety: "Säkerhet",
  disclaimer: "Ansvarsfriskrivning",
  contact: "Kontakt",
  report: "Rapport",
  metadata: "Metadata",
  date: "Datum",
  template: "Mall",
  custom: "Anpassade",
};

// ============================================================================
// Snippet Picker
// ============================================================================

export function SnippetPicker({
  onInsert,
  trade,
  report,
  template,
  className,
}: SnippetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("snippets");

  // Get snippets and variables
  const snippetsByCategory = useMemo(() => getSnippetsByCategory(trade), [trade]);
  const variablesByCategory = useMemo(() => getVariablesByCategory(), []);

  // Template context for preview
  const context: TemplateContext = useMemo(
    () => ({
      report,
      template,
    }),
    [report, template]
  );

  // Filter snippets by search
  const filteredSnippets = useMemo(() => {
    if (!search.trim()) return snippetsByCategory;

    const needle = search.toLowerCase();
    const filtered: Record<string, TextSnippet[]> = {};

    for (const [category, snippets] of Object.entries(snippetsByCategory)) {
      const matches = snippets.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          s.content.toLowerCase().includes(needle) ||
          s.description?.toLowerCase().includes(needle)
      );
      if (matches.length > 0) {
        filtered[category] = matches;
      }
    }

    return filtered;
  }, [snippetsByCategory, search]);

  // Filter variables by search
  const filteredVariables = useMemo(() => {
    if (!search.trim()) return variablesByCategory;

    const needle = search.toLowerCase();
    const filtered: Record<string, TemplateVariable[]> = {};

    for (const [category, variables] of Object.entries(variablesByCategory)) {
      const matches = variables.filter(
        (v) =>
          v.key.toLowerCase().includes(needle) ||
          v.label.toLowerCase().includes(needle) ||
          v.description.toLowerCase().includes(needle)
      );
      if (matches.length > 0) {
        filtered[category] = matches;
      }
    }

    return filtered;
  }, [variablesByCategory, search]);

  const handleInsertSnippet = (snippet: TextSnippet) => {
    // Render snippet with variables if we have context
    const renderedContent = report
      ? renderTemplatePreview(snippet.content, context)
      : snippet.content;
    onInsert(renderedContent);
    setOpen(false);
    setSearch("");
  };

  const handleInsertVariable = (variable: TemplateVariable) => {
    onInsert(`{{${variable.key}}}`);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <IconSparkles className="size-4" />
          Infoga text
          <IconChevronDown className="size-3 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Infoga text eller variabel</DialogTitle>
          <DialogDescription>
            Välj ett textblock eller en variabel att infoga i sektionen
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök textblock eller variabel..."
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="snippets" className="gap-2">
              <IconFileText className="size-4" />
              Textblock
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-2">
              <IconVariable className="size-4" />
              Variabler
            </TabsTrigger>
          </TabsList>

          {/* Snippets Tab */}
          <TabsContent value="snippets" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(filteredSnippets).map(([category, snippets]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <div className="space-y-2">
                      {snippets.map((snippet) => (
                        <button
                          key={snippet.id}
                          onClick={() => handleInsertSnippet(snippet)}
                          className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{snippet.title}</p>
                              {snippet.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {snippet.description}
                                </p>
                              )}
                            </div>
                            {snippet.trade && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {snippet.trade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {renderTemplatePreview(snippet.content, context)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(filteredSnippets).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Inga textblock hittades
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(filteredVariables).map(([category, variables]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.key}
                          onClick={() => handleInsertVariable(variable)}
                          className="text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {`{{${variable.key}}}`}
                            </code>
                          </div>
                          <p className="font-medium text-sm mt-1">{variable.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {variable.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Exempel: <span className="italic">{variable.example}</span>
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(filteredVariables).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Inga variabler hittades
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Quick Variable Picker (Dropdown)
// ============================================================================

export function QuickVariablePicker({ onInsert, className }: VariablePickerProps) {
  const variablesByCategory = useMemo(() => getVariablesByCategory(), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1 h-7 px-2", className)}>
          <IconVariable className="size-3.5" />
          <IconChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Infoga variabel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(variablesByCategory).map(([category, variables]) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {CATEGORY_LABELS[category] || category}
            </DropdownMenuLabel>
            {variables.slice(0, 4).map((variable) => (
              <DropdownMenuItem
                key={variable.key}
                onClick={() => onInsert(`{{${variable.key}}}`)}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{variable.label}</span>
                <code className="text-xs bg-muted px-1 rounded">{`{{${variable.key}}}`}</code>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SnippetPicker;
