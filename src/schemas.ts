import { z } from 'zod';

// Webhook event types and delivery statuses — kept in lockstep with the hosted
// MCP server's `@chronary/shared` WEBHOOK_EVENT_TYPES / WEBHOOK_DELIVERY_STATUSES.
// Inlined here because the toolkit deliberately does not depend on @chronary/shared.
const WEBHOOK_EVENT_TYPES = [
  'agent.created',
  'agent.updated',
  'event.created',
  'event.updated',
  'event.deleted',
  'event.started',
  'event.ended',
  'event.reminder',
  'event.hold_created',
  'event.hold_expired',
  'event.hold_released',
  'event.hold_confirmed',
  'proposal.created',
  'proposal.responded',
  'proposal.confirmed',
  'proposal.expired',
  'proposal.cancelled',
  'webhook.deactivated',
] as const;

const WEBHOOK_DELIVERY_STATUSES = ['pending', 'delivered', 'failed'] as const;

// ── Calendars ──────────────────────────────────────────────────

export const ListCalendarsSchema = z.object({
  agent_id: z.string().optional().describe('Filter to calendars owned by this agent. Org keys only — agent-scoped keys are always limited to their own agent and ignore this.'),
  include: z.enum(['all']).optional().describe('Pass "all" to include calendars across all agents (org keys only)'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
});

export const GetCalendarSchema = z.object({
  calendar_id: z.string().describe('Calendar ID to fetch'),
});

export const CreateCalendarSchema = z.object({
  name: z.string().min(1).max(255).describe('Calendar name'),
  agent_id: z.string().optional().describe('Agent ID to own this calendar (omit for org-level)'),
  timezone: z.string().min(1).describe('IANA timezone (e.g. America/New_York)'),
  default_reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Default reminder offsets in minutes before start, inherited by events on this calendar that don\'t set their own. Omit or null to use the system default (10 min); [] for no reminders.'),
});

export const UpdateCalendarSchema = z.object({
  calendar_id: z.string().describe('Calendar ID to update'),
  name: z.string().min(1).max(255).optional().describe('New calendar name'),
  timezone: z.string().min(1).optional().describe('New IANA timezone (e.g. America/New_York)'),
  agent_status: z.enum(['idle', 'working', 'waiting', 'error']).optional().describe('Owning agent\'s status'),
  default_reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Default reminder offsets in minutes; null for system default, [] for none'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Arbitrary metadata (max 16KB)'),
});

export const DeleteCalendarSchema = z.object({
  calendar_id: z.string().describe('Calendar ID to delete'),
});

// ── Events ─────────────────────────────────────────────────────

