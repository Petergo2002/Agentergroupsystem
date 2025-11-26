/**
 * PDF Structure Types - för att bygga anpassade PDF-layouter
 */

export type PDFSectionType =
  | 'header'
  | 'intro'
  | 'background'
  | 'methods'
  | 'conclusion'
  | 'gann'
  | 'gallery'
  | 'leakAreas'
  | 'footer';

export interface PDFSection {
  id: string;
  type: PDFSectionType;
  title: string;
  visible: boolean;
  order: number;
  config: {
    fontSize?: number;
    spacing?: number;
    showOnlyIfData?: boolean;
    pageBreakBefore?: boolean;
    pageBreakAfter?: boolean;
  };
}

export interface PDFStyling {
  colors: {
    primary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    h1Size: number;
    h2Size: number;
    h3Size: number;
    bodySize: number;
    lineHeight: number;
    fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier';
  };
  spacing: {
    margin: { top: number; bottom: number; left: number; right: number };
    sectionGap: number;
    headerGap: number;
  };
}

export interface PDFStructure {
  id: string;
  name: string;
  description?: string;
  sections: PDFSection[];
  styling: PDFStyling;
  createdAt: string;
  updatedAt: string;
}

// Default styling
export const DEFAULT_PDF_STYLING: PDFStyling = {
  colors: {
    primary: '#22c55e',
    accent: '#0f172a',
    text: '#1f2937',
    background: '#ffffff',
  },
  typography: {
    h1Size: 28,
    h2Size: 18,
    h3Size: 14,
    bodySize: 11,
    lineHeight: 1.8,
    fontFamily: 'Helvetica',
  },
  spacing: {
    margin: { top: 40, bottom: 40, left: 40, right: 40 },
    sectionGap: 30,
    headerGap: 20,
  },
};

// Default sections
export const DEFAULT_PDF_SECTIONS: Omit<PDFSection, 'id' | 'order'>[] = [
  {
    type: 'header',
    title: 'Header',
    visible: true,
    config: { showOnlyIfData: false },
  },
  {
    type: 'intro',
    title: 'Inledning',
    visible: true,
    config: { showOnlyIfData: true },
  },
  {
    type: 'background',
    title: 'Bakgrund',
    visible: true,
    config: { showOnlyIfData: false },
  },
  {
    type: 'methods',
    title: 'Mätmetoder',
    visible: true,
    config: { showOnlyIfData: true },
  },
  {
    type: 'gann',
    title: 'GANN-tabell',
    visible: true,
    config: { showOnlyIfData: true, pageBreakBefore: false },
  },
  {
    type: 'gallery',
    title: 'Bildgalleri',
    visible: true,
    config: { showOnlyIfData: true },
  },
  {
    type: 'leakAreas',
    title: 'Läckageområden',
    visible: true,
    config: { showOnlyIfData: true },
  },
  {
    type: 'conclusion',
    title: 'Slutsats',
    visible: true,
    config: { showOnlyIfData: true },
  },
  {
    type: 'footer',
    title: 'Footer',
    visible: true,
    config: { showOnlyIfData: false },
  },
];

// Section metadata
export const PDF_SECTION_METADATA: Record<PDFSectionType, {
  label: string;
  description: string;
  icon: string;
  defaultVisible: boolean;
}> = {
  header: {
    label: 'Header',
    description: 'Logo, titel och metadata',
    icon: '📄',
    defaultVisible: true,
  },
  intro: {
    label: 'Inledning',
    description: 'Introduktion till rapporten',
    icon: '📝',
    defaultVisible: true,
  },
  background: {
    label: 'Bakgrund',
    description: 'Bakgrundsinformation',
    icon: '📋',
    defaultVisible: true,
  },
  methods: {
    label: 'Mätmetoder',
    description: 'Beskrivning av mätmetoder',
    icon: '🔬',
    defaultVisible: true,
  },
  gann: {
    label: 'GANN-tabell',
    description: 'Fuktmätning enligt GANN',
    icon: '📊',
    defaultVisible: true,
  },
  gallery: {
    label: 'Bildgalleri',
    description: 'Samling av bilder',
    icon: '🖼️',
    defaultVisible: true,
  },
  leakAreas: {
    label: 'Läckageområden',
    description: 'Detaljerad information om läckageområden',
    icon: '💧',
    defaultVisible: true,
  },
  conclusion: {
    label: 'Slutsats',
    description: 'Sammanfattning och slutsatser',
    icon: '✅',
    defaultVisible: true,
  },
  footer: {
    label: 'Footer',
    description: 'Sidfot med kontaktinformation',
    icon: '📌',
    defaultVisible: true,
  },
};
