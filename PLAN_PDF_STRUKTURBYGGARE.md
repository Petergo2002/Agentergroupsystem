# Plan: PDF-strukturbyggare i Inställningar

## Mål
Skapa ett visuellt verktyg där användaren kan:
1. Designa PDF-layouten genom drag-and-drop
2. Se live preview av hur PDF:en kommer se ut
3. Anpassa sektioner (ordning, storlek, stil, synlighet)
4. Spara olika PDF-templates

## Funktioner

### 1. PDF-struktureditor (Drag & Drop)
- **Vänster panel:** Tillgängliga sektioner
  - Header (logo, titel, metadata)
  - Inledning
  - Bakgrund
  - Mätmetoder
  - Slutsats
  - GANN-tabell
  - Bildgalleri
  - Läckageområden
  - Footer
  
- **Mitten:** Aktiv struktur (drag-and-drop)
  - Dra sektioner från vänster
  - Ändra ordning
  - Ta bort sektioner
  - Konfigurera varje sektion

- **Höger panel:** Live PDF-preview
  - Realtidsvisning av PDF
  - Uppdateras när struktur ändras

### 2. Sektionskonfiguration
För varje sektion:
- **Synlighet:** Visa/dölj
- **Titel:** Anpassa rubrik
- **Storlek:** Liten/Medium/Stor
- **Stil:** Font-storlek, färg, spacing
- **Villkor:** Visa endast om data finns

### 3. Styling-inställningar
- **Typografi:**
  - Rubrik-storlek (H1, H2, H3)
  - Brödtext-storlek
  - Line-height
  
- **Färger:**
  - Primärfärg (grönt)
  - Accent-färg
  - Text-färg
  
- **Spacing:**
  - Marginal (top, bottom, left, right)
  - Padding mellan sektioner
  - Sidbrytningar

### 4. Templates
- **Spara templates:**
  - "Standard läckagerapport"
  - "Enkel rapport"
  - "Detaljerad rapport med bilder"
  
- **Ladda template:**
  - Välj från sparade templates
  - Applicera på alla nya rapporter

## Teknisk implementation

### Datastruktur
```typescript
interface PDFStructure {
  id: string;
  name: string;
  sections: PDFSection[];
  styling: PDFStyling;
}

interface PDFSection {
  id: string;
  type: 'header' | 'intro' | 'background' | 'methods' | 'conclusion' | 'gann' | 'gallery' | 'leakAreas' | 'footer';
  title: string;
  visible: boolean;
  order: number;
  config: {
    fontSize?: number;
    spacing?: number;
    showOnlyIfData?: boolean;
  };
}

interface PDFStyling {
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
  typography: {
    h1Size: number;
    h2Size: number;
    bodySize: number;
    lineHeight: number;
  };
  spacing: {
    margin: { top: number; bottom: number; left: number; right: number };
    sectionGap: number;
  };
}
```

### Komponenter
1. **`PDFStructureBuilder.tsx`** - Huvudkomponent
2. **`PDFSectionList.tsx`** - Lista över tillgängliga sektioner
3. **`PDFActiveStructure.tsx`** - Aktiv struktur med drag-and-drop
4. **`PDFSectionConfig.tsx`** - Konfiguration för enskild sektion
5. **`PDFLivePreview.tsx`** - Live preview av PDF
6. **`PDFTemplateManager.tsx`** - Hantera templates

### Store
```typescript
// /stores/pdfStructureStore.ts
interface PDFStructureStore {
  structures: PDFStructure[];
  activeStructure: PDFStructure | null;
  setActiveStructure: (structure: PDFStructure) => void;
  updateSection: (sectionId: string, updates: Partial<PDFSection>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  saveStructure: (structure: PDFStructure) => Promise<void>;
  loadStructures: () => Promise<void>;
}
```

## UI-flöde

1. **Gå till Inställningar → PDF-struktur**
2. **Se tre paneler:**
   - Vänster: Tillgängliga sektioner
   - Mitten: Aktiv struktur (tom från början)
   - Höger: Live preview
3. **Dra sektioner från vänster till mitten**
4. **Konfigurera varje sektion** (klicka på den)
5. **Se live preview uppdateras** i realtid
6. **Spara som template** när nöjd
7. **Applicera template** på nya rapporter

## Fas 1: Grundläggande struktur (nu)
- ✅ Skapa datastruktur
- ✅ Skapa store
- ✅ Skapa huvudkomponent
- ✅ Enkel lista över sektioner
- ✅ Visa/dölj sektioner

## Fas 2: Drag & Drop
- Implementera react-beautiful-dnd
- Dra sektioner mellan listor
- Ändra ordning

## Fas 3: Live Preview
- Generera PDF från struktur
- Visa i iframe
- Uppdatera när struktur ändras

## Fas 4: Styling & Templates
- Färg-picker
- Font-inställningar
- Spara/ladda templates

## Nästa steg
Börja med Fas 1 - skapa grundläggande UI och datastruktur.
