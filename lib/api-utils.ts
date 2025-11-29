/**
 * Client-side API utilities for consistent error handling
 */

import { toast } from "sonner";
import type { ApiError, ApiResult } from "./types/api";

/**
 * Parse an API response and extract data or throw/handle error
 */
export async function parseApiResponse<T>(
  response: Response
): Promise<ApiResult<T>> {
  const json = await response.json();

  if (!response.ok) {
    // Try to extract standard error shape
    if (json.error && typeof json.error === "object") {
      return { error: json.error as ApiError };
    }

    // Fallback for non-standard error responses
    return {
      error: {
        code: `HTTP_${response.status}`,
        message: json.error || json.message || "Ett fel uppstod",
        details: json.details,
      },
    };
  }

  return { data: json.data ?? json };
}

/**
 * Handle API error by showing a toast notification
 * Returns the error for further handling if needed
 */
export function handleApiError(
  error: ApiError,
  options?: {
    /** Custom message to show instead of the error message */
    customMessage?: string;
    /** Whether to show a toast (default: true) */
    showToast?: boolean;
  }
): ApiError {
  const { customMessage, showToast = true } = options ?? {};

  if (showToast) {
    const message = customMessage || getSwedishErrorMessage(error);
    toast.error(message);
  }

  return error;
}

/**
 * Convenience function to fetch and handle errors in one call
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const result = await parseApiResponse<T>(response);

  if ("error" in result && result.error) {
    handleApiError(result.error);
    throw new Error(result.error.message);
  }

  return result.data;
}

/**
 * Map error codes to Swedish user-friendly messages
 */
function getSwedishErrorMessage(error: ApiError): string {
  const codeMessages: Record<string, string> = {
    UNAUTHORIZED: "Du måste logga in för att fortsätta",
    FORBIDDEN: "Du har inte behörighet att utföra denna åtgärd",
    SESSION_EXPIRED: "Din session har gått ut, vänligen logga in igen",
    VALIDATION_ERROR: "Kontrollera att alla fält är korrekt ifyllda",
    MISSING_REQUIRED_FIELD: "Vänligen fyll i alla obligatoriska fält",
    INVALID_INPUT: "Ogiltig indata",
    NOT_FOUND: "Resursen kunde inte hittas",
    ALREADY_EXISTS: "Resursen finns redan",
    CONFLICT: "En konflikt uppstod, försök igen",
    INTERNAL_ERROR: "Ett internt fel uppstod, försök igen senare",
    DATABASE_ERROR: "Ett databasfel uppstod",
    EXTERNAL_SERVICE_ERROR: "En extern tjänst är inte tillgänglig",
    ORGANIZATION_NOT_FOUND: "Organisationen kunde inte hittas",
    VAPI_NOT_CONFIGURED: "AI-integration är inte konfigurerad för din organisation",
    FEATURE_DISABLED: "Denna funktion är inte aktiverad för din organisation",
  };

  return codeMessages[error.code] || error.message || "Ett fel uppstod";
}
