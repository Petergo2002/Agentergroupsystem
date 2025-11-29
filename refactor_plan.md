PROBLEM_OVERVIEW
Teknisk skuld & dubbla system
[Legacy RapportContainer vs ny Rapport V2]
components/rapport/rapport-container.tsx
 (~2400 rader) implementerar ett komplett rapportflöde direkt mot lib/store.ts, inklusive:
laddning av rapporter, templates och sections
skapande-dialog (
NewReportWizard
 inuti filen)
arkivvy, workflow-UI, PDF-export (egen 
generatePdfHtml
-anrop)
Samtidigt finns den nya V2-arkitekturen:
components/rapport/RapportPageNew.tsx
 + 
useRapportData
 + rapportApi.
Konsekvens: Två parallella rapportflöden som båda använder 
reports
‑tabellen och lib/store.ts. Hög risk för divergerande logik, buggar och förvirring (för både AI och utvecklare).
[Tre generationer “Rapportinställningar”]
components/rapport/rapport-settings.tsx
 (äldre, tung, kopplad till DocumentDesigner/PDFStructure).
components/rapport/rapport-settings-v2.tsx
 och 
rapport-settings-v3.tsx
 (progressiva förbättringar med fler features, design templates, osv.).
components/rapport/rapport-settings-simple.tsx
 (förenklad inställningsvy för V2, använd i 
RapportPageNew
).
Konsekvens: Oklart vilken som är “source of truth” för mallar/sektioner/PDF-styling. Flera komponenter pratar direkt med lib/store.ts med snarlik men inte identisk logik.
[Flera PDF-system samtidigt]
React-PDF-baserat system:
components/rapport/pdf/ReportDocument.tsx
lib/report-pdf/buildReportData.ts
app/api/reports/preview/pdf/route.ts
 (genererar & sparar PDF i storage + 
reports
).
app/api/designer/preview/pdf/route.ts
 + components/rapport/pdf/designer/* + stores/pdfStructureStore.ts + 
lib/types/pdf-structure.ts
.
HTML-baserat V2-system:
lib/rapport/pdfDesigns.ts
 (Standard + ModernHero).
lib/rapport/pdfGenerator.ts
 (och legacy pdfGenerator 2.ts).
Används av 
rapportApi.exportReport
, 
rapportApi.openPdf
, 
ReportPreviewDialog
 (via 
renderReportToIframe
) och 
PdfDesigner
 (för Simple Report Studio).
Ytterligare ett “simple” system:
lib/rapport/simplePdfGenerator.ts
 (ren SimpleTemplate-pdf, idag inte integrerad någonstans).
Konsekvens: Tre olika PDF-pipelines mot samma domän (reports). Svårt att garantera deterministiskt beteende och gemensam styling. Svårt för AI att välja rätt väg.
[Många stores med överlappande ansvar]
lib/store.ts: gigantisk, innehåller:
CRM-datamodeller (customers/leads/jobs/quotes/invoices/events/tasks).
Rapport-data: useReportsStore, useReportTemplatesStore, useReportSectionsStore + fetch/CRUD + 
createReport
, 
updateReport
, exportReportAsPdf.
stores/simpleReportStore.ts: eget mallsystem för Simple Report Studio.
stores/reportBuilderStore.ts: legacy report builder (ReportFormData + localStorage).
stores/pdfStructureStore.ts: PDF layout-strukturer (för React-PDF builder).
stores/designerTemplatesStore.ts + 
stores/documentDesignerStore.ts
: designer-mallar och blocks.
Konsekvens: Mycket logik dupliceras/överlappar (mallar, sektioner, PDF-styling), svårt att veta vilka stores som är aktiva i V2.*
Dubbla template-system (simple vs legacy)
[Simple templates]
Modell: 
SimpleReportTemplate
 och 
SimpleSectionDefinition
 (
lib/types/rapport.ts
).
Store: stores/simpleReportStore.ts.
UI: components/report-studio-v2/* + app/(dashboard)/report-studio/page.tsx.
Sparas i report_templates.sections som DbSimpleSection:
type: "image_gallery" | "image" | "image_annotated" | "text", reduceras i store till "text" / "images".
Används i 
RapportSettingsSimple
 som read-only mallöversikt.
[Full/legacy templates]
Modell: 
ReportTemplate
 + 
ReportSectionDefinition
 + 
ReportSectionTemplate
 (
lib/types/rapport.ts
).
Store: useReportTemplatesStore, useReportSectionsStore i lib/store.ts.
UI: 
rapport-settings.tsx
, 
rapport-settings-v2.tsx
, 
rapport-settings-v3.tsx
, 
RapportContainer
 m.fl.
Sparas också i report_templates.sections, men förväntar sig annan JSON-struktur (mer generell, stöd för fler 
ReportSectionType
).
[Konflikt]
Samma DB-kolumn (report_templates.sections) används parallellt av:
Simple-systemet (mapTemplateToDb/mapDbToTemplate i simpleReportStore.ts).
Fullt rapport-system (normalizeTemplateSections i lib/store.ts).
Båda är defensiva, men formen är inte dokumenterat som ett strikt superset → teknisk skuld runt JSON-shape.*
JSON-shapes & mapping-inkonsistenser
[reports.sections]
Fylls av:
Legacy 
ReportFormData
 via 
buildReportData.ts
 + app/api/reports/preview/pdf (skriver också legacy fält: introduction, background, methods, conclusion).
V2 
createReport
 i lib/store.ts som skriver 
ReportSectionInstance[]
.
Läser via normalizeReportSections (rad ~540 i lib/store.ts):
Försöker hantera både nya fält (content, status) och gamla (fields, summary).
Konsekvens: Kolumnen är polymorf. Det fungerar idag, men är bräckligt och otydligt dokumenterat.
[report_templates.sections]
Simple: mapTemplateToDb (rad 98–119 i stores/simpleReportStore.ts) skriver ner en “simple” sektion (utan visibility, groups, osv.).
Full: mapReportTemplateRow + normalizeTemplateSections (rad 515–538, 584–595 i lib/store.ts) förväntar generisk form, men droppar många fält (ingen defaultContent, ingen visibility, ingen group).
Konsekvens: vissa template-fields (t.ex. defaultContent i 
ReportSectionTemplate
) överlever inte roundtrip via DB.
[design_id / designId]
I 
SimpleReportTemplate
: designId?: "standard" | "modern_hero".
simpleReportStore.mapDbToTemplate läser row.design_id → designId (rad 90–93).
lib/store.ts/mapReportTemplateRow mappar inte design_id till ReportTemplate.designId (rad 584–595).
createReport
 (rad 970–995) försöker läsa template.designId för att sätta Report.metadata.designId.
Konsekvens: V2-rapporter får nästan säkert aldrig en designId från fulla templates, så PDF-designval från admin-sidan slår inte igenom i Rapport-flödet.
Public API mapping-bugg
app/api/reports/public/[publicId]/route.ts rad 39–55:
type: reportRow.type men DB-kolumnen heter enligt typerna trade.
metadata, sections, checklist, assets skickas vidare som rå-JSON utan samma normalisering som mapReportRow.
Konsekvens: Risk för fel typ/inkonsekventa shapes när publika vyer läser rapporter jämfört med interna modeller. (I bästa fall funkar det “av misstag” för att raden råkar ha båda fälten.)
State management-trassel
[Gigantisk lib/store.ts]
Innehåller ~1300 rader blandat:
auth, kunder, leads, jobb, offerter, fakturor, events, tasks.
rapport-data (reports, report_templates, report_sections).
Ingen modulär split per domän, ingen selektiv export per slice.
[Olika sätt att jobba mot samma stores]
RapportContainer
 använder useReportsStore / useReportTemplatesStore + fetchReports/fetchReportTemplates/fetchReportSections direkt.
useRapportData
 gör samma sak, men wrappar i hook + använder rapportApi.
Några settings-komponenter (rapport-settings*) pratar också direkt med lib/store.ts.
Konsekvens: Samma data (templates, sections, reports) kan laddas och muteras via tre olika vägar med endast “mjukt” kontrakt mellan dem.
[Global state där lokal stat vore bättre]
useSimpleReportStore innehåller också rena UI-flaggor (isEditing, previewMode), så hela template-listan + alla komponenter i Report Studio re-render vid UI-toggling.
usePdfProfileStore håller PDF-profilen globalt för hela appen, men konsumeras framförallt i designer/rapport-export. Allt som lyssnar på den profilen re-render vid minsta förändring.*
UI-komponenter som gör för mycket
[
components/rapport/rapport-container.tsx
]
Ett allt-i-ett “god-component”:
Datahämtning (reports, templates, sections).
Alla create/update/delete flows.
Komplett UI för list + detalj + workflow + PDF-preview/export.
Egen wizard + egen preview-dialog + egen export knapplogik.
Bör betraktas som legacy och brytas ut/ersättas av V2 (RapportPageNew + ReportEditor).
[
components/rapport/rapport-settings.tsx
]
Både mall/sektion-hantering och koppling till DocumentDesigner/PDFStructureBuilder.
Uppgiften överlappar med 
rapport-settings-v2.tsx
, 
rapport-settings-v3.tsx
 och 
rapport-settings-simple.tsx
.
Legacy-funktioner blandade med V2
Legacy (React-PDF / ReportFormData):
ReportDocument.tsx
, 
buildReportData.ts
, reportBuilderStore.ts,
app/api/reports/preview/pdf, app/api/reports/[id]/pdf,
PDFStructureBuilder
 + pdfStructureStore + app/api/designer/preview/pdf.
V2 (HTML-designs, rapportApi):
rapportApi.ts
, 
pdfDesigns.ts
, 
pdfGenerator.ts
, 
ReportEditor.tsx
, 
RapportPageNew.tsx
, ReportPreviewDialog.tsx.
Båda skriver/läser 
reports
‑tabellen.
Konsekvens: Svårt att veta vilken pipeline som är “officiell” och säker att fortsätta bygga på.
Fetch-logik som körs för många gånger
[Duplicerade fetch-mönster]
useRapportData
 → fetchReports, fetchReportTemplates, fetchReportSections (med initialized-flaggor).
RapportContainer
 gör samma fetchar på egen hand.
RapportSettings* gör ytterligare fetchar av templates/sections (fetchReportTemplates, fetchReportSections).
simpleReportStore.fetchTemplates anropas från både Report Studio V2 och 
RapportSettingsSimple
.
Visserligen finns initialized-guard i stores, men:
Koden läser användare (supabase.auth.getUser) varje gång fetch* körs.
Hög risk att nya features glömmer att respektera initialized.
PERFORMANCE_ISSUES
Zustand-stores & re-renders
[Stora slices utan selectors]
useReportsStore, useReportTemplatesStore, useReportSectionsStore (lib/store.ts) exponerar hela arrayer och flera flaggor.
useRapportData
 hämtar 
reports
, templates, sections i sin helhet och skickar vidare till UI-komponenter → hela listor re-render på varje uppdatering.
RapportListPanel (ej visad här men används i 
RapportPageNew
) får fulla arrayer och filter/sort-funktioner; varje liten filterändring skapar nya array-instans och trillar igenom hela trädet.
[Global redraw på små UI-förändringar]
useSimpleReportStore håller både datat (templates/sections) och UI-state (isEditing, previewMode, loading, saving).
PdfDesigner
 lyssnar på hela profile från usePdfProfileStore; varje litet ändring i profil (t.ex. customerName) triggar ny previewHtml + ny <iframe>.
PDF-preview & tunga operationer
PdfDesigner
:
useMemo genererar previewHtml på varje förändring i template eller profile.
För många templates/ändringar i branding kan det ge märkbara kostnader (HTML + CSS + sektioner genereras, skrivs in i iframe).
generatePdfHtml
 (V2 pipeline) och 
generateSimplePdfHtml
 (simple pipeline) skapar kompletta HTML-dokument som skrivs till nya fönster:
Kostnaden är OK per klick, men pipeline är duplicerad och svår att optimera centralt.
Fetch & initial load
[Flera fetch-entrypoints]
RapportPageNew
 → 
useRapportData
 → fetchReports/templates/sections (respekterar initialized).
RapportContainer
 gör samma sak manuellt.
RapportSettings* laddar återigen templates/sections.
Varje fetch:
Bygger ny Supabase-klient (createSupabaseClient()).
Slår mot supabase.auth.getUser() för att hitta user_id.
På en “kall” session med flera rapport-sidor kan detta ge onödiga auth/fetch-roundtrips.*
Stora JSON-block i global state
useReportsStore.reports:
Innehåller alla rapporter med hela sections[], assets[], checklist[].
useRapportData
 filtrerar/sorterar alltid i minne, oavsett antal rapporter.
pdfStructureStore.structures:
Lagrar hela PDF-strukturer (inkl. sektioner och styling) i localStorage och minne, även om de används väldigt sällan.
Avsaknad av riktiga selectors/memoization
useRapportData
:
filteredReports = applyFilter + applySort på hela 
reports
 varje gång filter eller sort ändras.
draftReports och archivedReports är useMemo men baseras på hela 
reports
 och triggas på varje uppdatering.
RapportPageNew
:
Skickar vidare filter, setFilter, sort, setSort och hela draftReports/archivedReports till listpanelen.
Med många rapporter kommer detta ge re-renders i hela listan vid minsta filterändring.
ARCHITECTURE_V3
Nedan är ett förslag på en deterministisk V3-arkitektur för Rapport/Report Studio, byggt ovanpå din nuvarande domän men med:

1 template-system
1 PDF-pipeline
modulariserade stores
tydligt legacy-lager.
1. Domänmodeller (JSON-shapes)
1.1 Sektionstyper (V3)
ts
export type SectionKind = "text" | "images";

export interface TemplateSectionV3 {
  id: string;                // unik per template
  key: string;               // stabil, används av AI/automation
  type: SectionKind;
  title: string;
  description?: string;
  required: boolean;
  order: number;             // 1..N
  defaultContent?: string;   // texttemplate med {{variabler}}
  placeholder?: string;
}
1.2 Template (V3)
ts
export interface ReportTemplateV3 {
  id: string;
  version: 3;
  name: string;
  trade: ReportTrade;        // "bygg" | "läckage" | "elektriker"
  description?: string;
  designId: PdfDesignId;     // "standard" | "modern_hero"
  sections: TemplateSectionV3[];
  checklist: ReportChecklistItem[];
  createdAt: string;
  updatedAt: string;
}
1.3 Rapport (V3)
ts
export interface SectionInstanceV3 {
  id: string;
  templateSectionId: string;   // kopplar till TemplateSectionV3.id
  type: SectionKind;
  status: "pending" | "completed";
  order: number;

  // Innehåll
  text?: {
    title: string;
    body: string;              // markdown/HTML
  };
  images?: {
    items: {
      id: string;
      assetId: string;         // pekar på ReportAsset.id
      caption?: string;
      annotations?: AnnotationShape[];
    }[];
  };

  internalNotes?: string;
}

export interface ReportV3 {
  id: string;
  version: 3;
  templateId: string;
  title: string;
  type: ReportTrade;
  status: ReportStatus;
  metadata: ReportMetadata;    // nuvarande shape + designId
  sections: SectionInstanceV3[];
  checklist: ReportChecklistItem[];
  assets: ReportAsset[];
  createdAt: string;
  updatedAt: string;
  exportedAt?: string | null;
  publicId?: string | null;
  customerEmail?: string | null;
  customerApprovedAt?: string | null;
  customerApprovedBy?: string | null;
}
2. DB-schema (V3)
2.1 report_templates (V3)
Lägg till/garantera:

version (int) – 3 för V3-templates.
design_id (text, not null, default 'standard').
sections (jsonb) med exakt shape TemplateSectionV3[].
checklist (jsonb) med 
ReportChecklistItem[]
.
Mapping:

mapTemplateRowV3(row) -> ReportTemplateV3
mapTemplateToDbV3(template: ReportTemplateV3) -> insert/update payload
Alla V3-konsumenter använder bara dessa två funktioner.

2.2 
reports
 (V3)
Lägg till/garantera:

version (int) – 3 för V3-flödet.
metadata (jsonb) – 
ReportMetadata
 (inkl. designId).
sections (jsonb) – SectionInstanceV3[].
assets (jsonb) – 
ReportAsset[]
.
Mapping:

mapReportRowV3(row) -> ReportV3
mapReportToDbV3(report: ReportV3) -> payload
2.3 Legacy-tabeller
Behåll:
reports.report_number, introduction, background, methods, conclusion, storage_path, etc.
pdf_designs (men gör den officiell källa för design-metadata).
organization_settings.pdf_profile, enabled_pdf_designs.
Men V3-koden:
läser/uppdaterar endast version = 3‑rader,
skriver inte längre legacy-kolumner (förutom ev. storage_path om server-PDF införs).
3. State-struktur (V3)
Bryt ut rapport-relaterade stores från lib/store.ts:

lib/stores/rapportReportsStore.ts
reports: ReportV3[]
loading, initialized
setReports, upsertReport, removeReport
lib/stores/rapportTemplatesStore.ts
templates: ReportTemplateV3[]
lib/stores/rapportSectionsStore.ts
sectionDefinitions: ReportSectionDefinition[] (bibliotek, V3-kompatibla)
lib/store.ts får endast innehålla övriga domäner (CRM, calendar, tasks), inte rapporter.

useRapportData
 uppdateras till att använda de nya modulstores.

stores/simpleReportStore.ts kan antingen:

göras om till en tunn wrapper kring ReportTemplateV3 med type: "text" | "images", eller
ersättas av en ny useTemplateDesignerStore som jobbar direkt mot V3 JSON-shape.
4. EN PDF-pipeline (HTML → server/WASM → preview)
Kärna: 
lib/rapport/pdfGenerator.ts
 + 
pdfDesigns.ts
 (behåll, städa, döp till pdfGeneratorV3.ts om du vill).
Officiell signatur:
ts
generatePdfHtmlV3({
  report: ReportV3,
  template: ReportTemplateV3 | null,
  sectionDefinitions?: ReportSectionDefinition[],
  profile?: PdfProfile,
  viewMode?: "internal" | "customer",
}): string;
Export-flöde (V3):
UI → rapportApi.exportReportV3(reportId, { customerEmail? }).
rapportApi:
laddar ReportV3 + ReportTemplateV3.
anropar generatePdfHtmlV3.
öppnar nytt fönster med HTML (print-to-PDF).
uppdaterar 
reports
 (version 3) med exportedAt, status = "approved", publicId, customerEmail.
Server-PDF (valfritt nästa steg):
Ny route app/api/rapport/[id]/pdf-html → returnerar HTML från generatePdfHtmlV3.
Separat render-mikrotjänst (Playwright/Puppeteer/WASM) som konverterar HTML → binär PDF.
React-PDF-pipelinen (
ReportDocument
, app/api/reports/preview/pdf, DesignerDocument) flyttas till /legacy och används endast för gamla flows.

5. Komponentgränser (V3)
Template design / Report Studio
app/(dashboard)/report-studio/page.tsx → ReportStudioV3.
ReportStudioV3 konsumerar:
rapportTemplatesStore (V3 templates).
DesignsManager (kopplat till pdfDesigns och eventuellt db-backed pdf_designs via designerTemplatesStore).
Rapport-dashboard
app/(dashboard)/rapport/page.tsx → 
RapportPageNew
 (befintlig, men gör officiell V3).
RapportPageNew
 använder useRapportDataV3 (uppdaterad) och rapportApiV3.
Rapport-editor
ReportEditor.tsx
 fortsätter vara V2/V3-editor, men:
arbetar mot ReportV3 (sektioner, metadata).
använder enbart 
rapportApi.updateReport
 (V3).
Public viewer
app/api/reports/public/[publicId] + UI-sida /public/rapport/[publicId]:
läser enbart version = 3‑rapporter.
använder samma mapReportRowV3 som resten av systemet.
6. Legacy-separation
Skapa t.ex. legacy/-träd:

legacy/report-builder/
stores/reportBuilderStore.ts
lib/types/report-builder.ts
components/rapport/pdf/ReportDocument.tsx
lib/report-pdf/*
app/api/reports/preview/pdf
app/api/reports/[id]/pdf
legacy/pdf-structure/
components/rapport/pdf-structure-builder.tsx
stores/pdfStructureStore.ts
lib/types/pdf-structure.ts
app/api/designer/preview/pdf
components/rapport/pdf/designer/*
legacy/rapport-container/
components/rapport/rapport-container.tsx
äldre 
rapport-settings.tsx
 / 
rapport-settings-v2.tsx
V3-kod använder endast:

RapportPageNew
 + 
ReportEditor
 + 
RapportSettingsV3
 eller 
RapportSettingsSimple
.
pdfGenerator.ts
 + 
pdfDesigns.ts
.
useRapportData
 + rapportApi.
REFACTOR_PLAN
Varje punkt: fil(er), funktion/sektion, orsak, effekt, prio.

1. Stabilisering av datamapping (critical)
[Task 1] Fixa designId-mapping för templates
Filer:
lib/store.ts
Exakt kod:
mapReportTemplateRow (rad ~584–595).
createReport
 (rad ~970–995).
Ändring:
Lägg till designId i mapReportTemplateRow:
designId: (row as any).design_id ?? undefined.
Se till att createReportTemplateRecord / updateReportTemplateRecord skriver design_id när ReportTemplate.designId finns.
Varför:
Idag kopieras aldrig design_id från DB till 
ReportTemplate
, så PDF-design försvinner.
Effekt:
Mallens valda PDF-design följer med till Report.metadata.designId och vidare till 
generatePdfHtml
.
Prio: (critical).
[Task 2] Fixa public API → Report mapping
Fil:
app/api/reports/public/[publicId]/route.ts (rad 39–55).
Ändring:
Använd samma mapping som mapReportRow i lib/store.ts:
type: reportRow.trade i stället för reportRow.type.
Normalisera metadata, sections, checklist, assets med normalizeReportSections och default-metadata.
Varför:
Fel kolumn (type) + inga invariants → risk för trasig public vy / JSON-shape som inte matchar frontend-typer.
Effekt:
Public API returnerar samma struktur som internt system, vilket är kritiskt för AI- och UI-kod.
Prio: (critical).
2. Konsolidera V2/V3-flöde, isolera legacy (high)
[Task 3] Markera 
RapportContainer
 som legacy och koppla bort från routing
Filer:
components/rapport/rapport-container.tsx
Eventuella sidor som använder den (sök: 
RapportContainer
 i projektet).
Ändring:
Flytta filen till legacy/rapport-container/ eller byt export-namn till LegacyRapportContainer och ta bort användning i router.
Varför:
Duplicerar RapportPageNew-flödet; stor källa till förvirring.
Effekt:
Endast V2/V3-flödet (
RapportPageNew
 + 
ReportEditor
) används i UI.
Prio: (high).
[Task 4] Samla “Rapportinställningar” till en V3-komponent
Filer:
components/rapport/rapport-settings.tsx
components/rapport/rapport-settings-v2.tsx
components/rapport/rapport-settings-v3.tsx
components/rapport/rapport-settings-simple.tsx
Ändring:
Definiera:
RapportSettingsAdminV3 (bygger vidare på 
rapport-settings-v3.tsx
).
RapportSettingsUserSimple (
rapport-settings-simple.tsx
).
Flytta 
rapport-settings.tsx
 och 
rapport-settings-v2.tsx
 till legacy/.
Varför:
Tre varianter samtidigt skapar drift. V3-varianten har tydligast features (defaultContent, design templates, styling).
Effekt:
En “officiell” admin-sida för rapportinställningar, lätt att dokumentera i ARCHITECTURE.md.
Prio: (high).
3. Modulär stores & V3-typer (high)
[Task 5] Bryt ut rapport-stores från lib/store.ts
Fil:
lib/store.ts (rapportspecifika delar rad ~167–416, 665–745, 747–969, 970–1012 etc.).
Ändring:
Skapa:
lib/stores/rapportReportsStore.ts
lib/stores/rapportTemplatesStore.ts
lib/stores/rapportSectionsStore.ts
Flytta:
ReportsStore + useReportsStore, fetchReports, 
createReport
, 
updateReport
, exportReportAsPdf, mapReportRow.
ReportTemplatesStore + useReportTemplatesStore, fetchReportTemplates, createReportTemplateRecord, updateReportTemplateRecord, mapReportTemplateRow.
ReportSectionsStore + useReportSectionsStore, fetchReportSections, CRUD.
Varför:
Minskar coupling och gör det tydligt vad som tillhör Rapport-domänen.
Effekt:
Lättare att resonera om state, mindre risk att ändringar i CRM mm stör rapportflöden.
Prio: (high).
[Task 6] Introducera V3-typer och versionering
Fil:
lib/types/rapport.ts
.
Ändring:
Lägg till ReportTemplateV3, TemplateSectionV3, SectionInstanceV3, ReportV3 enligt ARCHITECTURE_V3.
Lägg version?: number på 
Report
/
ReportTemplate
 men börja använda V3-typer explicit i ny kod.
Varför:
Tydlig gräns mellan legacy-typer och nya stabila V3-modeller.
Effekt:
Gör det möjligt att gradvis migrera kod utan att bryta legacy.
Prio: (high).
4. PDF-pipeline-konsolidering (high)
[Task 7] Deklarera HTML-pipelinen som officiell och märk React-PDF som legacy
Filer:
lib/rapport/pdfGenerator.ts
, pdfGenerator 2.ts, 
lib/rapport/simplePdfGenerator.ts
.
components/rapport/pdf/ReportDocument.tsx
, lib/report-pdf/*, app/api/reports/preview/pdf, app/api/reports/[id]/pdf, app/api/designer/preview/pdf.
Ändring:
Döp 
pdfGenerator.ts
 till pdfGeneratorV3.ts och dokumentera dess signatur.
Flytta React-PDF-relaterade filer och routes till legacy/.
Varför:
En pipeline = enklare optimering, mindre kod att hålla i sync.
Effekt:
All export och preview går via rapportApi + pdfGeneratorV3.
Prio: (high).*
5. Performance-orienterade refactors (medium)
[Task 8] Inför selectors i stores
Filer:
Nya modulstores i lib/stores/rapport*Store.ts.
lib/rapport/useRapportData.ts
.
Ändring:
Använd zustand med selektorer:
useReportsStore((s) => s.reports) osv.
I 
useRapportData
, använd selectors istället för att dra in hela store-objekt.
Varför:
Minskar re-renders vid små state-ändringar.
Effekt:
Snabbare UI vid stora mängder rapporter/mallar.
Prio: (medium).
[Task 9] Bryt ut UI-state från data-stores
Filer:
stores/simpleReportStore.ts, 
lib/pdf-profile-store.ts
.
Ändring:
Flytta rena UI-flaggor (isEditing, previewMode, saving, loading UI) till små lokala hooks/komponentstate.
Varför:
Globala stores triggar global redraw på lokala UI-förändringar.
Effekt:
Mindre lagg i Report Studio / PDF-designers.
Prio: (medium).*
6. Rensa upp JSON-shapes (medium/low)
[Task 10] Dokumentera & lås JSON-shapes
Filer:
ARCHITECTURE.md
 (V3-sektion), 
lib/types/rapport.ts
, comments i normalizeReportSections, normalizeTemplateSections, mapTemplateToDb i stores/simpleReportStore.ts.
Ändring:
Uppdatera doc och typer så att:
report_templates.sections V3 = TemplateSectionV3[].
reports.sections V3 = SectionInstanceV3[].
Legacy hanteras uttryckligen som version 1/2.
Varför:
Minska risk att någon “smutsar” JSON med specialfält.
Effekt:
Mer AI-vänlig och deterministisk struktur.
Prio: (medium).
PERFORMANCE_OPTIMIZATION_PLAN
Stores & selectors
[Plan A1] Inför per-domän stores med selectors
lib/stores/rapportReportsStore.ts:
Exponera selectors: 
useReports()
, 
useReportsInitialized()
, 
useReportById(id)
.
lib/stores/rapportTemplatesStore.ts: liknande 
useTemplates()
, 
useTemplateById
.
lib/stores/rapportSectionsStore.ts: liknande.
useRapportDataV3:
använd dessa selectors och memoiserade derivat (useMemo) för draftReports, archivedReports.
Effekt:
Mindre re-renders vid uppdatering av enskilda rapporter.
Splitta global vs lokal state
[Plan A2] Flytta UI-state till komponentnivå
useSimpleReportStore:
låt endast templates, activeTemplateId, initialized m.m. ligga i store.
isEditing, previewMode, “savingspinners” flyttas till ReportStudioV2/V3 lokala useState.
usePdfProfileStore:
använd global profil för brand och “enabled designs”, men detaljer som customerName, projectRef bör vara rapport-specifik metadata, inte profil-state.
Effekt:
Färre globala uppdateringar → lägre risk för UI-lagg.
Memoization & derived data
[Plan A3] Memoisera tunga beräkningar
useRapportData
:
filteredReports redan useMemo, men kan kompletteras med:
tidig retur om filter är tom och sort är default (dvs använd 
reports
 direkt).
RapportPageNew
:
filteredSelectedReport är korrekt useMemo; säkerställ att RapportListPanel är React.memo-wrapad för att undvika onödiga renders när props inte ändras.
Lazy loading & kod-splitting
[Plan A4] Lazy-ladda tunga moduler
RapportSettingsV3
, ReportStudioV2/V3, 
PDFStructureBuilder
, DocumentDesigner:
ladda med next/dynamic när flik/route öppnas.
Effekt:
Dashboard/rapport-huvudvyn laddar snabbare; tunga designverktyg hämtas först vid behov.
PDF & iframes
[Plan A5] Throttle/memoisera PDF-preview
PdfDesigner
:
lägg en liten debounce (t.ex. 200–300 ms) runt generering av previewHtml så att snabba profiländringar inte triggar många iframes i rad.
ReportPreviewDialog
:
se till att 
renderReportToIframe
 bara körs när open ändras från false → true eller när rapporten faktiskt byts.
Global vs lokal state för stora JSON-block
[Plan A6] Tunn global 
reports
-state
Global store (useReportsStore) håller endast:
metadata + sammanfattning (id, title, status, metadata, exportedAt).
Sektioner och assets för en enskild rapport:
laddas on-demand via 
rapportApi.getReport(id)
 (som hämtar från Supabase eller från en reportDetailsStore).
Effekt:
Mindre minnesfotavtryck och snabbare listvy för stora mängder rapporter.
Debounced updates
[Plan A7] Debounce autosave & UI-inputs
I 
ReportEditor
:
autosave redan debounced 2s, men du kan:
endast markera autosaveStatus för fält som faktiskt ändrats.
eventuellt sänka frekvens vid t.ex. snabb textinput (debounce 1–2s är ok).
I 
RapportPageNew
-filter:
debounce sökfilter (t.ex. 200 ms) innan setFilter({ search }).
Effekt:
Smidigare känsla vid textändringar och filtrering.
Flytta tunga operationer till server/web workers (framtid)
[Plan A8] Server-side PDF-render (vid behov)
När V3 HTML-pipelinen är stabil:
införa server-side PDF-render (Playwright/Puppeteer/WASM) så klienten bara får application/pdf.
Effekt:
Mindre CPU-belastning i browsern vid stora rapporter, bättre cross-browser-beteende.
FINAL_STATE
När cleanup + V3-arkitektur är implementerad får du:

Snabbare UI
Rapportlistor jobbar mot tunna, memoiserade stores.
Färre globala redraws när du växlar flikar, sparar eller ändrar små fält.
Report Studio & PDF-designers laddas lazy.
Tunnt och begripligt state
Rapportdomänen har dedikerade stores (rapportReportsStore, rapportTemplatesStore, rapportSectionsStore).
Simple templates och fulla templates delar samma V3-JSON-shape (TemplateSectionV3), skillnaden ligger bara i vilka type-värden som används.
Stabil PDF-rendering
Endast en pipeline (HTML → print-to-PDF / server-PDF) används för alla moderna flows.
React-PDF/legacy stoppas in under /legacy och kan vid behov avvecklas helt.
Ren struktur för templates & reports
report_templates.sections = dokumenterad TemplateSectionV3[].
reports.sections = dokumenterad SectionInstanceV3[].
version-fält i båda tabeller gör tydligt vad som är V3 och vad som är äldre.
Enklare att bygga vidare
Nya features (t.ex. AI-genererade sektioner, automatiska sammanfattningar, ytterligare trades) kan implementeras ovanpå V3-JSON-shapes utan att behöva special-case:a legacy.
rapportApi och 
useRapportData
 ger en stabil, dokumenterad yta för alla UI-komponenter.
AI-vänlighet (GPT, Opus, Gemini, DeepSeek, …)
Modeller kan promptas med:
ReportTemplateV3- och ReportV3-JSON som enda kontrakt.
Tydliga mappings DB ↔ types ↔ stores ↔ API.
Mindre risk att AI “råkar” använda legacy-routes eller felaktiga shapes.
UPPDATERA ARCHITECTURE.md
Föreslagen omstrukturering av 
ARCHITECTURE.md
 för att bli kortare, renare och V3-fokuserad:

1. Översikt
Kort beskrivning av:
ReportTemplateV3, ReportV3
Report Studio V3 (template design)
Rapport V3 (rapportflöde)
Enkel mening: “Legacy-flöden dokumenteras separat i LEGACY_ARCHITECTURE.md”.
2. Databasschema (V3)
Beskriv exakt:
report_templates (inkl. version, design_id, sections = TemplateSectionV3[]).
reports
 (inkl. version, metadata, sections = SectionInstanceV3[]).
Tabell per kolumn och JSON-shape, inspirerat av din nuvarande §2 men bara V3.
3. Kärntyper (V3)
ReportTemplateV3, TemplateSectionV3, ReportV3, SectionInstanceV3, 
PdfDesignId
, 
PdfProfile
.
Håll det kort, med referens till filen 
lib/types/rapport.ts
.
4. State Management (V3)
Lista:
rapportReportsStore, rapportTemplatesStore, rapportSectionsStore.
useRapportDataV3 (med tydlig signatur: vad den returnerar).
useSimpleReportStore som wrapper kring templates, om den behålls.
5. UI-flöden
5.1 Report Studio V3
Route: 
/report-studio
.
Komponenter: ReportStudioV3, TemplateList, TemplateEditor, 
PdfDesigner
, DesignsManager.
Flöde: skapa/uppdatera template → sparas som ReportTemplateV3.
5.2 Rapport V3
Route: 
/rapport
.
Komponenter: 
RapportPageNew
, 
CreateReportWizard
, 
ReportEditor
, 
RapportSettingsSimple
/
RapportSettingsV3
.
Flöde: skapa rapport → redigera → exportera → public link.
6. PDF-pipeline (V3)
Beskriv:
generatePdfHtmlV3 + PDF_DESIGNS (standard & modern_hero).
rapportApi.exportReport
 / 
openPdf
.
Ev. server-PDF route.
7. Edge cases & invariants (V3)
version-fält.
designId måste vara key i PDF_DESIGNS.
SectionInstanceV3.templateSectionId måste peka på befintlig templateSection.
8. Legacy (kort)
2–3 stycken som hänvisar till LEGACY_ARCHITECTURE.md:
React-PDF, ReportFormData, PDFStructureBuilder, RapportContainer, gamla rapport-settings*.*
Status-sammanfattning
Jag har gjort en full genomgång av rapport-/template-/PDF-delarna, identifierat teknisk skuld, JSON- och mapping-problem, samt föreslagit en tydlig V3-arkitektur.
Jag har levererat:
PROBLEM_OVERVIEW
PERFORMANCE_ISSUES
ARCHITECTURE_V3
REFACTOR_PLAN
PERFORMANCE_OPTIMIZATION_PLAN
FINAL_STATE
UPPDATERA ARCHITECTURE.md-struktur
Nästa steg är att du (eller AI i Code-läge) iterativt implementerar REFACTOR_PLAN enligt prioritet, och uppdaterar 
ARCHITECTURE.md
 till den föreslagna V3-strukturen.
Feedback submitted


