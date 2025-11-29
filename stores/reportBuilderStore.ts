import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { resolveTemplateText } from "@/lib/report-templates/resolveTemplateText";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  ReportFormData,
  ReportTemplate,
  TemplateBindings,
} from "@/lib/types/report-builder";

interface ReportBuilderStore {
  // State
  currentStep: number;
  formData: Partial<ReportFormData>;
  templates: ReportTemplate[];
  templateBindings: TemplateBindings | null;
  lastSaved: string | null;
  hasDraft: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<ReportFormData>) => void;
  setTemplates: (templates: ReportTemplate[]) => void;
  applyTemplate: (template: ReportTemplate) => void;
  saveReport: () => Promise<void>;
  loadDraft: () => void;
  clearDraft: () => void;
  resetBuilder: () => void;
  canProceed: (step: number) => boolean;
}

// Helper: Hämta userId för persistent storage
const getUserId = async () => {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || "anonymous";
};

// Skapa användar-specifik storage
const createUserStorage = () => {
  let storageKey = "report-builder-storage-anonymous";

  // Uppdatera storage key när vi får userId
  getUserId().then((userId) => {
    storageKey = `report-builder-storage-${userId}`;
  });

  return createJSONStorage(() => ({
    getItem: (name) => {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item)[name] : null;
    },
    setItem: (name, value) => {
      const existing = localStorage.getItem(storageKey);
      const data = existing ? JSON.parse(existing) : {};
      data[name] = value;
      localStorage.setItem(storageKey, JSON.stringify(data));
    },
    removeItem: (name) => {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const data = JSON.parse(existing);
        delete data[name];
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    },
  }));
};

// Initialt formdata
const initialFormData: Partial<ReportFormData> = {
  projektId: "",
  datum: new Date().toISOString().split("T")[0],
  mottagare: "",
  foretag: "",
  adress: "",
  utredare: "",
  utredareEmail: "",
  utredarePhone: "",
  inledning: "",
  bakgrund: "",
  matmetoder: "",
  slutsats: "",
  images: [],
  leakAreas: [],
  lockedFields: [],
};

export const useReportBuilderStore = create<ReportBuilderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      formData: initialFormData,
      templates: [],
      templateBindings: null,
      lastSaved: null,
      hasDraft: false,

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      updateFormData: (data) => {
        const currentData = get().formData;
        const templateBindings = get().templateBindings;

        // Merge ny data
        const newFormData = { ...currentData, ...data };

        // Om vi har template bindings, re-resolve text för icke-manuellt ändrade fält
        if (templateBindings) {
          const textFields = [
            "inledning",
            "bakgrund",
            "matmetoder",
            "slutsats",
          ] as const;

          textFields.forEach((field) => {
            // Om fältet inte har manuell override och vi har source text
            if (
              !templateBindings.manualOverrides[field] &&
              templateBindings.source[field]
            ) {
              // Re-resolve template text
              const resolved = resolveTemplateText(
                templateBindings.source[field],
                newFormData,
              );
              (newFormData as Record<string, unknown>)[field] = resolved;
              templateBindings.resolved[field] = resolved;
            }
          });
        }

        set({
          formData: newFormData,
          hasDraft: true,
          lastSaved: new Date().toISOString(),
        });
      },

      setTemplates: (templates) => set({ templates }),

      applyTemplate: (template) => {
        const formData = get().formData;

        // Skapa template bindings
        const bindings: TemplateBindings = {
          source: {
            inledning: template.defaultInledning || "",
            bakgrund: template.defaultBakgrund,
            matmetoder: template.defaultMatmetoder,
            slutsats: template.defaultSlutsats,
          },
          resolved: {},
          manualOverrides: {
            inledning: false,
            bakgrund: false,
            matmetoder: false,
            slutsats: false,
          },
        };

        // Resolve alla template texts
        Object.keys(bindings.source).forEach((field) => {
          const sourceText = bindings.source[field];
          if (sourceText) {
            bindings.resolved[field] = resolveTemplateText(
              sourceText,
              formData,
            );
          }
        });

        // Uppdatera formData med resolved texts
        const updatedFormData = {
          ...formData,
          templateId: template.id,
          inledning: bindings.resolved.inledning,
          bakgrund: bindings.resolved.bakgrund,
          matmetoder: bindings.resolved.matmetoder,
          slutsats: bindings.resolved.slutsats,
        };

        set({
          formData: updatedFormData,
          templateBindings: bindings,
          hasDraft: true,
        });
      },

      saveReport: async () => {
        // TODO: Implementera i Fas 3 - spara till Supabase via API
        const formData = get().formData;
        console.log("Saving report:", formData);

        set({
          lastSaved: new Date().toISOString(),
          hasDraft: false,
        });
      },

      loadDraft: () => {
        // Laddar automatiskt från localStorage via persist
        console.log("Draft loaded from localStorage");
      },

      clearDraft: () => {
        const lockedFields = get().formData.lockedFields || [];
        const formData = get().formData;

        // Behåll låsta fält
        const clearedData: Partial<ReportFormData> = { ...initialFormData };
        lockedFields.forEach((field) => {
          if (field in formData) {
            (clearedData as Record<string, unknown>)[field] = (
              formData as Record<string, unknown>
            )[field];
          }
        });

        set({
          formData: clearedData,
          templateBindings: null,
          hasDraft: false,
          currentStep: 1,
        });
      },

      resetBuilder: () => {
        set({
          currentStep: 1,
          formData: initialFormData,
          templateBindings: null,
          hasDraft: false,
          lastSaved: null,
        });
      },

      canProceed: (step) => {
        const { formData } = get();

        switch (step) {
          case 1:
            // Steg 1: Mall vald (om mallar finns)
            return true; // Alltid kan gå vidare från steg 1

          case 2:
            // Steg 2: Grunddata ifylld
            return Boolean(
              formData.projektId?.trim() &&
                formData.datum &&
                formData.mottagare?.trim() &&
                formData.foretag?.trim() &&
                formData.utredare?.trim(),
            );

          case 3:
            // Steg 3: Textsektioner ifyllda
            return Boolean(
              formData.bakgrund?.trim() &&
                formData.matmetoder?.trim() &&
                formData.slutsats?.trim(),
            );

          case 4:
            // Steg 4: Alltid kan slutföra
            return true;

          default:
            return false;
        }
      },
    }),
    {
      name: "report-builder-storage",
      storage: createUserStorage(),
      partialize: (state) => ({
        formData: state.formData,
        templateBindings: state.templateBindings,
        currentStep: state.currentStep,
        lastSaved: state.lastSaved,
        hasDraft: state.hasDraft,
      }),
    },
  ),
);
