# Rapport V3 Architecture

## 1. Översikt

Rapport‑systemet i V3 består av:

- **`ReportTemplateV3`** – rapportmall med version, trade, PDF‑design och V3‑sektioner.
- **`TemplateSectionV3`** – sektionstyp i mall (text eller images) med ordning, krav och förifylld text.
- **`ReportV3`** – rapportinstans skapad från en mall, med metadata, V3‑sektioner, checklistor och assets.
- **`SectionInstanceV3`** – konkret instans av en mallsektion i en rapport.

Huvudflöden:

- **Report Studio V3** – bygger/updaterar mallar (`ReportTemplateV3`).
- **Rapport V3** – skapar, redigerar, exporterar och delar rapporter (`ReportV3`).
- **PDF‑pipeline V3** – HTML‑baserad export via `generatePdfHtml` + print‑to‑PDF.

Legacyflöden (React‑PDF, gamla `ReportFormData`, `rapport-container`, äldre settings) finns under `legacy/` och används inte i nya V3‑funktioner.

---

## 2. Databasschema (V3)

Källtyp: `lib/database.types.ts` + kolumner som används via `any`‑casts i koden.

### 2.1 `public.report_templates` (V3)

Relevanta kolumner:

- `id: uuid`
- `user_id: uuid | null`
- `organization_id: uuid | null`
- `name: text`
- `trade: "bygg" | "läckage" | "elektriker"`
- `description: text | null`
- `design_id: text | null`  
  Används som `PdfDesignId` (`"standard" | "modern_hero"`).
- `version: int`  
  **V3‑invariant:** `version = 3` för mallar som följer V3‑JSON.
- `sections: jsonb` – **TemplateSectionV3[]** för `version = 3`.
- `checklist: jsonb` – `ReportChecklistItem[]`.
- `asset_guidelines: jsonb`
- `visibility_rules: jsonb`
- `created_at: timestamptz | null`
- `updated_at: timestamptz | null`

**V3 JSON‑shape för `sections`** (logisk struktur, även om tabelltyperna bara säger `Json`):

```ts
export type TemplateSectionV3Type = "text" | "images";

export interface TemplateSectionV3 {
  id: string;
  key: string;                 // stabil identifierare
  type: TemplateSectionV3Type; // "text" | "images"
  title: string;
  description?: string;
  required: boolean;
  order: number;               // 1..N
  defaultContent?: string;
  placeholder?: string;
}
```

Invarianten för V3:

- `version = 3` **måste** vara satt.
- `sections` **måste** vara en array av `TemplateSectionV3`.

`stores/simpleReportStore.ts` skriver nu exakt denna shape och sätter `version: 3` för alla mallar som skapas/uppdateras via simple‑flödet.

### 2.2 `public.reports` (V3)

Relevanta kolumner:

- `id: uuid`
- `user_id: uuid | null`
- `organization_id: uuid | null`
- `template_id: uuid | null`
- `title: text`
- `trade: "bygg" | "läckage" | "elektriker"`
- `status: "draft" | "review" | "approved"`
- `priority: "low" | "medium" | "high"`
- `metadata: jsonb | null` – `ReportMetadata`
- `sections: jsonb | null` – V2: `ReportSectionInstance[]`, V3: `SectionInstanceV3[]`.
- `checklist: jsonb | null` – `ReportChecklistItem[]`
- `assets: jsonb | null` – `ReportAsset[]`
- `version: int` (via `any`‑cast)  
  **V3‑invariant:** `version = 3` för rapporter som följer `SectionInstanceV3[]`.
- Extra kolumner som används via `any`‑cast:
  - `exported_at`, `public_id`, `customer_email`, `customer_approved_at`, `customer_approved_by`
  - `pdf_template_id`, `cover_image_url`, `cover_subtitle`
  - (Legacy: `report_number`, `date`, etc.)

**V3 JSON‑shape för `sections`** (logiskt):

```ts
export interface SectionInstanceV3 {
  id: string;
  templateSectionId: string;
  type: "text" | "images";
  status: "pending" | "completed";
  order: number;

  text?: {
    title: string;
    body: string;
  };

  images?: {
    items: {
      id: string;
      assetId: string;
      caption?: string;
      annotations?: AnnotationShape[];
    }[];
  };

  internalNotes?: string;
}
```

