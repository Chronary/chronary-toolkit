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
  'org.plan_changed',
  'calendar_connection.reauthorization_required',
  'usage.threshold_crossed',
] as const;

const WEBHOOK_DELIVERY_STATUSES = ['pending', 'delivered', 'failed', 'dropped'] as const;

/**
 * A Chronary resource ID as a tool argument (#2519). IDs are a prefix plus a
 * nanoid (`A-Za-z0-9_-`), or a UUID for scoped keys, so this charset accepts
 * every real ID and refuses `.`, `/`, `?`, `#` and `%`. The SDK puts these
 * values into the URL path; without this, a prompt-injected
 * `../agents/agt_main` could steer a tool call onto another resource.
 */
const ID_CHARSET = /^[A-Za-z0-9_-]*$/;
const ID_MESSAGE = 'must be a Chronary ID (letters, digits, "_" and "-" only)';
const resourceId = () => z.string().min(1).max(128).regex(ID_CHARSET, ID_MESSAGE);

/**
 * An optional resource ID. Many hosts fill an omitted optional string with
 * `""`; that has always meant "not given" (e.g. `cancel_event` without
 * `calendar_id` resolves the calendar from the event), so `""` becomes
 * `undefined` before the charset check instead of failing it.
 */
const optionalResourceId = (inner: z.ZodString = z.string().max(128).regex(ID_CHARSET, ID_MESSAGE)) =>
  z.preprocess((v) => (v === '' ? undefined : v), inner.optional());

// ── Calendars ──────────────────────────────────────────────────

export const ListCalendarsSchema = z.object({
  agent_id: optionalResourceId().describe('Filter to calendars owned by this agent. Organization keys only — Agent keys are always limited to their own agent and ignore this.'),
  include: z.enum(['all']).optional().describe('Pass "all" to include calendars across all agents (Organization keys only)'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000. Cannot be combined with cursor'),
  cursor: z.string().min(1).max(1024).optional().describe('The next_cursor from the previous page'),
}).refine((v) => v.cursor === undefined || !v.offset, { message: 'cursor and offset cannot be combined', path: ['cursor'] });

export const GetCalendarSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID to fetch'),
});

export const CreateCalendarSchema = z.object({
  name: z.string().min(1).max(255).describe('Calendar name'),
  agent_id: optionalResourceId().describe('Agent ID to own this calendar (omit for org-level)'),
  timezone: z.string().min(1).max(64).describe('IANA timezone (e.g. America/New_York)'),
  default_reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Default reminder offsets in minutes before start, inherited by events on this calendar that don\'t set their own. Omit or null to use the system default (10 min); [] for no reminders.'),
});

export const UpdateCalendarSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID to update'),
  name: z.string().min(1).max(255).optional().describe('New calendar name'),
  timezone: z.string().min(1).max(64).optional().describe('New IANA timezone (e.g. America/New_York)'),
  agent_status: z.enum(['idle', 'working', 'waiting', 'error']).optional().describe('Owning agent\'s status'),
  default_reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Default reminder offsets in minutes; null for system default, [] for none'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Arbitrary metadata (max 16KB)'),
});

export const DeleteCalendarSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID to delete'),
});

// ── Weekly working hours (availability rules + booking pages) ──
// The hosted API's WorkingHoursSchema: mon..sun keys, HH:MM 24-hour, end after
// start, at least one day.

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:MM in 24-hour time');

const workingHoursDaySchema = z.object({
  start: timeOfDay.describe('Start of the working window, HH:MM 24-hour, in the timezone of the availability rules or booking page it belongs to (e.g. "09:00")'),
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

// ── Booking pages ──────────────────────────────────────────────

export const ListBookingPagesSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000'),
});

export const GetBookingPageSchema = z.object({
  booking_page_id: resourceId().describe('Booking page ID to fetch (bkp_...)'),
});

