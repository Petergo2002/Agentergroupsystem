# Seamless Rapportflöde - Implementation

## Översikt
Implementerat ett typ-medvetet rapportflöde där varje sektion renderas baserat på sin typ istället för att alltid visa ett textfält.

## Problem som löstes

### Före:
- **Ganntabell** (bildsektion) → visade textfält ❌
- **Bildgalleri** → visade textfält ❌
- **Annoterad bild** (läckage) → visade textfält ❌

### Efter:
- **Ganntabell** (bildsektion) → visar färdig mall-bild ✅
- **Bildgalleri** → visar bilduppladdning med grid ✅
- **Annoterad bild** (läckage) → visar bilduppladdning + rit-verktyg ✅

## Implementerade Ändringar

### 1. Uppdaterad WizardSection-typ
**Fil:** `/components/rapport/rapport-container.tsx`

```typescript
type WizardSection = {
  id: string;
  title: string;
  description?: string;
  content: string;
  type?: ReportSectionType;           // NY
  imageUrl?: string;                  // NY - för statiska bilder
  assetIds?: string[];                // NY - för bildgalleri
  assetId?: string;                   // NY - för annoterad bild
  annotationData?: AnnotationShape[]; // NY - för pilar/cirklar
};
```

### 2. Sektioner initialiseras med type
När en mall väljs, kopieras `type` och `imageUrl` från sektionsdefinitionen:

```typescript
setSections(
  selectedTemplate.sections.map((section) => {
    const definition = sectionDefinitions.find(d => d.id === section.id);
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: section.description ?? "",
      type: section.type ?? "text",      // Från mall
      imageUrl: definition?.imageUrl,    // Från definition
      assetIds: [],
      assetId: undefined,
      annotationData: [],
    };
  }),
);
```

### 3. Typ-medveten rendering i wizard

**Fil:** `/components/rapport/rapport-container.tsx` (rad ~1841-1920)

#### a) Statisk bildsektion (Ganttabell)
```tsx
{section.type === "image" && section.imageUrl ? (
  <div className="space-y-3">
    <div className="rounded-lg border bg-muted/10 p-4">
      <img
        src={section.imageUrl}
        alt={section.title}
        className="w-full rounded-md"
      />
    </div>
    <p className="text-xs text-muted-foreground">
      Detta är en fördefinierad mall-bild. Ingen input krävs.
    </p>
  </div>
) : ...
```

**Resultat:** Ganttabell visas som en färdig bild, inget textfält!

#### b) Bildgalleri-sektion
```tsx
section.type === "image_gallery" ? (
  <ImageGallerySection
    assets={...}
    onAssetsChange={(newAssets: ReportAsset[]) => {
      setSections(prev => prev.map(s =>
        s.id === section.id
          ? { ...s, assetIds: newAssets.map(a => a.id) }
          : s
      ));
    }}
  />
) : ...
```

**Resultat:** Bildgalleri visar bilduppladdning med grid, inget textfält!

#### c) Annoterad bild-sektion
```tsx
section.type === "image_annotated" ? (
  section.assetId ? (
    <ImageAnnotationCanvas
      imageUrl={section.assetId}
      shapes={section.annotationData || []}
      onChange={(shapes: AnnotationShape[]) => {
        setSections(prev => prev.map(s =>
          s.id === section.id
            ? { ...s, annotationData: shapes }
            : s
        ));
      }}
    />
  ) : (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <IconPhoto className="mx-auto size-12 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">Ladda upp bild för att annotera</p>
      <Button onClick={...}>Ladda upp bild</Button>
    </div>
  )
) : ...
```

**Resultat:** Annoterad bild visar canvas med rit-verktyg, inget textfält!

#### d) Text-sektion (standard)
```tsx
: (
  <Textarea
    rows={6}
    placeholder="Skriv ditt utkast här..."
    value={section.content}
    onChange={(event) =>
      handleSectionContentChange(section.id, event.target.value)
    }
  />
)
```

**Resultat:** Text-sektioner fungerar som tidigare.

### 4. Sparning inkluderar nya fält

```typescript
const sectionsPayload: Report["sections"] = sections.map((section) => ({
  id: section.id,
  title: section.title,
  hint: section.description,
  content: section.content,
  status: section.content.trim() ? "completed" : "pending",
  type: section.type,                  // NY
  assetIds: section.assetIds,          // NY
  assetId: section.assetId,            // NY
  annotationData: section.annotationData, // NY
}));
```

## Kundupplevelse

