# Testguide - Bilduppladdning

## Förberedelser

### 1. Starta applikationen
```bash
npm run dev
```

### 2. Verifiera Supabase Storage
Gå till Supabase Dashboard → Storage → Kontrollera att `images` bucket finns

## Test 1: Ladda upp bild i rapport-sektion

### Steg:
1. Navigera till `/rapport`
2. Klicka på **Inställningar**-fliken
3. Klicka på **Bibliotek**-underfliken
4. Fyll i formuläret:
   - **Titel**: "Test Bild Sektion"
   - **Typ**: Välj "Bild"
5. Klicka på uppladdningsområdet (grå box med kamera-ikon)
6. Välj en testbild från din dator (t.ex. en PNG eller JPEG < 5MB)
7. Vänta på uppladdning (spinner visas)
8. Fyll i **Alt-text**: "Test bild beskrivning"
9. Klicka **Lägg till sektion**

### Förväntat resultat:
- ✅ Uppladdning startar med spinner
- ✅ Toast-meddelande: "Bild uppladdad!"
- ✅ Bildförhandsgranskning visas
- ✅ Toast-meddelande: "Sektion skapad"
- ✅ Sektionen visas i biblioteket med miniatyrbild

### Verifiera i Supabase:
```sql
-- Kontrollera att bilden finns i storage
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'images' 
ORDER BY created_at DESC 
LIMIT 5;

-- Kontrollera att sektionen sparades med bild-URL
SELECT id, title, type, image_url 
FROM report_sections 
WHERE type = 'image' 
ORDER BY created_at DESC 
LIMIT 1;
```

## Test 2: Byt bild i befintlig sektion

### Steg:
1. I biblioteket, hitta sektionen du just skapade
2. Klicka på bilden för att expandera
3. Klicka på **"Byt bild"**-knappen
4. Välj en annan bild
5. Vänta på uppladdning

### Förväntat resultat:
- ✅ Ny bild laddas upp
- ✅ Gammal bild ersätts
- ✅ Toast-meddelande: "Bild uppladdad!"
- ✅ Ny bild visas i förhandsgranskning

## Test 3: Ta bort bild från sektion

### Steg:
1. I biblioteket, hitta en bild-sektion
2. Klicka på **papperskorgs-ikonen**
3. Bekräfta borttagning

### Förväntat resultat:
- ✅ Bilden försvinner från förhandsgranskning
- ✅ Toast-meddelande: "Bild borttagen"
- ✅ Uppladdningsområdet visas igen
- ✅ Bilden tas bort från Supabase Storage

## Test 4: Validering - För stor fil

### Steg:
1. Försök ladda upp en bild > 5MB
2. Välj filen

### Förväntat resultat:
- ✅ Toast-meddelande: "Filen är för stor. Max 5MB."
- ✅ Ingen uppladdning sker
- ✅ Formuläret återställs

## Test 5: Validering - Ogiltig filtyp

### Steg:
1. Försök ladda upp en PDF eller annan icke-bild-fil
2. Välj filen

### Förväntat resultat:
- ✅ Toast-meddelande: "Ogiltig filtyp. Använd JPEG, PNG, GIF, WebP eller SVG."
- ✅ Ingen uppladdning sker

## Test 6: Ladda upp företagslogotyp

### Steg:
1. Navigera till `/settings`
2. Scrolla ner till "Företagsprofil"
3. Under "Logotyp", klicka på uppladdningsområdet
4. Välj en logotyp (helst kvadratisk, < 2MB)
5. Vänta på uppladdning
6. Klicka **Spara företagsprofil**

### Förväntat resultat:
- ✅ Logotypen laddas upp
- ✅ Förhandsgranskning visas (kvadratisk aspect ratio)
- ✅ Toast-meddelande: "Bild uppladdad!"
- ✅ Toast-meddelande: "Företagsprofil uppdaterad"
- ✅ Logotypen visas i sidomenyn (vänstra hörnet)

### Verifiera:
1. Ladda om sidan
2. Kontrollera att logotypen fortfarande visas i sidomenyn
3. Gå till inställningar igen
4. Kontrollera att logotypen visas i förhandsgranskning

## Test 7: Använd bild-sektion i rapport

### Steg:
1. Gå till **Rapporter** → **Ny rapport**
2. Välj en mall
3. Gå till **Inställningar** → **Mallar**
4. Välj samma mall
5. Klicka **Lägg till sektioner**
6. Välj bild-sektionen du skapade
7. Gå tillbaka till **Ny rapport**
8. Skapa en rapport med denna mall
9. I **Granska**-steget, klicka **Förhandsgranska rapport**

