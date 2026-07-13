import type { ToolDefinition } from './types';
import * as schemas from './schemas';
import * as fns from './functions';
import { createExecutor } from './functions';

export const HOSTED_API_MCP_TOOL_NAMES = [
  'create_agent',
  'list_agents',
  'create_calendar',
  'create_event',
  'list_events',
  'get_event',
  'update_event',
  'get_availability',
  'find_meeting_time',
  'create_connection_link',
  'get_connection_link',
  'cancel_connection_link',
  'cancel_event',
  'confirm_event',
  'release_event',
  'subscribe_ical',
  'list_ical_subscriptions',
  'get_ical_subscription',
  'update_ical_subscription',
  'delete_ical_subscription',
  'sync_ical_subscription',
  'get_calendar_context',
  'create_proposal',
  'list_proposals',
  'get_proposal',
  'respond_to_proposal',
  'resolve_proposal',
  'cancel_proposal',
  'set_availability_rules',
  'get_availability_rules',
  'clear_availability_rules',
  'create_scoped_key',
  'list_scoped_keys',
  'revoke_scoped_key',
  'create_webhook',
  'list_webhooks',
  'get_webhook',
  'update_webhook',
  'delete_webhook',
  'list_webhook_deliveries',
  'get_agent',
  'update_agent',
  'delete_agent',
  'list_calendars',
  'get_calendar',
  'update_calendar',
  'delete_calendar',
  'get_usage',
  'get_audit_log',
  'accept_terms',
] as const;

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Calendars ──────────────────────────────────────────────────
  {
    name: 'list_calendars',
    description: 'List calendars in the org. Org-level API keys see every calendar (agent-owned and shared); agent-scoped keys see only their own agent\'s calendars. Use this to discover calendar IDs before creating or listing events.',
    schema: schemas.ListCalendarsSchema,
    annotations: { title: 'List Calendars', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listCalendars),
  },
  {
    name: 'get_calendar',
    description: 'Fetch a single calendar by ID, including its name, timezone, agent status, and default reminders. Agent-scoped keys may only read calendars owned by their agent.',
    schema: schemas.GetCalendarSchema,
    annotations: { title: 'Get Calendar', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getCalendar),
  },
  {
    name: 'create_calendar',
    description: 'Create a calendar to hold events and track availability. Calendars are required before creating events — call this first when setting up a new agent. An agent can have multiple calendars (e.g. "Work", "Personal"). Org-level calendars (no agent_id) can be used as shared resources like meeting rooms.',
    schema: schemas.CreateCalendarSchema,
    annotations: { title: 'Create Calendar', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createCalendar),
  },
  {
    name: 'update_calendar',
    description: 'Update a calendar\'s name, timezone, agent status, default reminders, or metadata. Agent-scoped keys may only update calendars owned by their agent.',
    schema: schemas.UpdateCalendarSchema,
    annotations: { title: 'Update Calendar', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateCalendar),
  },
  {
    name: 'delete_calendar',
    description: 'Delete a calendar (soft delete). Its events are no longer returned and it stops contributing to availability. Agent-scoped keys may only delete calendars owned by their agent.',
    schema: schemas.DeleteCalendarSchema,
    annotations: { title: 'Delete Calendar', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteCalendar),
  },

  // ── Events ─────────────────────────────────────────────────────
  {
    name: 'list_events',
    description: 'List events on a calendar or across an agent\'s calendars, including internally created events and externally synced events from iCal subscriptions (e.g. Google Calendar, Outlook). Provide `calendar_id` OR `agent_id`. Narrow with `start_after`/`start_before` (time window), `status`, and `source`.',
    schema: schemas.ListEventsSchema,
    annotations: { title: 'List Events', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listEvents),
  },
  {
    name: 'get_event',
    description: 'Retrieve a single event by ID, including its title, times, status, location, reminders, and metadata. Works for both internally created events and externally synced iCal events. `calendar_id` is optional — if omitted the calendar is resolved from the event. Provide `calendar_id` to fail fast on cross-calendar typos.',
    schema: schemas.GetEventSchema,
    annotations: { title: 'Get Event', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getEvent),
  },
  {
    name: 'create_event',
    description: 'Create a booking, appointment, meeting, hold, or any scheduled event on a calendar. The calendar_id comes from create_calendar or list_events. Once created, this event blocks the agent\'s availability during that time and appears in availability queries. Use status="hold" with hold_expires_at to tentatively reserve a slot that auto-releases on TTL.',
    schema: schemas.CreateEventSchema,
    annotations: { title: 'Create Event', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createEvent),
  },
  {
    name: 'update_event',
    description: 'Reschedule or edit an event — change its title, description, start/end times, location, status, reminders, or metadata. Use this to move an appointment to a new time or update its details. Provide only the fields you want to change. Holds cannot be edited via this tool (use confirm_event / release_event). External iCal events are read-only. `calendar_id` is optional — if omitted it is resolved from the event.',
    schema: schemas.UpdateEventSchema,
    annotations: { title: 'Update Event', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateEvent),
  },
  {
    name: 'cancel_event',
    description: 'Delete or cancel an event from a calendar. Use this to remove, cancel, or delete any scheduled event or appointment. The event is marked cancelled and excluded from future availability calculations. For a recurring series, pass `occurrence_start` to cancel just that one occurrence (the series continues); omit it to cancel the whole series. `calendar_id` is optional — if omitted the calendar is looked up from the event. Provide `calendar_id` to fail fast on cross-calendar typos.',
    schema: schemas.CancelEventSchema,
    annotations: { title: 'Cancel Event', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.cancelEvent),
  },
  {
    name: 'confirm_event',
    description: 'Promote a held event to a confirmed booking. The event must currently have status="hold" and its hold_expires_at must not have passed. After confirmation, event.started and event.ended lifecycle webhooks fire at the scheduled times.',
    schema: schemas.ConfirmEventSchema,
    annotations: { title: 'Confirm Event', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.confirmEvent),
  },
  {
    name: 'release_event',
    description: 'Manually release a held event before its hold_expires_at. The event must currently have status="hold". Frees the slot for other agents to book.',
    schema: schemas.ReleaseEventSchema,
    annotations: { title: 'Release Event', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.releaseEvent),
  },

  // ── Agents ─────────────────────────────────────────────────────
  {
    name: 'create_agent',
    description: 'Register your agent (AI assistant, human participant, or resource) with Chronary so it can own calendars, events, and webhooks.',
    schema: schemas.CreateAgentSchema,
    annotations: { title: 'Create Agent', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createAgent),
  },
  {
    name: 'list_agents',
    description: 'List all agents in your organization',
    schema: schemas.ListAgentsSchema,
    annotations: { title: 'List Agents', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listAgents),
  },
  {
    name: 'get_agent',
    description: 'Fetch a single agent by ID. An agent represents an AI assistant, human, or shared resource (e.g. a meeting room). Agent-scoped API keys may only read their own agent.',
    schema: schemas.GetAgentSchema,
    annotations: { title: 'Get Agent', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAgent),
  },
  {
    name: 'update_agent',
    description: 'Update an agent\'s name, description, metadata, or status (active/paused). Requires an org-level API key — agent-scoped keys cannot mutate agents.',
    schema: schemas.UpdateAgentSchema,
    annotations: { title: 'Update Agent', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateAgent),
  },
  {
    name: 'delete_agent',
    description: 'Decommission an agent. This marks the agent as decommissioned and revokes all of its scoped API keys. Requires an org-level API key — agent-scoped keys cannot delete agents.',
    schema: schemas.DeleteAgentSchema,
    annotations: { title: 'Delete Agent', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteAgent),
  },

  // ── Availability ───────────────────────────────────────────────
  {
    name: 'get_availability',
    description: 'Check when a single agent is free across Chronary and authorized human calendars. This tool is fail-closed: always inspect availability_state and warnings before using slots.',
    schema: schemas.GetAvailabilitySchema,
    annotations: { title: 'Get Availability', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAvailability),
  },
  {
    name: 'find_meeting_time',
    description: 'Find time when multiple agents are free across Chronary and their authorized human calendars. This tool is fail-closed: always inspect availability_state and warnings before using slots.',
    schema: schemas.FindMeetingTimeSchema,
    annotations: { title: 'Find Meeting Time', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.findMeetingTime),
  },
  {
    name: 'create_connection_link',
    description: 'Request human setup of Google Calendar or Microsoft Outlook for a Chronary calendar. Give setup_url to a human; agents never receive provider credentials or event data. The secret URL is returned only once.',
    schema: schemas.CreateConnectionLinkSchema,
    annotations: { title: 'Create Human Calendar Setup Link', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    execute: createExecutor(fns.createConnectionLink),
  },
  {
    name: 'get_connection_link',
    description: 'Poll provider-neutral human-calendar setup status. The bearer setup URL and provider data are never returned by polling.',
    schema: schemas.GetConnectionLinkSchema,
    annotations: { title: 'Get Human Calendar Setup Status', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getConnectionLink),
  },
  {
    name: 'cancel_connection_link',
    description: 'Cancel a pending human-calendar setup request and invalidate its setup URL.',
    schema: schemas.CancelConnectionLinkSchema,
    annotations: { title: 'Cancel Human Calendar Setup Link', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.cancelConnectionLink),
  },

  // ── Calendar context ───────────────────────────────────────────
  {
    name: 'get_calendar_context',
    description: 'Get a calendar\'s temporal context in a single call: the current event (if one is happening now), the next upcoming event, recent past events, a short upcoming window, and the owning agent\'s status (idle/working/waiting/error). Use this to answer "what is this agent doing right now?" without issuing multiple list_events queries.',
    schema: schemas.GetCalendarContextSchema,
    annotations: { title: 'Get Calendar Context', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getCalendarContext),
  },

  // ── Scheduling proposals ───────────────────────────────────────
  {
    name: 'create_proposal',
    description: 'Create a scheduling proposal — send a set of candidate time slots to one or more participant agents so they can accept, decline, or counter-propose. The organizer agent owns the proposal; once every participant responds, the system auto-resolves to the highest-scoring slot (or cancels if all decline). Requires an org-level API key. Pro plan only.',
    schema: schemas.CreateProposalSchema,
    annotations: { title: 'Create Proposal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createProposal),
  },
  {
    name: 'list_proposals',
    description: 'List scheduling proposals for the org. Filter by status (pending|confirmed|expired|cancelled) or organizer_agent_id. Requires an org-level API key.',
    schema: schemas.ListProposalsSchema,
    annotations: { title: 'List Proposals', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listProposals),
  },
  {
    name: 'get_proposal',
    description: 'Get a scheduling proposal by id, including its slots and per-participant responses. Requires an org-level API key.',
    schema: schemas.GetProposalSchema,
    annotations: { title: 'Get Proposal', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getProposal),
  },
  {
    name: 'respond_to_proposal',
    description: 'Submit a response (accept / decline / counter) on behalf of one participant agent to an open proposal. An "accept" requires the slot id from the proposal; a "counter" can suggest alternative slots. When all participants have responded the proposal auto-resolves — no separate resolve call needed in the normal flow. Requires an org-level API key. Pro plan only.',
    schema: schemas.RespondToProposalSchema,
    annotations: { title: 'Respond To Proposal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.respondToProposal),
  },
  {
    name: 'resolve_proposal',
    description: 'Force-resolve an open proposal using responses collected so far. Picks the highest-scoring slot among those accepted by the most participants and creates a confirmed calendar event. If every response was "decline", the proposal is cancelled instead. Use when you want to close out a proposal without waiting for every participant. Requires an org-level API key. Pro plan only.',
    schema: schemas.ResolveProposalSchema,
    annotations: { title: 'Resolve Proposal', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.resolveProposal),
  },
  {
    name: 'cancel_proposal',
    description: 'Cancel an open proposal. Fires a proposal.cancelled webhook with reason="organizer_cancelled". Requires an org-level API key. Pro plan only.',
    schema: schemas.CancelProposalSchema,
    annotations: { title: 'Cancel Proposal', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.cancelProposal),
  },

  // ── Availability rules ─────────────────────────────────────────
  {
    name: 'set_availability_rules',
    description: 'Set or replace the availability rules on a calendar — buffer times before/after events and optional per-day working hours. When these rules are set, every availability query on this calendar automatically applies them (busy-block expansion for buffers, masking outside working hours). Upsert: overwrites any existing rules.',
    schema: schemas.SetAvailabilityRulesSchema,
    annotations: { title: 'Set Availability Rules', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.setAvailabilityRules),
  },
  {
    name: 'get_availability_rules',
    description: 'Read the buffer times and working-hours rules configured on a calendar. Returns the rules row, or an error if none are set.',
    schema: schemas.GetAvailabilityRulesSchema,
    annotations: { title: 'Get Availability Rules', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAvailabilityRules),
  },
  {
    name: 'clear_availability_rules',
    description: 'Remove the availability rules from a calendar, reverting to the default (no buffers, no working-hours mask). Returns the deleted row, or an error if none were set.',
    schema: schemas.ClearAvailabilityRulesSchema,
    annotations: { title: 'Clear Availability Rules', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.clearAvailabilityRules),
  },

  // ── Webhooks ───────────────────────────────────────────────────
  {
    name: 'list_webhooks',
    description: 'List the org\'s webhook subscriptions with their subscribed event types and active state. Signing secrets are never returned. Requires an org-level API key.',
    schema: schemas.ListWebhooksSchema,
    annotations: { title: 'List Webhooks', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listWebhooks),
  },
  {
    name: 'get_webhook',
    description: 'Get a single webhook subscription by id, including its subscribed event types and active state. The signing secret is never returned. Requires an org-level API key.',
    schema: schemas.GetWebhookSchema,
    annotations: { title: 'Get Webhook', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getWebhook),
  },
  {
    name: 'create_webhook',
    description: 'Create a webhook subscription so the org receives HTTP POST notifications when events occur (e.g. event.created, proposal.confirmed). The signing secret is returned ONCE in this response — store it to verify the HMAC-SHA256 signature on delivered payloads. Requires an org-level API key.',
    schema: schemas.CreateWebhookSchema,
    annotations: { title: 'Create Webhook', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createWebhook),
  },
  {
    name: 'update_webhook',
    description: 'Update a webhook subscription — change its delivery URL, the set of subscribed event types, or pause/resume it via active. At least one field must be supplied. Requires an org-level API key.',
    schema: schemas.UpdateWebhookSchema,
    annotations: { title: 'Update Webhook', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateWebhook),
  },
  {
    name: 'delete_webhook',
    description: 'Permanently delete a webhook subscription. This frees its endpoint slot against the per-plan cap. Requires an org-level API key.',
    schema: schemas.DeleteWebhookSchema,
    annotations: { title: 'Delete Webhook', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteWebhook),
  },
  {
    name: 'list_webhook_deliveries',
    description: 'List delivery attempts for a webhook subscription, with per-status counts (pending/delivered/failed). Use this to debug failing deliveries. Requires an org-level API key.',
    schema: schemas.ListWebhookDeliveriesSchema,
    annotations: { title: 'List Webhook Deliveries', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listWebhookDeliveries),
  },

  // ── iCal Subscriptions ─────────────────────────────────────────
  {
    name: 'list_ical_subscriptions',
    description: "List an agent's external iCal feed subscriptions (e.g. linked Google Calendar / Outlook feeds), including their sync status and last sync time.",
    schema: schemas.ListICalSubscriptionsSchema,
    annotations: { title: 'List iCal Subscriptions', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listICalSubscriptions),
  },
  {
    name: 'get_ical_subscription',
    description: 'Get a single external iCal feed subscription by id, including its sync status, last sync time, and last error.',
    schema: schemas.GetICalSubscriptionSchema,
    annotations: { title: 'Get iCal Subscription', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getICalSubscription),
  },
  {
    name: 'subscribe_ical',
    description: "Link an external iCal feed (e.g. a human's Google Calendar) to an agent's calendar so external events appear in availability calculations. The target calendar must be owned by the specified agent — create the calendar with that agent_id first (org-level calendars without an agent_id cannot host external iCal subscriptions; create a dedicated per-agent calendar for sync targets).",
    schema: schemas.SubscribeICalSchema,
    annotations: { title: 'Subscribe iCal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    execute: createExecutor(fns.subscribeICal),
  },
  {
    name: 'update_ical_subscription',
    description: 'Update an external iCal feed subscription — change its label or its feed URL. Changing the URL forces a full re-sync on the next poll.',
    schema: schemas.UpdateICalSubscriptionSchema,
    annotations: { title: 'Update iCal Subscription', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateICalSubscription),
  },
  {
    name: 'delete_ical_subscription',
    description: 'Delete an external iCal feed subscription. Events previously synced from the feed are no longer refreshed.',
    schema: schemas.DeleteICalSubscriptionSchema,
    annotations: { title: 'Delete iCal Subscription', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteICalSubscription),
  },
  {
    name: 'sync_ical_subscription',
    description: 'Trigger an immediate sync of an external iCal feed subscription instead of waiting for the next scheduled poll. Returns once the sync has been queued.',
    schema: schemas.SyncICalSubscriptionSchema,
    annotations: { title: 'Sync iCal Subscription', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    execute: createExecutor(fns.syncICalSubscription),
  },

  // ── Scoped keys ────────────────────────────────────────────────
  {
    name: 'create_scoped_key',
    description: 'Create an agent-scoped API key (chr_ak_*) that can only act on behalf of a single agent. Use this to self-provision or rotate per-agent credentials. The plaintext key is returned exactly once in the response — store it immediately, it cannot be retrieved later. Requires an org-level API key.',
    schema: schemas.CreateScopedKeySchema,
    annotations: { title: 'Create Scoped Key', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createScopedKey),
  },
  {
    name: 'list_scoped_keys',
    description: 'List all live (non-revoked) agent-scoped API keys for this org. Returns key metadata only (id, prefix, agent_id, label, created_at) — never the plaintext secret. Requires an org-level API key.',
    schema: schemas.ListScopedKeysSchema,
    annotations: { title: 'List Scoped Keys', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listScopedKeys),
  },
  {
    name: 'revoke_scoped_key',
    description: 'Revoke an agent-scoped API key by ID. Revocation is permanent (cannot be un-revoked); the key stops authenticating within about a minute. Requires an org-level API key.',
    schema: schemas.RevokeScopedKeySchema,
    annotations: { title: 'Revoke Scoped Key', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.revokeScopedKey),
  },

  // ── Audit log ──────────────────────────────────────────────────
  {
    name: 'get_audit_log',
    description: 'List audit-log entries for the calling org — mutating operations and auth-lifecycle events, newest first. Results are clamped to the plan\'s retention window. Requires an org-level API key (chr_sk_*); agent-scoped keys cannot read the org-wide audit log.',
    schema: schemas.GetAuditLogSchema,
    annotations: { title: 'Get Audit Log', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAuditLog),
  },

  // ── Terms ──────────────────────────────────────────────────────
  {
    name: 'accept_terms',
    description: 'Re-accept the current Chronary terms of service on behalf of the calling org. Use this when responses carry the Chronary-Terms-Upgrade-Required header — a material ToS bump otherwise leaves MCP-only agents stuck without a console session. Pass the current tos_version (read it from GET /v1/auth/terms/current). Requires an org-level API key (chr_sk_*); agent-scoped keys cannot accept org-wide terms.',
    schema: schemas.AcceptTermsSchema,
    annotations: { title: 'Accept Terms', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.acceptTerms),
  },

  // ── Usage ──────────────────────────────────────────────────────
  {
    name: 'get_usage',
    description: 'Get the calling org\'s current-period usage and plan limits (agents, calendars, events, API calls, webhooks, availability queries, iCal subscriptions, proposals, scoped keys, holds, cross-calendar queries). Requires an org-level API key (chr_sk_*); agent-scoped keys cannot read org-wide usage.',
    schema: schemas.GetUsageSchema,
    annotations: { title: 'Get Usage', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getUsage),
  },
];

const toolkitToolNames = new Set<string>(TOOL_DEFINITIONS.map((tool) => tool.name));
const hostedToolNames = new Set<string>(HOSTED_API_MCP_TOOL_NAMES);

export const TOOLKIT_MCP_PARITY = {
  hostedToolNames: HOSTED_API_MCP_TOOL_NAMES,
  missingHostedTools: HOSTED_API_MCP_TOOL_NAMES.filter((name) => !toolkitToolNames.has(name)),
  toolkitOnlyTools: TOOL_DEFINITIONS.map((tool) => tool.name).filter((name) => !hostedToolNames.has(name)),
};
