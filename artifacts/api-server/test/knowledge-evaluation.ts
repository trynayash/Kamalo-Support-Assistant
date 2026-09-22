export type KnowledgeEvaluationCase = {
  topic: string;
  query: string;
  expectedTitle: string;
  fixtureCategory?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type KnowledgeEvaluationFixture = {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
};

/**
 * Representative customer wording for the approved KAMALO master knowledge.
 *
 * Keep these questions close to language customers use in support. The
 * expected title is deliberately a stable knowledge topic, not an article ID,
 * so the catalog remains useful when knowledge is re-seeded.
 */
export const representativeKnowledgeQuestions: KnowledgeEvaluationCase[] = [
  {
    topic: "registration",
    query: "I cannot signup for KAMALO",
    expectedTitle: `I can't register.`,
  },
  {
    topic: "OTP delivery",
    query: "I did not recieve OTP",
    expectedTitle: "I didn't receive OTP.",
  },
  {
    topic: "Coins",
    query: "Where are my reward coins?",
    expectedTitle: "What are KAMALO Coins?",
  },
  {
    topic: "payments",
    query: "My card payment was declined",
    expectedTitle: "My payment failed.",
  },
  {
    topic: "Silver",
    query: "How do I qualify for the silver milestone?",
    expectedTitle: "How do I earn Silver?",
  },
  {
    topic: "Gold",
    query: "What is my gold target?",
    expectedTitle: "How much do I need for Gold?",
  },
  {
    topic: "FINCADO",
    query: "What does FINCADO do?",
    expectedTitle: "What is FINCADO?",
  },
  {
    topic: "Auto KAMALO",
    query: "Why did my autopay fail?",
    expectedTitle: "My Auto KAMALO payment failed.",
  },
  {
    topic: "referrals",
    query: "My friend signed up but I got no referral rewards",
    expectedTitle: "My friend joined but I didn't get referral Coins.",
  },
  {
    topic: "notifications",
    query: "I did not get my alert",
    expectedTitle: "I didn't receive my notification.",
  },
  {
    topic: "merchant settlement",
    query: "Why is my seller settlement lower?",
    expectedTitle: "Why is my settlement amount lower?",
  },
  {
    topic: "physical delivery",
    query: "Where is my silver shipment?",
    expectedTitle: "Where is my Silver Coin?",
  },
  {
    topic: "Booster",
    query: "Why am I getting this promotion?",
    expectedTitle: "Why am I getting this Booster?",
  },
  {
    topic: "Shop & KAMALO",
    query: "Where can I shop with KAMALO?",
    expectedTitle: "Where can I use KAMALO?",
  },
  {
    topic: "commission structure",
    query: "How many commission levels does KAMALO have?",
    expectedTitle: "Commission structure and processing",
  },
  {
    topic: "Coin expiry",
    query: "How does FIFO work for Coin expiration?",
    expectedTitle: "Coin conversion, value, and expiry",
  },
  {
    topic: "OTP",
    query: "I am not receiving my one time password",
    expectedTitle: "OTP support",
    fixtureCategory: "OTP / One-Time Password",
  },
  {
    topic: "Fincado",
    query: "Does Fincado show my progress and charts?",
    expectedTitle: "FINCADO analytics and progress",
  },
  {
    topic: "follow-up payment reference",
    query: "What happened to that?",
    history: [{ role: "user", content: "My payment failed." }],
    expectedTitle: "My payment failed.",
  },
  {
    topic: "Hindi Coins",
    query: "KAMALO कॉइन्स क्या हैं?",
    expectedTitle: "What are KAMALO Coins?",
  },
  {
    topic: "Marathi Coins",
    query: "KAMALO नाणी म्हणजे काय?",
    expectedTitle: "What are KAMALO Coins?",
  },
  {
    topic: "Hindi Silver",
    query: "सिल्वर के लिए कैसे योग्य होऊं?",
    expectedTitle: "How do I earn Silver?",
  },
  {
    topic: "Marathi Silver",
    query: "सिल्वरची पात्रता काय आहे?",
    expectedTitle: "How do I earn Silver?",
  },
  {
    topic: "Hindi Gold",
    query: "गोल्ड के लिए कितना चाहिए?",
    expectedTitle: "How much do I need for Gold?",
  },
  {
    topic: "Marathi Gold",
    query: "गोल्डसाठी किती हवे?",
    expectedTitle: "How much do I need for Gold?",
  },
  {
    topic: "Hindi payments",
    query: "मेरा भुगतान विफल हो गया",
    expectedTitle: "My payment failed.",
  },
  {
    topic: "Marathi payments",
    query: "माझे पेमेंट अयशस्वी झाले",
    expectedTitle: "My payment failed.",
  },
  {
    topic: "Hindi refunds",
    query: "मुझे रिफंड चाहिए",
    expectedTitle: "I want a refund.",
  },
  {
    topic: "Marathi refunds",
    query: "मला परतावा हवा",
    expectedTitle: "I want a refund.",
  },
  {
    topic: "misspelled Coins",
    query: "How do I earn KAMALO coines?",
    expectedTitle: "What are KAMALO Coins?",
  },
  {
    topic: "misspelled payments",
    query: "My paymant failed",
    expectedTitle: "My payment failed.",
  },
  {
    topic: "misspelled Silver",
    query: "What is KAMALO silvar?",
    expectedTitle: "How do I earn Silver?",
  },
  {
    topic: "misspelled FINCADO",
    query: "What is KAMALO fincdao?",
    expectedTitle: "FINCADO analytics and progress",
  },
];

/**
 * A deliberately small approved-knowledge catalog for retrieval evaluation.
 *
 * The production corpus is imported and re-seeded independently of tests, so
 * it is not a stable test dependency. Keep this catalog aligned with the
 * representative questions above when a supported topic changes.
 */
export const representativeKnowledgeFixtures: KnowledgeEvaluationFixture[] =
  representativeKnowledgeQuestions.map((evaluationCase, index) => ({
    id: `knowledge-evaluation-${String(index + 1).padStart(2, "0")}`,
    title: evaluationCase.expectedTitle,
    category: evaluationCase.fixtureCategory ?? evaluationCase.topic,
    content: "Deterministic approved-knowledge fixture for retrieval evaluation.",
    version: 1,
  }));