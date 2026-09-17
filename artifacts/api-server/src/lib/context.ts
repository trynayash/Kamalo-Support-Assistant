import type { Request } from "express";

export type SupportRole = "customer" | "support" | "admin" | "system";
export const DEMO_USER_ID = "demo-user";

export type SupportRequestContext = {
  requestId: string;
  sessionId: string | null;
  conversationId: string;
  tenantId: string;
  locale: string;
  identity: {
    userId: string;
    role: SupportRole;
    authenticated: boolean;
  };
  permissions: readonly string[];
  createdAt: string;
};

export type AccountSnapshot = {
  sourceType: "live" | "demo";
  synthetic: boolean;
  values: Record<string, unknown>;
};

export interface AccountContextProvider {
  getContext(userId: string): Promise<AccountSnapshot | null>;
}

export class DemoAccountContextProvider implements AccountContextProvider {
  async getContext(_userId: string): Promise<null> {
    return null;
  }
}

export const accountContextProvider: AccountContextProvider = new DemoAccountContextProvider();

function headerValue(request: Request, name: string): string | null {
  const value = request.header(name)?.trim();
  return value ? value.slice(0, 160) : null;
}

export function createSupportRequestContext(request: Request, conversationId: string): SupportRequestContext {
  const requestId = headerValue(request, "x-request-id") || crypto.randomUUID();
  const sessionId = headerValue(request, "x-session-id");
  const locale = headerValue(request, "accept-language")?.split(",")[0]?.trim() || "en";
  return {
    requestId,
    sessionId,
    conversationId,
    tenantId: "kamalo",
    locale,
    identity: {
      userId: DEMO_USER_ID,
      role: "customer",
      authenticated: false,
    },
    permissions: ["knowledge.read"],
    createdAt: new Date().toISOString(),
  };
}