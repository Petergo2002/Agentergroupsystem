# Public Viewer – V3 Feature Guide

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

Public Viewer är den publika vyn för delade rapporter. Den är tillgänglig via:

- `/rapport/public/[publicId]` – Publik rapportvy

---

## 2. Funktioner

| Funktion | Beskrivning |
|----------|-------------|
| Visa rapport | Read-only vy av rapport |
| Ladda ner PDF | Generera och ladda ner PDF |
| Godkänn rapport | Kund kan godkänna rapport |

---

## 3. URL-struktur

### 3.1 Public ID

Varje delad rapport har ett unikt `publicId`:

```
https://your-domain.com/rapport/public/abc123xyz
```

### 3.2 Generering

```typescript
function generatePublicId(): string {
  return nanoid(12);  // 12 tecken, URL-safe
}
```

---

## 4. API

### 4.1 GET /api/reports/public/[publicId]

Hämta publik rapport.

**Response:**

```json
{
  "id": "uuid",
  "title": "Läckagerapport",
  "status": "approved",
  "type": "läckage",
  "sections": [
    {
      "id": "sec_001",
      "title": "Inledning",
      "type": "text",
      "content": { "text": "..." }
    }
  ],
  "metadata": {
    "client": "Kund AB",
    "location": "Stockholm"
  }
}
```

### 4.2 POST /api/reports/public/[publicId]/approve

Godkänn rapport.

**Request:**

```json
{
  "signature": "base64-encoded-signature",
  "name": "Kund Kundsson",
  "comment": "Godkänd utan anmärkning"
}
```

---

## 5. Komponenter

### 5.1 Filstruktur

```
app/(public)/rapport/public/[publicId]/
└── page.tsx                    # Publik vy

components/rapport/
├── PublicReportView.tsx        # Rapportvisning
├── PublicReportHeader.tsx      # Header med metadata
├── PublicReportSections.tsx    # Sektionsrendering
└── ApprovalDialog.tsx          # Godkännande-dialog
```

---

## 6. Rendering

### 6.1 Server Component

```typescript
// app/(public)/rapport/public/[publicId]/page.tsx
export default async function PublicReportPage({
  params
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params;
  
  const supabase = createServiceClient();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("public_id", publicId)
    .single();
  
  if (!report) {
    notFound();
  }
  
  return <PublicReportView report={report} />;
}
```

### 6.2 Sektionsrendering

```typescript
function PublicReportSections({ sections }: { sections: SectionInstanceV3[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.id} className="report-section">
          <h2>{section.title}</h2>
          
          {section.type === "text" && (
            <div className="prose">
              {section.content.text}
            </div>
          )}
          
          {section.type === "images" && (
            <div className="grid grid-cols-2 gap-4">
              {section.content.images.map((image) => (
                <figure key={image.id}>
                  <img src={image.url} alt={image.caption} />
                  {image.caption && (
                    <figcaption>{image.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
```

---

## 7. PDF Export

### 7.1 Client-side

```typescript
function downloadPdf() {
  const html = generatePdfHtml(report, template, profile);
  openPdfPreview(html);
}
```

### 7.2 Server-side

```typescript
// Via API
const response = await fetch(`/api/reports/${report.id}/pdf`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url);
```

---

## 8. Godkännande

### 8.1 Flöde

```
┌─────────────────────────────────────────────────────────────┐
│  1. Kund klickar "Godkänn rapport"                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ApprovalDialog öppnas                                   │
│     - Signatur (canvas)                                     │
│     - Namn                                                  │
│     - Kommentar (valfritt)                                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. POST /api/reports/public/[publicId]/approve             │
│     - Sparar signatur                                       │
│     - Uppdaterar status → "approved"                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Bekräftelse visas                                       │
│     - "Rapporten är godkänd"                                │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Signatur-komponent

```typescript
function SignatureCanvas({ onSign }: { onSign: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleSign = () => {
    const canvas = canvasRef.current;
    const signature = canvas.toDataURL("image/png");
    onSign(signature);
  };
  
  return (
    <div>
      <canvas ref={canvasRef} className="border" />
      <Button onClick={handleSign}>Signera</Button>
    </div>
  );
}
```

---

## 9. Säkerhet

### 9.1 Ingen autentisering

Publika rapporter kräver INTE inloggning.

### 9.2 Rate Limiting

```typescript
// middleware.ts
if (pathname.startsWith("/rapport/public/")) {
  // Rate limit: 100 req/min per IP
  const ip = request.headers.get("x-forwarded-for");
  if (isRateLimited(ip)) {
    return new Response("Too many requests", { status: 429 });
  }
}
```

### 9.3 Validering

```typescript
// Validera publicId format
const PUBLIC_ID_REGEX = /^[a-zA-Z0-9_-]{12}$/;

if (!PUBLIC_ID_REGEX.test(publicId)) {
  return notFound();
}
```

---

## 10. SEO

### 10.1 Metadata

```typescript
export async function generateMetadata({ params }) {
  const { publicId } = await params;
  const report = await getPublicReport(publicId);
  
  return {
    title: report.title,
    description: `Rapport för ${report.metadata.client}`,
    robots: "noindex, nofollow",  // Ingen indexering
  };
}
```

---

## 11. Styling

### 11.1 Print-optimerad

```css
@media print {
  .no-print {
    display: none;
  }
  
  .page-break {
    page-break-before: always;
  }
}
```

### 11.2 Responsiv

```css
.public-report {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 640px) {
  .public-report {
    padding: 1rem;
  }
}
```

---

## 12. Relaterade Dokument

- [REPORT_EDITOR.md](./REPORT_EDITOR.md) – Rapportredigering
- [PDF_PIPELINE.md](../architecture/PDF_PIPELINE.md) – PDF-generering
- [API_OVERVIEW.md](../architecture/API_OVERVIEW.md) – API-dokumentation
