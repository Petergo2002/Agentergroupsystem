# Fix: Sektionstyp följer med till rapporter

## Problem
När man skapar en bildgalleri- eller annoterad bild-sektion i Inställningar och lägger till den i en mall, så visas den som en text-sektion när man fyller i rapporten.

## Orsak
`type`-fältet kopierades inte när:
1. Sektioner lades till i mallar från sektionsbiblioteket
2. Mallar användes för att skapa rapporter
3. Rapporter laddades från databasen

## Lösning

### 1. Uppdaterat ReportSectionTemplate
**Fil:** `/lib/types/rapport.ts`

Lagt till `type`-fält:
```typescript
export interface ReportSectionTemplate {
  id: string;
  title: string;
  description?: string;
  type?: ReportSectionType; // NY
}
```

### 2. Uppdaterat rapport-settings
**Fil:** `/components/rapport/rapport-settings.tsx`

När sektion läggs till i mall, inkludera `type`:
```typescript
{
  id: definition.id,
  title: definition.title,
  description: definition.description,
  type: definition.type, // NY
}
```

### 3. Uppdaterat normalizeTemplateSections
**Fil:** `/lib/store.ts`

Inkluderar `type` när mall-sektioner normaliseras:
```typescript
return {
  id: section.id ?? randomId(),
  title: fallbackTitle,
  description: section.description ?? "",
  type: section.type ?? "text", // NY
};
```

### 4. Uppdaterat normalizeReportSections
**Fil:** `/lib/store.ts`

Inkluderar alla bildfält när rapport-sektioner normaliseras:
```typescript
return {
  id: section.id ?? randomId(),
  title: section.title ?? `Sektion ${index + 1}`,
  hint: section.hint ?? undefined,
  content,
  status: section.status === "completed" ? "completed" : "pending",
  type: section.type ?? "text", // NY
  assetIds: section.assetIds ?? undefined, // NY
  assetId: section.assetId ?? undefined, // NY
  annotationData: section.annotationData ?? undefined, // NY
  annotatedImageUrl: section.annotatedImageUrl ?? undefined, // NY
};
```

## Verifiering

### Testa bildgalleri-sektion:
1. ✅ Gå till **Rapporter → Inställningar → Sektioner**
2. ✅ Skapa ny sektion: "Test galleri", Typ: "Bildgalleri (flera bilder)"
3. ✅ Gå till **Mallar**-fliken
4. ✅ Välj en mall och lägg till "Test galleri"-sektionen
5. ✅ Gå till **Ny rapport** och skapa rapport från mallen
6. ✅ Klicka "Fortsätt redigera"
7. ✅ Hitta "Test galleri"-sektionen
8. ✅ **Kontrollera**: Du ska se "Ladda upp bilder"-knapp, INTE ett textfält!

### Testa annoterad bild-sektion:
1. ✅ Gå till **Rapporter → Inställningar → Sektioner**
2. ✅ Skapa ny sektion: "Markera läckage", Typ: "Annoterad bild (pilar & cirklar)"
3. ✅ Gå till **Mallar**-fliken
4. ✅ Välj en mall och lägg till "Markera läckage"-sektionen
5. ✅ Gå till **Ny rapport** och skapa rapport från mallen
6. ✅ Klicka "Fortsätt redigera"
7. ✅ Hitta "Markera läckage"-sektionen
8. ✅ **Kontrollera**: Du ska se "Ladda upp bild"-knapp och rit-verktyg, INTE ett textfält!

## Flöde nu fungerar:

```
Inställningar → Skapa sektion (med type: image_gallery)
                        ↓
Mallar → Lägg till sektion (type kopieras med)
                        ↓
Ny rapport → Skapa från mall (type följer med)
                        ↓
Fortsätt redigera → Rätt komponent visas! 
                    (ImageGallerySection eller ImageAnnotationCanvas)
```

## Status
✅ **Fixat!** Nu följer `type`-fältet med genom hela flödet från Inställningar → Mallar → Rapporter.

## Resultat
- **Bildgalleri-sektioner** visar bilduppladdning med grid
- **Annoterad bild-sektioner** visar canvas med rit-verktyg
- **Text-sektioner** visar fortfarande textarea som vanligt

Allt fungerar nu som det ska! 🎉
