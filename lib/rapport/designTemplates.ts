/**
 * Fördefinierade designmallar för olika branscher
 * 
 * Dessa mallar innehåller:
 * - Sektioner med förifylld text och variabler
 * - Checklistor anpassade för branschen
 * - Styling-profiler
 */

import type { ReportTemplate, ReportSectionTemplate, ReportChecklistItem } from "@/lib/types/rapport";

// ============================================================================
// Läckage – Designmall
// ============================================================================

export const LACKAGE_DESIGN_TEMPLATE: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt"> = {
  name: "Läckage – Designmall",
  trade: "läckage",
  description: "Professionell mall för läckagerapporter med alla nödvändiga sektioner för dokumentation av vattenskador.",
  sections: [
    {
      id: "lackage-intro",
      title: "Inledning",
      type: "summary",
      description: "Kort sammanfattning av uppdraget",
      defaultContent: `Denna rapport dokumenterar läckageutredning utförd av {{assignedTo}} på uppdrag av {{client}}.

Plats: {{location}}
Datum: {{today}}
Referens: {{projectReference}}`,
    },
    {
      id: "lackage-bakgrund",
      title: "Bakgrund & Uppdrag",
      type: "text",
      description: "Beskriv varför utredningen genomfördes",
      defaultContent: `Fastighetsägaren {{client}} kontaktade oss angående misstänkt vattenläckage på adressen {{location}}.

Uppdraget omfattar:
• Lokalisering av läckagekälla
• Dokumentation av skador
• Bedömning av åtgärdsbehov
• Rekommendationer för sanering`,
    },
    {
      id: "lackage-metod",
      title: "Metod & Utrustning",
      type: "text",
      description: "Beskriv vilken metodik och utrustning som använts",
      defaultContent: `Följande metoder och utrustning har använts vid utredningen:

• Fuktmätning med [typ av mätare]
• Värmekamera för termografisk analys
• Visuell inspektion
• [Övriga metoder]`,
    },
    {
      id: "lackage-fynd",
      title: "Fynd & Observationer",
      type: "text",
      description: "Dokumentera vad som hittades",
      defaultContent: `Vid undersökningen gjordes följande observationer:

[Beskriv fynden här]`,
    },
    {
      id: "lackage-bilder-fore",
      title: "Dokumentation – Före åtgärd",
      type: "image_gallery",
      description: "Bilder som visar skador och läckage innan åtgärd",
    },
    {
      id: "lackage-matvarder",
      title: "Mätvärden",
      type: "table",
      description: "Fuktmätvärden och andra mätresultat",
    },
    {
      id: "lackage-atgarder",
      title: "Utförda åtgärder",
      type: "text",
      description: "Beskriv vilka åtgärder som vidtagits",
      defaultContent: `Följande åtgärder har utförts:

• [Åtgärd 1]
• [Åtgärd 2]
• [Åtgärd 3]`,
    },
    {
      id: "lackage-bilder-efter",
      title: "Dokumentation – Efter åtgärd",
      type: "image_gallery",
      description: "Bilder som visar resultatet efter åtgärd",
    },
    {
      id: "lackage-rekommendationer",
      title: "Rekommendationer",
      type: "text",
      description: "Förslag på fortsatta åtgärder",
      defaultContent: `Baserat på utredningen rekommenderas följande:

1. [Rekommendation 1]
2. [Rekommendation 2]
3. [Rekommendation 3]

Vid frågor, kontakta oss gärna.`,
    },
    {
      id: "lackage-signatur",
      title: "Signatur",
      type: "signature",
      description: "Underskrifter",
    },
  ],
  checklist: [
    { id: "ck-1", label: "Fuktmätning genomförd", required: true, completed: false },
    { id: "ck-2", label: "Fotografering före åtgärd", required: true, completed: false },
    { id: "ck-3", label: "Läckagekälla identifierad", required: true, completed: false },
    { id: "ck-4", label: "Åtgärder dokumenterade", required: true, completed: false },
    { id: "ck-5", label: "Fotografering efter åtgärd", required: false, completed: false },
    { id: "ck-6", label: "Kund informerad", required: true, completed: false },
  ],
  visibilityRules: [],
  assetGuidelines: [],
};