export const CreateBookingPageSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID a booking resolves to.'),
  title: z.string().min(1).max(200).describe('Meeting title shown on the page.'),
  description: z.string().max(2000).optional().describe('Optional description shown to the booker.'),
  duration_minutes: z.number().int().min(5).max(480).optional().describe('Slot length in minutes (default 30).'),
  buffer_minutes: z.number().int().min(0).max(120).optional().describe('Padding before/after existing events (default 0).'),
  window_days: z.number().int().min(1).max(365).optional().describe('How far ahead bookings are allowed (default 14).'),
  min_notice_minutes: z.number().int().min(0).max(40320).optional().describe('Minimum lead time before a bookable slot (default 0).'),
  timezone: z.string().min(1).max(64).optional().describe('IANA timezone for display + working hours (default UTC).'),
  // Same shape the hosted API validates (#2525).
  availability_constraints: workingHoursSchema
    .optional()
    .describe('Weekly working hours keyed by day (mon, tue, wed, thu, fri, sat, sun; a day left out takes no bookings), each {"start":"HH:MM","end":"HH:MM"} in 24-hour time with end after start, e.g. {"mon":{"start":"09:00","end":"17:00"}}. Omit/null for any time in the window.'),
  active: z.boolean().optional().describe('Whether the page accepts bookings (default true).'),
});

export const DeleteBookingPageSchema = z.object({
  booking_page_id: resourceId().describe('Booking page ID to delete (bkp_...)'),
});

// ── Events ─────────────────────────────────────────────────────

export const ListEventsSchema = z.object({
  calendar_id: optionalResourceId().describe('Calendar ID to list events from. Provide this or agent_id, not both.'),
  agent_id: optionalResourceId().describe('Agent ID to list events for across all of the agent\'s calendars. Provide this or calendar_id, not both.'),
  start_after: z.string().datetime({ offset: true }).optional().describe('Only events starting after this ISO 8601 time'),
  start_before: z.string().datetime({ offset: true }).optional().describe('Only events starting before this ISO 8601 time'),
  status: z.enum(['confirmed', 'tentative', 'cancelled', 'hold']).optional().describe('Filter by event status'),
  source: z.enum(['internal', 'external_ical']).optional().describe('Filter by source: "internal" (created via the API) or "external_ical" (synced from an iCal subscription)'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000'),
  expand: z.boolean().default(false).describe('Expand recurring series into individual occurrence instances within the window. Requires both start_after and start_before (max 366 days apart). Instances carry recurringEventId + originalStartTime.'),
});

export const ListOrgEventsSchema = z.object({
  calendar_ids: z.array(z.string()).max(50).optional().describe('Only these calendar IDs (at most 50)'),
  agent_id: optionalResourceId().describe('Only this agent\'s calendars'),
  start_after: z.string().datetime({ offset: true }).optional().describe('Only events starting at or after this ISO 8601 time'),
  start_before: z.string().datetime({ offset: true }).optional().describe('Only events starting at or before this ISO 8601 time'),
  status: z.enum(['confirmed', 'tentative', 'cancelled', 'hold']).optional().describe('Filter by event status'),
  source: z.enum(['internal', 'external_ical']).optional().describe('Filter by source: "internal" (created via the API) or "external_ical" (synced from an iCal subscription)'),
  q: z.string().optional().describe('Case-insensitive title search. Requires start_after and start_before at most 31 days apart'),
  expand: z.boolean().default(false).describe('Expand recurring series into individual occurrences within the window. Requires both start_after and start_before (max 366 days apart).'),
  limit: z.number().int().min(1).max(100).default(50).describe('Max results to return (1-100)'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000. Cannot be combined with cursor'),
  cursor: z.string().min(1).max(1024).optional().describe('The next_cursor from the previous page'),
}).refine((v) => v.cursor === undefined || !v.offset, { message: 'cursor and offset cannot be combined', path: ['cursor'] });

export const GetEventSchema = z.object({
  event_id: resourceId().describe('Event ID to retrieve'),
  calendar_id: optionalResourceId().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event.'),
});

// all_day descriptions, the same text as the hosted MCP server's create_event / update_event (#2566).
const ALL_DAY_CREATE_DESCRIPTION =
  'Whether this is an all-day event. All-day events are stored as whole days: start_time becomes midnight UTC of the date written in start_time (in its own offset), and end_time midnight UTC after the last day the end touches (a T23:59:59 end covers that whole day), at least one day. Availability treats an all-day event as busy for those whole UTC days; for a local-day block, use a timed event.';
const ALL_DAY_UPDATE_DESCRIPTION =
  'Whether this is an all-day event. An all-day event is stored as whole days (midnight UTC of its first day to midnight UTC after its last day); setting true on a timed event widens it to the day(s) it covers. Moving one bound snaps only that bound and keeps the other. When moving an all-day event with a non-UTC offset, also send all_day: true so the written date is kept.';

export const CreateEventSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID to add the event to'),
  title: z.string().min(1).max(500).describe('Event title'),
  start_time: z.string().datetime({ offset: true }).describe('Start time (ISO 8601). For an all-day event, the first day at midnight, e.g. "2026-07-04T00:00:00Z".'),
  end_time: z.string().datetime({ offset: true }).describe('End time (ISO 8601). For an all-day event, midnight after the last day (exclusive), e.g. "2026-07-05T00:00:00Z" for a one-day event.'),
  description: z.string().max(10_000).optional().describe('Optional event description'),
  all_day: z.boolean().default(false).describe(ALL_DAY_CREATE_DESCRIPTION),
  status: z.enum(['confirmed', 'tentative', 'hold']).optional().describe('Event status. "hold" creates a tentative reservation that auto-expires at hold_expires_at. Defaults to "confirmed".'),
  reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Reminder offsets in minutes before start_time (e.g. [10, 1440]). Each fires an event.reminder webhook and shows as an alarm in the iCal feed. Omit or null to inherit the calendar default (then the system default of 10 min); [] for no reminders.'),
  hold_expires_at: z.string().datetime({ offset: true }).optional().describe('Required when status="hold". ISO 8601 timestamp 30s-15min in the future. Auto-releases the hold when reached.'),
  hold_priority: z.number().int().min(0).max(100).optional().describe('Only valid with status="hold". Higher-priority overlapping holds pre-empt lower-priority ones. Defaults to 0.'),
  recurrence_rule: z.string().max(256).optional().describe('Make this a recurring series (RFC 5545 RRULE subset, no "RRULE:" prefix), e.g. "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12". Supports FREQ=DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL, COUNT (max 730) or UNTIL, BYDAY (weekly list or monthly ordinal like 2TU/-1FR), BYMONTHDAY (1-28 or -1). start_time must match the rule pattern (in timezone when set, else UTC). Not allowed with status="hold". Free plan: 1 recurring series, must end within 90 days.'),
  timezone: z.string().max(64).optional().describe('IANA time zone the recurring series repeats in, e.g. "America/Los_Angeles". A weekly 16:00 then stays 16:00 local across daylight-saving changes; BYDAY and a date-only UNTIL are read in this zone. Omit for UTC.'),
});

