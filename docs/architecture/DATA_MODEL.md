# Data Model – V3 Architecture

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

V3-datamodellen består av fyra huvudentiteter:

| Entitet | Beskrivning |
|---------|-------------|
| `ReportTemplateV3` | Rapportmall med sektionsdefinitioner |
| `TemplateSectionV3` | Sektionstyp i mall |
| `ReportV3` | Rapportinstans skapad från mall |
| `SectionInstanceV3` | Konkret sektionsinstans i rapport |

---

## 2. ReportTemplateV3

Mall som definierar rapportens struktur.

### 2.1 Interface

```typescript
interface ReportTemplateV3 {
  id: string;
  name: string;
  description?: string;
  trade: ReportTrade;
  version: 3;  // Alltid 3 för V3
  
  // Sektioner
  sections: TemplateSectionV3[];
  
  // PDF-design
  designId: PdfDesignId;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  organizationId?: string;
}

type ReportTrade = "bygg" | "läckage" | "elektriker";
type PdfDesignId = "standard" | "modern_hero";
```

### 2.2 Databas-schema

```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trade TEXT NOT NULL DEFAULT 'bygg',
  version INTEGER NOT NULL DEFAULT 3,
  sections JSONB NOT NULL DEFAULT '[]',
  design_id TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id)
);
```

---

## 3. TemplateSectionV3

Sektionsdefinition i en mall.

### 3.1 Interface

```typescript
interface TemplateSectionV3 {
  id: string;
  title: string;
  type: SimpleSectionType;
  order: number;
  required: boolean;
  
  // Förifyllt innehåll
  defaultContent?: string;
  
  // Bildinställningar (för images-typ)
  imageSettings?: {
    maxImages: number;
    allowAnnotations: boolean;
  };
}

type SimpleSectionType = "text" | "images";
```

### 3.2 Exempel

```json
{
  "id": "sec_001",
  "title": "Inledning",
  "type": "text",
  "order": 1,
  "required": true,
  "defaultContent": "Denna rapport beskriver..."
}
```

---

## 4. ReportV3

Rapportinstans skapad från en mall.

### 4.1 Interface

```typescript
interface ReportV3 {
  id: string;
  title: string;
  status: ReportStatus;
  type: ReportTrade;
  templateId: string;
  version: 3;
  
  // Innehåll
  sections: SectionInstanceV3[];
  checklist: ReportChecklistItem[];
  assets: ReportAsset[];
  
  // Metadata
  metadata: ReportMetadata;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  exportedAt?: string | null;
  
  // Delning
  publicId?: string | null;
  
  // Ägarskap
  createdBy?: string;
  organizationId?: string;
}

type ReportStatus = "draft" | "review" | "approved";
```

### 4.2 ReportMetadata

```typescript
interface ReportMetadata {
  client: string;
  location: string;
  priority: "high" | "medium" | "low";
  scheduledAt?: string;
  assignedTo?: string;
  notes?: string;
  designId?: PdfDesignId;
}
```

### 4.3 Databas-schema

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  type TEXT NOT NULL DEFAULT 'bygg',
  template_id UUID REFERENCES report_templates(id),
  version INTEGER NOT NULL DEFAULT 3,
  sections JSONB NOT NULL DEFAULT '[]',
  checklist JSONB NOT NULL DEFAULT '[]',
  assets JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  exported_at TIMESTAMPTZ,
  public_id TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id)
);
```

---

## 5. SectionInstanceV3

Konkret sektionsinstans i en rapport.

### 5.1 Interface

```typescript
interface SectionInstanceV3 {
  id: string;
  templateSectionId: string;
  title: string;
  type: SimpleSectionType;
  order: number;
  status: SectionStatus;
  
  // Innehåll (beroende på typ)
  content: TextSectionContent | ImagesSectionContent;
}

