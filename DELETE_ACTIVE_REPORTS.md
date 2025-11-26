# Ta bort rapporter från Aktiva rapporter

## Översikt
Implementerat funktionalitet för att ta bort rapporter från "Aktiva rapporter"-listan.

## Nya Funktioner

### 1. **deleteReport funktion**
**Fil:** `/lib/store.ts`

Ny funktion för att ta bort rapporter från både Supabase och lokal state:

```typescript
export const deleteReport = async (id: string): Promise<void> => {
  // Demo mode
  if (IS_DEMO_MODE) {
    const currentReports = useReportsStore.getState().reports;
    useReportsStore.getState().setReports(currentReports.filter(r => r.id !== id));
    return;
  }

  // Ta bort från Supabase
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete report", error);
    throw error;
  }

  // Uppdatera lokal state
  const currentReports = useReportsStore.getState().reports;
  useReportsStore.getState().setReports(currentReports.filter(r => r.id !== id));
};
```

### 2. **Ta bort-knapp i UI**
**Fil:** `/components/rapport/rapport-container.tsx`

Lagt till en röd papperskorgs-knapp bredvid "Fortsätt redigera":

```tsx
{mode === "active" ? (
  <div className="flex gap-2">
    <Button
      className="flex-1 gap-2"
      size="sm"
      onClick={() => router.push(`/rapport/${report.id}/edit`)}
    >
      <IconEdit className="size-4" />
      Fortsätt redigera
    </Button>
    <Button
      variant="destructive"
      size="sm"
      onClick={async () => {
        if (confirm(`Är du säker på att du vill ta bort "${report.title}"?`)) {
          try {
            await deleteReport(report.id);
            toast.success("Rapport borttagen");
          } catch (error) {
            console.error("Failed to delete report", error);
            toast.error("Kunde inte ta bort rapport");
          }
        }
      }}
    >
      <IconTrash className="size-4" />
    </Button>
  </div>
) : (
  // Arkiv-vy har ingen ta bort-knapp
  <Button variant="outline">Visa rapport</Button>
)}
```

## Funktioner

### ✅ Bekräftelsedialog
Innan rapporten tas bort visas en bekräftelsedialog:
```
Är du säker på att du vill ta bort "[Rapportnamn]"?
```

### ✅ Toast-meddelanden
- **Lyckad borttagning**: "Rapport borttagen"
- **Misslyckad borttagning**: "Kunde inte ta bort rapport"

### ✅ Endast för aktiva rapporter
Ta bort-knappen visas **endast** i "Aktiva rapporter"-vyn, inte i Arkiv.

### ✅ Permanent borttagning
Rapporten tas bort permanent från databasen och kan inte återställas.

## UI-design

### Aktiva rapporter
```
┌─────────────────────────────────────┐
│ Rapportnamn                    [🏷️] │
│ Kund                                │
│ 📍 Plats  📅 Datum                  │
│                                     │
│ [✏️ Fortsätt redigera] [🗑️]        │
└─────────────────────────────────────┘
```

- **Fortsätt redigera**: Primär knapp (blå), tar upp mest plats
- **Ta bort**: Destructive knapp (röd), kompakt med bara ikon

## Användning

### Ta bort en rapport:
1. Gå till **Rapporter → Aktiva rapporter**
2. Hitta rapporten du vill ta bort
3. Klicka på **papperskorgs-ikonen** (🗑️)
4. Bekräfta i dialogen
5. Rapporten tas bort permanent

### Varning
⚠️ **Borttagning är permanent!** Det finns ingen ångra-funktion. Rapporten tas bort från databasen och kan inte återställas.

## Säkerhet

### Bekräftelse krävs
Användaren måste bekräfta borttagningen i en dialog för att förhindra oavsiktlig borttagning.

### Endast egna rapporter
Supabase RLS (Row Level Security) säkerställer att användare endast kan ta bort sina egna rapporter.

## Testning

### Manuellt testflöde:
1. ✅ Skapa en testrapport
2. ✅ Gå till Aktiva rapporter
3. ✅ Klicka på papperskorgs-ikonen
4. ✅ Bekräfta borttagningen
5. ✅ Kontrollera att rapporten försvinner från listan
6. ✅ Kontrollera toast-meddelande: "Rapport borttagen"
7. ✅ Uppdatera sidan och kontrollera att rapporten är borta

### Avbryt borttagning:
1. ✅ Klicka på papperskorgs-ikonen
2. ✅ Klicka "Avbryt" i dialogen
3. ✅ Kontrollera att rapporten finns kvar

### Arkiv-vy:
1. ✅ Gå till Arkiv-fliken
2. ✅ Kontrollera att det INTE finns någon ta bort-knapp
3. ✅ Endast "Visa rapport"-knappen ska visas

## Framtida förbättringar (valfritt)

### 1. Mjuk borttagning
Istället för permanent borttagning, markera rapporten som "raderad" och flytta till en "Papperskorg"-vy där den kan återställas inom 30 dagar.

### 2. Batch-borttagning
Möjlighet att markera flera rapporter och ta bort dem samtidigt.

### 3. Ångra-funktion
Toast-meddelande med "Ångra"-knapp som återställer rapporten inom några sekunder.

### 4. Arkiverade rapporter
Möjlighet att ta bort även arkiverade rapporter (med extra bekräftelse).

## Status
✅ **Implementerat och redo att använda!**

Nu kan du enkelt ta bort ofärdiga rapporter från Aktiva rapporter-listan. 🗑️
