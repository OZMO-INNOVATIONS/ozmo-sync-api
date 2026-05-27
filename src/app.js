/**
 * @file app.js
 * @description Express application factory.
 *              Wires up all middleware and routes — does NOT start the server.
 *              Keeping this separate from server.js lets you import the app
 *              directly in integration tests without binding to a port.
 *
 *  Middleware order (matters!):
 *    1. Security  (helmet)
 *    2. CORS
 *    3. Rate limiting
 *    4. Request logger (morgan)
 *    5. Body parsers
 *    6. Routes
 *    7. 404 handler
 *    8. Global error handler  ← must be last
 */

'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const config      = require('./config/env');
const authRoutes  = require('./routes/authRoutes');
const userRoutes  = require('./routes/userRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');

const app = express();

// ── 1. Security headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods            : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders     : ['Content-Type', 'Authorization'],
    exposedHeaders     : ['X-Request-Id'],
    credentials        : true,
    optionsSuccessStatus: 204,
  }),
);

// ── 3. Rate limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs : config.RATE_LIMIT_WINDOW_MS,
  max      : config.RATE_LIMIT_MAX,
  standardHeaders: true,   // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders  : false,
  message: {
    success   : false,
    message   : 'Too many requests — please try again later',
    timestamp : new Date().toISOString(),
  },
});

app.use(limiter);

// Stricter limiter specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 20,
  standardHeaders: true,
  legacyHeaders  : false,
  message: {
    success   : false,
    message   : 'Too many authentication attempts — please try again in 15 minutes',
    timestamp : new Date().toISOString(),
  },
});

// ── 4. Request logger ─────────────────────────────────────────────────────────
const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ── 5. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 6. Health check (no auth / rate-limit) ────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success   : true,
    message   : 'Service is healthy',
    app       : config.APP_NAME,
    env       : config.NODE_ENV,
    timestamp : new Date().toISOString(),
  });
});

// ── 7. API Routes (versioned) ──────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/user', userRoutes);

// ── 8. 404 catch-all ──────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── 9. Global error handler (must have 4 args) ────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
