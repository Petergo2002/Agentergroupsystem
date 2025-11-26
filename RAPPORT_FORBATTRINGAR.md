# Rapportförbättringar - Implementation

## Översikt
Implementerat tre viktiga förbättringar för rapportsystemet baserat på användarfeedback:
1. ✅ Bilder syns nu korrekt i PDF-export
2. ✅ "Fortsätt redigera"-knapp på Aktiva rapporter
3. ✅ Förenklad wizard (färre steg)

## 1. PDF-export med bilder ✅

### Problem
När man laddade ner rapport som PDF visades "Ej ifyllt" istället för bilderna från bildsektioner.

### Lösning
Uppdaterat `buildPrintableHtml()` funktionen för att:
- Ta emot sektionsdefinitioner som parameter
- Identifiera bildsektioner baserat på `type === "image"`
- Rendera `<img>` taggar med korrekt URL och alt-text
- Endast visa "Ej ifyllt" för text-sektioner utan innehåll

### Kod-ändringar

**Fil: `components/rapport/rapport-container.tsx`**

```typescript
function buildPrintableHtml(
  report: Report, 
  template?: ReportTemplate | null,
  sectionDefinitions?: ReportSectionDefinition[]  // Ny parameter
) {
  // Skapa map för snabb lookup
  const defMap = new Map(
    (sectionDefinitions || []).map(def => [def.id, def])
  );

  const sectionHtml = report.sections
    .map((section) => {
      const definition = defMap.get(section.id);
      const isImageSection = definition?.type === "image";
      
      // Rendera bild om det är en bildsektion
      if (isImageSection && definition?.imageUrl) {
        return `
      <section style="margin-bottom:24px;">
        <h2>${section.title}</h2>
        <div style="margin:12px 0;">
          <img 
            src="${definition.imageUrl}" 
            alt="${definition.imageAltText || section.title}"
            style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;"
          />
          ${definition.imageAltText ? `<p style="font-size:12px;color:#64748b;">${definition.imageAltText}</p>` : ""}
        </div>
      </section>
        `;
      }
      
      // Vanlig textsektion
      return `
      <section style="margin-bottom:24px;">
        <h2>${section.title}</h2>
        <p>${section.content || "Ej ifyllt"}</p>
      </section>
      `;
    })
    .join("");
}
```

**Uppdaterade anrop:**
- `handleDownloadPdf()` - skickar nu med `sectionDefinitions`
- `handleDownloadCreatedReport()` - skickar nu med `sectionDefinitions`

### Resultat
- ✅ Bilder visas korrekt i PDF
- ✅ Alt-text visas under bilden
- ✅ Textsektioner fungerar som tidigare
- ✅ "Ej ifyllt" visas endast för tomma textsektioner

---

## 2. "Fortsätt redigera"-knapp ✅

### Problem
När man tittade på en aktiv rapport fanns ingen tydlig knapp för att fortsätta redigera den.

### Lösning
Lagt till "Fortsätt redigera"-knapp i rapportdetaljvyn bredvid "Hantera sektioner".

### Kod-ändringar

**Fil: `components/rapport/rapport-container.tsx`**

```typescript
// Importerat IconEdit
import { IconEdit } from "@tabler/icons-react";

// I rapportdetaljvyn:
<div className="flex gap-2">
  <Button 
    variant="outline" 
    size="sm"
    className="gap-2"
    onClick={() => {
      setEditableReport(selectedReport);
      toast.info("Redigeringsfunktion kommer snart");
    }}
  >
    <IconEdit className="h-4 w-4" />
    Fortsätt redigera
  </Button>
  <Button variant="outline" size="sm">
    Hantera sektioner
  </Button>
  <Button size="sm">Tilldela</Button>
</div>
```

### Placering
Knappen finns i:
- **Aktiva rapporter** → Välj en rapport → Högra panelen → Bredvid "Hantera sektioner"

### Status
- ✅ Knapp synlig och klickbar
- ⏳ Full redigeringsfunktionalitet kommer i nästa iteration
- 📝 För närvarande visar toast-meddelande

### Nästa steg för redigering
1. Skapa edit-läge i wizard
2. Förifyll formulär med rapportdata
3. Uppdatera rapport istället för att skapa ny
4. Hantera bilagor och checklistor i edit-läge

---

## 3. Förenklad wizard ✅

### Problem
Wizard hade för många steg (5 steg inklusive separat Export-steg), vilket gjorde processen onödigt komplicerad.

### Lösning
Reducerat från 5 till 4 steg genom att:
- Ta bort separat "Export"-steg
- Integrera export-funktionalitet direkt i "Granska"-steget
- Visa "Ladda ner PDF" och "Skapa ny rapport" efter rapporten skapats

### Före och Efter

**Före (5 steg):**
1. Välj mall
2. Grunddata
3. Sektioner
4. Granska
5. Export ← Borttaget

**Efter (4 steg):**
1. Välj mall
2. Grunddata
3. Sektioner
4. Granska & Skapa ← Kombinerat med export

### Kod-ändringar

**Fil: `components/rapport/rapport-container.tsx`**