export const ListEventsSchema = z.object({
  calendar_id: z.string().optional().describe('Calendar ID to list events from. Provide this or agent_id.'),
  agent_id: z.string().optional().describe('Agent ID to list events for across all of the agent\'s calendars. Provide this or calendar_id.'),
  start_after: z.string().datetime().optional().describe('Only events starting after this ISO 8601 time'),
  start_before: z.string().datetime().optional().describe('Only events starting before this ISO 8601 time'),
  status: z.enum(['confirmed', 'tentative', 'cancelled', 'hold']).optional().describe('Filter by event status'),
  source: z.enum(['internal', 'external_ical']).optional().describe('Filter by source: "internal" (created via the API) or "external_ical" (synced from an iCal subscription)'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  expand: z.boolean().default(false).describe('Expand recurring series into individual occurrence instances within the window. Requires both start_after and start_before (max 366 days apart). Instances carry recurringEventId + originalStartTime.'),
});

export const GetEventSchema = z.object({
  event_id: z.string().describe('Event ID to retrieve'),
  calendar_id: z.string().optional().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event.'),
});

export const CreateEventSchema = z.object({
  calendar_id: z.string().describe('Calendar ID to add the event to'),
  title: z.string().min(1).max(500).describe('Event title'),
  start_time: z.string().datetime().describe('Start time (ISO 8601)'),
  end_time: z.string().datetime().describe('End time (ISO 8601)'),
  description: z.string().optional().describe('Optional event description'),
  all_day: z.boolean().default(false).describe('Whether this is an all-day event'),
  status: z.enum(['confirmed', 'tentative', 'hold']).optional().describe('Event status. "hold" creates a tentative reservation that auto-expires at hold_expires_at. Defaults to "confirmed".'),
  reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Reminder offsets in minutes before start_time (e.g. [10, 1440]). Each fires an event.reminder webhook and shows as an alarm in the iCal feed. Omit or null to inherit the calendar default (then the system default of 10 min); [] for no reminders.'),
  hold_expires_at: z.string().datetime().optional().describe('Required when status="hold". ISO 8601 timestamp 30s-15min in the future. Auto-releases the hold when reached.'),
  hold_priority: z.number().int().min(0).max(100).optional().describe('Only valid with status="hold". Higher-priority overlapping holds pre-empt lower-priority ones. Defaults to 0.'),
  recurrence_rule: z.string().max(256).optional().describe('Make this a recurring series (RFC 5545 RRULE subset, no "RRULE:" prefix), e.g. "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12". Supports FREQ=DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL, COUNT (max 730) or UNTIL, BYDAY (weekly list or monthly ordinal like 2TU/-1FR), BYMONTHDAY (1-28 or -1). start_time must match the rule pattern; expansion is UTC-only. Not allowed with status="hold". Free plan: max 5 recurring events, series must end within 90 days.'),
});

export const UpdateEventSchema = z.object({
  event_id: z.string().describe('Event ID to update'),
  calendar_id: z.string().optional().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event.'),
  title: z.string().min(1).max(500).optional().describe('New event title'),
  description: z.string().nullable().optional().describe('New description, or null to clear it'),
  start_time: z.string().datetime().optional().describe('New start time (ISO 8601)'),
  end_time: z.string().datetime().optional().describe('New end time (ISO 8601)'),
  all_day: z.boolean().optional().describe('Whether this is an all-day event'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('New event status'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Replacement metadata object'),
  reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Reminder offsets in minutes before start_time. Omit to leave unchanged, null to inherit the calendar default, [] for no reminders.'),
  recurrence_rule: z.string().max(256).nullable().optional().describe('Set/change the recurring series rule (RFC 5545 RRULE subset, full-series semantics), or null to make the event a one-off. Changing the rule or start_time resets cancelled occurrences.'),
});

export const CancelEventSchema = z.object({
  event_id: z.string().describe('Event ID to cancel'),
  calendar_id: z.string().optional().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event. Matches the asymmetry with confirm_event / release_event which never required this arg.'),
  occurrence_start: z.string().datetime().optional().describe('For recurring events only: ISO 8601 start of the single occurrence to cancel. The rest of the series is unaffected.'),
});

export const ConfirmEventSchema = z.object({
  event_id: z.string().describe('Event ID of the hold to confirm'),
});

export const ReleaseEventSchema = z.object({
  event_id: z.string().describe('Event ID of the hold to release'),
});

// ── Agents ─────────────────────────────────────────────────────

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(255).describe('Display name for the agent'),
  type: z.enum(['ai', 'human', 'resource']).describe('Agent type'),
  description: z.string().optional().describe('Optional description'),
});

export const ListAgentsSchema = z.object({
  type: z.enum(['ai', 'human', 'resource']).optional().describe('Filter by agent type'),
  status: z.enum(['active', 'paused', 'decommissioned']).optional().describe('Filter by status'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
});

export const GetAgentSchema = z.object({
  agent_id: z.string().describe('Agent ID to fetch'),
});

export const UpdateAgentSchema = z.object({
  agent_id: z.string().describe('Agent ID to update'),
  name: z.string().min(1).max(255).optional().describe('New display name'),
  description: z.string().nullable().optional().describe('New description (null to clear)'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Arbitrary metadata (max 16KB)'),
  status: z.enum(['active', 'paused']).optional().describe('Operational status'),
});

export const DeleteAgentSchema = z.object({
  agent_id: z.string().describe('Agent ID to decommission'),
});

// ── Availability ───────────────────────────────────────────────

export const GetAvailabilitySchema = z.object({
  agent_id: z.string().describe('Agent ID to check availability for'),
  start: z.string().datetime().optional().describe('Range start (ISO 8601). Alias: start_time.'),
  end: z.string().datetime().optional().describe('Range end (ISO 8601). Alias: end_time.'),
  start_time: z.string().datetime().optional().describe('Alias for `start` (matches REST events naming).'),
  end_time: z.string().datetime().optional().describe('Alias for `end` (matches REST events naming).'),
  duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Requested slot length (15m/30m/45m/1h/2h). Preferred over the deprecated slot_duration. Defaults to 30m.'),
  slot_duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Deprecated alias for `duration` — minimum slot length. Prefer `duration`.'),
  include_busy: z.boolean().default(false).describe('Include busy blocks in response'),
});

export const FindMeetingTimeSchema = z.object({
  agents: z.array(z.string()).min(1).optional().describe('Array of agent IDs to find common free time for. All agents must be free during the returned slots. Alias: agent_ids.'),
  agent_ids: z.array(z.string()).min(1).optional().describe('Alias for `agents` (matches REST/scheduling-proposal naming).'),
  start: z.string().datetime().optional().describe('Search range start (ISO 8601). Alias: start_time.'),
  end: z.string().datetime().optional().describe('Search range end (ISO 8601). Alias: end_time.'),
  start_time: z.string().datetime().optional().describe('Alias for `start` (matches REST events naming).'),
  end_time: z.string().datetime().optional().describe('Alias for `end` (matches REST events naming).'),
  duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Requested slot length (15m/30m/45m/1h/2h). Preferred over the deprecated slot_duration. Defaults to 30m.'),
  slot_duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Deprecated alias for `duration` — minimum slot length. Prefer `duration`.'),
  calendars: z.array(z.string()).optional().describe('Additional shared calendar IDs to treat as busy'),
  include_busy: z.boolean().default(false).describe('Include per-agent busy blocks in response'),
});

// ── Calendar context ───────────────────────────────────────────

export const GetCalendarContextSchema = z.object({
  calendar_id: z.string().describe('Calendar ID'),
});

// ── Scheduling proposals ───────────────────────────────────────

const proposalSlotSchema = z.object({
  start_time: z.string().datetime().describe('Slot start time (ISO 8601)'),
  end_time: z.string().datetime().describe('Slot end time (ISO 8601), after start_time'),
  weight: z.number().min(0).max(10).default(1.0).optional().describe('Preference for this slot, 0–10 (higher = more preferred). Used to rank candidate slots when the proposal is resolved. Defaults to 1.'),
  calendar_id: z.string().optional().describe('Calendar to create the event on if this slot is chosen. Defaults to the proposal\'s top-level calendar_id.'),
});

export const CreateProposalSchema = z.object({
  title: z.string().min(1).max(500).describe('Short description of what the meeting is about'),
  description: z.string().max(5000).optional().describe('Longer context/agenda'),
  organizer_agent_id: z.string().describe('Agent ID proposing the meeting'),
  participant_agent_ids: z.array(z.string()).min(1).max(50).describe('Agent IDs invited to respond'),
  calendar_id: z.string().describe('Calendar the resolved event will be created on'),
  slots: z.array(proposalSlotSchema).min(1).max(20).describe('Candidate time slots (up to 20)'),
  expires_at: z.string().datetime().optional().describe('Auto-cancel cutoff if unresolved'),
});

export const ListProposalsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'expired', 'cancelled']).optional().describe('Filter by proposal status'),
  organizer_agent_id: z.string().optional().describe('Filter by organizer agent'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results (default 50)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
});

