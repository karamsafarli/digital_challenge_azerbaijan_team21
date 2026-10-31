import { verifyToken } from '../services/auth.js';
import { HttpError } from '../utils/httpError.js';

/** Require a valid Bearer token; optionally restrict to the given roles. Sets req.user. */
export function requireAuth(...roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new HttpError(401, 'Bu əməliyyat üçün daxil olmalısınız'));

    try {
      req.user = verifyToken(token);
    } catch {
      return next(new HttpError(401, 'Sessiyanın vaxtı bitib. Yenidən daxil olun'));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Bu bölməyə giriş icazəniz yoxdur'));
    }
    return next();
  };
}
