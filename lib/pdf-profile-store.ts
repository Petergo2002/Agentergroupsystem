import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PdfDesignId } from "@/lib/rapport/pdfDesigns";
import { createSupabaseClient } from "./supabase";

export type PdfProfile = {
  id?: string;
  // Grundinformation
  customerName: string;
  projectRef: string;
  address: string;
  // Branding
  brandColor: string;
  accentColor: string;
  fontFamily: string;
  displayLogo: boolean;
  displayInternalNotes: boolean;
  footerText: string;
  logoUrl: string;
  headerText: string;
};

export const DEFAULT_PDF_PROFILE: PdfProfile = {
  // Grundinformation
  customerName: "",
  projectRef: "",
  address: "",
  // Branding
  brandColor: "#10b981",
  accentColor: "#059669",
  fontFamily: "Inter",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "",
  logoUrl: "",
  headerText: "",
};

// Default: alla designer är aktiverade
export const DEFAULT_ENABLED_DESIGNS: PdfDesignId[] = [
  "standard",
  "modern_hero",
];

interface PdfProfileStore {
  profile: PdfProfile;
  enabledPdfDesigns: PdfDesignId[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  setProfile: (profile: Partial<PdfProfile>) => void;
  setEnabledDesigns: (designs: PdfDesignId[]) => void;
  resetProfile: () => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<boolean>;
  saveEnabledDesigns: () => Promise<boolean>;
}

// Supabase-baserad persistens
interface OrgSettingsData {
  pdf_profile?: PdfProfile | null;
  enabled_pdf_designs?: PdfDesignId[] | null;
}

async function loadSettingsFromDb(): Promise<OrgSettingsData | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("organization_settings")
      .select("pdf_profile, enabled_pdf_designs")
      .single();

    if (error) {
      // Tabellen kanske inte finns, returnera null
      console.log("Could not load settings from DB:", error.message);
      return null;
    }

    return {
      pdf_profile: data?.pdf_profile as PdfProfile | null,
      enabled_pdf_designs: data?.enabled_pdf_designs as PdfDesignId[] | null,
    };
  } catch (err) {
    console.error("Error loading settings:", err);
    return null;
  }
}

async function saveProfileToDb(profile: PdfProfile): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();

    const { error: updateError } = await supabase
      .from("organization_settings")
      .upsert({
        id: "default",
        pdf_profile: profile,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error("Could not save PDF profile to DB:", updateError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error saving PDF profile:", err);
    return false;
  }
}

async function saveEnabledDesignsToDb(
  designs: PdfDesignId[],
): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();

    const { error: updateError } = await supabase
      .from("organization_settings")
      .upsert({
        id: "default",
        enabled_pdf_designs: designs,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error(
        "Could not save enabled designs to DB:",
        updateError.message,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error saving enabled designs:", err);
    return false;
  }
}

export const usePdfProfileStore = create<PdfProfileStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PDF_PROFILE,
      enabledPdfDesigns: DEFAULT_ENABLED_DESIGNS,
      isLoading: false,
      isSaving: false,
      lastSaved: null,

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      setEnabledDesigns: (designs) => set({ enabledPdfDesigns: designs }),

      resetProfile: () =>
        set({
          profile: DEFAULT_PDF_PROFILE,
          enabledPdfDesigns: DEFAULT_ENABLED_DESIGNS,
        }),

      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const settings = await loadSettingsFromDb();
          if (settings) {
            if (settings.pdf_profile) {
              set({
                profile: { ...DEFAULT_PDF_PROFILE, ...settings.pdf_profile },
              });
            }
            if (
              settings.enabled_pdf_designs &&
              settings.enabled_pdf_designs.length > 0
            ) {
              set({ enabledPdfDesigns: settings.enabled_pdf_designs });
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },

      saveProfile: async () => {
        const { profile } = get();
        set({ isSaving: true });
        try {
          const success = await saveProfileToDb(profile);
          if (success) {
            set({ lastSaved: new Date() });
          }
          return success;
        } finally {
          set({ isSaving: false });
        }
      },

      saveEnabledDesigns: async () => {
        const { enabledPdfDesigns } = get();
        set({ isSaving: true });
        try {
          const success = await saveEnabledDesignsToDb(enabledPdfDesigns);
          if (success) {
            set({ lastSaved: new Date() });
          }
          return success;
        } finally {
          set({ isSaving: false });
        }
      },
    }),
    {
      name: "pdf-profile-storage",
      storage: createJSONStorage(() => localStorage),
      // Synka med localStorage som backup/cache
      partialize: (state) => ({
        profile: state.profile,
        enabledPdfDesigns: state.enabledPdfDesigns,
      }),
    },
  ),
);