- V2/V2.5‑flödet (nuvarande UI) använder fortfarande `ReportSectionInstance` för `sections`.
- V3‑typerna (`SectionInstanceV3`, `ReportV3`) beskriver den **målsatta** strukturen som nya flöden ska följa.

---

## 3. Kärntyper (V3)

Alla definierade i `lib/types/rapport.ts`.

### 3.1 TemplateSectionV3

```ts
export type TemplateSectionV3Type = "text" | "images";

export interface TemplateSectionV3 {
  id: string;
  key: string;
  type: TemplateSectionV3Type;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  defaultContent?: string;
  placeholder?: string;
}
```

### 3.2 ReportTemplateV3

```ts
export interface ReportTemplateV3 {
  id: string;
  version: 3;
  name: string;
  trade: ReportTrade;
  description?: string;
  designId?: "standard" | "modern_hero";
  sections: TemplateSectionV3[];
  checklist: ReportChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}
```

### 3.3 SectionInstanceV3

```ts
export interface SectionInstanceV3 {
  id: string;
  templateSectionId: string;
  type: TemplateSectionV3Type;
  status: "pending" | "completed";
  order: number;

  text?: { title: string; body: string };

  images?: {
    items: {
      id: string;
      assetId: string;
      caption?: string;
      annotations?: AnnotationShape[];
    }[];
  };

  internalNotes?: string;
}
```

### 3.4 ReportV3

```ts
export interface ReportV3 {
  id: string;
  version: 3;
  templateId: string;
  title: string;
  type: ReportTrade;
  status: ReportStatus;
  metadata: ReportMetadata;
  sections: SectionInstanceV3[];
  checklist: ReportChecklistItem[];
  assets: ReportAsset[];

  createdAt?: string;
  updatedAt: string;
  exportedAt?: string | null;

  publicId?: string | null;
  customerEmail?: string | null;
  customerApprovedAt?: string | null;
  customerApprovedBy?: string | null;
}
```

### 3.5 PdfDesignId och `PDF_DESIGNS`

```ts
export type PdfDesignId = "standard" | "modern_hero";
```

Kopplingen hanteras av `lib/rapport/pdfDesigns.ts`:

- `getPdfDesign(designId: PdfDesignId)` returnerar en designrenderer med:
  - `render({ report, sectionsHtml, metadata, colors, profile }): string`

Invarianten:

- `ReportMetadata.designId` och template/rapport väljer alltid en giltig `PdfDesignId`.

---

## 4. State Management (V3)

### 4.1 Rapport‑stores

V3‑flöden använder rapport‑stores i `lib/stores/rapportStores.ts`:

- `useReportsStore` – `Report[]`
- `useReportTemplatesStore` – `ReportTemplate[]`  
  (På sikt ska `version = 3` + `TemplateSectionV3` bli norm.)
- `useReportSectionsStore` – `ReportSectionDefinition[]` (sections‑bibliotek).

Dessa stores är redan uttagna ur `lib/store.ts` (Task 5) och betraktas som **V3 stores**.

### 4.2 Simple templates store (V3‑kompatibel JSON)

`stores/simpleReportStore.ts`:

- `useSimpleReportStore` hanterar `SimpleReportTemplate[]` och synkar till `report_templates`.
- Mapping:

  - `mapDbToTemplate(row)` läser gamla + nya JSON‑shapes och mappar dem till `SimpleSectionDefinition`.
  - `mapTemplateToDb(template)` skriver **V3‑kompatibel** JSON:
    - `sections: TemplateSectionV3[]`
    - `version: 3`
    - `design_id` från `template.designId`.

Därmed är simple‑flödet redan **låst** till V3‑shape på DB‑nivå.

### 4.3 useRapportData (V3 aggregator)

`lib/rapport/useRapportData.ts`:

- Samlar data från:
  - `useReportsStore`
  - `useReportTemplatesStore`
  - `useReportSectionsStore`
