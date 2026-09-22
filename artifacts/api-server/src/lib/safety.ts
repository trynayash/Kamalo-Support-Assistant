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

export function sanitizeKnowledgeForProvider(content: string): string {
  let dropNextAllCapsLine = false;
  const lines = content.split(/\r?\n/).flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) return [];
    if (dropNextAllCapsLine) {
      dropNextAllCapsLine = false;
      if (/^[A-Z][A-Z\s:!-]{2,}$/.test(line)) return [];
    }
    if (/\bcta\b/i.test(line)) {
      dropNextAllCapsLine = true;
      return [];
    }
    if (
      /stage\s*1\s+guardrail|founder-provided|approved product guidance,\s*not evidence|until a verified server-side tool returns|\b(?:the )?ai\s+(?:must|should|can|cannot|retrieves?|checks?|needs?)\b|\b(?:view my|show you exactly where you stand)\b|must not invent|never reveal|never hard-code/i.test(line)
    ) {
      return [];
    }
    const cleaned = line
      .replace(/["']?I'm here to help\.\s*Let me check the transaction status so we can see exactly where the payment stopped\.["']?/i, "")
      .replace(/["']?I've checked it\.\s*/i, "")
      .trim();
    return cleaned ? [cleaned] : [];
  });
  return lines.join(" ").replace(/\s+/g, " ").trim();
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
  /\b(?:stage\s*1\s+guardrail|until a verified server-side tool returns|approved product guidance,\s*not evidence)\b/i,
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
  if (!trimmed || /[.!?।…]$/.test(trimmed)) return trimmed;

  const lastBoundary = Math.max(trimmed.lastIndexOf("."), trimmed.lastIndexOf("!"), trimmed.lastIndexOf("?"), trimmed.lastIndexOf("।"));
  return lastBoundary >= 0 ? trimmed.slice(0, lastBoundary + 1).trim() : "";
}

const groundingStopWords = new Set([
  "a", "about", "after", "again", "all", "also", "an", "and", "are", "as", "at",
  "be", "because", "but", "by", "can", "could", "do", "does", "for", "from",
  "has", "have", "how", "if", "in", "is", "it", "may", "me", "more", "my",
  "not", "of", "on", "or", "our", "please", "so", "that", "the", "their",
  "then", "there", "these", "this", "to", "us", "was", "we", "what", "when",
  "where", "which", "who", "why", "with", "would", "you", "your",
]);

function groundingTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 1 && !groundingStopWords.has(token))
    || [];
}

function extractedNumbers(value: string): string[] {
  return [...value.matchAll(/\b\d+(?:[.,]\d+)*\b/g)]
    .map((match) => match[0].replaceAll(",", ""));
}

const unsafeLiveClaimPatterns = [
  /\b(?:i|we)\s+(?:checked|looked up|verified|can see|have access to|found in)\b/i,
  /\b(?:your|the customer'?s)\s+(?:current|live|actual)\s+(?:balance|coins?|status|eligibility|progress|transaction|refund|notification|mandate)\b/i,
  /\b(?:you have|you received|you were charged|your payment (?:was|is)|your refund (?:was|is))\s+\d/i,
  /\b(?:has been|was|is)\s+(?:credited|refunded|processed|completed|sent|created|updated)\b/i,
];

const safeUnmatchedSentencePatterns = [
  /^(?:i do not|i don't|i can(?:not|'t)) have confirmed information\b/i,
  /^i don't have access to your live kamalo account information\b/i,
  /^(?:please|you can|try|contact|reach|ask|allow|check|confirm|make sure|use|request)\b/i,
  /\b(?:live|personal|account-specific|verified)\s+(?:information|check|support)\b/i,
  /^\[redacted\]$/i,
];

function sentenceList(value: string): string[] {
  return value.match(/[^.!?।]+(?:[.!?।]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
}

/**
 * Presentation sanitizing is not factuality validation. This second gate
 * rejects unsupported numeric claims, live-account claims, and English
 * sentences with no meaningful overlap with the approved evidence.
 */
export function isGroundedAssistantOutput(
  content: string,
  approvedSources: string[],
  language: "en" | "hi" | "mr" = "en",
): boolean {
  const normalized = content.trim();
  if (!normalized || containsProviderDrafting(normalized) || containsInstructionInjection(normalized)) return false;
  if (unsafeLiveClaimPatterns.some((pattern) => pattern.test(normalized))) return false;

  const sourceText = approvedSources.join("\n");
  const sourceNumbers = new Set(extractedNumbers(sourceText));
  if (extractedNumbers(normalized).some((number) => !sourceNumbers.has(number))) return false;

  // Hindi and Marathi are translated by the provider, so English token
  // overlap is not a reliable validator. Numeric and live-data gates still
  // apply to those languages.
  if (language !== "en") return true;

  const sourceTokens = groundingTokens(sourceText);
  if (sourceTokens.length === 0) return false;
  const sentences = sentenceList(normalized);
  const containsRedactedValue = /\[redacted\]/i.test(normalized);
  return sentences.length > 0 && sentences.every((sentence) => {
    if (safeUnmatchedSentencePatterns.some((pattern) => pattern.test(sentence))) return true;
    const tokens = groundingTokens(sentence);
    const overlap = tokens.filter((token) => sourceTokens.some((sourceToken) =>
      sourceToken === token || sourceToken.startsWith(token) || token.startsWith(sourceToken),
    )).length;
    if (containsRedactedValue && overlap >= 1) return true;
    return overlap >= Math.min(2, tokens.length);
  });
}