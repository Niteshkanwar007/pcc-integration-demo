/**
 * PointClickCare Configuration Validator
 *
 * Enforces strict verification boundaries. A missing or partially configured
 * environment can NEVER be reported as a successful PCC connection.
 * Cannot transition to VERIFIED without explicit runtime verification against live servers.
 */

import { PCCConfig, PCCConnectionStatusReport } from './types';

export class PCCConfigValidator {
  /**
   * Reads PCC configuration from environment variables.
   */
  public static readConfigFromEnv(): PCCConfig {
    return {
      baseUrl: process.env.PCC_BASE_URL || undefined,
      tenantId: process.env.PCC_TENANT_ID || undefined,
      clientId: process.env.PCC_CLIENT_ID || undefined,
      clientSecret: process.env.PCC_CLIENT_SECRET || undefined,
      authMode: (process.env.PCC_AUTH_MODE as 'client_credentials' | 'authorization_code') || 'client_credentials',
      environment: (process.env.PCC_INTEGRATION_MODE as 'synthetic' | 'sandbox' | 'production') || 'synthetic',
    };
  }

  /**
   * Evaluates configuration completeness and returns a formal status report.
   */
  public static evaluateConnectionStatus(
    config: PCCConfig,
    activeMode: 'SYNTHETIC' | 'REAL_SANDBOX' | 'REAL_PRODUCTION',
    explicitVerificationResult?: { verified: boolean; message: string; verifiedEndpointsCount?: number }
  ): PCCConnectionStatusReport {
    const missing: string[] = [];

    if (!config.baseUrl || config.baseUrl.trim() === '') missing.push('PCC_BASE_URL');
    if (!config.tenantId || config.tenantId.trim() === '') missing.push('PCC_TENANT_ID');
    if (!config.clientId || config.clientId.trim() === '') missing.push('PCC_CLIENT_ID');
    if (!config.clientSecret || config.clientSecret.trim() === '') missing.push('PCC_CLIENT_SECRET');

    const nowIso = new Date().toISOString();

    // Case 1: In Synthetic Demo Mode
    if (activeMode === 'SYNTHETIC') {
      return {
        connectionState: 'NOT_CONFIGURED',
        providerMode: 'SYNTHETIC',
        providerStatus: 'SIMULATED',
        activeProviderName: 'Synthetic PCC Provider',
        isConfigured: false,
        isVerified: false,
        livePccVerification: 'NOT_PERFORMED',
        livePccVerificationStatusText: 'NOT PERFORMED',
        message: 'Demo adapter active (SIMULATED). Live PCC Verification: NOT PERFORMED. No live PointClickCare credentials connected.',
        missingConfig: missing,
        lastChecked: nowIso,
      };
    }

    // Case 2: Real Provider target with missing configuration
    if (missing.length > 0) {
      return {
        connectionState: 'NOT_CONFIGURED',
        providerMode: activeMode,
        providerStatus: 'DISCONNECTED',
        activeProviderName: 'Real PCC Provider Skeleton',
        isConfigured: false,
        isVerified: false,
        livePccVerification: 'NOT_PERFORMED',
        livePccVerificationStatusText: 'NOT PERFORMED',
        message: `Missing PCC configuration: ${missing.join(', ')}. Live PCC Verification: NOT PERFORMED.`,
        missingConfig: missing,
        lastChecked: nowIso,
      };
    }

    // Case 3: Configuration present, but has NOT undergone explicit verification against legitimate PCC environment
    if (!explicitVerificationResult || !explicitVerificationResult.verified) {
      return {
        connectionState: 'CONFIGURED_NOT_VERIFIED',
        providerMode: activeMode,
        providerStatus: 'CONNECTED',
        activeProviderName: 'Real PCC Provider Adapter',
        isConfigured: true,
        isVerified: false,
        livePccVerification: 'NOT_PERFORMED',
        livePccVerificationStatusText: 'NOT PERFORMED',
        message:
          explicitVerificationResult?.message ||
          'PCC configuration present. Live PCC Verification: NOT PERFORMED. Verification required with live PointClickCare servers.',
        missingConfig: [],
        lastChecked: nowIso,
      };
    }

    // Case 4: Explicit runtime verification succeeded against legitimate PCC servers
    const verifiedState = activeMode === 'REAL_PRODUCTION' ? 'VERIFIED_PRODUCTION' : 'VERIFIED_SANDBOX';
    return {
      connectionState: verifiedState,
      providerMode: activeMode,
      providerStatus: 'CONNECTED',
      activeProviderName: 'Verified PointClickCare Provider',
      isConfigured: true,
      isVerified: true,
      livePccVerification: 'VERIFIED',
      livePccVerificationStatusText: 'VERIFIED',
      message: `Verified connection established with PointClickCare ${activeMode === 'REAL_PRODUCTION' ? 'Production' : 'Sandbox'} environment.`,
      missingConfig: [],
      lastChecked: nowIso,
      verifiedEndpointsCount: explicitVerificationResult.verifiedEndpointsCount || 4,
    };
  }
}
