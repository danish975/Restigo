import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { validate } from '../../core/middleware/validate';
import { authenticate } from '../../core/middleware/auth';
import { registerDto, loginDto, refreshTokenDto, otpRequestDto, otpVerifyDto } from './auth.dto';
import { StatusCodes } from 'http-status-codes';
import passport from '../../config/passport';
import env from '../../config/environment';

const router = Router();

// POST /auth/register
router.post('/register', validate(registerDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) { next(error); }
});

// POST /auth/login
router.post('/login', validate(loginDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) { next(error); }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: { message: 'Refresh token required' } });
      return;
    }
    const result = await authService.refreshAccessToken(token);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.OK).json({ success: true, data: { accessToken: result.accessToken } });
  } catch (error) { next(error); }
});

// POST /auth/otp/request
router.post('/otp/request', validate(otpRequestDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await authService.generateOTP(req.body.email);
    // In production, send via email/SMS — here we just confirm
    res.status(StatusCodes.OK).json({ success: true, message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { _devOtp: code }),
    });
  } catch (error) { next(error); }
});

// POST /auth/otp/verify
router.post('/otp/verify', validate(otpVerifyDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.verifyOTP(req.body.email, req.body.code, req.body.purpose);
    res.status(StatusCodes.OK).json({ success: true, message: 'Verification successful' });
  } catch (error) { next(error); }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(req.user!.userId, token);
    res.clearCookie('refreshToken');
    res.status(StatusCodes.OK).json({ success: true, message: 'Logged out' });
  } catch (error) { next(error); }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.status(StatusCodes.OK).json({ success: true, data: { user } });
  } catch (error) { next(error); }
});

// ─── Google OAuth Routes ───

// GET /auth/google (Initiates Google OAuth)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed` }),
  (req: Request, res: Response) => {
    // The user is authenticated and tokens are attached to req.user via passport config
    const result = req.user as any;
    
    // Set refresh token in cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send access token back to frontend via query param (or render a script to pass it safely)
    // Sending it in the URL fragment is safer for SPA redirects
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  }
);

export default router;
