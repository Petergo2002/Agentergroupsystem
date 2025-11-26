# Rapport Förhandsgranskning och Bild-sektioner - Implementationssammanfattning

## Översikt
Implementerat två nya funktioner för rapportsystemet:
1. **Förhandsgranskning av rapport** - Möjlighet att se hur rapporten kommer se ut innan den skapas
2. **Bild-sektioner** - Stöd för att skapa sektioner som visar bilder i rapporter

## 1. Databasändringar

### Migration: `add_image_sections_support`
Tillagda kolumner i `report_sections` tabellen:
- `type` - TEXT (text, image, chart) - Default: 'text'
- `image_url` - TEXT (nullable) - URL till bild
- `image_alt_text` - TEXT (nullable) - Alt-text för tillgänglighet
- `is_default_section` - BOOLEAN - Default: false - Markerar om sektionen ska inkluderas automatiskt

Index skapade:
- `idx_report_sections_type` - För snabbare queries på typ
- `idx_report_sections_default` - För snabbare queries på standard-sektioner

## 2. TypeScript Types

### Uppdaterade filer:
- **`lib/types/rapport.ts`**
  - Lagt till `ReportSectionType` type: `"text" | "image" | "chart"`
  - Uppdaterat `ReportSectionDefinition` med nya fält:
    - `type?: ReportSectionType`
    - `imageUrl?: string`
    - `imageAltText?: string`
    - `isDefaultSection?: boolean`

- **`lib/database.types.ts`**
  - Lagt till `report_sections` tabell-definition med alla nya fält

- **`lib/store.ts`**
  - Uppdaterat `mapReportSectionRow()` för att mappa nya fält
  - Uppdaterat `createReportSectionRecord()` för att hantera bild-data
  - Uppdaterat `updateReportSectionRecord()` för att uppdatera bild-data
  - Importerat `ReportSectionType`

## 3. UI-komponenter

### Nya komponenter:

#### `components/rapport/report-view.tsx`
Återanvändbar komponent för att rendera rapporter:
- Visar rapportens metadata (klient, plats, status, etc.)
- Renderar alla sektioner baserat på typ:
  - **Text-sektioner**: Visar innehåll som text
  - **Bild-sektioner**: Visar bild med alt-text
  - **Chart-sektioner**: Placeholder för framtida implementation
- Visar checklista med status
- Visar bilagor/assets
- Stöder både redigeringsläge och read-only läge

#### `components/rapport/report-preview-dialog.tsx`
Dialog för förhandsgranskning:
- Fullskärms modal (90vh höjd)
- Använder `ReportView` för rendering
- Knappar för:
  - Skriv ut (window.print())
  - Exportera PDF (placeholder)
  - Stäng
  - Fortsätt redigera
- Scrollbar för långa rapporter

### Uppdaterade komponenter:

#### `components/rapport/rapport-settings.tsx`
Uppdaterat formulär för att skapa sektioner:
- **Typ-väljare**: Dropdown med Text, Bild, Diagram
- **Bild-URL fält**: Visas endast när typ = "image"
- **Alt-text fält**: Visas endast när typ = "image"
- **Standard-sektion switch**: Markera om sektionen ska inkluderas automatiskt
- Validering: Kräver bild-URL om typ är "image"

State uppdaterat:
```typescript
const [newSection, setNewSection] = useState({ 
  title: "", 
  description: "", 
  type: "text" as "text" | "image" | "chart",
  imageUrl: "",
  imageAltText: "",
  isDefaultSection: false
});
```

#### `components/rapport/rapport-container.tsx`
Lagt till förhandsgransknings-funktionalitet:
- Importerat `ReportPreviewDialog` och `fetchReportSections`
- Lagt till state:
  - `isPreviewOpen` - Kontrollerar om preview-dialog är öppen
  - `sectionDefinitions` - Lagrar alla sektionsdefinitioner
- Lagt till `useEffect` för att ladda sektionsdefinitioner
- Lagt till `buildPreviewReport()` - Bygger en preview-rapport från formulärdata
- Lagt till "Förhandsgranska rapport"-knapp i review-steget
- Lagt till `<ReportPreviewDialog>` komponent i slutet av wizard

## 4. Användarflöde

### Skapa bild-sektion:
1. Gå till **Rapporter** → **Inställningar** → **Bibliotek**
2. Fyll i:
   - Titel (t.ex. "Företagslogotyp")
   - Välj typ: **Bild**
   - Ange bild-URL (t.ex. "https://exempel.se/logo.png")
   - Ange alt-text (t.ex. "Företagets logotyp")
   - (Valfritt) Markera som standardsektion
