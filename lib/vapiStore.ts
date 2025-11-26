import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VapiState {
  apiKey: string | null;
  orgId: string | null;
  setApiKey: (key: string) => void;
  setOrgId: (orgId: string | null) => void;
  clearApiKey: () => void;
}

export const useVapiStore = create<VapiState>()(
  persist(
    (set) => ({
      apiKey: null,
      orgId: null,
      setApiKey: (key) => set({ apiKey: key }),
      setOrgId: (orgId) => set({ orgId }),
      clearApiKey: () => set({ apiKey: null, orgId: null }),
    }),
    {
      name: "vapi-store",
      partialize: (state) => ({ apiKey: state.apiKey, orgId: state.orgId }),
    },
  ),
);
