---
name: KAMALO icon system
description: Cross-platform icon choice and the native/web boundary for KAMALO interfaces.
---

KAMALO uses Tabler’s 24px-grid language for product icons. The web app and mockup sandbox load the Tabler webfont from jsDelivr; the Expo app uses a local SVG set with the same Tabler-style names and stroke weight.

**Why:** The requested webfont is a browser asset and cannot be relied on inside the native Expo runtime. Keeping the visual language consistent while rendering native-safe SVGs avoids platform-specific blank icons.

**How to apply:** Add new web glyphs through the shared KAMALO icon wrapper and new native glyphs through the local SVG map. Do not reintroduce `react-icons`, `lucide-react`, Feather, or another mixed icon family for product UI.