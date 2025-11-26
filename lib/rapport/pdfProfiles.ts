/**
 * PDF Profiles - Fördefinierade stilprofiler för PDF-export
 * 
 * Dessa profiler kan användas för att snabbt skapa professionella rapporter
 * med olika visuella stilar.
 */

import type { PdfProfile } from "./pdfGenerator";

// ============================================================================
// Fördefinierade profiler
// ============================================================================

/**
 * Modern profil - Ren och professionell med blå accentfärg
 */
export const PROFILE_MODERN: PdfProfile = {
  brandColor: "#1e40af",
  accentColor: "#3b82f6",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "Genererad med Agenter Rapport System",
};

/**
 * Leckageexperten profil - Grön profil för läckagerapporter
 */
export const PROFILE_LECKAGE: PdfProfile = {
  brandColor: "#059669",
  accentColor: "#10b981",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "Leckageexperten - Professionell läckagesökning",
  headerText: "LÄCKAGERAPPORT",
};

/**
 * Bygg profil - Orange profil för byggrapporter
 */
export const PROFILE_BYGG: PdfProfile = {
  brandColor: "#c2410c",
  accentColor: "#ea580c",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "Byggrapport",
  headerText: "BESIKTNINGSRAPPORT",
};

/**
 * Elektriker profil - Gul/orange profil för elrapporter
 */
export const PROFILE_ELEKTRIKER: PdfProfile = {
  brandColor: "#b45309",
  accentColor: "#d97706",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "Elbesiktning",
  headerText: "ELBESIKTNINGSRAPPORT",
};

/**
 * Minimalistisk profil - Enkel svart/vit design
 */
export const PROFILE_MINIMAL: PdfProfile = {
  brandColor: "#18181b",
  accentColor: "#52525b",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  displayLogo: false,
  displayInternalNotes: false,
};

/**
 * Intern profil - För interna rapporter med alla anteckningar synliga
 */
export const PROFILE_INTERNAL: PdfProfile = {
  brandColor: "#7c3aed",
  accentColor: "#8b5cf6",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  displayLogo: true,
  displayInternalNotes: true,
  footerText: "INTERN RAPPORT - EJ FÖR DISTRIBUTION",
  headerText: "INTERN RAPPORT",
};

/**
 * Premium profil - Elegant design med mörkblå färger
 */
export const PROFILE_PREMIUM: PdfProfile = {
  brandColor: "#1e3a5f",
  accentColor: "#2563eb",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  displayLogo: true,
  displayInternalNotes: false,
  footerText: "Premium Rapport",
};

// ============================================================================
// Profil-register
// ============================================================================

export const PDF_PROFILES = {
  modern: PROFILE_MODERN,
  leckage: PROFILE_LECKAGE,
  bygg: PROFILE_BYGG,
  elektriker: PROFILE_ELEKTRIKER,
  minimal: PROFILE_MINIMAL,
  internal: PROFILE_INTERNAL,
  premium: PROFILE_PREMIUM,
} as const;

export type PdfProfileKey = keyof typeof PDF_PROFILES;

/**
 * Hämtar en profil baserat på nyckel
 */
export function getProfile(key: PdfProfileKey): PdfProfile {
  return PDF_PROFILES[key];
}

/**
 * Hämtar profil baserat på rapporttyp (trade)
 */
export function getProfileForTrade(trade: string): PdfProfile {
  switch (trade) {
    case "läckage":
      return PROFILE_LECKAGE;
    case "bygg":
      return PROFILE_BYGG;
    case "elektriker":
      return PROFILE_ELEKTRIKER;
    default:
      return PROFILE_MODERN;
  }
}

/**
 * Lista över alla tillgängliga profiler med metadata
 */
export const PROFILE_OPTIONS = [
  {
    key: "modern" as PdfProfileKey,
    label: "Modern",
    description: "Ren och professionell design",
    color: "#1e40af",
  },
  {
    key: "leckage" as PdfProfileKey,
    label: "Läckage",
    description: "Optimerad för läckagerapporter",
    color: "#059669",
  },
  {
    key: "bygg" as PdfProfileKey,
    label: "Bygg",
    description: "Optimerad för byggrapporter",
    color: "#c2410c",
  },
  {
    key: "elektriker" as PdfProfileKey,
    label: "Elektriker",
    description: "Optimerad för elrapporter",
    color: "#b45309",
  },
  {
    key: "minimal" as PdfProfileKey,
    label: "Minimalistisk",
    description: "Enkel svart/vit design",
    color: "#18181b",
  },
  {
    key: "premium" as PdfProfileKey,
    label: "Premium",
    description: "Elegant professionell design",
    color: "#1e3a5f",
  },
  {
    key: "internal" as PdfProfileKey,
    label: "Intern",
    description: "Med interna anteckningar",
    color: "#7c3aed",
  },
] as const;

export default PDF_PROFILES;
