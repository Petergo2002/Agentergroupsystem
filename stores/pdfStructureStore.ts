/**
 * PDF Structure Store - Zustand store för PDF-strukturhantering
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PDFStructure,
  PDFSection,
  PDFStyling,
} from '@/lib/types/pdf-structure';
import {
  DEFAULT_PDF_STYLING,
  DEFAULT_PDF_SECTIONS,
} from '@/lib/types/pdf-structure';

interface PDFStructureStore {
  // State
  structures: PDFStructure[];
  activeStructureId: string | null;
  
  // Getters
  getActiveStructure: () => PDFStructure | null;
  
  // Actions
  createStructure: (name: string, description?: string) => PDFStructure;
  setActiveStructure: (id: string) => void;
  updateStructure: (id: string, updates: Partial<PDFStructure>) => void;
  deleteStructure: (id: string) => void;
  
  // Section actions
  updateSection: (structureId: string, sectionId: string, updates: Partial<PDFSection>) => void;
  reorderSections: (structureId: string, fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (structureId: string, sectionId: string) => void;
  
  // Styling actions
  updateStyling: (structureId: string, updates: Partial<PDFStyling>) => void;
  
  // Reset
  resetToDefault: () => void;
}

// Create default structure
function createDefaultStructure(name: string, description?: string): PDFStructure {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    description,
    sections: DEFAULT_PDF_SECTIONS.map((section, index) => ({
      ...section,
      id: crypto.randomUUID(),
      order: index,
    })),
    styling: DEFAULT_PDF_STYLING,
    createdAt: now,
    updatedAt: now,
  };
}

export const usePdfStructureStore = create<PDFStructureStore>()(
  persist(
    (set, get) => ({
      // Initial state
      structures: [createDefaultStructure('Standard läckagerapport', 'Standard mall för läckagerapporter')],
      activeStructureId: null,
      
      // Getters
      getActiveStructure: () => {
        const { structures, activeStructureId } = get();
        if (!activeStructureId) {
          // Om ingen aktiv, använd första strukturen
          const first = structures[0];
          if (first) {
            set({ activeStructureId: first.id });
            return first;
          }
          return null;
        }
        return structures.find(s => s.id === activeStructureId) || null;
      },
      
      // Actions
      createStructure: (name, description) => {
        const newStructure = createDefaultStructure(name, description);
        set(state => ({
          structures: [...state.structures, newStructure],
          activeStructureId: newStructure.id,
        }));
        return newStructure;
      },
      
      setActiveStructure: (id) => {
        set({ activeStructureId: id });
      },
      
      updateStructure: (id, updates) => {
        set(state => ({
          structures: state.structures.map(s =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },
      
      deleteStructure: (id) => {
        set(state => {
          const newStructures = state.structures.filter(s => s.id !== id);
          const newActiveId = state.activeStructureId === id
            ? (newStructures[0]?.id || null)
            : state.activeStructureId;
          return {
            structures: newStructures,
            activeStructureId: newActiveId,
          };
        });
      },
      
      // Section actions
      updateSection: (structureId, sectionId, updates) => {
        set(state => ({
          structures: state.structures.map(structure =>
            structure.id === structureId
              ? {
                  ...structure,
                  sections: structure.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, ...updates }
                      : section
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : structure
          ),
        }));
      },
      
      reorderSections: (structureId, fromIndex, toIndex) => {
        set(state => ({
          structures: state.structures.map(structure => {
            if (structure.id !== structureId) return structure;
            
            const sections = [...structure.sections];
            const [movedSection] = sections.splice(fromIndex, 1);
            if (!movedSection) return structure; // Guard against undefined
            
            sections.splice(toIndex, 0, movedSection);
            
            // Update order property
            const reorderedSections = sections.map((section, index) => ({
              ...section,
              order: index,
            }));
            
            return {
              ...structure,
              sections: reorderedSections,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      
      toggleSectionVisibility: (structureId, sectionId) => {
        set(state => ({
          structures: state.structures.map(structure =>
            structure.id === structureId
              ? {
                  ...structure,
                  sections: structure.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, visible: !section.visible }
                      : section
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : structure
          ),
        }));
      },
      
      // Styling actions
      updateStyling: (structureId, updates) => {
        set(state => ({
          structures: state.structures.map(structure =>
            structure.id === structureId
              ? {
                  ...structure,
                  styling: { ...structure.styling, ...updates },
                  updatedAt: new Date().toISOString(),
                }
              : structure
          ),
        }));
      },
      
      // Reset
      resetToDefault: () => {
        set({
          structures: [createDefaultStructure('Standard läckagerapport', 'Standard mall för läckagerapporter')],
          activeStructureId: null,
        });
      },
    }),
    {
      name: 'pdf-structure-store',
    }
  )
);
