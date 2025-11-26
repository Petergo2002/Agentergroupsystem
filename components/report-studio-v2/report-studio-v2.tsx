"use client";

/**
 * Report Studio v2
 * 
 * Förenklat mallsystem med endast 2 sektionstyper:
 * - Text (rubrik + fritext)
 * - Bilder (galleri med annoteringar)
 * 
 * Synkar med Supabase för att dela mallar med User Dashboard.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  IconFileText, 
  IconEye, 
  IconSettings,
  IconArrowLeft,
  IconLoader2,
  IconRefresh,
  IconPalette,
} from "@tabler/icons-react";
import { useSimpleReportStore } from "@/stores/simpleReportStore";
import { TemplateList } from "./template-list";
import { TemplateEditor } from "./template-editor";
import { PdfDesigner } from "./pdf-designer";
import { DesignsManager } from "./designs-manager";
import { CreateTemplateDialog } from "./create-template-dialog";

type View = "list" | "editor";

interface ReportStudioV2Props {
  /** Hide the PDF Designs tab (for user dashboard - designs are admin-only) */
  hideDesignsTab?: boolean;
}

export function ReportStudioV2({ hideDesignsTab = false }: ReportStudioV2Props) {
  const { 
    activeTemplateId, 
    setActiveTemplate, 
    fetchTemplates, 
    loading, 
    initialized,
    saving,
  } = useSimpleReportStore();
  const [view, setView] = useState<View>("list");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "designs">("editor");

  // Ladda mallar vid mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // När en mall väljs, gå till editor
  const handleSelectTemplate = (id: string) => {
    setActiveTemplate(id);
    setView("editor");
  };

  // Gå tillbaka till listan
  const handleBack = () => {
    setActiveTemplate(null);
    setView("list");
    setActiveTab("editor"); // Reset tab to editor when going back
  };

  // Skapa ny mall
  const handleCreateNew = () => {
    setCreateDialogOpen(true);
  };

  // När mall skapas, gå till editor
  const handleTemplateCreated = () => {
    setCreateDialogOpen(false);
    setView("editor");
  };

  // Ladda om mallar
  const handleRefresh = () => {
    useSimpleReportStore.setState({ initialized: false });
    fetchTemplates();
  };

  // Loading state
  if (loading && !initialized) {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0a]">
        <header className="border-b border-white/10 bg-[#111111]">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold text-white">Report Studio</h1>
              <p className="text-sm text-gray-400">Skapa och hantera rapportmallar</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <IconLoader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar mallar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#111111]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {view === "editor" && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <IconArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">Report Studio</h1>
              <p className="text-sm text-gray-400">
                Skapa och hantera rapportmallar
                {saving && <span className="ml-2 text-emerald-400">• Sparar...</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === "list" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <IconFileText className="w-4 h-4 mr-2" />
                  Ny mall
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      {view === "list" ? (
        <div className="flex-1 overflow-hidden">
          <TemplateList 
            onCreateNew={handleCreateNew}
            onSelect={handleSelectTemplate}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as "editor" | "preview" | "designs")}
            className="h-full flex flex-col"
          >
            <div className="border-b border-white/10 px-6 bg-[#111111]">
              <TabsList className="bg-transparent h-12">
                <TabsTrigger 
                  value="editor" 
                  className="data-[state=active]:bg-white/10 gap-2"
                >
                  <IconSettings className="w-4 h-4" />
                  Redigera
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="data-[state=active]:bg-white/10 gap-2"
                >
                  <IconEye className="w-4 h-4" />
                  Förhandsvisning & PDF
                </TabsTrigger>
                {!hideDesignsTab && (
                  <TabsTrigger 
                    value="designs" 
                    className="data-[state=active]:bg-white/10 gap-2"
                  >
                    <IconPalette className="w-4 h-4" />
                    PDF Designs
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
              <TemplateEditor onBack={handleBack} />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <PdfDesigner />
            </TabsContent>

            {!hideDesignsTab && (
              <TabsContent value="designs" className="flex-1 m-0 overflow-hidden">
                <DesignsManager />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Create Dialog */}
      <CreateTemplateDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onCreated={handleTemplateCreated}
      />
    </div>
  );
}

export default ReportStudioV2;
