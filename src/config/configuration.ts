import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Application configuration object.
 *
 * Centralizes all environment variables with sensible defaults.
 * Grouped by domain for readability.
 */
export const configuration = () => {
  const isTestOrDev = ['development', 'test'].includes(process.env.NODE_ENV || 'development');

  return {
    // ─── Server ────────────────────────────────────────────────────────────
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'ozmo-auth-api',

    // ─── JWT ───────────────────────────────────────────────────────────────
    jwt: {
      secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // ─── Rate Limiting ─────────────────────────────────────────────────────
    // In development/test, allow many requests for API testing.
    // In production, use stricter limits.
    rateLimit: {
      login: {
        windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || (isTestOrDev ? '100' : '5'), 10),
      },
      global: {
        windowMs: 15 * 60 * 1000,
        max: isTestOrDev ? 1000 : 100,
      },
    },

    // ─── CORS ──────────────────────────────────────────────────────────────
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // ─── Seed ──────────────────────────────────────────────────────────────
    seedUsers: process.env.SEED_USERS !== 'false',
  };
};

export type Configuration = ReturnType<typeof configuration>;