```typescript
// Före:
const wizardSteps = [
  { key: "template", title: "Välj mall", description: "..." },
  { key: "details", title: "Grunddata", description: "..." },
  { key: "sections", title: "Sektioner", description: "..." },
  { key: "review", title: "Granska", description: "..." },
  { key: "export", title: "Export", description: "Ladda ner PDF" },  // ← Borttaget
];

// Efter:
const wizardSteps = [
  { key: "template", title: "Välj mall", description: "..." },
  { key: "details", title: "Grunddata", description: "..." },
  { key: "sections", title: "Sektioner", description: "..." },
  { key: "review", title: "Granska & Skapa", description: "Kontrollera och skapa rapporten" },
];
```

**Uppdaterat flöde efter rapport skapas:**

```typescript
// I review-steget, efter rapporten skapats:
{currentStep.key === "review" && createdReport ? (
  <>
    <Button variant="outline" onClick={resetWizard}>
      Skapa ny rapport
    </Button>
    <Button onClick={handleDownloadCreatedReport} className="gap-2">
      <IconDownload className="h-4 w-4" />
      Ladda ner PDF
    </Button>
  </>
) : (
  <Button onClick={currentStep.key === "review" ? handleSubmit : handleNext}>
    {currentStep.key === "review" ? "Skapa rapport" : "Fortsätt"}
  </Button>
)}
```

### Fördelar
- ✅ Snabbare att skapa rapport (ett steg mindre)
- ✅ Mindre förvirrande för användare
- ✅ Tydligare flöde: Granska → Skapa → Ladda ner
- ✅ Mindre klick för att komma till målet

---

## Sammanfattning av ändringar

### Modifierade filer:
1. **`components/rapport/rapport-container.tsx`**
   - Uppdaterat `buildPrintableHtml()` för bildstöd
   - Lagt till "Fortsätt redigera"-knapp
   - Reducerat wizard från 5 till 4 steg
   - Integrerat export i review-steget

### Nya imports:
```typescript
import { IconEdit } from "@tabler/icons-react";
```

### Nya state-variabler:
```typescript
const [sectionDefinitions, setSectionDefinitions] = useState<ReportSectionDefinition[]>([]);
```

### Borttagna referenser:
- `exportStepIndex` variabel
- Separat "export"-steg rendering
- Navigation till export-steg efter rapport skapas

---

## Testning

### Test 1: PDF med bilder
1. Skapa rapport med bildsektion
2. Ladda ner som PDF
3. ✅ Verifiera att bilden syns (inte "Ej ifyllt")
4. ✅ Verifiera att alt-text visas under bilden

### Test 2: Fortsätt redigera-knapp
1. Gå till Aktiva rapporter
2. Välj en rapport
3. ✅ Verifiera att "Fortsätt redigera"-knappen syns
4. ✅ Klicka på knappen → Toast-meddelande visas

### Test 3: Förenklad wizard
1. Skapa ny rapport
2. ✅ Verifiera att det finns 4 steg (inte 5)
3. ✅ I steg 4, klicka "Skapa rapport"
4. ✅ Verifiera att "Ladda ner PDF" och "Skapa ny rapport" visas
5. ✅ Ingen navigation till separat export-steg

---

## Framtida förbättringar

### Kort sikt (nästa sprint):
1. **Implementera full redigeringsfunktionalitet**
   - Förifyll wizard med befintlig rapportdata
   - Uppdatera rapport istället för skapa ny
   - Hantera bilagor i edit-läge

2. **Förbättra PDF-layout**
   - Lägg till företagslogotyp i header
   - Bättre formatering av metadata
   - Sidnumrering

3. **Snabbare arbetsflöde**
   - Auto-spara utkast
   - Mallar med förifyllda värden
   - Duplicera rapport-funktion

### Lång sikt:
1. **AI-assisterad rapportskrivning**
   - Föreslå text baserat på tidigare rapporter
   - Auto-generera sammanfattningar

2. **Kollaborativ redigering**
   - Flera användare kan redigera samtidigt
   - Kommentarer och feedback

3. **Avancerad export**
   - Word-format
   - Excel-format för data
   - Anpassningsbara PDF-mallar

---

## Användarguide

### Hur man skapar en rapport med bilder:

1. **Skapa bildsektion** (engångsuppgift)
   - Gå till Rapporter → Inställningar → Bibliotek
   - Skapa ny sektion, välj typ "Bild"
   - Ladda upp bild
   - Fyll i alt-text
   - Spara

2. **Lägg till i mall**
   - Gå till Mallar
   - Välj mall
   - Lägg till bildsektionen
   - Spara mall

3. **Skapa rapport**
   - Ny rapport
   - Välj mall med bildsektion
   - Fyll i grunddata och sektioner
   - Granska & Skapa
   - Ladda ner PDF → Bilden syns!

### Hur man fortsätter redigera en rapport:

1. Gå till **Aktiva rapporter**
2. Välj rapporten du vill redigera
3. Klicka på **"Fortsätt redigera"**
4. (Kommer snart: Wizard öppnas med förifylld data)

---

## Support

Vid problem eller frågor:
- Kontrollera att bilder är uppladdade korrekt (max 5MB)
- Verifiera att sektionstypen är "image"
- Testa med en enkel rapport först
- Kontakta support om problemet kvarstår

## Changelog

**v1.1.0 - 2025-01-23**
- ✅ Bilder syns i PDF-export
- ✅ "Fortsätt redigera"-knapp tillagd
- ✅ Wizard förenklad från 5 till 4 steg
- ✅ Export integrerat i Granska-steget
