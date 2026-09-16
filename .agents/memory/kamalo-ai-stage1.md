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