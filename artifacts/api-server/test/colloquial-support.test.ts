import assert from "node:assert/strict";
import { test } from "node:test";
import { knowledgeBackedFallback } from "../src/lib/knowledge-fallback";
import { buildTopicRetrievalQueries } from "../src/lib/topic-retrieval";
import { buildHumanizeMessages } from "../src/lib/answer-pipeline";
import { canonicalizeForRetrieval, isBrandOverviewQuestion, isPureGreeting, prepareCustomerQuestion } from "../src/lib/support-query";

const colloquialOverviewQuestions = [
  "tell me more about kamalo ?",
  "pls explain kamalo",
  "what kamalo do",
  "i want to know about kamalo",
  "can u tell me about kamalo app",
  "what is this kamalo thing",
  "hi bro tell me about kamalo",
  "ok so what is kamalo app",
];

test("recognizes Hinglish social greetings", () => {
  for (const greeting of ["kaise ho", "kya haal hai", "namaste", "hi bro"]) {
    assert.equal(isPureGreeting(greeting), true, greeting);
  }
});

test("builds a two-stage humanization request from a factual draft", () => {
  const messages = buildHumanizeMessages({
    draftAnswer: "KAMALO prepaid cards and gift cards are wallet-related payment options covered by KAMALO product guidance.",
    customerQuestion: "gift card kya hai yaar",
    language: "en",
  });
  assert.match(messages.at(-1)?.content || "", /gift card kya hai/i);
  assert.match(messages.at(-1)?.content || "", /prepaid cards and gift cards/i);
});

test("recognizes colloquial brand overview questions", () => {
  for (const question of colloquialOverviewQuestions) {
    assert.equal(isBrandOverviewQuestion(question), true, question);
    assert.equal(canonicalizeForRetrieval(question), "What is KAMALO", question);
  }
});

test("does not treat specific product topics as brand overview", () => {
  for (const question of [
    "tell me about kamalo coins",
    "what are kamalo coins",
    "my kamalo payment failed",
    "how do i get silver in kamalo",
  ]) {
    assert.equal(isBrandOverviewQuestion(question), false, question);
  }
});

test("falls back to approved knowledge when the LLM provider fails", () => {
  const fallback = knowledgeBackedFallback({
    question: "how can i earn coins",
    groundedFact: null,
    retrieved: [{
      id: "coins-fixture",
      title: "What are KAMALO Coins?",
      category: "Coins",
      content: "KAMALO Coins are the reward units used inside KAMALO. You can earn them from eligible actions and transactions.",
      version: 1,
    }],
  });

  assert.match(fallback || "", /earn them from eligible actions/i);
});

test("does not answer earn questions with expiry facts", () => {
  const articles = [
    {
      id: "expiry-fixture",
      title: "Coin conversion, value, and expiry",
      category: "Coins",
      content: "Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.",
      version: 1,
    },
    {
      id: "earn-fixture",
      title: "How can I earn Coins?",
      category: "Coins",
      content: "You can earn KAMALO Coins from eligible actions, transactions, referrals, and Boosters when the applicable offer rules are met.",
      version: 1,
    },
  ];

  const answer = knowledgeBackedFallback({
    question: "how can i earn coins",
    groundedFact: "Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.",
    retrieved: articles,
  });

  assert.match(answer || "", /earn KAMALO Coins from eligible actions/i);
  assert.doesNotMatch(answer || "", /FIFO/i);
});

test("maps twisted wording to stable topic retrieval queries", () => {
  const cases: Array<[string, string]> = [
    ["how i get coin things in kamalo", "How can I earn Coins"],
    ["my paymant didnt work", "My payment failed"],
    ["pls tell what kamalo coins mean", "What are KAMALO Coins"],
    ["money back not got", "What is a refund"],
    ["where my silver coin gone", "Where is my Silver Coin"],
    ["not recieved otp", "OTP support"],
    ["cant signup bro", "I can't register"],
    ["what fincado do", "What is FINCADO"],
    ["kamalo offers", "Where can I use KAMALO"],
    ["kamalo gift cards what are they", "Wallet prepaid card"],
  ];

  for (const [question, expectedQuery] of cases) {
    const queries = buildTopicRetrievalQueries(question);
    assert.ok(queries.includes(expectedQuery), `${question} -> ${queries.join(" | ")}`);
  }
});

test("understands angry Hinglish customer phrasing", () => {
  const angryHinglishCases: Array<[string, string]> = [
    ["abe yaar mera payment fail ho gaya kya karu", "My payment failed"],
    ["wtf otp nahi aa raha bar bar", "OTP support"],
    ["coin kaise milega bhai", "How can I earn Coins"],
    ["offer kya hai kamalo me", "Where can I use KAMALO"],
    ["gift card kya hai yaar", "Wallet prepaid card"],
    ["paisa wapas kab milega this is bullshit", "What is a refund"],
    ["silver kaise milega bhai", "How do I earn Silver"],
    ["kamalo kya hai batao jaldi", "What is KAMALO"],
  ];

  for (const [question, expectedQuery] of angryHinglishCases) {
    const prepared = prepareCustomerQuestion(question);
    assert.ok(prepared.length > 0, question);
    const queries = buildTopicRetrievalQueries(question);
    assert.ok(queries.includes(expectedQuery), `${question} -> prepared=${prepared} -> ${queries.join(" | ")}`);
  }
});
