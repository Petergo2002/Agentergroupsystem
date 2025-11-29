/**
 * Simple Report Store (Supabase-synkad)
 *
 * Förenklad store för det nya mallsystemet.
 * Synkar med Supabase report_templates tabell.
 * Endast 2 sektionstyper: text och images.
 */

import { create } from "zustand";
import type { Database } from "@/lib/database.types";
import { createSupabaseClient, IS_DEMO_MODE } from "@/lib/supabase";
import type {
  ReportTrade,
  SimpleReportTemplate,
  SimpleSectionDefinition,
} from "@/lib/types/rapport";

// ============================================================================
// Types
// ============================================================================

interface SimpleReportState {
  // Mallar
  templates: SimpleReportTemplate[];
  activeTemplateId: string | null;

  // A2: loading/saving är borttagna från globalt state
  // Komponenter hanterar sina egna loading-states lokalt
  initialized: boolean;

  // Actions - Data
  fetchTemplates: () => Promise<void>;

  // Actions - Templates
  addTemplate: (
    template: Omit<SimpleReportTemplate, "id" | "createdAt" | "updatedAt">,
  ) => Promise<SimpleReportTemplate>;
  updateTemplate: (
    id: string,
    updates: Partial<SimpleReportTemplate>,
  ) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setActiveTemplate: (id: string | null) => void;
  duplicateTemplate: (id: string) => Promise<void>;

  // Actions - Sections
  addSection: (
    templateId: string,
    section: Omit<SimpleSectionDefinition, "id" | "order">,
  ) => Promise<void>;
  updateSection: (
    templateId: string,
    sectionId: string,
    updates: Partial<SimpleSectionDefinition>,
  ) => Promise<void>;
  deleteSection: (templateId: string, sectionId: string) => Promise<void>;
  reorderSections: (templateId: string, sectionIds: string[]) => Promise<void>;

  // Helpers
  getActiveTemplate: () => SimpleReportTemplate | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

// Konvertera från Supabase-format till SimpleReportTemplate
type ReportTemplateRow =
  Database["public"]["Tables"]["report_templates"]["Row"];

type SectionLike = {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  hint?: string;
  order?: number;
  required?: boolean;
  placeholder?: string;
  defaultContent?: string;
};

function mapDbToTemplate(row: ReportTemplateRow): SimpleReportTemplate {
  // Konvertera sections från DB-format
  const rawSections = (row.sections as SectionLike[] | null) ?? [];
  const sections: SimpleSectionDefinition[] = rawSections.map(
    (s, index: number) => ({
      id: s.id || generateId(),
      type:
        s.type === "image_gallery" ||
        s.type === "image" ||
        s.type === "image_annotated" ||
        s.type === "images"
          ? "images"
          : "text",
      title: s.title || `Sektion ${index + 1}`,
      description: s.description || s.hint || "",
      order: s.order || index + 1,
      required: s.required ?? false,
      placeholder: s.placeholder,
      defaultContent: s.defaultContent,
    }),
  );

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    trade: (row.trade || "bygg") as ReportTrade,
    sections,
    designId: (row.design_id as SimpleReportTemplate["designId"]) ?? undefined,
    createdAt: row.created_at || now(),
    updatedAt: row.updated_at || now(),
  };
}

// Konvertera från SimpleReportTemplate till Supabase-format
function mapTemplateToDb(template: SimpleReportTemplate) {
  const dbData = {
    name: template.name,
    trade: template.trade,
    description: template.description || null,
    design_id: template.designId || null,
    // Persist sections as TemplateSectionV3-compatible JSON
    sections: template.sections.map((s, index) => ({
      id: s.id,
      key: s.id,
      type: s.type === "images" ? "images" : "text",
      title: s.title,
      description: s.description,
      required: s.required,
      order: s.order || index + 1,
      defaultContent: s.defaultContent,
      placeholder: s.placeholder,
    })),
    checklist: [],
    asset_guidelines: [],
    visibility_rules: [],
    // Mark templates created via SimpleReportStore as V3
    version: 3,
  };

  return dbData;
}

