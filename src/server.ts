import app from './app';
import { config } from './config';
import { userStore } from './data/users';

/**
 * Bootstrap the application.
 * - Seeds mock users into memory
 * - Starts the HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    // Seed mock users at startup
    if (config.seedUsers) {
      await userStore.seed();
      console.log('[SEED] Mock users loaded into memory');
      console.log('[SEED]   john@example.com / 123456       (user)');
      console.log('[SEED]   admin@example.com / admin123     (admin)');
      console.log('[SEED]   super@example.com / super123     (superadmin)');
      console.log('[SEED]   blocked@example.com / blocked123 (blocked)');
    }

    // Start the server
    app.listen(config.port, () => {
      console.log(`\n[SERVER] Running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`[SERVER] Health check: http://localhost:${config.port}/api/v1/health`);
      console.log(`[SERVER] Login:        POST http://localhost:${config.port}/api/v1/auth/login\n`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
};

void startServer();
