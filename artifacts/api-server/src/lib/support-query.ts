export type ConversationHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const greetingPrefixPattern = /^(?:hi+|hello+|hey+|hii+|helo+|thanks|thank you|good morning|good afternoon|good evening|namaste|namaskar|नमस्ते|नमस्कार|yo|sup)[,!.?\s]+/i;

const conversationalFillerPattern = /\b(?:please|pls|plz|kindly|um+|uh+|like|just|actually|basically|ok(?:a+y+)?|so|well|listen|bro|sir|madam|ma'am|dear|kindly|thanks|thank you|abe|arre|yaar|bhai|matlab|dekh|sun|sunno|batao|bata|jaldi|abhi)\b/gi;

/** Angry / frustrated filler — stripped before intent detection; product words are kept. */
const emotionalFillerPattern = /\b(?:what the (?:hell|heck|fuck)|wtf|ffs|damn it|fix this now|answer me now|tell me now|this is (?:bullshit|bs|nonsense|ridiculous|worst|useless|terrible|bakwas|bakwaas|bekar|ghatiya)|worst app|useless app|fed up|sick of|bar bar|kitni baar|again and again|bloody|stupid app|cheating|dhokha|scam app|you guys suck|kya bakwas|kya bakwaas|bakwas hai|bekar hai|ghatiya app)\b/gi;

const brandTypoPattern = /\b(?:kamala|camalo|kammalo|kamalo+|kamaalo|kamaloo|kamaaloo)\b/gi;

/** Roman Hinglish / informal Indian English → clearer support wording for retrieval. */
const hinglishPhraseReplacements: Array<[RegExp, string]> = [
  [/\b(?:paisa|paise|payment|transaction)\s+(?:kat\s+gaya|kat\s+gya|cut\s+gaya|cut\s+gya)\b/gi, "payment deducted"],
  [/\b(?:paisa|paise|money)\s+(?:wapas|back)\b/gi, "refund money back"],
  [/\b(?:otp)\s+(?:nahi|nai)\s+(?:aaya|aaya|mila|aa\s+raha|aa\s+rahi)\b/gi, "OTP not received"],
  [/\b(?:otp)\s+(?:aa\s+nahi|not\s+coming)\b/gi, "OTP not received"],
  [/\b(?:payment|transaction|paisa|paise)\s+(?:fail\s+ho\s+gaya|fail\s+ho\s+gya|fail\s+hua|nahi\s+ho\s+raha|nahi\s+hua|nahi\s+ho\s+rahi)\b/gi, "payment failed"],
  [/\b(?:coin|coins)\s+(?:kaise|kese)\s+(?:milega|milegi|milta|milti|earn|karna|paunga|paungi)\b/gi, "how can I earn coins"],
  [/\b(?:coin|coins)\s+(?:kaha|kahan)\s+(?:gaye|gaya|hai|h)\b/gi, "where are my coins"],
  [/\b(?:coin|coins)\s+(?:kab|when)\s+(?:expir|expire|khatam|khatam\s+honge)\b/gi, "when do coins expire"],
  [/\b(?:offer|offers)\s+kya\s+(?:hai|h|he|hain)(?:\s+kamalo(?:\s+me)?)?\b/gi, "what are kamalo offers"],
  [/\b(?:gift\s*cards?|giftcard)\s+kya\s+(?:hai|h|he|hain)\b/gi, "what is gift card"],
  [/\b(?:silver|chandi)\s+(?:kaise|kese)\s+(?:milega|milegi|paunga|paungi|milta)\b/gi, "how do I earn silver"],
  [/\b(?:gold|sone)\s+(?:kaise|kese)\s+(?:milega|milegi|paunga|paungi|milta)\b/gi, "how do I reach gold"],
  [/\b(?:referral|refer)\s+(?:nahi|nai)\s+(?:mila|mili|aaya)\b/gi, "referral reward not received"],
  [/\b(?:notification|notif)\s+(?:nahi|nai)\s+(?:aaya|aayi|mila|mili)\b/gi, "notification not received"],
  [/\b(?:signup|sign\s+up|register)\s+(?:nahi|nai)\s+(?:ho\s+raha|ho\s+rahi|ho\s+raha\s+hai)\b/gi, "can't register"],
  [/\b(?:login|log\s+in)\s+(?:nahi|nai)\s+(?:ho\s+raha|ho\s+rahi)\b/gi, "can't log in"],
  [/\bkamalo\s+kya\s+(?:hai|h|he|hain)\b/gi, "what is kamalo"],
  [/\bkya\s+(?:hai|h|he|hain)\s+kamalo\b/gi, "what is kamalo"],
];

export const brandOverviewTopicPattern = /\b(?:coin|coins|silver|gold|fincado|booster|referral|referrals|commission|wallet|otp|merchant|merchants|payment|payments|transaction|transactions|refund|refunds|auto|mandate|guru|prepaid|gift\s+card|reward\s+card|notification|notifications|cashback|coupon|coupons|offer|offers|deal|deals|delivery|shipment|level|levels|milestone|milestones|expiry|expire|redeem|redemption|signup|sign\s*up|register|login|otp)\b/i;

const troubleshootingPattern = /\b(?:my|mine|not working|broken|error|issue|problem|stuck|failed|wrong|missing|didn't|didnt|cant|can't|cannot|won't|wont|help me fix|fix my|where is my|why didn't|why did not)\b/i;

export function normalizeSupportQuestion(content: string): string {
  let normalized = content
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(brandTypoPattern, "kamalo");

  while (greetingPrefixPattern.test(normalized)) {
    normalized = normalized.replace(greetingPrefixPattern, "").trim();
  }

  normalized = normalized
    .replace(emotionalFillerPattern, " ")
    .replace(conversationalFillerPattern, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

/** Expand Roman Hinglish / informal phrasing into clearer English for routing. */
export function expandHinglishWording(content: string): string {
  let text = content;
  for (const [pattern, replacement] of hinglishPhraseReplacements) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

/** Normalize angry, informal, or Hinglish customer wording for intent detection. */
export function prepareCustomerQuestion(content: string): string {
  return expandHinglishWording(normalizeSupportQuestion(content));
}

/** Short acknowledgments that should not trigger knowledge grounding. */
export function isAcknowledgment(content: string): boolean {
  const normalized = content
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?!.,]+$/g, "")
    .trim();
  return /^(?:ok(?:a+y+)?|k|kk|got it|alright|all right|cool|nice|great|thanks|thank you|thx|ty|sure|done|noted|understood|samajh gaya|theek hai|thik hai|acha|accha)[!. ]*$/i.test(normalized);
}

/** Capability / “what can you do” questions, including paraphrases with preamble. */
export function isCapabilityQuestion(content: string): boolean {
  const normalized = content
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?!.,]+$/g, "")
    .trim();
  return /\b(?:what (?:can|do) you do|what are (?:the )?(?:things|capabilities) you can do|what are your (?:capabilities|features)|how can you help(?: me)?|what (?:help|support) can you (?:give|provide))\b/i.test(normalized)
    && !brandOverviewTopicPattern.test(normalized);
}

