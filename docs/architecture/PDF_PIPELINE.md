# PDF Pipeline – V3 Architecture

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

V3 använder en **HTML-baserad PDF-pipeline** som ersätter den gamla React-PDF-lösningen. PDF:er genereras genom att rendera HTML-templates och använda webbläsarens print-to-PDF.

### Fördelar

- ✅ Snabbare rendering
- ✅ Enklare styling med CSS
- ✅ Stöd för komplexa layouts
- ✅ Ingen React-PDF dependency
- ✅ Konsekvent utseende mellan preview och export

---

## 2. Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      Report Data                             │
│  ReportV3 + SectionInstanceV3 + ReportMetadata              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    generatePdfHtml()                         │
│  lib/rapport/pdfGenerator.ts                                │
│  - Väljer PDF_DESIGN baserat på designId                    │
│  - Renderar template med data                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PDF_DESIGNS                             │
│  lib/rapport/pdfDesigns.ts                                  │
│  - "standard" (default)                                     │
│  - "modern_hero"                                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTML Output                               │
│  Komplett HTML-dokument med inline CSS                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Print to PDF                              │
│  window.print() / Puppeteer                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Kärnfiler

| Fil | Syfte |
|-----|-------|
| `lib/rapport/pdfGenerator.ts` | Huvudfunktion `generatePdfHtml()` |
| `lib/rapport/pdfDesigns.ts` | Design-definitioner (`PDF_DESIGNS`) |
| `lib/rapport/pdfProfiles.ts` | Profiler för olika trades |
| `lib/rapport/templateEngine.ts` | Template-rendering |

---

## 4. PDF Designs

### 4.1 Design-struktur

```typescript
type PdfDesignId = "standard" | "modern_hero";

interface PdfDesign {
  id: PdfDesignId;
  name: string;
  description: string;
  
  // Layout
  headerTemplate: string;
  sectionTemplate: string;
  footerTemplate: string;
  
  // Styling
  styles: string;
  
  // Options
  showPageNumbers: boolean;
  showTableOfContents: boolean;
}
```

### 4.2 Tillgängliga designs

| Design | Beskrivning |
|--------|-------------|
| `standard` | Klassisk layout med enkel header |
| `modern_hero` | Modern design med hero-bild |

---

## 5. generatePdfHtml()

### 5.1 Signatur

```typescript
function generatePdfHtml(
  report: Report,
  template: ReportTemplate,
  profile: PdfProfile,
  options?: PdfGeneratorOptions
): string;
```

### 5.2 Parametrar

| Parameter | Typ | Beskrivning |
|-----------|-----|-------------|
| `report` | `Report` | Rapportinstans med sektioner |
| `template` | `ReportTemplate` | Mall med struktur |
| `profile` | `PdfProfile` | Trade-specifik profil |
| `options` | `PdfGeneratorOptions` | Valfria inställningar |

### 5.3 Exempel

```typescript
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";
import { getPdfDesign } from "@/lib/rapport/pdfDesigns";
import { getTradeProfile } from "@/lib/rapport/pdfProfiles";

const html = generatePdfHtml(
  report,
  template,
  getTradeProfile(report.type),
  { designId: "modern_hero" }
);
```

---

## 6. PdfProfile

Trade-specifika profiler för styling:

```typescript
interface PdfProfile {
  trade: ReportTrade;
  name: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Logo
  logoUrl?: string;
  
  // Fonts
  headerFont: string;
  bodyFont: string;
}
```

### Tillgängliga profiler

| Trade | Profil |
|-------|--------|
| `bygg` | Byggprofil (blå/grå) |
| `läckage` | Läckageprofil (röd/orange) |
| `elektriker` | Elektrikerprofil (gul/svart) |

---

## 7. Template Engine

### 7.1 Syntax

Templates använder Mustache-liknande syntax:

```html
<div class="header">
  <h1>{{report.title}}</h1>
  <p>Kund: {{report.metadata.client}}</p>
</div>

{{#sections}}
<section class="report-section">
  <h2>{{title}}</h2>
  <div class="content">{{content}}</div>
</section>
{{/sections}}
```

### 7.2 Tillgängliga variabler

| Variabel | Beskrivning |
|----------|-------------|
| `{{report.title}}` | Rapporttitel |
| `{{report.metadata.client}}` | Kundnamn |
| `{{report.metadata.location}}` | Plats |
| `{{report.metadata.scheduledAt}}` | Datum |
| `{{#sections}}...{{/sections}}` | Loop över sektioner |
| `{{section.title}}` | Sektionstitel |
| `{{section.content}}` | Sektionsinnehåll |

---

## 8. Sektionstyper

### 8.1 Text-sektion

```typescript
interface TextSectionContent {
  text: string;
  format?: "plain" | "markdown" | "html";
}
```

### 8.2 Bild-sektion

```typescript
interface ImagesSectionContent {
  images: AnnotatedImage[];
}

interface AnnotatedImage {
  id: string;
  url: string;
  caption?: string;
  annotations?: AnnotationShape[];
}
```

---

## 9. Export-flöde

### 9.1 Preview

```typescript
// Generera HTML för preview
const html = generatePdfHtml(report, template, profile);

// Visa i iframe
<iframe srcDoc={html} />
```

### 9.2 Download

```typescript
// Öppna i nytt fönster för print
function openPdfPreview(html: string) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}
```

### 9.3 Server-side (Puppeteer)

```typescript
// API route: /api/reports/[id]/pdf
import puppeteer from "puppeteer";

export async function GET(req, { params }) {
  const html = generatePdfHtml(report, template, profile);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  
  await browser.close();
  
  return new Response(pdf, {
    headers: { "Content-Type": "application/pdf" },
  });
}
```

---

## 10. Styling

### 10.1 Print-specifik CSS

```css
@media print {
  .no-print { display: none; }
  
  .page-break { page-break-before: always; }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### 10.2 A4-dimensioner

```css
@page {
  size: A4;
  margin: 20mm;
}

.page {
  width: 210mm;
  min-height: 297mm;
}
```

---

## 11. Legacy (Deprecated)

Följande är **DEPRECATED** och ska INTE användas:

| Fil | Status |
|-----|--------|
| `legacy/report-pdf/ReportDocument.tsx` | ❌ React-PDF |
| `legacy/report-pdf/buildReportData.ts` | ❌ Legacy data mapping |
| `legacy/app/api/reports/preview/pdf/route.ts` | ❌ Legacy API |

---

## 12. Relaterade Dokument

- [ARCHITECTURE.md](./ARCHITECTURE.md) – Övergripande arkitektur
- [DATA_MODEL.md](./DATA_MODEL.md) – Datamodeller
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) – State management
