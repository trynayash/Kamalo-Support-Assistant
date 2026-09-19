---
name: Replit Expo preview networking
description: Replit Expo Go preview host behavior and optional Metro DevTools runtime dependencies.
---

Expo Go development previews in this workspace must advertise a reachable LAN or
managed preview host. A localhost Expo URL can render a QR code that a physical
device cannot connect to. For this managed artifact, set Expo's
`EXPO_PACKAGER_PROXY_URL` to the portless `${REPLIT_EXPO_DEV_DOMAIN}/artifacts/kamalo-mobile`
route so the QR bundle URL does not expose the internal Metro port. Set
`EXPO_UNSTABLE_HEADLESS=1` in the workflow to avoid installing the optional
desktop DevTools shell in the headless workspace.

**Why:** The Replit workflow runs inside a remote workspace, while Expo Go runs
on the user's device; localhost and the workspace's internal IP refer to
different machines, and the raw assigned port is not the managed mobile route.

**How to apply:** Keep the managed mobile workflow as the source of truth, use a
non-localhost Expo host mode for development, use the portless managed proxy
route for QR/bundle URLs, and do not block the app on optional DevTools.

Expo Go may not contain third-party native modules such as
`expo-speech-recognition`; importing one at screen startup can prevent the
first route from mounting. Load optional native modules behind a guarded
runtime require and provide a text-only fallback when unavailable.

**Why:** Expo Go's bundled native runtime and a custom development build do not
contain the same module set, while the core KAMALO chat should remain usable
without voice input.

**How to apply:** Keep native-module imports out of the initial route module
path, catch missing-module errors, and surface capability-specific errors only
when the user activates the unavailable feature.