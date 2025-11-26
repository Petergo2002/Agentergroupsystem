# Rapport Flow Implementation - Smart, Snygg och Enkel

## Översikt
Implementerat ett förenklat och intuitivt flöde för rapporthantering med fokus på användarvänlighet och tydlighet.

## Implementerade Funktioner

### 1. **Aktiva Rapporter - Förenklad Vy**
- ✅ Enkel kortvy med tydlig layout
- ✅ Visar rapportnamn (stor, fet text)
- ✅ Kund och plats direkt synliga
- ✅ Status-badge (Utkast/Granskning/Klar)
- ✅ **EN primär knapp**: "Fortsätt redigera"
- ✅ Inga extra menyer eller komplicerade alternativ

**Flöde:**
1. Användare skapar rapport → Status: `draft`
2. Rapporten dyker upp automatiskt i "Aktiva rapporter"
3. Klicka "Fortsätt redigera" → Går direkt till edit-sidan

### 2. **Dedikerad Edit-Route** (`/rapport/[id]/edit`)
- ✅ Laddar befintlig rapport med alla sektioner
- ✅ Fortsätter där användaren slutade
- ✅ Autosparar ändringar
- ✅ Tydlig "Slutför & Arkivera"-knapp
- ✅ Enkel navigation tillbaka till rapportlistan

**Funktioner på edit-sidan:**
- Redigera alla sektioner med live-uppdatering
- Se checklista och metadata
- Spara-knapp för manuell sparning
- Arkivera-knapp som flyttar rapporten till arkiv

### 3. **Arkiv-Vy**
- ✅ Visar alla rapporter med status `approved`
- ✅ Enkel "Visa rapport"-knapp (outline-stil)
- ✅ Samma layout som aktiva rapporter för konsistens
- ✅ Tydlig separation från aktiva rapporter

### 4. **State Management**
Rapporter har tre statusar:
- `draft` → Aktiv (nyligen skapad, pågående arbete)
- `review` → Aktiv (under granskning)
- `approved` → Arkiverad (färdig, signerad)

**Logik:**
```typescript
// Aktiva rapporter
reports.filter(r => r.status !== "approved")

// Arkiverade rapporter
reports.filter(r => r.status === "approved")
```

### 5. **Navigation & URL-hantering**
- ✅ URL-parameter support: `/rapport?tab=saved` öppnar arkiv-fliken
- ✅ Efter arkivering: Automatisk redirect till `/rapport?tab=saved`
- ✅ Smooth navigation mellan vyer

## Teknisk Implementation

### Nya Filer
1. **`/app/(dashboard)/rapport/[id]/edit/page.tsx`**
   - Dedikerad edit-sida för rapporter
   - Laddar rapport från Supabase
   - Hanterar sparning och arkivering

### Uppdaterade Filer
1. **`/lib/store.ts`**
   - Lagt till `updateReport()` funktion
   - Hanterar både Supabase och lokal state

2. **`/components/rapport/rapport-container.tsx`**
   - Förenklad lista för aktiva rapporter
   - Lagt till router-navigation
   - Olika knappar för aktiva vs arkiverade

3. **`/app/(dashboard)/rapport/page.tsx`**
   - URL-parameter support för flik-navigation
   - Automatisk öppning av rätt flik

## Användningsflöde

### Skapa ny rapport
1. Klicka "Ny rapport" i någon flik
2. Fyll i grunddata (titel, kund, plats, etc.)
3. Klicka "Skapa rapport"
4. → Rapporten skapas med status `draft`
5. → Dyker upp i "Aktiva rapporter"

### Redigera aktiv rapport
1. Gå till "Aktiva rapporter"-fliken
2. Se alla pågående rapporter i enkel lista
3. Klicka "Fortsätt redigera" på önskad rapport
4. → Öppnas i edit-läge på `/rapport/[id]/edit`
5. Redigera sektioner, uppdatera data
6. Klicka "Spara" för att spara ändringar
7. Klicka "Slutför & Arkivera" när klar

### Arkivera rapport
1. I edit-läget, klicka "Slutför & Arkivera"
2. → Status ändras till `approved`
3. → Automatisk redirect till `/rapport?tab=saved`
4. → Rapporten visas nu i Arkiv-fliken
5. → Försvinner från Aktiva rapporter

### Visa arkiverad rapport
1. Gå till "Arkiv"-fliken
2. Se alla färdiga rapporter
3. Klicka "Visa rapport" för att öppna i read-only läge

## Supabase Integration

### Database Schema
Tabellen `reports` har följande relevanta kolumner:
- `id` (uuid)
- `title` (text)
- `status` (text) - 'draft', 'review', 'approved'
- `metadata` (jsonb)
- `sections` (jsonb)
- `checklist` (jsonb)
- `assets` (jsonb)
- `updated_at` (timestamptz)

### API Funktioner
```typescript
// Skapa rapport
createReport(input: CreateReportInput): Promise<Report>

// Uppdatera rapport
updateReport(id: string, updates: Partial<Report>): Promise<Report>

// Hämta rapporter
fetchReports(): Promise<Report[]>
```

## Design Principer

### 1. **Enkelhet**
- En primär action per kontext
- Inga dolda menyer eller komplexa alternativ
- Tydliga knappar med beskrivande text

### 2. **Konsistens**
- Samma layout för aktiva och arkiverade rapporter
- Konsekvent färgkodning för status
- Enhetlig navigation

### 3. **Tydlighet**
- Stora, läsbara titlar
- Status synlig direkt
- Viktig information framhävd

### 4. **Snabbhet**
- Direkt navigation till edit-läge
- Inga onödiga steg
- Autosparning för att undvika dataförlust

## Framtida Förbättringar (Valfritt)

1. **Bulk-operationer**
   - Markera flera rapporter
   - Arkivera flera samtidigt

2. **Filtrering**
   - Filtrera efter status, kund, datum
   - Sortering (nyast först, äldst först)

3. **Notifikationer**
   - Toast-meddelanden vid sparning
   - Varning vid osparade ändringar

4. **Export**
   - PDF-export direkt från arkiv
   - Batch-export av flera rapporter

## Testning

### Manuell Testning
1. ✅ Skapa ny rapport → Kontrollera att den dyker upp i Aktiva
2. ✅ Klicka "Fortsätt redigera" → Kontrollera navigation till edit-sida
3. ✅ Redigera sektioner → Kontrollera att ändringar sparas
4. ✅ Klicka "Slutför & Arkivera" → Kontrollera redirect till Arkiv
5. ✅ Kontrollera att rapporten finns i Arkiv och inte i Aktiva
6. ✅ Klicka "Visa rapport" från Arkiv → Kontrollera att den öppnas

### Edge Cases
- Tom rapportlista (både aktiva och arkiv)
- Rapport utan sektioner
- Navigation tillbaka från edit-sida
- URL-parameter med ogiltig flik

## Sammanfattning

Implementationen levererar ett **smart, snyggt och enkelt** rapportflöde:

✅ **Smart**: Automatisk state-hantering, intelligent navigation  
✅ **Snyggt**: Ren design, tydlig layout, konsekvent styling  
✅ **Enkelt**: En knapp per kontext, inga komplicerade menyer  

Användare kan nu:
1. Skapa rapporter enkelt
2. Se alla aktiva rapporter på ett ställe
3. Fortsätta redigera med ett klick
4. Arkivera när klar
5. Hitta arkiverade rapporter i separat flik

**Status**: ✅ Implementerat och redo för testning
