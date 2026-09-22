import { retrievalQueriesForQuestion } from "./intent-grounding";
import { isBrandOverviewQuestion, prepareCustomerQuestion } from "./support-query";

type TopicRetrievalRule = {
  /** All patterns must match (AND). Use broad single-pattern rules when possible. */
  match: RegExp;
  retrievalQuery: string;
};

/**
 * Maps informal / twisted customer wording to stable knowledge-base search queries.
 * Ordered most-specific first so narrower topics win over broad ones.
 */
const topicRetrievalRules: TopicRetrievalRule[] = [
  { match: /\b(?:otp|one[\s-]?time password)\b/i, retrievalQuery: "OTP support" },
  { match: /\botp\b.*\b(?:not received|nahi|aa nahi|not coming)\b/i, retrievalQuery: "OTP support" },
  { match: /\b(?:payment|transaction|paisa|paise).*(?:fail|failed|nahi hua|nahi ho|deducted|kat gaya)\b/i, retrievalQuery: "My payment failed" },
  { match: /\b(?:coin|coins).*(?:kaise|milega|earn|kaha|kahan)\b/i, retrievalQuery: "How can I earn Coins" },
  { match: /\b(?:offer|offers)\s+kya\b/i, retrievalQuery: "What are KAMALO offers" },
  { match: /\b(?:gift\s*cards?|giftcard)\s+kya\b/i, retrievalQuery: "Wallet prepaid card" },
  { match: /\b(?:paisa|paise|money)\s+(?:wapas|back)\b/i, retrievalQuery: "What is a refund" },
  { match: /\b(?:sign[\s-]?up|signup|register|registration|create account|cant register|cannot register)\b/i, retrievalQuery: "I can't register" },
  { match: /\b(?:auto[\s-]?kamalo|autopay|auto pay|mandate)\b/i, retrievalQuery: "What is Auto KAMALO" },
  { match: /\b(?:fincado|fin cadoo|fin cado)\b/i, retrievalQuery: "What is FINCADO" },
  { match: /\b(?:offers?|deals?|coupons?)\b/i, retrievalQuery: "What are KAMALO offers" },
  { match: /\b(?:reward|rewards)\b/i, retrievalQuery: "What are KAMALO rewards" },
  { match: /\b(?:booster|boosters|promo offer|promotion coins)\b/i, retrievalQuery: "What is Booster" },
  { match: /\b(?:referral|referrals|refer friend|invite friend|referral link)\b/i, retrievalQuery: "How do referrals work" },
  { match: /\b(?:commission|commision|referral income)\b/i, retrievalQuery: "Commission structure and processing" },
  { match: /\b(?:silver|chandi)\b.*\b(?:coin|shipment|delivery|dispatch|milestone|progress|qualif)\b/i, retrievalQuery: "Where is my Silver Coin" },
  { match: /\b(?:gold|sone)\b.*\b(?:coin|shipment|delivery|dispatch|milestone|progress|qualif|target)\b/i, retrievalQuery: "Where is my Gold Coin" },
  { match: /\b(?:silver|chandi)\b/i, retrievalQuery: "How do I earn Silver" },
  { match: /\b(?:gold|sone)\b/i, retrievalQuery: "How do I reach Gold" },
  { match: /\b(?:expir|expire|expiry|fifo|validity)\b.*\b(?:coin|coins|reward)\b/i, retrievalQuery: "Coin conversion value and expiry" },
  { match: /\b(?:redeem|redemption|use coins|spend coins|convert coins)\b/i, retrievalQuery: "What is Coin redemption" },
  { match: /\b(?:earn|get|collect|make|receive)\b.*\b(?:coin|coins|reward|rewards|points)\b/i, retrievalQuery: "How can I earn Coins" },
  { match: /\b(?:coin|coins|reward|rewards|points)\b.*\b(?:earn|get|work|mean|use|balance)\b/i, retrievalQuery: "What are KAMALO Coins" },
  { match: /\b(?:coin|coins|reward|rewards|points)\b/i, retrievalQuery: "What are KAMALO Coins" },
  { match: /\b(?:refund|money back|reversal|reversed|chargeback)\b/i, retrievalQuery: "What is a refund" },
  { match: /\b(?:payment|paymant|transaction|txn|transfer)\b.*\b(?:fail|failed|declin|reject|unsuccessful|not work|didnt work)\b/i, retrievalQuery: "My payment failed" },
  { match: /\b(?:payment|paymant|transaction|txn)\b.*\b(?:pending|processing|waiting|stuck)\b/i, retrievalQuery: "What does pending mean" },
  { match: /\b(?:payment|paymant|transaction|txn|transfer)\b/i, retrievalQuery: "What happens when a payment fails" },
  { match: /\b(?:notification|notifications|alert|alerts|message|not got|didnt receive|not receiving)\b/i, retrievalQuery: "I didn't receive my notification" },
  { match: /\b(?:merchant|seller|shop|settlement|store offer)\b/i, retrievalQuery: "How do merchant offers work" },
  { match: /\b(?:wallet|prepaid|gift\s*cards?|reward\s*cards?)\b/i, retrievalQuery: "Wallet prepaid card" },
  { match: /\b(?:guru|kamalo guru)\b/i, retrievalQuery: "What is KAMALO Guru" },
  { match: /\b(?:delivery|shipment|dispatch|shipping|parcel|courier)\b/i, retrievalQuery: "Where is my Silver Coin" },
  { match: /\b(?:login|log in|sign in|locked|lock out|password)\b/i, retrievalQuery: "I can't log in" },
];

export function buildTopicRetrievalQueries(content: string): string[] {
  const normalized = prepareCustomerQuestion(content);
  if (!normalized) return [];

  if (isBrandOverviewQuestion(normalized)) {
    return ["What is KAMALO"];
  }

  const queries: string[] = [...retrievalQueriesForQuestion(normalized)];
  for (const rule of topicRetrievalRules) {
    if (rule.match.test(normalized)) {
      queries.push(rule.retrievalQuery);
    }
  }
  return [...new Set(queries)];
}

export const SIMPLE_ENGLISH_INSTRUCTION = `Write in very simple English that anyone with basic school English can follow easily.
Use short sentences, usually 10 to 15 words.
Use normal everyday words. Avoid formal or technical words unless they are official KAMALO product names such as KAMALO, Coins, Silver, Gold, FINCADO, Auto KAMALO, Booster, or Guru.
If approved knowledge uses a technical word, keep that word and explain it in plain language in the same sentence.
Give only the facts needed to answer the question. No filler, no lecture, no repeat of the question.`;