export const UpdateEventSchema = z.object({
  event_id: resourceId().describe('Event ID to update'),
  calendar_id: optionalResourceId().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event.'),
  title: z.string().min(1).max(500).optional().describe('New event title'),
  description: z.string().max(10_000).nullable().optional().describe('New description, or null to clear it'),
  start_time: z.string().datetime({ offset: true }).optional().describe('New start time (ISO 8601)'),
  end_time: z.string().datetime({ offset: true }).optional().describe('New end time (ISO 8601)'),
  all_day: z.boolean().optional().describe(ALL_DAY_UPDATE_DESCRIPTION),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('New event status'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Replacement metadata object'),
  reminders: z.array(z.number().int().min(1).max(40320)).max(5).nullable().optional().describe('Reminder offsets in minutes before start_time. Omit to leave unchanged, null to inherit the calendar default, [] for no reminders.'),
  recurrence_rule: z.string().max(256).nullable().optional().describe('Set/change the recurring series rule (RFC 5545 RRULE subset, full-series semantics), or null to make the event a one-off. Changing the rule, start_time or timezone keeps each cancelled occurrence on its local date; the response lists any that no longer match in droppedExdates.'),
  timezone: z.string().max(64).nullable().optional().describe('Set or change the IANA time zone the series repeats in (e.g. "America/Los_Angeles"), or null for UTC. Validated together with recurrence_rule and start_time, so a UTC-stored series can move to local time in one call (e.g. timezone + BYDAY=TU).'),
});

export const CancelEventSchema = z.object({
  event_id: resourceId().describe('Event ID to cancel'),
  calendar_id: optionalResourceId().describe('Calendar ID that owns the event. Optional — if omitted the calendar is resolved from the event.'),
  occurrence_start: z.string().datetime({ offset: true }).optional().describe('For recurring events only: ISO 8601 start of the single occurrence to cancel. The rest of the series is unaffected.'),
});

export const ConfirmEventSchema = z.object({
  event_id: resourceId().describe('Event ID of the hold to confirm'),
});

export const ReleaseEventSchema = z.object({
  event_id: resourceId().describe('Event ID of the hold to release'),
});

// ── Agents ─────────────────────────────────────────────────────

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(255).describe('Display name for the agent'),
  type: z.enum(['ai', 'human', 'resource']).describe('Agent type'),
  description: z.string().max(5_000).optional().describe('Optional description'),
});