// ============================================================================
// Bygg – Designmall
// ============================================================================

export const BYGG_DESIGN_TEMPLATE: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt"> = {
  name: "Bygg – Designmall",
  trade: "bygg",
  description: "Komplett mall för byggrapporter med projektinfo, arbetsbeskrivning, materiallista och dokumentation.",
  sections: [
    {
      id: "bygg-projektinfo",
      title: "Projektinformation",
      type: "summary",
      description: "Översikt av projektet",
      defaultContent: `Projekt: {{title}}
Kund: {{client}}
Plats: {{location}}
Projektledare: {{assignedTo}}
Datum: {{today}}
Referens: {{projectReference}}`,
    },
    {
      id: "bygg-uppdrag",
      title: "Uppdragsbeskrivning",
      type: "text",
      description: "Beskriv vad som ska utföras",
      defaultContent: `Detta uppdrag omfattar följande arbeten på {{location}}:

[Beskriv uppdraget här]`,
    },
    {
      id: "bygg-bilder-fore",
      title: "Före-bilder",
      type: "image_gallery",
      description: "Dokumentation av utgångsläget",
    },
    {
      id: "bygg-arbete",
      title: "Utfört arbete",
      type: "text",
      description: "Detaljerad beskrivning av utfört arbete",
      defaultContent: `Följande arbeten har utförts:

Dag 1:
• [Arbetsmoment]

Dag 2:
• [Arbetsmoment]`,
    },
    {
      id: "bygg-material",
      title: "Materiallista",
      type: "table",
      description: "Förteckning över använt material",
    },
    {
      id: "bygg-bilder-efter",
      title: "Efter-bilder",
      type: "image_gallery",
      description: "Dokumentation av slutresultatet",
    },
    {
      id: "bygg-kontroll",
      title: "Egenkontroll",
      type: "checklist",
      description: "Kontrollpunkter för kvalitetssäkring",
    },
    {
      id: "bygg-avvikelser",
      title: "Avvikelser & Noteringar",
      type: "text",
      description: "Eventuella avvikelser från plan",
      defaultContent: `Inga avvikelser har noterats.

[Eller beskriv avvikelser här]`,
    },
    {
      id: "bygg-slutbesked",
      title: "Slutbesked",
      type: "text",
      description: "Sammanfattning och godkännande",
      defaultContent: `Arbetet är slutfört enligt överenskommelse.

Garantitid: [X] månader från slutdatum.

Vid frågor eller reklamationer, kontakta oss.`,
    },
    {
      id: "bygg-signatur",
      title: "Signatur",
      type: "signature",
      description: "Underskrifter från utförare och beställare",
    },
  ],
  checklist: [
    { id: "ck-b1", label: "Arbetsplats säkrad", required: true, completed: false },
    { id: "ck-b2", label: "Material kontrollerat", required: true, completed: false },
    { id: "ck-b3", label: "Före-dokumentation klar", required: true, completed: false },
    { id: "ck-b4", label: "Arbete utfört enligt ritning", required: true, completed: false },
    { id: "ck-b5", label: "Städning genomförd", required: true, completed: false },
    { id: "ck-b6", label: "Efter-dokumentation klar", required: true, completed: false },
    { id: "ck-b7", label: "Kund godkänt arbetet", required: true, completed: false },
  ],
  visibilityRules: [],
  assetGuidelines: [],
};

// ============================================================================
// Elektriker – Designmall
// ============================================================================

