/**
 * Centrala färgdefinitioner för rapportsystemet
 * 
 * Alla komponenter som behöver branschfärger ska importera härifrån
 * för att säkerställa konsistens.
 */

import type { ReportTrade } from "@/lib/types/rapport";

// ============================================================================
// Trade Colors - Färgscheman per bransch
// ============================================================================

export interface TradeColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Färgscheman för olika branscher (trades)
 * - läckage: Grönt tema (professionellt, tekniskt)
 * - bygg: Brunt/orange tema (jordnära, robust)
 * - elektriker: Blått tema (tekniskt, pålitligt)
 */
export const TRADE_COLORS: Record<ReportTrade, TradeColorScheme> = {
  läckage: { 
    primary: "#065f46", 
    secondary: "#10b981", 
    accent: "#d1fae5" 
  },
  bygg: { 
    primary: "#78350f", 
    secondary: "#d97706", 
    accent: "#fef3c7" 
  },
  elektriker: { 
    primary: "#1e3a5f", 
    secondary: "#3b82f6", 
    accent: "#dbeafe" 
  },
};

/**
 * Standardfärger om ingen bransch matchar
 */
export const DEFAULT_TRADE_COLORS: TradeColorScheme = {
  primary: "#065f46",
  secondary: "#10b981",
  accent: "#d1fae5",
};

/**
 * Hämtar färgschema för en bransch med fallback till default
 */
export function getTradeColors(trade?: string): TradeColorScheme {
  if (!trade) return DEFAULT_TRADE_COLORS;
  return TRADE_COLORS[trade as ReportTrade] || DEFAULT_TRADE_COLORS;
}

// ============================================================================
// PDF Profile Colors
// ============================================================================

export interface PdfColorProfile {
  brandColor: string;
  accentColor: string;
}

/**
 * Standardfärger för PDF-profiler
 */
export const DEFAULT_PDF_COLORS: PdfColorProfile = {
  brandColor: "#0f172a",
  accentColor: "#22c55e",
};
