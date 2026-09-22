import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectQuestionIntents,
  groundedFactMatchesQuestion,
  retrievalQueriesForQuestion,
  selectGroundedAnswer,
} from "../src/lib/intent-grounding";

const earnArticle = {
  id: "earn",
  title: "How can I earn Coins?",
  category: "Coins",
  content: "You can earn KAMALO Coins from eligible actions, transactions, referrals, and Boosters when the applicable offer rules are met. Action Coins and Transaction Coins follow the published earning rules.",
  version: 1,
};

const expiryArticle = {
  id: "expiry",
  title: "Coin conversion, value, and expiry",
  category: "Coins",
  content: "Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.",
  version: 1,
};

const paymentFailArticle = {
  id: "payment-fail",
  title: "My payment failed.",
  category: "Transactions",
  content: "If a payment failed without any debit, you can safely try again. If money was deducted, the payment and refund status need investigation.",
  version: 1,
};

const silverArticle = {
  id: "silver",
  title: "How do I earn Silver?",
  category: "Silver",
  content: "Silver is a KAMALO milestone journey. Eligibility, progress, milestones, and claim steps depend on the applicable Silver guidance.",
  version: 1,
};

const shopOffersArticle = {
  id: "shop-offers",
  title: '061 · PART O — SHOP & KAMALO / 57. "Where can I use KAMALO?"',
  category: "SHOP & KAMALO",
  content: 'You can discover eligible online and offline offers through Shop & KAMALO. Search for what you need and I\'ll show you the available offers and applicable earning opportunities.',
  version: 1,
};

const boosterArticle = {
  id: "booster",
  title: '054 · PART M — BOOSTER OFFERS / 50. "What is a Booster Offer?"',
  category: "BOOSTER OFFERS",
  content: "A Booster Offer is a specially selected KAMALO offer where the applicable earning opportunity can be higher than a regular offer.",
  version: 1,
};

const prepaidArticle = {
  id: "prepaid",
  title: "What is a prepaid card",
  category: "Wallet",
  content: "KAMALO prepaid cards and gift cards are wallet-related payment options covered by KAMALO product guidance. KAMALO can explain the approved customer-facing capabilities for these cards.",
  version: 1,
};

const reconciliationArticle = {
  id: "reconciliation",
  title: '019 · PART D — TRANSACTION COMPLAINTS / 15. "Payment succeeded but merchant says they didn\'t receive it."',
  category: "TRANSACTION COMPLAINTS",
  content: "I understand. Your payment shows as successful, so let's reconcile the payment with the merchant before you make another payment. I've started checking the transaction and merchant status. Never ask customer to pay again until reconciliation is complete.",
  version: 1,
};

test("detects earn intent for informal earn questions", () => {
  for (const question of [
    "how can i earn coins",
    "how i get coin things",
    "how to get rewards in kamalo",
    "how do i make coins",
  ]) {
    assert.ok(detectQuestionIntents(question).includes("earn"), question);
    assert.ok(retrievalQueriesForQuestion(question).includes("How can I earn Coins"), question);
  }
});

test("routes twisted questions to the right retrieval queries", () => {
  const cases: Array<[string, string]> = [
    ["my paymant failed bro", "My payment failed"],
    ["money back not got", "What is a refund"],
    ["how i reach silver level", "How do I earn Silver"],
    ["not recieved otp pls", "OTP support"],
    ["what fincado do", "What is FINCADO"],
    ["tell me more about kamalo", "What is KAMALO"],
    ["friend joined but no referral reward", "How do referrals work"],
    ["why am i getting this booster", "What is Booster"],
  ];

  for (const [question, expected] of cases) {
    assert.ok(retrievalQueriesForQuestion(question).includes(expected), `${question} -> ${retrievalQueriesForQuestion(question).join(" | ")}`);
  }
});

test("rejects off-topic grounded facts", () => {
  const expiryFact = "Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.";
  assert.equal(groundedFactMatchesQuestion(expiryFact, "how can i earn coins"), false);
  assert.equal(groundedFactMatchesQuestion(expiryFact, "when do my coins expire"), true);
});

test("selects intent-aligned answers from mixed retrieval results", () => {
  const earnAnswer = selectGroundedAnswer("how can i earn coins", [expiryArticle, earnArticle], null);
  assert.match(earnAnswer || "", /earn KAMALO Coins from eligible actions/i);
  assert.doesNotMatch(earnAnswer || "", /FIFO/i);

  const paymentAnswer = selectGroundedAnswer("my payment failed", [expiryArticle, paymentFailArticle], null);
  assert.match(paymentAnswer || "", /safely try again|deducted/i);

  const silverAnswer = selectGroundedAnswer("how do i get silver", [expiryArticle, silverArticle], null);
  assert.match(silverAnswer || "", /Silver is a KAMALO milestone/i);
});

test("ignores wrong preferred facts and picks the right article", () => {
  const answer = selectGroundedAnswer(
    "how can i earn coins",
    [expiryArticle, earnArticle],
    "Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.",
  );
  assert.match(answer || "", /earn KAMALO Coins/i);
  assert.doesNotMatch(answer || "", /FIFO/i);
});

test("routes general offers questions away from booster-only answers", () => {
  assert.ok(detectQuestionIntents("kamalo offers").includes("offers"));
  assert.ok(retrievalQueriesForQuestion("kamalo offers").includes("What are KAMALO offers"));

  const answer = selectGroundedAnswer("kamalo offers", [boosterArticle, shopOffersArticle], null);
  assert.match(answer || "", /discover eligible online and offline offers/i);
  assert.doesNotMatch(answer || "", /Booster Offer/i);
});

test("detects intents from angry Hinglish payment and OTP questions", () => {
  assert.ok(detectQuestionIntents("abe yaar mera payment fail ho gaya").includes("payment_fail"));
  assert.ok(detectQuestionIntents("wtf otp nahi aa raha").includes("otp"));
  assert.ok(detectQuestionIntents("coin kaise milega bhai").includes("earn"));
  assert.ok(detectQuestionIntents("paisa wapas kab milega").includes("refund"));
});

test("does not invent Coins answers for vague or non-product messages", () => {
  assert.deepEqual(detectQuestionIntents("okayy"), []);
  assert.deepEqual(detectQuestionIntents("What is an ecosystem according to you?"), []);
  assert.equal(selectGroundedAnswer("okayy", [earnArticle, expiryArticle], null), null);
  assert.equal(
    selectGroundedAnswer("What is an ecosystem according to you?", [earnArticle, expiryArticle], "1 Coin is equal to 1 paisa."),
    null,
  );
});

test("routes gift card questions to prepaid guidance, not reconciliation", () => {
  assert.ok(detectQuestionIntents("kamalo gift cards what are they").includes("gift_card"));
  assert.ok(retrievalQueriesForQuestion("kamalo gift cards what are they").includes("Wallet prepaid card"));

  const answer = selectGroundedAnswer(
    "kamalo gift cards what are they",
    [reconciliationArticle, prepaidArticle],
    "I've started checking the transaction and merchant status.",
  );
  assert.match(answer || "", /prepaid cards and gift cards/i);
  assert.doesNotMatch(answer || "", /reconcil|merchant status/i);
});
