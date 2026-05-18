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
  'get_availability',
  'find_meeting_time',
  'cancel_event',
  'confirm_event',
  'release_event',
  'subscribe_ical',
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
    name: 'delete_event',
    description: 'Delete an event from a calendar. This frees the agent\'s availability during that time.',
    schema: schemas.DeleteEventSchema,
    annotations: { title: 'Delete Event', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.deleteEvent),
  },

  // ── Availability ───────────────────────────────────────────────
  {
    name: 'check_availability',
    description: 'Check free/busy availability across one or more agents within a time range. Returns available time slots and optionally busy blocks.',
    schema: schemas.CheckAvailabilitySchema,
    annotations: { title: 'Check Availability', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    execute: createExecutor(fns.checkAvailability),
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
    name: 'create_ical_subscription',
    description: 'Import an external calendar by subscribing to an iCal feed URL. Events are synced every 30 minutes.',
    schema: schemas.CreateICalSubscriptionSchema,
    annotations: { title: 'Create iCal Subscription', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    execute: createExecutor(fns.createICalSubscription),
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
