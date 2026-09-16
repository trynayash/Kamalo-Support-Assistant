import crypto from "node:crypto";
import type { Request, Response } from "express";
import * as oidc from "openid-client";
import { eq } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";
import type { SupportRole } from "./context";

export type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: SupportRole;
};

export type SessionData = {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
};

export const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

let oidcConfig: oidc.Configuration | null = null;

export async function getOidcConfig(): Promise<oidc.Configuration> {
  if (!oidcConfig) {
    if (!process.env.REPL_ID) throw new Error("REPL_ID is required for authentication.");
    oidcConfig = await oidc.discovery(new URL(ISSUER_URL), process.env.REPL_ID);
  }
  return oidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.sid, sid));
  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }
  return row.sess as unknown as SessionData;
}

export async function getUser(userId: string): Promise<AuthUser | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role as SupportRole,
  };
}

export async function updateSession(sid: string, data: SessionData): Promise<void> {
  await db.update(sessionsTable).set({
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  }).where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim() || undefined;
  return req.cookies?.[SESSION_COOKIE];
}

function configuredIds(name: string): Set<string> {
  return new Set((process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean));
}

function roleForClaims(claims: Record<string, unknown>, existingRole?: string | null): SupportRole {
  if (existingRole === "admin" || existingRole === "support") return existingRole;
  const id = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  if (configuredIds("KAMALO_ADMIN_USER_IDS").has(id) || configuredIds("KAMALO_ADMIN_EMAILS").has(email)) return "admin";
  if (configuredIds("KAMALO_SUPPORT_USER_IDS").has(id) || configuredIds("KAMALO_SUPPORT_EMAILS").has(email)) return "support";
  return "customer";
}

export async function upsertUser(claims: Record<string, unknown>): Promise<AuthUser> {
  const id = typeof claims.sub === "string" ? claims.sub : "";
  if (!id) throw new Error("Authentication response did not include a user id.");
  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  const role = roleForClaims(claims, current?.role);
  const userData = {
    id,
    email: typeof claims.email === "string" ? claims.email : null,
    firstName: typeof claims.first_name === "string" ? claims.first_name : null,
    lastName: typeof claims.last_name === "string" ? claims.last_name : null,
    profileImageUrl: typeof claims.profile_image_url === "string" ? claims.profile_image_url : typeof claims.picture === "string" ? claims.picture : null,
    role,
  };
  const [user] = await db.insert(usersTable).values(userData).onConflictDoUpdate({
    target: usersTable.id,
    set: { ...userData, updatedAt: new Date() },
  }).returning();
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role as SupportRole,
  };
}

export async function refreshSessionIfExpired(sid: string, session: SessionData): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;
  if (!session.refresh_token) return null;
  try {
    const tokens = await oidc.refreshTokenGrant(await getOidcConfig(), session.refresh_token);
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn() ? now + tokens.expiresIn()! : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}