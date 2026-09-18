---
name: KAMALO AI web voice fallback
description: Browser speech recognition is unreliable in hosted previews; local Transformers.js Whisper must use a compatible multilingual model configuration.
---

Use browser speech recognition only as an optional fast path. Always keep recorded-audio fallback available because Chrome can return `network` while microphone permission and internet access are healthy in hosted or embedded previews.

**Why:** The hosted preview produced a browser `network` error, and the first local fallback failed because an English-only Whisper model was called with `language` and `task` options. The multilingual model accepts those generation controls and keeps language handling extensible.

**How to apply:** Keep audio decoding and transcription lazy-loaded in the web client, cache the model in the browser, use the multilingual Whisper model when passing language/task options, and retain diagnostic console logging while showing calm user-facing errors.