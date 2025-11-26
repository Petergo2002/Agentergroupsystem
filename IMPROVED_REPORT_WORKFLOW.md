# Förbättrat Rapportflöde - Implementation

## Översikt
Implementerat två stora förbättringar för ett mer intuitivt rapportflöde:

1. ✅ **Aktiva rapporter** → Endast Översikt (read-only)
2. ⏳ **Edit-sidan** → Stegvis flöde (Edit → Förhandsgranskning → PDF)

## Del 1: Aktiva Rapporter - Endast Översikt ✅

### Före
- Separata flikar: Översikt, Sektioner, Checklistor, Media
- Kunde redigera direkt i Aktiva rapporter-vyn
- Förvirrande UX - oklart när man redigerar vs. bara tittar

### Efter
- **En enda vy**: Översikt
- **Allt read-only**: Ingen redigering möjlig
- **Tydlig knapp**: "Fortsätt redigera" för att börja redigera

### Implementering

**Fil:** `/components/rapport/rapport-container.tsx`

**Ändringar:**
1. Tog bort `<Tabs>` och `<TabsList>` med flera flikar
2. Ersatte med en enda `<div>` som innehåller allt
3. Gjorde alla sektioner read-only:
   - Ersatte `<Textarea>` med `<div>` som visar text
   - Checkboxar är disabled
   - Inga edit-knappar

**Struktur:**
```tsx
<div className="space-y-6">
  {/* Grunddata */}
  <div className="grid gap-4 md:grid-cols-2">
    <div>Kund, Projektreferens, Uppdaterad</div>
    <div>Ansvarig, Deadline, Prioritet</div>
  </div>

  {/* Sektioner (read-only) */}
  <div className="space-y-3">
    <h3>Sektioner</h3>
    {sections.map(section => (
      <div>
        <div>
          <p>{section.title}</p>
          <Badge>{section.status}</Badge>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p>{section.content || "Ej ifyllt"}</p>
        </div>
      </div>
    ))}
  </div>

  {/* Checklista (read-only) */}
  <div className="space-y-3">
    <h3>Checklista</h3>
    {checklist.map(item => (
      <div>
        <IconCircleCheck/Circle />
        <p>{item.label}</p>
      </div>
    ))}
  </div>

  {/* Media (read-only) */}
  <div className="space-y-3">
    <h3>Media</h3>
    {assets.map(asset => (
      <div>
        <img/placeholder />
        <p>{asset.label}</p>
      </div>
    ))}
  </div>
</div>
```

### Resultat
- ✅ Tydligare UX - man ser allt på en gång
- ✅ Ingen förvirring - kan inte redigera här
- ✅ Snabbare översikt - scrollar genom allt
- ✅ "Fortsätt redigera"-knappen är tydlig

## Del 2: Edit-sidan - Stegvis Flöde ⏳

### Mål
När man klickar "Fortsätt redigera" ska man komma till ett flöde:

```
1. Redigera sektioner
   ↓ [Fortsätt]
2. Förhandsgranskning
   ↓ [Ladda ner PDF]
3. PDF exporteras + Rapport arkiveras
```

### Planerad Implementering

**Fil:** `/app/(dashboard)/rapport/[id]/edit/page.tsx`

**Steg 1: Lägg till step-state**
```typescript
const [step, setStep] = useState<"edit" | "review">("edit");
```

**Steg 2: Rendera baserat på step**
```tsx
{step === "edit" ? (
  // Befintligt innehåll med Tabs
  <Tabs>
    <TabsContent value="sections">
      {/* Redigerbara sektioner */}
    </TabsContent>
    <TabsContent value="checklist">...</TabsContent>
    <TabsContent value="metadata">...</TabsContent>
  </Tabs>
  
  {/* Ny knapp längst ner */}
  <div className="mt-6 flex justify-end gap-3">
    <Button variant="outline" onClick={() => router.push("/rapport")}>
      Avbryt
    </Button>
    <Button onClick={() => setStep("review")}>
      Fortsätt till förhandsgranskning
    </Button>
  </div>
) : (
  // Förhandsgranskning
  <div>
    <h2>Förhandsgranskning</h2>
    {/* Visa rapporten read-only */}
    <ReportPreview report={report} />
    
    <div className="mt-6 flex justify-between">
      <Button variant="outline" onClick={() => setStep("edit")}>
        Tillbaka till redigering
      </Button>
      <Button onClick={handleDownloadPDF}>
        Ladda ner PDF
      </Button>
    </div>
  </div>
)}
```

**Steg 3: PDF-export med arkivering**
```typescript
const handleDownloadPDF = async () => {
  try {
    // Spara rapporten först
    await handleSave();
    
    // Bygg PDF HTML
    const printableHtml = buildPrintableHtml(report, template, sectionDefinitions);
    
    // Öppna i nytt fönster
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printableHtml);
      win.document.close();
      win.print();
    }
    
    // Markera som exporterad (arkivera)
    await updateReport(report.id, {
      ...report,
      exportedAt: new Date().toISOString(),
      status: "approved",
    });
    
    toast.success("Rapport exporterad och arkiverad!");
    router.push("/rapport?tab=saved");
  } catch (error) {
    toast.error("Kunde inte exportera rapport");
  }
};
```