### Förväntat resultat:
- ✅ Bild-sektionen visas i rapporten
- ✅ Bilden renderas korrekt
- ✅ Alt-text visas under bilden
- ✅ Rapporten ser professionell ut

## Test 8: Prestanda - Flera bilder

### Steg:
1. Ladda upp 5 olika bilder i olika sektioner
2. Skapa en rapport med alla dessa sektioner
3. Förhandsgranska rapporten

### Förväntat resultat:
- ✅ Alla bilder laddas korrekt
- ✅ Ingen märkbar fördröjning
- ✅ Bilder visas i rätt ordning
- ✅ Scrollning är smidig

## Test 9: Nätverksproblem (simulering)

### Steg:
1. Öppna DevTools → Network
2. Throttle till "Slow 3G"
3. Försök ladda upp en bild

### Förväntat resultat:
- ✅ Spinner visas under hela uppladdningen
- ✅ Användaren kan inte klicka på andra knappar under uppladdning
- ✅ Toast-meddelande visas när uppladdning är klar
- ✅ Ingen dubbel-uppladdning sker

## Test 10: Autentisering

### Steg:
1. Logga ut från applikationen
2. Försök navigera till `/settings`
3. Logga in igen
4. Ladda upp en bild

### Förväntat resultat:
- ✅ Omdirigeras till login om inte autentiserad
- ✅ Efter inloggning kan bilder laddas upp
- ✅ RLS policies fungerar korrekt

## Felsökning

### Problem: "Kunde inte ladda upp bilden"

**Kontrollera:**
1. Är användaren inloggad?
2. Finns `images` bucket i Supabase?
3. Är RLS policies korrekt konfigurerade?

**Debug:**
```javascript
// Öppna Console i DevTools
// Kolla efter fel-meddelanden
// Kontrollera Network-fliken för misslyckade requests
```

### Problem: Bilden visas inte efter uppladdning

**Kontrollera:**
1. Är bucket public?
2. Är URL:en korrekt?
3. Finns bilden i storage?

**Debug:**
```sql
-- Kontrollera bucket settings
SELECT id, name, public FROM storage.buckets WHERE id = 'images';

-- Kontrollera senaste uppladdade bilder
SELECT name, bucket_id, created_at, owner 
FROM storage.objects 
WHERE bucket_id = 'images' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Problem: Logotypen visas inte i sidomenyn

**Kontrollera:**
1. Är logotyp-URL:en sparad i organisationen?
2. Har sidan laddats om efter sparning?
3. Finns komponenten som visar logotypen?

**Debug:**
```sql
-- Kontrollera organisation data
SELECT id, name, logo_url FROM organizations WHERE id = 'YOUR_ORG_ID';
```

## Testbilder

Använd dessa testbilder för olika scenarion:

### Små bilder (< 100KB)
- Logotyper
- Ikoner
- Små diagram

### Medelstora bilder (100KB - 1MB)
- Produktbilder
- Porträtt
- Screenshots

### Stora bilder (1MB - 5MB)
- Högupplösta foton
- Detaljerade diagram
- Panoramabilder

### Olika format
- JPEG: Foton
- PNG: Logotyper med transparens
- WebP: Modern komprimering
- SVG: Vektorgrafik
- GIF: Animationer (om stödjs)

## Checklista

Efter alla tester, verifiera:

- [ ] Bilder laddas upp korrekt till Supabase Storage
- [ ] Bilder visas i förhandsgranskning
- [ ] Bilder kan bytas ut
- [ ] Bilder kan tas bort
- [ ] Validering fungerar (storlek och typ)
- [ ] Toast-notifikationer visas korrekt
- [ ] Logotyp visas i sidomenyn
- [ ] Bild-sektioner fungerar i rapporter
- [ ] Prestanda är acceptabel
- [ ] RLS policies fungerar
- [ ] Autentisering krävs för uppladdning
- [ ] Felhantering fungerar korrekt

## Nästa steg

Efter godkända tester:
1. ✅ Dokumentera för slutanvändare
2. ✅ Skapa video-tutorial
3. ✅ Implementera bildkomprimering
4. ✅ Lägg till drag & drop
5. ✅ Implementera bildeditor

## Support

Vid problem, kontakta utvecklingsteamet med:
- Skärmdumpar av fel
- Browser Console-loggar
- Network-fliken i DevTools
- Steg för att reproducera problemet
