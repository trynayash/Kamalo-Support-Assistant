import type { NextFunction, Request, Response } from "express";
import type { SupportRole } from "../lib/context";
import { clearSession, getSession, getSessionId, getUser, refreshSessionIfExpired, type AuthUser } from "../lib/auth";

declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      user?: User;
      isAuthenticated(): this is Request & { user: User };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  req.isAuthenticated = function (this: Request): this is Request & { user: AuthUser } {
    return this.user != null;
  };
  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }
  try {
    const session = await getSession(sid);
    const refreshed = session ? await refreshSessionIfExpired(sid, session) : null;
    if (!refreshed?.user?.id) {
      await clearSession(res, sid);
      next();
      return;
    }
    req.user = await getUser(refreshed.user.id) || refreshed.user;
    next();
  } catch (error) {
    req.log.warn({ err: error }, "Authentication session could not be loaded");
    await clearSession(res, sid);
    next();
  }
}

export function requireAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required.", code: "AUTHENTICATION_REQUIRED" });
    return;
  }
  next();
}

export function requireRole(...roles: SupportRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required.", code: "AUTHENTICATION_REQUIRED" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have access to this resource.", code: "ACCESS_DENIED" });
      return;
    }
    next();
  };
}