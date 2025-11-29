# Report Editor – V3 Feature Guide

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

Report Editor är verktyget för att skapa och redigera rapporter (`ReportV3`). Det är tillgängligt via:

- `/rapport` – Rapportlista
- `/rapport/[id]/edit` – Redigera rapport
- `/rapport/[id]/print` – Print-vy

---

## 2. Funktioner

### 2.1 Rapporthantering

| Funktion | Beskrivning |
|----------|-------------|
| Skapa rapport | Ny `ReportV3` från mall |
| Redigera rapport | Uppdatera sektioner, metadata |
| Duplicera rapport | Kopiera befintlig rapport |
| Radera rapport | Ta bort rapport |
| Exportera PDF | Generera och ladda ner PDF |
| Dela rapport | Skapa publik länk |

### 2.2 Sektionsredigering

| Funktion | Beskrivning |
|----------|-------------|
| Text-sektion | Redigera text med editor |
| Bild-sektion | Ladda upp och annotera bilder |
| Status | Markera sektion som klar |

---

## 3. Komponenter

### 3.1 Filstruktur

```
components/rapport/
├── RapportPageNew.tsx          # Huvudsida
├── RapportListPanel.tsx        # Rapportlista
├── RapportDetailPanel.tsx      # Rapportdetaljer
├── CreateReportWizard.tsx      # Skapa-wizard
├── rapport-settings-simple.tsx # Inställningar
├── ExportDialog.tsx            # Export-dialog
└── image-annotation-canvas.tsx # Bildannotering
```

### 3.2 Lazy Loading (A4/A7)

```typescript
// app/(dashboard)/rapport/page.tsx
const RapportPageNew = dynamic(
  () => import("@/components/rapport/RapportPageNew").then((mod) => mod.RapportPageNew),
  { loading: () => <Loader />, ssr: false }
);
```

---

## 4. State Management

### 4.1 useRapportData Hook

Central hook för all rapportdata:

```typescript
const {
  // Data
  reports,
  templates,
  filteredReports,
  draftReports,
  archivedReports,
  selectedReport,
  
  // Loading
  isLoading,
  isLoadingReports,
  
  // Filter/Sort
  filter,
  setFilter,
  sort,
  setSort,
  
  // Actions
  selectReport,
  createReport,
  updateReport,
  deleteReport,
  duplicateReport,
  exportReport,
  openPdf,
  
  // Autosave
  autosaveStatus,
} = useRapportData();
```

### 4.2 Memoization (A3)

```typescript
const filteredReports = useMemo(() => {
  // Early return för tom lista
  if (reports.length === 0) return [];
  
  // Early return för default filter
  const isDefaultFilter = !filter.search && !filter.status;
  const isDefaultSort = sort.field === "updatedAt" && sort.direction === "desc";
  
  if (isDefaultFilter && isDefaultSort) {
    return reports;
  }
  
  let result = rapportApi.applyFilter(reports, filter);
  result = rapportApi.applySort(result, sort);
  return result;
}, [reports, filter, sort]);
```

---

## 5. Rapportflöde

### 5.1 Skapa rapport

```
┌─────────────────────────────────────────────────────────────┐
│  1. Användare klickar "Ny rapport"                          │
│     → CreateReportWizard öppnas                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Välj mall                                               │
│     - Lista över ReportTemplateV3                           │
│     - Förhandsvisning av sektioner                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Fyll i metadata                                         │
│     - Kund, plats, datum                                    │
│     - Prioritet                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. createReport() anropas                                  │
│     - Kopierar mall-sektioner → SectionInstanceV3           │
│     - Sätter version = 3                                    │
│     - Sparar till Supabase                                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Navigera till /rapport/[id]/edit                        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Redigera rapport

```
┌─────────────────────────────────────────────────────────────┐
│  Edit-sida: /rapport/[id]/edit                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Sektionslista (vänster)                            │   │
│  │  - Klicka för att välja sektion                     │   │
│  │  - Status-indikator (tom/pågående/klar)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Sektionseditor (höger)                             │   │
│  │  - Text: Rich text editor                           │   │
│  │  - Images: Bilduppladdning + annotering             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Actions                                            │   │
│  │  - Spara (autosave)                                 │   │
│  │  - Förhandsgranska                                  │   │
│  │  - Exportera PDF                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Sektionstyper

