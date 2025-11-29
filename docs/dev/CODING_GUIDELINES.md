# Coding Guidelines – V3

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. TypeScript

### 1.1 Strikt Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 1.2 Types vs Interfaces

```typescript
// ✅ Interface för objekt-shapes
interface Report {
  id: string;
  title: string;
}

// ✅ Type för unions, primitives, utilities
type ReportStatus = "draft" | "review" | "approved";
type ReportId = string;
type PartialReport = Partial<Report>;
```

### 1.3 Generics

```typescript
// ✅ Bra: Typad funktion
function findById<T extends { id: string }>(items: T[], id: string): T | null {
  return items.find(item => item.id === id) ?? null;
}

// ❌ Dåligt: any
function findById(items: any[], id: string): any {
  return items.find(item => item.id === id);
}
```

---

## 2. React Komponenter

### 2.1 Funktionella Komponenter

```typescript
// ✅ Bra
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ❌ Dåligt: Class components
class Button extends React.Component { ... }
```

### 2.2 Props Destructuring

```typescript
// ✅ Bra: Destructure i signatur
function Card({ title, children }: CardProps) {
  return <div>{title}{children}</div>;
}

// ❌ Dåligt: props.x överallt
function Card(props: CardProps) {
  return <div>{props.title}{props.children}</div>;
}
```

### 2.3 Memoization (A8)

```typescript
// ✅ Memo för list items
const ReportCard = memo(function ReportCard({ report }: Props) {
  return <div>{report.title}</div>;
});

// ✅ useCallback för handlers som skickas som props
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ✅ useMemo för tunga beräkningar
const filteredReports = useMemo(() => {
  return reports.filter(r => r.status === filter);
}, [reports, filter]);
```

---

## 3. State Management

### 3.1 Zustand Selectors (A1)

```typescript
// ✅ Bra: Selector
const reports = useReportsStore((state) => state.reports);

// ❌ Dåligt: Hela store
const store = useReportsStore();
const reports = store.reports;
```

### 3.2 Lokal UI-State (A2)

```typescript
// ✅ Bra: Lokal state för UI
function Editor() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // ...
}

// ❌ Dåligt: Global store för UI-state
const { loading, saving } = useGlobalStore();
```

### 3.3 Early Returns (A3)

```typescript
// ✅ Bra: Early return
const filteredReports = useMemo(() => {
  if (reports.length === 0) return [];
  if (!filter) return reports;
  return reports.filter(r => r.status === filter);
}, [reports, filter]);

// ❌ Dåligt: Onödig beräkning
const filteredReports = useMemo(() => {
  return reports.filter(r => !filter || r.status === filter);
}, [reports, filter]);
```

---

## 4. Imports

### 4.1 Ordning

```typescript
// 1. React/Next
import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 2. Third-party
import { toast } from "sonner";
import { z } from "zod";

// 3. Internal - UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4. Internal - Logic
import { useReports } from "@/lib/store";
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";

// 5. Internal - Relative
import { LocalHelper } from "./helper";

// 6. Types (always last, with 'type' keyword)
import type { Report, ReportTemplate } from "@/lib/types/rapport";
```

### 4.2 Dynamic Imports (A4/A7)

```typescript
// ✅ Lazy load tunga komponenter
const HeavyComponent = dynamic(
  () => import("@/components/heavy").then(mod => mod.HeavyComponent),
  { loading: () => <Loader />, ssr: false }
);

// ✅ Lazy load tunga bibliotek
let VapiModule: typeof import("@vapi-ai/web") | null = null;
const loadVapi = async () => {
  if (!VapiModule) {
    VapiModule = await import("@vapi-ai/web");
  }
  return VapiModule.default;
};
```

---

## 5. API Routes

### 5.1 Next.js 15 Params

```typescript
// ✅ Bra: Promise params
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

// ❌ Dåligt: Synkrona params (deprecated)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // ...
}
```

### 5.2 Error Handling

```typescript
export async function GET(req: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 6. Styling

### 6.1 Tailwind

```typescript
// ✅ Bra: cn() för conditional classes
import { cn } from "@/lib/utils";

<button className={cn(
  "px-4 py-2 rounded",
  variant === "primary" && "bg-primary text-white",
  variant === "secondary" && "bg-secondary",
  disabled && "opacity-50 cursor-not-allowed"
)} />

// ❌ Dåligt: Template literals
<button className={`px-4 py-2 ${variant === "primary" ? "bg-primary" : ""}`} />
```

### 6.2 CSS Variables

```css
/* globals.css */
:root {
  --primary: 142 76% 36%;
  --secondary: 240 4.8% 95.9%;
}

.dark {
  --primary: 142 76% 46%;
  --secondary: 240 3.7% 15.9%;
}
```

---

## 7. Rapport-specifikt (V3)

### 7.1 Version Invariant

```typescript
// ✅ Alltid version = 3
const report: ReportV3 = {
  ...data,
  version: 3,
};

// ✅ Validera version
if (report.version !== 3) {
  throw new Error("Invalid report version");
}
```

### 7.2 PDF Generation

```typescript
// ✅ Använd HTML-pipeline
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";

const html = generatePdfHtml(report, template, profile);

// ❌ Använd INTE React-PDF
import { Document } from "@react-pdf/renderer"; // DEPRECATED
```

### 7.3 Design ID

```typescript
// ✅ Validera designId
const VALID_DESIGNS: PdfDesignId[] = ["standard", "modern_hero"];

function validateDesignId(id: string): PdfDesignId {
  return VALID_DESIGNS.includes(id as PdfDesignId) 
    ? id as PdfDesignId 
    : "standard";
}
```

---

## 8. Namngivning

### 8.1 Filer

| Typ | Format | Exempel |
|-----|--------|---------|
| Komponenter | PascalCase | `ReportCard.tsx` |
| Hooks | camelCase | `useRapportData.ts` |
| Utilities | camelCase | `pdfGenerator.ts` |
| Types | camelCase | `rapport.ts` |
| Constants | SCREAMING_SNAKE | `PDF_DESIGNS.ts` |

### 8.2 Variabler

```typescript
// ✅ Bra
const isLoading = true;
const reportCount = 5;
const handleClick = () => {};
const PDF_DESIGNS = { ... };

// ❌ Dåligt
const loading = true;  // Oklart om boolean
const count = 5;       // Oklart vad som räknas
const click = () => {}; // Verb saknas
```

---

## 9. Kommentarer

### 9.1 JSDoc

```typescript
/**
 * Genererar PDF HTML för en rapport.
 * 
 * @param report - Rapportinstans med sektioner
 * @param template - Rapportmall
 * @param profile - Trade-specifik profil
 * @returns Komplett HTML-dokument
 * 
 * @example
 * const html = generatePdfHtml(report, template, profile);
 * openPdfPreview(html);
 */
function generatePdfHtml(...): string { ... }
```

### 9.2 Inline-kommentarer

```typescript
// ✅ Bra: Förklarar VARFÖR
// A3: Early return för att undvika onödig filtrering
if (reports.length === 0) return [];

// ❌ Dåligt: Förklarar VAD (uppenbart från koden)
// Return empty array if no reports
if (reports.length === 0) return [];
```

---

## 10. Relaterade Dokument

- [CONTRIBUTING.md](./CONTRIBUTING.md) – Bidragsguide
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) – Projektstruktur
- [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md) – AI-utvecklingsguide
