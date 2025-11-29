import { create } from "zustand";
import type { DesignerBlock } from "@/components/rapport/pdf/designer/DesignerDocument";
import { createSupabaseClient, IS_DEMO_MODE } from "@/lib/supabase";
import type { BrandingConfig } from "@/lib/types/report-builder";

export interface DesignerTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: DesignerBlock[];
  branding?: BrandingConfig;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface DesignerTemplatesStore {
  templates: DesignerTemplate[];
  loading: boolean;
  initialized: boolean;
  fetchTemplates: () => Promise<void>;
  addTemplate: (
    name: string,
    blocks: DesignerBlock[],
    branding?: BrandingConfig,
  ) => Promise<DesignerTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  updateTemplate: (
    id: string,
    updates: Partial<DesignerTemplate>,
  ) => Promise<void>;
}

// Database row type for pdf_designs table
interface PdfDesignRow {
  id: string;
  name: string;
  description?: string | null;
  blocks?: DesignerBlock[] | null;
  branding?: BrandingConfig | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Map database row to DesignerTemplate
function mapDbToTemplate(row: PdfDesignRow): DesignerTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    blocks: row.blocks || [],
    branding: row.branding || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Default templates for demo mode
const DEFAULT_TEMPLATES: DesignerTemplate[] = [];

export const useDesignerTemplatesStore = create<DesignerTemplatesStore>()(
  (set, get) => ({
    templates: [],
    loading: false,
    initialized: false,

    // Fetch all PDF designs from Supabase (SHARED - everyone sees all)
    fetchTemplates: async () => {
      if (get().initialized) return;

      set({ loading: true });

      try {
        if (IS_DEMO_MODE) {
          set({
            templates: DEFAULT_TEMPLATES,
            initialized: true,
            loading: false,
          });
          return;
        }

        const supabase = createSupabaseClient();

        // Fetch ALL pdf_designs (shared globally)
        const { data, error } = await supabase
          .from("pdf_designs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const templates = (data || []).map(mapDbToTemplate);
        set({ templates, initialized: true, loading: false });
      } catch (err) {
        console.error("Failed to fetch PDF designs:", err);
        set({ templates: [], initialized: true, loading: false });
      }
    },

    // Add a new PDF design
    addTemplate: async (name, blocks, branding) => {
      const now = new Date().toISOString();
      const tempId = crypto.randomUUID();

      // Optimistic update
      const tempTemplate: DesignerTemplate = {
        id: tempId,
        name,
        blocks,
        branding,
        createdAt: now,
        updatedAt: now,
      };

      try {
        if (IS_DEMO_MODE) {
          set({ templates: [tempTemplate, ...get().templates] });
          return tempTemplate;
        }

        const supabase = createSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("pdf_designs")
          .insert({
            name,
            blocks,
            branding: branding || null,
            created_by: user?.id || null,
          })
          .select("*")
          .single();

        if (error) throw error;

        const savedTemplate = mapDbToTemplate(data);
        set({ templates: [savedTemplate, ...get().templates] });
        return savedTemplate;
      } catch (err) {
        console.error("Failed to create PDF design:", err);
        // Fallback to local
        set({ templates: [tempTemplate, ...get().templates] });
        return tempTemplate;
      }
    },

    // Delete a PDF design
    deleteTemplate: async (id) => {
      try {
        if (!IS_DEMO_MODE) {
          const supabase = createSupabaseClient();
          const { error } = await supabase
            .from("pdf_designs")
            .delete()
            .eq("id", id);

          if (error) throw error;
        }

        set({ templates: get().templates.filter((t) => t.id !== id) });
      } catch (err) {
        console.error("Failed to delete PDF design:", err);
        // Still remove locally
        set({ templates: get().templates.filter((t) => t.id !== id) });
      }
    },

    // Update a PDF design
    updateTemplate: async (id, updates) => {
      const now = new Date().toISOString();

      // Optimistic update
      set({
        templates: get().templates.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: now } : t,
        ),
      });

      try {
        if (!IS_DEMO_MODE) {
          const supabase = createSupabaseClient();

          const dbUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined)
            dbUpdates.description = updates.description;
          if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
          if (updates.branding !== undefined)
            dbUpdates.branding = updates.branding;

          const { error } = await supabase
            .from("pdf_designs")
            .update(dbUpdates)
            .eq("id", id);

          if (error) throw error;
        }
      } catch (err) {
        console.error("Failed to update PDF design:", err);
      }
    },
  }),
);
