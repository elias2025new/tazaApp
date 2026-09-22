/**
 * lib/errors.ts — Typed error result type for all API boundaries.
 * Never leak stack traces or raw DB errors to the client.
 */

export type OkResult<T> = { ok: true; data: T };
export type ErrResult = { ok: false; error: { code: string; message: string } };
export type Result<T> = OkResult<T> | ErrResult;

export function ok<T>(data: T): OkResult<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): ErrResult {
  return { ok: false, error: { code, message } };
}

/** Well-known error codes */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESTAURANT_CLOSED: 'RESTAURANT_CLOSED',
  ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
  BELOW_MINIMUM_ORDER: 'BELOW_MINIMUM_ORDER',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