export function isPureGreeting(content: string): boolean {
  if (isAcknowledgment(content) || isCapabilityQuestion(content)) return true;
  const normalized = content
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(?:bro|yaar|bhai|sir|madam|pls|please)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/[?!.,]+$/g, "")
    .trim();
  return /^(?:hi+|hello+|hey+|hii+|thanks|thank you|good morning|good afternoon|good evening|how are you|how r u|how are u|what can you do|what do you do|who are you|kaise ho|kaisa hai|kya haal(?: hai| he)?|kya hal(?: hai| he)?|kya chal raha|sab theek|namaste|namaskar|नमस्ते|नमस्कार|हाय|धन्यवाद|शुभ\s+(?:प्रभात|संध्या)|कैसे\s+हो|क्या\s+हाल)[?! .।]*$/i.test(normalized);
}

export function isBrandOverviewQuestion(content: string): boolean {
  const normalized = normalizeSupportQuestion(content).replace(/[?!.,]+$/g, "").trim();
  const lower = normalized.toLowerCase();

  if (brandOverviewTopicPattern.test(lower)) return false;
  if (troubleshootingPattern.test(lower)) return false;

  if (/^kamalo(?:\s+app)?$/i.test(lower)) return true;

  // Hostnames like sms.kamalo.app contain "kamalo" but are not brand-overview questions.
  const withoutHostnames = lower.replace(/\b[\w-]+\.kamalo\.(?:app|com|in|net|io|org)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (!/\bkamalo\b/i.test(withoutHostnames)) return false;

  if (/\b(?:want to know|wanna know|need to know|curious about|help me understand)\b/i.test(lower)) {
    return true;
  }

  if (/\b(?:can u|can you|could you|would you|will you|please tell|pls tell|tell me|explain|describe)\b/i.test(lower)
    && /\b(?:about|more|kamalo|app|work|mean|this)\b/i.test(lower)
    && !brandOverviewTopicPattern.test(lower)) {
    return true;
  }

  const overviewShape = /^(?:what|who|how|tell|explain|describe|give me|i want to know|wanna know|can you tell|can u tell|please explain|learn|more about|about)\b/i.test(lower)
    || /\bwhat\s+(?:is|are|does|do)\s+(?:this\s+)?(?:kamalo|the kamalo app)\b/i.test(lower)
    || /\bwhat\s+(?:do|does)\s+kamalo\s+do\b/i.test(lower)
    || /\bwhat\s+kamalo\s+(?:is|does|do)\b/i.test(lower)
    || /\bhow\s+(?:do|does)\s+kamalo\s+work\b/i.test(lower)
    || /\bwho\s+(?:are|is)\s+kamalo\b/i.test(lower)
    || /\b(?:this|that)\s+kamalo\s+(?:thing|app)\b/i.test(lower);

  return overviewShape;
}

/** Canonical KB search text for simple / informal customer wording. */
export function canonicalizeForRetrieval(content: string): string {
  let text = prepareCustomerQuestion(content).replace(/[?!.,]+$/g, "").trim();
  if (!text) return content.trim();

  text = text
    .replace(/\b(?:can u|can you|could you|would you|will you)\s+(?:please\s+)?(?:tell|explain)\s+(?:me\s+)?(?:more\s+)?(?:about\s+)?/gi, "what is ")
    .replace(/\b(?:i want to know|wanna know|need to know|curious about|help me understand)\s+(?:about\s+)?/gi, "what is ")
    .replace(/\btell me(?:\s+more)?\s+about\b/gi, "what is ")
    .replace(/\blearn(?:\s+more)?\s+about\b/gi, "what is ")
    .replace(/\bwhat\s+(?:do|does)\s+kamalo\s+do\b/gi, "what is kamalo")
    .replace(/\bwhat\s+kamalo\s+(?:is|does)\b/gi, "what is kamalo")
    .replace(/\bwhat\s+is\s+this\s+kamalo(?:\s+thing|\s+app)?\b/gi, "what is kamalo")
    .replace(/\b(?:more\s+about|about)\s+kamalo(?:\s+app)?\b/gi, "what is kamalo")
    .replace(/\s+/g, " ")
    .trim();

  if (isBrandOverviewQuestion(text) && !analyzeQuestionShape(content).isCompound) return "What is KAMALO";

  text = text
    .replace(/\bhow (?:can|do) i (?:get|earn|collect|make|receive)\b/gi, "How can I earn")
    .replace(/\bhow to (?:get|earn|collect|make|receive)\b/gi, "How can I earn")
    .replace(/\bhow i (?:get|earn)\b/gi, "How can I earn")
    .replace(/\bhow (?:can|do) i reach\b/gi, "How do I reach")
    .replace(/\bmy (?:paymant|payment) (?:fail|failed|didnt work)\b/gi, "My payment failed")
    .replace(/\bmoney back\b/gi, "refund")
    .replace(/\bnot (?:got|received) otp\b/gi, "OTP support")
    .trim();

  return text;
}

export type QuestionShape = {
  isCompound: boolean;
  estimatedParts: number;
};

/** Detect when one customer message asks 2–3 distinct things that all need answers. */
export function analyzeQuestionShape(content: string): QuestionShape {
  const normalized = prepareCustomerQuestion(content);
  let parts = (normalized.match(/\?/g) || []).length;

  if (/\band\s+how\b/i.test(normalized)) parts = Math.max(parts, 2);
  if (/\band\s+also\b/i.test(normalized)) parts = Math.max(parts, 2);
  if (/\bwhat is\b/i.test(normalized) && /\bhow (?:can|do|we|to)\b/i.test(normalized)) parts = Math.max(parts, 2);
  if (/\btell me about\b/i.test(normalized) && /\bhow (?:can|do|we|to)\b/i.test(normalized)) parts = Math.max(parts, 2);

  const topicSignals = [
    /\bwhat is\b/i.test(normalized),
    /\btell me about\b/i.test(normalized),
    /\bhow (?:can|do|we|to)\b/i.test(normalized),
    /\bwhen\b/i.test(normalized),
    /\bwhere\b/i.test(normalized),
    /\bwhy\b/i.test(normalized),
  ].filter(Boolean).length;
  if (topicSignals >= 2 && /\band\b/i.test(normalized)) {
    parts = Math.max(parts, topicSignals);
  }

  const isCompound = parts >= 2;
  return {
    isCompound,
    estimatedParts: Math.min(Math.max(parts, 1), 4),
  };
}

export function compoundAnswerInstruction(estimatedParts: number): string {
  return `The customer message contains about ${estimatedParts} distinct questions or topics in one message. Answer every part in the order asked. Give one or two factual sentences per part so the full reply covers all of them. Do not skip an earlier part to answer only the last one.`;
}
