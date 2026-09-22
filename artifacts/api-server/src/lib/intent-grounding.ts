import type { RetrievedArticle } from "./knowledge";
import { condenseAssistantOutput, sanitizeKnowledgeForProvider } from "./safety";
import { normalizeSupportQuestion, prepareCustomerQuestion } from "./support-query";

export type QuestionIntent =
  | "overview"
  | "earn"
  | "expire"
  | "redeem"
  | "qualify"
  | "meaning"
  | "payment_fail"
  | "payment_pending"
  | "refund"
  | "balance"
  | "delivery"
  | "register"
  | "login"
  | "otp"
  | "referral"
  | "commission"
  | "booster"
  | "offers"
  | "gift_card"
  | "fincado"
  | "auto_kamalo"
  | "notification"
  | "merchant"
  | "guru";

/** Stable KB search queries for each detected intent. */
export const intentRetrievalQueries: Partial<Record<QuestionIntent, string>> = {
  overview: "What is KAMALO",
  earn: "How can I earn Coins",
  expire: "Coin conversion value and expiry",
  redeem: "What is Coin redemption",
  qualify: "How do I earn Silver",
  meaning: "What are KAMALO Coins",
  payment_fail: "My payment failed",
  payment_pending: "What does pending mean",
  refund: "What is a refund",
  delivery: "Where is my Silver Coin",
  register: "I can't register",
  login: "I can't log in",
  otp: "OTP support",
  referral: "How do referrals work",
  commission: "Commission structure and processing",
  booster: "What is Booster",
  offers: "Where can I use KAMALO",
  gift_card: "Wallet prepaid card",
  fincado: "What is FINCADO",
  auto_kamalo: "What is Auto KAMALO",
  notification: "I didn't receive my notification",
  merchant: "How do merchant offers work",
  guru: "What is KAMALO Guru",
};

