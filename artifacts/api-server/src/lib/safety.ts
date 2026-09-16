const promptExtractionPatterns = [
  /\b(system|developer|hidden|internal)\s+(prompt|instruction|instructions|message)\b/i,
  /\b(reveal|show|print|repeat|share|dump|output|tell me|what are)\b[\s\S]{0,100}\b(system prompt|developer message|hidden instructions?|api key|secret|credential|token|password|private key)\b/i,
  /\b(system prompt|developer message|hidden instructions?|api key|secret|credential|token|password|private key)\b[\s\S]{0,100}\b(reveal|show|print|repeat|share|dump|output|tell me)\b/i,
];

const exposedSecretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,
  /\b(?:bearer\s+)[a-z0-9._~+/=-]{16,}\b/gi,
  /\b(?:sk|pk|rk)[-_][a-z0-9_-]{12,}\b/gi,
  /\b(?:api[-_ ]?key|access[-_ ]?token|secret|password|private[-_ ]?key)\s*[:=]\s*\S+/gi,
];

export function isPromptExtractionAttempt(content: string): boolean {
  return promptExtractionPatterns.some((pattern) => pattern.test(content));
}

export const PROMPT_EXTRACTION_RESPONSE = "I can help with KAMALO product questions, but I can’t reveal internal instructions, credentials, or implementation details.";

export const SAFE_ASSISTANT_ERROR = "I’m having trouble responding right now. Please try again.";

export function normalizeUserInput(content: string): string {
  return content.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

export function redactSensitiveOutput(content: string): string {
  return exposedSecretPatterns.reduce((safeContent, pattern) => safeContent.replace(pattern, "[redacted]"), content);
}

export function sanitizeAssistantOutput(content: string): string {
  const cleaned = redactSensitiveOutput(cleanAssistantOutput(content));
  if (/\b(?:OPENROUTER_API_KEY|SESSION_SECRET|private key|developer message|system prompt)\b/i.test(cleaned)) {
    return PROMPT_EXTRACTION_RESPONSE;
  }
  return cleaned;
}

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