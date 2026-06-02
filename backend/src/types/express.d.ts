import { AuthPayload } from "../core/middleware/auth";

declare global {
    namespace Express {
        // Passport defines req.user as Express.User, so we extend that interface
        interface User extends AuthPayload {}
    }
}

export { };