/**
 * Template Token Resolver
 * Ersätter tokens som {{kund}}, {{projekt.id}} osv med faktiska värden
 */

import type { ReportFormData } from "@/lib/types/report-builder";

// Lista över tillgängliga tokens
export const AVAILABLE_TOKENS = [
  // Kund-tokens
  "{{kund}}",
  "{{kund.namn}}",
  "{{kund.foretag}}",
  "{{kund.adress}}",

  // Projekt-tokens
  "{{projekt.id}}",
  "{{case.id}}",

  // Rapport-tokens
  "{{rapport.id}}",
  "{{rapport.datum}}",
  "{{datum}}",

  // Utredare-tokens
  "{{utredare}}",
  "{{utredare.namn}}",
  "{{utredare.email}}",
  "{{utredare.telefon}}",
  "{{kontakt.email}}",
  "{{kontakt.telefon}}",

  // Övrigt
  "{{foretag}}",
  "{{adress}}",
];

/**
 * Ersätter alla tokens i en text med faktiska värden från formData
 */
export function resolveTemplateText(
  template: string,
  data: Partial<ReportFormData>,
): string {
  if (!template) return "";

  let resolved = template;

  // Token-mappningar
  const tokenMap: Record<string, string | undefined> = {
    // Kund-tokens
    "{{kund}}": data.mottagare || data.foretag,
    "{{kund.namn}}": data.mottagare,
    "{{kund.foretag}}": data.foretag,
    "{{kund.adress}}": data.adress,

    // Projekt-tokens
    "{{projekt.id}}": data.projektId,
    "{{case.id}}": data.caseId || data.projektId,

    // Rapport-tokens
    "{{rapport.id}}": data.caseId || data.projektId,
    "{{rapport.datum}}": data.datum ? formatDate(data.datum) : "",
    "{{datum}}": data.datum ? formatDate(data.datum) : "",

    // Utredare-tokens
    "{{utredare}}": data.utredare,
    "{{utredare.namn}}": data.utredare,
    "{{utredare.email}}": data.utredareEmail,
    "{{utredare.telefon}}": data.utredarePhone,
    "{{kontakt.email}}": data.utredareEmail,
    "{{kontakt.telefon}}": data.utredarePhone,

    // Övrigt
    "{{foretag}}": data.foretag,
    "{{adress}}": data.adress,
  };

  // Ersätt alla tokens
  Object.entries(tokenMap).forEach(([token, value]) => {
    if (value !== undefined) {
      // Global replace (alla förekomster)
      const regex = new RegExp(escapeRegExp(token), "g");
      resolved = resolved.replace(regex, value);
    }
  });

  // Ta bort oersatta tokens (visa som tom sträng)
  resolved = resolved.replace(/\{\{[^}]*\}\}/g, "");

  return resolved.trim();
}

/**
 * Formaterar datum till svensk format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extraherar alla tokens från en text
 */
export function extractTokens(text: string): string[] {
  const regex = /\{\{[^}]+\}\}/g;
  const matches = text.match(regex);
  return matches || [];
}

/**
 * Validerar om en text innehåller giltiga tokens
 */
export function validateTokens(text: string): {
  valid: boolean;
  invalidTokens: string[];
} {
  const tokens = extractTokens(text);
  const invalidTokens = tokens.filter(
    (token) => !AVAILABLE_TOKENS.includes(token),
  );

  return {
    valid: invalidTokens.length === 0,
    invalidTokens,
  };
}
