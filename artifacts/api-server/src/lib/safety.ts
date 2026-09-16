const blockedPatterns = [
  /reveal|show|print|repeat/i,
  /system prompt|developer message|api key|secret|credential/i,
];

export function isPromptExtractionAttempt(content: string): boolean {
  return blockedPatterns.every((pattern) => pattern.test(content));
}

export const PROMPT_EXTRACTION_RESPONSE = "I can help with KAMALO product questions, but I can’t reveal internal instructions, credentials, or implementation details.";

export function cleanAssistantOutput(content: string): string {
  let cleaned = content.trim();
  if (
    cleaned.length >= 2 &&
    ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("“") && cleaned.endsWith("”")) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned
    .replace(/["“”`]/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/(\*\*[^*\n]+\*\*)\s*[-:]\s*/g, "$1. ")
    .replace(/^[ \t]*[-•][ \t]+/gm, "")
    .replace(/\n*(If you(?:'d| would) like|Would you like|Let me know|Feel free to ask)[\s\S]*$/i, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function capAssistantOutput(content: string, maxLength = 12000): string {
  return content.length > maxLength ? `${content.slice(0, maxLength - 1).trim()}…` : content;
}