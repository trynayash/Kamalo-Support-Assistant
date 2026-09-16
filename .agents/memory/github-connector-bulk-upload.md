---
name: GitHub connector bulk uploads
description: Safe repository initialization and upload pacing when exporting this workspace through the GitHub connector.
---

Initialize an empty GitHub repository with a branch before using the Git Data blob API, and keep connector uploads below ten requests per second with retry handling.

**Why:** GitHub rejects blob creation while a repository has no branch, and the Replit connector enforces a ten-request-per-second limit even when GitHub’s account-level quota has room.

**How to apply:** Bootstrap `main` with one file, create the complete tracked-file tree in a follow-up commit, throttle blob writes, retry `429` responses, and verify the recursive tree count before reporting success.