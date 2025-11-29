# AI Development Guide – V3

> **Version:** 3.0  
> **Last Updated:** 2025-11-27  
> **VIKTIGT:** Detta dokument är OBLIGATORISKT för alla AI-modeller som arbetar i denna kodbas.

---

## 🚨 KRITISKA REGLER

### 1. Version = 3 ALLTID

```typescript
// ✅ ALLTID sätt version = 3
const report: ReportV3 = {
  ...data,
  version: 3,  // OBLIGATORISKT
};

// ❌ ALDRIG skapa V2-entiteter
const report = { version: 2 };  // FÖRBJUDET
```

### 2. INGEN React-PDF

```typescript
// ❌ FÖRBJUDET
import { Document } from "@react-pdf/renderer";
import { ReportDocument } from "@/legacy/report-pdf/ReportDocument";

// ✅ ANVÄND HTML-pipeline
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";
```

### 3. INGEN Legacy-kod

```typescript
// ❌ FÖRBJUDET - Importera från legacy/
import { RapportContainer } from "@/legacy/rapport-container";
import { buildReportData } from "@/legacy/report-pdf/buildReportData";

// ✅ ANVÄND V3-komponenter
import { RapportPageNew } from "@/components/rapport/RapportPageNew";
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";
```

---

## 📁 FILSTRUKTUR

### Var ska ny kod placeras?

| Typ | Plats |
|-----|-------|
| Rapport-logik | `lib/rapport/` |
| Rapport-komponenter | `components/rapport/` |
| Report Studio | `components/report-studio-v2/` |
| Zustand stores | `lib/stores/` |
| Types | `lib/types/rapport.ts` |
| API routes | `app/api/reports/` |

### Var ska INTE ny kod placeras?

| Plats | Anledning |
|-------|-----------|
| `legacy/` | Deprecated |
| `stores/reportBuilderStore.ts` | Legacy |
| `stores/pdfStructureStore.ts` | Legacy |
| `lib/store.ts` | Endast re-exports |

---

## 🏗 ARKITEKTUR

### Datamodell

```
ReportTemplateV3
    │
    ├── TemplateSectionV3[]
    │
    └── designId: "standard" | "modern_hero"

ReportV3
    │
    ├── SectionInstanceV3[]
    │
    ├── checklist: ReportChecklistItem[]
    │
    ├── assets: ReportAsset[]
    │
    └── metadata: ReportMetadata
```

### State Management

```
┌─────────────────────────────────────────┐
│           useRapportData()              │
│  (Central hook för all rapport-data)   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
useReportsStore  useTemplatesStore  useSectionsStore
```

### PDF Pipeline

```
Report + Template + Profile
         │
         ▼
  generatePdfHtml()
         │
         ▼
    HTML string
         │
         ▼
  window.print() / Puppeteer
```

---

## ✅ CHECKLISTA FÖR ÄNDRINGAR

### Innan du börjar

- [ ] Läs `docs/architecture/ARCHITECTURE.md`
- [ ] Förstå V3-datamodellen
- [ ] Identifiera rätt filer att ändra

### Under utveckling

- [ ] Använd TypeScript strikt mode
- [ ] Använd selectors för store-access (A1)
- [ ] Håll UI-state lokal (A2)
- [ ] Använd early returns i useMemo (A3)
- [ ] Lazy-loada tunga komponenter (A4)
- [ ] Debounce tunga operationer (A5)

### Innan commit

- [ ] `npm run lint` passerar
- [ ] `npx tsc --noEmit` passerar
- [ ] Inga imports från `legacy/`
- [ ] Alla nya entiteter har `version: 3`

---

## 🔧 VANLIGA UPPGIFTER

### Skapa ny rapport-typ

1. Lägg till i `ReportTrade`:
```typescript
// lib/types/rapport.ts
type ReportTrade = "bygg" | "läckage" | "elektriker" | "ny_typ";
```

2. Skapa profil:
```typescript
// lib/rapport/pdfProfiles.ts
export const NY_TYP_PROFILE: PdfProfile = {
  trade: "ny_typ",
  name: "Ny Typ",
  primaryColor: "#...",
  // ...
};
```

### Lägga till ny sektionstyp

1. Uppdatera `SimpleSectionType`:
```typescript
// lib/types/rapport.ts
type SimpleSectionType = "text" | "images" | "ny_typ";
```

2. Skapa content-interface:
```typescript
interface NyTypSectionContent {
  // ...
}
```

3. Uppdatera rendering i `generatePdfHtml`

### Skapa ny PDF-design

1. Lägg till i `PDF_DESIGNS`:
```typescript
// lib/rapport/pdfDesigns.ts
export const PDF_DESIGNS: Record<PdfDesignId, PdfDesign> = {
  standard: { ... },
  modern_hero: { ... },
  ny_design: {
    id: "ny_design",
    name: "Ny Design",
    // ...
  },
};
```

2. Uppdatera `PdfDesignId`:
```typescript
type PdfDesignId = "standard" | "modern_hero" | "ny_design";
```

---

## ⚠️ VANLIGA MISSTAG

### 1. Glömmer version = 3

```typescript
// ❌ FEL
const report = { title: "Test" };

// ✅ RÄTT
const report: ReportV3 = { title: "Test", version: 3, ... };
```

### 2. Importerar från legacy

```typescript
// ❌ FEL
import { something } from "@/legacy/...";

// ✅ RÄTT
import { something } from "@/lib/rapport/...";
```

### 3. Använder hela store

```typescript
// ❌ FEL
const store = useReportsStore();
const reports = store.reports;

// ✅ RÄTT
const reports = useReports();
```

### 4. Global UI-state

```typescript
// ❌ FEL
const { loading } = useGlobalStore();

// ✅ RÄTT
const [isLoading, setIsLoading] = useState(false);
```

### 5. Synkrona params (Next.js 15)

```typescript
// ❌ FEL
export async function GET(req, { params }: { params: { id: string } }) {
  const { id } = params;
}

// ✅ RÄTT
export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

---

## 📚 REFERENSDOKUMENT

| Dokument | Innehåll |
|----------|----------|
| `docs/architecture/ARCHITECTURE.md` | Övergripande arkitektur |
| `docs/architecture/DATA_MODEL.md` | Datamodeller |
| `docs/architecture/STATE_MANAGEMENT.md` | State management |
| `docs/architecture/PDF_PIPELINE.md` | PDF-generering |
| `docs/dev/CODING_GUIDELINES.md` | Kodstandard |

---

## 🆘 HJÄLP

### Osäker på något?

1. Läs relevant dokumentation i `docs/`
2. Kolla befintlig kod i `lib/rapport/`
3. Fråga användaren om förtydligande

### Hittar du legacy-kod?

1. Skapa INTE nya beroenden till den
2. Om möjligt, refaktorera till V3
3. Flytta till `legacy/` om den måste behållas

---

## 🔒 SÄKERHET

### API-nycklar

```typescript
// ❌ ALDRIG exponera nycklar
return { apiKey: process.env.VAPI_API_KEY };

// ✅ Maskera eller utelämna
return { hasApiKey: true, keyLast4: "xxxx" };
```

### Validering

```typescript
// ✅ Validera alltid input
const schema = z.object({
  title: z.string().min(1),
  status: z.enum(["draft", "review", "approved"]),
});

const result = schema.safeParse(input);
if (!result.success) {
  return { error: result.error };
}
```

---

**SLUTORD:** Följ dessa regler strikt. Vid tveksamhet, fråga användaren. Skapa ALDRIG V2-kod eller beroenden till legacy-filer.
