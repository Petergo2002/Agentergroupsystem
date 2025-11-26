"use client";

/**
 * PDF Structure Builder - Visuellt verktyg för att designa PDF-layout
 */

import React, { useState } from 'react';
import { usePdfStructureStore } from '@/stores/pdfStructureStore';
import { PDF_SECTION_METADATA } from '@/lib/types/pdf-structure';
import type { PDFSection, PDFSectionType } from '@/lib/types/pdf-structure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  IconGripVertical,
  IconEye,
  IconEyeOff,
  IconSettings,
  IconTrash,
  IconPlus,
  IconDownload,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function PDFStructureBuilder() {
  const {
    structures,
    activeStructureId,
    setActiveStructure,
    updateSection,
    toggleSectionVisibility,
    reorderSections,
    updateStyling,
  } = usePdfStructureStore();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  console.log('PDFStructureBuilder render:', { 
    structuresCount: structures?.length, 
    activeStructureId,
    hasStructures: structures && structures.length > 0 
  });

  // Sätt första strukturen som aktiv om ingen är vald
  React.useEffect(() => {
    if (!activeStructureId && structures.length > 0 && structures[0]) {
      console.log('Setting first structure as active:', structures[0].id);
      setActiveStructure(structures[0].id);
    }
  }, [activeStructureId, structures, setActiveStructure]);

  const activeStructure = structures.find(s => s.id === activeStructureId) || structures[0];

  console.log('Active structure:', activeStructure ? 'Found' : 'Not found');

  if (!activeStructure) {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Ingen PDF-struktur hittades</p>
          <p className="text-xs text-muted-foreground">Structures: {structures?.length || 0}</p>
        </div>
      </div>
    );
  }

  const selectedSection = activeStructure.sections.find(s => s.id === selectedSectionId);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    reorderSections(activeStructure.id, draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!activeStructure) {
      toast.error('Ingen aktiv PDF-struktur');
      return;
    }

    setIsSaving(true);
    try {
      // Zustand persist middleware sparar automatiskt till localStorage
      // Men vi triggar en explicit uppdatering för att säkerställa att allt sparas
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setHasUnsavedChanges(false);
      toast.success('PDF-struktur sparad!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kunde inte spara ändringar');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!activeStructure) {
      toast.error('Ingen aktiv PDF-struktur');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      // Skapa testdata för förhandsgranskning
      const previewData = {
        mottagare: 'Test Kund AB',
        foretag: 'Test Kund AB',
        adress: 'Testgatan 123, 123 45 Stockholm',
        utredare: 'Test Utredare',
        datum: new Date().toISOString().split('T')[0],
        bakgrund: 'Detta är en förhandsgranskning av PDF-strukturen. Här visas hur rapporten kommer att se ut med den valda layouten och styling.',
        matmetoder: 'Testmetoder används för förhandsgranskning.',
        slutsats: 'Detta är en testrapport för att visa PDF-strukturen.',
        images: [],
      };

      const response = await fetch('/api/reports/preview/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        // Öppna PDF i ny flik
        window.open(url, '_blank');
        toast.success('PDF-förhandsgranskning öppnad');
      } else {
        const error = await response.json().catch(() => ({ error: 'Okänt fel' }));
        toast.error(`Kunde inte generera PDF: ${error.error || 'Okänt fel'}`);
      }
    } catch (error) {
      console.error('PDF preview error:', error);
      toast.error('Kunde inte generera PDF-förhandsgranskning');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
    <div className="w-full h-full p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vänster panel: Aktiv struktur */}
        <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>PDF-struktur</CardTitle>
            <CardDescription>
              Dra och släpp för att ändra ordning. Klicka för att konfigurera.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStructure.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => {
                const metadata = PDF_SECTION_METADATA[section.type];
                const isSelected = selectedSectionId === section.id;
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move",
                      isSelected && "border-primary bg-primary/5",
                      isDragging && "opacity-50",
                      !section.visible && "opacity-60"
                    )}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <IconGripVertical className="size-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-2xl flex-shrink-0">{metadata.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{section.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {metadata.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionVisibility(activeStructure.id, section.id);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      {section.visible ? (
                        <IconEye className="size-4" />
                      ) : (
                        <IconEyeOff className="size-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Styling-inställningar */}
        <Card>
          <CardHeader>
            <CardTitle>Styling</CardTitle>
            <CardDescription>Anpassa färger och typografi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Färger */}
            <div className="space-y-4">
              <h4 className="font-medium">Färger</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primärfärg</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={activeStructure.styling.colors.primary}
                      onChange={(e) => {
                        updateStyling(activeStructure.id, {
                          colors: {
                            ...activeStructure.styling.colors,
                            primary: e.target.value,
                          },
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={activeStructure.styling.colors.primary}
                      onChange={(e) => {
                        updateStyling(activeStructure.id, {
                          colors: {
                            ...activeStructure.styling.colors,
                            primary: e.target.value,
                          },
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accentfärg</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={activeStructure.styling.colors.accent}
                      onChange={(e) => {
                        updateStyling(activeStructure.id, {
                          colors: {
                            ...activeStructure.styling.colors,
                            accent: e.target.value,
                          },
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={activeStructure.styling.colors.accent}
                      onChange={(e) => {
                        updateStyling(activeStructure.id, {
                          colors: {
                            ...activeStructure.styling.colors,
                            accent: e.target.value,
                          },
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typografi */}
            <div className="space-y-4">
              <h4 className="font-medium">Typografi</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Rubrik-storlek (H1)</Label>
                    <span className="text-sm text-muted-foreground">
                      {activeStructure.styling.typography.h1Size}pt
                    </span>
                  </div>
                  <Slider
                    value={[activeStructure.styling.typography.h1Size]}
                    onValueChange={(values: number[]) => {
                      updateStyling(activeStructure.id, {
                        typography: {
                          ...activeStructure.styling.typography,
                          h1Size: values[0] ?? 28,
                        },
                      });
                      setHasUnsavedChanges(true);
                    }}
                    min={20}
                    max={40}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Sektion-storlek (H2)</Label>
                    <span className="text-sm text-muted-foreground">
                      {activeStructure.styling.typography.h2Size}pt
                    </span>
                  </div>
                  <Slider
                    value={[activeStructure.styling.typography.h2Size]}
                    onValueChange={(values: number[]) => {
                      updateStyling(activeStructure.id, {
                        typography: {
                          ...activeStructure.styling.typography,
                          h2Size: values[0] ?? 18,
                        },
                      });
                      setHasUnsavedChanges(true);
                    }}
                    min={12}
                    max={24}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Brödtext-storlek</Label>
                    <span className="text-sm text-muted-foreground">
                      {activeStructure.styling.typography.bodySize}pt
                    </span>
                  </div>
                  <Slider
                    value={[activeStructure.styling.typography.bodySize]}
                    onValueChange={(values: number[]) => {
                      updateStyling(activeStructure.id, {
                        typography: {
                          ...activeStructure.styling.typography,
                          bodySize: values[0] ?? 11,
                        },
                      });
                      setHasUnsavedChanges(true);
                    }}
                    min={8}
                    max={14}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Höger panel: Sektionskonfiguration */}
      <div className="space-y-4">
        {selectedSection ? (
          <Card>
            <CardHeader>
              <CardTitle>Konfigurera sektion</CardTitle>
              <CardDescription>
                {PDF_SECTION_METADATA[selectedSection.type].label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={selectedSection.title}
                  onChange={(e) => {
                    updateSection(activeStructure.id, selectedSection.id, {
                      title: e.target.value,
                    });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Synlig</Label>
                <Switch
                  checked={selectedSection.visible}
                  onCheckedChange={(checked: boolean) => {
                    updateSection(activeStructure.id, selectedSection.id, {
                      visible: checked,
                    });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Visa endast om data finns</Label>
                <Switch
                  checked={selectedSection.config.showOnlyIfData || false}
                  onCheckedChange={(checked: boolean) => {
                    updateSection(activeStructure.id, selectedSection.id, {
                      config: {
                        ...selectedSection.config,
                        showOnlyIfData: checked,
                      },
                    });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Sidbrytning före</Label>
                <Switch
                  checked={selectedSection.config.pageBreakBefore || false}
                  onCheckedChange={(checked: boolean) => {
                    updateSection(activeStructure.id, selectedSection.id, {
                      config: {
                        ...selectedSection.config,
                        pageBreakBefore: checked,
                      },
                    });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Spacing</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedSection.config.spacing || 30}px
                  </span>
                </div>
                <Slider
                  value={[selectedSection.config.spacing || 30]}
                  onValueChange={(values: number[]) =>
                    updateSection(activeStructure.id, selectedSection.id, {
                      config: {
                        ...selectedSection.config,
                        spacing: values[0] ?? 30,
                      },
                    })
                  }
                  min={0}
                  max={60}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground text-center">
                Välj en sektion för att konfigurera
              </p>
            </CardContent>
          </Card>
        )}

        {/* Spara och Preview knappar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                variant={hasUnsavedChanges ? "default" : "outline"}
              >
                <IconDeviceFloppy className="mr-2 size-4" />
                {isSaving ? 'Sparar...' : hasUnsavedChanges ? 'Spara ändringar' : 'Allt sparat'}
              </Button>
              {hasUnsavedChanges && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Du har osparade ändringar
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={handlePreviewPdf}
                disabled={isGeneratingPreview}
              >
                <IconEye className="mr-2 size-4" />
                {isGeneratingPreview ? 'Genererar...' : 'Förhandsgranska PDF'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
