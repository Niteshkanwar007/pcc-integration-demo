/**
 * Generic Retry & Resilience Policy Abstraction
 *
 * Provides configurable exponential backoff with jitter and error categorization.
 * Does NOT hardcode vendor-specific rate limits. Safe demonstration defaults
 * are provided for synthetic mode; sandbox/production values can be configured
 * via environment variables once documented.
 */

import { IntegrationError, ProviderNeutralErrorCategory, translateExternalError } from '../error-handling';

export interface RetryPolicyConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableCategories: ProviderNeutralErrorCategory[];
}

export const DEFAULT_SYNTHETIC_RETRY_CONFIG: RetryPolicyConfig = {
  maxAttempts: 3,
  initialDelayMs: 50,
  maxDelayMs: 500,
  backoffMultiplier: 2,
  jitter: true,
  retryableCategories: ['NETWORK_ERROR', 'RATE_LIMITED', 'PROVIDER_ERROR'],
};

export const DEFAULT_PRODUCTION_RETRY_CONFIG: RetryPolicyConfig = {
  maxAttempts: 4,
  initialDelayMs: 300,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
  retryableCategories: ['NETWORK_ERROR', 'RATE_LIMITED', 'PROVIDER_ERROR'],
};

export class RetryPolicy {
  constructor(private config: RetryPolicyConfig = DEFAULT_SYNTHETIC_RETRY_CONFIG) {}

  /**
   * Determines whether an error is retryable according to the configured policy.
   */
  public isRetryable(err: unknown): boolean {
    const integrationErr = translateExternalError(err);
    return this.config.retryableCategories.includes(integrationErr.category) || integrationErr.isRetryable;
  }

  /**
   * Computes the delay for a specific attempt number using exponential backoff + jitter.
   */
  public computeDelayMs(attemptNumber: number, explicitRetryAfterSeconds?: number): number {
    if (explicitRetryAfterSeconds && explicitRetryAfterSeconds > 0) {
      return explicitRetryAfterSeconds * 1000;
    }

    const exponentialDelay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    if (!this.config.jitter) {
      return cappedDelay;
    }

    // Full jitter between 50% and 100% of calculated backoff
    const jitterFactor = 0.5 + Math.random() * 0.5;
    return Math.round(cappedDelay * jitterFactor);
  }

  /**
   * Executes an async operation with automated retry logic.
   */
  public async execute<T>(
    operation: (attempt: number) => Promise<T>,
    onRetry?: (attempt: number, error: IntegrationError, delayMs: number) => void
  ): Promise<{ result: T; attempts: number; totalDelayMs: number }> {
    let attempt = 1;
    let totalDelay = 0;

    while (attempt <= this.config.maxAttempts) {
      try {
        const result = await operation(attempt);
        return { result, attempts: attempt, totalDelayMs: totalDelay };
      } catch (err: unknown) {
        const integrationErr = translateExternalError(err);

        // If not retryable or max attempts exhausted, rethrow
        if (!this.isRetryable(integrationErr) || attempt >= this.config.maxAttempts) {
          throw integrationErr;
        }

        const delay = this.computeDelayMs(attempt);
        totalDelay += delay;

        if (onRetry) {
          onRetry(attempt, integrationErr, delay);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new IntegrationError('PROVIDER_ERROR', 'Exceeded maximum retry attempts', 500);
  }
}