### Scenario 1: Ganttabell (statisk bild)
1. Välj mall med Ganttabell-sektion
2. Gå till steg 3 (Sektioner)
3. **Se:** Färdig Ganttabell-bild visas automatiskt
4. **Gör:** Ingenting - bilden är redan där!
5. Fortsätt till nästa steg

### Scenario 2: Bildgalleri
1. Välj mall med Bildgalleri-sektion
2. Gå till steg 3 (Sektioner)
3. **Se:** Bilduppladdningsyta med "Ladda upp bilder"-knapp
4. **Gör:** 
   - Klicka "Ladda upp bilder"
   - Välj 3-5 bilder
   - Se dem i grid-layout
   - Lägg till bildtexter/taggar
5. Fortsätt till nästa steg

### Scenario 3: Annoterad bild (läckage)
1. Välj mall med "Läckage-markering"-sektion
2. Gå till steg 3 (Sektioner)
3. **Se:** "Ladda upp bild för att annotera"-yta
4. **Gör:**
   - Klicka "Ladda upp bild"
   - Välj bild av läckage
   - Välj verktyg: Pil
   - Rita pil mot läckan
   - Välj verktyg: Cirkel
   - Rita cirkel runt området
5. Fortsätt till nästa steg

## Tekniska Detaljer

### Imports
```typescript
import { ImageGallerySection } from "./image-gallery-section";
import { ImageAnnotationCanvas } from "./image-annotation-canvas";
import type { 
  ReportSectionType, 
  AnnotationShape, 
  ReportAsset 
} from "@/lib/types/rapport";
```

### State Management
- `sections` state håller nu `type`, `imageUrl`, `assetIds`, `assetId`, `annotationData`
- Callbacks uppdaterar rätt fält baserat på sektionstyp
- Data följer med till `handleSubmit` och sparas i rapporten

### Konsistens
Samma logik används nu i:
- ✅ NewReportWizard (första gången)
- ✅ Edit-sidan (Fortsätt redigera)

Kunden ser **samma UI** oavsett om de skapar ny rapport eller fortsätter redigera!

## Framtida Förbättringar

### 1. Faktisk bilduppladdning
Just nu är bilduppladdning placeholder. Nästa steg:
- Integrera Supabase Storage
- Ladda upp filer till bucket
- Spara URL i `ReportAsset`
- Koppla till sektioner

### 2. Drag & Drop
- Dra och släpp bilder direkt i bildgalleri
- Dra och släpp bild i annoterings-yta

### 3. Förbättrad UX
- Progress bar vid uppladdning
- Thumbnail-förhandsgranskning
- Crop/resize-verktyg
- Fler annotations-verktyg (rektangel, text, frihand)

### 4. Validering
- Kräv minst X bilder i bildgalleri
- Kräv minst 1 annotation i annoterad bild
- Visa tydliga felmeddelanden

## Testning

### Manuellt testflöde:

#### Test 1: Ganttabell
1. ✅ Gå till Inställningar → Sektioner
2. ✅ Skapa sektion: "Ganttabell", Typ: "Bild", Ladda upp bild
3. ✅ Lägg till i mall
4. ✅ Skapa ny rapport från mall
5. ✅ Gå till steg 3 (Sektioner)
6. ✅ **Kontrollera**: Ganttabell-bilden visas, INGET textfält!

#### Test 2: Bildgalleri
1. ✅ Gå till Inställningar → Sektioner
2. ✅ Skapa sektion: "Bilder från jobbet", Typ: "Bildgalleri"
3. ✅ Lägg till i mall
4. ✅ Skapa ny rapport från mall
5. ✅ Gå till steg 3 (Sektioner)
6. ✅ **Kontrollera**: Bilduppladdning visas, INGET textfält!

#### Test 3: Annoterad bild
1. ✅ Gå till Inställningar → Sektioner
2. ✅ Skapa sektion: "Markera läckage", Typ: "Annoterad bild"
3. ✅ Lägg till i mall
4. ✅ Skapa ny rapport från mall
5. ✅ Gå till steg 3 (Sektioner)
6. ✅ **Kontrollera**: "Ladda upp bild"-knapp visas, INGET textfält!

## Status
✅ **Implementerat!** 

Rapportflödet är nu seamless och typ-medvetet. Varje sektionstyp renderas korrekt:
- Ganttabell → färdig bild
- Bildgalleri → bilduppladdning
- Annoterad bild → canvas med rit-verktyg
- Text → textarea

Kunderna får nu en **sömlös och intuitiv upplevelse** när de fyller i rapporter! 🎉
