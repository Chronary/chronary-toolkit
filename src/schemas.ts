import { z } from 'zod';

// ── Calendars ──────────────────────────────────────────────────

export const ListCalendarsSchema = z.object({
  agent_id: z.string().optional().describe('Filter calendars by agent ID'),
  include: z.enum(['all']).optional().describe('Set to "all" to include soft-deleted calendars'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results per page (default 50)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
});

export const GetCalendarSchema = z.object({
  calendar_id: z.string().describe('The calendar ID to retrieve'),
});

export const CreateCalendarSchema = z.object({
  name: z.string().describe('Calendar name'),
  timezone: z.string().describe('IANA timezone (e.g., "America/New_York")'),
  agent_id: z.string().optional().describe('Agent ID to associate the calendar with'),
  metadata: z.record(z.unknown()).optional().describe('Arbitrary key-value metadata'),
});

export const UpdateCalendarSchema = z.object({
  calendar_id: z.string().describe('The calendar ID to update'),
  name: z.string().optional().describe('New calendar name'),
  timezone: z.string().optional().describe('New IANA timezone'),
  metadata: z.record(z.unknown()).optional().describe('Updated metadata'),
});

export const DeleteCalendarSchema = z.object({
  calendar_id: z.string().describe('The calendar ID to delete'),
});

// ── Events ─────────────────────────────────────────────────────

export const ListEventsSchema = z.object({
  calendar_id: z.string().optional().describe('Calendar ID to list events from (provide this or agent_id)'),
  agent_id: z.string().optional().describe('Agent ID to list events for (provide this or calendar_id)'),
  start_after: z.string().optional().describe('Only events starting after this ISO 8601 datetime'),
  start_before: z.string().optional().describe('Only events starting before this ISO 8601 datetime'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('Filter by event status'),
  source: z.enum(['internal', 'external_ical']).optional().describe('Filter by event source'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results per page (default 50)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
});

export const GetEventSchema = z.object({
  calendar_id: z.string().describe('Calendar ID the event belongs to'),
  event_id: z.string().describe('The event ID to retrieve'),
});

export const CreateEventSchema = z.object({
  calendar_id: z.string().describe('Calendar ID to create the event on'),
  title: z.string().describe('Event title'),
  start_time: z.string().describe('Start time in ISO 8601 format'),
  end_time: z.string().describe('End time in ISO 8601 format'),
  description: z.string().optional().describe('Event description'),
  all_day: z.boolean().optional().describe('Whether this is an all-day event'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('Event status (default "confirmed")'),
  metadata: z.record(z.unknown()).optional().describe('Arbitrary key-value metadata'),
});

export const UpdateEventSchema = z.object({
  calendar_id: z.string().describe('Calendar ID the event belongs to'),
  event_id: z.string().describe('The event ID to update'),
  title: z.string().optional().describe('New event title'),
  description: z.string().nullable().optional().describe('New description (null to clear)'),
  start_time: z.string().optional().describe('New start time in ISO 8601 format'),
  end_time: z.string().optional().describe('New end time in ISO 8601 format'),
  all_day: z.boolean().optional().describe('Whether this is an all-day event'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('New event status'),
  metadata: z.record(z.unknown()).optional().describe('Updated metadata'),
});

export const DeleteEventSchema = z.object({
  calendar_id: z.string().describe('Calendar ID the event belongs to'),
  event_id: z.string().describe('The event ID to delete'),
});

// ── Availability ───────────────────────────────────────────────

export const CheckAvailabilitySchema = z.object({
  agents: z.array(z.string()).min(1).describe('Agent IDs to check availability for'),
  start: z.string().describe('Start of time range in ISO 8601 format'),
  end: z.string().describe('End of time range in ISO 8601 format'),
  slot_duration: z.enum(['15m', '30m', '45m', '1h', '2h']).optional().describe('Duration of availability slots (default "30m")'),
  calendars: z.array(z.string()).optional().describe('Specific calendar IDs to check (default: all agent calendars)'),
  include_busy: z.boolean().optional().describe('Include busy blocks in response'),
});

// ── Webhooks ───────────────────────────────────────────────────

export const ListWebhooksSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().describe('Max results per page (default 20)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
});

export const GetWebhookSchema = z.object({
  webhook_id: z.string().describe('The webhook ID to retrieve'),
});

export const CreateWebhookSchema = z.object({
  url: z.string().describe('HTTPS URL to receive webhook payloads'),
  events: z.array(z.string()).describe('Event types to subscribe to (e.g., ["event.created", "event.updated"])'),
});

export const UpdateWebhookSchema = z.object({
  webhook_id: z.string().describe('The webhook ID to update'),
  url: z.string().optional().describe('New webhook URL'),
  events: z.array(z.string()).optional().describe('New event type subscriptions'),
  active: z.boolean().optional().describe('Enable or disable the webhook'),
});

export const DeleteWebhookSchema = z.object({
  webhook_id: z.string().describe('The webhook ID to delete'),
});

// ── iCal Subscriptions ─────────────────────────────────────────

export const ListICalSubscriptionsSchema = z.object({
  agent_id: z.string().describe('Agent ID to list subscriptions for'),
  status: z.enum(['active', 'error', 'paused']).optional().describe('Filter by subscription status'),
  limit: z.number().int().min(1).max(200).optional().describe('Max results per page (default 50)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
});

export const GetICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('The iCal subscription ID to retrieve'),
});

export const CreateICalSubscriptionSchema = z.object({
  agent_id: z.string().describe('Agent ID to create the subscription for'),
  calendar_id: z.string().describe('Calendar ID to import events into'),
  url: z.string().describe('HTTPS URL of the iCal feed to subscribe to'),
  label: z.string().optional().describe('Human-readable label for the subscription'),
});

export const UpdateICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('The iCal subscription ID to update'),
  label: z.string().optional().describe('New label'),
  url: z.string().optional().describe('New iCal feed URL'),
});

export const DeleteICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('The iCal subscription ID to delete'),
});

export const SyncICalSubscriptionSchema = z.object({
  subscription_id: z.string().describe('The iCal subscription ID to sync immediately'),
});

// ── Usage ──────────────────────────────────────────────────────

export const GetUsageSchema = z.object({});
