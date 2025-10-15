/**
 * Error handling utilities for API responses
 * Provides standardized error responses with proper HTTP status codes and security headers
 */

import type { ApiError, ApiErrorCode, ApiErrorDetail } from "../../types";

/**
 * Security headers applied to all API responses
 */
const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
} as const;

/**
 * Creates a standardized API error response
 *
 * @param code - Error code from ApiErrorCode enum
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 * @returns Response object with error body and security headers
 *
 * @example
 * ```typescript
 * return createApiError(
 *   'VALIDATION_ERROR',
 *   'Source text must be at least 1000 characters',
 *   422,
 *   { field: 'source_text', min: 1000, actual: 850 }
 * );
 * ```
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ApiErrorDetail
): Response {
  const errorBody: ApiError = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: SECURITY_HEADERS,
  });
}

/**
 * Creates a 400 Bad Request error response
 * Used for malformed requests or invalid input format
 */
export function badRequest(message: string, details?: ApiErrorDetail): Response {
  return createApiError("VALIDATION_ERROR", message, 400, details);
}

/**
 * Creates a 404 Not Found error response
 * Used when requested resource doesn't exist
 */
export function notFound(message = "Resource not found"): Response {
  return createApiError("NOT_FOUND", message, 404);
}

/**
 * Creates a 409 Conflict error response
 * Used when resource already exists (e.g., duplicate hash)
 */
export function conflict(message: string, details?: ApiErrorDetail): Response {
  return createApiError("CONFLICT", message, 409, details);
}

/**
 * Creates a 401 Unauthorized error response
 * Used when authentication is required but missing or invalid
 */
export function unauthorized(message = "Authentication required", details?: ApiErrorDetail): Response {
  return createApiError("UNAUTHORIZED", message, 401, details);
}

/**
 * Creates a 403 Forbidden error response
 * Used when user is authenticated but lacks permissions
 */
export function forbidden(message = "Access forbidden", details?: ApiErrorDetail): Response {
  return createApiError("FORBIDDEN", message, 403, details);
}

/**
 * Creates a 422 Unprocessable Entity error response
 * Used for validation errors on well-formed requests
 */
export function unprocessableEntity(message: string, details?: ApiErrorDetail): Response {
  return createApiError("UNPROCESSABLE_ENTITY", message, 422, details);
}

/**
 * Creates a 429 Too Many Requests error response
 * Used when rate limit is exceeded
 */
export function tooManyRequests(message = "Rate limit exceeded", retryAfter?: number): Response {
  const headers = {
    ...SECURITY_HEADERS,
    ...(retryAfter && { "Retry-After": retryAfter.toString() }),
  };

  const errorBody: ApiError = {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message,
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status: 429,
    headers,
  });
}

/**
 * Creates a 500 Internal Server Error response
 * Used for unexpected server errors
 * Note: Details should be logged server-side, not exposed to client
 */
export function internalServerError(message = "Internal server error"): Response {
  return createApiError("INTERNAL_SERVER_ERROR", message, 500);
}

/**
 * Creates a 503 Service Unavailable error response
 * Used when external service (e.g., OpenRouter.ai) is temporarily unavailable
 */
export function serviceUnavailable(message = "Service temporarily unavailable", retryAfter?: number): Response {
  const headers = {
    ...SECURITY_HEADERS,
    ...(retryAfter && { "Retry-After": retryAfter.toString() }),
  };

  const errorBody: ApiError = {
    error: {
      code: "SERVICE_UNAVAILABLE",
      message,
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status: 503,
    headers,
  });
}

/**
 * Creates a successful JSON response with security headers
 *
 * @param data - Response data to serialize
 * @param status - HTTP status code (default: 200)
 * @returns Response object with data and security headers
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: SECURITY_HEADERS,
  });
}