export const ListAgentsSchema = z.object({
  type: z.enum(['ai', 'human', 'resource']).optional().describe('Filter by agent type'),
  status: z.enum(['active', 'paused', 'decommissioned']).optional().describe('Filter by status'),
  include_decommissioned: z.boolean().optional().describe('Include decommissioned (deleted) agents. Default false; ignored when status is set'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000. Cannot be combined with cursor'),
  cursor: z.string().min(1).max(1024).optional().describe('The next_cursor from the previous page'),
}).refine((v) => v.cursor === undefined || !v.offset, { message: 'cursor and offset cannot be combined', path: ['cursor'] });

export const GetAgentSchema = z.object({
  agent_id: resourceId().describe('Agent ID to fetch'),
});

export const UpdateAgentSchema = z.object({
  agent_id: resourceId().describe('Agent ID to update'),
  name: z.string().min(1).max(255).optional().describe('New display name'),
  description: z.string().max(5_000).nullable().optional().describe('New description (null to clear)'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Arbitrary metadata (max 16KB)'),
  status: z.enum(['active', 'paused']).optional().describe('Operational status'),
});

export const DeleteAgentSchema = z.object({
  agent_id: resourceId().describe('Agent ID to decommission'),
});

// ── Availability ───────────────────────────────────────────────

export const GetAvailabilitySchema = z.object({
  agent_id: resourceId().describe('Agent ID to check availability for'),
  start: z.string().datetime({ offset: true }).optional().describe('Range start (ISO 8601). Alias: start_time.'),
  end: z.string().datetime({ offset: true }).optional().describe('Range end (ISO 8601). Alias: end_time.'),
  start_time: z.string().datetime({ offset: true }).optional().describe('Alias for `start` (matches REST events naming).'),
  end_time: z.string().datetime({ offset: true }).optional().describe('Alias for `end` (matches REST events naming).'),
  duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Requested slot length (15m/30m/45m/1h/2h). Preferred over the deprecated slot_duration. Defaults to 30m.'),
  slot_duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Deprecated alias for `duration` — minimum slot length. Prefer `duration`.'),
  include_busy: z.boolean().default(false).describe('Include busy blocks in response'),
});

export const FindMeetingTimeSchema = z.object({
  agents: z.array(z.string()).min(1).optional().describe('Array of agent IDs to find common free time for. All agents must be free during the returned slots. Alias: agent_ids.'),
  agent_ids: z.array(z.string()).min(1).optional().describe('Alias for `agents` (matches REST/scheduling-proposal naming).'),
  start: z.string().datetime({ offset: true }).optional().describe('Search range start (ISO 8601). Alias: start_time.'),
  end: z.string().datetime({ offset: true }).optional().describe('Search range end (ISO 8601). Alias: end_time.'),
  start_time: z.string().datetime({ offset: true }).optional().describe('Alias for `start` (matches REST events naming).'),
  end_time: z.string().datetime({ offset: true }).optional().describe('Alias for `end` (matches REST events naming).'),
  duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Requested slot length (15m/30m/45m/1h/2h). Preferred over the deprecated slot_duration. Defaults to 30m.'),
  slot_duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Deprecated alias for `duration` — minimum slot length. Prefer `duration`.'),
  calendars: z.array(z.string()).optional().describe('Additional shared calendar IDs to treat as busy'),
  include_busy: z.boolean().default(false).describe('Include per-agent busy blocks in response'),
});

export const CreateConnectionLinkSchema = z.object({
  calendar_id: resourceId().startsWith('cal_').describe('Chronary calendar whose owning agent will receive authorized availability'),
  capabilities: z.array(z.enum(['availability', 'publishing'])).min(1).max(2).default(['availability']).describe('Request opaque availability, plus optional opt-in event publishing permission'),
  publication_policy: z.enum(['none', 'confirmed', 'confirmed_tentative']).default('none').describe('Desired publishing policy; a human still chooses the destination'),
});

export const GetConnectionLinkSchema = z.object({
  connection_link_id: resourceId().startsWith('csl_').describe('Connection setup link ID'),
});

export const CancelConnectionLinkSchema = GetConnectionLinkSchema;

// ── Calendar context ───────────────────────────────────────────

export const GetCalendarContextSchema = z.object({
  calendar_id: resourceId().describe('Calendar ID'),
});

// ── Scheduling proposals ───────────────────────────────────────

const proposalSlotSchema = z.object({
  start_time: z.string().datetime({ offset: true }).describe('Slot start time (ISO 8601)'),
  end_time: z.string().datetime({ offset: true }).describe('Slot end time (ISO 8601), after start_time'),
  weight: z.number().min(0).max(10).default(1.0).optional().describe('Preference for this slot, 0–10 (higher = more preferred). Used to rank candidate slots when the proposal is resolved. Defaults to 1.'),
  calendar_id: optionalResourceId().describe('Calendar to create the event on if this slot is chosen. Defaults to the proposal\'s top-level calendar_id.'),
}).refine(
  // Same rule as the API (#2538): a slot must end after it starts.
  (v) => new Date(v.end_time).getTime() > new Date(v.start_time).getTime(),
  'end_time must be after start_time',
);

export const CreateProposalSchema = z.object({
  title: z.string().min(1).max(500).describe('Short description of what the meeting is about'),
  description: z.string().max(5000).optional().describe('Longer context/agenda'),
  organizer_agent_id: resourceId().describe('Agent ID proposing the meeting'),
  participant_agent_ids: z.array(z.string()).min(1).max(50).describe('Agent IDs invited to respond'),
  calendar_id: resourceId().describe('Calendar the resolved event will be created on'),
  slots: z.array(proposalSlotSchema).min(1).max(20).describe('Candidate time slots (up to 20)'),
  expires_at: z.string().datetime({ offset: true }).optional().describe('Auto-cancel cutoff if unresolved'),
});

export const ListProposalsSchema = z.object({
  status: z.enum(['pending', 'resolving', 'confirmed', 'expired', 'cancelled']).optional().describe('Filter by proposal status'),
  organizer_agent_id: optionalResourceId().describe('Filter by organizer agent'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results (default 50)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset, at most 10000 (default 0)'),
});

export const GetProposalSchema = z.object({
  proposal_id: resourceId().describe('Proposal to fetch'),
});

export const RespondToProposalSchema = z.object({
  proposal_id: resourceId().describe('Proposal to respond to'),
  agent_id: resourceId().describe('Participant agent responding'),
  response: z.enum(['accept', 'decline', 'counter']).describe('Decision from this agent'),
  selected_slot_id: optionalResourceId().describe('Required when response is "accept"'),
  counter_slots: z.array(proposalSlotSchema).max(20).optional().describe('Alternative slots when response is "counter"'),
  message: z.string().max(2000).optional().describe('Optional note for the organizer'),
});

export const ResolveProposalSchema = z.object({
  proposal_id: resourceId().describe('Proposal to resolve'),
});

export const CancelProposalSchema = z.object({
  proposal_id: resourceId().describe('Proposal to cancel'),
});

// ── Availability rules ─────────────────────────────────────────

export const SetAvailabilityRulesSchema = z.object({
  calendar_id: resourceId().describe('Calendar to configure'),
  buffer_before_minutes: z.number().int().min(0).max(120).default(0).describe('Minutes of buffer before each event (0–120)'),
  buffer_after_minutes: z.number().int().min(0).max(120).default(0).describe('Minutes of buffer after each event (0–120)'),
  working_hours: workingHoursSchema.default(null).describe('Per-day working hours map in the calendar\'s timezone; omit keys for off-days. Pass null to remove any working-hours constraint.'),
  timezone: z.string().min(1).max(64).default('UTC').describe('IANA timezone used to interpret working_hours (e.g. America/New_York)'),
});

export const GetAvailabilityRulesSchema = z.object({
  calendar_id: resourceId().describe('Calendar to read'),
});

export const ClearAvailabilityRulesSchema = z.object({
  calendar_id: resourceId().describe('Calendar whose rules should be cleared'),
});

// ── Scoped keys ────────────────────────────────────────────────

export const CreateScopedKeySchema = z.object({
  agent_id: resourceId().regex(/^agt_/).describe('Agent ID this key is scoped to'),
  label: z.string().min(1).max(100).optional().describe('Human-readable label for the key'),
  expires_in: z
    .enum(['30d', '60d', '90d', '180d', '365d'])
    .optional()
    .describe('When the key stops working, from now. Omit for a key that never expires. After it expires, requests fail with 401 key_expired.'),
});

export const ListScopedKeysSchema = z.object({});

export const RevokeScopedKeySchema = z.object({
  key_id: resourceId().describe('ID of the scoped key to revoke'),
});

// ── Audit log ──────────────────────────────────────────────────

export const GetAuditLogSchema = z.object({
  from: z.string().datetime({ offset: true }).optional().describe('Start of the window (ISO 8601). Silently clamped to the plan retention window if older.'),
  to: z.string().datetime({ offset: true }).optional().describe('End of the window (ISO 8601)'),
  action: z.string().min(1).max(64).optional().describe('Filter by action name (e.g. event.create, agent_key.revoke). Legacy names are matched by their current names.'),
  actor_key_prefix: z.string().min(1).max(32).optional().describe('Filter by the API key prefix that performed the action'),
  actor_type: z.enum(['session', 'org_key', 'agent_key', 'oauth_app', 'system']).optional().describe('Filter by who acted: session (console), org_key, agent_key, oauth_app (an app connected by signing in) or system'),
  actor_id: z.string().min(1).max(64).optional().describe('Filter by actor id (an API key id, the org id for console sessions, or the connection id for oauth_app)'),
  request_id: z.string().min(1).max(64).optional().describe('Filter by request id (the X-Request-Id of the original call)'),
  resource: z.string().max(64).regex(/^[a-z]{2,5}_[A-Za-z0-9_-]*$/).optional().describe('Filter by an entity id or id prefix the request touched (e.g. cal_abc123 or cal_)'),
  status_class: z.enum(['2xx', '3xx', '4xx', '5xx']).optional().describe('Filter by response status class: 2xx, 3xx, 4xx or 5xx'),
  category: z.enum(['account', 'keys', 'agents', 'calendars', 'events', 'scheduling', 'webhooks', 'human_calendars', 'billing', 'security']).optional().describe('Filter by action category (e.g. keys, calendars, billing, security)'),
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
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000'),
});

export const GetWebhookSchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription to fetch'),
});

export const CreateWebhookSchema = z.object({
  url: z.string().url().max(2_048).describe('HTTPS endpoint that will receive event deliveries'),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).describe('Event types to subscribe to'),
});