### 6.1 Text-sektion

```typescript
interface TextSectionContent {
  text: string;
  format?: "plain" | "markdown" | "html";
}

// Rendering
function TextSectionEditor({ section, onChange }) {
  return (
    <Textarea
      value={section.content.text}
      onChange={(e) => onChange({
        ...section,
        content: { text: e.target.value }
      })}
    />
  );
}
```

### 6.2 Bild-sektion

```typescript
interface ImagesSectionContent {
  images: AnnotatedImage[];
}

// Rendering
function ImagesSectionEditor({ section, onChange }) {
  return (
    <div>
      <ImageUploader onUpload={handleUpload} />
      <ImageGrid images={section.content.images} />
      <ImageAnnotationCanvas
        image={selectedImage}
        onAnnotate={handleAnnotate}
      />
    </div>
  );
}
```

---

## 7. Bildannotering

### 7.1 Canvas-komponent

```typescript
// components/rapport/image-annotation-canvas.tsx
interface ImageAnnotationCanvasProps {
  imageUrl: string;
  shapes: AnnotationShape[];
  onChange: (shapes: AnnotationShape[]) => void;
  readOnly?: boolean;
}
```

### 7.2 Annotationstyper

| Typ | Beskrivning |
|-----|-------------|
| `arrow` | Pil med start- och slutpunkt |
| `circle` | Cirkel med centrum och radie |

---

## 8. Autosave

### 8.1 Implementation

```typescript
const AUTOSAVE_DELAY_MS = 2000;

function useAutosave(report: Report, updateReport: Function) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setStatus("saving");
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await updateReport(report.id, report);
        setStatus("saved");
      } catch (error) {
        setStatus("error");
      }
    }, AUTOSAVE_DELAY_MS);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [report]);
  
  return status;
}
```

---

## 9. Export

### 9.1 PDF Export

```typescript
async function exportPdf(report: Report, template: ReportTemplate) {
  const profile = getTradeProfile(report.type);
  const html = generatePdfHtml(report, template, profile);
  
  // Öppna print-dialog
  openPdfPreview(html);
  
  // Uppdatera exportedAt
  await updateReport(report.id, {
    exportedAt: new Date().toISOString(),
    status: "approved"
  });
}
```

### 9.2 Dela rapport

```typescript
async function shareReport(reportId: string) {
  const publicId = generatePublicId();
  
  await updateReport(reportId, { publicId });
  
  return `${window.location.origin}/rapport/public/${publicId}`;
}
```

---

## 10. Filter & Sortering

### 10.1 Filter

```typescript
interface ReportFilter {
  search?: string;
  status?: ReportStatus;
  templateId?: string;
  priority?: "high" | "medium" | "low";
  client?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

### 10.2 Sortering

```typescript
interface ReportSortOptions {
  field: "updatedAt" | "createdAt" | "title" | "client" | "priority" | "status";
  direction: "asc" | "desc";
}
```

---

## 11. Memoized List Items (A8)

```typescript
// components/rapport/RapportListPanel.tsx
const ReportCard = memo(function ReportCard({
  report,
  isSelected,
  onClick
}: ReportCardProps) {
  return (
    <button onClick={onClick} className={...}>
      <h3>{report.title}</h3>
      <p>{report.metadata.client}</p>
      <Badge>{report.status}</Badge>
    </button>
  );
});
```

---

## 12. Relaterade Dokument

- [REPORT_STUDIO.md](./REPORT_STUDIO.md) – Mallhantering
- [PUBLIC_VIEWER.md](./PUBLIC_VIEWER.md) – Publik vy
- [PDF_PIPELINE.md](../architecture/PDF_PIPELINE.md) – PDF-generering