// ============================================================================
// Default Templates (för demo-läge)
// ============================================================================

const DEFAULT_TEMPLATES: SimpleReportTemplate[] = [
  {
    id: "template-leckage",
    name: "Läckagerapport",
    description: "Standardmall för läckageutredningar",
    trade: "läckage",
    sections: [
      {
        id: "s0",
        type: "text",
        title: "Grundinformation",
        description: "Kontaktuppgifter och projektinfo",
        order: 0,
        required: true,
      },
      {
        id: "s1",
        type: "text",
        title: "Inledning",
        description: "Bakgrund och syfte",
        order: 1,
        required: true,
      },
      {
        id: "s2",
        type: "text",
        title: "Metod",
        description: "Undersökningsmetoder",
        order: 2,
        required: true,
      },
      {
        id: "s3",
        type: "images",
        title: "Dokumentation",
        description: "Bilder från besiktningen",
        order: 3,
        required: false,
      },
      {
        id: "s4",
        type: "text",
        title: "Resultat",
        description: "Fynd och mätvärden",
        order: 4,
        required: true,
      },
      {
        id: "s5",
        type: "images",
        title: "Skadebilder",
        description: "Bilder på skador med annoteringar",
        order: 5,
        required: false,
      },
      {
        id: "s6",
        type: "text",
        title: "Slutsats",
        description: "Sammanfattning och rekommendationer",
        order: 6,
        required: true,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "template-bygg",
    name: "Besiktningsrapport",
    description: "Standardmall för byggbesiktningar",
    trade: "bygg",
    sections: [
      {
        id: "s0",
        type: "text",
        title: "Grundinformation",
        description: "Kontaktuppgifter och projektinfo",
        order: 0,
        required: true,
      },
      {
        id: "s1",
        type: "text",
        title: "Objektbeskrivning",
        description: "Beskrivning av byggnaden",
        order: 1,
        required: true,
      },
      {
        id: "s2",
        type: "images",
        title: "Översiktsbilder",
        description: "Bilder på byggnaden",
        order: 2,
        required: false,
      },
      {
        id: "s3",
        type: "text",
        title: "Utvändigt",
        description: "Fasad, tak, grund",
        order: 3,
        required: true,
      },
      {
        id: "s4",
        type: "text",
        title: "Invändigt",
        description: "Rum och installationer",
        order: 4,
        required: true,
      },
      {
        id: "s5",
        type: "images",
        title: "Detaljbilder",
        description: "Bilder på brister",
        order: 5,
        required: false,
      },
      {
        id: "s6",
        type: "text",
        title: "Sammanfattning",
        description: "Brister och åtgärder",
        order: 6,
        required: true,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

// ============================================================================
// Store
// ============================================================================

export const useSimpleReportStore = create<SimpleReportState>()((set, get) => ({
  // Initial state
  templates: [],
  activeTemplateId: null,
  // A2: loading/saving borttagna - hanteras lokalt i komponenter
  initialized: false,

  // Fetch templates from Supabase (filtered by current user)
  // A2: loading-state hanteras nu lokalt i komponenter
  fetchTemplates: async () => {
    if (get().initialized) return;

    try {
      if (IS_DEMO_MODE) {
        set({ templates: DEFAULT_TEMPLATES, initialized: true });
        return;
      }

      const supabase = createSupabaseClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn("No authenticated user, using default templates");
        set({ templates: DEFAULT_TEMPLATES, initialized: true });
        return;
      }

      // Fetch templates - RLS handles org-level filtering
      const { data, error } = await supabase
        .from("report_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const templates = (data || []).map(mapDbToTemplate);

      set({ templates, initialized: true });
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      set({ templates: [], initialized: true });
    }
  },

  // Template actions
  // A2: saving-state hanteras nu lokalt i komponenter
  addTemplate: async (template) => {
    const newTemplate: SimpleReportTemplate = {
      ...template,
      id: generateId(),
      sections: template.sections || [
        // Lägg alltid till Grundinformation som första sektion
        {
          id: generateId(),
          type: "text",
          title: "Grundinformation",
          description: "Kontaktuppgifter och projektinfo",
          order: 0,
          required: true,
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    };

    try {
      if (!IS_DEMO_MODE) {
        const supabase = createSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          throw new Error(`Autentiseringsfel: ${authError.message}`);
        }

        if (user) {
          // Get organization_id for RLS compliance
          const { data: profile } = await supabase
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .maybeSingle();

          const organizationId = profile?.organization_id;

          const templateData = {
            ...mapTemplateToDb(newTemplate),
            user_id: user.id,
            organization_id: organizationId,
          };

          const { data, error } = await supabase
            .from("report_templates")
            .insert(templateData)
            .select("*")
            .single();

          if (error) {
            console.error("Supabase insert error:", error);
            throw new Error(`Kunde inte spara mall: ${error.message}`);
          }

          const savedTemplate = mapDbToTemplate(data);
          set((state) => ({
            templates: [savedTemplate, ...state.templates],
            activeTemplateId: savedTemplate.id,
          }));
          return savedTemplate;
        }
      }

      // Fallback för demo eller om inte inloggad
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        activeTemplateId: newTemplate.id,
      }));
      return newTemplate;
    } catch (err) {
      console.error("Failed to create template:", err);

      // Ge ett mer användarvänligt felmeddelande
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Kunde inte skapa mallen. Vänligen försök igen.");
      }
    }
  },

  updateTemplate: async (id, updates) => {
    // Uppdatera lokalt först (optimistisk uppdatering)
    const currentTemplate = get().templates.find((t) => t.id === id);
    if (!currentTemplate) {
      return;
    }

    const updatedTemplate = {
      ...currentTemplate,
      ...updates,
      updatedAt: now(),
    };

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? updatedTemplate : t,
      ),
    }));

    try {
      if (!IS_DEMO_MODE) {
        const supabase = createSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw authError || new Error("Ingen användare hittades");
        }

        // RLS handles authorization
        const { error } = await supabase
          .from("report_templates")
          .update(mapTemplateToDb(updatedTemplate))
          .eq("id", id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  },

  deleteTemplate: async (id) => {
    try {
      if (!IS_DEMO_MODE) {
        const supabase = createSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw authError || new Error("Ingen användare hittades");
        }

        // RLS handles authorization
        const { error } = await supabase
          .from("report_templates")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        activeTemplateId:
          state.activeTemplateId === id ? null : state.activeTemplateId,
      }));
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  },

  setActiveTemplate: (id) => {
    set({ activeTemplateId: id });
  },

  duplicateTemplate: async (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    await get().addTemplate({
      name: `${template.name} (kopia)`,
      description: template.description,
      trade: template.trade,
      sections: template.sections.map((s) => ({ ...s, id: generateId() })),
    });
  },

  // Section actions
  addSection: async (templateId, section) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const maxOrder = Math.max(0, ...template.sections.map((s) => s.order));
    const newSection: SimpleSectionDefinition = {
      ...section,
      id: generateId(),
      order: maxOrder + 1,
    };

    const updatedSections = [...template.sections, newSection];
    await get().updateTemplate(templateId, { sections: updatedSections });
  },

  updateSection: async (templateId, sectionId, updates) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedSections = template.sections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s,
    );
    await get().updateTemplate(templateId, { sections: updatedSections });
  },

  deleteSection: async (templateId, sectionId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedSections = template.sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    await get().updateTemplate(templateId, { sections: updatedSections });
  },

  reorderSections: async (templateId, sectionIds) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedSections = sectionIds
      .map((id, index) => {
        const section = template.sections.find((s) => s.id === id);
        return section ? { ...section, order: index + 1 } : null;
      })
      .filter(Boolean) as SimpleSectionDefinition[];

    await get().updateTemplate(templateId, { sections: updatedSections });
  },

  // Helpers
  getActiveTemplate: () => {
    const state = get();
    return state.templates.find((t) => t.id === state.activeTemplateId) || null;
  },
}));

export default useSimpleReportStore;
