# Report Studio – V3 Feature Guide

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

Report Studio är administratörsverktyget för att skapa och hantera rapportmallar (`ReportTemplateV3`). Det är tillgängligt via:

- `/report-studio` – Användare
- `/admin/report-studio` – Admin (PDF-designs)

---

## 2. Funktioner

### 2.1 Mallhantering

| Funktion | Beskrivning |
|----------|-------------|
| Skapa mall | Ny `ReportTemplateV3` med sektioner |
| Redigera mall | Uppdatera namn, beskrivning, sektioner |
| Duplicera mall | Kopiera befintlig mall |
| Radera mall | Ta bort mall (soft delete) |

### 2.2 Sektionshantering

| Funktion | Beskrivning |
|----------|-------------|
| Lägg till sektion | Ny `TemplateSectionV3` |
| Ordna sektioner | Drag-and-drop |
| Redigera sektion | Titel, typ, defaultContent |
| Ta bort sektion | Radera från mall |

### 2.3 PDF-design

| Funktion | Beskrivning |
|----------|-------------|
| Välj design | `standard` eller `modern_hero` |
| Förhandsgranska | Live preview av PDF |
| Spara design | Koppla till mall |

---

## 3. Komponenter

### 3.1 Filstruktur

```
components/report-studio-v2/
├── index.ts                    # Exports
├── report-studio-v2.tsx        # Huvudkomponent
├── template-list.tsx           # Mallista
├── template-editor.tsx         # Mallredigerare
├── section-editor.tsx          # Sektionsredigerare
├── pdf-designer.tsx            # PDF-design preview
└── designs-manager.tsx         # Admin: hantera designs
```

### 3.2 ReportStudioV2

Huvudkomponent som lazy-loadas:

```typescript
// app/(dashboard)/report-studio/page.tsx
const ReportStudioV2 = dynamic(
  () => import("@/components/report-studio-v2").then((mod) => mod.ReportStudioV2),
  { loading: () => <Loader />, ssr: false }
);
```

---

## 4. State Management

### 4.1 Store

```typescript
// stores/simpleReportStore.ts
interface SimpleReportStore {
  templates: SimpleReportTemplate[];
  selectedTemplateId: string | null;
  
  // Actions
  loadTemplates: () => Promise<void>;
  createTemplate: (data) => Promise<void>;
  updateTemplate: (id, updates) => Promise<void>;
  deleteTemplate: (id) => Promise<void>;
}
```

### 4.2 Selectors

```typescript
const templates = useSimpleReportStore((state) => state.templates);
const selectedTemplate = useSimpleReportStore((state) => 
  state.templates.find(t => t.id === state.selectedTemplateId)
);
```

---

## 5. Dataflöde

### 5.1 Skapa mall

```
┌─────────────────────────────────────────────────────────────┐
│  1. Användare fyller i mallformulär                         │
│     - Namn, beskrivning, trade                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. createTemplate() anropas                                │
│     - Validerar data                                        │
│     - Sätter version = 3                                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. mapTemplateToDb() konverterar                           │
│     - sections → JSON                                       │
│     - designId → design_id                                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Supabase INSERT                                         │
│     - report_templates tabell                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Store uppdateras                                        │
│     - addTemplate()                                         │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Lägg till sektion

```typescript
function addSection(templateId: string, section: TemplateSectionV3) {
  const template = templates.find(t => t.id === templateId);
  
  const updatedSections = [
    ...template.sections,
    {
      ...section,
      id: generateId(),
      order: template.sections.length + 1,
    }
  ];
  
  updateTemplate(templateId, { sections: updatedSections });
}
```

---

## 6. Sektionstyper

### 6.1 Text

```typescript
{
  id: "sec_001",
  title: "Inledning",
  type: "text",
  order: 1,
  required: true,
  defaultContent: "Denna rapport beskriver..."
}
```

### 6.2 Images

```typescript
{
  id: "sec_002",
  title: "Bilder",
  type: "images",
  order: 2,
  required: false,
  imageSettings: {
    maxImages: 10,
    allowAnnotations: true
  }
}
```

---

## 7. PDF-design Preview

### 7.1 Debounced Preview (A5)

```typescript
// components/report-studio-v2/pdf-designer.tsx
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

### 7.2 Design-val

```typescript
const designs: PdfDesignId[] = ["standard", "modern_hero"];

function selectDesign(designId: PdfDesignId) {
  updateTemplate(templateId, { designId });
}
```

---

## 8. Admin: Designs Manager

Endast för super admins via `/admin/report-studio`.

### 8.1 Funktioner

- Lista alla PDF-designs
- Förhandsgranska designs
- Aktivera/inaktivera designs per organisation

### 8.2 Komponent

```typescript
// app/admin/report-studio/page.tsx
const DesignsManager = dynamic(
  () => import("@/components/report-studio-v2/designs-manager"),
  { ssr: false }
);
```

---

## 9. Validering

### 9.1 Mall

```typescript
function validateTemplate(template: SimpleReportTemplate): boolean {
  if (!template.name?.trim()) {
    throw new Error("Mallnamn krävs");
  }
  
  if (!template.trade) {
    throw new Error("Trade krävs");
  }
  
  if (!["standard", "modern_hero"].includes(template.designId ?? "standard")) {
    throw new Error("Ogiltig design");
  }
  
  return true;
}
```

### 9.2 Sektion

```typescript
function validateSection(section: TemplateSectionV3): boolean {
  if (!section.title?.trim()) {
    throw new Error("Sektionstitel krävs");
  }
  
  if (!["text", "images"].includes(section.type)) {
    throw new Error("Ogiltig sektionstyp");
  }
  
  return true;
}
```

---

## 10. Keyboard Shortcuts

| Shortcut | Funktion |
|----------|----------|
| `Ctrl+S` | Spara mall |
| `Ctrl+N` | Ny mall |
| `Ctrl+D` | Duplicera mall |
| `Delete` | Radera vald sektion |

---

## 11. Relaterade Dokument

- [REPORT_EDITOR.md](./REPORT_EDITOR.md) – Rapportredigering
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) – Arkitektur
- [DATA_MODEL.md](../architecture/DATA_MODEL.md) – Datamodeller
