/**
 * Provider-Neutral Integration Error Handling & Classification
 *
 * Translates vendor-specific EHR error payloads and HTTP network codes into
 * normalized, provider-neutral internal categories.
 */

export type ProviderNeutralErrorCategory =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'PROVIDER_ERROR'
  | 'MAPPING_ERROR'
  | 'UNKNOWN_ERROR';

export type IntegrationErrorCode =
  | ProviderNeutralErrorCategory
  | 'PCC_CLIENT_ERROR'
  | 'PCC_AUTH_EXPIRED'
  | 'RESIDENT_NOT_FOUND'
  | 'INVALID_ADT_PAYLOAD'
  | 'INVALID_EXTERNAL_PAYLOAD'
  | 'FACILITY_UNAVAILABLE'
  | 'INVALID_ORDER_STATE'
  | 'INTERNAL_INTEGRATION_FAULT';

export class IntegrationError extends Error {
  public readonly code: IntegrationErrorCode;
  public readonly category: ProviderNeutralErrorCategory;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
    category?: ProviderNeutralErrorCategory
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.category = category || IntegrationError.inferCategory(code, statusCode);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isRetryable = IntegrationError.isCategoryRetryable(this.category, statusCode);
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }

  private static inferCategory(code: string, statusCode: number): ProviderNeutralErrorCategory {
    if (statusCode === 401 || code === 'PCC_AUTH_EXPIRED') return 'AUTHENTICATION_ERROR';
    if (statusCode === 403) return 'AUTHORIZATION_ERROR';
    if (statusCode === 404 || code === 'RESIDENT_NOT_FOUND') return 'NOT_FOUND';
    if (statusCode === 429) return 'RATE_LIMITED';
    if (statusCode === 400 || statusCode === 422 || code === 'INVALID_ADT_PAYLOAD') return 'VALIDATION_ERROR';
    if (code === 'MAPPING_ERROR') return 'MAPPING_ERROR';
    if (statusCode >= 502 && statusCode <= 504) return 'NETWORK_ERROR';
    if (statusCode >= 500) return 'PROVIDER_ERROR';
    return 'UNKNOWN_ERROR';
  }

  public static isCategoryRetryable(category: ProviderNeutralErrorCategory, statusCode?: number): boolean {
    if (category === 'RATE_LIMITED') return true;
    if (category === 'NETWORK_ERROR') return true;
    if (statusCode === 503 || statusCode === 504 || statusCode === 429) return true;
    return false;
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      details: this.details,
    };
  }
}

/**
 * Universal error translator.
 * Maps any external exception, HTTP status code, or network failure into an IntegrationError.
 */
export function translateExternalError(err: unknown, fallbackMessage = 'An EHR integration error occurred'): IntegrationError {
  if (err instanceof IntegrationError) {
    return err;
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('rate') || msg.includes('429') || msg.includes('too many requests')) {
      return new IntegrationError('RATE_LIMITED', err.message, 429, undefined, 'RATE_LIMITED');
    }
    if (msg.includes('auth') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('401')) {
      return new IntegrationError('AUTHENTICATION_ERROR', err.message, 401, undefined, 'AUTHENTICATION_ERROR');
    }
    if (msg.includes('forbidden') || msg.includes('permission') || msg.includes('403')) {
      return new IntegrationError('AUTHORIZATION_ERROR', err.message, 403, undefined, 'AUTHORIZATION_ERROR');
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return new IntegrationError('NOT_FOUND', err.message, 404, undefined, 'NOT_FOUND');
    }
    if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('503')) {
      return new IntegrationError('NETWORK_ERROR', err.message, 503, undefined, 'NETWORK_ERROR');
    }
    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('missing')) {
      return new IntegrationError('VALIDATION_ERROR', err.message, 400, undefined, 'VALIDATION_ERROR');
    }
    if (msg.includes('mapping') || msg.includes('parse')) {
      return new IntegrationError('MAPPING_ERROR', err.message, 500, undefined, 'MAPPING_ERROR');
    }
    return new IntegrationError('PROVIDER_ERROR', err.message, 500, undefined, 'PROVIDER_ERROR');
  }

  return new IntegrationError('UNKNOWN_ERROR', fallbackMessage, 500, { raw: String(err) }, 'UNKNOWN_ERROR');
}
