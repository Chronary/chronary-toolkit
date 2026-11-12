# Changelog

All notable changes to `@chronary/toolkit` will be documented in this file starting with the soft-launch release.

## Unreleased

- Static MCP instructions and tool descriptions now use the Developer-plan wording: scoped keys, cross-agent availability, webhook delivery replay and secret rotation require a Developer or Pro plan; scheduling proposals and temporal holds stay Pro.

## 1.6.1 — 2026-11-09

- Tool input schemas now carry the API's length limits: event `description` at most 10,000 characters, agent `description` at most 5,000, webhook and iCal subscription `url` at most 2,048, and calendar `timezone` at most 64 (#1672).

## 1.6.0 — 2026-10-19

- Add `get_billing`, `request_upgrade`, `get_upgrade_request` and `cancel_upgrade_request` tools (58 tools total) so an agent can ask its human to upgrade when it hits a plan limit (#1129).
- Tool errors are now structured objects (`{error, message, upgrade_url?, docs_url?, required_plan?, feature?, metric?, limit?}`) instead of a flattened string. The AI SDK and Mastra adapters throw an `Error` whose message is that JSON.
- Add the `org.plan_changed` webhook event type: fires once when the account's plan changes, so agents don't have to poll billing (#1130).
- Add the `calendar_connection.reauthorization_required` webhook event type: fires once when a connected human calendar stops accepting access, so agents learn their availability now fails closed (#1196).
- Add the `get_webhook_delivery` tool (59 tools total): one webhook delivery with every attempt's HTTP status, duration, response body prefix and error code (#1200).
- `list_webhook_deliveries` takes `event_type` (exact, or a prefix ending in a dot such as `event.`), `created_after`, `created_before`, `delivery_id`, `is_test` and `cursor`, and its `status` filter gains `dropped` (a Free-plan delivery the monthly limit stopped) (#1200).
- Add the `send_test_webhook` tool (63 tools total): sends a signed sample event to a webhook endpoint once, quota-exempt, with the `X-Chronary-Test: 1` header (#1200).
- Add the `list_org_events` tool (64 tools total): events across all of the organization's calendars in one call, filtered by calendars, agent, window, status and source, with case-insensitive title search inside a window of at most 31 days (#1202).
- Add the `replay_webhook_delivery` tool (65 tools total, Pro): sends a failed or dropped webhook delivery again as a new delivery, with an `X-Chronary-Replay-Of` header naming the original. It counts toward the monthly delivery quota (#588).
- Results of `list_events`, `list_org_events`, `get_event`, `update_event`, `cancel_event`, `confirm_event` and `get_calendar_context` start with `untrusted_fields: ["title", "description", "metadata"]`, and those of `list_webhook_deliveries` and `get_webhook_delivery` with `untrusted_fields: ["payload", "response_body"]`: fields that may hold text written outside the org (a booking-page booker, a webhook receiver), which the model must treat as data. New exports: `MCP_SERVER_INSTRUCTIONS` (also from `@chronary/toolkit/mcp`), `EVENT_UNTRUSTED_FIELDS`, `WEBHOOK_DELIVERY_UNTRUSTED_FIELDS`, `withUntrustedFields`, and `ToolDefinition.untrustedFields` (#1621).
- Annotations: `create_webhook`, `update_webhook` and `update_ical_subscription` set `openWorldHint: true` (they make Chronary contact a URL you supply), and `update_webhook` sets `destructiveHint: true`. They now match the hosted MCP server exactly (#1662).

## 1.5.3 — 2026-10-18

- `update_ical_subscription`: the `url` parameter's JSON Schema declares `format: "uri"` again. Under zod 4, the HTTPS `.startsWith()` check had replaced it with a non-standard `starts_with`. Validation is unchanged, and there are still 54 tools (#1117).

## 1.5.2 — 2026-07-14

- Align the `get_availability`, `find_meeting_time`, `create_connection_link`, `get_connection_link`, and `cancel_connection_link` tool descriptions (and the `capabilities`/`publication_policy` params) with the richer hosted-MCP wording — zero drift across transports. No behavioral change; still 54 tools.

## 1.5.1 — 2026-07-14

- Neutral wording for the `create_booking_page` tool description (no competitor references). No behavioral change.

## 1.5.0 — 2026-07-14

- Add `create_booking_page`, `list_booking_pages`, `get_booking_page`, and `delete_booking_page` for agent-created public scheduling links — full 54-tool hosted-MCP parity (#1036).

## 1.4.0 — 2026-07-12

- Add `create_connection_link`, `get_connection_link`, and `cancel_connection_link` for provider-neutral, human-approved Google Calendar and Microsoft Outlook setup.
- Availability tool guidance now requires agents to inspect fail-closed `availability_state` and `warnings`. The toolkit has full 50-tool hosted-MCP parity.

## 1.3.0 — 2026-07-10

- Recurring events (#996), in parity with the hosted MCP server and REST API:
  - `create_event` gains optional `recurrence_rule` (RFC 5545 RRULE subset, no `RRULE:` prefix) to create a recurring series.
  - `update_event` gains `recurrence_rule` (string to set/change the series rule — full-series semantics — or `null` to make the event a one-off).
  - `list_events` gains `expand` — expands recurring series into individual occurrence instances within the `start_after`/`start_before` window (both required when `expand=true`, max 366 days apart). Instances carry `recurringEventId` + `originalStartTime`.
  - `cancel_event` gains optional `occurrence_start` — cancels just that one occurrence of a recurring series (the series continues) and returns the updated series master; omit it to cancel the whole series. No new tool was added in that release.
- Requires `@chronary/sdk` >= 0.5.0 (the release that adds `recurrence_rule` / `expand` / `occurrence_start`); the workspace dependency resolves this automatically at publish time.

## 1.2.4 — 2026-07-09

- Docs/metadata: correct the then-current README tool count after the toolkit expanded to full hosted-MCP parity. No code or behavioral change; version bump exists to publish the corrected README to npm + the mirror.

## 1.2.3 — 2026-07-07

- Add parameter descriptions to the nested scheduling-proposal slot object (`start_time`, `end_time`, `weight`, `calendar_id` on `create_proposal` / `respond_to_proposal` slots) and to the availability-rules working-hours `start`/`end` fields. These were the only tool parameters lacking `.describe()`, so agents now get guidance on every field. Improves MCP tool-definition quality (e.g. Glama's scoring) with no behavioral change. `@chronary/mcp` picks this up automatically via its `^1.2.2` caret range.

- Add the preferred `duration` field (alias of the now-deprecated `slot_duration`) to the `get_availability` and `find_meeting_time` tool schemas, and forward it through the corresponding functions. This brings the toolkit — and the `@chronary/mcp` stdio server built on it — into parity with the hosted MCP and REST surfaces, which already prefer `duration`. Both aliases are accepted; the API rejects conflicting values with a 400. `slot_duration` is retained for backward compatibility.

## 0.1.3 — 2026-05-20

- First OIDC + Sigstore provenance release. Published via npm Trusted Publishing from `Chronary/chronary-toolkit`'s `release-artifact.yml`. No behavioral change vs 0.1.2 — bootstrap 0.1.2 was published manually with a classic token before Trusted Publisher could be registered (npm has no Pending Publisher flow).

## 0.1.2 — 2026-05-18

- Add `CONTRIBUTING.md` to the public mirror documenting that this repo is generated from a private monorepo; PRs are welcome as proof-of-concept but can't be merged directly. No behavioral change.