- Är refaktorerad (Task 8) till att använda **selectors** så komponenter inte subskribear hela stores.
- Betraktas som V3‑varianten av rapport‑datacentrering även om namnet är `useRapportData` (inte `useRapportDataV3`).

---

## 5. UI‑flöden

### 5.1 Report Studio V3 (templating)

- **Routes:**
  - `app/(dashboard)/report-studio/page.tsx`
  - `app/admin/report-studio/page.tsx`
- **Implementation:**  
  `components/report-studio-v2/*` (namnet är V2, men arkitektoniskt är detta V3‑templating för simple‑mallar).

Flöde:

- `ReportStudioV2`:
  - Använder `useSimpleReportStore` för att ladda mallar (`fetchTemplates`).
  - Hanterar listläge (`TemplateList`) och editorläge (`TemplateEditor`, `PdfDesigner`, `DesignsManager`).
- `TemplateEditor`:
  - Redigerar `SimpleReportTemplate` (namn, trade, description + sektioner).
  - Opererar på `SimpleSectionDefinition[]` som mappas till V3‑JSON vid persist.
- `PdfDesigner`:
  - Använder `generatePreviewHtml` + `PDF_DESIGNS` för att visa hur mallens sektioner kommer att se ut i en rapport.
- `DesignsManager` (admin):
  - Sätter `designId` på mallen via `updateTemplate` → `design_id` i DB.

### 5.2 Rapport V3 (skapande, redigering, export, public)

- **Route:** `app/(dashboard)/rapport/page.tsx`
- **Huvudkomponent:** `RapportPageNew`
  - Använder `useRapportData` + `rapportApi` (i `lib/rapport/rapportApi.ts`).

Flöden:

1. **Skapa rapport:**
   - Väljer mall (`ReportTemplate`), skapar `Report` via `createReport` (i `lib/store.ts`).
   - `createReport`:
     - Normaliserar metadata (inkl. `priority`, `scheduledAt`, `dueAt`).
     - Läser mallens `designId` och sätter `metadata.designId`.
     - Normaliserar `sections` via `normalizeReportSections` (legacy/V2 shape).
2. **Redigera rapport:**
   - Sections redigeras via komponenter i `components/rapport/editor/*` bundna till `rapportApi.updateReport`.
3. **Exportera & publicera:**
   - `rapportApi.exportReport`:
     - Genererar HTML via `openPdfPreview`/`generatePdfHtml`.
     - Uppdaterar rapporten via `exportReportAsPdf` (`lib/store.ts`) för att sätta `exportedAt`, `status = "approved"`, `publicId`, `customerEmail`.

V3‑typerna (`ReportV3`/`SectionInstanceV3`) beskriver den önskade framtida strukturen. Nuvarande UI använder fortfarande `Report`/`ReportSectionInstance` internt.

---

## 6. PDF‑pipeline (V3)

### 6.1 `generatePdfHtml` (V3‑pipeline)

**Fil:** `lib/rapport/pdfGenerator.ts`

Signatur:

```ts
export type PdfViewMode = "internal" | "customer";

export interface PdfGeneratorOptions {
  report: Report;                  // V3‑pipeline över befintlig Report‑modell
  template?: ReportTemplate | null;
  sectionDefinitions?: ReportSectionDefinition[];
  pdfProfile?: PdfProfile;
  viewMode?: PdfViewMode;          // "customer" (default) eller "internal"
}

export function generatePdfHtml(options: PdfGeneratorOptions): string;
```

- Väljer färger baserat på `report.type` + `pdfProfile`.
- Filtrerar bort interna sektioner för kundvy (`audience === "internal"`).
- Renderar sektioner:
  - Bildsektioner (`image`, `image_gallery`, `image_annotated`) → grid av bilder från `Report.assets`.
  - Textsektioner → renderar `content` som pre‑wrap text.
  - Interna anteckningar (`internalNotes`) inkluderas endast i `viewMode = "internal"`.

### 6.2 `PDF_DESIGNS` & designval

**Fil:** `lib/rapport/pdfDesigns.ts`

- `getPdfDesign(designId)` returnerar designrenderer (`standard` eller `modern_hero`).
- `generatePdfHtml` väljer designid så här:

