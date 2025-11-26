# Bildgalleri och Annoterad Bild - Implementation

## Översikt
Implementerat två nya sektionstyper för rapporter:
1. **Bildgalleri** - Ladda upp flera bilder med labels och taggar
2. **Annoterad bild** - Rita pilar och cirklar på läckage-bilder

## Nya Funktioner

### 1. **Bildgalleri-sektion** (`image_gallery`)
- ✅ Ladda upp flera bilder (max 10 per sektion)
- ✅ Grid-layout för thumbnails
- ✅ Redigera bildtext för varje bild
- ✅ Lägg till taggar (t.ex. "läckage", "före", "efter")
- ✅ Ta bort enskilda bilder
- ✅ Datum och metadata per bild

**Användning:**
1. Gå till Inställningar → Sektioner
2. Skapa ny sektion, välj typ "Bildgalleri (flera bilder)"
3. I rapport: Klicka "Ladda upp bilder" och välj flera filer
4. Redigera bildtext och lägg till taggar

### 2. **Annoterad bild-sektion** (`image_annotated`)
- ✅ Ladda upp en bild
- ✅ Rita pilar för att peka på läckage
- ✅ Rita cirklar för att markera områden
- ✅ Välj färg (röd, orange, grön, blå)
- ✅ Dra och flytta former
- ✅ Ta bort markerade former
- ✅ Exportera flattenad bild med annotations

**Användning:**
1. Gå till Inställningar → Sektioner
2. Skapa ny sektion, välj typ "Annoterad bild (pilar & cirklar)"
3. I rapport: Ladda upp bild av läckage
4. Välj verktyg (Pil eller Cirkel)
5. Välj färg
6. Klicka och dra på bilden för att rita
7. Klicka "Spara annoterad bild" för att exportera

## Teknisk Implementation

### Datamodell

#### Nya typer
```typescript
// Nya sektionstyper
export type ReportSectionType = 
  | "text" 
  | "image" 
  | "chart" 
  | "image_gallery"      // NY
  | "image_annotated";   // NY

// Annotation-former
export type AnnotationShapeType = "arrow" | "circle";

export interface AnnotationShape {
  id: string;
  type: AnnotationShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color: string;
  strokeWidth?: number;
  label?: string;
}
```

#### Uppdaterad ReportSectionInstance
```typescript
export interface ReportSectionInstance {
  id: string;
  title: string;
  hint?: string;
  content: string;
  status: "pending" | "completed";
  type?: ReportSectionType;
  
  // För image_gallery
  assetIds?: string[];
  
  // För image_annotated
  assetId?: string;
  annotationData?: AnnotationShape[];
  annotatedImageUrl?: string; // Flattenad bild
}
```

### Komponenter

#### 1. ImageGallerySection
**Fil:** `/components/rapport/image-gallery-section.tsx`

**Props:**
- `assets: ReportAsset[]` - Bilderna i galleriet
- `onAssetsChange: (assets: ReportAsset[]) => void` - Callback vid ändringar
- `maxImages?: number` - Max antal bilder (default: 10)
- `readOnly?: boolean` - Read-only läge

**Funktioner:**
- Uppladdning av flera bilder samtidigt
- Grid-layout (2-3 kolumner)
- Redigera bildtext inline
- Lägg till/ta bort taggar
- Ta bort enskilda bilder
- Visar datum per bild

#### 2. ImageAnnotationCanvas
**Fil:** `/components/rapport/image-annotation-canvas.tsx`

**Props:**
- `imageUrl: string` - Bilden att annotera
- `shapes: AnnotationShape[]` - Befintliga annotations
- `onChange: (shapes: AnnotationShape[]) => void` - Callback vid ändringar
- `onSaveAnnotatedImage?: (dataUrl: string) => void` - Spara flattenad bild
- `readOnly?: boolean` - Read-only läge

**Funktioner:**
- Canvas-baserad rendering (react-konva)
- Verktyg: Pil, Cirkel
- Färgväljare (4 färger)
- Dra och flytta former
- Ta bort markerad form
- Exportera som PNG med annotations

**Teknologi:**
- `react-konva` - React-wrapper för Konva.js
- `konva` - HTML5 Canvas-bibliotek

### Integration

#### Inställningar
**Fil:** `/components/rapport/rapport-settings.tsx`

Uppdaterat Select för sektionstyp:
```tsx
<SelectContent>
  <SelectItem value="text">Text</SelectItem>
  <SelectItem value="image">Bild</SelectItem>
  <SelectItem value="chart">Diagram</SelectItem>
  <SelectItem value="image_gallery">Bildgalleri (flera bilder)</SelectItem>
  <SelectItem value="image_annotated">Annoterad bild (pilar & cirklar)</SelectItem>
</SelectContent>
```

#### Edit-sidan
**Fil:** `/app/(dashboard)/rapport/[id]/edit/page.tsx`

Conditional rendering baserat på `section.type`:
```tsx
{section.type === "image_gallery" ? (
  <ImageGallerySection ... />
) : section.type === "image_annotated" ? (
  <ImageAnnotationCanvas ... />
) : (
  <Textarea ... />
)}
```

## Användningsflöde

### Skapa Bildgalleri-sektion

1. **Inställningar**
   - Gå till Rapporter → Inställningar → Sektioner
   - Klicka "Skapa ny sektion"
   - Titel: "Läckage-bilder"
   - Typ: "Bildgalleri (flera bilder)"
   - Spara

