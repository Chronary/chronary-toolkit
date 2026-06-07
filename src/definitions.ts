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
    description: 'List calendars, optionally filtered by agent. Returns paginated results.',
    schema: schemas.ListCalendarsSchema,
    annotations: { title: 'List Calendars', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listCalendars),
  },
  {
    name: 'get_calendar',
    description: 'Get a calendar by its ID, including its name, timezone, and iCal feed URL.',
    schema: schemas.GetCalendarSchema,
    annotations: { title: 'Get Calendar', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getCalendar),
  },
  {
    name: 'create_calendar',
    description: 'Create a new calendar. Specify a name and IANA timezone. Optionally scope it to an agent.',
    schema: schemas.CreateCalendarSchema,
    annotations: { title: 'Create Calendar', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createCalendar),
  },
  {
    name: 'update_calendar',
    description: 'Update a calendar\'s name, timezone, or metadata.',
    schema: schemas.UpdateCalendarSchema,
    annotations: { title: 'Update Calendar', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateCalendar),
  },
  {
    name: 'delete_calendar',
    description: 'Permanently delete a calendar and all its events.',
    schema: schemas.DeleteCalendarSchema,
    annotations: { title: 'Delete Calendar', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteCalendar),
  },

  // ── Events ─────────────────────────────────────────────────────
  {
    name: 'list_events',
    description: 'List events on a calendar or for an agent. Supports date range and status filters. Provide calendar_id or agent_id.',
    schema: schemas.ListEventsSchema,
    annotations: { title: 'List Events', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listEvents),
  },
  {
    name: 'get_event',
    description: 'Get a specific event by its calendar ID and event ID.',
    schema: schemas.GetEventSchema,
    annotations: { title: 'Get Event', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getEvent),
  },
  {
    name: 'create_event',
    description: 'Create a new event on a calendar. The event blocks the agent\'s availability during the specified time window and appears in availability queries.',
    schema: schemas.CreateEventSchema,
    annotations: { title: 'Create Event', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createEvent),
  },
  {
    name: 'update_event',
    description: 'Update an existing event\'s title, times, status, or other properties.',
    schema: schemas.UpdateEventSchema,
    annotations: { title: 'Update Event', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateEvent),
  },
  {
    name: 'cancel_event',
    description: 'Delete or cancel an event from a calendar. The event is marked cancelled and excluded from future availability calculations.',
    schema: schemas.CancelEventSchema,
    annotations: { title: 'Cancel Event', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.cancelEvent),
  },
  {
    name: 'confirm_event',
    description: 'Promote a held event to a confirmed booking. The event must currently have status="hold" and its hold_expires_at must not have passed.',
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
    description: 'List all agents in your organization. Returns paginated results.',
    schema: schemas.ListAgentsSchema,
    annotations: { title: 'List Agents', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listAgents),
  },
  {
    name: 'get_agent',
    description: 'Fetch a single agent by ID. An agent represents an AI assistant, human, or shared resource (e.g. a meeting room).',
    schema: schemas.GetAgentSchema,
    annotations: { title: 'Get Agent', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAgent),
  },
  {
    name: 'update_agent',
    description: 'Update an agent\'s name, description, metadata, or status (active/paused). Requires an org-level API key.',
    schema: schemas.UpdateAgentSchema,
    annotations: { title: 'Update Agent', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateAgent),
  },
  {
    name: 'delete_agent',
    description: 'Decommission an agent. This marks the agent as decommissioned and revokes all of its scoped API keys. Requires an org-level API key.',
    schema: schemas.DeleteAgentSchema,
    annotations: { title: 'Delete Agent', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteAgent),
  },

  // ── Availability ───────────────────────────────────────────────
  {
    name: 'get_availability',
    description: 'Check when a single agent is free within a time range. Returns available time slots and optionally busy blocks.',
    schema: schemas.GetAvailabilitySchema,
    annotations: { title: 'Get Availability', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAvailability),
  },
  {
    name: 'find_meeting_time',
    description: 'Find time slots when multiple agents are all free simultaneously. All agents must be free during the returned slots.',
    schema: schemas.FindMeetingTimeSchema,
    annotations: { title: 'Find Meeting Time', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.findMeetingTime),
  },

  // ── Calendar context ───────────────────────────────────────────
  {
    name: 'get_calendar_context',
    description: 'Get a calendar\'s temporal context in a single call: the current event, the next upcoming event, recent past events, a short upcoming window, and the owning agent\'s status.',
    schema: schemas.GetCalendarContextSchema,
    annotations: { title: 'Get Calendar Context', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getCalendarContext),
  },

  // ── Scheduling proposals ───────────────────────────────────────
  {
    name: 'create_proposal',
    description: 'Create a scheduling proposal — send candidate time slots to one or more participant agents so they can accept, decline, or counter-propose. Requires an org-level API key. Pro plan only.',
    schema: schemas.CreateProposalSchema,
    annotations: { title: 'Create Proposal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createProposal),
  },
  {
    name: 'list_proposals',
    description: 'List scheduling proposals for the org. Filter by status or organizer_agent_id. Requires an org-level API key.',
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
    description: 'Submit a response (accept / decline / counter) on behalf of one participant agent to an open proposal. Requires an org-level API key. Pro plan only.',
    schema: schemas.RespondToProposalSchema,
    annotations: { title: 'Respond To Proposal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.respondToProposal),
  },
  {
    name: 'resolve_proposal',
    description: 'Force-resolve an open proposal using responses collected so far. Picks the highest-scoring slot and creates a confirmed calendar event. Requires an org-level API key. Pro plan only.',
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
    description: 'Set or replace the availability rules on a calendar — buffer times before/after events and optional per-day working hours. Upsert: overwrites any existing rules.',
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
    description: 'Remove the availability rules from a calendar, reverting to the default (no buffers, no working-hours mask).',
    schema: schemas.ClearAvailabilityRulesSchema,
    annotations: { title: 'Clear Availability Rules', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.clearAvailabilityRules),
  },

  // ── Webhooks ───────────────────────────────────────────────────
  {
    name: 'list_webhooks',
    description: 'List all webhook subscriptions for the organization.',
    schema: schemas.ListWebhooksSchema,
    annotations: { title: 'List Webhooks', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listWebhooks),
  },
  {
    name: 'get_webhook',
    description: 'Get a webhook subscription by its ID.',
    schema: schemas.GetWebhookSchema,
    annotations: { title: 'Get Webhook', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getWebhook),
  },
  {
    name: 'create_webhook',
    description: 'Create a webhook subscription to receive event notifications at a URL. Payloads are signed with HMAC-SHA256.',
    schema: schemas.CreateWebhookSchema,
    annotations: { title: 'Create Webhook', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createWebhook),
  },
  {
    name: 'update_webhook',
    description: 'Update a webhook\'s URL, subscribed events, or active status.',
    schema: schemas.UpdateWebhookSchema,
    annotations: { title: 'Update Webhook', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateWebhook),
  },
  {
    name: 'delete_webhook',
    description: 'Delete a webhook subscription. No further events will be delivered to this URL.',
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
    description: 'List external calendar imports (iCal subscriptions) for an agent.',
    schema: schemas.ListICalSubscriptionsSchema,
    annotations: { title: 'List iCal Subscriptions', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listICalSubscriptions),
  },
  {
    name: 'get_ical_subscription',
    description: 'Get an iCal subscription by its ID, including sync status and last error.',
    schema: schemas.GetICalSubscriptionSchema,
    annotations: { title: 'Get iCal Subscription', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getICalSubscription),
  },
  {
    name: 'subscribe_ical',
    description: 'Link an external iCal feed (e.g. a human\'s Google Calendar) to an agent\'s calendar so external events appear in availability calculations. Events are synced every 30 minutes.',
    schema: schemas.SubscribeICalSchema,
    annotations: { title: 'Subscribe iCal', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    execute: createExecutor(fns.subscribeICal),
  },
  {
    name: 'update_ical_subscription',
    description: 'Update an iCal subscription\'s label or feed URL.',
    schema: schemas.UpdateICalSubscriptionSchema,
    annotations: { title: 'Update iCal Subscription', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.updateICalSubscription),
  },
  {
    name: 'delete_ical_subscription',
    description: 'Remove an external calendar import. Previously synced events remain on the calendar.',
    schema: schemas.DeleteICalSubscriptionSchema,
    annotations: { title: 'Delete iCal Subscription', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteICalSubscription),
  },
  {
    name: 'sync_ical_subscription',
    description: 'Trigger an immediate sync of an iCal subscription instead of waiting for the next 30-minute poll.',
    schema: schemas.SyncICalSubscriptionSchema,
    annotations: { title: 'Sync iCal Subscription', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    execute: createExecutor(fns.syncICalSubscription),
  },

  // ── Scoped keys ────────────────────────────────────────────────
  {
    name: 'create_scoped_key',
    description: 'Create an agent-scoped API key (chr_ak_*) that can only act on behalf of a single agent. The plaintext key is returned exactly once. Requires an org-level API key.',
    schema: schemas.CreateScopedKeySchema,
    annotations: { title: 'Create Scoped Key', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    execute: createExecutor(fns.createScopedKey),
  },
  {
    name: 'list_scoped_keys',
    description: 'List all live (non-revoked) agent-scoped API keys for this org. Returns key metadata only — never the plaintext secret. Requires an org-level API key.',
    schema: schemas.ListScopedKeysSchema,
    annotations: { title: 'List Scoped Keys', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.listScopedKeys),
  },
  {
    name: 'revoke_scoped_key',
    description: 'Revoke an agent-scoped API key by ID. The key stops authenticating immediately and cannot be un-revoked. Requires an org-level API key.',
    schema: schemas.RevokeScopedKeySchema,
    annotations: { title: 'Revoke Scoped Key', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.revokeScopedKey),
  },

  // ── Audit log ──────────────────────────────────────────────────
  {
    name: 'get_audit_log',
    description: 'List audit-log entries for the calling org — mutating operations and auth-lifecycle events, newest first. Results are clamped to the plan\'s retention window. Requires an org-level API key.',
    schema: schemas.GetAuditLogSchema,
    annotations: { title: 'Get Audit Log', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.getAuditLog),
  },

  // ── Terms ──────────────────────────────────────────────────────
  {
    name: 'accept_terms',
    description: 'Re-accept the current Chronary terms of service on behalf of the calling org. Use this when responses carry the Chronary-Terms-Upgrade-Required header. Requires an org-level API key.',
    schema: schemas.AcceptTermsSchema,
    annotations: { title: 'Accept Terms', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.acceptTerms),
  },

  // ── Usage ──────────────────────────────────────────────────────
  {
    name: 'get_usage',
    description: 'Get quota and usage statistics for the current billing period.',
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
