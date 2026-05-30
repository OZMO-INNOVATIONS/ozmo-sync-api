import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Security headers
app.use(helmet());

// CORS — allow frontend origin
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' })); // limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging (morgan)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Stricter rate limiter for login route
const loginLimiter = rateLimit({
  windowMs: config.loginRateLimitWindowMs,
  max: config.loginRateLimitMax,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth/login', loginLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'Server is running');
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Admin routes (protected by authenticate + authorize middleware inside the router)
app.use('/api/v1/admin', adminRoutes);

// 404 handler — unmatched routes
app.all('*', (_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found`,
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

export default app;
