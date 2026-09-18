---
name: Replit Expo preview networking
description: Replit Expo Go preview host behavior and optional Metro DevTools runtime dependencies.
---

Expo Go development previews in this workspace must advertise a reachable LAN or
managed preview host. A localhost Expo URL can render a QR code that a physical
device cannot connect to. Metro can still start when React Native DevTools logs
an optional missing native-library warning; treat Metro readiness and the
advertised host as the functional checks.

**Why:** The Replit workflow runs inside a remote workspace, while Expo Go runs
on the user's device; localhost refers to different machines.

**How to apply:** Keep the managed mobile workflow as the source of truth, use a
non-localhost Expo host mode for development, and do not block the app on the
optional DevTools installation.