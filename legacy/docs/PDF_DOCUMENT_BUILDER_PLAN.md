# PDF Document Builder - Komplett Plan

## 🎯 Problemanalys

### Nuvarande problem:
1. **Sektioner syns inte** - Strukturen finns men visas inte korrekt i UI
2. **Ingen flexibilitet** - Användare kan inte designa dokument från scratch
3. **Hårdkodad logik** - PDF-strukturen är statisk och svår att anpassa
4. **Dålig koppling** - Rapport-data och PDF-struktur hänger inte ihop ordentligt

### Rotorsak:
- `pdfStructureStore` är isolerad från rapportsystemet
- `ReportDocument.tsx` använder egen struktur (`ReportData`) som inte matchar `Report`-typen
- Ingen visuell editor för att bygga dokument

---

## 🏗️ Lösning: Visual Document Builder

### Koncept
Ett **drag-and-drop verktyg** där användare kan:
1. **Bygga dokument från scratch** - Börja med tom canvas
2. **Dra in sektioner** - Från en palett av tillgängliga komponenter
3. **Konfigurera varje sektion** - Titel, innehåll, styling, villkor
4. **Se live preview** - Realtidsvisning av PDF
5. **Spara som mall** - Återanvändbar dokumentstruktur

---

## 📐 Arkitektur

### 1. Unified Data Model

```typescript
// Ny typ som förenar allt
interface DocumentStructure {
  id: string;
  name: string;
  description?: string;
  
  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
  };
  
  // Sektioner (ordnade)
  sections: DocumentSection[];
  
  // Styling
  styling: DocumentStyling;
  
  // Villkor för när denna struktur ska användas
  conditions?: {
    reportType?: string[];
    tags?: string[];
  };
}

interface DocumentSection {
  id: string;
  type: SectionType;
  
  // Display
  title: string;
  description?: string;
  icon?: string;
  
  // Ordning och synlighet
  order: number;
  visible: boolean;
  
  // Konfiguration
  config: SectionConfig;
  
  // Data mapping - hur hämtar vi data?
  dataSource?: {
    type: 'static' | 'dynamic' | 'computed';
    path?: string; // JSONPath till data i Report
    transformer?: string; // Funktion för att transformera data
  };
  
  // Innehåll (för statiska sektioner)
  content?: {
    text?: string;
    html?: string;
    markdown?: string;
  };
}

type SectionType = 
  | 'header'           // Logo, titel, metadata
  | 'text'             // Fritext-sektion
  | 'richtext'         // Rich text med formatering
  | 'image'            // Enskild bild
  | 'image_gallery'    // Bildgalleri
  | 'image_annotated'  // Annoterad bild
  | 'table'            // Tabell (GANN, etc)
  | 'chart'            // Diagram
  | 'list'             // Lista
  | 'divider'          // Avdelare
  | 'page_break'       // Sidbrytning
  | 'footer'           // Sidfot
  | 'custom';          // Custom komponent

interface SectionConfig {
  // Layout
  width?: 'full' | 'half' | 'third';
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  margin?: { top: number; right: number; bottom: number; left: number };
  
  // Typography
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  
  // Colors
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  
  // Borders
  border?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  
  // Visibility rules
  showOnlyIfData?: boolean;
  showIf?: string; // Condition expression
  
  // Page breaks
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  pageBreakInside?: 'auto' | 'avoid';
}

interface DocumentStyling {
  // Theme
  theme: 'modern' | 'classic' | 'minimal' | 'corporate';
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textLight: string;
    background: string;
    border: string;
  };
  
  // Typography
  typography: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
    scale: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      body: number;
      small: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  // Spacing
  spacing: {
    page: { top: number; right: number; bottom: number; left: number };
    section: number;
    element: number;
  };
  
  // Logo
  logo?: {
    url: string;
    width: number;
    height: number;
    position: 'left' | 'center' | 'right';
  };
}
```

---

## 🎨 UI Design

### Layout: 3-Panel Design