export const UpdateWebhookSchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription to update'),
  url: z.string().url().max(2_048).optional().describe('New HTTPS delivery endpoint'),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).optional().describe('Replacement set of event types to subscribe to'),
  active: z.boolean().optional().describe('Set false to pause deliveries, true to resume'),
});

export const DeleteWebhookSchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription to delete'),
});

export const ListWebhookDeliveriesSchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription whose deliveries to list'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000. Cannot be combined with cursor'),
  status: z.enum(WEBHOOK_DELIVERY_STATUSES).optional().describe('Filter to a single delivery status'),
  include_payload: z.boolean().optional().describe('Include the full event payload sent on each delivery'),
  event_type: z
    .string()
    .max(100)
    .regex(/^[a-z_]+\.(?:[a-z_]+)?$/)
    .optional()
    .describe('An exact event type (event.created), or a prefix ending in a dot (event.) for a whole group'),
  created_after: z.string().datetime({ offset: true }).optional().describe('Only deliveries created at or after this time (ISO 8601)'),
  created_before: z.string().datetime({ offset: true }).optional().describe('Only deliveries created before this time (ISO 8601)'),
  delivery_id: optionalResourceId(z.string().max(100).regex(/^whd_[A-Za-z0-9_-]+$/)).describe('Only the delivery with this id'),
  is_test: z.boolean().optional().describe('true for test events only, false to leave them out'),
  cursor: z.string().min(1).max(1024).optional().describe('The next_cursor from the previous page'),
});

