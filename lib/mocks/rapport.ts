import type {
  Report,
  ReportSectionDefinition,
  ReportTemplate,
} from "@/lib/types/rapport";

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: "bygg-standard",
    name: "Byggbesiktning",
    trade: "bygg",
    description: "Mall för tak, fasad och stomgranskningar.",
    sections: [
      {
        id: "inledning",
        title: "Inledning",
        description: "Syfte, förutsättningar och kort sammanfattning.",
      },
      {
        id: "skador",
        title: "Skador och observationer",
        description: "Detaljer kring upptäckta fel och deras omfattning.",
      },
      {
        id: "atgarder",
        title: "Rekommenderade åtgärder",
        description: "Prioriterade insatser och material.",
      },
    ],
    checklist: [
      { id: "foto-tak", label: "Fota varje takfall", required: true },
      { id: "fukt", label: "Logga fuktvärden", required: true },
      { id: "priser", label: "Uppskatta reservdelar" },
    ],
    assetGuidelines: [
      {
        id: "overview",
        label: "Översiktsbild",
        required: true,
        tags: ["före"],
      },
      {
        id: "detail",
        label: "Detalj på skada",
        required: true,
        tags: ["skada"],
      },
    ],
    visibilityRules: [
      {
        id: "internal_notes",
        audience: "internal",
        label: "Interna noteringar",
      },
      {
        id: "customer_summary",
        audience: "customer",
        label: "Kundsammansfattning",
      },
    ],
  },
  {
    id: "lackage-akut",
    name: "Läckagespårning",
    trade: "läckage",
    description: "Mall för vatten- och fuktrelaterade uppdrag.",
    sections: [
      {
        id: "status",
        title: "Status vid ankomst",
        description: "Beskriv påverkat område, yta och aktuella fuktvärden.",
      },
      {
        id: "mattningar",
        title: "Mätdata",
        description: "Lista mätpunkter, instrument och eventuella avvikelser.",
      },
    ],
    checklist: [
      { id: "stang-av", label: "Stäng av huvudvatten", required: true },
      { id: "foto", label: "Fotodokumentation" },
    ],
    assetGuidelines: [
      {
        id: "thermal",
        label: "Termografibild",
        description: "Om värmekamera används.",
      },
    ],
    visibilityRules: [
      {
        id: "insurance",
        audience: "customer",
        label: "Material för försäkring",
      },
    ],
  },
  {
    id: "el-service",
    name: "Elsäkerhetskontroll",
    trade: "elektriker",
    description: "Mall för statuskontroller i elcentraler.",
    sections: [
      {
        id: "system",
        title: "Systeminfo",
        description:
          "Dokumentera huvudsäkring, dokumentation och andra grunddata.",
      },
      {
        id: "riskbedomning",
        title: "Riskbedömning",
        description: "Sammanfatta noterade anmärkningar och prioritet.",
      },
    ],
    checklist: [
      { id: "isolation", label: "Isolationsmätning", required: true },
      { id: "termisk", label: "Termisk scanning" },
    ],
    assetGuidelines: [{ id: "panel", label: "Panelbild", required: true }],
    visibilityRules: [
      { id: "compliance", audience: "customer", label: "Regeluppfyllnad" },
    ],
  },
];

