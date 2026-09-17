---
name: Portable vendor handoff archives
description: Rules for creating clean source and data handoffs without platform metadata or private uploaded assets.
---

Build vendor source archives from the repository's tracked-file manifest, then
explicitly add only approved uploaded assets that the application loads. Do not
rely on filesystem directory pruning alone because workspace dependency and
cache entries may be symlinks.

**Why:** Workspace tooling can expose nested or symlinked dependency caches, and
the uploaded-assets directory can contain private screenshots and prior
conversation material alongside production knowledge sources.

**How to apply:** Exclude hosting metadata, Git history, dependency folders,
generated output, and raw uploaded assets from the portable source; add the
specific runtime assets by filename and validate the archive contents before
delivery.