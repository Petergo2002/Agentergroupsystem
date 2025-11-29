/**
 * Standard API response types for consistent error handling
 */

/**
 * Standard API error shape returned by all API routes
 */
export interface ApiError {
  /** Machine-readable error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional details */
  details?: unknown;
}

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: never;
}

/**
 * Standard API error response wrapper
 */
export interface ApiErrorResponse {
  data?: never;
  error: ApiError;
}

/**
 * Union type for API responses
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * Common error codes used across the application
 */
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_INPUT: "INVALID_INPUT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Business logic errors
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  VAPI_NOT_CONFIGURED: "VAPI_NOT_CONFIGURED",
  FEATURE_DISABLED: "FEATURE_DISABLED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Helper to create a standard API error
 */
export function createApiError(
  code: ErrorCode | string,
  message: string,
  details?: unknown
): ApiError {
  return { code, message, details };
}

/**
 * Helper to check if a response is an error
 */
export function isApiError(
  response: ApiResult<unknown>
): response is ApiErrorResponse {
  return "error" in response && response.error !== undefined;
}
