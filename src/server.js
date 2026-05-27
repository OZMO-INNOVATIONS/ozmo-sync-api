/**
 * @file server.js
 * @description HTTP server entry point.
 *              Imports the configured Express app and starts listening.
 *              Handles graceful shutdown on SIGTERM / SIGINT.
 */

'use strict';

const http   = require('http');
const app    = require('./app');
const config = require('./config/env');

const server = http.createServer(app);

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(config.PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  🚀  ${config.APP_NAME} is running               `);
  console.log(`║  🌐  http://localhost:${config.PORT}                          `);
  console.log(`║  ⚙️   Environment : ${config.NODE_ENV}              `);
  console.log(`║  📋  API Base    : /api/v1                        `);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

/**
 * Attempt a clean shutdown within a timeout window.
 * Lets in-flight requests finish before closing.
 * @param {string} signal
 */
function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown…`);

  server.close((err) => {
    if (err) {
      console.error('[Server] Error during shutdown:', err);
      process.exit(1);
    }
    console.log('[Server] All connections closed. Goodbye 👋');
    process.exit(0);
  });

  // Force exit if shutdown takes longer than 10 s
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections (safety net)
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

// Catch uncaught exceptions (safety net — ideally never triggered)
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});
