# Bilduppladdning Implementation - Sammanfattning

## Översikt
Implementerat bilduppladdning med Supabase Storage för att ersätta URL-baserad bildhantering. Användare kan nu ladda upp bilder direkt istället för att ange URL:er.

## Implementerade funktioner

### 1. Supabase Storage Setup

#### Storage Bucket
- **Bucket ID**: `images`
- **Public**: Ja (bilder är publikt tillgängliga)
- **Max filstorlek**: 5MB
- **Tillåtna filtyper**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

#### RLS Policies
```sql
-- Autentiserade användare kan ladda upp bilder
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Alla kan se bilder (public)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Användare kan uppdatera sina egna bilder
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid());

-- Användare kan ta bort sina egna bilder
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND owner = auth.uid());
```

### 2. ImageUpload Komponent

#### Fil: `components/ui/image-upload.tsx`

**Features:**
- ✅ Drag & drop-liknande UI
- ✅ Filvalidering (typ och storlek)
- ✅ Bildförhandsgranskning
- ✅ Uppladdningsstatus med spinner
- ✅ Ta bort bild-funktion
- ✅ Byt bild-funktion
- ✅ Automatisk filnamn-generering
- ✅ Toast-notifikationer

**Props:**
```typescript
interface ImageUploadProps {
  value?: string;              // Nuvarande bild-URL
  onChange: (url: string) => void;  // Callback när bild laddas upp
  onRemove?: () => void;       // Callback när bild tas bort
  bucket?: string;             // Storage bucket (default: "images")
  maxSizeMB?: number;          // Max filstorlek i MB (default: 5)
  aspectRatio?: string;        // CSS aspect-ratio (t.ex. "1/1", "16/9")
  className?: string;          // Extra CSS-klasser
}
```

**Användning:**
```tsx
<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  onRemove={() => setImageUrl("")}
  maxSizeMB={5}
  aspectRatio="16/9"
/>
```

### 3. Rapport-sektioner

#### Uppdaterad fil: `components/rapport/rapport-settings.tsx`

**Före:**
```tsx
<Input
  type="url"
  placeholder="https://exempel.se/bild.jpg"
  value={newSection.imageUrl}
  onChange={(e) => setNewSection({...prev, imageUrl: e.target.value})}
/>
```

**Efter:**
```tsx
<ImageUpload
  value={newSection.imageUrl}
  onChange={(url) => setNewSection({...prev, imageUrl: url})}
  onRemove={() => setNewSection({...prev, imageUrl: ""})}
  maxSizeMB={5}
/>
```

**Fördelar:**
- ✅ Ingen manuell URL-inmatning
- ✅ Bilder lagras säkert i Supabase Storage
- ✅ Automatisk validering
- ✅ Bättre användarupplevelse

### 4. Användarinställningar (Logotyp)

#### Uppdaterad fil: `app/(dashboard)/settings/page.tsx`

**Före:**
```tsx
<Label htmlFor="logoUrl">Logotyp URL</Label>
<Input
  id="logoUrl"
  type="url"
  value={branding.logoUrl}
  onChange={(e) => setBranding({...prev, logoUrl: e.target.value})}
  placeholder="https://exempel.se/logga.png"
/>
```

**Efter:**
```tsx
<Label>Logotyp</Label>
<p className="text-sm text-muted-foreground mb-2">
  Ladda upp din företagslogotyp som visas i sidomenyn
</p>
<ImageUpload
  value={branding.logoUrl}
  onChange={(url) => setBranding({...prev, logoUrl: url})}
  onRemove={() => setBranding({...prev, logoUrl: ""})}
  maxSizeMB={2}
  aspectRatio="1/1"
/>
```

**Fördelar:**
- ✅ Kvadratisk aspect ratio (1:1) för logotyper
- ✅ Mindre max filstorlek (2MB) för snabbare laddning
- ✅ Direkt förhandsgranskning
- ✅ Enkel att byta eller ta bort logotyp

## Teknisk implementation

### Uppladdningsflöde

```typescript
// 1. Användaren väljer en fil
const file = event.target.files?.[0];

// 2. Validera filtyp och storlek
if (!validTypes.includes(file.type)) {
  toast.error("Ogiltig filtyp");
  return;
}

if (file.size > maxSize) {
  toast.error(`Filen är för stor. Max ${maxSizeMB}MB.`);
  return;
}

// 3. Generera unikt filnamn
const fileExt = file.name.split(".").pop();
const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

// 4. Ladda upp till Supabase Storage
const { data, error } = await supabase.storage
  .from(bucket)
  .upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

// 5. Hämta public URL
const { data: urlData } = supabase.storage
  .from(bucket)
  .getPublicUrl(fileName);

// 6. Returnera URL till parent-komponent
onChange(urlData.publicUrl);
```

### Borttagningsflöde

```typescript
// 1. Extrahera filnamn från URL
const url = new URL(imageUrl);
const pathParts = url.pathname.split("/");
const fileName = pathParts[pathParts.length - 1];

// 2. Ta bort från Supabase Storage
const { error } = await supabase.storage
  .from(bucket)
  .remove([fileName]);

// 3. Uppdatera state
onChange("");
```

