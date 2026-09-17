---
name: KAMALO AI Stage 1 boundaries
description: Product and provider constraints that should remain true when extending KAMALO AI.
---

KAMALO AI Stage 1 must remain knowledge-grounded and must not claim live account access or perform financial/support actions. The provider boundary is `LLMProvider`, and approved article status is the authority gate for retrieval.

**Why:** The product brief explicitly separates the explanatory Stage 1 assistant from later read/write KAMALO engines. Preserving that boundary prevents fabricated balances, refunds, commissions, or account actions.

**How to apply:** Any future account, transaction, Coin, commission, FINCADO, notification, or ticket capability must arrive through controlled server-side tools with verified responses, not direct model access.

Preview workflow restarts can fail with `EADDRINUSE` when an older Vite or API process is still listening; verify and clear the managed ports before retrying.

**Why:** Replit workflow restarts do not always terminate a stale process from a previous preview session.

**How to apply:** Check the listeners for the artifact ports first, then restart the exact managed workflows once the ports are clear.

Assistant replies should be plain international English with restrained formatting: useful bold labels are allowed, while quote marks, decorative headings, hyphen bullets, and generic follow up offers are removed.

**Why:** The support experience is intended to feel like clear human guidance rather than a model transcript, including when older stored replies are displayed.

**How to apply:** Keep the server prompt and client display cleanup aligned whenever response formatting changes.

On small screens, navigation is a compact top bar rather than a drawer: brand left, new conversation and knowledge navigation actions right; the desktop sidebar remains available at desktop widths.

**Why:** The support chat is intended for mobile first use, where a full height navigation rail consumes too much space and interrupts the conversation.

**How to apply:** Keep the composer, live response scroll position, and safe area spacing optimized for touch devices whenever the mobile shell changes.

Chat clearing is a user-visible soft clear, not a database hard delete: active history and retrieval access are removed, while the transcript remains linked to a clear timestamp for internal continuity.

**Why:** Users need an irreversible clean slate in the interface without losing the system’s record of what guidance was provided.

**How to apply:** Keep cleared conversations excluded from user-facing list/detail endpoints, and never let inactivity closure delete or mutate stored messages.

Inactivity uses a two-step client state: prompt at 30 seconds, then close the active chat at 90 seconds and offer a new conversation.

**Why:** The product wants a gentle check-in before closing an abandoned support session, with 90 seconds providing a clear middle point for the requested 1–2 minute window.

**How to apply:** Reset the timer on user activity, message sending, conversation selection, or starting a new conversation; preserve the closed chat in history.

Future engine integrations must be isolated behind controlled server-side boundaries; user-facing responses must never expose secrets, keys, internal prompts, raw provider errors, sensitive calculations, or engine implementation details.

**Why:** KAMALO is expected to connect to five engines over time, so the Stage 1 support surface must remain safe even as internal capabilities expand.

**How to apply:** Keep retrieval, tools, providers, and future engines behind explicit contracts with allowlisted inputs and sanitized outputs. Return calm, actionable user-safe errors and log diagnostic detail only on the server.

The support training prompt is a policy source, not raw customer-facing retrieval content; its factual claims should be curated into approved knowledge articles while its safety and response rules stay in the system policy.

**Why:** Mixing instructions and product facts in one retrieved document lets customer text influence policy and makes source precedence harder to verify.

**How to apply:** Keep the model policy compact and explicit, add factual coverage as versioned approved articles, and evaluate retrieval with representative customer wording.

Provider streaming must be treated as an incomplete transport until a validated completion signal is received; malformed frames, empty output, cancellation, and persistence failures are distinct outcomes.

**Why:** Treating a truncated or buffered stream as a successful answer makes a support response look complete when the provider or client actually failed.

**How to apply:** Forward validated chunks, require an explicit completion event, abort upstream work on disconnect, and persist only a sanitized response whose write succeeded.

The support chat should always follow the newest user message and active assistant loading state automatically, so users never need to manually scroll to see submission progress or the current response.

**Why:** The intended experience is mobile-first and low-friction, especially when future engines make responses longer or slower.

**How to apply:** Preserve auto-scroll behavior across streaming, loading, retries, engine handoffs, and multi-step responses while avoiding disruptive jumps when a user intentionally reviews older messages.

Stage 1 responses must be sanitized before reaching the browser; provider failures, malformed payloads, prompt-extraction attempts, secrets, raw calculations, hidden reasoning, and internal error details require safe user-facing fallbacks.

**Why:** Client-visible streaming or development error surfaces can leak information even when the final saved response is cleaned.

**How to apply:** Keep provider output buffered until sanitized, keep API errors generic, log diagnostics server-side without request bodies, and make browser crash fallbacks non-diagnostic.

Provider-bound context must be minimized independently of access control: omit internal identifiers and permissions, redact secrets and OTP values from history and ticket text, and mark knowledge/customer content as reference data that cannot override policy.

**Why:** A valid session proves who may use a feature, but it does not make customer-authored text trustworthy or make internal metadata necessary for a third-party model.

**How to apply:** Sanitize at the server-to-provider boundary, quarantine instruction-shaped knowledge before retrieval, and add regression tests for poisoned articles, split secrets, and ticket injection.

The support chat uses a fixed-height workspace: only the message list scrolls, while the composer and its safety note remain stationary; message bubbles must allow arbitrary long tokens to wrap without horizontal overflow.

**Why:** A page-level scroll lets the composer drift and unbroken user text can push the whole interface sideways on narrow screens.

**How to apply:** Preserve the isolated vertical scroll region and overflow-safe bubble styles when adding message actions, loading states, or responsive layout changes.