"use client";

/**
 * Template List Component
 * 
 * Visar alla mallar i en snygg lista med kort.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  IconPlus, 
  IconDotsVertical, 
  IconPencil, 
  IconCopy, 
  IconTrash,
  IconFileText,
  IconDroplet,
  IconHammer,
  IconBolt,
  IconSearch,
} from "@tabler/icons-react";
import { useSimpleReportStore } from "@/stores/simpleReportStore";
import type { SimpleReportTemplate, ReportTrade } from "@/lib/types/rapport";

// Trade icons och färger
const TRADE_CONFIG: Record<ReportTrade, { icon: typeof IconFileText; color: string; label: string }> = {
  läckage: { icon: IconDroplet, color: "bg-emerald-500", label: "Läckage" },
  bygg: { icon: IconHammer, color: "bg-orange-500", label: "Bygg" },
  elektriker: { icon: IconBolt, color: "bg-yellow-500", label: "Elektriker" },
};

interface TemplateListProps {
  onCreateNew: () => void;
  onSelect: (id: string) => void;
}

export function TemplateList({ onCreateNew, onSelect }: TemplateListProps) {
  const { templates, activeTemplateId, deleteTemplate, duplicateTemplate } = useSimpleReportStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Filtrera mallar baserat på sökning
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      setTemplateToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Rapportmallar</h2>
            <p className="text-sm text-gray-400">{templates.length} mallar</p>
          </div>
          <Button onClick={onCreateNew} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <IconPlus className="w-4 h-4 mr-2" />
            Ny mall
          </Button>
        </div>

        {/* Sökfält */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sök mallar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {/* Mall-lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <IconFileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Inga mallar hittades</p>
            <Button onClick={onCreateNew} variant="outline" size="sm" className="mt-4">
              Skapa din första mall
            </Button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={template.id === activeTemplateId}
              onSelect={() => onSelect(template.id)}
              onDuplicate={() => duplicateTemplate(template.id)}
              onDelete={() => handleDelete(template.id)}
            />
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort mall?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Mallen kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Template Card
// ============================================================================

interface TemplateCardProps {
  template: SimpleReportTemplate;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, isActive, onSelect, onDuplicate, onDelete }: TemplateCardProps) {
  const config = TRADE_CONFIG[template.trade];
  const Icon = config.icon;

  const textSections = template.sections.filter((s) => s.type === "text").length;
  const imageSections = template.sections.filter((s) => s.type === "images").length;

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 border
        ${isActive 
          ? "bg-white/10 border-emerald-500/50 ring-1 ring-emerald-500/30" 
          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
        }
      `}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Trade Icon */}
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-400 truncate mt-0.5">{template.description}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-white/10 text-gray-300 text-xs">
                  {template.sections.length} sektioner
                </Badge>
                <span className="text-xs text-gray-500">
                  {textSections} text • {imageSections} bilder
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <IconDotsVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <IconPencil className="w-4 h-4 mr-2" />
                Redigera
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <IconCopy className="w-4 h-4 mr-2" />
                Duplicera
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-400 focus:text-red-400"
              >
                <IconTrash className="w-4 h-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default TemplateList;
