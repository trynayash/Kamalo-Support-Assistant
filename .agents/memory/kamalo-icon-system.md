---
name: KAMALO icon system
description: Cross-platform icon choice and the native/web boundary for KAMALO interfaces.
---

KAMALO uses Tabler’s 24px-grid language for product icons. The web app and mockup sandbox render a local inline SVG path set with the same Tabler names and stroke weight; the external Tabler stylesheet remains an optional enhancement. The Expo app uses a local SVG set with the same visual language.

**Why:** A browser stylesheet or font can be blocked by network policy or an offline preview. Keeping the web fallback local makes icons reliable without introducing a second icon family, while the native runtime still needs its own SVG implementation.

**How to apply:** Add new web glyphs through the KAMALO icon wrappers and new native glyphs through the local SVG map. Preserve Tabler names, 24px viewBox geometry, and two-pixel outline strokes. Do not reintroduce `react-icons`, `lucide-react`, Feather, or another mixed icon family for product UI.