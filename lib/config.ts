import { z } from 'zod';

// ============================================================================
// Configuration Schema
// ============================================================================

const ConfigSchema = z.object({
  VITE_TOOLHOUSE_API_KEY: z.string().default(''),
  VITE_RTRVR_API_KEY: z.string().default(''),
  VITE_ELEVENLABS_API_KEY: z.string().default(''),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().default(''),
  VITE_CLINICALTRIALS_API_BASE: z.string().url().default('https://clinicaltrials.gov/api/v2'),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// Configuration Cache
// ============================================================================

let cachedConfig: Config | null = null;

// ============================================================================
// Main Configuration Function
// ============================================================================

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = import.meta.env;

  const result = ConfigSchema.safeParse({
    VITE_TOOLHOUSE_API_KEY: env.VITE_TOOLHOUSE_API_KEY,
    VITE_RTRVR_API_KEY: env.VITE_RTRVR_API_KEY,
    VITE_ELEVENLABS_API_KEY: env.VITE_ELEVENLABS_API_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_CLINICALTRIALS_API_BASE: env.VITE_CLINICALTRIALS_API_BASE,
  });

  if (!result.success) {
    const missingKeys = result.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ');
    throw new Error(
      `Missing or invalid environment variables: ${missingKeys}. ` +
      'Please check your .env file and ensure all required API keys are set.'
    );
  }

  cachedConfig = result.data;
  return cachedConfig;
}

// ============================================================================
// Individual Getter Functions
// ============================================================================

export function getToolhouseApiKey(): string {
  return getConfig().VITE_TOOLHOUSE_API_KEY;
}

export function getRtrvrApiKey(): string {
  return getConfig().VITE_RTRVR_API_KEY;
}

export function getElevenLabsApiKey(): string {
  return getConfig().VITE_ELEVENLABS_API_KEY;
}

export function getStripePublishableKey(): string {
  return getConfig().VITE_STRIPE_PUBLISHABLE_KEY;
}

export function getClinicalTrialsApiBase(): string {
  return getConfig().VITE_CLINICALTRIALS_API_BASE;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Masks an API key for safe logging (shows first 4 and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Validates that all required configuration is present
 * Returns true if valid, throws if invalid
 */
export function validateConfig(): boolean {
  getConfig();
  return true;
}

/**
 * Resets the configuration cache (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