export const GetProposalSchema = z.object({
  proposal_id: z.string().describe('Proposal to fetch'),
});

export const RespondToProposalSchema = z.object({
  proposal_id: z.string().describe('Proposal to respond to'),
  agent_id: z.string().describe('Participant agent responding'),
  response: z.enum(['accept', 'decline', 'counter']).describe('Decision from this agent'),
  selected_slot_id: z.string().optional().describe('Required when response is "accept"'),
  counter_slots: z.array(proposalSlotSchema).max(20).optional().describe('Alternative slots when response is "counter"'),
  message: z.string().max(2000).optional().describe('Optional note for the organizer'),
});

export const ResolveProposalSchema = z.object({
  proposal_id: z.string().describe('Proposal to resolve'),
});

export const CancelProposalSchema = z.object({
  proposal_id: z.string().describe('Proposal to cancel'),
});

// ── Availability rules ─────────────────────────────────────────

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:MM in 24-hour time');

const workingHoursDaySchema = z.object({
  start: timeOfDay.describe('Start of the working window, HH:MM 24-hour, in the rules timezone (e.g. "09:00")'),
  end: timeOfDay.describe('End of the working window, HH:MM 24-hour, after start (e.g. "17:00")'),
})
  .refine((v) => v.end > v.start, 'end must be after start')
  .describe('A single day\'s working hours window');

const workingHoursSchema = z.object({
  mon: workingHoursDaySchema.optional(),
  tue: workingHoursDaySchema.optional(),
  wed: workingHoursDaySchema.optional(),
  thu: workingHoursDaySchema.optional(),
  fri: workingHoursDaySchema.optional(),
  sat: workingHoursDaySchema.optional(),
  sun: workingHoursDaySchema.optional(),
})
  .refine((v) => Object.keys(v).length > 0, 'at least one day must be specified')
  .nullable();

