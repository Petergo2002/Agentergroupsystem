# Fix: Report Section Type Error

## Problem
När man försöker skapa en ny sektion i Inställningar får man felet:
```
Failed to create report section {}
```

## Orsak
`report_sections`-tabellen i Supabase saknade `type`-kolumnen för de nya sektionstyperna (`image_gallery` och `image_annotated`).

## Lösning

### 1. Migration kördes
Lagt till `type`-kolumn i `report_sections`-tabellen:

```sql
-- Add type column to report_sections table
ALTER TABLE report_sections 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

-- Add check constraint for valid types
ALTER TABLE report_sections
ADD CONSTRAINT report_sections_type_check 
CHECK (type IN ('text', 'image', 'chart', 'image_gallery', 'image_annotated'));

-- Add comment
COMMENT ON COLUMN report_sections.type IS 'Type of section: text, image, chart, image_gallery, or image_annotated';
```

### 2. Kod är redan korrekt
Koden i `lib/store.ts` hanterar redan `type`-fältet korrekt:

- ✅ `createReportSectionRecord` (rad 728): `type: input.type ?? "text"`
- ✅ `updateReportSectionRecord` (rad 765): `type: section.type ?? "text"`
- ✅ `mapReportSectionRow` (rad 622): `type: (row.type as ReportSectionType) ?? "text"`

## Verifiering

### Testa att skapa sektion:
1. Gå till **Rapporter → Inställningar → Sektioner**
2. Klicka "Skapa ny sektion"
3. Fyll i:
   - Titel: "Test bildgalleri"
   - Typ: "Bildgalleri (flera bilder)"
4. Klicka "Spara"
5. ✅ Sektionen ska skapas utan fel

### Testa alla typer:
- ✅ Text
- ✅ Bild
- ✅ Diagram
- ✅ Bildgalleri (flera bilder)
- ✅ Annoterad bild (pilar & cirklar)

## Status
✅ **Fixat!** Migrationen är kördes och `type`-kolumnen finns nu i databasen.

## Om felet kvarstår
Om du fortfarande får felet:
1. Kontrollera att migrationen kördes: Kolla i Supabase Dashboard → SQL Editor
2. Verifiera att `type`-kolumnen finns: 
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'report_sections' AND column_name = 'type';
   ```
3. Testa att skapa en enkel text-sektion först
4. Om det fungerar, testa sedan bildgalleri och annoterad bild

## Nästa steg
Nu kan du:
1. Skapa bildgalleri-sektioner
2. Skapa annoterad bild-sektioner
3. Lägga till dem i mallar
4. Använda dem i rapporter

Allt ska fungera! 🎉
