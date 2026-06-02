import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import env from './environment';
import { authService } from '../modules/auth/auth.service';
import { logger } from '../core/utils/logger';

// Do not configure if keys are missing
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          const result = await authService.googleAuth({
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
          });

          // Pass the generated JWT tokens and user back
          return done(null, result);
        } catch (error: any) {
          logger.error({ err: error }, 'Google authentication error');
          return done(error);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not provided. Google login will be disabled.');
}

export default passport;