export const SetAvailabilityRulesSchema = z.object({
  calendar_id: z.string().describe('Calendar to configure'),
  buffer_before_minutes: z.number().int().min(0).max(120).default(0).describe('Minutes of buffer before each event (0–120)'),
  buffer_after_minutes: z.number().int().min(0).max(120).default(0).describe('Minutes of buffer after each event (0–120)'),
  working_hours: workingHoursSchema.default(null).describe('Per-day working hours map in the calendar\'s timezone; omit keys for off-days. Pass null to remove any working-hours constraint.'),
  timezone: z.string().min(1).max(64).default('UTC').describe('IANA timezone used to interpret working_hours (e.g. America/New_York)'),
});

export const GetAvailabilityRulesSchema = z.object({
  calendar_id: z.string().describe('Calendar to read'),
});

export const ClearAvailabilityRulesSchema = z.object({
  calendar_id: z.string().describe('Calendar whose rules should be cleared'),
});

// ── Scoped keys ────────────────────────────────────────────────

export const CreateScopedKeySchema = z.object({
  agent_id: z.string().regex(/^agt_/).describe('Agent ID this key is scoped to'),
  label: z.string().min(1).max(100).optional().describe('Human-readable label for the key'),
});

export const ListScopedKeysSchema = z.object({});

export const RevokeScopedKeySchema = z.object({
  key_id: z.string().describe('ID of the scoped key to revoke'),
});

// ── Audit log ──────────────────────────────────────────────────

export const GetAuditLogSchema = z.object({
  from: z.string().datetime({ offset: true }).optional().describe('Start of the window (ISO 8601). Silently clamped to the plan retention window if older.'),
  to: z.string().datetime({ offset: true }).optional().describe('End of the window (ISO 8601)'),
  action: z.string().min(1).max(64).optional().describe('Filter by action name (e.g. event.created)'),
  actor_key_prefix: z.string().min(1).max(32).optional().describe('Filter by the API key prefix that performed the action'),
  cursor: z.string().min(1).max(256).optional().describe('Opaque pagination cursor from a previous response'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results to return (default 50)'),
});

// ── Terms ──────────────────────────────────────────────────────

export const AcceptTermsSchema = z.object({
  tos_version: z.string().min(1).describe('The terms-of-service version to accept; must match the current version'),
});

// ── Webhooks ───────────────────────────────────────────────────

export const ListWebhooksSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
});

export const GetWebhookSchema = z.object({
  webhook_id: z.string().describe('Webhook subscription to fetch'),
});

export const CreateWebhookSchema = z.object({
  url: z.string().url().describe('HTTPS endpoint that will receive event deliveries'),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).describe('Event types to subscribe to'),
});

export const UpdateWebhookSchema = z.object({
  webhook_id: z.string().describe('Webhook subscription to update'),
  url: z.string().url().optional().describe('New HTTPS delivery endpoint'),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).optional().describe('Replacement set of event types to subscribe to'),
  active: z.boolean().optional().describe('Set false to pause deliveries, true to resume'),
});

export const DeleteWebhookSchema = z.object({
  webhook_id: z.string().describe('Webhook subscription to delete'),
});

export const ListWebhookDeliveriesSchema = z.object({
  webhook_id: z.string().describe('Webhook subscription whose deliveries to list'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  status: z.enum(WEBHOOK_DELIVERY_STATUSES).optional().describe('Filter to a single delivery status'),
  include_payload: z.boolean().optional().describe('Include the full event payload sent on each delivery'),
});

// ── iCal Subscriptions ─────────────────────────────────────────

export const ListICalSubscriptionsSchema = z.object({
  agent_id: z.string().describe('Agent ID whose iCal subscriptions to list'),
  status: z.enum(['active', 'error', 'paused']).optional().describe('Filter by subscription status'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
});

export const GetICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('iCal subscription ID to fetch'),
});

export const SubscribeICalSchema = z.object({
  agent_id: z.string().describe('Agent ID that will own this subscription'),
  calendar_id: z.string().describe('Calendar ID to sync external events into'),
  url: z.string().url().describe('HTTPS URL of the iCal feed (.ics) to subscribe to'),
  label: z.string().optional().describe('Optional label for this subscription'),
});

export const UpdateICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('iCal subscription ID to update'),
  label: z.string().min(1).max(255).optional().describe('New label for this subscription'),
  url: z.string().url().startsWith('https://', 'URL must use HTTPS').optional().describe('New HTTPS URL of the iCal feed (.ics)'),
});

export const DeleteICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('iCal subscription ID to delete'),
});

export const SyncICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('iCal subscription ID to sync'),
});

// ── Usage ──────────────────────────────────────────────────────

export const GetUsageSchema = z.object({});
