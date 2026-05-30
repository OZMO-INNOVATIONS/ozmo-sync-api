import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userStore } from '../data/users';
import { sendSuccess, sendError } from '../utils/response';
import { JwtPayload } from '../middleware/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate an access JWT token for the given user.
 */
const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Generate a refresh JWT token with a longer expiry.
 */
const generateRefreshToken = (payload: Omit<JwtPayload, 'role'>): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user with email and password.
 * Returns a JWT token on success.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    // --- Find user ---
    const user = userStore.findByEmail(email);

    if (!user) {
      sendError(res, 'User does not exist', 404);
      return;
    }

    // --- Check blocked status ---
    if (user.isBlocked) {
      sendError(res, 'Your account has been blocked', 403);
      return;
    }

    // --- Verify password ---
    const isPasswordValid = await userStore.validatePassword(password, user.password);

    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // --- Generate tokens ---
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // --- Success response (never expose password) ---
    const safeUser = userStore.sanitizeUser(user);

    sendSuccess(
      res,
      {
        userId: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
        token: accessToken,
        refreshToken,
      },
      'Login successful',
      200
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/register
 *
 * Creates a new user account (in-memory — lost on server restart).
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // --- Validation ---
    if (!name || !email || !password) {
      sendError(res, 'Name, email, and password are required', 400);
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendError(res, 'Invalid email format', 400);
      return;
    }

    if (password.length < 6) {
      sendError(res, 'Password must be at least 6 characters', 400);
      return;
    }

    // --- Check for existing user ---
    const existingUser = userStore.findByEmail(email);
    if (existingUser) {
      sendError(res, 'A user with this email already exists', 409);
      return;
    }

    // --- Create new user ---
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = userStore.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const safeUser = userStore.sanitizeUser(newUser);

    sendSuccess(res, safeUser, 'User registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 *
 * Exchanges a valid refresh token for a new access token.
 *
 * Uses synchronous jwt.verify (throws on invalid/expired tokens)
 * wrapped in try/catch for clean error handling.
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token is required', 400);
      return;
    }

    // Synchronous verify — throws on failure
    let decoded: { userId: number; email: string };
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
        userId: number;
        email: string;
      };
    } catch {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const user = userStore.findById(decoded.userId);

    if (!user) {
      sendError(res, 'User no longer exists', 401);
      return;
    }

    if (user.isBlocked) {
      sendError(res, 'Your account has been blocked', 403);
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, { token: newAccessToken }, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 *
 * Returns the authenticated user's profile.
 * Protected route — requires valid JWT.
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = userStore.findById(req.user.userId);

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const safeUser = userStore.sanitizeUser(user);
    sendSuccess(res, safeUser, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};
