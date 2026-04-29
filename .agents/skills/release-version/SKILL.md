---
name: release-version
description: Easy entrypoint for the repo's release workflow. Use when the user wants to release a new version, bump the app version, or create and push a release tag.
---

# release-version

Use this skill as the easy-to-discover wrapper for the repo's release process.

The source of truth for the actual steps lives in:

- `/Users/sashamats/experiments/mai-reminder/.agents/workflows/release-version.md`

When invoked:

1. Read and follow `/Users/sashamats/experiments/mai-reminder/.agents/workflows/release-version.md`.
2. If the user supplied a version, use it.
3. If the user did not supply a version, determine the next version exactly as described in the workflow.
4. Before pushing, report the exact version you are about to release.
5. After pushing, report the commit and tag created.

Keep the workflow file updated if the release process changes. Keep this skill thin.
