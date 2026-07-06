# Changelog

All notable changes to `@chronary/toolkit` will be documented in this file starting with the soft-launch release.

## 1.2.3 — 2026-07-07

- Add parameter descriptions to the nested scheduling-proposal slot object (`start_time`, `end_time`, `weight`, `calendar_id` on `create_proposal` / `respond_to_proposal` slots) and to the availability-rules working-hours `start`/`end` fields. These were the only tool parameters lacking `.describe()`, so agents now get guidance on every field. Improves MCP tool-definition quality (e.g. Glama's scoring) with no behavioral change. `@chronary/mcp` picks this up automatically via its `^1.2.2` caret range.

- Add the preferred `duration` field (alias of the now-deprecated `slot_duration`) to the `get_availability` and `find_meeting_time` tool schemas, and forward it through the corresponding functions. This brings the toolkit — and the `@chronary/mcp` stdio server built on it — into parity with the hosted MCP and REST surfaces, which already prefer `duration`. Both aliases are accepted; the API rejects conflicting values with a 400. `slot_duration` is retained for backward compatibility.

## 0.1.3 — 2026-05-20

- First OIDC + Sigstore provenance release. Published via npm Trusted Publishing from `Chronary/chronary-toolkit`'s `release-artifact.yml`. No behavioral change vs 0.1.2 — bootstrap 0.1.2 was published manually with a classic token before Trusted Publisher could be registered (npm has no Pending Publisher flow).

## 0.1.2 — 2026-05-18

- Add `CONTRIBUTING.md` to the public mirror documenting that this repo is generated from a private monorepo; PRs are welcome as proof-of-concept but can't be merged directly. No behavioral change.