3. Klicka "Lägg till sektion"
4. Sektionen är nu tillgänglig i biblioteket

### Använda bild-sektion i rapport:
1. Gå till **Mallar**-fliken
2. Välj en mall
3. Klicka "Lägg till sektioner"
4. Välj bild-sektionen från listan
5. Bild-sektionen kommer nu visas i alla rapporter som använder denna mall

### Förhandsgranska rapport:
1. Skapa en ny rapport (välj mall, fyll i detaljer, skriv sektioner)
2. I **Granska**-steget, klicka på "Förhandsgranska rapport"
3. En fullskärms-dialog öppnas med exakt hur rapporten kommer se ut
4. Bild-sektioner visas med sina bilder
5. Klicka "Fortsätt redigera" för att gå tillbaka eller "Stäng" för att stänga

## 5. Tekniska detaljer

### Bild-rendering:
```typescript
{sectionType === "image" && definition?.imageUrl ? (
  <div className="rounded-lg border overflow-hidden">
    <img
      src={definition.imageUrl}
      alt={definition.imageAltText || section.title}
      className="w-full h-auto"
    />
    {definition.imageAltText && (
      <p className="p-2 text-xs text-gray-500 bg-gray-50">
        {definition.imageAltText}
      </p>
    )}
  </div>
) : (
  // Text-rendering
)}
```

### Preview-rapport byggning:
```typescript
const buildPreviewReport = (): Report => {
  return {
    id: "preview",
    title: form.title.trim() || `${selectedTemplate?.name || "Ny"} rapport`,
    status: "draft",
    type: selectedTemplate?.trade || "bygg",
    templateId: selectedTemplate?.id || "",
    metadata: { /* ... */ },
    sections: sections.map((section) => ({ /* ... */ })),
    checklist,
    assets: [],
    updatedAt: new Date().toISOString(),
  };
};
```

## 6. Framtida förbättringar

### Kort sikt:
- [ ] PDF-export funktionalitet (för närvarande placeholder)
- [ ] Bilduppladdning istället för endast URL
- [ ] Bild-förhandsgranskning i inställningar
- [ ] Drag & drop för att ändra ordning på sektioner i preview

### Lång sikt:
- [ ] Chart/diagram-sektioner implementation
- [ ] Rich text editor för text-sektioner
- [ ] Versionshantering av rapporter
- [ ] Kommentarer och godkännanden
- [ ] E-signering av rapporter

## 7. Testning

### Manuell testning:
1. **Skapa text-sektion**: Verifiera att den fungerar som tidigare
2. **Skapa bild-sektion**: 
   - Utan bild-URL → Ska ge felmeddelande
   - Med bild-URL → Ska skapas framgångsrikt
3. **Förhandsgranska rapport**:
   - Med text-sektioner → Ska visa text korrekt
   - Med bild-sektioner → Ska visa bilder
   - Med tom rapport → Ska visa "Inget innehåll ännu"
4. **Standard-sektioner**: Markera en sektion som standard och verifiera att den inkluderas automatiskt

### Databas-test:
```sql
-- Verifiera att kolumnerna finns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'report_sections';

-- Skapa en test-bild-sektion
INSERT INTO report_sections (title, type, image_url, image_alt_text, is_default_section)
VALUES ('Test Logo', 'image', 'https://via.placeholder.com/150', 'Test logo', true);
```

## 8. Säkerhet

### Bild-URL validering:
- För närvarande accepteras alla URL:er
- **Rekommendation**: Lägg till URL-validering på backend
- **Rekommendation**: Implementera Content Security Policy (CSP) för bilder

### XSS-skydd:
- React hanterar automatiskt XSS i text-innehåll
- Bild-URL:er bör valideras för att förhindra javascript: protokoll

## 9. Prestanda

### Optimeringar:
- Index på `type` och `is_default_section` för snabbare queries
- Lazy loading av sektionsdefinitioner (laddas endast när behövs)
- Memoization av `buildPreviewReport()` kan läggas till om prestanda blir ett problem

### Rekommendationer:
- Implementera bild-caching
- Överväg CDN för bilder
- Lazy loading av bilder i långa rapporter

## Sammanfattning

Implementationen är klar och funktionell. Användare kan nu:
1. ✅ Skapa bild-sektioner med URL och alt-text
2. ✅ Markera sektioner som standard-sektioner
3. ✅ Förhandsgranska rapporter innan de skapas
4. ✅ Se exakt hur rapporten kommer se ut med alla sektioner (text och bild)

Alla ändringar är bakåtkompatibla - befintliga text-sektioner fungerar som tidigare.
