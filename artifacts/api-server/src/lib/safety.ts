const blockedPatterns = [
  /reveal|show|print|repeat/i,
  /system prompt|developer message|api key|secret|credential/i,
];

export function isPromptExtractionAttempt(content: string): boolean {
  return blockedPatterns.every((pattern) => pattern.test(content));
}

export const PROMPT_EXTRACTION_RESPONSE = "I can help with KAMALO product questions, but I can’t reveal internal instructions, credentials, or implementation details.";

export function capAssistantOutput(content: string, maxLength = 12000): string {
  return content.length > maxLength ? `${content.slice(0, maxLength - 1).trim()}…` : content;
}