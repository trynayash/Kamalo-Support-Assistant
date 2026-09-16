import { retrieveKnowledge, ensureSeedKnowledge, type RetrievedArticle } from "./knowledge";
import type { SupportRequestContext } from "./context";

export type ToolClassification = "read" | "action";
export type ToolName =
  | "knowledge.retrieve"
  | "demo.transaction.status"
  | "demo.coins.balance"
  | "demo.commission.summary"
  | "demo.fincado.progress";

export type NormalizedToolResult = {
  ok: boolean;
  toolName: ToolName;
  sourceType: "approved_knowledge" | "demo" | "none";
  synthetic: boolean;
  data: unknown;
  errorCode?: "disabled" | "forbidden" | "invalid_input" | "not_found" | "failed";
};

export type ToolGatewayHooks = {
  onDecision?: (event: {
    requestId: string;
    toolName: ToolName;
    decision: "allowed" | "disabled" | "forbidden" | "invalid_input" | "failed";
  }) => void;
  checkRateLimit?: (context: SupportRequestContext, toolName: ToolName) => boolean;
  getIdempotencyKey?: (context: SupportRequestContext, toolName: ToolName, input: unknown) => string | null;
};

type ToolDefinition = {
  name: ToolName;
  classification: ToolClassification;
  description: string;
  permission: string;
  enabled: () => boolean;
  inputSchema: {
    parse: (input: unknown) => unknown | null;
  };
  execute: (input: unknown, context: SupportRequestContext) => Promise<NormalizedToolResult>;
};

const querySchema = {
  parse(input: unknown): { query: string } | null {
    if (!input || typeof input !== "object" || !("query" in input) || typeof input.query !== "string") return null;
    const query = input.query.trim();
    return query.length > 0 && query.length <= 4000 ? { query } : null;
  },
};
const demoReferenceSchema = {
  parse(input: unknown): { reference?: string } | null {
    if (!input || typeof input !== "object") return null;
    if (!("reference" in input) || input.reference === undefined) return {};
    if (typeof input.reference !== "string") return null;
    const reference = input.reference.trim();
    return reference.length <= 120 ? { reference } : null;
  },
};

const demoResult = (toolName: ToolName, context: SupportRequestContext): NormalizedToolResult => ({
  ok: true,
  toolName,
  sourceType: "demo",
  synthetic: true,
  data: {
    status: "synthetic_demo_only",
    reference: "demo",
    explanation: "This is synthetic integration scaffolding. No customer account or live engine was queried.",
    requestId: context.requestId,
  },
});

const toolDefinitions: ToolDefinition[] = [
  {
    name: "knowledge.retrieve",
    classification: "read",
    description: "Retrieve approved KAMALO knowledge with traceable evidence metadata.",
    permission: "knowledge.read",
    enabled: () => true,
    inputSchema: querySchema,
    execute: async (input) => {
      const parsed = querySchema.parse(input);
      if (!parsed) {
        return { ok: false, toolName: "knowledge.retrieve", sourceType: "none", synthetic: false, data: null, errorCode: "invalid_input" };
      }
      await ensureSeedKnowledge();
      const articles = await retrieveKnowledge(parsed.query);
      return { ok: true, toolName: "knowledge.retrieve", sourceType: "approved_knowledge", synthetic: false, data: { articles }, };
    },
  },
  ...([
    ["demo.transaction.status", "Synthetic transaction status example."],
    ["demo.coins.balance", "Synthetic Coins balance example."],
    ["demo.commission.summary", "Synthetic commission example."],
    ["demo.fincado.progress", "Synthetic FINCADO progress example."],
  ] as const).map(([name, description]) => ({
    name,
    classification: "read" as const,
    description,
    permission: "demo.read",
    enabled: () => process.env.ENABLE_DEMO_SUPPORT_TOOLS === "true",
    inputSchema: demoReferenceSchema,
    execute: async (_input: unknown, context: SupportRequestContext) => demoResult(name, context),
  })),
];

export const toolRegistry = toolDefinitions;
export const actionRegistry: ToolDefinition[] = [];

export function listToolDefinitions() {
  return toolDefinitions.map(({ name, classification, description, permission, enabled }) => ({
    name,
    classification,
    description,
    permission,
    enabled: enabled(),
  }));
}

export class ToolGateway {
  constructor(private readonly hooks: ToolGatewayHooks = {}) {}

  async execute(name: ToolName, input: unknown, context: SupportRequestContext): Promise<NormalizedToolResult> {
    const definition = toolDefinitions.find((candidate) => candidate.name === name);
    if (!definition) {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "forbidden" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "not_found" };
    }
    if (definition.classification === "action") {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "forbidden" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "forbidden" };
    }
    if (!definition.enabled()) {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "disabled" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "disabled" };
    }
    if (!context.permissions.includes(definition.permission)) {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "forbidden" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "forbidden" };
    }
    if (this.hooks.checkRateLimit && !this.hooks.checkRateLimit(context, name)) {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "forbidden" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "forbidden" };
    }
    this.hooks.getIdempotencyKey?.(context, name, input);
    const parsed = definition.inputSchema.parse(input);
    if (!parsed) {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "invalid_input" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "invalid_input" };
    }
    try {
      const result = await definition.execute(parsed, context);
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: result.ok ? "allowed" : "failed" });
      return result;
    } catch {
      this.hooks.onDecision?.({ requestId: context.requestId, toolName: name, decision: "failed" });
      return { ok: false, toolName: name, sourceType: "none", synthetic: false, data: null, errorCode: "failed" };
    }
  }
}

export const toolGateway = new ToolGateway();

export type KnowledgeToolResult = NormalizedToolResult & {
  data: { articles: RetrievedArticle[] } | null;
};