```ts
const designId = pdfProfile?.designId || report.metadata.designId || "standard";
```

Det betyder:

- Mallens `designId` → `Report.metadata.designId` via `createReport`.
- PDF‑profil (`PdfProfile.designId`) kan överskrida per export.

### 6.3 HTML → förhandsvisning → print‑to‑PDF

- **Förhandsvisning i UI:**
  - `PdfDesigner` (Report Studio) bäddar in HTML i `<iframe>`; användaren ser layouten.
- **Export från Rapport‑UI:**
  - `openPdfPreview` (`pdfGenerator.ts`) öppnar HTML i nytt fönster, lägger på overlay med instruktioner, och låter användaren trigga `window.print()`.
  - Användaren väljer “Spara som PDF” i webbläsaren.

Ingen React‑PDF används i V3‑pipen; all rendering är HTML + CSS.

---

## 7. Edge Cases & Invarians

- **Version:**
  - `report_templates.version` och `reports.version` **ska** vara `3` för V3‑data.
  - Typnivå:
    - `ReportTemplateV3.version` är alltid `3`.
    - `ReportV3.version` är alltid `3`.
  - `mapReportTemplateRow` och `mapReportRow` läser `version` om kolumn finns (annars `undefined`).

- **Sections‑shape:**
  - V3:
    - `report_templates.sections` måste vara `TemplateSectionV3[]`.
    - `reports.sections` måste vara `SectionInstanceV3[]` för framtida V3‑flöden.
  - Legacy superset‑kompatibilitet (t.ex. `fields`, `summary`) behålls i:
    - `normalizeTemplateSections` (V2→`ReportTemplate.sections`).
    - `normalizeReportSections` (V2→`Report.sections`).
  - **Simple‑flödet** skriver redan strikt V3‑shape för mallar.

- **DesignId:**
  - Måste alltid vara en giltig `PdfDesignId` (`"standard" | "modern_hero"`).
  - Ogiltiga värden ska inte skrivas till DB.

- **Public API:**
  - `/api/reports/public/[publicId]`:
    - Använder `mapReportRow` för att normalisera `reports`‑raden.
    - Returnerar ett JSON‑svar som följer `Report`‑modellen (V2/V3‑kompatibel) med förutsägbara fält.

---

## 8. Legacy

Legacy‑delar ligger under `legacy/` och används inte i de officiella V3‑flödena:

- **React‑PDF‑pipeline:**
  - `legacy/report-pdf/ReportDocument.tsx`
  - `legacy/report-pdf/buildReportData.ts`
  - `legacy/app/api/reports/preview/pdf/route.ts`
- **Gammal rapport‑builder:**
  - `stores/reportBuilderStore.ts`
  - `lib/types/report-builder.ts`
  - `legacy/app/api/reports/[id]/pdf/route.ts` (HTML/React‑PDF)
- **PDFStructureBuilder:**
  - `components/rapport/pdf-structure-builder.tsx`
  - `stores/pdfStructureStore.ts`
  - `lib/types/pdf-structure.ts`
  - `legacy/app/api/designer/preview/pdf/route.ts`
- **Legacy UI:**
  - `legacy/rapport-container/rapport-container.tsx`
  - `legacy/rapport-settings/rapport-settings.tsx`
  - `legacy/rapport-settings/rapport-settings-v2.tsx`

Dessa bibehålls för kompatibilitet och äldre data, men nya features ska alltid byggas mot:

- `ReportTemplateV3` + `TemplateSectionV3`
- `ReportV3` + `SectionInstanceV3`
- HTML‑baserad PDF‑pipeline via `generatePdfHtml` och `PDF_DESIGNS`.

---

## 9. Performance Optimizations (A1–A6)

Följande optimeringar har implementerats för att förbättra prestanda och minska onödiga re-renders.

### A1 – Domänseparerade Stores med Selectors

**Fil:** `lib/stores/rapportStores.ts`

Tre separata Zustand-stores med dedikerade selectors:

