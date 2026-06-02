export const configuration = () => {
  const isTestOrDev = ['development', 'test'].includes(
    process.env.NODE_ENV ?? 'development',
  );

  return {
    port: parseInt(process.env.PORT ?? '4000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appName: process.env.APP_NAME ?? 'ozmo-sync-api',

    rateLimit: {
      login: {
        windowMs: parseInt(
          process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? '900000',
          10,
        ),
        max: parseInt(
          process.env.LOGIN_RATE_LIMIT_MAX ?? (isTestOrDev ? '100' : '5'),
          10,
        ),
      },
      global: {
        windowMs: 15 * 60 * 1000,
        max: isTestOrDev ? 1000 : 100,
      },
    },

    corsOrigin: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000',
  };
};

export type Configuration = ReturnType<typeof configuration>;
