# Project Structure – V3

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

```
agentergroupsystem/
├── app/                    # Next.js App Router
├── components/             # React-komponenter
├── lib/                    # Utilities och logik
├── stores/                 # Zustand stores (legacy)
├── legacy/                 # Deprecated kod
├── docs/                   # Dokumentation
├── public/                 # Statiska filer
├── supabase/               # Supabase migrations
└── __tests__/              # Tester
```

---

## 2. App Directory

```
app/
├── (dashboard)/            # Autentiserade sidor
│   ├── page.tsx            # Dashboard
│   ├── rapport/            # Rapporter
│   │   ├── page.tsx        # Rapportlista
│   │   └── [id]/
│   │       ├── edit/       # Redigera rapport
│   │       └── print/      # Print-vy
│   ├── report-studio/      # Report Studio
│   ├── calendar/           # Kalender
│   ├── customers/          # Kunder
│   ├── leads/              # Leads
│   ├── jobs/               # Jobb
│   ├── quotes/             # Offerter
│   ├── invoices/           # Fakturor
│   ├── tasks/              # Uppgifter
│   ├── ai-assistants/      # AI-assistenter
│   ├── settings/           # Inställningar
│   └── studio/             # Alias för report-studio
│
├── (public)/               # Publika sidor
│   └── rapport/
│       └── public/
│           └── [publicId]/ # Publik rapportvy
│
├── admin/                  # Admin-sidor
│   ├── page.tsx            # Admin dashboard
│   ├── organizations/      # Organisationer
│   ├── users/              # Användare
│   ├── ai-assistants/      # AI-assistenter (admin)
│   ├── report-studio/      # PDF-designs
│   └── settings/           # Admin-inställningar
│
├── analytics/              # Analys
│   ├── page.tsx            # Översikt
│   ├── calls/              # Samtalsanalys
│   └── chat/               # Chattanalys
│
├── auth/                   # Autentisering
│   ├── login/              # Inloggning
│   ├── signup/             # Registrering
│   └── callback/           # OAuth callback
│
├── api/                    # API routes
│   ├── reports/            # Rapport-API
│   ├── templates/          # Mall-API
│   ├── admin/              # Admin-API
│   ├── vapi/               # Vapi-integration
│   └── ...
│
├── embed/                  # Inbäddade widgets
│   └── widget/             # Chat-widget
│
├── layout.tsx              # Root layout
├── error.tsx               # Error boundary
└── global-error.tsx        # Global error
```

---

## 3. Components Directory

```
components/
├── ui/                     # shadcn/ui komponenter
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── rapport/                # Rapport-komponenter
│   ├── RapportPageNew.tsx  # Huvudsida
│   ├── RapportListPanel.tsx
│   ├── RapportDetailPanel.tsx
│   ├── CreateReportWizard.tsx
│   ├── ExportDialog.tsx
│   ├── image-annotation-canvas.tsx
│   └── rapport-settings-simple.tsx
│
├── report-studio-v2/       # Report Studio V3
│   ├── index.ts
│   ├── report-studio-v2.tsx
│   ├── template-list.tsx
│   ├── template-editor.tsx
│   ├── section-editor.tsx
│   ├── pdf-designer.tsx
│   └── designs-manager.tsx
│
├── admin/                  # Admin-komponenter
│   ├── organization-settings.tsx
│   ├── organization-members.tsx
│   └── feature-flags-manager.tsx
│
├── calendar/               # Kalender-komponenter
│   ├── calendar-view.tsx
│   ├── calendar-sidebar.tsx
│   └── event-popover-form.tsx
│
├── widget/                 # Widget-komponenter
│   ├── chat-widget-frame.tsx
│   └── voice-widget-frame.tsx
│
├── app-sidebar.tsx         # Huvudnavigation
├── site-header.tsx         # Sidhuvud
└── providers.tsx           # Context providers
```

---

## 4. Lib Directory

