import type { Chronary } from '@chronary/sdk';
import { safeFunc } from './safe';
import type { ToolResult } from './types';

interface Ctx<P = Record<string, unknown>> {
  client: Chronary;
  params: P;
}

// Helper to consume a PageIterator's first page
async function fetchPage(
  iterator: AsyncIterable<unknown> & { getPage(offset?: number, limit?: number): Promise<{ data: unknown[]; total: number; hasMore: boolean }> },
  offset?: number,
  limit?: number,
) {
  const page = await iterator.getPage(offset ?? 0, limit);
  return { data: page.data, total: page.total, has_more: page.hasMore };
}

// ── Calendars ──────────────────────────────────────────────────

export const listCalendars = safeFunc(async (ctx: Ctx<{
  agent_id?: string; include?: 'all'; limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  const iter = client.calendars.list({ agentId: params.agent_id, include: params.include, limit: params.limit });
  return fetchPage(iter, params.offset, params.limit);
});

export const getCalendar = safeFunc(async (ctx: Ctx<{ calendar_id: string }>) => {
  return ctx.client.calendars.get(ctx.params.calendar_id);
});

export const createCalendar = safeFunc(async (ctx: Ctx<{
  name: string; timezone: string; agent_id?: string; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  return client.calendars.create({
    name: params.name,
    timezone: params.timezone,
    agentId: params.agent_id,
    metadata: params.metadata,
  });
});

export const updateCalendar = safeFunc(async (ctx: Ctx<{
  calendar_id: string; name?: string; timezone?: string; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, ...updates } = params;
  return client.calendars.update(calendar_id, updates);
});

export const deleteCalendar = safeFunc(async (ctx: Ctx<{ calendar_id: string }>) => {
  await ctx.client.calendars.delete(ctx.params.calendar_id);
  return undefined; // safeFunc normalizes to { success: true }
});

// ── Events ─────────────────────────────────────────────────────

export const listEvents = safeFunc(async (ctx: Ctx<{
  calendar_id?: string; agent_id?: string; start_after?: string; start_before?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled'; source?: 'internal' | 'external_ical';
  limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  const iter = client.events.list({
    calendarId: params.calendar_id,
    agentId: params.agent_id,
    start_after: params.start_after,
    start_before: params.start_before,
    status: params.status,
    source: params.source,
    limit: params.limit,
  });
  return fetchPage(iter, params.offset, params.limit);
});

export const getEvent = safeFunc(async (ctx: Ctx<{ calendar_id: string; event_id: string }>) => {
  return ctx.client.events.get(ctx.params.calendar_id, ctx.params.event_id);
});

export const createEvent = safeFunc(async (ctx: Ctx<{
  calendar_id: string; title: string; start_time: string; end_time: string;
  description?: string; all_day?: boolean;
  status?: 'confirmed' | 'tentative' | 'cancelled'; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, ...eventParams } = params;
  return client.events.create(calendar_id, eventParams);
});

export const updateEvent = safeFunc(async (ctx: Ctx<{
  calendar_id: string; event_id: string; title?: string; description?: string | null;
  start_time?: string; end_time?: string; all_day?: boolean;
  status?: 'confirmed' | 'tentative' | 'cancelled'; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, event_id, ...updates } = params;
  return client.events.update(calendar_id, event_id, updates);
});

export const deleteEvent = safeFunc(async (ctx: Ctx<{ calendar_id: string; event_id: string }>) => {
  await ctx.client.events.delete(ctx.params.calendar_id, ctx.params.event_id);
  return undefined;
});

// ── Availability ───────────────────────────────────────────────

export const checkAvailability = safeFunc(async (ctx: Ctx<{
  agents: string[]; start: string; end: string;
  slot_duration?: '15m' | '30m' | '45m' | '1h' | '2h';
  calendars?: string[]; include_busy?: boolean;
}>) => {
  return ctx.client.availability.check(ctx.params);
});

// ── Webhooks ───────────────────────────────────────────────────

export const listWebhooks = safeFunc(async (ctx: Ctx<{ limit?: number; offset?: number }>) => {
  const { client, params } = ctx;
  const iter = client.webhooks.list({ limit: params.limit });
  return fetchPage(iter, params.offset, params.limit);
});

export const getWebhook = safeFunc(async (ctx: Ctx<{ webhook_id: string }>) => {
  return ctx.client.webhooks.get(ctx.params.webhook_id);
});

export const createWebhook = safeFunc(async (ctx: Ctx<{ url: string; events: string[] }>) => {
  return ctx.client.webhooks.create(ctx.params);
});

export const updateWebhook = safeFunc(async (ctx: Ctx<{
  webhook_id: string; url?: string; events?: string[]; active?: boolean;
}>) => {
  const { client, params } = ctx;
  const { webhook_id, ...updates } = params;
  return client.webhooks.update(webhook_id, updates);
});

export const deleteWebhook = safeFunc(async (ctx: Ctx<{ webhook_id: string }>) => {
  await ctx.client.webhooks.delete(ctx.params.webhook_id);
  return undefined;
});

// ── iCal Subscriptions ─────────────────────────────────────────

export const listICalSubscriptions = safeFunc(async (ctx: Ctx<{
  agent_id: string; status?: 'active' | 'error' | 'paused'; limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  const iter = client.icalSubscriptions.list({
    agentId: params.agent_id,
    status: params.status,
    limit: params.limit,
  });
  return fetchPage(iter, params.offset, params.limit);
});

export const getICalSubscription = safeFunc(async (ctx: Ctx<{ subscription_id: string }>) => {
  return ctx.client.icalSubscriptions.get(ctx.params.subscription_id);
});

export const createICalSubscription = safeFunc(async (ctx: Ctx<{
  agent_id: string; calendar_id: string; url: string; label?: string;
}>) => {
  const { client, params } = ctx;
  const { agent_id, ...subParams } = params;
  return client.icalSubscriptions.create(agent_id, subParams);
});

export const updateICalSubscription = safeFunc(async (ctx: Ctx<{
  subscription_id: string; label?: string; url?: string;
}>) => {
  const { client, params } = ctx;
  const { subscription_id, ...updates } = params;
  return client.icalSubscriptions.update(subscription_id, updates);
});

export const deleteICalSubscription = safeFunc(async (ctx: Ctx<{ subscription_id: string }>) => {
  await ctx.client.icalSubscriptions.delete(ctx.params.subscription_id);
  return undefined;
});

export const syncICalSubscription = safeFunc(async (ctx: Ctx<{ subscription_id: string }>) => {
  return ctx.client.icalSubscriptions.sync(ctx.params.subscription_id);
});

// ── Usage ──────────────────────────────────────────────────────

export const getUsage = safeFunc(async (ctx: Ctx) => {
  return ctx.client.usage.get();
});

// ── Factory ────────────────────────────────────────────────────

/** Map of tool name → executor function. Used by definitions.ts to wire up execute(). */
export function createExecutor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (ctx: { client: Chronary; params: any }) => Promise<ToolResult>,
): (client: Chronary, params: Record<string, unknown>) => Promise<ToolResult> {
  return (client, params) => fn({ client, params });
}
