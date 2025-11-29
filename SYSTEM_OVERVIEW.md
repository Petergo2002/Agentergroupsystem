# System Overview – Agenter Group System

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Vad är detta?

**Agenter Group System** är en modern SaaS-plattform för:

- 📋 **Rapporthantering** – Skapa, redigera och exportera professionella rapporter
- 📅 **Kalender & CRM** – Hantera kunder, leads, jobb och uppgifter
- 🤖 **AI-assistenter** – Vapi-integration för röst- och chattassistenter
- 🏢 **Multi-tenant** – Stöd för flera organisationer

---

## 2. Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State** | Zustand |
| **Backend** | Next.js API Routes, Supabase |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **AI** | Vapi (röst/chatt) |
| **PDF** | HTML-baserad pipeline |

---

## 3. Arkitektur

### 3.1 Rapport-system (V3)

```
┌─────────────────────────────────────────────────────────────┐
│                    Report Studio                             │
│  Skapa och hantera rapportmallar (ReportTemplateV3)         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Report Editor                             │
│  Skapa och redigera rapporter (ReportV3)                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PDF Pipeline                              │
│  Generera PDF via HTML (generatePdfHtml)                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Public Viewer                             │
│  Dela och godkänn rapporter                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Datamodell

| Entitet | Beskrivning |
|---------|-------------|
| `ReportTemplateV3` | Rapportmall med sektioner |
| `TemplateSectionV3` | Sektionsdefinition i mall |
| `ReportV3` | Rapportinstans |
| `SectionInstanceV3` | Sektionsinstans i rapport |

### 3.3 State Management

| Store | Innehåll |
|-------|----------|
| `useReportsStore` | Rapporter |
| `useReportTemplatesStore` | Mallar |
| `useReportSectionsStore` | Sektioner |
| `useReportSummaryStore` | Tunn metadata (A6) |

---

## 4. Huvudfunktioner

### 4.1 Rapporter

- ✅ Skapa rapport från mall
- ✅ Redigera text- och bildsektioner
- ✅ Annotera bilder
- ✅ Exportera till PDF
- ✅ Dela via publik länk
- ✅ Kundgodkännande med signatur

### 4.2 Report Studio

- ✅ Skapa och redigera mallar
- ✅ Drag-and-drop sektioner
- ✅ Välj PDF-design
- ✅ Live preview

### 4.3 Kalender & CRM

- ✅ Kalendervy (månad/vecka/dag)
- ✅ Kundhantering
- ✅ Leads-hantering
- ✅ Jobb-hantering
- ✅ Uppgifter

### 4.4 AI-assistenter

- ✅ Vapi-integration
- ✅ Röstsamtal
- ✅ Chattkonversationer
- ✅ Samtalsanalys

---

## 5. Dokumentation

### Arkitektur

| Dokument | Beskrivning |
|----------|-------------|
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | Övergripande arkitektur |
| [DATA_MODEL.md](docs/architecture/DATA_MODEL.md) | Datamodeller |
| [STATE_MANAGEMENT.md](docs/architecture/STATE_MANAGEMENT.md) | State management |
| [PDF_PIPELINE.md](docs/architecture/PDF_PIPELINE.md) | PDF-generering |
| [API_OVERVIEW.md](docs/architecture/API_OVERVIEW.md) | API-dokumentation |

### Features

| Dokument | Beskrivning |
|----------|-------------|
| [REPORT_STUDIO.md](docs/features/REPORT_STUDIO.md) | Report Studio |
| [REPORT_EDITOR.md](docs/features/REPORT_EDITOR.md) | Rapportredigering |
| [PUBLIC_VIEWER.md](docs/features/PUBLIC_VIEWER.md) | Publik vy |

### Utveckling

| Dokument | Beskrivning |
|----------|-------------|
| [CONTRIBUTING.md](docs/dev/CONTRIBUTING.md) | Bidragsguide |
| [CODING_GUIDELINES.md](docs/dev/CODING_GUIDELINES.md) | Kodstandard |
| [PROJECT_STRUCTURE.md](docs/dev/PROJECT_STRUCTURE.md) | Projektstruktur |
| [AI_DEV_GUIDE.md](docs/dev/AI_DEV_GUIDE.md) | AI-utvecklingsguide |

---

## 6. Snabbstart

### 6.1 Installation

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

### 6.2 Miljövariabler

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Vapi (valfritt)
VAPI_API_KEY=xxx
```

---

## 7. Performance Optimizations (A1–A8)

| ID | Optimering | Status |
|----|------------|--------|
| A1 | Domänseparerade stores med selectors | ✅ |
| A2 | Lokal UI-state istället för global | ✅ |
| A3 | Memoization med early returns | ✅ |
| A4 | Lazy loading av tunga komponenter | ✅ |
| A5 | Debounced PDF preview | ✅ |
| A6 | Thin global state (ReportSummary) | ✅ |
| A7 | Bundle-size optimization | ✅ |
| A8 | Re-render minimization | ✅ |

---

## 8. Legacy

Deprecated kod finns i `legacy/` och ska INTE användas för nya features.

Se [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) för detaljer.

---

## 9. Kontakt

- **Issues:** GitHub Issues
- **Dokumentation:** `docs/` katalogen
