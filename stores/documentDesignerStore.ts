import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignerBlock } from "@/components/rapport/pdf/designer/DesignerDocument";

interface DocumentDesignerStore {
  blocks: DesignerBlock[];
  addBlock: (block: DesignerBlock) => void;
  updateBlock: (id: string, updates: Partial<DesignerBlock>) => void;
  reorderBlock: (fromIndex: number, toIndex: number) => void;
  deleteBlock: (id: string) => void;
  setBlocks: (blocks: DesignerBlock[]) => void;
  reset: () => void;
}

const defaultBlocks: DesignerBlock[] = [
  {
    id: crypto.randomUUID(),
    type: "heading",
    level: 1,
    text: "Besiktningsrapport",
  },
  {
    id: crypto.randomUUID(),
    type: "paragraph",
    text: "Detta är en redigerbar mall. Lägg till rubriker, text, bilder och sidbrytningar.",
  },
];

export const useDocumentDesignerStore = create<DocumentDesignerStore>()(
  persist(
    (set, get) => ({
      blocks: defaultBlocks,
      addBlock: (block) => set({ blocks: [...get().blocks, block] }),
      updateBlock: (id, updates) => {
        set({
          blocks: get().blocks.map((b) =>
            b.id === id ? ({ ...b, ...updates } as DesignerBlock) : b,
          ),
        });
      },
      reorderBlock: (fromIndex, toIndex) => {
        const list = [...get().blocks];
        const [moved] = list.splice(fromIndex, 1);
        if (!moved) return;
        list.splice(toIndex, 0, moved);
        set({ blocks: list });
      },
      deleteBlock: (id) =>
        set({ blocks: get().blocks.filter((b) => b.id !== id) }),
      setBlocks: (blocks) => set({ blocks }),
      reset: () => set({ blocks: defaultBlocks }),
    }),
    { name: "document-designer-store" },
  ),
);