export const ELEKTRIKER_DESIGN_TEMPLATE: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt"> = {
  name: "Elektriker – Designmall",
  trade: "elektriker",
  description: "Mall för elinstallationsrapporter med säkerhetskontroller, mätvärden och certifiering.",
  sections: [
    {
      id: "el-info",
      title: "Anläggningsinformation",
      type: "summary",
      description: "Information om elanläggningen",
      defaultContent: `Anläggning: {{location}}
Ägare: {{client}}
Utförd av: {{assignedTo}}
Datum: {{today}}
Referens: {{projectReference}}`,
    },
    {
      id: "el-uppdrag",
      title: "Uppdragsbeskrivning",
      type: "text",
      description: "Beskriv elarbetet",
      defaultContent: `Uppdraget omfattar:

[Beskriv elarbetet här]`,
    },
    {
      id: "el-bilder",
      title: "Dokumentation",
      type: "image_gallery",
      description: "Bilder på installationen",
    },
    {
      id: "el-matvarder",
      title: "Mätvärden & Provning",
      type: "table",
      description: "Isolationsmätning, jordfelsmätning etc.",
    },
    {
      id: "el-arbete",
      title: "Utfört arbete",
      type: "text",
      description: "Detaljerad beskrivning",
      defaultContent: `Följande elarbeten har utförts:

• [Arbetsmoment 1]
• [Arbetsmoment 2]
• [Arbetsmoment 3]`,
    },
    {
      id: "el-sakerhet",
      title: "Säkerhetskontroll",
      type: "checklist",
      description: "Obligatoriska säkerhetskontroller",
    },
    {
      id: "el-avvikelser",
      title: "Avvikelser & Risker",
      type: "text",
      description: "Eventuella säkerhetsrisker eller avvikelser",
      defaultContent: `Inga säkerhetsrisker eller avvikelser har noterats.

[Eller beskriv avvikelser här]`,
    },
    {
      id: "el-intyg",
      title: "Intyg",
      type: "text",
      description: "Certifiering och intyg",
      defaultContent: `Undertecknad intygar att elinstallationen är utförd enligt gällande föreskrifter och standarder.

Behörighetsnummer: [XXX]
Giltig till: [Datum]`,
    },
    {
      id: "el-signatur",
      title: "Signatur",
      type: "signature",
      description: "Underskrift av behörig installatör",
    },
  ],
  checklist: [
    { id: "ck-e1", label: "Anläggningen spänningslös vid arbete", required: true, completed: false },
    { id: "ck-e2", label: "Isolationsmätning utförd", required: true, completed: false },
    { id: "ck-e3", label: "Jordfelsskydd testat", required: true, completed: false },
    { id: "ck-e4", label: "Märkning korrekt", required: true, completed: false },
    { id: "ck-e5", label: "Dokumentation uppdaterad", required: true, completed: false },
    { id: "ck-e6", label: "Slutkontroll genomförd", required: true, completed: false },
  ],
  visibilityRules: [],
  assetGuidelines: [],
};

// ============================================================================
// Alla designmallar
// ============================================================================

export const DESIGN_TEMPLATES = [
  LACKAGE_DESIGN_TEMPLATE,
  BYGG_DESIGN_TEMPLATE,
  ELEKTRIKER_DESIGN_TEMPLATE,
];

/**
 * Hämta designmall för en specifik bransch
 */
export function getDesignTemplateForTrade(trade: string) {
  return DESIGN_TEMPLATES.find((t) => t.trade === trade);
}

/**
 * Skapa en ny rapport-mall baserad på en designmall
 */
export function createTemplateFromDesign(
  design: typeof LACKAGE_DESIGN_TEMPLATE,
  overrides?: Partial<ReportTemplate>
): Omit<ReportTemplate, "id" | "createdAt" | "updatedAt"> {
  return {
    ...design,
    ...overrides,
    sections: design.sections.map((s) => ({ ...s })),
    checklist: design.checklist.map((c) => ({ ...c })),
  };
}

export default DESIGN_TEMPLATES;
