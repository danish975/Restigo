"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const environment_1 = __importDefault(require("./environment"));
const auth_service_1 = require("../modules/auth/auth.service");
const logger_1 = require("../core/utils/logger");
// Do not configure if keys are missing
if (environment_1.default.GOOGLE_CLIENT_ID && environment_1.default.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: environment_1.default.GOOGLE_CLIENT_ID,
        clientSecret: environment_1.default.GOOGLE_CLIENT_SECRET,
        callbackURL: environment_1.default.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
            if (!email) {
                return done(new Error('No email found in Google profile'));
            }
            const result = await auth_service_1.authService.googleAuth({
                id: profile.id,
                email: email,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
            });
            // Pass the generated JWT tokens and user back
            return done(null, result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Google authentication error');
            return done(error);
        }
    }));
}
else {
    logger_1.logger.warn('Google OAuth credentials not provided. Google login will be disabled.');
}
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map