### Förhandsgranskning-komponent

Kan återanvända befintlig struktur från `buildPrintableHtml` men rendera i React:

```tsx
function ReportPreview({ report }: { report: Report }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{report.title}</h1>
        <p className="text-muted-foreground">
          {report.metadata.client} · {report.metadata.location}
        </p>
      </div>

      {/* Metadata grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>Kund: {report.metadata.client}</div>
        <div>Plats: {report.metadata.location}</div>
        {/* ... */}
      </div>

      {/* Sektioner */}
      {report.sections.map(section => (
        <div key={section.id}>
          <h2>{section.title}</h2>
          
          {section.type === "image_gallery" && section.assetIds ? (
            <div className="grid gap-4 md:grid-cols-3">
              {section.assetIds.map(id => {
                const asset = report.assets.find(a => a.id === id);
                return asset ? (
                  <img key={id} src={asset.url} alt={asset.label} />
                ) : null;
              })}
            </div>
          ) : section.type === "image_annotated" && section.assetId ? (
            <img src={section.assetId} alt={section.title} />
          ) : section.type === "image" ? (
            <img src={section.imageUrl} alt={section.title} />
          ) : (
            <p className="whitespace-pre-wrap">{section.content}</p>
          )}
        </div>
      ))}

      {/* Checklista */}
      <div>
        <h2>Checklista</h2>
        <ul>
          {report.checklist.map(item => (
            <li key={item.id}>
              {item.completed ? "✓" : "○"} {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Användarflöde

### Scenario: Redigera och exportera läckage-rapport

1. **Aktiva rapporter**
   - Ser "Läckage Brf Talltitan" i listan
   - Klickar på rapporten
   - Högerpanelen visar **Översikt** (read-only):
     - Grunddata
     - Alla sektioner med status
     - Checklista
     - Media
   - ✅ Ser snabbt vad som är ifyllt

2. **Klicka "Fortsätt redigera"**
   - Navigerar till `/rapport/abc123/edit`
   - Hamnar i **Steg 1: Redigera**

3. **Steg 1: Redigera sektioner**
   - Flikar: Sektioner, Checklista, Metadata
   - Fyller i:
     - Beskrivning (text)
     - Laddar upp bilder i Bildgalleri
     - Annoterar läckage-bild
   - Klickar **"Fortsätt till förhandsgranskning"** längst ner

4. **Steg 2: Förhandsgranskning**
   - Ser hela rapporten som den kommer se ut
   - Alla bilder visas
   - Annotationer syns
   - Checklista visas
   - Kan gå **"Tillbaka till redigering"** om något behöver ändras

5. **Exportera PDF**
   - Klickar **"Ladda ner PDF"**
   - PDF öppnas i nytt fönster
   - Kan skriva ut eller spara
   - Rapporten markeras som "Exporterad"
   - Flyttas automatiskt till **Arkiv**
   - ✅ Klart!

## Tekniska Detaljer

### State Management
```typescript
// Edit-sidan
const [step, setStep] = useState<"edit" | "review">("edit");
const [report, setReport] = useState<Report | null>(null);
const [saving, setSaving] = useState(false);
```

### Navigation
```typescript
// Från Aktiva rapporter
<Button onClick={() => router.push(`/rapport/${report.id}/edit`)}>
  Fortsätt redigera
</Button>

// Från Förhandsgranskning efter PDF
router.push("/rapport?tab=saved");
```

### PDF Export
```typescript
// Använder befintlig buildPrintableHtml
const printableHtml = buildPrintableHtml(report, template, sectionDefinitions);

// Öppnar i nytt fönster
const win = window.open("", "_blank");
win.document.write(printableHtml);
win.print();

// Arkiverar
await updateReport(report.id, {
  ...report,
  exportedAt: new Date().toISOString(),
  status: "approved",
});
```

## Status

### ✅ Klart
- Aktiva rapporter → Endast Översikt (read-only)
- Inga separata flikar
- Tydlig "Fortsätt redigera"-knapp

### ⏳ Nästa Steg
- Lägg till step-state i edit-sidan
- Rendera edit vs. review baserat på step
- Lägg till "Fortsätt"-knapp efter sektioner
- Bygg förhandsgranskning-vy
- Koppla PDF-export till arkivering

## Fördelar

### Aktiva Rapporter
- 🎯 Tydligare UX - allt på en plats
- 🎯 Snabbare översikt
- 🎯 Ingen förvirring om redigering

### Edit-flöde
- 🎯 Guidat flöde - tydliga steg
- 🎯 Förhandsgranskning innan export
- 🎯 Automatisk arkivering
- 🎯 Mindre risk för fel

Nu har du grunden för ett mycket bättre rapportflöde! 🎉
