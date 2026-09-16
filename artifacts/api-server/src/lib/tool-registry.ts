export type ToolName =
  | "getTransaction"
  | "getTransactionStatus"
  | "getCoinBalance"
  | "getCoinLedger"
  | "getCommission"
  | "getSilverProgress"
  | "getGoldProgress"
  | "getFincadoProgress"
  | "getNotificationHistory";

export type ToolDefinition = {
  name: ToolName;
  enabled: boolean;
  description: string;
};

const toolNames: ToolName[] = [
  "getTransaction",
  "getTransactionStatus",
  "getCoinBalance",
  "getCoinLedger",
  "getCommission",
  "getSilverProgress",
  "getGoldProgress",
  "getFincadoProgress",
  "getNotificationHistory",
];

export const toolRegistry: ToolDefinition[] = toolNames.map((name) => ({
  name,
  enabled: false,
  description: "Reserved for a future controlled KAMALO tool gateway.",
}));