export const GetWebhookDeliverySchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription the delivery belongs to'),
  delivery_id: resourceId().describe('Delivery ID (whd_...)'),
});

export const SendTestWebhookSchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription to send the test event to'),
  event_type: z.enum(WEBHOOK_EVENT_TYPES).describe('Event type whose sample payload to send'),
});

export const ReplayWebhookDeliverySchema = z.object({
  webhook_id: resourceId().describe('Webhook subscription the delivery belongs to'),
  delivery_id: resourceId().describe('Delivery to replay (whd_...)'),
});

// ── iCal Subscriptions ─────────────────────────────────────────

export const ListICalSubscriptionsSchema = z.object({
  agent_id: resourceId().describe('Agent ID whose iCal subscriptions to list'),
  status: z.enum(['active', 'error', 'paused']).optional().describe('Filter by subscription status'),
  limit: z.number().int().min(1).max(200).default(50).describe('Max results to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset, at most 10000'),
});

export const GetICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to fetch'),
});

export const SubscribeICalSchema = z.object({
  agent_id: resourceId().describe('Agent ID that will own this subscription'),
  calendar_id: resourceId().describe('Calendar ID to sync external events into'),
  url: z.string().url().max(2_048).describe('HTTPS URL of the iCal feed (.ics) to subscribe to'),
  label: z.string().optional().describe('Optional label for this subscription'),
});

