import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  brandColor: "#0f172a",
  accentColor: "#22c55e",
  fontFamily: "Inter",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "",
  logoUrl: "",
  headerText: "",
};

interface PdfProfileStore {
  profile: PdfProfile;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  setProfile: (profile: Partial<PdfProfile>) => void;
  resetProfile: () => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<boolean>;
}

// Supabase-baserad persistens
async function loadProfileFromDb(): Promise<PdfProfile | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("organization_settings")
      .select("pdf_profile")
      .single();

    if (error) {
      // Tabellen kanske inte finns, returnera null
      console.log("Could not load PDF profile from DB:", error.message);
      return null;
    }

    return data?.pdf_profile as PdfProfile | null;
  } catch (err) {
    console.error("Error loading PDF profile:", err);
    return null;
  }
}

async function saveProfileToDb(profile: PdfProfile): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    // Försök uppdatera först
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

export const usePdfProfileStore = create<PdfProfileStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PDF_PROFILE,
      isLoading: false,
      isSaving: false,
      lastSaved: null,

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      resetProfile: () => set({ profile: DEFAULT_PDF_PROFILE }),

      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const dbProfile = await loadProfileFromDb();
          if (dbProfile) {
            set({ profile: { ...DEFAULT_PDF_PROFILE, ...dbProfile } });
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
    }),
    {
      name: "pdf-profile-storage",
      storage: createJSONStorage(() => localStorage),
      // Synka med localStorage som backup/cache
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
