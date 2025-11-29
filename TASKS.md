# TASKS – AI-drivet arbetsflöde

> **Syfte:** Det här dokumentet är den **enda sanningen** för hur AI-modeller ska planera och genomföra arbete i den här koden.  
> Alla uppgifter är skrivna som små, exekverbara steg som kan implementeras i rätt ordning.

---

## 0. Konventioner för AI-modeller

- Checkboxar:
  - `- [ ]` = inte gjord  
  - `- [x]` = klar (endast sättas av människa, inte automatiskt av AI om inte godkänt).
- Taggar i hakparenteser anger kategori, t.ex. `[UI]`, `[API]`, `[DB]`, `[PERF]`, `[SECURITY]`, `[REPORTS]`, `[PDF]`, `[VAPI]`, `[STUDIO]`.
- När en uppgift kräver flera filer:
  - Följ delstegen i ordning (1, 2, 3 …).
  - Uppdatera **arkitektur-/design-dokument** i samma PR (t.ex. `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, relevanta `*_PLAN.md`).
- Om något är oklart: läs först relaterad `*.md`-fil som nämns i uppgiften.

---

## 1. Högsta prioritet (Det viktigaste nu)

### 1.1 VAPI org-migration (BLOCKER för Admin "Configure AI")

Källa: `URGENT_CODEX_MIGRATION.md`, `IMPLEMENTATION_SUMMARY.md`.

- [ ] [DB][VAPI][BLOCKER] **Kör VAPI-kolumnmigrationen på `organizations`**
  - [ ] Kör SQL från `URGENT_CODEX_MIGRATION.md` mot rätt Supabase-projekt (helst via Supabase MCP eller CLI).
  - [ ] Verifiera med `SELECT`-frågan i samma fil att alla 6 kolumner finns.
- [ ] [API][VAPI] **Smoke-testa Admin "Configure AI"-flödet**
  - [ ] Öppna `/admin/customers` och klicka `⋯ → Configure AI` på en organisation.
  - [ ] Bekräfta att sidan laddas utan "Kunde inte hämta organisationen".
  - [ ] Om fel kvarstår: logga detaljerad error i `lib/server/vapi-org-config.ts` och justera query.

### 1.2 Säkerställ att rapport-/template-scheman matchar `ARCHITECTURE.md`

Källa: `ARCHITECTURE.md` (Simple Report / Report Studio v2), `lib/types/rapport.ts`, `lib/store.ts`.

- [ ] [DB][REPORTS][STUDIO] **Synca `reports`-tabellen med förväntad schema**
  - [ ] Jämför `reports` mot fälten i `ARCHITECTURE.md` §2.2 + extra kolumner (`exported_at`, `public_id`, `customer_email`, `customer_approved_at`, `customer_approved_by`, `pdf_template_id`, `cover_image_url`, `cover_subtitle`, ev. legacy-fält).
  - [ ] Skapa en migration som lägger till saknade kolumner med säkra default-värden.
  - [ ] Uppdatera `lib/database.types.ts` om det saknas typdefinitioner.
- [ ] [DB][STUDIO] **Synca `report_templates`-tabellen med Simple Report Studio**
  - [ ] Verifiera att `design_id`-kolumnen finns (används av `stores/simpleReportStore.ts`).
  - [ ] Om saknas: lägg till `design_id` + ev. kommentarer enligt `ARCHITECTURE.md` §2.1.
  - [ ] Bekräfta att `sections`-kolumnen är av JSON-typ och kan lagra strukturen från `mapTemplateToDb`.

### 1.3 Säkerhets- och produktionskonfiguration

Källa: `SECURITY_FIXES.md`, `IMPROVEMENTS.md`.

- [ ] [SECURITY][CONFIG] **Slutför production checklist från `SECURITY_FIXES.md`**
  - [ ] Sätt `ALLOWED_ORIGINS` i prod-miljön till rätt domäner.
  - [ ] Sätt `WEBHOOK_SIGNING_SECRET` med starkt värde.
  - [ ] Sätt `UPSTASH_REDIS_REST_URL` och `UPSTASH_REDIS_REST_TOKEN` (eller verifiera att rate-limiting-strategin är medvetet dev-only).
  - [ ] Kör `npm run build` i CI och säkerställ 0 errors.
- [ ] [SECURITY][API] **Verifiera att API-nycklar aldrig exponeras**
  - [ ] Läs nätverkstrafiken för `/api/admin/organizations/[id]/vapi-config` och `/api/admin/vapi/assistants` – bekräfta att bara maskerade fält returneras.
  - [ ] Om du hittar plaintext-nycklar: uppdatera responser så de följer maskeringsmönstret i `SECURITY_FIXES.md`.

### 1.4 Minimera användning av `SUPABASE_SERVICE_ROLE_KEY`

Källa: `SECURITY_FIXES.md` (öppen punkt).

- [ ] [SECURITY][DB][REFactor] **Inventera alla användningar av service role key**
  - [ ] Kör en sökning i repo efter `SUPABASE_SERVICE_ROLE_KEY`.
  - [ ] Lista alla endpoints/filer där den används.
- [ ] [SECURITY][DB] **Migrera endpoints där RLS räcker**
  - [ ] För varje endpoint med service role, avgör om den kan bytas mot:
    - auth-scopead klient (session-baserad) **eller**
    - RLS + anon key.
  - [ ] Implementera bytena stegvis, med feature-flagg vid behov.
- [ ] [SECURITY][DB] **Dokumentera kvarvarande service-role-användning**
  - [ ] Uppdatera `SECURITY_FIXES.md` med motiveringar för de ställen där service role fortfarande krävs (t.ex. bakgrundsjobb, administrativa operationer).

### 1.5 Rapport Workflow V2 – automatiserade tester

Källa: `RAPPORT_WORKFLOW_V2.md`, `RAPPORT_FORBATTRINGAR.md`.

- [ ] [REPORTS][TESTS] **Skapa automatiserade tester för arkiveringslogik (`exportedAt`)**
  - [ ] Lägg till Vitest-tester som återskapar manuella scenarier i `RAPPORT_WORKFLOW_V2.md` (skapande, redigering, export, arkivering).
  - [ ] Testa att filterlogiken `!r.exportedAt` / `!!r.exportedAt` används korrekt i listor.
- [ ] [REPORTS][UX] **Verifiera att UI följer V2-beskrivningen**
  - [ ] Kontrollera att Arkiv-vyn döljer workflow-komponenten.
  - [ ] Kontrollera att "Fortsätt redigera" endast finns på aktiva rapporter.

---

## 2. Pågående funktioner

### 2.1 Bildgalleri & Annoterad bild – fortsätta integration

Källa: `BILDGALLERI_OCH_ANNOTATION_IMPLEMENTATION.md`.

- [ ] [REPORTS][UI][DB] **Koppla bildgalleri och annoterad bild till Supabase Storage**
  - [ ] Definiera bucket och path-struktur (t.ex. `reports/{reportId}/assets/*`).
  - [ ] Implementera uppladdning i `image-gallery-section` och `image-annotation-canvas` med Supabase Storage-klient.
  - [ ] Spara URL:er och `annotationData` i `ReportSectionInstance` så att de används i PDF/export.
- [ ] [PDF][REPORTS] **Uppdatera PDF-generation för nya sektionstyper**
  - [ ] Utöka PDF-generatorn som används för legacy rapporter med stöd för `image_gallery` och `image_annotated` (inkl. captions och annotation-indikatorer).
  - [ ] Lägg till fallbacks för när inga bilder finns (som i simple PDF-generatorn).
- [ ] [PERF][STORAGE] **Förbered bildoptimering (stegvis)**
  - [ ] Lägg in en central helper för att generera thumbnail-URLs (t.ex. via Supabase transformations eller annan tjänst), även om implementationen initialt bara returnerar original-URL.

### 2.2 Report Studio (legacy sandbox) – besluta och fokusera

Källa: `REPORT_STUDIO_IMPLEMENTATION.md`.

- [ ] [STUDIO][PRODUCT] **Ta beslut om strategi för legacy Report Studio vs v2 & Document Builder**
  - [ ] Jämför funktionalitet: `components/report-studio/*` (sandbox), `components/report-studio-v2/*` (enkla mallar), `PDF_DOCUMENT_BUILDER_PLAN.md` (framtid).
  - [ ] Välj: fortsätt utveckla legacy studio **eller** formellt deprecera till förmån för Simple Report v2 + framtida Document Builder.
- [ ] [STUDIO][UI] **Om strategi = fortsätta utveckla**
  - [ ] Implementera Template Editor enligt "Nästa steg" i `REPORT_STUDIO_IMPLEMENTATION.md`.
  - [ ] Implementera Profile Editor (färgväljare, typsnitt, logo-upload).
  - [ ] Implementera Unified Preview (live preview av struktur + mall + profil).
- [ ] [STUDIO][DB] **Koppla legacy Report Studio till Supabase**
  - [ ] Bygg migrations- och modellskikt för att lagra workspace/strukturer i Supabase (inte bara localStorage).

### 2.3 AI-assistenter (user dashboard) – fas 2

Källa: `USER_AI_ASSISTANTS_FEATURE.md`.

- [ ] [AI][UI][API] **Spara konversationshistorik permanent**
  - [ ] Definiera tabell(er) i Supabase för chat-sessioner och meddelanden.
  - [ ] Uppdatera `/api/user/assistants/[assistantId]/chat` att skriva sessioner till DB.
  - [ ] Visa historik i UI med möjlighet att ladda tidigare konversationer.
- [ ] [AI][UI] **Exportera konversationer**
  - [ ] Lägg till endpoint t.ex. `GET /api/user/assistants/[assistantId]/chat/export?sessionId=...` som returnerar JSON/CSV.
  - [ ] Lägg till knapp "Exportera" i test-dialogen.
- [ ] [AI][ANALYTICS] **Statistik över assistentanvändning**
  - [ ] Använd befintliga Vapi-analytics (`CHAT_ANALYTICS_IMPLEMENTATION.md`) för att bygga en enkel översikt per användarorg.
  - [ ] Visa total antal sessioner, svarsfrekvens m.m. per assistent.

---

## 3. Framtida funktioner

### 3.1 PDF Document Builder – Fas 1–4

Källa: `PDF_DOCUMENT_BUILDER_PLAN.md`.

#### Fas 1 – Foundation (data & state)

- [ ] [PDF][DB][REPORTS] **Implementera `DocumentStructure`-modellen**
  - [ ] Skapa TypeScript-typer (`DocumentStructure`, `DocumentSection`, `SectionConfig`, `SectionType`) enligt planen.
  - [ ] Koppla dessa till befintliga `Report`/`ReportSectionInstance` där möjligt.
- [ ] [STATE][PDF] **Bygg ett dedikerat Zustand-store för Document Builder**
  - [ ] Skapa `documentBuilderStore.ts` eller utveckla `pdfStructureStore.ts` enligt unified-modellen.
  - [ ] Lägg till actions för att skapa/uppdatera/radera strukturer och sektioner.

#### Fas 2 – Grundläggande UI

- [ ] [UI][PDF] **Canvas + palett**
  - [ ] Skapa `/components/document-builder/DocumentBuilder.tsx` som huvudvy.
  - [ ] Implementera palett med sektionstyper (header, text, image, table, etc.).
  - [ ] Visa vald `DocumentStructure` på en canvas med ordnade sektioner.

#### Fas 3 – Preview & backend

- [ ] [API][PDF] **Preview-endpoint**
  - [ ] Implementera `POST /api/document-builder/preview` som tar `DocumentStructure + Report` och returnerar HTML/PDF-buffer.
  - [ ] Återanvänd så mycket som möjligt av befintliga PDF-generators (`pdfGenerator`, `simplePdfGenerator`, `PDF_DESIGNS`).

#### Fas 4 – Avancerade funktioner

- [ ] [UI][PDF] **Konfigurationspanel per sektion**
  - [ ] Bygg `SectionConfigPanel` för att ändra titel, visibility, datakälla m.m.
- [ ] [UI][PDF][STATE] **Undo/redo & versionering**
  - [ ] Lägg till enkel historik i store (stack av states) med undo/redo.
  - [ ] Planera separat versionstabell i DB för dokumentmallar.

### 3.2 Avancerade rapport-funktioner (lång sikt)

Källa: `RAPPORT_FORBATTRINGAR.md` (lång sikt), `BILDGALLERI_OCH_ANNOTATION_IMPLEMENTATION.md`.

- [ ] [AI][REPORTS] **AI-assisterad rapportskrivning**
  - [ ] Designa API-kontrakt för att skicka rapportdata till AI (t.ex. via VAPI/MCP) för att generera sammanfattningar.
  - [ ] Lägg till UI-knapp "AI-förslag" i textsektioner.
- [ ] [COLLAB][REPORTS] **Kollaborativ redigering (concept stage)**
  - [ ] Skissa datamodell för realtidsredigering (sessioner, presence, locks).
  - [ ] Utvärdera tredjepart (t.ex. Liveblocks, Yjs) för framtida implementation.

---

## 4. Teknisk skuld & Refactor-tasks

### 4.1 Enhetlig PDF-stack

- [ ] [PDF][REFactor] **Bestäm canonical PDF-väg**
  - [ ] Inventera nuvarande PDF-vägar:
    - `app/api/reports/preview/pdf` (React-PDF)
    - `app/api/reports/[id]/pdf` (HTML)
    - `lib/rapport/pdfDesigns.ts` (nya designer)
    - `lib/rapport/simplePdfGenerator.ts` (simple v2-generator, ej använd i UI)
  - [ ] Besluta vilka vägar som ska vara primära långsiktigt.
- [ ] [PDF] **Integrera eller ta bort `simplePdfGenerator`**
  - [ ] Antingen: koppla in `generateSimplePdfHtml` i rapportflödet för enkla mallar.
  - [ ] Eller: ta bort filen och relaterade typer om den inte ska användas för att undvika förvirring.

### 4.2 Konsolidering av Report Studio-varianter

- [ ] [STUDIO][REFactor] **Konsolidera Report Studio v1, v2 och Document Builder-planen**
  - [ ] Dokumentera tydligt vilken variant som ska vara primär för nya utvecklingar.
  - [ ] Lägg de övriga i "legacy"-läge (read-only eller dolt bakom feature-flaggar).

### 4.3 Rensa legacy-API-mönster

- [ ] [API][REFactor] **Identifiera och rensa äldre endpoints som duplicerar logik**
  - [ ] Jämför rapport-API:er i `lib/rapport/rapportApi.ts` med Next.js API-routes för samma data.
  - [ ] Där samma funktionalitet finns på två ställen: använd en källa (vanligtvis server-API) och minska duplicering.

---

## 5. Index per kategori (för AI)

Detta är ett index. **Implementera alltid uppgifterna i huvudsektionerna ovan**; använd taggarna här som filter.

- **UI-tasks**: alla uppgifter taggade `[UI]` (t.ex. 2.1 bildgalleri-UI, 2.2 Report Studio-UI, 3.1 Document Builder-UI).
- **API-tasks**: alla uppgifter taggade `[API]` (t.ex. 1.1 VAPI-migration-verifiering, 3.1 preview-endpoint, AI-chat export-API).
- **Databas-tasks**: alla uppgifter taggade `[DB]` (t.ex. 1.1, 1.2, 1.4, 2.1, 3.1).
- **Performance/Operations-tasks**: alla uppgifter taggade `[PERF]` eller relaterade till rate limiting, bildoptimering, monitoring.
- **Teknisk skuld / Refactor**: uppgifter under §4 + taggen `[REFactor]`.

---

## 6. Hur AI ska använda denna fil

1. Läs **sektion 1** först och hantera blockerande uppgifter i ordning.  
2. För varje större feature, välj rätt sektion (§2 eller §3) och gå igenom deluppgifter steg för steg.  
3. När du implementerar kod, håll dig till `ARCHITECTURE.md` och `DESIGN_SYSTEM.md` för arkitektur och UI.  
4. Avsluta alltid med att uppdatera relevanta docs och (för människor) bocka i checkboxar här.
