# Rapport Workflow V2 - Uppdaterad Implementation

## Översikt
Implementerat ett förbättrat rapportflöde där rapporter arkiveras **endast efter PDF-export**, inte automatiskt vid "slutför".

## Nyckelfunktioner

### 1. **Arkivering baserad på PDF-export**
- ✅ Rapporter arkiveras **endast** när PDF laddas ner
- ✅ Nytt fält: `exportedAt` (timestamp)
- ✅ Aktiva rapporter: `exportedAt IS NULL`
- ✅ Arkiverade rapporter: `exportedAt IS NOT NULL`

### 2. **Fortsätt redigera - Samma flöde**
- ✅ "Fortsätt redigera" tar dig tillbaka till edit-sidan
- ✅ Ingen automatisk arkivering
- ✅ Rapporten förblir aktiv tills PDF exporteras
- ✅ Alla ändringar sparas automatiskt

### 3. **Förenklad Arkiv-vy**
- ✅ Workflow-komponenten **dold** i arkiv
- ✅ Endast grundläggande info visas
- ✅ "Visa rapport"-knapp istället för "Fortsätt redigera"

### 4. **Rent flöde från start till arkiv**
```
Inställningar → Ny rapport → Fyll i → Förhandsgranska → Ladda ner PDF → Arkiv
                                ↓
                        (Ofärdigt = Aktiva rapporter)
```

## Tekniska Ändringar

### Database Schema
```sql
ALTER TABLE reports 
ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NULL;
```

### Report Type
```typescript
export interface Report {
  // ... existing fields
  exportedAt?: string | null;
}
```

### Filter-logik
```typescript
// Aktiva rapporter
reports.filter(r => !r.exportedAt)

// Arkiverade rapporter  
reports.filter(r => !!r.exportedAt)
```

### PDF-export med arkivering
```typescript
const handleDownloadPdf = async () => {
  // ... generera PDF
  win.print();
  
  // Arkivera efter lyckad export
  await updateReport(report.id, {
    ...report,
    exportedAt: new Date().toISOString(),
  });
  
  // Navigera till arkiv
  router.push("/rapport?tab=saved");
};
```

## Användningsflöde

### Skapa och arbeta med rapport
1. **Skapa rapport** i "Ny rapport"-fliken
   - Status: `draft`
   - `exportedAt`: `NULL`
   - → Dyker upp i **Aktiva rapporter**

2. **Redigera rapport**
   - Klicka "Fortsätt redigera" från Aktiva
   - Öppnas på `/rapport/[id]/edit`
   - Fyll i sektioner, checklista, media
   - Klicka "Spara ändringar" när du vill

3. **Lämna och återkomma**
   - Kan lämna när som helst
   - Rapporten stannar i **Aktiva rapporter**
   - Klicka "Fortsätt redigera" för att fortsätta

### Exportera och arkivera
4. **Förhandsgranska**
   - Klicka "Exportera PDF" från rapport-vyn
   - Se förhandsgranskning i dialog

5. **Ladda ner PDF**
   - Klicka "Skriv ut / PDF"
   - PDF öppnas i nytt fönster
   - **Automatiskt:** `exportedAt` sätts
   - **Automatiskt:** Rapporten flyttas till Arkiv
   - **Automatiskt:** Navigering till Arkiv-fliken

6. **Visa i arkiv**
   - Rapporten finns nu under "Arkiv"
   - Workflow-komponenten visas inte
   - Klicka "Visa rapport" för read-only vy

## Viktiga Skillnader från V1

| Aspekt | V1 (Gammal) | V2 (Ny) |
|--------|-------------|---------|
| **Arkivering** | Vid "Slutför & Arkivera"-knapp | Vid PDF-nedladdning |
| **Status-fält** | `status: approved` = arkiv | `exportedAt: timestamp` = arkiv |
| **Edit-sida** | Hade arkivera-knapp | Endast spara-knapp |
| **Workflow i arkiv** | Visades | Dold |
| **Fortsätt redigera** | Ny implementation | Samma, förbättrad |

## Fördelar med V2

✅ **Tydligare workflow**: Arkivering sker vid konkret action (PDF-export)  
✅ **Mindre förvirring**: Ingen "Slutför"-knapp som inte gör vad man tror  
✅ **Bättre UX**: Rapporter stannar aktiva tills de faktiskt är klara  
✅ **Renare arkiv**: Workflow visas inte där det inte behövs  
✅ **Flexibilitet**: Kan redigera hur länge som helst innan export  

## Framtida Förbättringar (Valfritt)

1. **Samlad Översikt-flik**
   - Kombinera Sektioner + Checklista + Media i en vy
   - Visa endast ifylld information
   - Enklare att få överblick

2. **Wizard-flöde för Fortsätt redigera**
   - Spara `currentStep` i metadata
   - Återuppta på rätt steg i wizard
   - Mer seamless upplevelse

3. **Förhandsgranska innan export**
   - Bättre preview-dialog
   - Möjlighet att justera innan PDF
   - Visa hur PDF kommer se ut

4. **Export-historik**
   - Spara alla PDF-exporter
   - Möjlighet att ladda ner igen
   - Versionshantering

## Testning

### Manuellt testflöde
1. ✅ Skapa ny rapport → Kontrollera att den dyker upp i Aktiva
2. ✅ Klicka "Fortsätt redigera" → Kontrollera att edit-sidan öppnas
3. ✅ Redigera och spara → Kontrollera att rapporten stannar i Aktiva
4. ✅ Exportera PDF → Kontrollera att PDF öppnas
5. ✅ Efter export → Kontrollera att rapporten flyttas till Arkiv
6. ✅ Öppna Arkiv → Kontrollera att workflow inte visas
7. ✅ Klicka "Visa rapport" → Kontrollera read-only vy

### Edge Cases
- Rapport utan sektioner
- Avbryta PDF-export
- Flera rapporter samtidigt
- Navigation under export

## Sammanfattning

**Status**: ✅ Implementerat och redo för testning

**Huvudändringar**:
1. Nytt `exportedAt`-fält i databas
2. Arkivering vid PDF-export istället för manuell knapp
3. Workflow dold i arkiv-vy
4. Förbättrad "Fortsätt redigera"-funktionalitet

**Nästa steg**: Testa flödet och justera UX vid behov.
