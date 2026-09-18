const promptExtractionPatterns = [
  /\b(system|developer|hidden|internal)\s+(prompt|instruction|instructions|message)\b/i,
  /\b(reveal|show|print|repeat|share|dump|output|tell me|what are)\b[\s\S]{0,100}\b(system prompt|developer message|hidden instructions?|api key|secret|credential|token|password|private key)\b/i,
  /\b(system prompt|developer message|hidden instructions?|api key|secret|credential|token|password|private key)\b[\s\S]{0,100}\b(reveal|show|print|repeat|share|dump|output|tell me)\b/i,
];

const instructionInjectionPatterns = [
  /\b(ignore|disregard|override|forget)\b[\s\S]{0,120}\b(previous|prior|above|system|developer|instruction|rule|restriction)/i,
  /\b(reveal|show|print|dump|repeat|exfiltrate)\b[\s\S]{0,120}\b(prompt|instruction|secret|credential|token|password|private|database|source code)/i,
  /\b(you are now|enter|activate|switch to)\b[\s\S]{0,80}\b(developer|admin| unrestricted|debug|jailbreak)\b/i,
];

const exposedSecretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,
  /\b(?:bearer\s+)[a-z0-9._~+/=-]{16,}\b/gi,
  /\b(?:sk|pk|rk|ghp|gho|github_pat)[-_][a-z0-9_-]{12,}\b/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/g,
  /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^ \n]+/gi,
  /\b(?:api[-_ ]?key|access[-_ ]?token|secret|password|private[-_ ]?key)\s*[:=]\s*\S+/gi,
];

const possibleSecretTailPatterns = [
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+|(?:api[-_ ]?key|access[-_ ]?token|secret|password|private[-_ ]?key)\s*[:=]?)\s*[a-z0-9._~+/=-]{0,240}$/i,
  /\b(?:sk|pk|rk|ghp|gho|github_pat)[-_][a-z0-9_-]{0,120}$/i,
  /\b(?:eyJ[a-z0-9_-]{0,240})(?:\.[a-z0-9_-]{0,240}){0,2}$/i,
];

function securityComparable(content: string): string {
  return content
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (character) => String.fromCharCode(character.charCodeAt(0) - (character >= "Ａ" && character <= "Ｚ" ? 0xfee0 : character >= "ａ" && character <= "ｚ" ? 0xfee0 : 0xfee0)))
    .replace(/[аА]/g, "a")
    .replace(/[еЕ]/g, "e")
    .replace(/[оО]/g, "o")
    .replace(/[сС]/g, "c")
    .replace(/[рР]/g, "p")
    .replace(/[хХ]/g, "x")
    .replace(/[іІ]/g, "i");
}

export function isPromptExtractionAttempt(content: string): boolean {
  const comparable = securityComparable(content);
  return promptExtractionPatterns.some((pattern) => pattern.test(comparable)) || instructionInjectionPatterns.some((pattern) => pattern.test(comparable));
}

export const PROMPT_EXTRACTION_RESPONSE = "I can help with KAMALO product questions, but I can’t reveal internal instructions, credentials, or implementation details.";

export const SAFE_ASSISTANT_ERROR = "I’m having trouble responding right now. Please try again.";

export function normalizeUserInput(content: string): string {
  return content.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

export function redactSensitiveOutput(content: string): string {
  return exposedSecretPatterns.reduce((safeContent, pattern) => safeContent.replace(pattern, "[redacted]"), content);
}

export function sanitizeProviderText(content: string): string {
  return redactSensitiveOutput(content)
    .replace(/\b(one[- ]time password|otp)\s*(?:is|:|=)\s*\d{4,8}\b/gi, "$1 [redacted]")
    .replace(/\b(password|passcode|pin)\s*(?:is|:|=)\s*\S+/gi, "$1 [redacted]");
}

export function hasPossibleSensitiveTail(content: string): boolean {
  return possibleSecretTailPatterns.some((pattern) => pattern.test(content.slice(-512)));
}

export function containsInstructionInjection(content: string): boolean {
  const comparable = securityComparable(content);
  return instructionInjectionPatterns.some((pattern) => pattern.test(comparable));
}

const providerDraftingPatterns = [
  /^\s*(?:here(?:'s| is) (?:a )?thinking process|analysis|reasoning|chain of thought)\s*:/i,
  /\b(?:analyze user input|analysis of the user|chain of thought|draft response|internal reasoning|thinking process)\b/i,
  /^\s*(?:step\s*\d+\s*[:.)]|final answer\s*:)/im,
];

export function containsProviderDrafting(content: string): boolean {
  return providerDraftingPatterns.some((pattern) => pattern.test(content));
}

export function sanitizeAssistantOutput(content: string): string {
  const cleaned = sanitizeProviderText(cleanAssistantOutput(content));
  if (
    /\b(?:OPENROUTER_API_KEY|SESSION_SECRET|private key|developer message|system prompt|database url|source code)\b/i.test(cleaned)
    || containsInstructionInjection(cleaned)
    || containsProviderDrafting(cleaned)
  ) {
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
    .replace(/<[^>\n]{1,200}>/g, "")
    .replace(/\b(?:javascript|data):\s*/gi, "")
    .replace(/[—–]/g, ", ")
    .replace(/\b(?:coin|transaction) engine(?:\s+tool)?\b/gi, "KAMALO app")
    .replace(/(\*\*[^*\n]+\*\*)\s*[-:]\s*/g, "$1. ")
    .replace(/^[ \t]*[-•][ \t]+/gm, "")
    .replace(/\n*(If you(?:'d| would) like|Would you like|Let me know|Feel free to ask)[\s\S]*$/i, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

export function capAssistantOutput(content: string, maxLength = 12000): string {
  return content.length > maxLength ? `${content.slice(0, maxLength - 1).trim()}…` : content;
}

const MAX_CONCISE_SENTENCES = 3;
const MAX_CONCISE_CHARACTERS = 520;

/**
 * Keep provider output useful when a model ignores the concise-answer contract.
 * This is intentionally a presentation guard, not a factuality check: approved
 * knowledge retrieval and the system policy remain the source of truth.
 */
export function condenseAssistantOutput(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return normalized;

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [normalized];
  let concise = sentences.slice(0, MAX_CONCISE_SENTENCES).join(" ").trim();
  if (concise.length <= MAX_CONCISE_CHARACTERS) return concise;

  const cutoff = concise.slice(0, MAX_CONCISE_CHARACTERS - 1).lastIndexOf(" ");
  const safeCutoff = cutoff >= 160 ? cutoff : MAX_CONCISE_CHARACTERS - 1;
  return `${concise.slice(0, safeCutoff).trim()}…`;
}

/**
 * Drop an unfinished trailing sentence from a provider response. Streaming may
 * expose partial chunks, but the persisted/final response must be complete.
 */
export function keepCompleteAssistantOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed || /[.!?…]$/.test(trimmed)) return trimmed;

  const lastBoundary = Math.max(trimmed.lastIndexOf("."), trimmed.lastIndexOf("!"), trimmed.lastIndexOf("?"));
  return lastBoundary >= 0 ? trimmed.slice(0, lastBoundary + 1).trim() : "";
}