```
lib/
├── rapport/                # Rapport-logik (V3)
│   ├── index.ts            # Exports
│   ├── rapportApi.ts       # CRUD operations
│   ├── useRapportData.ts   # Central hook
│   ├── pdfGenerator.ts     # HTML PDF generation
│   ├── pdfDesigns.ts       # PDF_DESIGNS
│   ├── pdfProfiles.ts      # Trade profiles
│   └── templateEngine.ts   # Template rendering
│
├── stores/                 # Zustand stores (V3)
│   └── rapportStores.ts    # Reports, Templates, Sections
│
├── supabase/               # Supabase clients
│   ├── client.ts           # Browser client
│   ├── server.ts           # Server client
│   └── service.ts          # Service client
│
├── types/                  # TypeScript types
│   ├── rapport.ts          # Rapport types (V3)
│   ├── report-builder.ts   # Legacy types
│   └── pdf-structure.ts    # PDF types
│
├── analytics/              # Analys-logik
│   ├── vapi.ts             # Vapi client
│   ├── vapiParser.ts       # Call parser
│   └── vapiChatParser.ts   # Chat parser
│
├── feature-flags/          # Feature flags
│   ├── types.ts
│   └── defaults.ts
│
├── hooks/                  # Custom hooks
│   ├── use-feature-flags.ts
│   └── use-mobile.tsx
│
├── constants/              # Konstanter
│   └── colors.ts           # Trade colors
│
├── store.ts                # Legacy store (re-exports)
└── utils.ts                # Utilities (cn, formatDate, etc.)
```

---

## 5. Stores Directory

```
stores/
├── simpleReportStore.ts    # Report Studio store
├── reportBuilderStore.ts   # Legacy builder store
└── pdfStructureStore.ts    # Legacy PDF store
```

---

## 6. Legacy Directory

```
legacy/
├── docs/                   # Legacy dokumentation
│   ├── PDF_DOCUMENT_BUILDER_PLAN.md
│   ├── PLAN_PDF_STRUKTURBYGGARE.md
│   └── RAPPORT_WORKFLOW_V2.md
│
├── rapport-container/      # Legacy rapport UI
│   ├── rapport-container.tsx
│   ├── report-preview-dialog.tsx
│   ├── image-gallery-section.tsx
│   └── image-annotation-canvas.tsx
│
├── rapport-settings/       # Legacy inställningar
│   ├── rapport-settings.tsx
│   ├── rapport-settings-v2.tsx
│   ├── pdf-structure-builder.tsx
│   └── pdf/
│       └── designer/
│           └── DocumentDesigner.tsx
│
├── report-pdf/             # Legacy React-PDF
│   ├── ReportDocument.tsx
│   └── buildReportData.ts
│
└── app/                    # Legacy API routes
    └── api/
        └── reports/
            └── preview/
                └── pdf/
                    └── route.ts
```

---

## 7. Docs Directory

```
docs/
├── architecture/           # Arkitektur-docs
│   ├── ARCHITECTURE.md     # Huvudarkitektur
│   ├── STATE_MANAGEMENT.md # State management
│   ├── PDF_PIPELINE.md     # PDF-generering
│   ├── DATA_MODEL.md       # Datamodeller
│   └── API_OVERVIEW.md     # API-dokumentation
│
├── features/               # Feature-docs
│   ├── REPORT_STUDIO.md    # Report Studio
│   ├── REPORT_EDITOR.md    # Rapportredigering
│   └── PUBLIC_VIEWER.md    # Publik vy
│
└── dev/                    # Utvecklar-docs
    ├── CONTRIBUTING.md     # Bidragsguide
    ├── CODING_GUIDELINES.md # Kodstandard
    ├── PROJECT_STRUCTURE.md # Denna fil
    └── AI_DEV_GUIDE.md     # AI-guide
```

---

## 8. Supabase Directory

```
supabase/
├── migrations/             # SQL migrations
│   ├── 20250101_initial.sql
│   ├── 20250115_add_reports.sql
│   └── ...
│
└── seed.sql                # Seed data
```

---

## 9. Tests Directory

```
__tests__/
├── lib/
│   ├── rapport.test.ts
│   ├── pdfGenerator.test.ts
│   └── logger.test.ts
│
└── components/
    └── rapport/
        └── RapportListPanel.test.tsx
```

---

## 10. Konfigurationsfiler

```
├── .env.example            # Env template
├── .env.local              # Lokala env vars
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── next.config.ts          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── components.json         # shadcn/ui config
```

---

## 11. Relaterade Dokument

- [CONTRIBUTING.md](./CONTRIBUTING.md) – Bidragsguide
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) – Kodstandard
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) – Arkitektur