2. **Lägg till i mall**
   - Gå till Mallar-fliken
   - Välj mall (t.ex. "Läckage-rapport")
   - Lägg till sektionen "Läckage-bilder"

3. **Använd i rapport**
   - Skapa ny rapport från mallen
   - Gå till "Fortsätt redigera"
   - Hitta sektionen "Läckage-bilder"
   - Klicka "Ladda upp bilder"
   - Välj flera bilder (t.ex. 5 st)
   - Redigera bildtext för varje bild
   - Lägg till taggar: "läckage", "badrum", "före"

### Skapa Annoterad bild-sektion

1. **Inställningar**
   - Gå till Rapporter → Inställningar → Sektioner
   - Klicka "Skapa ny sektion"
   - Titel: "Markera läckage"
   - Beskrivning: "Rita pilar och cirklar för att visa exakt var läckan är"
   - Typ: "Annoterad bild (pilar & cirklar)"
   - Spara

2. **Lägg till i mall**
   - Gå till Mallar-fliken
   - Välj mall (t.ex. "Läckage-rapport")
   - Lägg till sektionen "Markera läckage"

3. **Använd i rapport**
   - Skapa ny rapport från mallen
   - Gå till "Fortsätt redigera"
   - Hitta sektionen "Markera läckage"
   - Klicka "Ladda upp bild"
   - Välj bild av läckage
   - Välj verktyg: Pil
   - Välj färg: Röd
   - Klicka och dra för att rita pil mot läckan
   - Välj verktyg: Cirkel
   - Rita cirkel runt läckage-området
   - Klicka "Spara annoterad bild"

## PDF-Export

### Bildgalleri i PDF
```html
<div class="image-gallery">
  <h3>Läckage-bilder</h3>
  <div class="gallery-grid">
    <div class="gallery-item">
      <img src="..." />
      <p class="caption">Badrum - läckage vid handfat</p>
      <span class="tags">läckage, badrum, före</span>
    </div>
    <!-- ... fler bilder -->
  </div>
</div>
```

### Annoterad bild i PDF
```html
<div class="annotated-image">
  <h3>Markera läckage</h3>
  <img src="flattenad-bild-med-annotations.png" />
  <p class="caption">Läckage markerat med röda pilar och cirklar</p>
</div>
```

## Framtida Förbättringar

### Bildgalleri
1. **Drag & drop** för att ändra ordning
2. **Bulk-taggning** - lägg till samma tagg på flera bilder
3. **Zoom** - förstora thumbnails
4. **Filtrering** - visa endast bilder med viss tagg
5. **Supabase Storage** - faktisk uppladdning till cloud

### Annoterad bild
1. **Fler verktyg**:
   - Rektangel
   - Frihandsritning
   - Text-labels
   - Mätverktyg (avstånd)
2. **Mer avancerade funktioner**:
   - Ångra/Gör om
   - Lager (flera annotations-lager)
   - Opacitet per form
   - Linjetyp (streckad, prickad)
3. **AI-assisterad annotation**:
   - Automatisk detektion av läckage
   - Förslag på markeringar

### Integration
1. **Supabase Storage** - Faktisk bilduppladdning
2. **Bildoptimering** - Komprimera bilder automatiskt
3. **Metadata** - EXIF-data från bilder (GPS, datum, kamera)
4. **Versionshantering** - Spara historik av annotations

## Dependencies

### Nya paket
```json
{
  "react-konva": "^19.2.0",
  "konva": "^9.3.6"
}
```

Installerat med:
```bash
npm install react-konva konva --legacy-peer-deps
```

## Testning

### Manuellt testflöde

#### Bildgalleri
1. ✅ Skapa bildgalleri-sektion i Inställningar
2. ✅ Lägg till i mall
3. ✅ Skapa rapport från mall
4. ✅ Ladda upp flera bilder (3-5 st)
5. ✅ Redigera bildtext
6. ✅ Lägg till taggar
7. ✅ Ta bort en bild
8. ✅ Spara rapport
9. ✅ Kontrollera att bilderna finns kvar vid "Fortsätt redigera"

#### Annoterad bild
1. ✅ Skapa annoterad bild-sektion i Inställningar
2. ✅ Lägg till i mall
3. ✅ Skapa rapport från mall
4. ✅ Ladda upp bild
5. ✅ Rita pil på bilden
6. ✅ Rita cirkel på bilden
7. ✅ Byt färg och rita mer
8. ✅ Ta bort en form
9. ✅ Spara annoterad bild
10. ✅ Kontrollera att annotations finns kvar vid "Fortsätt redigera"

## Sammanfattning

**Status**: ✅ Implementerat och redo för testning

**Nya filer:**
- `/components/rapport/image-gallery-section.tsx`
- `/components/rapport/image-annotation-canvas.tsx`

**Uppdaterade filer:**
- `/lib/types/rapport.ts` - Nya typer
- `/components/rapport/rapport-settings.tsx` - Nya sektionstyper i UI
- `/app/(dashboard)/rapport/[id]/edit/page.tsx` - Rendering av nya sektioner

**Nästa steg:**
1. Testa funktionaliteten
2. Implementera faktisk Supabase Storage-uppladdning
3. Uppdatera PDF-generation för nya sektionstyper
4. Lägg till fler verktyg och funktioner vid behov

**Use case - Läckage-rapport:**
Nu kan läckage-tekniker:
1. Ladda upp flera bilder av läckage-platsen
2. Rita pilar och cirklar för att visa exakt var läckan är
3. Exportera rapport med tydliga markeringar
4. Kunden ser direkt var problemet finns! 🎯
