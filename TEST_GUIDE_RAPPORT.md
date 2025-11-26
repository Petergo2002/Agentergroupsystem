# Testguide - Rapport Förhandsgranskning och Bild-sektioner

## Snabbstart

### 1. Starta applikationen
```bash
npm run dev
```

### 2. Navigera till Rapporter
Gå till `/rapport` i din webbläsare

## Test 1: Skapa en bild-sektion

### Steg:
1. Klicka på **Inställningar**-fliken
2. Klicka på **Bibliotek**-underfliken
3. I "Skapa sektion"-formuläret:
   - **Titel**: "Företagslogotyp"
   - **Typ**: Välj "Bild" från dropdown
   - **Bild-URL**: `https://via.placeholder.com/400x200/0ea5e9/ffffff?text=Företagslogotyp`
   - **Alt-text**: "Företagets logotyp"
   - **Förifylld text**: "Detta är vår företagslogotyp"
   - **Standardsektion**: Aktivera switchen
4. Klicka **Lägg till sektion**

### Förväntat resultat:
- ✅ Sektionen skapas och visas i biblioteket
- ✅ Ett toast-meddelande "Sektion skapad" visas
- ✅ Formuläret återställs

## Test 2: Lägg till bild-sektion i en mall

### Steg:
1. Gå till **Mallar**-fliken i Inställningar
2. Välj en befintlig mall (t.ex. "Byggrapport")
3. Klicka **Lägg till sektioner**
4. I dialogen, hitta "Företagslogotyp" och klicka på den
5. Stäng dialogen

### Förväntat resultat:
- ✅ Bild-sektionen läggs till i mallens sektionslista
- ✅ Du ser sektionen i "Sektioner i mallen"-listan

## Test 3: Skapa rapport med bild-sektion

### Steg:
1. Gå till **Ny rapport**-fliken
2. **Steg 1 - Välj mall**: Välj mallen du just uppdaterade
3. **Steg 2 - Grunddata**:
   - Kund: "Test AB"
   - Plats: "Stockholm"
4. **Steg 3 - Sektioner**: 
   - Fyll i text för text-sektionerna
   - Bild-sektionen ska redan ha förifylld text
5. **Steg 4 - Granska**: 
   - Klicka på **"Förhandsgranska rapport"**-knappen

### Förväntat resultat:
- ✅ En fullskärms-dialog öppnas
- ✅ Rapporten visas med all metadata
- ✅ Bild-sektionen visar bilden korrekt
- ✅ Text-sektioner visar text
- ✅ Alt-text visas under bilden

## Test 4: Testa förhandsgransknings-funktioner

### I förhandsgransknings-dialogen:
1. Scrolla genom rapporten
2. Klicka på **"Skriv ut"** (öppnar print-dialog)
3. Klicka på **"Exportera PDF"** (visar console.log för närvarande)
4. Klicka på **"Fortsätt redigera"** (stänger dialogen)

### Förväntat resultat:
- ✅ Scrollning fungerar smidigt
- ✅ Print-dialog öppnas
- ✅ PDF-knapp visar meddelande i konsolen
- ✅ Dialog stängs och du är tillbaka i wizard

## Test 5: Validering av bild-sektion

### Steg:
1. Gå till **Inställningar** → **Bibliotek**
2. Försök skapa en bild-sektion:
   - **Titel**: "Test"
   - **Typ**: "Bild"
   - **Bild-URL**: (lämna tom)
3. Klicka **Lägg till sektion**

### Förväntat resultat:
- ✅ Ett felmeddelande visas: "Ange en bild-URL för bild-sektionen"
- ✅ Sektionen skapas INTE

## Test 6: Standard-sektion

### Steg:
1. Skapa en ny bild-sektion med **Standardsektion** aktiverad
2. Gå till **Mallar** och skapa en ny mall
3. Kontrollera om standard-sektionen automatiskt inkluderas

### Förväntat resultat:
- ✅ Standard-sektionen ska automatiskt läggas till i nya mallar
- ✅ Flaggan `is_default_section` är true i databasen

## Test 7: Databas-verifiering

### Kör i Supabase SQL Editor:
```sql
-- Kontrollera att nya kolumner finns
SELECT 
  id,
  title,
  type,
  image_url,
  image_alt_text,
  is_default_section
FROM report_sections
WHERE type = 'image';
```

### Förväntat resultat:
- ✅ Alla bild-sektioner visas med korrekt data
- ✅ `type` är 'image'
- ✅ `image_url` innehåller URL
- ✅ `image_alt_text` innehåller alt-text

## Test 8: Bakåtkompatibilitet

### Steg:
1. Skapa en vanlig text-sektion (typ: "Text")
2. Lägg till den i en mall
3. Skapa en rapport med denna mall
4. Förhandsgranska rapporten

### Förväntat resultat:
- ✅ Text-sektioner fungerar exakt som tidigare
- ✅ Ingen bild-URL eller alt-text krävs
- ✅ Rapporten visas korrekt i förhandsgranskning

## Felsökning

### Problem: Bild visas inte i förhandsgranskning
**Lösning**: 
- Kontrollera att bild-URL:en är giltig och tillgänglig
- Öppna browser DevTools och kolla Console för fel
- Verifiera att CORS är konfigurerat korrekt för bild-URL:en

### Problem: "Cannot find name ReportSectionType" fel
**Lösning**:
- Kör `npm run build` för att kompilera TypeScript
- Kontrollera att `lib/types/rapport.ts` innehåller `ReportSectionType`

### Problem: Migration körs inte
**Lösning**:
```bash
# Kontrollera Supabase-status
npx supabase status

# Kör migrationer manuellt
npx supabase db push
```

## Exempel-bilder för testning

Använd dessa placeholder-bilder för testning:

```
# Logotyp (400x200)
https://via.placeholder.com/400x200/0ea5e9/ffffff?text=Företagslogotyp

# Diagram (600x400)
https://via.placeholder.com/600x400/10b981/ffffff?text=Diagram

# Foto (800x600)
https://via.placeholder.com/800x600/f59e0b/ffffff?text=Projektfoto

# Ikon (150x150)
https://via.placeholder.com/150/8b5cf6/ffffff?text=Ikon
```

## Nästa steg

Efter att alla tester är godkända:
1. ✅ Implementera PDF-export
2. ✅ Lägg till bilduppladdning (Supabase Storage)
3. ✅ Implementera bild-förhandsgranskning i inställningar
4. ✅ Lägg till drag & drop för sektionsordning

## Support

Om du stöter på problem, kontrollera:
- Browser Console för JavaScript-fel
- Supabase Dashboard för databas-fel
- Network-fliken i DevTools för API-anrop