```
┌─────────────────────────────────────────────────────────────┐
│  Document Builder                                    [Save] │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  PALETTE     │    CANVAS                │   PREVIEW         │
│              │                          │                   │
│  📄 Header   │  ┌──────────────────┐   │   ┌───────────┐   │
│  📝 Text     │  │ 📄 Header        │   │   │  [PDF]    │   │
│  🖼️ Image    │  │ ✏️ Edit          │   │   │           │   │
│  📊 Table    │  └──────────────────┘   │   │  Live     │   │
│  💧 Leak     │                          │   │  Preview  │   │
│  ✅ Conclusion│ ┌──────────────────┐   │   │           │   │
│  📌 Footer   │  │ 📝 Bakgrund      │   │   │           │   │
│              │  │ ✏️ Edit          │   │   │           │   │
│  [+ Custom]  │  └──────────────────┘   │   └───────────┘   │
│              │                          │                   │
│              │  [+ Add Section]         │   [Export PDF]    │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

### Panel 1: Section Palette (Vänster)

**Kategorier:**
- **Grundläggande** - Header, Text, Divider, Page Break
- **Innehåll** - Rich Text, List, Table, Chart
- **Media** - Image, Image Gallery, Annotated Image
- **Rapport-specifikt** - Leak Areas, GANN Table, Measurements
- **Layout** - Footer, Signature, Metadata

**Varje sektion visar:**
- Icon
- Namn
- Kort beskrivning
- Drag-handle

### Panel 2: Document Canvas (Mitten)

**Features:**
- **Drag-and-drop** från palette
- **Reorder** sektioner (drag up/down)
- **Edit inline** - klicka för att redigera
- **Delete** - ta bort sektion
- **Duplicate** - kopiera sektion
- **Configure** - öppna config-panel

**Varje sektion visar:**
```
┌────────────────────────────────────┐
│ ⋮⋮ [Icon] Section Title      [⚙️][×]│
├────────────────────────────────────┤
│ Content preview...                 │
│                                    │
│ [Data source: report.background]  │
└────────────────────────────────────┘
```

### Panel 3: Live Preview (Höger)

**Features:**
- **Real-time PDF preview** - uppdateras när canvas ändras
- **Zoom controls** - in/ut
- **Page navigation** - om flera sidor
- **Export button** - spara som PDF
- **View modes:**
  - Customer view (vad kunden ser)
  - Internal view (med alla anteckningar)

---

## 🔧 Teknisk Implementation

### Fas 1: Foundation (Vecka 1)

#### 1.1 Skapa nya typer
```typescript
// /lib/types/document-builder.ts
export interface DocumentStructure { ... }
export interface DocumentSection { ... }
export interface SectionConfig { ... }
export interface DocumentStyling { ... }
```

#### 1.2 Skapa Document Builder Store
```typescript
// /stores/documentBuilderStore.ts
interface DocumentBuilderStore {
  // State
  documents: DocumentStructure[];
  activeDocumentId: string | null;
  selectedSectionId: string | null;
  
  // Getters
  getActiveDocument: () => DocumentStructure | null;
  getSelectedSection: () => DocumentSection | null;
  
  // Document actions
  createDocument: (name: string) => DocumentStructure;
  updateDocument: (id: string, updates: Partial<DocumentStructure>) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => DocumentStructure;
  
  // Section actions
  addSection: (type: SectionType, position?: number) => void;
  updateSection: (sectionId: string, updates: Partial<DocumentSection>) => void;
  deleteSection: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  reorderSection: (sectionId: string, newPosition: number) => void;
  
  // Selection
  selectSection: (sectionId: string | null) => void;
  
  // Styling
  updateStyling: (updates: Partial<DocumentStyling>) => void;
  