```typescript
// Reports selectors
export const useReports = () => useReportsStore((state) => state.reports);
export const useReportsLoading = () => useReportsStore((state) => state.loading);
export const useReportsInitialized = () => useReportsStore((state) => state.initialized);
export const useReportById = (id: string | null) =>
  useReportsStore((state) => (id ? state.reports.find((r) => r.id === id) ?? null : null));

// Templates selectors
export const useTemplates = () => useReportTemplatesStore((state) => state.templates);
export const useTemplatesLoading = () => useReportTemplatesStore((state) => state.loading);
export const useTemplatesInitialized = () => useReportTemplatesStore((state) => state.initialized);
export const useTemplateById = (id: string | null) =>
  useReportTemplatesStore((state) => (id ? state.templates.find((t) => t.id === id) ?? null : null));

// Sections selectors
export const useSections = () => useReportSectionsStore((state) => state.sections);
export const useSectionsLoading = () => useReportSectionsStore((state) => state.loading);
export const useSectionsInitialized = () => useReportSectionsStore((state) => state.initialized);
export const useSectionById = (id: string | null) =>
  useReportSectionsStore((state) => (id ? state.sections.find((s) => s.id === id) ?? null : null));
```

**Fördelar:**
- Komponenter prenumererar endast på den data de behöver.
- Minskar onödiga re-renders när orelaterad data ändras.

### A2 – Lokal UI-State istället för Global Store

**Filer:** `stores/simpleReportStore.ts`, `components/report-studio-v2/report-studio-v2.tsx`

UI-specifik state (`loading`, `saving`, `isEditing`, `previewMode`) har flyttats från globala stores till lokalt komponent-state:

```typescript
// Före (global store)
const { loading, saving } = useSimpleReportStore();

// Efter (lokal state)
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

**Fördelar:**
- Isolerar UI-state till komponenten som äger den.
- Förhindrar att orelaterade komponenter re-renderas vid loading-ändringar.

### A3 – Memoiserade Beräkningar med Tidig Retur

**Fil:** `lib/rapport/useRapportData.ts`

Optimerade `useMemo`-beräkningar med tidig retur:

```typescript
const filteredReports = useMemo(() => {
  // Tidig retur om inga rapporter
  if (reports.length === 0) return [];
  
  // Tidig retur om default filter/sort (ingen filtrering behövs)
  const isDefaultFilter = !filter.search && !filter.status && !filter.templateId;
  const isDefaultSort = sort.field === "updatedAt" && sort.direction === "desc";
  
  if (isDefaultFilter && isDefaultSort) {
    return reports; // Redan sorterade från API
  }
  
  let result = rapportApi.applyFilter(reports, filter);
  result = rapportApi.applySort(result, sort);
  return result;
}, [reports, filter, sort]);
```

**Fördelar:**
- Undviker onödiga filter/sort-operationer.
- Snabbare rendering vid default-inställningar.

### A4 – Lazy Loading av Tunga UI-Komponenter

**Filer:** `app/(dashboard)/report-studio/page.tsx`, `app/(dashboard)/studio/page.tsx`, `app/admin/report-studio/page.tsx`

Tunga komponenter laddas med `next/dynamic`:

```typescript
const ReportStudioV2 = dynamic(
  () => import("@/components/report-studio-v2").then((mod) => mod.ReportStudioV2),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);
```

**Lazy-laddade komponenter:**
- `ReportStudioV2` (mallbyggare)
- `DesignsManager` (PDF-designs admin)

**Fördelar:**
- Snabbare initial sidladdning.
- Kod-splitting minskar bundle-storlek.

### A5 – Debounced PDF Preview

**Fil:** `components/report-studio-v2/pdf-designer.tsx`

PDF-förhandsvisning debounce:as för att undvika för många re-renders:

```typescript
const PREVIEW_DEBOUNCE_MS = 250;

const [debouncedPreviewHtml, setDebouncedPreviewHtml] = useState("");
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }
  
  debounceTimerRef.current = setTimeout(() => {
    setDebouncedPreviewHtml(rawPreviewHtml);
  }, PREVIEW_DEBOUNCE_MS);

  return () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, [rawPreviewHtml]);
