import { Router } from 'express';
import { login, register, refresh, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return a JWT token.
 */
router.post('/login', login);

/**
 * POST /api/v1/auth/register
 * Create a new user account (mock — in-memory only).
 */
router.post('/register', register);

/**
 * POST /api/v1/auth/refresh
 * Exchange a refresh token for a new access token.
 */
router.post('/refresh', refresh);

/**
 * GET /api/v1/auth/me
 * Get the authenticated user's profile.
 * Protected — requires a valid Bearer token.
 */
router.get('/me', authenticate, getProfile);

export default router;
