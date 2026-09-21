import type { Logger } from "pino";
import type { SupportRequestContext } from "./context";

export type SupportEvent = {
  event: "support_request_started" | "knowledge_retrieved" | "tool_decision" | "provider_failure" | "response_completed";
  context: SupportRequestContext;
  latencyMs?: number;
  evidenceCount?: number;
  retrievalFailures?: number;
  toolName?: string;
  decision?: string;
  outcome?: string;
};

export function recordSupportEvent(logger: Logger, event: SupportEvent): void {
  logger.info({
    event: event.event,
    requestId: event.context.requestId,
    sessionId: event.context.sessionId,
    conversationId: event.context.conversationId,
    tenantId: event.context.tenantId,
    locale: event.context.locale,
    userId: event.context.identity.userId,
    role: event.context.identity.role,
    authenticated: event.context.identity.authenticated,
    latencyMs: event.latencyMs,
    evidenceCount: event.evidenceCount,
    retrievalFailures: event.retrievalFailures,
    toolName: event.toolName,
    decision: event.decision,
    outcome: event.outcome,
  }, "Support Core event");
}