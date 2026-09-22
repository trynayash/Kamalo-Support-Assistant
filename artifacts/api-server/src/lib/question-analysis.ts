import type { LLMMessage } from "./llm";
import { getRoutingModel, llmProvider } from "./llm";
import { canonicalizeForRetrieval, isBrandOverviewQuestion, isPureGreeting, normalizeSupportQuestion, type ConversationHistoryMessage } from "./support-query";
import { sanitizeProviderText } from "./safety";

export type QuestionAnalysis = {
  retrievalQuery: string;
  intentSummary: string;
  keyTopics: string[];
  questionType: "general" | "account_specific" | "greeting" | "brand_overview" | "out_of_scope" | "follow_up";
  needsLiveAccountData: boolean;
  source: "openrouter" | "heuristic";
};

const ANALYSIS_SYSTEM_PROMPT = `You analyze KAMALO customer support questions before knowledge retrieval.

Return ONLY valid JSON with this shape:
{
  "retrievalQuery": "short knowledge-base search query capturing the customer's real question",
  "intentSummary": "one sentence describing what the customer wants to know",
  "keyTopics": ["topic1", "topic2"],
  "questionType": "general|account_specific|greeting|brand_overview|out_of_scope|follow_up",
  "needsLiveAccountData": false
}

Rules:
- Do not answer the question.
- Expand vague follow-ups using recent conversation context when provided.
- Strip greeting prefixes and focus on the support intent.
- Mark account_specific only when the customer asks for their own live balance, status, eligibility outcome, or personal record.
- General education questions about Coins, Silver, Gold, FINCADO, payments, or referrals are "general", not account_specific.
- Brand overview questions like "what is KAMALO", "tell me about kamalo", or "what kamalo do" are "brand_overview".
- Customers may use simple, informal, broken, angry, Hinglish, or local English (5th-grade level, typos, filler words, Roman Hindi mixed with English). Strip emotional filler, interpret intent generously, and rewrite retrievalQuery into clear approved-knowledge wording.
- retrievalQuery should be a short search phrase like an article title, not the customer's exact messy wording.
- Unrelated non-KAMALO questions are "out_of_scope".`;

function heuristicAnalysis(content: string, history: ConversationHistoryMessage[]): QuestionAnalysis {
  const normalized = normalizeSupportQuestion(content);
  const recentUserContext = history
    .filter((message) => message.role === "user")
    .slice(-2)
    .map((message) => message.content)
    .join(" ");

  let questionType: QuestionAnalysis["questionType"] = "general";
  if (isPureGreeting(content)) questionType = "greeting";
  else if (isBrandOverviewQuestion(normalized)) questionType = "brand_overview";
  else if (/\b(?:my balance|my account|my coins|current balance|transaction reference|order status)\b/i.test(normalized)) {
    questionType = "account_specific";
  } else if (/\b(that|it|this|same|previous)\b/i.test(normalized) && history.length) {
    questionType = "follow_up";
  } else if (
    /\b[\w-]+\.kamalo\.(?:app|com|in|net|io|org)\b/i.test(normalized)
    && !/\b(?:coin|coins|silver|gold|fincado|payment|transaction|refund|referral|wallet|otp|merchant|offer|booster)\b/i.test(normalized)
  ) {
    // Unknown subdomain / feature URL — treat as KAMALO-adjacent unknown (escalate), not email-only out of scope.
    questionType = "general";
  } else if (!/\bkamalo\b/i.test(`${normalized}\n${recentUserContext}`) &&
    !/\b(?:coin|coins|silver|gold|fincado|payment|transaction|refund|referral|commission|wallet|otp|merchant)\b/i.test(normalized)) {
    questionType = "out_of_scope";
  }

  const retrievalQuery = questionType === "brand_overview"
    ? "What is KAMALO"
    : questionType === "follow_up" && recentUserContext
      ? `${canonicalizeForRetrieval(content)}\nContext: ${recentUserContext}`.slice(0, 900)
      : canonicalizeForRetrieval(content) || normalized || content.trim();

  return {
    retrievalQuery,
    intentSummary: normalized || content.trim(),
    keyTopics: normalized.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 6),
    questionType,
    needsLiveAccountData: questionType === "account_specific",
    source: "heuristic",
  };
}

function parseAnalysisResponse(raw: string, fallback: QuestionAnalysis): QuestionAnalysis {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return fallback;

  try {
    const parsed = JSON.parse(match[0]) as Partial<QuestionAnalysis>;
    const questionType = parsed.questionType;
    const allowedTypes = new Set<QuestionAnalysis["questionType"]>([
      "general",
      "account_specific",
      "greeting",
      "brand_overview",
      "out_of_scope",
      "follow_up",
    ]);

    return {
      retrievalQuery: typeof parsed.retrievalQuery === "string" && parsed.retrievalQuery.trim()
        ? parsed.retrievalQuery.trim().slice(0, 900)
        : fallback.retrievalQuery,
      intentSummary: typeof parsed.intentSummary === "string" && parsed.intentSummary.trim()
        ? parsed.intentSummary.trim().slice(0, 400)
        : fallback.intentSummary,
      keyTopics: Array.isArray(parsed.keyTopics)
        ? parsed.keyTopics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0).slice(0, 8)
        : fallback.keyTopics,
      questionType: typeof questionType === "string" && allowedTypes.has(questionType as QuestionAnalysis["questionType"])
        ? questionType as QuestionAnalysis["questionType"]
        : fallback.questionType,
      needsLiveAccountData: (typeof questionType === "string" && questionType === "account_specific")
        ? Boolean(parsed.needsLiveAccountData)
        : false,
      source: "openrouter",
    };
  } catch {
    return fallback;
  }
}

export async function analyzeCustomerQuestion(
  content: string,
  history: ConversationHistoryMessage[],
  requestId?: string,
  signal?: AbortSignal,
): Promise<QuestionAnalysis> {
  const fallback = heuristicAnalysis(content, history);
  if (!process.env.OPENROUTER_API_KEY?.trim()) return fallback;

  const messages: LLMMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    ...(history.length
      ? [{
          role: "system" as const,
          content: `Recent conversation:\n${history.slice(-4).map((message) => `${message.role}: ${sanitizeProviderText(message.content.slice(0, 500))}`).join("\n")}`,
        }]
      : []),
    { role: "user", content: sanitizeProviderText(content) },
  ];

  try {
    const raw = await llmProvider.generate({
      messages,
      model: getRoutingModel(),
      temperature: 0,
      maxTokens: 220,
      requestId,
      signal,
    });
    return parseAnalysisResponse(raw, fallback);
  } catch {
    return fallback;
  }
}