type SectionStatus = "empty" | "in_progress" | "completed";
```

### 5.2 TextSectionContent

```typescript
interface TextSectionContent {
  text: string;
  format?: "plain" | "markdown" | "html";
}
```

### 5.3 ImagesSectionContent

```typescript
interface ImagesSectionContent {
  images: AnnotatedImage[];
}

interface AnnotatedImage {
  id: string;
  url: string;
  caption?: string;
  tags?: string[];
  annotations?: AnnotationShape[];
  uploadedAt?: string;
}

interface AnnotationShape {
  id: string;
  type: "arrow" | "circle";
  x: number;
  y: number;
  endX?: number;  // För arrow
  endY?: number;  // För arrow
  radius?: number;  // För circle
  color: string;
}
```

---

## 6. ReportAsset

Bilagor och filer kopplade till rapport.

```typescript
interface ReportAsset {
  id: string;
  type: "image" | "document" | "video";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  sectionId?: string;  // Koppling till sektion
}
```

---

## 7. ReportChecklistItem

Checklista för rapport.

```typescript
interface ReportChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category?: string;
  order: number;
}
```

---

## 8. ReportSummary (A6 – Thin State)

Tunn representation för listning.

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

// Konvertering
function toReportSummary(report: Report): ReportSummary {
  return {
    id: report.id,
    title: report.title,
    status: report.status,
    templateId: report.templateId,
    metadata: report.metadata,
    exportedAt: report.exportedAt,
    updatedAt: report.updatedAt,
    createdAt: report.createdAt,
    type: report.type,
    publicId: report.publicId,
  };
}
```

---

## 9. Dataflöde

### 9.1 Skapa rapport från mall

```
ReportTemplateV3
      │
      ▼
┌─────────────────────────────────────┐
│  createReportFromTemplate()         │
│  - Kopierar sections → instances    │
│  - Sätter version = 3               │
│  - Initierar metadata               │
└─────────────────────────────────────┘
      │
      ▼
ReportV3 (med SectionInstanceV3[])
```

### 9.2 Spara till databas

```typescript
// Template → DB
function mapTemplateToDb(template: ReportTemplateV3) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    trade: template.trade,
    version: 3,
    sections: JSON.stringify(template.sections),
    design_id: template.designId,
  };
}

// DB → Template
function mapDbToTemplate(row: DbRow): ReportTemplateV3 {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    trade: row.trade as ReportTrade,
    version: 3,
    sections: JSON.parse(row.sections),
    designId: row.design_id as PdfDesignId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

---

## 10. Validering

### 10.1 Version Invariant

```typescript
function validateReport(report: Report): boolean {
  // V3 reports MUST have version = 3
  if (report.version !== 3) {
    throw new Error("Invalid report version");
  }
  
  // All sections must have valid type
  for (const section of report.sections) {
    if (!["text", "images"].includes(section.type)) {
      throw new Error(`Invalid section type: ${section.type}`);
    }
  }
  
  return true;
}
```

### 10.2 Design ID Validering

```typescript
const VALID_DESIGN_IDS: PdfDesignId[] = ["standard", "modern_hero"];

function validateDesignId(designId: string): PdfDesignId {
  if (!VALID_DESIGN_IDS.includes(designId as PdfDesignId)) {
    return "standard";  // Fallback
  }
  return designId as PdfDesignId;
}
```

---

## 11. Legacy Mapping

För bakåtkompatibilitet med V2-data:

```typescript
function migrateV2ToV3(v2Report: LegacyReport): ReportV3 {
  return {
    ...v2Report,
    version: 3,
    sections: v2Report.sections.map(migrateSection),
    // Sätt default designId om saknas
    metadata: {
      ...v2Report.metadata,
      designId: v2Report.metadata?.designId ?? "standard",
    },
  };
}
```

---

## 12. Relaterade Dokument

- [ARCHITECTURE.md](./ARCHITECTURE.md) – Övergripande arkitektur
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) – State management
- [PDF_PIPELINE.md](./PDF_PIPELINE.md) – PDF-generering
