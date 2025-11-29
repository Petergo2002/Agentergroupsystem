# Contributing Guide

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Kom igång

### 1.1 Förutsättningar

- Node.js 18+
- npm/yarn/pnpm
- Git
- Supabase CLI (valfritt)

### 1.2 Installation

```bash
# Klona repo
git clone <repo-url>
cd agentergroupsystem

# Installera dependencies
npm install

# Kopiera env-fil
cp .env.example .env.local

# Starta dev-server
npm run dev
```

---

## 2. Projektstruktur

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Autentiserade sidor
│   ├── (public)/           # Publika sidor
│   ├── admin/              # Admin-sidor
│   └── api/                # API routes
├── components/             # React-komponenter
├── lib/                    # Utilities och logik
│   ├── rapport/            # Rapport-logik
│   ├── stores/             # Zustand stores
│   ├── supabase/           # Supabase clients
│   └── types/              # TypeScript types
├── stores/                 # Legacy stores
├── legacy/                 # Deprecated kod
└── docs/                   # Dokumentation
```

---

## 3. Kodstandard

### 3.1 TypeScript

- Strikt mode aktiverat
- Inga `any` utan explicit kommentar
- Interfaces för alla props

```typescript
// ✅ Bra
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ❌ Dåligt
function Button(props: any) { ... }
```

### 3.2 React

- Funktionella komponenter
- Hooks för state och effects
- Memoization där det behövs (A8)

```typescript
// ✅ Bra
const MyComponent = memo(function MyComponent({ data }: Props) {
  const handleClick = useCallback(() => { ... }, []);
  return <button onClick={handleClick}>{data.label}</button>;
});

// ❌ Dåligt
class MyComponent extends React.Component { ... }
```

### 3.3 Imports

```typescript
// 1. React/Next
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import { toast } from "sonner";

// 3. Internal - absolute
import { Button } from "@/components/ui/button";
import { useReports } from "@/lib/store";

// 4. Internal - relative
import { LocalComponent } from "./local-component";

// 5. Types
import type { Report } from "@/lib/types/rapport";
```

---

## 4. Git Workflow

### 4.1 Branches

| Branch | Syfte |
|--------|-------|
| `main` | Produktion |
| `develop` | Utveckling |
| `feature/*` | Nya features |
| `fix/*` | Bugfixar |
| `refactor/*` | Refaktorering |

### 4.2 Commit Messages

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` – Ny feature
- `fix` – Buggfix
- `refactor` – Refaktorering
- `docs` – Dokumentation
- `style` – Formatering
- `test` – Tester
- `chore` – Övrigt

**Exempel:**

```
feat(rapport): add PDF export with modern_hero design

- Implement generatePdfHtml for modern_hero
- Add design selector in export dialog
- Update PDF_DESIGNS constant

Closes #123
```

### 4.3 Pull Requests

1. Skapa branch från `develop`
2. Implementera ändringar
3. Kör tester: `npm test`
4. Kör lint: `npm run lint`
5. Skapa PR mot `develop`
6. Vänta på code review
7. Squash merge

---

## 5. Testning

### 5.1 Enhetstester

```bash
# Kör alla tester
npm test

# Kör specifik fil
npm test -- __tests__/lib/rapport.test.ts

# Watch mode
npm test -- --watch
```

### 5.2 Teststruktur

```typescript
// __tests__/lib/rapport.test.ts
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";

describe("generatePdfHtml", () => {
  it("should generate valid HTML", () => {
    const html = generatePdfHtml(mockReport, mockTemplate, mockProfile);
    expect(html).toContain("<html>");
    expect(html).toContain(mockReport.title);
  });
});
```

---

## 6. Linting

### 6.1 ESLint

```bash
# Kör lint
npm run lint

# Fixa automatiskt
npm run lint -- --fix
```

### 6.2 Prettier

```bash
# Formatera
npm run format

# Kolla formatering
npm run format:check
```

---

## 7. Dokumentation

### 7.1 Kod-kommentarer

```typescript
/**
 * Genererar PDF HTML för en rapport.
 * 
 * @param report - Rapportinstans
 * @param template - Rapportmall
 * @param profile - Trade-specifik profil
 * @returns HTML-sträng
 */
function generatePdfHtml(
  report: Report,
  template: ReportTemplate,
  profile: PdfProfile
): string {
  // ...
}
```

### 7.2 README-uppdateringar

Vid nya features, uppdatera:
- `README.md` – Översikt
- Relevant doc i `docs/`

---

## 8. V3 Specifikt

### 8.1 Rapport-system

- Använd ALLTID `ReportTemplateV3`, `ReportV3`, etc.
- Sätt `version: 3` på alla nya entiteter
- Använd `generatePdfHtml` för PDF (INTE React-PDF)

### 8.2 State Management

- Använd selectors från `lib/stores/rapportStores.ts`
- Håll UI-state lokal (A2)
- Använd `useCallback`/`useMemo` där det behövs (A8)

### 8.3 Legacy

- Rör INTE filer i `legacy/`
- Skapa INTE nya beroenden till legacy-kod
- Vid refaktorering, flytta till `legacy/` istället för att radera

---

## 9. Deployment

### 9.1 Preview

```bash
# Bygg för produktion
npm run build

# Starta preview
npm run start
```

### 9.2 Vercel

Automatisk deployment vid push till:
- `main` → Produktion
- `develop` → Preview

---

## 10. Hjälp

- **Frågor:** Skapa issue på GitHub
- **Buggar:** Skapa issue med `bug` label
- **Features:** Skapa issue med `enhancement` label

---

## 11. Relaterade Dokument

- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) – Kodstandard
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) – Projektstruktur
- [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md) – AI-utvecklingsguide