const internalKnowledgePattern = /stage 1 guardrail|founder-provided|the ai should|never hard-code|cta:|view my|let me check|then show|\byour\b|\byou currently\b|\bscheduled to expire\b|\bexpiry date\b|\bbatch\b|\bX\b|reconcil(?:e|iation)|checking the transaction|merchant status|never ask customer to pay again|i['’]?ve started checking|i understand\.\s*your payment|must query live offer inventory/i;

const factStopWords = new Set(["a", "about", "and", "are", "can", "does", "for", "how", "i", "is", "it", "my", "of", "that", "the", "this", "what", "where", "why", "earn", "get"]);

const factAliases: Record<string, string[]> = {
  coin: ["coin", "coins", "reward", "rewards"],
  coins: ["coin", "coins", "reward", "rewards"],
  silver: ["silver", "milestone"],
  gold: ["gold", "milestone"],
  referral: ["referral", "referrals", "invite"],
  payment: ["payment", "transaction", "txn"],
  transaction: ["payment", "transaction", "txn"],
};

function factTerms(content: string): string[] {
  const terms = new Set<string>();
  for (const token of content.toLowerCase().split(/[^a-z0-9]+/).filter((value) => value.length > 2 && !factStopWords.has(value))) {
    terms.add(token);
    for (const alias of factAliases[token] || []) terms.add(alias);
  }
  return [...terms];
}

export function detectQuestionIntents(content: string): QuestionIntent[] {
  const lower = prepareCustomerQuestion(content).toLowerCase();
  const intents: QuestionIntent[] = [];

  if (/\b(?:tell me more about|what kamalo|what is kamalo|what does kamalo|about kamalo)\b/i.test(lower)
    && !/\b(?:coin|coins|silver|gold|payment|transaction|referral|booster|fincado|auto)\b/i.test(lower)) {
    intents.push("overview");
  }
  if (/\b(?:earn|earning|get|collect|make|receive|how can i|how do i|how to|kaise|milega|milegi)\b/i.test(lower)
    && /\b(?:coin|coins|reward|rewards|points)\b/i.test(lower)
    && !/\b(?:expir|expire|expiry|fifo|khatam)\b/i.test(lower)) {
    intents.push("earn");
  }
  if (/\b(?:earn|reach|get|qualify|qualification|how far|need for|milestone|progress)\b/i.test(lower)
    && /\b(?:silver|chandi)\b/i.test(lower)
    && !/\b(?:delivery|shipment|dispatch|where)\b/i.test(lower)) {
    intents.push("qualify");
  }
  if (/\b(?:earn|reach|get|qualify|qualification|how far|need for|milestone|progress|target)\b/i.test(lower)
    && /\b(?:gold|sone)\b/i.test(lower)
    && !/\b(?:delivery|shipment|dispatch|where)\b/i.test(lower)) {
    intents.push("qualify");
  }
  if (/\b(?:expir|expire|expiry|fifo|validity|when.*expire)\b/i.test(lower)) intents.push("expire");
  if (/\b(?:redeem|redemption|use coins|spend coins|convert coins)\b/i.test(lower)) intents.push("redeem");
  if (/\b(?:what\s+is|what\s+are|tell me|explain|mean|work)\b/i.test(lower)
    && !/\b(?:earn|get|expir|redeem|fail|refund|offer|offers|deal|deals|gift|prepaid|booster|wallet|payment|transaction|referral|silver|gold|fincado|otp|notification)\b/i.test(lower)) {
    intents.push("meaning");
  }
  if (/\b(?:payment|transaction|paymant|txn|paisa|paise).*\b(?:fail|failed|declin|reject|not work|didnt work|unsuccessful|nahi hua|nahi ho|deducted|kat gaya)\b/i.test(lower)
    || /\b(?:fail|failed).*\b(?:payment|transaction|paymant|paisa|paise)\b/i.test(lower)) {
    intents.push("payment_fail");
  }
  if (/\b(?:payment|transaction|txn).*\b(?:pending|processing|waiting|stuck)\b/i.test(lower)) intents.push("payment_pending");
  if (/\b(?:refund|money back|reversal|reversed|chargeback|paisa wapas|paise wapas|money wapas)\b/i.test(lower)) intents.push("refund");
  if (/\b(?:balance|how many coins do i have|what(?:'s| is) my coin balance)\b/i.test(lower)) intents.push("balance");
  if (/\b(?:delivery|shipment|dispatch|shipping|where is my|where my|parcel|courier)\b/i.test(lower)
    && /\b(?:silver|gold|coin)\b/i.test(lower)) {
    intents.push("delivery");
  }
  if (/\b(?:register|signup|sign up|cant register|cannot register|create account)\b/i.test(lower)) intents.push("register");
  if (/\b(?:login|log in|sign in|locked out|lock out|password|cant login)\b/i.test(lower)) intents.push("login");
  if (/\b(?:otp|one time password|one-time password|verification code)\b/i.test(lower)
    || /\botp\b.*\b(?:not received|nahi|aa nahi|not coming)\b/i.test(lower)) {
    intents.push("otp");
  }
  if (/\b(?:referral|referrals|refer friend|invite friend|referral link|friend joined)\b/i.test(lower)) intents.push("referral");
  if (/\b(?:commission|commision|referral income|referral payout)\b/i.test(lower)) intents.push("commission");
  if (/\b(?:booster|boosters|promo offer|promotion coins)\b/i.test(lower)) intents.push("booster");
  if (/\b(?:offers?|deals?|coupons?)\b/i.test(lower) && !/\bbooster\b/i.test(lower)) intents.push("offers");
  if (/\b(?:gift\s*cards?|prepaid\s*cards?|reward\s*cards?|prepaid|ppi\s*wallet)\b/i.test(lower)) intents.push("gift_card");
  if (/\b(?:fincado|fin cadoo|daily drive|weekly streak)\b/i.test(lower)) intents.push("fincado");
  if (/\b(?:auto kamalo|autopay|auto pay|mandate)\b/i.test(lower)) intents.push("auto_kamalo");
  if (/\b(?:notification|notifications|alert|alerts|not got|didnt receive|not receiving)\b/i.test(lower)) intents.push("notification");
  if (/\b(?:merchant|seller|shop|settlement|store offer)\b/i.test(lower)) intents.push("merchant");
  if (/\b(?:guru|kamalo guru)\b/i.test(lower)) intents.push("guru");

  return intents.length ? [...new Set(intents)] : ["meaning"];
}

export function retrievalQueriesForQuestion(content: string): string[] {
  return [...new Set(
    detectQuestionIntents(content)
      .map((intent) => intentRetrievalQueries[intent])
      .filter((query): query is string => Boolean(query)),
  )];
}

function sentenceIntentScore(sentence: string, intents: QuestionIntent[]): number {
  const lower = sentence.toLowerCase();
  let score = 0;

  for (const intent of intents) {
    switch (intent) {
      case "overview":
        if (/\b(?:ecosystem|journeys|transactions|rewards|referrals|merchant offers|supporting services)\b/i.test(lower)) score += 24;
        if (/\b(?:expir|fifo|earn coins from)\b/i.test(lower)) score -= 16;
        break;
      case "earn":
        if (/\b(?:earn|earning|eligible actions|eligible transactions|referrals|boosters|action coins|transaction coins|referral coins|can earn|ways to earn)\b/i.test(lower)) score += 28;
        if (/\b(?:expir|expire|expiration|fifo|validity)\b/i.test(lower)) score -= 35;
        break;
      case "expire":
        if (/\b(?:expir|expire|expiration|fifo|validity|rollover)\b/i.test(lower)) score += 28;
        if (/\b(?:earn|earning|eligible actions)\b/i.test(lower) && !/\bexpir/i.test(lower)) score -= 14;
        break;
      case "redeem":
        if (/\b(?:redeem|redemption|convert|use coins|spend coins)\b/i.test(lower)) score += 28;
        if (/\b(?:expir|fifo)\b/i.test(lower)) score -= 10;
        break;
      case "qualify":
        if (/\b(?:qualify|qualification|milestone|progress|reach|silver|gold|levels|eligibility)\b/i.test(lower)) score += 24;
        break;
      case "meaning":
        if (/\b(?:are|is|reward units|work|used inside|part of|ecosystem)\b/i.test(lower)) score += 14;
        if (/\b(?:expir|expire|fifo)\b/i.test(lower) && !intents.includes("expire")) score -= 20;
        break;
      case "payment_fail":
        if (/\b(?:fail|failed|declin|reject|unsuccessful|try again|deducted)\b/i.test(lower)) score += 28;
        break;
      case "payment_pending":
        if (/\b(?:pending|processing|waiting)\b/i.test(lower)) score += 28;
        break;
      case "refund":
        if (/\b(?:refund|reversal|reversed|money back)\b/i.test(lower)) score += 28;
        break;
      case "balance":
        if (/\b(?:balance|how many|statement)\b/i.test(lower)) score += 22;
        break;
      case "delivery":
        if (/\b(?:delivery|dispatch|shipment|shipping|dispatched|courier)\b/i.test(lower)) score += 26;
        break;
      case "register":
        if (/\b(?:register|registration|sign up|signup|create account)\b/i.test(lower)) score += 26;
        break;
      case "login":
        if (/\b(?:login|log in|sign in|locked|password)\b/i.test(lower)) score += 26;
        break;
      case "otp":
        if (/\b(?:otp|one time password|verification code|sms code)\b/i.test(lower)) score += 28;
        break;
      case "referral":
        if (/\b(?:referral|referrals|invite|refer friend|referral link|referral level)\b/i.test(lower)) score += 26;
        break;
      case "commission":
        if (/\b(?:commission|referral income|community commission|payout)\b/i.test(lower)) score += 26;
        break;
      case "booster":
        if (/\b(?:booster|boosters|promotion|promo offer|offer terms)\b/i.test(lower)) score += 26;
        break;
      case "offers":
        if (/\b(?:shop|discover|eligible|online and offline offers|available offers|earning opportunit|merchant offers)\b/i.test(lower)) score += 32;
        if (/\bbooster offer\b/i.test(lower)) score -= 28;
        break;
      case "gift_card":
        if (/\b(?:prepaid|gift card|wallet|ppi|payment option|customer-facing capabilities)\b/i.test(lower)) score += 32;
        if (/\b(?:transaction|reconcil|payment succeeded|merchant status|refund)\b/i.test(lower)) score -= 35;
        break;
      case "fincado":
        if (/\b(?:fincado|daily drive|weekly streak|goal|recommendation)\b/i.test(lower)) score += 26;
        break;
      case "auto_kamalo":
        if (/\b(?:auto kamalo|mandate|autopay|automatic payment)\b/i.test(lower)) score += 26;
        break;
      case "notification":
        if (/\b(?:notification|alert|message|deep link|delivered)\b/i.test(lower)) score += 24;
        break;
      case "merchant":
        if (/\b(?:merchant|seller|settlement|onboard|offer|dashboard)\b/i.test(lower)) score += 24;
        break;
      case "guru":
        if (/\b(?:guru|growth|guidance)\b/i.test(lower)) score += 24;
        break;
      default:
        break;
    }
  }

  return score;
}

function titleIntentScore(title: string, intents: QuestionIntent[]): number {
  const lower = title.toLowerCase();
  let score = 0;
  for (const intent of intents) {
    const checks: Array<[QuestionIntent, RegExp, number, RegExp?, number?]> = [
      ["overview", /\bwhat is kamalo\b/i, 35],
      ["earn", /\b(?:earn|earning)\b/i, 35, /\b(?:expir|expiry|fifo)\b/i, -40],
      ["expire", /\b(?:expir|expiry|fifo)\b/i, 35],
      ["redeem", /\b(?:redeem|redemption)\b/i, 35],
      ["qualify", /\b(?:earn silver|reach gold|silver|gold|milestone)\b/i, 30],
      ["meaning", /\b(?:what are|what is)\b/i, 22],
      ["payment_fail", /\b(?:payment failed|failed)\b/i, 35],
      ["payment_pending", /\bpending\b/i, 35],
      ["refund", /\brefund\b/i, 35],
      ["delivery", /\b(?:where is my|delivery|dispatch|shipment)\b/i, 35],
      ["register", /\b(?:register|sign up)\b/i, 35],
      ["login", /\b(?:log in|login|locked)\b/i, 35],
      ["otp", /\botp\b/i, 35],
      ["referral", /\breferral\b/i, 35],
      ["commission", /\bcommission\b/i, 35],
      ["booster", /\bbooster\b/i, 35],
      ["offers", /\b(?:where can i use|shop|offers?)\b/i, 35, /\bbooster\b/i, -40],
      ["gift_card", /\b(?:prepaid|gift card|wallet)\b/i, 35],
      ["fincado", /\bfincado\b/i, 35],
      ["auto_kamalo", /\bauto kamalo\b/i, 35],
      ["notification", /\bnotification\b/i, 35],
      ["merchant", /\bmerchant\b/i, 35],
      ["guru", /\bguru\b/i, 35],
    ];
    for (const [target, pattern, boost, penaltyPattern, penalty] of checks) {
      if (intent !== target) continue;
      if (pattern.test(lower)) score += boost;
      if (penaltyPattern && penalty && penaltyPattern.test(lower)) score += penalty;
    }
  }
  return score;
}

const intentConflictRules: Array<{ intents: QuestionIntent[]; badPattern: RegExp; unlessPattern?: RegExp }> = [
  { intents: ["earn"], badPattern: /\b(?:expir|expire|fifo)\b/i, unlessPattern: /\b(?:earn|earning)\b/i },
  { intents: ["meaning"], badPattern: /\b(?:expir|expire|fifo)\b/i },
  { intents: ["payment_fail"], badPattern: /\b(?:expir|fifo|silver milestone)\b/i },
  { intents: ["referral"], badPattern: /\b(?:expir|fifo)\b/i },
  { intents: ["qualify"], badPattern: /\b(?:expir|fifo)\b/i, unlessPattern: /\b(?:silver|gold|milestone|qualify)\b/i },
  { intents: ["offers"], badPattern: /\bbooster offer\b/i },
  { intents: ["gift_card"], badPattern: /\b(?:reconcil|checking the transaction|merchant status|payment succeeded)\b/i },
];

function approvedSentences(content: string): string[] {
  return content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .filter((sentence) => !internalKnowledgePattern.test(sentence));
}

export function groundedFactMatchesQuestion(fact: string, question: string): boolean {
  const intents = detectQuestionIntents(question);
  if (sentenceIntentScore(fact, intents) < 0) return false;

  for (const rule of intentConflictRules) {
    if (!rule.intents.some((intent) => intents.includes(intent))) continue;
    if (!rule.badPattern.test(fact)) continue;
    if (rule.unlessPattern?.test(fact)) continue;
    return false;
  }

  return true;
}

export function selectGroundedAnswer(
  question: string,
  retrieved: RetrievedArticle[],
  preferredFact: string | null = null,
): string | null {
  const intents = detectQuestionIntents(question);
  const terms = factTerms(normalizeSupportQuestion(question));

  if (preferredFact && groundedFactMatchesQuestion(preferredFact, question)) {
    return condenseAssistantOutput(preferredFact);
  }

  const candidates = retrieved.flatMap((article) => {
    const safeContent = sanitizeKnowledgeForProvider(article.content);
    if (!safeContent) return [];
    const titleTerms = factTerms(article.title);
    return approvedSentences(safeContent).map((sentence) => {
      const sentenceTerms = factTerms(sentence);
      const overlap = terms.filter((term) => sentenceTerms.some((item) => item.includes(term) || term.includes(item))).length;
      const titleMatch = terms.filter((term) => titleTerms.some((item) => item.includes(term) || term.includes(item))).length;
      const intentScore = sentenceIntentScore(sentence, intents);
      const titleScore = titleIntentScore(article.title, intents);
      const numericBoost = intents.includes("expire") && /\b\d+\s*[- ]?(?:month|months|day|days)\b/i.test(sentence) ? 8 : 0;
      const score = (overlap * 3) + (titleMatch * 2) + intentScore + titleScore + numericBoost;
      return { sentence, score, articleTitle: article.title };
    });
  });

  const ranked = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);

  if (!ranked.length) return null;

  const best = ranked[0];
  const companion = ranked.find((candidate) =>
    candidate.articleTitle === best.articleTitle
    && candidate.sentence !== best.sentence
    && candidate.score >= best.score - 8
    && sentenceIntentScore(candidate.sentence, intents) >= 0,
  );

  const combined = companion ? `${best.sentence} ${companion.sentence}` : best.sentence;
  return condenseAssistantOutput(combined);
}
