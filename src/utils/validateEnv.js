/**
 * Environment Variable Validation for Driver Mobile App
 * Validates required environment variables at app startup
 * Note: Mobile apps use EXPO_PUBLIC_* prefix and have hardcoded fallbacks
 */

const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const OPTIONAL_ENV_VARS = [
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_MEASUREMENT_ID',
];

/**
 * Validates that all required environment variables are set
 * Note: Returns warnings only since mobile apps have fallback values
 * @returns {{ valid: boolean, usingFallbacks: string[], warnings: string[] }}
 */
export function validateEnv() {
  const usingFallbacks = [];
  const warnings = [];

  // Check required variables - mobile apps have fallbacks so we just warn
  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      usingFallbacks.push(varName);
    }
  });

  // Check optional variables
  OPTIONAL_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Optional env var ${varName} is not set. Some features may be unavailable.`);
    }
  });

  return {
    valid: true, // Mobile apps have fallbacks, so always "valid"
    usingFallbacks,
    warnings,
  };
}

/**
 * Validates environment and logs appropriately
 * Call this at app startup
 */
export function initializeEnvValidation() {
  const { usingFallbacks, warnings } = validateEnv();

  // Log warnings for optional variables
  warnings.forEach((warning) => {
    console.warn(`⚠️ ${warning}`);
  });

  if (usingFallbacks.length > 0) {
    console.warn(
      `⚠️ Using fallback values for:\n${usingFallbacks.map(v => `  - ${v}`).join('\n')}\n` +
      `Consider setting these in your environment for production.`
    );
  } else {
    console.log('✅ All environment variables are configured from environment');
  }

  return { valid: true, usingFallbacks, warnings };
}

export default validateEnv;