## Säkerhet

### RLS Policies
- ✅ Endast autentiserade användare kan ladda upp
- ✅ Användare kan endast ta bort sina egna bilder
- ✅ Alla kan se bilder (public bucket)

### Validering
- ✅ Filtyp-validering på frontend
- ✅ Filstorlek-validering på frontend
- ✅ Supabase Storage har ytterligare validering på backend

### Best Practices
- ✅ Unika filnamn förhindrar kollisioner
- ✅ Cache-control headers för bättre prestanda
- ✅ Error handling med try-catch
- ✅ Toast-notifikationer för feedback

## Användning

### 1. Ladda upp bild i rapport-sektion

**Steg:**
1. Gå till **Rapporter** → **Inställningar** → **Bibliotek**
2. Skapa ny sektion
3. Välj typ: **Bild**
4. Klicka på uppladdningsområdet
5. Välj en bild från din dator (max 5MB)
6. Vänta på uppladdning
7. Bilden visas som förhandsgranskning
8. Fyll i alt-text
9. Klicka **Lägg till sektion**

**Resultat:**
- ✅ Bilden laddas upp till Supabase Storage
- ✅ URL sparas i databasen
- ✅ Bilden visas i alla rapporter som använder denna sektion

### 2. Ladda upp företagslogotyp

**Steg:**
1. Gå till **Inställningar** (huvudmenyn)
2. Scrolla ner till "Företagsprofil"
3. Klicka på uppladdningsområdet under "Logotyp"
4. Välj din logotyp (max 2MB, helst kvadratisk)
5. Vänta på uppladdning
6. Logotypen visas som förhandsgranskning
7. Klicka **Spara företagsprofil**

**Resultat:**
- ✅ Logotypen laddas upp till Supabase Storage
- ✅ URL sparas i organisationens data
- ✅ Logotypen visas i sidomenyn (vänstra hörnet)

## Felsökning

### Problem: "Kunde inte ladda upp bilden"

**Möjliga orsaker:**
1. Användaren är inte autentiserad
2. Storage bucket finns inte
3. RLS policies är inte korrekt konfigurerade
4. Nätverksproblem

**Lösning:**
```bash
# Kontrollera att bucket finns
SELECT * FROM storage.buckets WHERE id = 'images';

# Kontrollera RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

# Testa uppladdning manuellt i Supabase Dashboard
```

### Problem: Bilden visas inte efter uppladdning

**Möjliga orsaker:**
1. Bucket är inte public
2. CORS-problem
3. Felaktig URL

**Lösning:**
```sql
-- Sätt bucket till public
UPDATE storage.buckets SET public = true WHERE id = 'images';

-- Kontrollera URL-format
SELECT name, bucket_id FROM storage.objects WHERE bucket_id = 'images' LIMIT 5;
```

### Problem: "Filen är för stor"

**Lösning:**
- Komprimera bilden innan uppladdning
- Använd verktyg som TinyPNG eller Squoosh
- Rekommenderad storlek: < 1MB för logotyper, < 2MB för rapport-bilder

## Prestanda

### Optimeringar
- ✅ Cache-control headers (1 timme)
- ✅ Lazy loading av bilder
- ✅ Komprimering på Supabase-sidan
- ✅ CDN via Supabase

### Rekommendationer
- Använd WebP-format för bättre komprimering
- Optimera bilder innan uppladdning
- Använd aspect-ratio för att förhindra layout shift
- Implementera progressive loading för stora bilder

## Framtida förbättringar

### Kort sikt
- [ ] Bildkomprimering på frontend innan uppladdning
- [ ] Drag & drop-funktionalitet
- [ ] Multipla bilder samtidigt
- [ ] Bildeditor (crop, rotate, resize)

### Lång sikt
- [ ] AI-baserad bildoptimering
- [ ] Automatisk alt-text generering med AI
- [ ] Bildgalleri med sökfunktion
- [ ] Versionshantering av bilder
- [ ] Automatisk backup till annan storage

## Kostnader

### Supabase Storage Pricing
- **Gratis tier**: 1GB storage, 2GB bandwidth/månad
- **Pro tier**: $0.021/GB storage, $0.09/GB bandwidth

### Uppskattning
- Genomsnittlig bildstorlek: 500KB
- 100 bilder = 50MB storage ≈ $0.001/månad
- 1000 visningar/månad = 500MB bandwidth ≈ $0.045/månad

**Total kostnad för typisk användning: < $1/månad**

## Sammanfattning

✅ **Implementerat:**
1. Supabase Storage bucket med RLS policies
2. Återanvändbar ImageUpload-komponent
3. Bilduppladdning för rapport-sektioner
4. Bilduppladdning för företagslogotyp

✅ **Fördelar:**
- Bättre användarupplevelse (ingen URL-inmatning)
- Säker bildhantering med RLS
- Automatisk validering
- Enkel att använda och underhålla

✅ **Bakåtkompatibilitet:**
- Befintliga URL:er fungerar fortfarande
- Gradvis migration möjlig
- Ingen breaking changes

🎉 **Klart att använda!**
