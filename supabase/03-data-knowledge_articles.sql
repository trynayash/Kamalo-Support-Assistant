-- KAMALO Supabase data import: knowledge_articles
-- Run after 02-data-conversations.sql
--
INSERT INTO public.knowledge_articles (id, title, category, content, version, status, effective_from, effective_until, created_at, updated_at) VALUES
('484b2ef4-ff34-446f-a72e-2ac15dca5108', 'What is KAMALO?', 'Product', 'KAMALO is an ecosystem that brings together product journeys, transactions, rewards, referrals, merchant offers, and supporting services in one experience. The exact rules for a journey or offer depend on the applicable KAMALO guidance.', '1', 'approved', '2026-09-16 06:12:53.384+00', NULL, '2026-09-16 06:12:53.385295+00', '2026-09-16 06:12:53.385295+00'),
('ef6b6182-deb2-442e-89e7-6889dc3d4f9a', 'KAMALO Coins overview', 'Coins', 'KAMALO Coins are part of the KAMALO ecosystem. They can be earned through eligible activities such as transactions, actions, referrals, or other applicable mechanisms. How many Coins can be earned depends on the applicable KAMALO rules or offer.', '1', 'approved', '2026-09-16 06:12:53.402+00', NULL, '2026-09-16 06:12:53.403327+00', '2026-09-16 06:12:53.403327+00'),
('91342bd3-ef0b-4ca5-bf27-826528bd8d2a', 'Earning Coins', 'Coins', 'Coin earning can include Action Coins, Transaction Coins, Referral Coins, and Booster Coins. The applicable offer or rule determines eligibility and the amount. KAMALO AI cannot view a personal Coin balance in Stage 1.', '1', 'approved', '2026-09-16 06:12:53.411+00', NULL, '2026-09-16 06:12:53.41232+00', '2026-09-16 06:12:53.41232+00'),
('ef217f7c-54cd-447b-b873-8da1a33b7a2b', 'Coin redemption, expiry, and reversals', 'Coins', 'KAMALO guidance covers Coin redemption, expiry, FIFO handling, rollover, reversals, adjustments, and statements. The exact treatment depends on the applicable KAMALO rules. KAMALO AI cannot redeem, credit, reverse, or adjust Coins in Stage 1.', '1', 'approved', '2026-09-16 06:12:53.42+00', NULL, '2026-09-16 06:12:53.420981+00', '2026-09-16 06:12:53.420981+00'),
('690d54f7-8513-4328-9f1c-460a684e520f', 'Silver', 'Silver', 'Silver is a KAMALO milestone journey with eligibility, progress, milestone, claim, dispatch, and delivery concepts. The specific requirements and delivery details must come from the applicable KAMALO guidance. Stage 1 cannot check a person''s live Silver progress.', '1', 'approved', '2026-09-16 06:12:53.428+00', NULL, '2026-09-16 06:12:53.428684+00', '2026-09-16 06:12:53.428684+00'),
('f1d640c9-98cb-4e53-acae-7ef267080594', 'Gold', 'Gold', 'Gold is a KAMALO milestone journey that can include personal progress and community progress, together with eligibility, claim, dispatch, and delivery concepts. The specific requirements must come from the applicable KAMALO guidance. Stage 1 cannot check live Gold progress.', '1', 'approved', '2026-09-16 06:12:53.439+00', NULL, '2026-09-16 06:12:53.439604+00', '2026-09-16 06:12:53.439604+00'),
('b281cea2-8c06-47c9-9aaf-1ef176ef52e8', 'FINCADO', 'FINCADO', 'FINCADO is the KAMALO goal and recommendation experience. It can include a Silver goal, Gold goal, Daily Drive, Weekly Streak, recommendations, Booster recommendations, and community recommendations. Stage 1 can explain these concepts but cannot view live progress.', '1', 'approved', '2026-09-16 06:12:53.446+00', NULL, '2026-09-16 06:12:53.447164+00', '2026-09-16 06:12:53.447164+00'),
('c60fffb8-8bb0-422d-b1be-5ba51446a342', 'Auto KAMALO', 'Auto KAMALO', 'Auto KAMALO is a KAMALO service journey with concepts such as activation, services, mandates, failures, and stopping Auto KAMALO. Stage 1 can explain the concepts but cannot inspect or modify a personal mandate or service.', '1', 'approved', '2026-09-16 06:12:53.451+00', NULL, '2026-09-16 06:12:53.452125+00', '2026-09-16 06:12:53.452125+00'),
('c5c6bafa-d9d9-4bc4-aba9-ef0adcceabf8', 'Booster', 'Booster', 'A Booster is a KAMALO offer concept that can affect eligible earning. Booster guidance covers what it is, eligibility, earning, expiry, transaction, reversal, and offer terms. The exact terms are determined by the applicable offer.', '1', 'approved', '2026-09-16 06:12:53.457+00', NULL, '2026-09-16 06:12:53.459892+00', '2026-09-16 06:12:53.459892+00'),
('e6485df2-8d9e-48a7-8feb-249c70fb26e9', 'Referrals and commission', 'Referral', 'KAMALO referrals can include a referral link, referral levels, referral transactions, commissions, and community concepts. Commission treatment depends on the applicable KAMALO rules. Stage 1 cannot view a personal commission amount or confirm that a commission was paid.', '1', 'approved', '2026-09-16 06:12:53.464+00', NULL, '2026-09-16 06:12:53.465188+00', '2026-09-16 06:12:53.465188+00'),
('93abed18-dde9-4203-b1a8-a7c3b10e4179', 'Transaction status', 'Transactions', 'KAMALO transaction guidance can cover payment, failed, pending, successful, reversed, cancelled, refund concepts, and transaction references. Stage 1 can explain these statuses but cannot look up a personal transaction, initiate a refund, or claim that a transaction succeeded.', '1', 'approved', '2026-09-16 06:12:53.47+00', NULL, '2026-09-16 06:12:53.471039+00', '2026-09-16 06:12:53.471039+00'),
('afaef825-8665-4967-bd42-57b85fae76ed', 'Notifications', 'Notifications', 'KAMALO notification guidance can cover notification history, delivery, preferences, and deep links. Stage 1 can explain notification concepts but cannot inspect a personal notification history or change preferences.', '1', 'approved', '2026-09-16 06:12:53.475+00', NULL, '2026-09-16 06:12:53.475544+00', '2026-09-16 06:12:53.475544+00'),
('443c6497-dd3b-4293-b0b1-c3607aa909ee', 'Merchant offers', 'Merchant', 'KAMALO merchant guidance can cover onboarding, offers, settlement, commissions, refunds, a merchant dashboard, and technical integration. The specific terms depend on the merchant guidance and applicable offer.', '1', 'approved', '2026-09-16 06:12:53.481+00', NULL, '2026-09-16 06:12:53.481717+00', '2026-09-16 06:12:53.481717+00'),
('777db661-eaf2-4e7b-a26e-be32738e3230', '001 · Master guidance / 1. THE KAMALO SUPPORT PHILOSOPHY', 'Master guidance', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The customer should never feel that they are talking to a machine.
They should feel:
"KAMALO is sitting with me, understands my problem, has checked my account, and is taking care of it."
The personality should be:
Warm
Respectful
Positive
Patient
Personal
Clear
Action-oriented
Never defensive
Never argumentative
Never blaming the customer
Never robotic
Never unnecessarily lengthy
KAMALO AI''s basic promise
Listen → Understand → Check → Explain → Resolve → Confirm', '1', 'approved', '2026-09-16 09:34:19.119+00', NULL, '2026-09-16 09:34:19.120951+00', '2026-09-16 09:34:19.120951+00'),
('d0d75069-e8e5-4a54-a2c8-209b1d5e258f', '002 · Master guidance / 2. GOLDEN RULE FOR EVERY RESPONSE', 'Master guidance', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Every support response should ideally follow:
A — ATTRACT
Acknowledge the customer warmly.
B — BUILD TRUST
Tell them what KAMALO checked and what is actually happening.
C — CLOSE
Resolve the issue or give one clear next action.
For example:
User:
 "I paid but didn''t get my Coins."
AI:
A — Attract: "Absolutely, let me check this for you. I understand that you completed the transaction and are waiting for your KAMALO Coins."
B — Build Trust: "I''ve checked your transaction and it was successful. The transaction is eligible for Coins, but the Coin credit has not yet been posted."
C — Close: "I''m checking the Coin credit now. Please stay with me for a moment."
The AI then actually checks the Coin Engine.
It must not say "I''ve credited your Coins" until the engine confirms the credit.', '1', 'approved', '2026-09-16 09:34:19.178+00', NULL, '2026-09-16 09:34:19.179855+00', '2026-09-16 09:34:19.179855+00'),
('537ea32c-607a-4076-9146-51ce1b52777c', '013 · PART B — GENERAL KAMALO QUESTIONS / 9. "How do I earn Coins?"', 'GENERAL KAMALO QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"There are two main ways: you earn Coins through eligible actions such as joining, daily activity and referrals, and you can also earn Coins from eligible transactions through KAMALO''s Commission Engine. Your Coins are then accumulated toward your KAMALO goals."
CTA:
SEE WAYS TO EARN', '1', 'approved', '2026-09-16 09:34:19.281+00', NULL, '2026-09-16 09:34:19.283192+00', '2026-09-16 09:34:19.283192+00'),
('040972f5-ab63-43cb-a6e5-631bc5686a42', '003 · Master guidance / 3. UNIVERSAL SUPPORT RESPONSE FRAMEWORK', 'Master guidance', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Every query should pass through:
USER MESSAGE
      ↓
UNDERSTAND INTENT
      ↓
IDENTIFY USER
      ↓
IDENTIFY TRANSACTION / OFFER / GOAL
      ↓
CHECK RELEVANT ENGINE
      ↓
IDENTIFY ROOT CAUSE
      ↓
RESOLVE AUTOMATICALLY
      ↓
CONFIRM RESOLUTION
      ↓
ASK FOR EXPERIENCE RATING
If not resolvable:
INVESTIGATE
      ↓
COLLECT REQUIRED INFORMATION
      ↓
CREATE TICKET
      ↓
TIMESTAMP
      ↓
SLA
      ↓
TRACK
      ↓
RESOLVE
      ↓
CONFIRM', '1', 'approved', '2026-09-16 09:34:19.188+00', NULL, '2026-09-16 09:34:19.188694+00', '2026-09-16 09:34:19.188694+00'),
('ebec4be1-5b5c-46b7-8053-7eb9a3cf486d', '004 · Master guidance / 4. KAMALO SUPPORT ENGINE MAP', 'Master guidance', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Customer issue
Primary engine
Payment/transaction
Transaction Engine
Commission
Commission Engine
KAMALO Coins
Coin Engine
Silver/Gold/Goals
FINCADO
Push notification
Notification Engine
Auto payment
Auto KAMALO
Offer/merchant
Shop & Kamalo
Referral/community
Commission + Coin + FINCADO
Multiple-engine issue
AI Orchestrator', '1', 'approved', '2026-09-16 09:34:19.197+00', NULL, '2026-09-16 09:34:19.198157+00', '2026-09-16 09:34:19.198157+00'),
('cfe2bb63-c0b5-43ea-9942-87d299375adf', '005 · PART A — ACCOUNT & REGISTRATION / 1. "I can''t register."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI action
Check:
Mobile number
Existing account
OTP status
Account status
Technical registration error
Response
"Of course. Let me help you get started with KAMALO. I''ll quickly check what is stopping your registration so we don''t make you repeat the process unnecessarily."
Then diagnose.
If technical error:
"I''ve identified an issue while creating your account. Don''t worry — your registration details haven''t been lost. I''m checking the next step for you."', '1', 'approved', '2026-09-16 09:34:19.207+00', NULL, '2026-09-16 09:34:19.20799+00', '2026-09-16 09:34:19.20799+00'),
('b3a88453-22e6-4ba5-b8fa-d542fd0c0041', '006 · PART A — ACCOUNT & REGISTRATION / 2. "I didn''t receive OTP."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"No problem at all. Let''s get this sorted. I''ll check whether the OTP was generated and delivered to your registered mobile number."
Possible actions:
Resend OTP
Check rate limit
Check delivery status
CTA:
RESEND OTP', '1', 'approved', '2026-09-16 09:34:19.215+00', NULL, '2026-09-16 09:34:19.216191+00', '2026-09-16 09:34:19.216191+00'),
('f971e643-d3dc-4b5f-8dfe-9c2c98e83fd5', '007 · PART A — ACCOUNT & REGISTRATION / 3. "My OTP expired."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"That''s absolutely fine. OTPs are time-sensitive for your security. I''ll generate a fresh OTP for you so you can continue without starting over."', '1', 'approved', '2026-09-16 09:34:19.222+00', NULL, '2026-09-16 09:34:19.222883+00', '2026-09-16 09:34:19.222883+00'),
('48ecb8cc-a824-44dc-be8e-15fcd4cabeea', '008 · PART A — ACCOUNT & REGISTRATION / 4. "My account is locked."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand. Account security can sometimes trigger a temporary lock. Let me check your account status and see what we can safely do to restore your access."', '1', 'approved', '2026-09-16 09:34:19.228+00', NULL, '2026-09-16 09:34:19.229215+00', '2026-09-16 09:34:19.229215+00'),
('d590f5bf-c37e-45d3-be61-8661d533cb86', '009 · PART A — ACCOUNT & REGISTRATION / 5. "I already have an account."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"No problem. KAMALO wants to keep your earnings and Coin history together rather than creating duplicate accounts. Let me check your existing account and help you access it."', '1', 'approved', '2026-09-16 09:34:19.245+00', NULL, '2026-09-16 09:34:19.246127+00', '2026-09-16 09:34:19.246127+00'),
('e712b67a-6ebc-4b2e-83d7-77edafa5a5b6', '010 · PART A — ACCOUNT & REGISTRATION / 6. "I want to change my mobile number."', 'ACCOUNT & REGISTRATION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks whether self-service change is permitted.
If permitted:
"Absolutely. I''ll guide you through updating your registered mobile number securely."
If not:
Create verification workflow/ticket.', '1', 'approved', '2026-09-16 09:34:19.256+00', NULL, '2026-09-16 09:34:19.2571+00', '2026-09-16 09:34:19.2571+00'),
('4d42dbce-5421-42a6-8626-ef629bb5b151', '011 · PART B — GENERAL KAMALO QUESTIONS / 7. "What is KAMALO?"', 'GENERAL KAMALO QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Welcome to KAMALO. KAMALO is built around a simple idea — make your everyday Kharcha more rewarding. You discover offers, transact through KAMALO, earn KAMALO Coins and work toward bigger milestones such as Silver and Gold. We''re here to help you make more from the spending you already do."
CTA:
EXPLORE KAMALO', '1', 'approved', '2026-09-16 09:34:19.266+00', NULL, '2026-09-16 09:34:19.267077+00', '2026-09-16 09:34:19.267077+00'),
('4be0b62f-813f-4b42-805b-281f3ace70e4', '012 · PART B — GENERAL KAMALO QUESTIONS / 8. "What are KAMALO Coins?"', 'GENERAL KAMALO QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"KAMALO Coins are your reward units inside KAMALO. 1 Coin is equal to 1 paisa, so 100 Coins equal ₹1 and 1,000 Coins equal ₹10 in applicable redemption value. You can earn Coins through eligible actions and transactions and use them according to the applicable redemption rules."', '1', 'approved', '2026-09-16 09:34:19.273+00', NULL, '2026-09-16 09:34:19.274407+00', '2026-09-16 09:34:19.274407+00'),
('d78f5d86-4e05-4c0f-aaad-fa0ab03b8ecf', '014 · PART C — WELCOME BONUS / 10. "Where are my 1,000 welcome Coins?"', 'WELCOME BONUS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Registration status
Welcome bonus event
Coin ledger
If credited:
"Good news — your 1,000 welcome Coins are already in your account. That''s ₹10 of applicable Coin value. You can now use eligible KAMALO offers to experience how KAMALO works."
If missing:
"I''ve checked your registration and the welcome Coin entry. It hasn''t been credited yet, so I''m checking why before asking you to do anything else."', '1', 'approved', '2026-09-16 09:34:19.289+00', NULL, '2026-09-16 09:34:19.291038+00', '2026-09-16 09:34:19.291038+00'),
('251fbc50-80f2-4dc4-b493-be5b9d614a5f', '015 · PART C — WELCOME BONUS / 11. "Why did I only get 1,000 Coins?"', 'WELCOME BONUS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"The 1,000 Coins are your KAMALO joining/welcome bonus. That''s equivalent to ₹10 in applicable Coin value. Your transaction-based Coins are earned separately according to the applicable Commission Engine rules."', '1', 'approved', '2026-09-16 09:34:19.299+00', NULL, '2026-09-16 09:34:19.300367+00', '2026-09-16 09:34:19.300367+00'),
('0a693086-5b81-432f-ba4b-6ea987e2ec48', '016 · PART D — TRANSACTION COMPLAINTS / 12. "My payment failed."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''m here to help. Let me check the transaction status so we can see exactly where the payment stopped."
AI checks Transaction Engine.
If failed without debit:
"I''ve checked it. The transaction was unsuccessful and no successful payment has been recorded. You can safely try again."
CTA:
TRY AGAIN', '1', 'approved', '2026-09-16 09:34:19.307+00', NULL, '2026-09-16 09:34:19.308188+00', '2026-09-16 09:34:19.308188+00'),
('1060d695-f21d-4156-b5c6-7af4b76285ce', '017 · PART D — TRANSACTION COMPLAINTS / 13. "Money was deducted but transaction failed."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

This should be a high-priority automated investigation.
AI checks:
Transaction status
Gateway reference
Settlement status
Refund status
Response:
"I understand why you''re concerned — when money leaves your account but the transaction doesn''t complete, you want clarity immediately. I''ve checked the transaction and I''m tracing the payment and refund status for you."
Then provide verified status.', '1', 'approved', '2026-09-16 09:34:19.313+00', NULL, '2026-09-16 09:34:19.314004+00', '2026-09-16 09:34:19.314004+00'),
('a58b7c95-4dd5-4f54-afc9-429f3610948a', '018 · PART D — TRANSACTION COMPLAINTS / 14. "Payment is pending."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Your payment hasn''t received its final status yet. I''ve checked the transaction and it is currently showing as pending. I''ll keep the transaction reference connected to this conversation so you don''t have to explain everything again."
If automatic polling is possible, continue checking.', '1', 'approved', '2026-09-16 09:34:19.325+00', NULL, '2026-09-16 09:34:19.326195+00', '2026-09-16 09:34:19.326195+00'),
('cdda1b7c-38a5-475d-99c8-6440ab18beed', '019 · PART D — TRANSACTION COMPLAINTS / 15. "Payment succeeded but merchant says they didn''t receive it."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand. Your payment shows as successful, so let''s reconcile the payment with the merchant before you make another payment. I''ve started checking the transaction and merchant status."
Never ask customer to pay again until reconciliation is complete.', '1', 'approved', '2026-09-16 09:34:19.335+00', NULL, '2026-09-16 09:34:19.335563+00', '2026-09-16 09:34:19.335563+00'),
('4bf02355-02ad-42dc-989b-112c43f3ce6c', '020 · PART D — TRANSACTION COMPLAINTS / 16. "I was charged twice."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''m sorry you''ve had to deal with that. Let me compare the two transaction records so we can determine whether this is a genuine duplicate payment or one transaction is still pending."
AI compares:
Transaction IDs
Amount
Timestamp
Merchant
Gateway reference', '1', 'approved', '2026-09-16 09:34:19.342+00', NULL, '2026-09-16 09:34:19.342318+00', '2026-09-16 09:34:19.342318+00'),
('dce4a7bf-42fd-49ef-8c80-284f68ca5a13', '021 · PART D — TRANSACTION COMPLAINTS / 17. "I made the wrong payment."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI determines whether cancellation is possible.
"I understand. I''ll check whether this transaction can still be cancelled or reversed under the applicable transaction rules."', '1', 'approved', '2026-09-16 09:34:19.348+00', NULL, '2026-09-16 09:34:19.349185+00', '2026-09-16 09:34:19.349185+00'),
('a32dfd6b-4749-4774-9009-c1921c917b8c', '022 · PART D — TRANSACTION COMPLAINTS / 18. "I want a refund."', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Absolutely. Let me first check the transaction and the applicable refund terms so I can tell you exactly what can be done."
AI retrieves policy + transaction status.', '1', 'approved', '2026-09-16 09:34:19.356+00', NULL, '2026-09-16 09:34:19.356686+00', '2026-09-16 09:34:19.356686+00'),
('0740f41c-c82e-4d39-89f5-ad9e1056f669', '023 · PART D — TRANSACTION COMPLAINTS / 19. "Where is my refund?"', 'TRANSACTION COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll check the refund status for you now. You shouldn''t have to chase a payment that you''ve already been told is being refunded."
Then provide:
Refund initiated?
Date
Amount
Reference
Current status', '1', 'approved', '2026-09-16 09:34:19.364+00', NULL, '2026-09-16 09:34:19.364887+00', '2026-09-16 09:34:19.364887+00'),
('5ab6fc10-7c4f-4cfe-bbf4-2634f7fb3f7c', '024 · PART E — KAMALO COINS / 20. "How many Coins do I have?"', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI calls Coin Engine.
"You currently have X KAMALO Coins, with an applicable tentative value of ₹X. You also have X Coins expiring this week."
CTA:
VIEW MY COINS', '1', 'approved', '2026-09-16 09:34:19.371+00', NULL, '2026-09-16 09:34:19.371369+00', '2026-09-16 09:34:19.371369+00'),
('4fe57570-305a-412a-8dc1-8fac0a34ccbf', '025 · PART E — KAMALO COINS / 21. "Why didn''t I receive my Coins?"', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Absolutely — let''s trace them together. I''ll check your transaction, the applicable commission and your Coin ledger to identify exactly where the credit is."
Then investigate all three engines.', '1', 'approved', '2026-09-16 09:34:19.376+00', NULL, '2026-09-16 09:34:19.376663+00', '2026-09-16 09:34:19.376663+00'),
('394d52dc-e589-43fb-98f3-9c4bf1b4bd02', '026 · PART E — KAMALO COINS / 22. "I received fewer Coins than expected."', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand. Let''s not guess — I''ll check the transaction and the exact Commission Engine rule that applied to it."
Then explain actual calculation.', '1', 'approved', '2026-09-16 09:34:19.381+00', NULL, '2026-09-16 09:34:19.382052+00', '2026-09-16 09:34:19.382052+00'),
('06aca3e6-f579-47e5-9cf5-b621b8f0f31c', '027 · PART E — KAMALO COINS / 23. "Why did I get 500 Coins?"', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ve checked the transaction. The applicable eligible commission was ₹5, which converts to 500 KAMALO Coins under the applicable Coin conversion rule. That''s why 500 Coins were credited."
Only if verified.', '1', 'approved', '2026-09-16 09:34:19.386+00', NULL, '2026-09-16 09:34:19.386858+00', '2026-09-16 09:34:19.386858+00');

INSERT INTO public.knowledge_articles (id, title, category, content, version, status, effective_from, effective_until, created_at, updated_at) VALUES
('23f51aa1-c227-4292-9a93-e3c8a2db24d5', '028 · PART E — KAMALO COINS / 24. "My Coins disappeared."', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand why that would be concerning. I''ll check your Coin ledger and identify whether the Coins were redeemed, expired, reversed or adjusted."', '1', 'approved', '2026-09-16 09:34:19.392+00', NULL, '2026-09-16 09:34:19.392634+00', '2026-09-16 09:34:19.392634+00'),
('df58ea9d-11ab-4478-9885-3765ce7efdda', '029 · PART E — KAMALO COINS / 25. "My Coins expired."', 'KAMALO COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Let me check the exact Coin batches rather than giving you a generic answer. KAMALO tracks Coins using FIFO, so the oldest eligible Coins are used/expire first according to the applicable expiry rule."
Then show:
Batch
Credit date
Expiry date
Quantity
Status', '1', 'approved', '2026-09-16 09:34:19.397+00', NULL, '2026-09-16 09:34:19.398256+00', '2026-09-16 09:34:19.398256+00'),
('f3583531-326c-4760-9630-b3e2c45f3e1c', '030 · PART F — FIFO / EXPIRY / 26. "When will my Coins expire?"', 'FIFO / EXPIRY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ve checked your Coin batches. You currently have Coins expiring on different dates. Your next expiry is X Coins in X days."
CTA:
USE EXPIRING COINS', '1', 'approved', '2026-09-16 09:34:19.403+00', NULL, '2026-09-16 09:34:19.403842+00', '2026-09-16 09:34:19.403842+00'),
('56ae82d0-fa60-48d2-8e24-2fe4a13ba02d', '031 · PART F — FIFO / EXPIRY / 27. "How many Coins expire this week?"', 'FIFO / EXPIRY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI calls Coin Engine.
"You currently have X Coins scheduled to expire this week. I''ve also found eligible offers where you may be able to use them."
CTA:
VIEW OFFERS', '1', 'approved', '2026-09-16 09:34:19.411+00', NULL, '2026-09-16 09:34:19.411987+00', '2026-09-16 09:34:19.411987+00'),
('1787151d-3040-4a56-a0c8-ab79d32d5762', '032 · PART F — FIFO / EXPIRY / 28. "Why are you telling me my Coins are expiring?"', 'FIFO / EXPIRY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Because we don''t want you to lose the value you''ve already earned. KAMALO tracks Coin expiry so we can remind you early and give you an opportunity to redeem eligible Coins."', '1', 'approved', '2026-09-16 09:34:19.417+00', NULL, '2026-09-16 09:34:19.417439+00', '2026-09-16 09:34:19.417439+00'),
('25275328-aa61-4b81-b82f-4f875a8cb817', '033 · PART G — REDEMPTION / 29. "What is the minimum redemption?"', 'REDEMPTION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"The minimum redemption threshold is 1,000 KAMALO Coins, equivalent to ₹10 in applicable redemption value."', '1', 'approved', '2026-09-16 09:34:19.422+00', NULL, '2026-09-16 09:34:19.422336+00', '2026-09-16 09:34:19.422336+00'),
('dad95158-6bfb-430b-8c8b-0f376961bb9d', '034 · PART G — REDEMPTION / 30. "I have 500 Coins. Why can''t I redeem?"', 'REDEMPTION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"You currently have 500 Coins. The minimum redemption threshold is 1,000 Coins, so you''re 500 Coins away from the minimum. Your next eligible transaction can help you continue building your balance."
CTA:
EARN MORE COINS', '1', 'approved', '2026-09-16 09:34:19.428+00', NULL, '2026-09-16 09:34:19.429406+00', '2026-09-16 09:34:19.429406+00'),
('2374ce16-b0ad-4481-a2f6-ac7a52fa189b', '057 · PART N — AUTO KAMALO / 53. "What is Auto KAMALO?"', 'AUTO KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Auto KAMALO lets you automate eligible recurring payments or mandates so that everyday expenses can continue working for you without requiring the same action every month."', '1', 'approved', '2026-09-16 09:34:19.58+00', NULL, '2026-09-16 09:34:19.580327+00', '2026-09-16 09:34:19.580327+00'),
('1ef8006a-6936-48f6-8517-55370eead227', '035 · PART G — REDEMPTION / 31. "Why couldn''t I use my Coins?"', 'REDEMPTION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Balance
Minimum threshold
Offer eligibility
Expiry
Offer terms
Redemption status
Response:
"I''ve checked the redemption attempt. The issue is [verified reason]. Here''s the eligible option available to you now."', '1', 'approved', '2026-09-16 09:34:19.439+00', NULL, '2026-09-16 09:34:19.439946+00', '2026-09-16 09:34:19.439946+00'),
('206caabd-c5c4-4ed5-a41c-ffab689625ba', '036 · PART H — COMMISSION / 32. "How much commission did I earn?"', 'COMMISSION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI retrieves transaction-level commission.
"For your transaction of ₹X, the applicable commission generated was ₹X. Under KAMALO''s current Coin conversion rule, that corresponds to X KAMALO Coins."', '1', 'approved', '2026-09-16 09:34:19.447+00', NULL, '2026-09-16 09:34:19.447919+00', '2026-09-16 09:34:19.447919+00'),
('d8eb5e15-6c98-475e-a56c-f9dd822c8e6e', '037 · PART H — COMMISSION / 33. "Why didn''t I get commission?"', 'COMMISSION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll check the transaction against the applicable commission rule. This will tell us whether the transaction was eligible, pending, reversed or outside the applicable offer terms."', '1', 'approved', '2026-09-16 09:34:19.454+00', NULL, '2026-09-16 09:34:19.455229+00', '2026-09-16 09:34:19.455229+00'),
('7d2eb1b8-953e-4642-8f10-0cf3073f60e1', '038 · PART H — COMMISSION / 34. "My commission is pending."', 'COMMISSION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Your commission is currently showing as pending. I''ve recorded the transaction and checked its current status. I''ll show you the applicable status and expected next step."
Only show an ETA if the Commission Engine supplies one.', '1', 'approved', '2026-09-16 09:34:19.463+00', NULL, '2026-09-16 09:34:19.4637+00', '2026-09-16 09:34:19.4637+00'),
('f6bfd56a-8194-4985-862d-56cc0ac57dae', '039 · PART H — COMMISSION / 35. "My commission was reversed."', 'COMMISSION', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ve checked the commission record. The original commission was reversed because of [verified reason]. I can show you the transaction and the applicable adjustment."', '1', 'approved', '2026-09-16 09:34:19.468+00', NULL, '2026-09-16 09:34:19.468938+00', '2026-09-16 09:34:19.468938+00'),
('c105c125-179d-4e5c-9d45-bd6f81488cf5', '040 · PART I — REFERRALS / 36. "Where is my referral link?"', 'REFERRALS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Of course. Your referral link is ready. You can share it with people who may want to join KAMALO and participate in eligible activities."
CTA:
SHARE MY LINK', '1', 'approved', '2026-09-16 09:34:19.474+00', NULL, '2026-09-16 09:34:19.474565+00', '2026-09-16 09:34:19.474565+00'),
('ebb53628-b4e5-4507-a560-df55b7b84446', '041 · PART I — REFERRALS / 37. "My friend joined but I didn''t get referral Coins."', 'REFERRALS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Referral relationship
Registration
Referral timestamp
Eligibility
Coin ledger
"I''ve checked the referral. Your friend has registered, and I''m now checking whether the referral has completed the activity required for the Coins."', '1', 'approved', '2026-09-16 09:34:19.48+00', NULL, '2026-09-16 09:34:19.480753+00', '2026-09-16 09:34:19.480753+00'),
('9e366ed2-1c1c-486e-a2f9-7fe61e32764b', '042 · PART I — REFERRALS / 38. "How does community earning work?"', 'REFERRALS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Your community can create earning opportunities through eligible transactions. KAMALO tracks the applicable direct and indirect referral relationships and credits eligible Coins according to the Commission Engine rules."', '1', 'approved', '2026-09-16 09:34:19.485+00', NULL, '2026-09-16 09:34:19.486244+00', '2026-09-16 09:34:19.486244+00'),
('e92ae923-7727-4a78-9729-027c22d3e44e', '043 · PART J — SILVER KAMALO COIN / 39. "How do I earn Silver?"', 'SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Your Silver journey starts with your FINCADO goal. KAMALO tracks your eligible Coin progress and shows you the actions and offers that can help you move toward the current Silver milestone."
CTA:
SHOW MY SILVER PLAN', '1', 'approved', '2026-09-16 09:34:19.492+00', NULL, '2026-09-16 09:34:19.492607+00', '2026-09-16 09:34:19.492607+00'),
('2eb59d3e-d7aa-44ea-ab57-72975dbdbd3f', '044 · PART J — SILVER KAMALO COIN / 40. "How far am I from Silver?"', 'SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI retrieves live FINCADO progress.
"You''re currently at X Coins toward your current Silver milestone of X Coins. You need X more Coins. I''ve also identified the eligible actions currently available to help you move closer."', '1', 'approved', '2026-09-16 09:34:19.5+00', NULL, '2026-09-16 09:34:19.500467+00', '2026-09-16 09:34:19.500467+00'),
('24888f9c-8fb4-46f9-b172-bec39f43d700', '045 · PART J — SILVER KAMALO COIN / 41. "Why haven''t I received my Silver Coin?"', 'SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Eligibility
Personal target
Goal status
Qualification
Address
Dispatch status
"I''ll check your Silver qualification from the FINCADO record first. I don''t want to give you a generic answer when your actual progress is available."', '1', 'approved', '2026-09-16 09:34:19.506+00', NULL, '2026-09-16 09:34:19.506935+00', '2026-09-16 09:34:19.506935+00'),
('a28688ed-764a-4e36-9fa3-3524d5d6f427', '046 · PART J — SILVER KAMALO COIN / 42. "I earned Silver. Where is my physical coin?"', 'SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Qualification
Address submitted
Dispatch
Courier
Delivery
"Congratulations on reaching your Silver milestone. I''ve checked your dispatch status and your physical KAMALO Silver Coin is currently [verified status]."', '1', 'approved', '2026-09-16 09:34:19.512+00', NULL, '2026-09-16 09:34:19.513119+00', '2026-09-16 09:34:19.513119+00'),
('9e096bd1-eea3-4d7e-a6f4-8b3dffdcdf42', '047 · PART K — GOLD KAMALO COIN / 43. "How do I earn Gold?"', 'GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Gold is your next KAMALO milestone. Your current Gold journey combines your eligible personal Coin achievement with the applicable community milestone. I''ll show you exactly where you stand on both."
CTA:
VIEW MY GOLD JOURNEY', '1', 'approved', '2026-09-16 09:34:19.519+00', NULL, '2026-09-16 09:34:19.519378+00', '2026-09-16 09:34:19.519378+00'),
('b0ae7ded-2ea4-4f9c-814a-879375830867', '048 · PART K — GOLD KAMALO COIN / 44. "How much do I need for Gold?"', 'GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI retrieves current applicable Gold threshold because the gold-price-linked target may change.
"Your current applicable personal Gold target is X. You have achieved Y, so you have Z remaining."
Never hard-code ₹16,000 into the AI response if the target is dynamic.', '1', 'approved', '2026-09-16 09:34:19.524+00', NULL, '2026-09-16 09:34:19.524543+00', '2026-09-16 09:34:19.524543+00'),
('8e32d488-f114-414b-b5a4-a2f2079471fb', '049 · PART K — GOLD KAMALO COIN / 45. "How many people in my community have earned Silver?"', 'GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI calls FINCADO/community engine.
"Your community currently has X eligible Silver achievers toward the applicable Gold community milestone. You have Y remaining."', '1', 'approved', '2026-09-16 09:34:19.53+00', NULL, '2026-09-16 09:34:19.53055+00', '2026-09-16 09:34:19.53055+00'),
('0fd8cb31-9ed1-45c6-9955-b6701e477615', '050 · PART K — GOLD KAMALO COIN / 46. "Why haven''t I qualified for Gold?"', 'GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll check both parts of your Gold qualification — your personal eligible Coin achievement and your community progress. Once I verify both, I''ll show you exactly what remains."', '1', 'approved', '2026-09-16 09:34:19.534+00', NULL, '2026-09-16 09:34:19.535231+00', '2026-09-16 09:34:19.535231+00'),
('5df85024-4385-4ec5-a9bd-ff61e787ab4d', '051 · PART L — FINCADO / 47. "What is FINCADO?"', 'FINCADO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"FINCADO is your KAMALO goal centre. Think of it as your personal KAMALO journey — it shows where you are, how far you are from Silver and Gold, what you''re earning from your own activity and community, and what actions can help you move forward."', '1', 'approved', '2026-09-16 09:34:19.541+00', NULL, '2026-09-16 09:34:19.541922+00', '2026-09-16 09:34:19.541922+00'),
('3979e35c-d82f-49ff-a0fa-121fda853617', '052 · PART L — FINCADO / 48. "What should I do today?"', 'FINCADO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

This should be a high-value AI capability.
AI checks:
Goal progress
Expiring Coins
Booster offers
Daily Drive
Streak
Auto KAMALO
Referral opportunities
Then:
"I''ve checked your current KAMALO journey. Today, your biggest opportunity is [verified action] because it can help you move closer to your current goal. You also have X Coins approaching expiry."
CTA:
SHOW TODAY''S PLAN', '1', 'approved', '2026-09-16 09:34:19.548+00', NULL, '2026-09-16 09:34:19.548755+00', '2026-09-16 09:34:19.548755+00'),
('77b28b86-fda5-44ac-9250-d8096ca00126', '053 · PART L — FINCADO / 49. "What is my fastest route to Silver?"', 'FINCADO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Let''s look at your actual account rather than giving you a generic suggestion. I''ll compare your current Coins, available Booster offers, expiring Coins and eligible activities and show you the available routes toward your Silver milestone."', '1', 'approved', '2026-09-16 09:34:19.555+00', NULL, '2026-09-16 09:34:19.556117+00', '2026-09-16 09:34:19.556117+00'),
('2714c432-eca5-4137-91d9-feed73bceef6', '054 · PART M — BOOSTER OFFERS / 50. "What is a Booster Offer?"', 'BOOSTER OFFERS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"A Booster Offer is a specially selected KAMALO offer where the applicable earning opportunity can be higher than a regular offer. KAMALO highlights these offers because they can provide stronger Coin earning opportunities while also giving merchants more transaction traffic."', '1', 'approved', '2026-09-16 09:34:19.561+00', NULL, '2026-09-16 09:34:19.561673+00', '2026-09-16 09:34:19.561673+00'),
('f1b3e89e-73f0-4981-8ef9-5618234a1656', '055 · PART M — BOOSTER OFFERS / 51. "Why am I getting this Booster?"', 'BOOSTER OFFERS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"We''re showing this Booster because it is currently relevant to your KAMALO journey and has an applicable enhanced earning opportunity. I''ll show you the exact offer terms before you transact."', '1', 'approved', '2026-09-16 09:34:19.568+00', NULL, '2026-09-16 09:34:19.569078+00', '2026-09-16 09:34:19.569078+00'),
('ec226de9-b088-4e1f-9a60-600cc773ac13', '056 · PART M — BOOSTER OFFERS / 52. "Why didn''t I get Booster Coins?"', 'BOOSTER OFFERS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll check the transaction against the Booster''s eligibility conditions, including the offer period, transaction amount and applicable commission rule."', '1', 'approved', '2026-09-16 09:34:19.573+00', NULL, '2026-09-16 09:34:19.57419+00', '2026-09-16 09:34:19.57419+00'),
('4e446ec6-e00d-4904-a552-3e9170414ddd', '058 · PART N — AUTO KAMALO / 54. "Why should I use Auto KAMALO?"', 'AUTO KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"The idea is simple: work once, keep participating every month. Where eligible, your recurring transactions can contribute to your KAMALO earning journey while making recurring payments easier to manage."', '1', 'approved', '2026-09-16 09:34:19.586+00', NULL, '2026-09-16 09:34:19.586879+00', '2026-09-16 09:34:19.586879+00'),
('4ecbfcfd-068a-4c99-bbfc-7f2a063b9345', '059 · PART N — AUTO KAMALO / 55. "My Auto KAMALO payment failed."', 'AUTO KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks mandate + transaction.
"I''ve checked your Auto KAMALO mandate and today''s transaction status. Here''s what happened: [verified reason]. I''ll guide you through the next available action."', '1', 'approved', '2026-09-16 09:34:19.592+00', NULL, '2026-09-16 09:34:19.592993+00', '2026-09-16 09:34:19.592993+00'),
('239156c8-31d9-4f09-ac10-a32740e4f7c5', '060 · PART N — AUTO KAMALO / 56. "How much am I earning from Auto KAMALO?"', 'AUTO KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI calculates from verified Coin/commission records.
"Your Auto KAMALO activity has generated X Coins so far. I''ve also checked how this contributes to your current FINCADO journey."', '1', 'approved', '2026-09-16 09:34:19.598+00', NULL, '2026-09-16 09:34:19.598853+00', '2026-09-16 09:34:19.598853+00'),
('11d6623a-6395-49bf-a583-ce6f966e1294', '061 · PART O — SHOP & KAMALO / 57. "Where can I use KAMALO?"', 'SHOP & KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"You can discover eligible online and offline offers through Shop & KAMALO. Search for what you need and I''ll show you the available offers and applicable earning opportunities."
CTA:
SEARCH OFFERS', '1', 'approved', '2026-09-16 09:34:19.608+00', NULL, '2026-09-16 09:34:19.609023+00', '2026-09-16 09:34:19.609023+00'),
('4d0923e9-a057-4f71-bc61-f87fd3b6c541', '062 · PART O — SHOP & KAMALO / 58. "Do you have Amazon?"', 'SHOP & KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Let me check the current Amazon offers available to you."
Important: AI must query live offer inventory.', '1', 'approved', '2026-09-16 09:34:19.614+00', NULL, '2026-09-16 09:34:19.615191+00', '2026-09-16 09:34:19.615191+00'),
('997dd3bc-780b-4d5e-9c95-3596718fd641', '063 · PART O — SHOP & KAMALO / 59. "Do you have fuel offers?"', 'SHOP & KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Yes, let me check the fuel offers currently available to you and show you the applicable earning and Coin opportunity."', '1', 'approved', '2026-09-16 09:34:19.621+00', NULL, '2026-09-16 09:34:19.621681+00', '2026-09-16 09:34:19.621681+00'),
('dd17cbb5-1fb5-4f88-b0bc-6dca3d2c6ebf', '064 · PART P — NOTIFICATIONS / 60. "Why did I receive this notification?"', 'NOTIFICATIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI retrieves notification event.
"I checked the notification you received. It was triggered because [verified behaviour/offer/expiry/goal event]. We sent it because it was relevant to your current KAMALO activity."', '1', 'approved', '2026-09-16 09:34:19.627+00', NULL, '2026-09-16 09:34:19.628018+00', '2026-09-16 09:34:19.628018+00'),
('92476c8f-501c-4985-b615-49b7be010a32', '065 · PART P — NOTIFICATIONS / 61. "I didn''t receive my notification."', 'NOTIFICATIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks:
Trigger
Eligibility
Notification generated
Delivery
Device permission
"I''ll trace the notification from the moment it was triggered through delivery so we can identify exactly where it stopped."', '1', 'approved', '2026-09-16 09:34:19.634+00', NULL, '2026-09-16 09:34:19.634911+00', '2026-09-16 09:34:19.634911+00'),
('5bb9e17e-78ad-49f8-85f4-235c9b53e804', '066 · PART P — NOTIFICATIONS / 62. "Stop these notifications."', 'NOTIFICATIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Absolutely. You should be in control of the notifications you receive. I''ll take you to your notification preferences so you can choose what you''d like to receive."', '1', 'approved', '2026-09-16 09:34:19.639+00', NULL, '2026-09-16 09:34:19.640186+00', '2026-09-16 09:34:19.640186+00'),
('158df293-88d9-4427-bb88-cb421867766a', '067 · PART Q — PHYSICAL SILVER/GOLD DELIVERY / 63. "Where is my Silver Coin?"', 'PHYSICAL SILVER/GOLD DELIVERY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI checks dispatch.
"I''ve checked your Silver Coin dispatch. Your current status is [status]. Here is the latest verified delivery information."', '1', 'approved', '2026-09-16 09:34:19.646+00', NULL, '2026-09-16 09:34:19.647269+00', '2026-09-16 09:34:19.647269+00');

INSERT INTO public.knowledge_articles (id, title, category, content, version, status, effective_from, effective_until, created_at, updated_at) VALUES
('03181781-648b-4c2c-8ca3-1281eb72ec49', '068 · PART Q — PHYSICAL SILVER/GOLD DELIVERY / 64. "My address is wrong."', 'PHYSICAL SILVER/GOLD DELIVERY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AI must verify whether address editing is still permitted.
"Let''s make sure your KAMALO Coin reaches the right place. I''ll check whether the delivery address can still be changed for this shipment."', '1', 'approved', '2026-09-16 09:34:19.653+00', NULL, '2026-09-16 09:34:19.653674+00', '2026-09-16 09:34:19.653674+00'),
('52e24367-3fa4-4e68-aea2-d8e63c9aaf7b', '069 · PART Q — PHYSICAL SILVER/GOLD DELIVERY / 65. "My Gold Coin hasn''t arrived."', 'PHYSICAL SILVER/GOLD DELIVERY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand how important this milestone is. Let me check your Gold qualification, dispatch and delivery status so I can give you the exact current position."', '1', 'approved', '2026-09-16 09:34:19.659+00', NULL, '2026-09-16 09:34:19.659457+00', '2026-09-16 09:34:19.659457+00'),
('ac99f218-ec0c-4df4-b9f4-a45bb65a7929', '070 · PART R — MERCHANT SUPPORT / 66. "My merchant account isn''t approved."', 'MERCHANT SUPPORT', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll check your merchant onboarding status and identify exactly what is pending so you don''t have to start the process again."', '1', 'approved', '2026-09-16 09:34:19.664+00', NULL, '2026-09-16 09:34:19.664944+00', '2026-09-16 09:34:19.664944+00'),
('66888064-48b2-489f-b7b7-673faea92ad3', '071 · PART R — MERCHANT SUPPORT / 67. "Why hasn''t my settlement arrived?"', 'MERCHANT SUPPORT', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll trace the settlement from the transaction through the settlement record and check whether there is any pending reconciliation."', '1', 'approved', '2026-09-16 09:34:19.671+00', NULL, '2026-09-16 09:34:19.67147+00', '2026-09-16 09:34:19.67147+00'),
('8e32d1a4-dea8-4b9b-909b-05121016df86', '072 · PART R — MERCHANT SUPPORT / 68. "Why is my settlement amount lower?"', 'MERCHANT SUPPORT', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''ll show you the settlement calculation, including the applicable transaction amount, commission and other permitted adjustments, so you can see exactly how the final amount was derived."', '1', 'approved', '2026-09-16 09:34:19.676+00', NULL, '2026-09-16 09:34:19.676721+00', '2026-09-16 09:34:19.676721+00'),
('7af65169-e6c3-4e49-98ca-76a3fe0d5c5a', '073 · PART R — MERCHANT SUPPORT / 69. "Customer says payment succeeded but I haven''t received it."', 'MERCHANT SUPPORT', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Let''s reconcile the transaction before you ask the customer to pay again. I''ll check the payment and merchant settlement records now."', '1', 'approved', '2026-09-16 09:34:19.681+00', NULL, '2026-09-16 09:34:19.6819+00', '2026-09-16 09:34:19.6819+00'),
('ba70cbd1-a3a1-4da0-a627-5bae471dfb84', '074 · PART R — MERCHANT SUPPORT / 70. "How do I create a Booster Offer?"', 'MERCHANT SUPPORT', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Absolutely. I''ll guide you through creating a Booster Offer and show you the fields and eligibility information required before publishing."', '1', 'approved', '2026-09-16 09:34:19.686+00', NULL, '2026-09-16 09:34:19.687247+00', '2026-09-16 09:34:19.687247+00'),
('8ce589c3-c4a2-4a91-9e0c-5e641b7610db', '075 · PART S — UNKNOWN / COMPLEX COMPLAINTS / 71. "This app is useless."', 'UNKNOWN / COMPLEX COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Never become defensive.
"I''m sorry KAMALO hasn''t given you the experience you expected. I''d genuinely like to understand what went wrong and help fix it. Tell me what happened, and I''ll take it from there."', '1', 'approved', '2026-09-16 09:34:19.695+00', NULL, '2026-09-16 09:34:19.695492+00', '2026-09-16 09:34:19.695492+00'),
('48145bd8-5681-447e-9b55-6bad273dcfc5', '076 · PART S — UNKNOWN / COMPLEX COMPLAINTS / 72. "I''m very angry."', 'UNKNOWN / COMPLEX COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand. You don''t need to explain everything twice. Tell me what went wrong, and I''ll first check the relevant KAMALO records and help you from there."', '1', 'approved', '2026-09-16 09:34:19.7+00', NULL, '2026-09-16 09:34:19.700346+00', '2026-09-16 09:34:19.700346+00'),
('cbae58d6-8a7e-45fd-a369-fb8b2a066306', '077 · PART S — UNKNOWN / COMPLEX COMPLAINTS / 73. "Nobody is helping me."', 'UNKNOWN / COMPLEX COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''m sorry you''ve had that experience. Let''s start fresh here. I''ll review the information available to me and make sure you get a clear answer or that the issue is properly recorded for resolution."', '1', 'approved', '2026-09-16 09:34:19.705+00', NULL, '2026-09-16 09:34:19.705668+00', '2026-09-16 09:34:19.705668+00'),
('2cc48b97-24cb-4069-8b7e-0f0ce0a25da2', '078 · PART S — UNKNOWN / COMPLEX COMPLAINTS / 74. "I want to speak to someone."', 'UNKNOWN / COMPLEX COMPLAINTS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"Absolutely. Before we move you to a human team member, I''ll check whether I can resolve this immediately for you. If it requires human intervention, I''ll create the ticket with all the details I''ve already collected so you don''t have to repeat yourself."', '1', 'approved', '2026-09-16 09:34:19.711+00', NULL, '2026-09-16 09:34:19.711519+00', '2026-09-16 09:34:19.711519+00'),
('842c90e5-5fca-4cda-ae9f-18ac4fbbc618', '079 · PART T — FRAUD / SECURITY / 75. "Someone accessed my account."', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I''m taking this seriously. For your protection, I''ll help secure the account and check recent account activity. I won''t expose sensitive information in this conversation."
Trigger security workflow.', '1', 'approved', '2026-09-16 09:34:19.717+00', NULL, '2026-09-16 09:34:19.717648+00', '2026-09-16 09:34:19.717648+00'),
('03905522-01b4-4dfb-9e8e-eea959fa583d', '080 · PART T — FRAUD / SECURITY / 76. "I don''t recognize this transaction."', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

"I understand. An unrecognized transaction should be checked immediately. I''ll help identify the transaction and initiate the applicable security process."', '1', 'approved', '2026-09-16 09:34:19.722+00', NULL, '2026-09-16 09:34:19.722752+00', '2026-09-16 09:34:19.722752+00'),
('9eef1150-e4b9-44eb-98a0-950373880596', '081 · PART T — FRAUD / SECURITY / 77. "Someone used my referral/account."', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Trigger:
SECURITY ESCALATION
Do not allow AI to make unsupported financial adjustments.', '1', 'approved', '2026-09-16 09:34:19.728+00', NULL, '2026-09-16 09:34:19.728943+00', '2026-09-16 09:34:19.728943+00'),
('22673cf0-4498-470f-babf-ba397b8b1703', '082 · PART T — FRAUD / SECURITY / 78. AI TICKET CREATION', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Whenever the AI cannot safely resolve an issue, it should automatically create a ticket.
The customer should see:
"I''ve completed the checks available to me, but this needs an additional review. I''ve created ticket KMXXXXXX and attached the transaction details and checks we''ve already completed. You won''t need to explain everything again."', '1', 'approved', '2026-09-16 09:34:19.733+00', NULL, '2026-09-16 09:34:19.734028+00', '2026-09-16 09:34:19.734028+00'),
('b88c3916-481c-4d74-94c9-2b07114776b6', '083 · PART T — FRAUD / SECURITY / 79. TICKET DATA', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Every ticket should contain:
Ticket ID
User ID
Merchant ID
Conversation ID
Intent
Sub-intent
Transaction ID
Order ID
Offer ID
Engine involved
Issue description
AI investigation
API responses
Actions attempted
Attachments
Priority
Created timestamp
First response timestamp
SLA
Escalation timestamp
Resolution timestamp
Closure timestamp
Customer rating', '1', 'approved', '2026-09-16 09:34:19.741+00', NULL, '2026-09-16 09:34:19.74163+00', '2026-09-16 09:34:19.74163+00'),
('aa6e43a9-9f14-43ca-9b5e-94f4c57a82d1', '084 · PART T — FRAUD / SECURITY / 80. NO-REPEAT PRINCIPLE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

This should be a core KAMALO rule:
Never ask the customer for information KAMALO already has.
If the user has already provided:
Transaction ID
Amount
Merchant
Date
AI should retain it.
If the authenticated account already provides it, AI should retrieve it.', '1', 'approved', '2026-09-16 09:34:19.746+00', NULL, '2026-09-16 09:34:19.74715+00', '2026-09-16 09:34:19.74715+00'),
('bf93a8a5-34fb-4c7f-aa46-81ffcf657708', '085 · PART T — FRAUD / SECURITY / 81. PERSONALIZATION ENGINE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The AI should understand the user''s current KAMALO state.
For example:
User:
Rahul

Coins:
26,500

Silver:
30,000

Gap:
3,500

Expiring:
1,000

Gold:
₹11,800 / current target

Community Silver:
73 / 100
Then the AI can say:
"Rahul, you''re only 3,500 Coins away from your current Silver milestone. You also have 1,000 Coins approaching expiry, so let''s look at eligible options where you can use them and continue your journey."
This is much better than:
"Please see our FAQ."', '1', 'approved', '2026-09-16 09:34:19.756+00', NULL, '2026-09-16 09:34:19.756536+00', '2026-09-16 09:34:19.756536+00'),
('21f1d58c-7385-4c54-a8f8-cedd53a5b8c1', '086 · PART T — FRAUD / SECURITY / 82. KAMALO AI HOME SUPPORT', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The support screen should not only have a blank chat box.
Suggested:
How can I help you today?
Then dynamic shortcuts:
Where are my Coins?
How close am I to Silver?
How do I reach Gold?
Track my transaction
Check my refund
Show my expiring Coins
Show today''s best offers
Check my Auto KAMALO
My referral
Something went wrong', '1', 'approved', '2026-09-16 09:34:19.761+00', NULL, '2026-09-16 09:34:19.762202+00', '2026-09-16 09:34:19.762202+00'),
('3f702333-2a7f-4a83-b904-ec411e0656db', '087 · PART T — FRAUD / SECURITY / 83. PROACTIVE SUPPORT', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The AI should also initiate help.
Example:
User transaction fails.
Immediately:
"It looks like your transaction didn''t complete. Would you like me to check it for you?"
User has expiring Coins:
"You have 1,000 Coins approaching expiry. I''ve found eligible offers you can explore."
User gets close to Silver:
"You''re getting close to Silver. You need X more eligible Coins."
Refund delayed:
"Your refund is still being processed. Here''s the latest status."', '1', 'approved', '2026-09-16 09:34:19.767+00', NULL, '2026-09-16 09:34:19.767745+00', '2026-09-16 09:34:19.767745+00'),
('250d08ec-01b3-484a-a0b3-5c7db4b46bd8', '088 · PART T — FRAUD / SECURITY / 84. RATING SYSTEM', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

After every resolved conversation:
KAMALO asks:
"Did I take good care of this for you?"
Buttons:
Excellent
Good
Okay
Not Helpful
Still Need Help
Then:
"What could we have done better?"
Optional text.', '1', 'approved', '2026-09-16 09:34:19.773+00', NULL, '2026-09-16 09:34:19.77328+00', '2026-09-16 09:34:19.77328+00'),
('5fe6d0df-8074-412f-8642-7af7c6e5d933', '089 · PART T — FRAUD / SECURITY / 85. SUPPORT EXPERIENCE SCORE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Create an internal:
KAMALO SUPPORT EXPERIENCE SCORE
Based on:
Resolution
Accuracy
Customer rating
Response time
Repeat contact
Escalation
Correctness of resolution
Do not use a single AI confidence score as a substitute for actual quality measurement.', '1', 'approved', '2026-09-16 09:34:19.78+00', NULL, '2026-09-16 09:34:19.78044+00', '2026-09-16 09:34:19.78044+00'),
('71d26def-2f75-4c28-b0a6-c28f370f5129', '090 · PART T — FRAUD / SECURITY / 86. AI QUALITY SCORECARD', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Every conversation can internally be evaluated on:
Metric
Question
Accuracy
Was the answer factually correct?
Verification
Did AI use the correct engine?
Resolution
Was issue actually resolved?
Warmth
Was customer treated respectfully?
Personalization
Did AI use relevant customer context?
Clarity
Was answer easy to understand?
Efficiency
Did AI avoid unnecessary questions?
Safety
Did AI stay within permissions?
CTA
Was the next action clear?', '1', 'approved', '2026-09-16 09:34:19.785+00', NULL, '2026-09-16 09:34:19.78592+00', '2026-09-16 09:34:19.78592+00'),
('d4f5c87c-1717-4a4e-a2cf-95a23bc27894', '091 · PART T — FRAUD / SECURITY / 87. "NO HUMAN INTERVENTION" TARGET', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The technology goal can be:
Tier 1
AI answers
Tier 2
AI investigates
Tier 3
AI resolves through APIs
Tier 4
AI monitors
Tier 5
AI escalates only exceptions
The aim should be maximum safe automation, rather than forcing 100% automation where a financial/security exception genuinely requires human review.', '1', 'approved', '2026-09-16 09:34:19.791+00', NULL, '2026-09-16 09:34:19.79136+00', '2026-09-16 09:34:19.79136+00'),
('ab546c65-ed2a-41b9-8330-09616b8b3023', '092 · PART T — FRAUD / SECURITY / 88. MASTER AI RESPONSE RULE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The AI should never say:
"I think..."
"Probably..."
"Maybe..."
"It should be..."
For account-specific matters, use:
"I''ve checked..."
only when the system actually checked.
If information is unavailable:
"I couldn''t verify that from the information currently available."
That sentence builds more trust than a fabricated answer.', '1', 'approved', '2026-09-16 09:34:19.797+00', NULL, '2026-09-16 09:34:19.797746+00', '2026-09-16 09:34:19.797746+00'),
('7fbc555a-55a8-47c9-8e22-c6179fbda57c', '093 · PART T — FRAUD / SECURITY / 89. AI SHOULD REMEMBER THE CONVERSATION', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Within an authenticated support session:
Customer:
My Amazon payment failed.

AI:
I''ll check it.

Customer:
It was ₹5,000.

AI:
Thank you. I''ve found the ₹5,000 transaction.

Customer:
What about my Coins?

AI:
I''ve already checked that transaction. It was not completed successfully, so no transaction-based Coins were generated.
The customer should never need to repeat the context.', '1', 'approved', '2026-09-16 09:34:19.803+00', NULL, '2026-09-16 09:34:19.80338+00', '2026-09-16 09:34:19.80338+00'),
('f0fd139b-9dde-45fc-9ef0-8ae0b43b8b15', '094 · PART T — FRAUD / SECURITY / 90. MASTER KAMALO SUPPORT CATEGORIES', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The initial AI knowledge base should therefore cover at least:
ACCOUNT
Registration, OTP, login, profile, security
TRANSACTION
Payment, failure, pending, refund, duplicate, reversal
COMMISSION
Calculation, eligibility, pending, reversal, referral
COINS
Balance, earning, conversion, expiry, FIFO, redemption
SILVER
Progress, eligibility, achievement, physical delivery
GOLD
Personal target, community target, qualification, delivery
FINCADO
Goals, progress, recommendations, daily drives, streaks
BOOSTER
Eligibility, enhanced earning, transaction
AUTO KAMALO
Mandates, payments, earnings, failures
SHOP
Offers, categories, merchants, vouchers
REFERRALS
Links, registration, direct/indirect community, earnings
NOTIFICATIONS
Triggers, delivery, preferences
MERCHANT
Onboarding, offers, transactions, settlements, analytics
SECURITY
Unauthorized transactions, account takeover, fraud
TICKETS
Creation, SLA, tracking, escalation, closure', '1', 'approved', '2026-09-16 09:34:19.808+00', NULL, '2026-09-16 09:34:19.808718+00', '2026-09-16 09:34:19.808718+00'),
('3aa92a22-91a7-4ee6-a983-9d2a76911346', '095 · PART T — FRAUD / SECURITY / 91. THE MOST IMPORTANT DEVELOPMENT REQUIREMENT', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

I would make this a structured AI knowledge system, not one giant prompt.
For every intent, the tech team should create a record like:
INTENT ID:
COIN_NOT_CREDITED

USER PHRASES:
"Where are my coins?"
"I didn''t get my coins"
"My coins are missing"
"Why didn''t I earn coins?"

REQUIRED ENGINES:
Transaction
Commission
Coin

REQUIRED DATA:
Transaction ID
Amount
Merchant
Date

CHECKS:', '1', 'approved', '2026-09-16 09:34:19.814+00', NULL, '2026-09-16 09:34:19.815045+00', '2026-09-16 09:34:19.815045+00'),
('0acae1cb-ad94-4ff3-8723-34a9aa7fbe1b', '096 · PART T — FRAUD / SECURITY / 5. Coin credit status', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

AUTO RESOLUTION:
Coin reconciliation if permitted

ESCALATION:
If reconciliation fails

PRIORITY:
P2

AI RESPONSE STYLE:
Warm + concise + personalized

SUCCESS CTA:
VIEW MY COINS

FAILURE CTA:
VIEW MY TICKET
This structure can be replicated for every single intent.', '1', 'approved', '2026-09-16 09:34:19.82+00', NULL, '2026-09-16 09:34:19.820635+00', '2026-09-16 09:34:19.820635+00'),
('b889f0c7-4b08-4541-b686-cad17cf1b28e', '097 · PART T — FRAUD / SECURITY / 92. THE FINAL KAMALO AI EXPERIENCE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The customer should feel that:
KAMALO knows me.
KAMALO knows my transaction.
KAMALO knows my Coins.
KAMALO knows my goal.
KAMALO knows what went wrong.
KAMALO knows what I should do next.
And most importantly:
I don''t have to explain myself again.', '1', 'approved', '2026-09-16 09:34:19.825+00', NULL, '2026-09-16 09:34:19.825663+00', '2026-09-16 09:34:19.825663+00'),
('8fabc9fc-4586-4daf-b7a6-4701c555957e', '098 · PART T — FRAUD / SECURITY / 93. KAMALO AI — THE PROMISE', 'FRAUD / SECURITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

The entire support philosophy can be reduced to one line for the development team:
"Don''t just answer the question. Understand the person, check the facts, solve the problem and take them one step forward."
And the technical philosophy:
AI + Live Engine Data + Controlled Actions + Ticket/SLA + Feedback Loop
That combination is what turns KAMALO AI from a conventional FAQ chatbot into a true customer resolution system.', '1', 'approved', '2026-09-16 09:34:19.83+00', NULL, '2026-09-16 09:34:19.830583+00', '2026-09-16 09:34:19.830583+00'),
('d144385d-5bb4-42fc-ac33-7acb2903b217', 'Guru guidance / 003 · 2. GUIDE / Overview', 'Guru / GUIDE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Tell the user what they can do next.', '2', 'archived', '2026-09-17 06:48:41.351+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.35238+00', '2026-09-22 06:19:07.061+00'),
('13bb6126-7707-4b30-b9dc-4f9e645d000f', 'Commission structure and processing', 'Commission', 'The current KAMALO support training guidance documents a 5-level commission structure. Commission processing is associated with successful transactions. Individual level percentages, eligibility, personal commission balances, payout amounts, and payout dates must not be invented and require verified account information where applicable.', '1', 'approved', '2026-09-16 12:28:11.789+00', NULL, '2026-09-16 12:28:11.789852+00', '2026-09-16 12:28:11.789852+00'),
('b04a770f-225d-4fd8-b327-95b79c3c0cb6', 'Coin conversion, value, and expiry', 'Coins', 'The current KAMALO support training guidance documents a 1 Rupee to 1 Coin relationship within the reward system. It documents Silver at approximately ₹300 per gram and Gold at approximately ₹17,000 to ₹18,000. These are documented approximate reward values, not guaranteed returns. Coin expiration follows the documented 3-month FIFO approach, where the oldest applicable Coins are handled first.', '1', 'approved', '2026-09-16 12:28:11.818+00', NULL, '2026-09-16 12:28:11.819153+00', '2026-09-16 12:28:11.819153+00'),
('62422391-f540-4019-b277-7e969db5d037', 'FINCADO analytics and progress', 'FINCADO', 'FINCADO is KAMALO''s analytics and progress experience. Documented capabilities include pie charts, community statistics, user progress, Silver progress, Gold progress, Coin-related progress, Coin-expiration handling, and festival-related rollover bonus functionality. Stage 1 cannot inspect a customer''s live FINCADO data.', '1', 'approved', '2026-09-16 12:28:11.83+00', NULL, '2026-09-16 12:28:11.831805+00', '2026-09-16 12:28:11.831805+00'),
('6ba3922c-64cd-4da7-9098-39ade21ff8f5', 'Notification scenarios', 'Notifications', 'Documented KAMALO notification scenarios include abandoned carts, sign-ins, successful transactions, failed transactions, Coin updates, and new offers. KAMALO AI must not claim that a notification was or was not sent without trusted live event information.', '1', 'approved', '2026-09-16 12:28:11.837+00', NULL, '2026-09-16 12:28:11.83832+00', '2026-09-16 12:28:11.83832+00'),
('1b33de05-2810-41d0-89b9-a50d445bcb9e', 'OTP support', 'OTP', 'OTP means One-Time Password and is used in applicable KAMALO authentication and verification flows. For an OTP issue, a customer should confirm that the registered mobile number is correct and that the device can receive messages, then try requesting another OTP. Persistent issues should be escalated through KAMALO support. OTPs and authentication implementation details must never be revealed.', '1', 'approved', '2026-09-16 12:28:11.845+00', NULL, '2026-09-16 12:28:11.845697+00', '2026-09-16 12:28:11.845697+00'),
('caefcf06-43aa-494b-9b3e-91b23c9c6511', 'Wallet, prepaid card, WhatsApp, and offers boundaries', 'Product boundaries', 'KAMALO AI may explain only approved customer-facing capabilities for WhatsApp, PPI wallet, prepaid cards, and offers. It must not invent wallet limits, fees, KYC requirements, withdrawal or transfer rules, settlement times, card fees, card limits, delivery times, ATM rules, network details, international usage, current promotions, or customer eligibility unless explicitly confirmed by approved knowledge or a trusted live source.', '1', 'approved', '2026-09-16 12:28:11.852+00', NULL, '2026-09-16 12:28:11.852453+00', '2026-09-16 12:28:11.852453+00'),
('e2750e32-e743-44c8-bece-b1f17be89aa8', 'Guru guidance / 001 · KAMALO Guru / Overview', 'Guru / KAMALO Guru', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

KAMALO GURU
AI Mentor & Growth Coach — Complete Q&A Knowledge Base
Purpose: Teach every user how to KAMALO FAST, KAMALO BIG & AUTOMATE KAMALO', '2', 'archived', '2026-09-17 06:48:41.069+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.071841+00', '2026-09-22 06:19:07.061+00'),
('03bf614a-7e55-4b74-9920-123b799d3a12', 'Guru guidance / 002 · 1. THE KAMALO GURU PHILOSOPHY / Overview', 'Guru / THE KAMALO GURU PHILOSOPHY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The Guru should never sound like a sales bot.
It should feel like:
“I have understood where you are in your KAMALO journey. Let me show you what you can do next.”
The Guru has 4 jobs:
1. EDUCATE
Explain KAMALO in simple language.', '2', 'archived', '2026-09-17 06:48:41.343+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.344091+00', '2026-09-22 06:19:07.061+00');

INSERT INTO public.knowledge_articles (id, title, category, content, version, status, effective_from, effective_until, created_at, updated_at) VALUES
('7b62003e-1c81-47c4-ae91-0005944d47cd', 'Guru guidance / 004 · 3. PERSONALIZE / Overview', 'Guru / PERSONALIZE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Use their actual account data.', '2', 'archived', '2026-09-17 06:48:41.359+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.359787+00', '2026-09-22 06:19:07.061+00'),
('3657cd27-f512-4fb5-bfda-3e70988eb937', 'Guru guidance / 005 · 4. MOTIVATE / Q1. What is KAMALO?', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Answer:
KAMALO is built around a simple idea: Kharcha Karo, KAMALO.
You use KAMALO to discover eligible offers, make everyday transactions, earn KAMALO Coins and work toward bigger milestones such as Silver and Gold.
Instead of treating everyday spending as just an expense, KAMALO helps you make your eligible Kharcha more rewarding.
CTA:
START MY KAMALO JOURNEY', '2', 'archived', '2026-09-17 06:48:41.367+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.367668+00', '2026-09-22 06:19:07.061+00'),
('5283fefb-1fe9-4670-8b45-5ad0e6a71bbe', 'Guru guidance / 006 · 4. MOTIVATE / Q2. What does "Kharcha Karo, KAMALO" mean?', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

It means your everyday eligible expenses can become opportunities to earn rewards through KAMALO.
The more intelligently you use eligible KAMALO offers, the more opportunities you have to earn Coins and progress toward your goals.', '2', 'archived', '2026-09-17 06:48:41.376+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.377569+00', '2026-09-22 06:19:07.061+00'),
('c47656fc-6b8c-41c5-8280-f96d919ddcfe', 'Guru guidance / 007 · 4. MOTIVATE / Q3. What is the KAMALO Coin?', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

KAMALO Coin is the reward unit used inside KAMALO.
1 Coin = 1 paisa
100 Coins = ₹1
1,000 Coins = ₹10
Coins can be earned through eligible actions and transactions and can be used according to the applicable redemption rules.', '2', 'archived', '2026-09-17 06:48:41.384+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.385602+00', '2026-09-22 06:19:07.061+00'),
('c2150b81-b8a1-4b3a-b08a-1fefe716119b', 'Guru guidance / 008 · 4. MOTIVATE / Q4. Do I get cash instead of Coins?', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

KAMALO''s reward system is Coin-based. Eligible earning amounts are converted into KAMALO Coins according to the applicable Coin Engine rules rather than being shown as direct cash payouts.', '2', 'archived', '2026-09-17 06:48:41.393+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.394048+00', '2026-09-22 06:19:07.061+00'),
('2311f82b-b620-4862-966c-6b3e9f03669f', 'Guru guidance / 009 · 4. MOTIVATE / Q5. Why does KAMALO use Coins?', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Because KAMALO is designed as a journey rather than a one-time cashback experience.
Your Coins accumulate, can be redeemed when eligible and also help you progress toward your Silver and Gold milestones.', '2', 'archived', '2026-09-17 06:48:41.405+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.406099+00', '2026-09-22 06:19:07.061+00'),
('7041fed7-9d65-4c63-8412-e1a4cd02b3c8', 'Guru guidance / 010 · 4. MOTIVATE / Overview', 'Guru / MOTIVATE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Help them progress toward Silver and Gold.

2. THREE CORE KAMALO JOURNEYS
Every answer should ultimately help the user understand one of these:
KAMALO FAST
How can I reach my next milestone efficiently?
KAMALO BIG
How can I increase my eligible earning opportunities through personal + community activity?
AUTOMATE KAMALO
How can I set up recurring eligible activities so I don''t have to repeat the same work every month?
The AI should avoid promising guaranteed earnings.
Instead of:
“You will earn ₹10,000.”
Say:
“Based on your current activity and the applicable earning rules, this route could generate approximately X Coins if all eligible conditions are met.”

3. MASTER KAMALO GURU MENU
When a user opens Guru:
What would you like to learn?
What is KAMALO?
How do I earn Coins?
How do I get Silver?
How do I get Gold?
How can I KAMALO FAST?
How can I KAMALO BIG?
How can I automate KAMALO?
How does community earning work?
What should I do today?
Show me my KAMALO plan

4. BASIC KAMALO QUESTIONS', '2', 'archived', '2026-09-17 06:48:41.412+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.412846+00', '2026-09-22 06:19:07.061+00'),
('acae583a-6a83-428b-ab2f-2916179fa723', 'Guru guidance / 011 · 5. JOINING KAMALO / Q6. What do I get when I join?', 'Guru / JOINING KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

When you register, you receive 1,000 KAMALO Coins as the welcome bonus, equivalent to ₹10 in applicable Coin value.
CTA:
USE MY 1,000 COINS', '2', 'archived', '2026-09-17 06:48:41.417+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.418366+00', '2026-09-22 06:19:07.061+00'),
('a012f02b-e310-4bfa-91fc-5f298bb53f05', 'Guru guidance / 012 · 5. JOINING KAMALO / Q7. What should I do after joining?', 'Guru / JOINING KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Your first objective is simple:
Join → Start → Experience → Earn
Start by exploring the KAMALO Hottest Offers on your homepage. Choose an offer relevant to something you already need, complete an eligible transaction and experience your first KAMALO earning journey.', '2', 'archived', '2026-09-17 06:48:41.427+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.427562+00', '2026-09-22 06:19:07.061+00'),
('7758ecf4-1f77-4677-a17a-985b5bc55b69', 'Guru guidance / 013 · 6. HOW TO EARN COINS / Q8. How can I earn KAMALO Coins?', 'Guru / HOW TO EARN COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

There are two main ways:
1. Action-Based Coins — Coins earned for eligible activities such as registration, daily activity and referrals.
2. Transaction-Based Coins — Coins generated from eligible transactions according to KAMALO''s Commission Engine.
Your transaction earning is converted into Coins under the applicable Coin formula.', '2', 'archived', '2026-09-17 06:48:41.432+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.433447+00', '2026-09-22 06:19:07.061+00'),
('293ae10e-2ddf-47a5-9d83-7d7ba78c96fd', 'Guru guidance / 014 · 6. HOW TO EARN COINS / Q9. What are Action-Based Coins?', 'Guru / HOW TO EARN COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

These are Coins you can earn for completing eligible KAMALO activities.
Examples can include:
• Registration — 1,000 Coins
• Daily sign-in — applicable Coins
• Eligible referral — applicable Coins
• Other approved activities — applicable Coins
The AI should always retrieve the current configured reward value instead of hardcoding values that may change.', '2', 'archived', '2026-09-17 06:48:41.439+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.440658+00', '2026-09-22 06:19:07.061+00'),
('2bb5c778-ae6d-4ca6-9b85-7b2c4f3fea77', 'Guru guidance / 015 · 6. HOW TO EARN COINS / Q10. What are Transaction-Based Coins?', 'Guru / HOW TO EARN COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

When you complete an eligible transaction through KAMALO, the Commission Engine determines the applicable earning.
That earning is converted into KAMALO Coins.
For example, if the applicable earning is ₹1, KAMALO can credit 100 Coins rather than ₹1, subject to the applicable rules.', '2', 'archived', '2026-09-17 06:48:41.445+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.445985+00', '2026-09-22 06:19:07.061+00'),
('becf2577-785d-4222-a3cf-4d6c60a1019e', 'Guru guidance / 016 · 7. HOW TO REDEEM / Q11. What is the minimum redemption?', 'Guru / HOW TO REDEEM', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The minimum redemption threshold is 1,000 Coins, equivalent to ₹10 in applicable redemption value.', '2', 'archived', '2026-09-17 06:48:41.451+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.45164+00', '2026-09-22 06:19:07.061+00'),
('a96a6b36-fa16-4522-98bb-5b44a4a49f08', 'Guru guidance / 017 · 7. HOW TO REDEEM / Q12. I have 800 Coins. What should I do?', 'Guru / HOW TO REDEEM', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

You''re only 200 Coins away from the current minimum redemption threshold.
Rather than stopping here, let''s look at your eligible offers and activities that can help you reach the next 1,000-Coins milestone.
CTA:
EARN 200 MORE', '2', 'archived', '2026-09-17 06:48:41.456+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.456494+00', '2026-09-22 06:19:07.061+00'),
('68ff4da2-fa56-4a01-891f-569219c61f2c', 'Guru guidance / 018 · 8. SILVER KAMALO COIN / Q13. What is a Silver KAMALO Coin?', 'Guru / SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Silver is your first major KAMALO milestone.
Your FINCADO journey tracks your progress toward the applicable Silver milestone and shows you what actions and transactions can help you reach it.', '2', 'archived', '2026-09-17 06:48:41.461+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.462072+00', '2026-09-22 06:19:07.061+00'),
('12584b24-c4ea-4780-9ce2-a9eb9ebf3f08', 'Guru guidance / 019 · 8. SILVER KAMALO COIN / Q14. How do I earn Silver?', 'Guru / SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Start with FINCADO.
Tell KAMALO when you want to achieve your Silver milestone — for example, within 1 day, 3 days, 7 days or 1 month.
KAMALO then shows eligible actions and offers that can help you progress toward your goal.
CTA:
SET MY SILVER GOAL', '2', 'archived', '2026-09-17 06:48:41.469+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.470404+00', '2026-09-22 06:19:07.061+00'),
('bc951731-5843-4267-be33-a2489ad7273e', 'Guru guidance / 020 · 8. SILVER KAMALO COIN / Q15. What is the Silver target?', 'Guru / SILVER KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI should retrieve the user''s current configured Silver milestone from FINCADO.
“Your current Silver milestone is X Coins. You have already earned Y Coins and have Z Coins remaining.”
Never hard-code a target into the conversational AI.', '2', 'archived', '2026-09-17 06:48:41.481+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.482351+00', '2026-09-22 06:19:07.061+00'),
('7f1b50ad-2cdf-497c-9a16-a2c91ca0654f', 'Guru guidance / 021 · 9. "HOW DO I GET SILVER FAST?" / Q16. What is the fastest way to earn Silver?', 'Guru / "HOW DO I GET SILVER FAST?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The best approach is not simply to spend more. It is to use the right eligible transactions at the right time.
I would look at:
Your current Coin balance
Coins approaching expiry
Available Booster Offers
Your normal monthly expenses
Auto KAMALO opportunities
Referral/community opportunities
Then KAMALO can show you the available routes toward your current Silver milestone.
CTA:
SHOW MY SILVER PLAN', '2', 'archived', '2026-09-17 06:48:41.488+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.489182+00', '2026-09-22 06:19:07.061+00'),
('09b482db-727b-4cfe-9b66-7a1843ecb5a9', 'Guru guidance / 022 · 9. "HOW DO I GET SILVER FAST?" / Overview', 'Guru / "HOW DO I GET SILVER FAST?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

This is one of the most important Guru intents.', '2', 'archived', '2026-09-17 06:48:41.495+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.496355+00', '2026-09-22 06:19:07.061+00'),
('bca6cecc-865f-4843-9375-55925a3f74dd', 'Guru guidance / 023 · 10. SILVER STRATEGY / Q17. What is my Silver strategy?', 'Guru / SILVER STRATEGY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI should dynamically construct:
CURRENT COINS
+
EXPIRING COINS
+
BOOSTER OPPORTUNITIES
+
REGULAR TRANSACTIONS
+
AUTO KAMALO
=
SILVER PLAN
Example response:
You''re currently X Coins away from Silver.
Your best available opportunities are:
1. Use your expiring Coins
2. Complete an eligible Booster transaction
3. Add recurring expenses to Auto KAMALO
4. Share eligible referral opportunities
I''ll show you the actual offers currently available to your account.', '2', 'archived', '2026-09-17 06:48:41.505+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.505526+00', '2026-09-22 06:19:07.061+00'),
('11288a46-1958-45cf-9f1f-7a8c98158528', 'Guru guidance / 024 · 11. PHYSICAL SILVER COIN / Q18. Do I actually receive a physical Silver Coin?', 'Guru / PHYSICAL SILVER COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Yes. Once you qualify under the applicable Silver milestone rules, KAMALO can arrange dispatch of the branded physical KAMALO Silver Coin to your registered delivery address, subject to the applicable verification and fulfilment process.', '2', 'archived', '2026-09-17 06:48:41.512+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.513083+00', '2026-09-22 06:19:07.061+00'),
('b147a6e5-ee09-438c-ad7c-2a06750f36de', 'Guru guidance / 025 · 11. PHYSICAL SILVER COIN / Q19. When will I receive my Silver Coin?', 'Guru / PHYSICAL SILVER COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

AI checks qualification + dispatch.
Congratulations on reaching your Silver milestone. I''ve checked your fulfilment status and your Silver Coin is currently [status].', '2', 'archived', '2026-09-17 06:48:41.517+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.517998+00', '2026-09-22 06:19:07.061+00'),
('b320bef9-3826-43ba-aca3-8904a91c7b06', 'Guru guidance / 026 · 12. GOLD KAMALO COIN / Q20. What is Gold KAMALO Coin?', 'Guru / GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Gold is the next major milestone after Silver.
It combines your personal KAMALO journey with the applicable community milestone, creating a bigger goal around your own activity and the activity of your eligible community.', '2', 'archived', '2026-09-17 06:48:41.524+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.524663+00', '2026-09-22 06:19:07.061+00'),
('265617d7-eb79-427d-bcff-4d4f8f2ea169', 'Guru guidance / 027 · 12. GOLD KAMALO COIN / Q21. How do I earn Gold?', 'Guru / GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Your Gold journey has two important components:
Personal achievement — reach the applicable personal Coin/earning milestone.
Community achievement — help the applicable number of people in your eligible community reach the Silver milestone.
FINCADO tracks both and tells you what remains.', '2', 'archived', '2026-09-17 06:48:41.529+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.530181+00', '2026-09-22 06:19:07.061+00'),
('787e055f-6a65-4704-8f8b-ee326ebf60cf', 'Guru guidance / 028 · 12. GOLD KAMALO COIN / Q22. What is the Gold personal target?', 'Guru / GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Your personal Gold target is linked to the applicable Gold milestone and may change with the relevant gold-price benchmark.
I''ll show you your current applicable target rather than using an old fixed number.', '2', 'archived', '2026-09-17 06:48:41.536+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.536894+00', '2026-09-22 06:19:07.061+00'),
('5311d13f-288b-4525-8ffd-e8f5eac21bdb', 'Guru guidance / 029 · 12. GOLD KAMALO COIN / Q23. What is the Gold community target?', 'Guru / GOLD KAMALO COIN', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The current mission is designed around approximately 100 eligible community members achieving Silver, subject to the applicable rules and milestone configuration.
The exact qualification should always be determined by FINCADO rather than by simply counting referrals.
This distinction is important.', '2', 'archived', '2026-09-17 06:48:41.544+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.544797+00', '2026-09-22 06:19:07.061+00'),
('9eb0bebf-d922-41dd-95cd-8826e24363d2', 'Guru guidance / 030 · 13. GOLD STRATEGY / Q24. How can I reach Gold faster?', 'Guru / GOLD STRATEGY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Gold is a combination of your own KAMALO journey + your community journey.
Your strategy should therefore have two tracks:
TRACK 1 — MY KHARCHA
Use relevant eligible offers, Booster Offers and Auto KAMALO to increase your personal Coin accumulation.
TRACK 2 — COMMUNITY KHARCHA
Share your referral journey, help eligible community members understand KAMALO and encourage them to use the platform properly so they can work toward their own Silver milestones.
FINCADO will show you how many eligible community Silver achievers you currently have and how many remain.
CTA:
VIEW MY GOLD PLAN', '2', 'archived', '2026-09-17 06:48:41.552+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.553135+00', '2026-09-22 06:19:07.061+00'),
('55068bde-2664-486f-a76a-b26f623f9c97', 'Guru guidance / 031 · 14. COMMUNITY EARNING / Q25. What is Community Kharcha?', 'Guru / COMMUNITY EARNING', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Community Kharcha is the eligible transaction activity generated by people connected to your KAMALO community under the applicable referral and Commission Engine rules.
Your community can therefore become another part of your KAMALO journey.', '2', 'archived', '2026-09-17 06:48:41.558+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.55879+00', '2026-09-22 06:19:07.061+00'),
('45cf2c51-7358-4c89-80f5-af671dba8c9e', 'Guru guidance / 032 · 14. COMMUNITY EARNING / Q26. How do I earn from my community?', 'Guru / COMMUNITY EARNING', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Share your eligible KAMALO referral link, help people join and encourage them to discover and use relevant KAMALO offers.
Where transactions qualify under the Commission Engine, the applicable community earning can generate Coins for you according to the configured rules.', '2', 'archived', '2026-09-17 06:48:41.566+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.566876+00', '2026-09-22 06:19:07.061+00'),
('b07f4a5e-15c4-4e96-976e-9b6ee3fb3af5', 'Guru guidance / 033 · 14. COMMUNITY EARNING / Q27. Do I have to personally transact every time?', 'Guru / COMMUNITY EARNING', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

No. That''s one of the important ideas behind Automate KAMALO.
You can set up eligible recurring activities through Auto KAMALO and build a community where eligible transactions continue to happen.
Your actual earning depends on eligible transactions and the applicable Commission Engine rules.', '2', 'archived', '2026-09-17 06:48:41.574+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.574529+00', '2026-09-22 06:19:07.061+00'),
('d5d4d0dc-c5bd-4336-acdd-c135598961d4', 'Guru guidance / 034 · 15. AUTOMATE KAMALO / Q28. What does "Automate KAMALO" mean?', 'Guru / AUTOMATE KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Work once. Keep earning from eligible activity.
Auto KAMALO allows you to add eligible recurring payments or mandates so that your regular expenses can continue participating in the KAMALO journey without requiring the same manual effort every month.', '2', 'archived', '2026-09-17 06:48:41.58+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.581212+00', '2026-09-22 06:19:07.061+00'),
('d20109e6-1b02-4141-902b-ef186e8fecb2', 'Guru guidance / 035 · 15. AUTOMATE KAMALO / Q29. What should I put in Auto KAMALO?', 'Guru / AUTOMATE KAMALO', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Start with expenses you already pay regularly.
Look for eligible categories such as:
• Bills
• Fuel
• Grocery
• Travel
• Subscriptions
• Other recurring expenses available through KAMALO
The AI should show currently supported apps, not a static list.', '2', 'archived', '2026-09-17 06:48:41.586+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.587761+00', '2026-09-22 06:19:07.061+00'),
('6a14fe0a-7070-4208-b85a-3c61d6ee850e', 'Guru guidance / 036 · 16. AUTO KAMALO STRATEGY / Q30. What is the best Auto KAMALO strategy?', 'Guru / AUTO KAMALO STRATEGY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Start with your own recurring expenses first.
Then share your referral link with your community and help them identify recurring expenses they already have.
The objective is simple:
Set up once → transact regularly → earn eligible Coins → progress toward Silver/Gold.', '2', 'archived', '2026-09-17 06:48:41.598+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.600847+00', '2026-09-22 06:19:07.061+00'),
('653dd9b0-557b-4ebd-9473-a1179351847e', 'Guru guidance / 037 · 17. BOOSTER STRATEGY / Q31. What are Booster Offers?', 'Guru / BOOSTER STRATEGY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Booster Offers are selected offers where KAMALO may have a stronger earning opportunity because of the applicable merchant/partner commission structure.
These offers can provide enhanced Coin opportunities to users while helping participating merchants generate more transactions.', '2', 'archived', '2026-09-17 06:48:41.607+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.607611+00', '2026-09-22 06:19:07.061+00'),
('0463dc0e-1b87-4c7b-a76c-e862ce61f004', 'Guru guidance / 038 · 17. BOOSTER STRATEGY / Q32. Should I always use Booster Offers?', 'Guru / BOOSTER STRATEGY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Not necessarily.
The smartest approach is to use a Booster when it matches something you genuinely need and the offer terms are attractive.
Don''t spend just to earn Coins. Use KAMALO for expenses you actually need.
This should be a core KAMALO Guru principle.', '2', 'archived', '2026-09-17 06:48:41.615+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.615627+00', '2026-09-22 06:19:07.061+00'),
('edfe9b73-2307-42fc-a745-1281c9f6c18f', 'Guru guidance / 039 · 18. EXPIRING COINS / Q33. What Coins are expiring?', 'Guru / EXPIRING COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

AI checks FIFO ledger.
You currently have X Coins scheduled to expire in X days.
I''ve also found eligible opportunities where you may be able to use those Coins.
CTA:
USE EXPIRING COINS', '2', 'archived', '2026-09-17 06:48:41.621+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.621985+00', '2026-09-22 06:19:07.061+00'),
('b9e73d6e-1a86-4ee5-b5c9-b9e3665a3491', 'Guru guidance / 040 · 18. EXPIRING COINS / Q34. How does FIFO work?', 'Guru / EXPIRING COINS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

KAMALO uses a First In, First Out (FIFO) Coin model.
This means older eligible Coin batches are considered first according to the applicable redemption/expiry rules.', '2', 'archived', '2026-09-17 06:48:41.627+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.627953+00', '2026-09-22 06:19:07.061+00'),
('d7fac512-22a6-42a3-a223-e330cbd7c6f7', 'Guru guidance / 041 · 19. "WHAT SHOULD I DO TODAY?" / Q35. What should I do today to KAMALO?', 'Guru / "WHAT SHOULD I DO TODAY?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

This should be one of the most important AI functions.
The AI reads:
Current Coins
Silver progress
Gold progress
Expiry
Booster Offers
Auto KAMALO
Referral status
Daily drives
Streaks
Available offers
Then:
Your KAMALO Plan for Today
1. You have X Coins approaching expiry.
2. You are X Coins away from Silver.
3. This Booster Offer is currently available.
4. You have X Auto KAMALO opportunities available.
5. Your community has X Silver achievers.
Based on your current position, these are the available actions that can move you forward.
CTA:
START MY PLAN', '2', 'archived', '2026-09-17 06:48:41.633+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.633947+00', '2026-09-22 06:19:07.061+00'),
('c1cf8153-9dcf-4738-bec4-2911754d2c7b', 'Guru guidance / 042 · 20. "KAMALO FAST" / Q36. Teach me how to KAMALO FAST.', 'Guru / "KAMALO FAST"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Absolutely.
Think of KAMALO FAST as:
USE → EARN → REDEEM → REPEAT → AUTOMATE
Start with relevant Hottest Offers.
Then use Booster Offers where they genuinely match your needs.
Keep an eye on expiring Coins.
Add recurring expenses to Auto KAMALO.
Finally, build your eligible community so your journey isn''t dependent only on your own transactions.', '2', 'archived', '2026-09-17 06:48:41.639+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.639647+00', '2026-09-22 06:19:07.061+00'),
('df2e9b53-549f-42fa-9365-1531d83cb65b', 'Guru guidance / 043 · 21. "KAMALO BIG" / Q37. How do I KAMALO BIG?', 'Guru / "KAMALO BIG"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

KAMALO BIG means building multiple eligible earning opportunities rather than relying on one transaction.
Think in four layers:
Layer 1 — Your daily actions
Layer 2 — Your personal transactions
Layer 3 — Auto KAMALO
Layer 4 — Community Kharcha
FINCADO combines these journeys so you can see how close you are to your milestones.', '2', 'archived', '2026-09-17 06:48:41.644+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.645061+00', '2026-09-22 06:19:07.061+00');

INSERT INTO public.knowledge_articles (id, title, category, content, version, status, effective_from, effective_until, created_at, updated_at) VALUES
('625270ce-6f34-4e26-bcf8-5ae7b8550654', 'Guru guidance / 044 · 22. "MY KAMALO PLAN" / Q38. Make me a KAMALO plan.', 'Guru / "MY KAMALO PLAN"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI should create a personalized dashboard:
MY KAMALO PLAN

Current Coins: X
Tentative Value: ₹X

Silver:
X / Target
X Coins remaining

Gold:
Personal: X / Target
Community: X / 100

Expiring:
X Coins

Today:
1. ______
2. ______
3. ______

This Week:
1. ______
2. ______

Automation:
X mandates active
X opportunities remaining
Then:
"This is your current KAMALO plan. I can update it whenever your transactions, Coins or goals change."', '2', 'archived', '2026-09-17 06:48:41.65+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.650739+00', '2026-09-22 06:19:07.061+00'),
('78b7234e-ae8e-4a7f-a779-5b0979e9144b', 'Guru guidance / 045 · 23. "HOW CAN I EARN MORE?" / Q39. How can I earn more Coins?', 'Guru / "HOW CAN I EARN MORE?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Let''s look at your actual KAMALO activity rather than giving you a generic list.
I can check:
Your transactions
Available Booster Offers
Auto KAMALO
Referral/community activity
Expiring Coins
Current FINCADO goal
Then I''ll show you the available opportunities relevant to your journey.
CTA:
ANALYSE MY ACCOUNT', '2', 'archived', '2026-09-17 06:48:41.655+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.655683+00', '2026-09-22 06:19:07.061+00'),
('56685a07-01b5-4df9-9f80-3826105b5ef4', 'Guru guidance / 046 · 24. "WHY AM I NOT PROGRESSING?" / Q40. Why am I not getting closer to Silver?', 'Guru / "WHY AM I NOT PROGRESSING?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Let''s diagnose your journey.
I''ll check your Coin earning rate, recent transactions, available Booster opportunities, Auto KAMALO activity and current goal.
Then I''ll show you what''s currently slowing your progress and what eligible actions are available.', '2', 'archived', '2026-09-17 06:48:41.665+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.665924+00', '2026-09-22 06:19:07.061+00'),
('b3851ff6-c1b7-4636-b59a-cc7dd362640f', 'Guru guidance / 047 · 25. "WHAT AM I DOING WRONG?" / Q41. Am I using KAMALO correctly?', 'Guru / "WHAT AM I DOING WRONG?"', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Let me check your KAMALO journey.
I''ll look at your recent activity, Coin earnings, redemption behaviour, Auto KAMALO setup and FINCADO progress.
I''ll then show you where you can improve.
The AI could return:
You''re doing well
X transactions
X Coins
X referral activity
Opportunity
No Auto KAMALO
X Coins expiring
X Booster opportunities unused
Next move
Add X mandates
Explore X offer
Share referral', '2', 'archived', '2026-09-17 06:48:41.671+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.672155+00', '2026-09-22 06:19:07.061+00'),
('58bb112f-7644-49be-82f7-4260ff4a6962', 'Guru guidance / 048 · 26. KAMALO GURU — PERSONAL COACH / Overview', 'Guru / KAMALO GURU — PERSONAL COACH', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The user should be able to ask:
"Guru, what should I do next?"
And receive:
"I''ve checked your current journey. You''re X Coins away from Silver. You also have X Coins approaching expiry. Your community is at X Silver achievers.
Your next available actions are:
1. Use eligible expiring Coins
2. Explore this relevant Booster Offer
3. Add these recurring expenses to Auto KAMALO
4. Help your community members progress toward Silver
Let''s start with the action that fits your current goal."', '2', 'archived', '2026-09-17 06:48:41.678+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.678609+00', '2026-09-22 06:19:07.061+00'),
('ceb260d1-72a3-42c8-b75b-917e4aa17ee2', 'Guru guidance / 049 · 27. KAMALO GURU — EXPLAIN MY NUMBERS / Overview', 'Guru / KAMALO GURU — EXPLAIN MY NUMBERS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Users can ask:
"Why is my balance X?"
"How did I earn these Coins?"
"Why am I only X Coins away?"
"Where did my Coins come from?"
"How much did I earn this month?"
"How much came from my own Kharcha?"
"How much came from Community Kharcha?"
"How much expired?"
"How much did I redeem?"
Every answer should come directly from the appropriate engine.', '2', 'archived', '2026-09-17 06:48:41.684+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.684342+00', '2026-09-22 06:19:07.061+00'),
('f4b7c281-6d46-4b1e-b53c-9ab23a8e3735', 'Guru guidance / 050 · 28. KAMALO GURU — PROGRESS QUESTIONS / Overview', 'Guru / KAMALO GURU — PROGRESS QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI should understand:
How far am I from Silver?
How far am I from Gold?
How many Coins do I need?
How many community members have achieved Silver?
How many are remaining?
What is my current Gold target?
What is my personal contribution?
What is my community contribution?
What changed since yesterday?
What changed this month?', '2', 'archived', '2026-09-17 06:48:41.69+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.690703+00', '2026-09-22 06:19:07.061+00'),
('5302e564-cdbc-4b12-9bf3-91b342651f87', 'Guru guidance / 051 · 29. KAMALO GURU — EDUCATION QUESTIONS / Overview', 'Guru / KAMALO GURU — EDUCATION QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI should answer:
What is a Coin?
What is a Booster?
What is FINCADO?
What is Auto KAMALO?
What is Community Kharcha?
What is the Commission Engine?
What is the Coin Engine?
What is the Transaction Engine?
What is the Notification Engine?
What is FIFO?
What is a Silver milestone?
What is a Gold milestone?
What is a Hottest Offer?
What is Shop & KAMALO?', '2', 'archived', '2026-09-17 06:48:41.697+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.697756+00', '2026-09-22 06:19:07.061+00'),
('fd0b973c-1cd2-449a-92ba-d5bdf90f4567', 'Guru guidance / 052 · 30. KAMALO GURU — STRATEGY QUESTIONS / Overview', 'Guru / KAMALO GURU — STRATEGY QUESTIONS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

This should be an extensive intent group:
Personal
How do I earn more from my own spending?
Which offers should I use?
Which Booster should I use?
What should I buy through KAMALO?
How do I reach Silver?
How do I reach Gold?
Automation
How do I automate my Kharcha?
What should I add to Auto KAMALO?
How many mandates should I have?
Community
How do I build my community?
How do I explain KAMALO to my friends?
How do I help someone earn Silver?
How do I help my community progress?
How many Silver achievers do I have?
Optimization
Which Coins are expiring?
What should I do before my Coins expire?
What is my biggest opportunity today?
What should I do this week?
What is stopping me from reaching Silver?', '2', 'archived', '2026-09-17 06:48:41.704+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.705033+00', '2026-09-22 06:19:07.061+00'),
('849b0ef2-1768-4f9d-9579-7a98678ac77d', 'Guru guidance / 053 · 31. KAMALO GURU — DAILY COACH / Overview', 'Guru / KAMALO GURU — DAILY COACH', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Every morning, Guru can generate:
YOUR KAMALO MORNING PLAN
Good morning! Here''s your KAMALO journey today.
Silver: X Coins remaining
Gold: X personal + X community progress
Expiring: X Coins
Today''s opportunity: X
Your community: X Silver achievers
Automation: X active mandates
Today''s action: X
CTA:
START TODAY', '2', 'archived', '2026-09-17 06:48:41.71+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.710411+00', '2026-09-22 06:19:07.061+00'),
('50eebbc8-208a-4db9-9649-cbcffad8b5ce', 'Guru guidance / 054 · 32. WEEKLY KAMALO REVIEW / Overview', 'Guru / WEEKLY KAMALO REVIEW', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Every week:
YOUR KAMALO WEEK
Coins earned: X
Coins redeemed: X
Coins expiring: X
Personal transactions: X
Community transactions: X
New referrals: X
Silver progress: X%
Gold progress: X%
Auto KAMALO: X mandates
Then:
"Here''s what changed this week and the opportunities available for next week."', '2', 'archived', '2026-09-17 06:48:41.716+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.716577+00', '2026-09-22 06:19:07.061+00'),
('4f3dc618-8d38-4938-b2c0-b3574e29c5c7', 'Guru guidance / 055 · 33. KAMALO GURU SHOULD NEVER DO THIS / Overview', 'Guru / KAMALO GURU SHOULD NEVER DO THIS', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The AI must never:
❌ Guarantee income
"Earn ₹10,000 guaranteed."
❌ Encourage unnecessary spending
"Spend ₹50,000 just to earn Coins."
❌ Misrepresent rewards
"Every transaction earns 20%."
❌ Invent offers
"Amazon is offering 15% today."
Only live offer data can make that statement.
❌ Invent eligibility
"You qualify for Gold."
Only FINCADO can determine qualification.
❌ Give stale targets
The AI must retrieve dynamic thresholds.', '2', 'archived', '2026-09-17 06:48:41.721+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.721408+00', '2026-09-22 06:19:07.061+00'),
('64ef105a-3de1-4d26-aaff-cfb9cbbb3915', 'Guru guidance / 056 · 34. PERSONALIZED GURU RESPONSE ENGINE / Overview', 'Guru / PERSONALIZED GURU RESPONSE ENGINE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The technical team should implement:
USER QUESTION
      ↓
INTENT CLASSIFICATION
      ↓
IS THIS EDUCATIONAL OR PERSONALIZED?
      ↓
IF EDUCATIONAL
      ↓
KNOWLEDGE BASE
      ↓
ANSWER

IF PERSONALIZED
      ↓
AUTHENTICATE USER
      ↓
FETCH LIVE DATA
      ↓
COIN ENGINE
COMMISSION ENGINE
TRANSACTION ENGINE
FINCADO
AUTO KAMALO
OFFER ENGINE
      ↓
ANALYSE
      ↓
GENERATE PERSONALIZED ANSWER
      ↓
CTA', '2', 'archived', '2026-09-17 06:48:41.727+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.727378+00', '2026-09-22 06:19:07.061+00'),
('ee9016fd-c0d3-4a51-b6e3-e6ff6bc5a534', 'Guru guidance / 057 · 35. THE KAMALO GURU PERSONALITY / Overview', 'Guru / THE KAMALO GURU PERSONALITY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Every response should feel like a mentor.
Instead of:
"You have insufficient coins."
Say:
"You''re currently at 800 Coins, so you''re just 200 Coins away from the 1,000-Coin redemption threshold. Let''s see what eligible opportunity can help you reach it."
Instead of:
"No AutoPay."
Say:
"You haven''t activated Auto KAMALO yet. You may have recurring expenses that could be automated. Let''s check which eligible options are available to you."
Instead of:
"You need 27 more Silver members."
Say:
"Your community has already helped 73 eligible members reach Silver. You''re 27 away from the current community milestone. Let''s see how your community can continue the journey."', '2', 'archived', '2026-09-17 06:48:41.734+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.734483+00', '2026-09-22 06:19:07.061+00'),
('e0b89253-313f-4ccc-b0e6-b3ddc3f5e86f', 'Guru guidance / 058 · 36. THE FOUR BUTTONS THAT SHOULD APPEAR THROUGHOUT GURU / Overview', 'Guru / THE FOUR BUTTONS THAT SHOULD APPEAR THROUGHOUT GURU', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

Where relevant:
EARN MORE
REDEEM NOW
AUTOMATE
MY FINCADO
This keeps the Guru from becoming just an information chatbot.', '2', 'archived', '2026-09-17 06:48:41.739+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.740177+00', '2026-09-22 06:19:07.061+00'),
('48140aa4-f845-4b08-b89d-64e61ebf647e', 'Guru guidance / 059 · 37. THE ULTIMATE KAMALO GURU LOOP / Overview', 'Guru / THE ULTIMATE KAMALO GURU LOOP', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The entire system should create this loop:
DISCOVER
   ↓
UNDERSTAND
   ↓
TRANSACT
   ↓
EARN COINS
   ↓
REDEEM
   ↓
EARN MORE
   ↓
BOOST
   ↓
AUTOMATE
   ↓
REFER
   ↓
COMMUNITY KHARCHA
   ↓
SILVER
   ↓
GOLD
   ↓
REPEAT', '2', 'archived', '2026-09-17 06:48:41.751+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.751589+00', '2026-09-22 06:19:07.061+00'),
('b8040d13-aa5d-4ce2-8caa-b043995ee8bd', 'Guru guidance / 060 · 38. THE "GURU, WHAT NEXT?" BUTTON / Overview', 'Guru / THE "GURU, WHAT NEXT?" BUTTON', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

I strongly recommend making this a permanent CTA inside the app.
The user can tap:
ASK KAMALO GURU
And the AI answers based on their live account position, not a generic FAQ.
For example:
Guru:
"You''re currently 4,200 Coins away from Silver. You have 1,000 Coins expiring soon and 3 relevant Booster Offers available. Your community has 68 Silver achievers.
I''d suggest you first review your expiring Coins, then look at the available Booster opportunities and continue building your community."
This makes FINCADO + Guru + Coin Engine + Commission Engine + Offer Engine work as one system.', '2', 'archived', '2026-09-17 06:48:41.757+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.757707+00', '2026-09-22 06:19:07.061+00'),
('3237ee85-4352-4e2a-9143-d41cace012f2', 'Guru guidance / 061 · 39. MASTER KAMALO GURU INTENT LIBRARY / Overview', 'Guru / MASTER KAMALO GURU INTENT LIBRARY', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

For development, I would initially create these intent groups:
Group
Approx. intents
What is KAMALO
15
Getting Started
15
KAMALO Coins
25
Earning
25
Redemption
15
Silver
25
Gold
30
FINCADO
25
Community
25
Auto KAMALO
20
Booster
15
Shop
15
FIFO/Expiry
15
Daily Strategy
20
Weekly Strategy
15
Personal Coaching
25
Merchant Education
15
Total initial intent library
~300 intents

Each intent should have multiple natural-language variations so the AI learns that:
"How do I get silver?"
"Silver kaise milega?"
"What do I need for Silver?"
"How can I win Silver?"
"How far am I from Silver?"
"Guru show me Silver"
can all map to the appropriate intent.', '2', 'archived', '2026-09-17 06:48:41.768+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.768924+00', '2026-09-22 06:19:07.061+00'),
('ab8b79e2-0e62-4b5b-afd1-72221c3260e5', 'Guru guidance / 062 · 40. THE FINAL KAMALO GURU PROMISE / Overview', 'Guru / THE FINAL KAMALO GURU PROMISE', 'Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.

Founder-provided KAMALO Guru guidance. Educational guidance is approved; account-specific values, eligibility, offers, milestones, and actions still require a verified live engine.

The Guru should ultimately make KAMALO feel like this:
"Don''t know what to do? Ask Guru."
"Want to earn more? Ask Guru."
"Want Silver? Ask Guru."
"Want Gold? Ask Guru."
"Want to automate? Ask Guru."
"Don''t understand your Coins? Ask Guru."
"Don''t know what to transact? Ask Guru."
"Don''t know what to do today? Ask Guru."
And the central philosophy should be:
KAMALO GURU
Learn KAMALO. KAMALO FAST. KAMALO BIG. AUTOMATE KAMALO.
The key technical distinction is that Guru should not be a static FAQ bot. It should be an AI decision-and-guidance layer sitting on top of the five KAMALO engines, with live access to the user''s current status. That is what allows it to move from “Here is how Silver works” to “You are 4,200 Coins away from Silver, you have 1,000 expiring Coins, and these are the currently eligible actions available to you.”', '2', 'archived', '2026-09-17 06:48:41.773+00', '2026-09-22 06:19:07.061+00', '2026-09-17 06:48:41.774209+00', '2026-09-22 06:19:07.061+00');