```

**Fördelar:**
- Minskar CPU-användning vid snabba ändringar.
- Smidigare användarupplevelse.

### A6 – Tunn Global Reports-State (ReportSummary)

**Filer:** `lib/types/rapport.ts`, `lib/stores/rapportStores.ts`

En tunn `ReportSummary`-typ för effektiv listning:

```typescript
export interface ReportSummary {
  id: string;
  title: string;
  status: ReportStatus;
  templateId: string;
  metadata: ReportMetadata;
  exportedAt?: string | null;
  updatedAt: string;
  createdAt?: string;
  type?: ReportTrade;
  publicId?: string | null;
}

// Konverteringsfunktion
export function toReportSummary(report: Report): ReportSummary { ... }
```

**Dedikerad store:**

```typescript
export const useReportSummaryStore = create<ReportSummaryStore>((set) => ({
  summaries: [],
  loading: false,
  initialized: false,
  setSummaries: (summaries) => set({ summaries, initialized: true }),
  upsertSummary: (summary) => set((state) => { ... }),
  removeSummary: (id) => set((state) => ({ ... })),
  ...
}));

// Selectors
export const useReportSummaries = () => useReportSummaryStore((state) => state.summaries);
export const useReportSummaryById = (id: string | null) =>
  useReportSummaryStore((state) => (id ? state.summaries.find((s) => s.id === id) ?? null : null));
```

**Fördelar:**
- Listkomponenter behöver inte ladda tunga `sections`, `assets`, `checklist`.
- Fullständig `Report`-data laddas on-demand vid redigering.
- Minskar minnesanvändning och initial laddningstid.

### A7 – Bundle-Size Optimization

**Identifierade oanvända exporter i `lib/types/rapport.ts`:**
- `LEGACY_TO_SIMPLE_TYPE`
- `SectionAudience`
- `ReportAssetGuideline`
- `ReportVisibilityRule`
- `toReportSummary` (ny, ännu ej integrerad)
- V3-typer (ännu ej fullt integrerade)

**Dynamic imports för tunga moduler:**

```typescript
// app/(dashboard)/ai-assistants/page.tsx
// A7: Lazy load Vapi SDK
let VapiModule: typeof import("@vapi-ai/web") | null = null;
const loadVapi = async () => {
  if (!VapiModule) {
    VapiModule = await import("@vapi-ai/web");
  }
  return VapiModule.default;
};

// app/(dashboard)/rapport/page.tsx
// A7: Lazy load RapportPageNew
const RapportPageNew = dynamic(
  () => import("@/components/rapport/RapportPageNew").then((mod) => mod.RapportPageNew),
  { loading: () => <Loader />, ssr: false }
);
```

**Bundle-storlekar (First Load JS):**
| Sida | Storlek | Status |
|------|---------|--------|
| `/ai-assistants` | 307 kB | Optimerad med lazy Vapi |
| `/rapport` | 276 kB | Optimerad med lazy RapportPageNew |
| `/report-studio` | 104 kB | Redan lazy-loadad (A4) |

### A8 – Re-render Minimization

**Memoized komponenter:**

```typescript
// components/rapport/RapportListPanel.tsx
const ReportCard = memo(function ReportCard({ ... }: ReportCardProps) {
  // A8: Memoized to prevent unnecessary re-renders when list updates
  ...
});
```

**useCallback för event handlers:**

```typescript
// components/rapport/RapportListPanel.tsx
const handleSearchChange = useCallback((value: string) => {
  onFilterChange({ ...filter, search: value || undefined });
}, [filter, onFilterChange]);

const handleQuickFilter = useCallback((key: string) => {
  // ...
}, [filter, onFilterChange]);

const handleSortFieldChange = useCallback((field: ReportSortOptions["field"]) => {
  onSortChange({ ...sort, field });
}, [sort, onSortChange]);

const toggleSortDirection = useCallback(() => {
  onSortChange({ ...sort, direction: sort.direction === "asc" ? "desc" : "asc" });
}, [sort, onSortChange]);
```

**Client boundary audit:**
- 37 client components i `app/` katalogen
- Alla kräver hooks eller interaktivitet
- Inga kandidater för konvertering till server components

