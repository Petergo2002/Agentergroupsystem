"use client";

/**
 * Rapport Settings Simple
 * 
 * Förenklad inställningssida för användare.
 * Visar mallar från Report Studio (synkade via Supabase).
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  IconTrash,
  IconPencil,
  IconFileText,
  IconPhoto,
  IconLoader2,
  IconRefresh,
  IconDroplet,
  IconHammer,
  IconBolt,
} from "@tabler/icons-react";
import {
  createReportSectionRecord,
  deleteReportSectionRecord,
  fetchReportSections,
  useReportSectionsStore,
} from "@/lib/store";
import { useSimpleReportStore } from "@/stores/simpleReportStore";
import type { ReportSectionDefinition, ReportSectionType, SimpleReportTemplate } from "@/lib/types/rapport";

// Förenklade sektionstyper - endast 2
const SECTION_TYPES = [
  { value: "text" as ReportSectionType, label: "Rubrik + Text", icon: IconFileText, description: "Rubrik med fritext" },
  { value: "image_gallery" as ReportSectionType, label: "Bilder", icon: IconPhoto, description: "Bildgalleri med annoteringar" },
];

// Bransch-konfiguration
const TRADE_CONFIG = {
  bygg: { label: "Bygg", icon: IconHammer, color: "text-orange-600 bg-orange-100" },
  läckage: { label: "Läckage", icon: IconDroplet, color: "text-blue-600 bg-blue-100" },
  elektriker: { label: "Elektriker", icon: IconBolt, color: "text-yellow-600 bg-yellow-100" },
};

export function RapportSettingsSimple() {
  const { sections, setSections, loading, setLoading, initialized } = useReportSectionsStore();
  const { 
    templates, 
    fetchTemplates, 
    loading: templatesLoading, 
    initialized: templatesInitialized 
  } = useSimpleReportStore();
  
  const [activeTab, setActiveTab] = useState("templates");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    type: "text" as ReportSectionType,
  });

  // Load templates from Report Studio
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Load sections
  useEffect(() => {
    if (initialized) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchReportSections();
        if (active) setSections(data);
      } catch (error) {
        console.error("Failed to load sections:", error);
        toast.error("Kunde inte ladda sektioner");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [initialized, setSections, setLoading]);

  // Refresh templates
  const handleRefreshTemplates = () => {
    useSimpleReportStore.setState({ initialized: false });
    fetchTemplates();
  };

  // Create section
  const handleCreateSection = async () => {
    if (!newSection.title.trim()) {
      toast.error("Titel krävs");
      return;
    }

    setSaving(true);
    try {
      const created = await createReportSectionRecord({
        title: newSection.title.trim(),
        description: newSection.description.trim() || undefined,
        type: newSection.type,
        order: sections.length + 1,
      });
      setSections([...sections, created]);
      toast.success("Sektion skapad");
      setCreateDialogOpen(false);
      setNewSection({ title: "", description: "", type: "text" });
    } catch (error) {
      console.error("Failed to create section:", error);
      toast.error("Kunde inte skapa sektion");
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      await deleteReportSectionRecord(sectionToDelete);
      setSections(sections.filter((s) => s.id !== sectionToDelete));
      toast.success("Sektion borttagen");
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast.error("Kunde inte ta bort sektion");
    } finally {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setSectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading && templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Rapportinställningar</h2>
        <p className="text-sm text-muted-foreground">
          Mallar och sektioner för dina rapporter
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="templates" className="gap-2">
            <IconFileText className="w-4 h-4" />
            Mallar ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <IconPhoto className="w-4 h-4" />
            Sektioner ({sections.length})
          </TabsTrigger>
        </TabsList>

        {/* Mallar Tab */}
        <TabsContent value="templates">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Tillgängliga mallar</h3>
              <p className="text-sm text-muted-foreground">
                Mallar skapas i Admin → Report Studio
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshTemplates}
              disabled={templatesLoading}
            >
              <IconRefresh className={`w-4 h-4 mr-2 ${templatesLoading ? "animate-spin" : ""}`} />
              Uppdatera
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <IconFileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Inga mallar tillgängliga</p>
                <p className="text-sm text-muted-foreground">
                  Kontakta administratören för att skapa mallar i Report Studio
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sektioner Tab */}
        <TabsContent value="sections">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Egna sektioner</h3>
              <p className="text-sm text-muted-foreground">
                Skapa och hantera sektioner som kan användas i rapporter
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <IconPlus className="w-4 h-4 mr-2" />
              Ny sektion
            </Button>
          </div>

          {sections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <IconFileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Inga sektioner ännu</p>
                <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                  Skapa din första sektion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onDelete={() => confirmDelete(section.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Mallar skapas av administratörer i Report Studio och synkas automatiskt hit</li>
            <li>Varje mall innehåller fördefinierade sektioner som fylls i när du skapar en rapport</li>
            <li>Grundinformation (kund, adress, etc.) fylls i automatiskt i första sektionen</li>
          </ul>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny sektion</DialogTitle>
            <DialogDescription>
              Välj typ och ge sektionen ett namn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              {SECTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = newSection.type === type.value;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setNewSection({ ...newSection, type: type.value })}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Title */}
            <div>
              <Label>Titel *</Label>
              <Input
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                placeholder="T.ex. Inledning, Dokumentation..."
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Beskrivning (valfritt)</Label>
              <Textarea
                value={newSection.description}
                onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                placeholder="Hjälptext för användaren..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateSection} disabled={saving || !newSection.title.trim()}>
              {saving && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
              Skapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort sektion?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Sektionen kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Section Card
// ============================================================================

interface SectionCardProps {
  section: ReportSectionDefinition;
  onDelete: () => void;
}

function SectionCard({ section, onDelete }: SectionCardProps) {
  const isText = section.type === "text" || section.type === "heading" || section.type === "summary";
  const Icon = isText ? IconFileText : IconPhoto;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${isText ? "bg-blue-100" : "bg-purple-100"}`}>
            <Icon className={`w-5 h-5 ${isText ? "text-blue-600" : "text-purple-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{section.title}</span>
              <Badge variant="secondary" className="text-xs">
                {isText ? "Text" : "Bilder"}
              </Badge>
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground truncate">{section.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <IconTrash className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Template Card (visar mallar från Report Studio)
// ============================================================================

interface TemplateCardProps {
  template: SimpleReportTemplate;
}

function TemplateCard({ template }: TemplateCardProps) {
  const tradeConfig = TRADE_CONFIG[template.trade as keyof typeof TRADE_CONFIG] || TRADE_CONFIG.bygg;
  const TradeIcon = tradeConfig.icon;
  
  const textSections = template.sections.filter(s => s.type === "text").length;
  const imageSections = template.sections.filter(s => s.type === "images").length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${tradeConfig.color}`}>
            <TradeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{template.name}</span>
              <Badge variant="outline" className="text-xs">
                {tradeConfig.label}
              </Badge>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconFileText className="w-3.5 h-3.5" />
                {textSections} textsektioner
              </span>
              <span className="flex items-center gap-1">
                <IconPhoto className="w-3.5 h-3.5" />
                {imageSections} bildsektioner
              </span>
            </div>
          </div>
        </div>
        
        {/* Sektionslista */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Sektioner:</p>
          <div className="flex flex-wrap gap-1">
            {template.sections.slice(0, 6).map((section, index) => (
              <Badge 
                key={section.id} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                {index + 1}. {section.title}
              </Badge>
            ))}
            {template.sections.length > 6 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{template.sections.length - 6} till
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RapportSettingsSimple;
