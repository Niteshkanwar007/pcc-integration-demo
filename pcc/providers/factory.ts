/**
 * PointClickCare Provider Factory
 *
 * Implements dependency injection for EHR providers.
 * Returns SyntheticPCCProvider by default. A future environment configuration
 * can select RealPCCProvider when legitimate PCC credentials exist.
 */

import { PCCProvider, ISimulatedPCCProvider, PCCConfigurationError } from './types';
import { SyntheticPCCProvider } from './synthetic-provider';
import { RealPCCProvider } from './real-provider';
import { PCCConfigValidator } from './config-validator';

let cachedProvider: PCCProvider | null = null;
let cachedSyntheticProvider: ISimulatedPCCProvider | null = null;

export function getPCCProvider(): PCCProvider {
  if (cachedProvider) return cachedProvider;

  const mode = process.env.PCC_INTEGRATION_MODE?.toLowerCase();
  const config = PCCConfigValidator.readConfigFromEnv();

  // If explicit Real PCC mode is selected:
  if (mode === 'real' || mode === 'sandbox' || mode === 'production') {
    const targetMode = mode === 'production' ? 'REAL_PRODUCTION' : 'REAL_SANDBOX';
    const status = PCCConfigValidator.evaluateConnectionStatus(config, targetMode);

    // If credentials are missing, throw configuration error. NEVER silently fall back!
    if (!status.isConfigured) {
      throw new PCCConfigurationError(
        `PointClickCare Configuration Error: Explicit Real PCC mode ('${mode}') selected, but required credentials are missing: ${status.missingConfig.join(', ')}. Never falling back to synthetic mode silently. Either provide legitimate credentials or configure PCC_INTEGRATION_MODE=synthetic.`,
        status.missingConfig,
        mode
      );
    }

    // Credentials provided: instantiate Real provider adapter skeleton.
    // Note: Connection state remains CONFIGURED_NOT_VERIFIED until explicit live verification is performed.
    cachedProvider = new RealPCCProvider(config);
    return cachedProvider;
  }

  // Explicit Synthetic mode or default: SyntheticPCCProvider
  if (!cachedSyntheticProvider) {
    cachedSyntheticProvider = new SyntheticPCCProvider();
  }
  cachedProvider = cachedSyntheticProvider;
  return cachedProvider;
}

/**
 * Returns the synthetic provider instance, guaranteeing simulator support for demonstrations.
 */
export function getSyntheticPCCProvider(): ISimulatedPCCProvider {
  if (!cachedSyntheticProvider) {
    cachedSyntheticProvider = new SyntheticPCCProvider();
  }
  return cachedSyntheticProvider;
}

/**
 * Resets cached provider instances (used in test suites).
 */
export function resetProviderCache(): void {
  cachedProvider = null;
  cachedSyntheticProvider = null;
}