export const mockReports: Report[] = [
  {
    id: "rep-001",
    title: "Takkontroll Vasagatan 14",
    status: "review",
    type: "bygg",
    templateId: "bygg-standard",
    metadata: {
      client: "Nordbygg AB",
      location: "Vasagatan 14, Stockholm",
      projectReference: "JOB-2044",
      assignedTo: "Sara Lind",
      scheduledAt: "2024-10-05T08:00:00Z",
      dueAt: "2024-10-07T16:00:00Z",
      priority: "high",
    },
    sections: [
      {
        id: "inledning",
        title: "Inledning",
        status: "completed",
        hint: "Syfte, förutsättningar och kort sammanfattning.",
        content:
          "Omfattning: Visuell kontroll av takytor samt vind.\nPlatsförhållanden: Soligt, torrt underlag.",
      },
      {
        id: "skador",
        title: "Skador och observationer",
        status: "completed",
        hint: "Detaljer kring upptäckta fel och deras omfattning.",
        content:
          "Sammanfattning: Sprickor och felaktig infästning orsakar läckage.\nRisknivå: Hög.",
      },
    ],
    checklist: [
      {
        id: "foto-tak",
        label: "Fota varje takfall",
        required: true,
        completed: true,
      },
      {
        id: "fukt",
        label: "Logga fuktvärden",
        required: true,
        completed: false,
      },
      { id: "priser", label: "Uppskatta reservdelar", completed: false },
    ],
    assets: [
      {
        id: "asset-1",
        label: "Takfall öst",
        url: "/images/samples/takfall-ost.jpg",
        capturedAt: "2024-10-05T09:10:00Z",
        capturedBy: "Sara Lind",
        tags: ["före", "skada"],
      },
      {
        id: "asset-2",
        label: "Vind",
        url: "/images/samples/vind.jpg",
        capturedAt: "2024-10-05T09:45:00Z",
        capturedBy: "Sara Lind",
        tags: ["mätdata"],
      },
    ],
    updatedAt: "2024-10-05T12:15:00Z",
  },
  {
    id: "rep-002",
    title: "Akut läckage Brf Ekdungen",
    status: "draft",
    type: "läckage",
    templateId: "lackage-akut",
    metadata: {
      client: "Brf Ekdungen",
      location: "Eliegatan 8, Uppsala",
      projectReference: "JOB-2051",
      assignedTo: "Marcus Östberg",
      scheduledAt: "2024-10-06T07:30:00Z",
      dueAt: "2024-10-06T18:00:00Z",
      priority: "medium",
    },
    sections: [
      {
        id: "status",
        title: "Status vid ankomst",
        status: "pending",
        hint: "Beskriv påverkat område, yta och fuktvärden.",
        content: "Påverkad yta: Kök ca 12 m²\nFukt (RH): 78 %",
      },
    ],
    checklist: [
      {
        id: "stang-av",
        label: "Stäng av huvudvatten",
        required: true,
        completed: true,
      },
      { id: "foto", label: "Fotodokumentation", completed: false },
    ],
    assets: [
      {
        id: "asset-3",
        label: "Kökstak",
        url: "/images/samples/kokstak.jpg",
        capturedAt: "2024-10-06T08:02:00Z",
        capturedBy: "Marcus Östberg",
        tags: ["läckage"],
      },
    ],
    updatedAt: "2024-10-06T08:30:00Z",
  },
  {
    id: "rep-003",
    title: "Elsäkerhetskontroll Datacenter Norr",
    status: "approved",
    type: "elektriker",
    templateId: "el-service",
    metadata: {
      client: "Northern Compute",
      location: "Terminalgatan 2, Luleå",
      projectReference: "JOB-1988",
      assignedTo: "Elin Gidlund",
      scheduledAt: "2024-09-28T06:30:00Z",
      dueAt: "2024-09-28T15:00:00Z",
      priority: "low",
    },
    sections: [
      {
        id: "system",
        title: "Systeminfo",
        status: "completed",
        hint: "Dokumentera huvudsäkring, dokumentation och andra grunddata.",
        content:
          "Huvudsäkring: 3x125A\nDokumentation: Digital driftpärm uppdaterad.",
      },
      {
        id: "riskbedomning",
        title: "Riskbedömning",
        status: "completed",
        hint: "Sammanfatta noterade anmärkningar och prioritet.",
        content:
          "Anmärkningar: Ej noterade.\nPrioritet: 1 (rekommenderar termisk scanning kvartalsvis).",
      },
    ],
    checklist: [
      {
        id: "isolation",
        label: "Isolationsmätning",
        required: true,
        completed: true,
      },
      { id: "termisk", label: "Termisk scanning", completed: true },
    ],
    assets: [
      {
        id: "asset-4",
        label: "Central A",
        url: "/images/samples/central-a.jpg",
        capturedAt: "2024-09-28T07:15:00Z",
        capturedBy: "Elin Gidlund",
        tags: ["panel"],
      },
    ],
    updatedAt: "2024-09-28T16:10:00Z",
  },
];

export const mockReportSections: ReportSectionDefinition[] = [
  {
    id: "section-inledning",
    title: "Inledning",
    description: "Syfte, förutsättningar och kort sammanfattning.",
    category: "Generellt",
  },
  {
    id: "section-skador",
    title: "Skador och observationer",
    description: "Detaljer kring upptäckta fel och deras omfattning.",
    category: "Bygg",
  },
  {
    id: "section-atgarder",
    title: "Rekommenderade åtgärder",
    description: "Prioriterade insatser och material.",
    category: "Åtgärd",
  },
  {
    id: "section-status",
    title: "Status vid ankomst",
    description: "Initial bedömning av situationen.",
    category: "Läckage",
  },
  {
    id: "section-measurements",
    title: "Mätdata",
    description: "Dokumentera instrument och mätpunkter.",
    category: "Läckage",
  },
  {
    id: "section-risk",
    title: "Riskbedömning",
    description: "Identifiera risknivå och rekommendationer.",
    category: "El",
  },
];