  // Import/Export
  exportDocument: (id: string) => Promise<Blob>;
  importDocument: (file: File) => Promise<DocumentStructure>;
}
```

#### 1.3 Skapa Section Registry
```typescript
// /lib/document-builder/section-registry.ts
export const SECTION_REGISTRY: Record<SectionType, {
  label: string;
  description: string;
  icon: string;
  category: string;
  defaultConfig: SectionConfig;
  component: React.ComponentType<any>;
  dataMapper?: (report: Report) => any;
}> = {
  header: {
    label: 'Header',
    description: 'Logo, titel och metadata',
    icon: '📄',
    category: 'Grundläggande',
    defaultConfig: { ... },
    component: HeaderSection,
    dataMapper: (report) => ({
      title: report.title,
      client: report.metadata.client,
      date: report.updatedAt,
    }),
  },
  // ... alla andra sektioner
};
```

### Fas 2: UI Components (Vecka 2)

#### 2.1 Main Builder Component
```typescript
// /components/document-builder/document-builder.tsx
export function DocumentBuilder() {
  const { activeDocument, addSection, reorderSection } = useDocumentBuilderStore();
  
  return (
    <div className="flex h-screen">
      <SectionPalette onAddSection={addSection} />
      <DocumentCanvas 
        document={activeDocument}
        onReorder={reorderSection}
      />
      <LivePreview document={activeDocument} />
    </div>
  );
}
```

#### 2.2 Section Palette
```typescript
// /components/document-builder/section-palette.tsx
export function SectionPalette({ onAddSection }) {
  const categories = groupBy(SECTION_REGISTRY, 'category');
  
  return (
    <div className="w-64 border-r overflow-y-auto">
      {Object.entries(categories).map(([category, sections]) => (
        <div key={category}>
          <h3>{category}</h3>
          {sections.map(section => (
            <DraggableSection
              key={section.type}
              section={section}
              onAdd={() => onAddSection(section.type)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### 2.3 Document Canvas (Drag & Drop)
```typescript
// /components/document-builder/document-canvas.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function DocumentCanvas({ document, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = document.sections.findIndex(s => s.id === active.id);
      const newIndex = document.sections.findIndex(s => s.id === over.id);
      onReorder(active.id, newIndex);
    }
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <SortableContext 
        items={document.sections.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-6 overflow-y-auto">
          {document.sections.map(section => (
            <SortableSection key={section.id} section={section} />
          ))}
          <AddSectionButton />
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

#### 2.4 Sortable Section
```typescript
// /components/document-builder/sortable-section.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableSection({ section }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-move">
            ⋮⋮
          </div>
          <span>{section.icon}</span>
          <span className="flex-1">{section.title}</span>
          <SectionActions section={section} />
        </CardHeader>
        <CardContent>
          <SectionEditor section={section} />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2.5 Live Preview
```typescript
// /components/document-builder/live-preview.tsx
export function LivePreview({ document }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      try {
        // Konvertera DocumentStructure till ReportData
        const reportData = documentToReportData(document);
        
        // Generera PDF
        const response = await fetch('/api/document-builder/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
        
        const blob = await response.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce
    const timeout = setTimeout(generatePreview, 500);
    return () => clearTimeout(timeout);
  }, [document]);
  
  return (
    <div className="w-96 border-l p-4">
      <h3 className="mb-4">Live Preview</h3>
      {loading && <Loader />}
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          className="w-full h-full border rounded"
        />
      )}
    </div>
  );
}
```

### Fas 3: Data Integration (Vecka 3)

#### 3.1 Document to Report Data Transformer
```typescript
// /lib/document-builder/transformers.ts
export function documentToReportData(
  document: DocumentStructure,
  report?: Report
): ReportData {
  return {
    id: report?.id || crypto.randomUUID(),
    title: report?.title || 'Untitled',
    sections: document.sections
      .filter(s => s.visible)
      .filter(s => !s.config.showOnlyIfData || hasData(s, report))
      .map(section => {
        const registry = SECTION_REGISTRY[section.type];
        const data = registry.dataMapper?.(report) || {};
        
        return {
          id: section.id,
          title: section.title,
          content: renderSectionContent(section, data),
          type: section.type,
        };
      }),
    styling: document.styling,
    // ... rest of ReportData
  };
}

function hasData(section: DocumentSection, report?: Report): boolean {
  if (!report) return false;
  
  // Check if data source has content
  if (section.dataSource?.path) {
    const value = getValueByPath(report, section.dataSource.path);
    return !!value;
  }
  
  return true;
}

function renderSectionContent(section: DocumentSection, data: any): string {
  // Render based on section type
  switch (section.type) {
    case 'text':
      return section.content?.text || '';
    case 'richtext':
      return section.content?.html || '';
    // ... handle other types
    default:
      return '';
  }
}
```

#### 3.2 API Route for Preview
```typescript
// /app/api/document-builder/preview/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { document, reportId } = body;
  
  // Hämta rapport om ID finns
  let report: Report | undefined;
  if (reportId) {
    report = await getReport(reportId);
  }
  
  // Transform till ReportData
  const reportData = documentToReportData(document, report);
  
  // Generera PDF
  const element = React.createElement(ReportDocument, { report: reportData });
  const pdfStream = await renderToStream(element);
  
  // Return PDF
  const chunks: Uint8Array[] = [];
  for await (const chunk of pdfStream) {
    chunks.push(chunk);
  }
  const pdfBuffer = Buffer.concat(chunks);
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });
}
```

### Fas 4: Advanced Features (Vecka 4)

#### 4.1 Section Configuration Panel
```typescript
// /components/document-builder/section-config-panel.tsx
export function SectionConfigPanel({ section }) {
  const { updateSection } = useDocumentBuilderStore();
  
  return (
    <Sheet>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configure {section.title}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Basic */}
          <div>
            <Label>Title</Label>
            <Input
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
            />
          </div>
          
          {/* Layout */}
          <div>
            <Label>Width</Label>
            <Select
              value={section.config.width}
              onValueChange={(width) => updateSection(section.id, {
                config: { ...section.config, width }
              })}
            >
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="half">Half</SelectItem>
              <SelectItem value="third">Third</SelectItem>
            </Select>
          </div>
          
          {/* Typography */}
          <div>
            <Label>Font Size</Label>
            <Slider
              value={[section.config.fontSize || 12]}
              onValueChange={([fontSize]) => updateSection(section.id, {
                config: { ...section.config, fontSize }
              })}
              min={8}
              max={32}
            />
          </div>
          
          {/* Visibility */}
          <div>
            <Label>Show only if data exists</Label>
            <Switch
              checked={section.config.showOnlyIfData}
              onCheckedChange={(showOnlyIfData) => updateSection(section.id, {
                config: { ...section.config, showOnlyIfData }
              })}
            />
          </div>
          
          {/* Data Source */}
          <div>
            <Label>Data Source</Label>
            <Input
              value={section.dataSource?.path || ''}
              onChange={(e) => updateSection(section.id, {
                dataSource: { ...section.dataSource, path: e.target.value }
              })}
              placeholder="report.background"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### 4.2 Template Management
```typescript
// /components/document-builder/template-manager.tsx
export function TemplateManager() {
  const { documents, createDocument, deleteDocument } = useDocumentBuilderStore();
  
  return (
    <div>
      <h2>Document Templates</h2>
      
      <div className="grid gap-4">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle>{doc.name}</CardTitle>
              <CardDescription>{doc.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => useTemplate(doc)}>Use</Button>
              <Button variant="outline" onClick={() => duplicateDocument(doc.id)}>
                Duplicate
              </Button>
              <Button variant="destructive" onClick={() => deleteDocument(doc.id)}>
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Button onClick={() => createDocument('New Template')}>
        + Create Template
      </Button>
    </div>
  );
}
```

---

## 🔗 Integration med Befintligt System

### 1. Uppdatera Report-typen
```typescript
// /lib/types/rapport.ts
export interface Report {
  // ... existing fields
  
  // Ny: Länk till document structure
  documentStructureId?: string;
}
```

### 2. Använd Document Structure vid PDF-generering
```typescript
// /app/api/reports/preview/pdf/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reportId } = body;
  
  // Hämta rapport
  const report = await getReport(reportId);
  
  // Hämta document structure
  const documentStructure = report.documentStructureId
    ? await getDocumentStructure(report.documentStructureId)
    : getDefaultDocumentStructure();
  
  // Transform till ReportData
  const reportData = documentToReportData(documentStructure, report);
  
  // Generera PDF
  // ...
}
```

### 3. Lägg till Document Builder i Settings
```typescript
// /app/(dashboard)/settings/page.tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="pdf">PDF Settings</TabsTrigger>
    <TabsTrigger value="documents">Document Builder</TabsTrigger>
  </TabsList>
  
  <TabsContent value="documents">
    <DocumentBuilder />
  </TabsContent>
</Tabs>
```

---

## 📋 Checklista

### Fas 1: Foundation ✅
- [ ] Skapa `document-builder.ts` types
- [ ] Skapa `documentBuilderStore.ts`
- [ ] Skapa `section-registry.ts`
- [ ] Skapa default document structures

### Fas 2: UI Components ✅
- [ ] `DocumentBuilder.tsx` - Main component
- [ ] `SectionPalette.tsx` - Palette med sektioner
- [ ] `DocumentCanvas.tsx` - Drag & drop canvas
- [ ] `SortableSection.tsx` - Sortable section card
- [ ] `LivePreview.tsx` - PDF preview
- [ ] `AddSectionButton.tsx` - Lägg till sektion

### Fas 3: Data Integration ✅
- [ ] `transformers.ts` - Document → ReportData
- [ ] `/api/document-builder/preview` - Preview API
- [ ] Uppdatera `Report` type
- [ ] Integrera med befintligt PDF-system

### Fas 4: Advanced Features ✅
- [ ] `SectionConfigPanel.tsx` - Konfigurera sektioner
- [ ] `TemplateManager.tsx` - Hantera templates
- [ ] `StyleEditor.tsx` - Redigera styling
- [ ] Export/Import funktionalitet
- [ ] Undo/Redo funktionalitet

---

## 🎯 Användarflöde

### Scenario 1: Skapa nytt dokument från scratch
1. Gå till **Settings → Document Builder**
2. Klicka **"+ New Document"**
3. Ge dokumentet ett namn: "Läckagerapport 2024"
4. Dra in sektioner från paletten:
   - Header
   - Bakgrund (text)
   - GANN-tabell
   - Bildgalleri
   - Slutsats
5. Konfigurera varje sektion:
   - Ändra titel
   - Sätt data source
   - Anpassa styling
6. Se live preview uppdateras
7. Spara som mall

### Scenario 2: Använda mall för ny rapport
1. Skapa ny rapport
2. Välj mall: "Läckagerapport 2024"
3. Fyll i data (bakgrund, bilder, etc.)
4. Generera PDF - använder mallens struktur

### Scenario 3: Anpassa befintlig mall
1. Gå till **Settings → Document Builder**
2. Välj befintlig mall
3. Lägg till ny sektion: "Rekommendationer"
4. Flytta "Slutsats" längre ner
5. Uppdatera styling (färger, typsnitt)
6. Spara ändringar

---

## 🚀 Nästa Steg

1. **Godkänn planen** - Bekräfta att detta är rätt riktning
2. **Börja med Fas 1** - Skapa foundation (types, store, registry)
3. **Bygg UI steg-för-steg** - En komponent i taget
4. **Testa kontinuerligt** - Se till att allt fungerar
5. **Integrera med befintligt system** - Koppla ihop med rapporter

---

## 💡 Fördelar med denna lösning

✅ **Flexibilitet** - Bygg dokument exakt som du vill  
✅ **Återanvändbarhet** - Spara mallar för framtida rapporter  
✅ **Visuellt** - Drag-and-drop, ingen kod  
✅ **Live preview** - Se resultat direkt  
✅ **Datadriven** - Koppla sektioner till rapport-data  
✅ **Skalbart** - Lägg till nya sektionstyper enkelt  
✅ **Bakåtkompatibelt** - Fungerar med befintliga rapporter  

---

## 🔧 Teknisk Stack

- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit/core
- **PDF Generation**: @react-pdf/renderer
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

---

## 📝 Anteckningar

- Använd `@dnd-kit` istället för `react-beautiful-dnd` (bättre TypeScript-stöd)
- Spara document structures i Supabase för delning mellan användare
- Implementera versionshantering för templates
- Lägg till export till JSON för backup
- Överväg att lägga till AI-assistent för att generera sektioner
