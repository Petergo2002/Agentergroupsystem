# State Management – V3 Architecture

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

V3-arkitekturen använder **Zustand** för global state med strikt domänseparation. Varje domän har sin egen store med dedikerade selectors för att minimera re-renders.

### Principer

1. **Domänseparation** – Varje entitetstyp har sin egen store
2. **Selectors** – Komponenter prenumererar endast på den data de behöver
3. **Lokal UI-state** – `loading`, `saving`, `isEditing` hanteras lokalt i komponenter
4. **Thin global state** – Endast metadata i global state, fullständig data laddas on-demand

---

## 2. Store-struktur

### 2.1 Rapport-domänen

```
lib/stores/rapportStores.ts
├── useReportsStore          # ReportV3 instances
├── useReportTemplatesStore  # ReportTemplateV3 templates
├── useReportSectionsStore   # Section definitions
└── useReportSummaryStore    # Thin metadata for lists (A6)
```

### 2.2 Andra domäner

```
lib/store.ts
├── useAuthStore             # Auth state
├── useCustomersStore        # Customers
├── useLeadsStore            # Leads
├── useJobsStore             # Jobs
├── useQuotesStore           # Quotes
├── useInvoicesStore         # Invoices
├── useEventsStore           # Calendar events
└── useTasksStore            # Tasks
```

---

## 3. Rapport Stores (V3)

### 3.1 useReportsStore

```typescript
interface ReportsStore {
  reports: Report[];
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  removeReport: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}
```

### 3.2 useReportTemplatesStore

```typescript
interface ReportTemplatesStore {
  templates: ReportTemplate[];
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setTemplates: (templates: ReportTemplate[]) => void;
  addTemplate: (template: ReportTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}
```

### 3.3 useReportSummaryStore (A6 – Thin State)

```typescript
interface ReportSummary {
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

interface ReportSummaryStore {
  summaries: ReportSummary[];
  loading: boolean;
  initialized: boolean;
  
  setSummaries: (summaries: ReportSummary[]) => void;
  upsertSummary: (summary: ReportSummary) => void;
  removeSummary: (id: string) => void;
}
```

---

## 4. Selectors (A1)

Selectors isolerar komponenter från store-ändringar:

```typescript
// Reports selectors
export const useReports = () => useReportsStore((state) => state.reports);
export const useReportsLoading = () => useReportsStore((state) => state.loading);
export const useReportById = (id: string | null) =>
  useReportsStore((state) => 
    id ? state.reports.find((r) => r.id === id) ?? null : null
  );

// Templates selectors
export const useTemplates = () => useReportTemplatesStore((state) => state.templates);
export const useTemplateById = (id: string | null) =>
  useReportTemplatesStore((state) => 
    id ? state.templates.find((t) => t.id === id) ?? null : null
  );

// Summary selectors
export const useReportSummaries = () => useReportSummaryStore((state) => state.summaries);
export const useReportSummaryById = (id: string | null) =>
  useReportSummaryStore((state) => 
    id ? state.summaries.find((s) => s.id === id) ?? null : null
  );
```

---

## 5. useRapportData Hook

Central hook som kombinerar stores med API-operationer:

```typescript
// lib/rapport/useRapportData.ts
export function useRapportData() {
  // Selectors
  const reports = useReports();
  const templates = useTemplates();
  const sections = useSections();
  
  // Memoized filtered data (A3)
  const filteredReports = useMemo(() => {
    if (reports.length === 0) return [];
    // Early return for default filter/sort
    if (isDefaultFilter && isDefaultSort) return reports;
    return rapportApi.applyFilter(reports, filter);
  }, [reports, filter, sort]);
  
  // CRUD operations
  const createReport = useCallback(async (data) => { ... }, []);
  const updateReport = useCallback(async (id, updates) => { ... }, []);
  const deleteReport = useCallback(async (id) => { ... }, []);
  
  return {
    reports,
    templates,
    filteredReports,
    createReport,
    updateReport,
    deleteReport,
    // ...
  };
}
```

---

## 6. Lokal UI-State (A2)

UI-specifik state hanteras lokalt, INTE i global store:

```typescript
// ❌ FEL: Global store för UI-state
const { loading, saving } = useSimpleReportStore();

// ✅ RÄTT: Lokal state för UI
function ReportEditor() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // ...
}
```

---

## 7. Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Component                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Local UI State  │  │ useRapportData  │                   │
│  │ (loading, etc)  │  │ (hook)          │                   │
│  └─────────────────┘  └────────┬────────┘                   │
└────────────────────────────────┼────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │       Selectors         │
                    │  useReports()           │
                    │  useTemplates()         │
                    │  useReportById(id)      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴────────┐  ┌───────────┴───────────┐  ┌───────┴───────┐
│ useReportsStore │  │ useReportTemplatesStore│  │ useSummaryStore│
└─────────────────┘  └───────────────────────┘  └───────────────┘
```

---

## 8. Best Practices

### DO ✅

- Använd selectors för att läsa data
- Håll UI-state lokal i komponenter
- Använd `useCallback` för handlers som skickas som props
- Använd `memo()` för list items
- Ladda fullständig data on-demand

### DON'T ❌

- Läs hela store-objektet direkt
- Lagra `loading`/`saving` i global store
- Skapa nya objekt i selectors (orsakar re-renders)
- Mutera state direkt

---

## 9. Migration från V2

### Före (V2)

```typescript
// Direkt store-access
const { reports, loading, setLoading } = useReportsStore();
```

### Efter (V3)

```typescript
// Selectors + lokal state
const reports = useReports();
const [isLoading, setIsLoading] = useState(false);
```

---

## 10. Relaterade Dokument

- [ARCHITECTURE.md](./ARCHITECTURE.md) – Övergripande arkitektur
- [DATA_MODEL.md](./DATA_MODEL.md) – Datamodeller
- [PDF_PIPELINE.md](./PDF_PIPELINE.md) – PDF-generering