export const UpdateICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to update'),
  label: z.string().min(1).max(255).optional().describe('New label for this subscription'),
  url: z.string().url().max(2_048).refine((u) => u.startsWith('https://'), 'URL must use HTTPS').optional().describe('New HTTPS URL of the iCal feed (.ics)'),
});

export const DeleteICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to delete'),
});

export const SyncICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to sync'),
});

export const PauseICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to pause'),
});

export const ResumeICalSubscriptionSchema = z.object({
  subscription_id: resourceId().describe('iCal subscription ID to resume'),
});

// ── Usage ──────────────────────────────────────────────────────

export const GetUsageSchema = z.object({});

export const GetUsageHistorySchema = z.object({
  months: z.number().int().min(1).max(12).optional().describe('Number of UTC calendar months to return, 1-12 (default 6)'),
});

// ── Billing ────────────────────────────────────────────────────

export const GetBillingSchema = z.object({});

export const RequestUpgradeSchema = z.object({
  interval: z.enum(['month', 'year']).optional().describe('Billing interval to request. Defaults to month.'),
  reason: z.string().max(500).optional().describe('Why the upgrade is needed (max 500 chars). Shown to your human as plain text.'),
  feature: z.string().optional().describe('Plan-gated feature that was blocked, e.g. scoped_keys (from a plan_required error).'),
  metric: z.string().optional().describe('Quota metric that was exhausted, e.g. api_calls (from a quota_exceeded error).'),
});

export const GetUpgradeRequestSchema = z.object({
  id: resourceId().describe('Upgrade request ID (upr_...)'),
});

export const CancelUpgradeRequestSchema = GetUpgradeRequestSchema;
