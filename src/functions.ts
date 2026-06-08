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
  name: string; timezone: string; agent_id?: string; default_reminders?: number[] | null; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  return client.calendars.create({
    name: params.name,
    timezone: params.timezone,
    agentId: params.agent_id,
    default_reminders: params.default_reminders,
    metadata: params.metadata,
  });
});

export const updateCalendar = safeFunc(async (ctx: Ctx<{
  calendar_id: string; name?: string; timezone?: string;
  agent_status?: 'idle' | 'working' | 'waiting' | 'error';
  default_reminders?: number[] | null; metadata?: Record<string, unknown>;
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
  status?: 'confirmed' | 'tentative' | 'cancelled' | 'hold'; source?: 'internal' | 'external_ical';
  limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  if (!params.calendar_id && !params.agent_id) {
    throw new Error('Provide calendar_id or agent_id');
  }
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

export const getEvent = safeFunc(async (ctx: Ctx<{ calendar_id?: string; event_id: string }>) => {
  const { calendar_id, event_id } = ctx.params;
  return calendar_id
    ? ctx.client.events.get(calendar_id, event_id)
    : ctx.client.events.getById(event_id);
});

export const createEvent = safeFunc(async (ctx: Ctx<{
  calendar_id: string; title: string; start_time: string; end_time: string;
  description?: string; all_day?: boolean;
  status?: 'confirmed' | 'tentative' | 'hold'; reminders?: number[] | null; metadata?: Record<string, unknown>;
  hold_expires_at?: string; hold_priority?: number;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, ...eventParams } = params;
  return client.events.create(calendar_id, eventParams);
});

export const updateEvent = safeFunc(async (ctx: Ctx<{
  calendar_id?: string; event_id: string; title?: string; description?: string | null;
  start_time?: string; end_time?: string; all_day?: boolean;
  status?: 'confirmed' | 'tentative' | 'cancelled'; reminders?: number[] | null; metadata?: Record<string, unknown>;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, event_id, ...updates } = params;
  return calendar_id
    ? client.events.update(calendar_id, event_id, updates)
    : client.events.updateById(event_id, updates);
});

export const cancelEvent = safeFunc(async (ctx: Ctx<{ calendar_id?: string; event_id: string }>) => {
  const { calendar_id, event_id } = ctx.params;
  if (calendar_id) {
    await ctx.client.events.delete(calendar_id, event_id);
  } else {
    await ctx.client.events.deleteById(event_id);
  }
  return undefined;
});

export const confirmEvent = safeFunc(async (ctx: Ctx<{ event_id: string }>) => {
  return ctx.client.events.confirm(ctx.params.event_id);
});

export const releaseEvent = safeFunc(async (ctx: Ctx<{ event_id: string }>) => {
  return ctx.client.events.release(ctx.params.event_id);
});

// ── Agents ─────────────────────────────────────────────────────

export const createAgent = safeFunc(async (ctx: Ctx<{
  name: string; type: 'ai' | 'human' | 'resource'; description?: string; metadata?: Record<string, unknown>;
}>) => {
  return ctx.client.agents.create(ctx.params);
});

export const listAgents = safeFunc(async (ctx: Ctx<{
  type?: 'ai' | 'human' | 'resource'; status?: 'active' | 'paused' | 'decommissioned'; limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  const iter = client.agents.list({ type: params.type, status: params.status, limit: params.limit });
  return fetchPage(iter, params.offset, params.limit);
});

export const getAgent = safeFunc(async (ctx: Ctx<{ agent_id: string }>) => {
  return ctx.client.agents.get(ctx.params.agent_id);
});

export const updateAgent = safeFunc(async (ctx: Ctx<{
  agent_id: string; name?: string; description?: string | null; metadata?: Record<string, unknown>; status?: 'active' | 'paused';
}>) => {
  const { client, params } = ctx;
  const { agent_id, ...updates } = params;
  return client.agents.update(agent_id, updates);
});

export const deleteAgent = safeFunc(async (ctx: Ctx<{ agent_id: string }>) => {
  await ctx.client.agents.delete(ctx.params.agent_id);
  return undefined;
});

// ── Availability ───────────────────────────────────────────────

export const getAvailability = safeFunc(async (ctx: Ctx<{
  agent_id: string; start?: string; end?: string; start_time?: string; end_time?: string;
  slot_duration?: '15m' | '30m' | '45m' | '1h' | '2h'; include_busy?: boolean;
}>) => {
  const { client, params } = ctx;
  // Resolve the `start`/`end` canonical names from their REST aliases, mirroring
  // the hosted MCP tool's validation.
  const start = params.start ?? params.start_time;
  const end = params.end ?? params.end_time;
  if (!start || !end) {
    throw new Error('start (or start_time) and end (or end_time) are required');
  }
  return client.availability.forAgent(params.agent_id, {
    start,
    end,
    slot_duration: params.slot_duration,
    include_busy: params.include_busy,
  });
});

export const findMeetingTime = safeFunc(async (ctx: Ctx<{
  agents?: string[]; agent_ids?: string[];
  start?: string; end?: string; start_time?: string; end_time?: string;
  slot_duration?: '15m' | '30m' | '45m' | '1h' | '2h';
  calendars?: string[]; include_busy?: boolean;
}>) => {
  const { client, params } = ctx;
  // Resolve the canonical `agents`/`start`/`end` from their REST/scheduling
  // aliases, mirroring the hosted MCP tool's validation.
  const agents = params.agents ?? params.agent_ids;
  const start = params.start ?? params.start_time;
  const end = params.end ?? params.end_time;
  if (!agents || !start || !end) {
    throw new Error('agents (or agent_ids), start (or start_time), and end (or end_time) are required');
  }
  return client.availability.check({
    agents,
    start,
    end,
    slot_duration: params.slot_duration,
    calendars: params.calendars,
    include_busy: params.include_busy,
  });
});

// ── Calendar context ───────────────────────────────────────────

export const getCalendarContext = safeFunc(async (ctx: Ctx<{ calendar_id: string }>) => {
  return ctx.client.calendars.getContext(ctx.params.calendar_id);
});

// ── Scheduling proposals ───────────────────────────────────────

interface ProposalSlotInput {
  start_time: string;
  end_time: string;
  weight?: number;
  calendar_id?: string;
}

export const createProposal = safeFunc(async (ctx: Ctx<{
  title: string; description?: string; organizer_agent_id: string;
  participant_agent_ids: string[]; calendar_id: string;
  slots: ProposalSlotInput[]; expires_at?: string;
}>) => {
  return ctx.client.scheduling.create(ctx.params);
});

export const listProposals = safeFunc(async (ctx: Ctx<{
  status?: 'pending' | 'confirmed' | 'expired' | 'cancelled'; organizer_agent_id?: string; limit?: number; offset?: number;
}>) => {
  const { client, params } = ctx;
  const iter = client.scheduling.list({
    status: params.status,
    organizer_agent_id: params.organizer_agent_id,
    limit: params.limit,
  });
  return fetchPage(iter, params.offset, params.limit);
});

export const getProposal = safeFunc(async (ctx: Ctx<{ proposal_id: string }>) => {
  return ctx.client.scheduling.get(ctx.params.proposal_id);
});

export const respondToProposal = safeFunc(async (ctx: Ctx<{
  proposal_id: string; agent_id: string; response: 'accept' | 'decline' | 'counter';
  selected_slot_id?: string; counter_slots?: ProposalSlotInput[]; message?: string;
}>) => {
  const { client, params } = ctx;
  const { proposal_id, ...body } = params;
  return client.scheduling.respond(proposal_id, body);
});

export const resolveProposal = safeFunc(async (ctx: Ctx<{ proposal_id: string }>) => {
  return ctx.client.scheduling.resolve(ctx.params.proposal_id);
});

export const cancelProposal = safeFunc(async (ctx: Ctx<{ proposal_id: string }>) => {
  return ctx.client.scheduling.cancel(ctx.params.proposal_id);
});

// ── Availability rules ─────────────────────────────────────────

interface WorkingHoursDayInput { start: string; end: string; }
type WorkingHoursInput = {
  mon?: WorkingHoursDayInput; tue?: WorkingHoursDayInput; wed?: WorkingHoursDayInput;
  thu?: WorkingHoursDayInput; fri?: WorkingHoursDayInput; sat?: WorkingHoursDayInput; sun?: WorkingHoursDayInput;
} | null;

export const setAvailabilityRules = safeFunc(async (ctx: Ctx<{
  calendar_id: string; buffer_before_minutes?: number; buffer_after_minutes?: number;
  working_hours?: WorkingHoursInput; timezone?: string;
}>) => {
  const { client, params } = ctx;
  const { calendar_id, ...rules } = params;
  return client.calendars.setAvailabilityRules(calendar_id, rules);
});

export const getAvailabilityRules = safeFunc(async (ctx: Ctx<{ calendar_id: string }>) => {
  return ctx.client.calendars.getAvailabilityRules(ctx.params.calendar_id);
});

export const clearAvailabilityRules = safeFunc(async (ctx: Ctx<{ calendar_id: string }>) => {
  await ctx.client.calendars.deleteAvailabilityRules(ctx.params.calendar_id);
  return undefined;
});

// ── Scoped keys ────────────────────────────────────────────────

export const createScopedKey = safeFunc(async (ctx: Ctx<{ agent_id: string; label?: string }>) => {
  return ctx.client.keys.create(ctx.params);
});

export const listScopedKeys = safeFunc(async (ctx: Ctx) => {
  return ctx.client.keys.list();
});

export const revokeScopedKey = safeFunc(async (ctx: Ctx<{ key_id: string }>) => {
  await ctx.client.keys.delete(ctx.params.key_id);
  return undefined;
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

export const listWebhookDeliveries = safeFunc(async (ctx: Ctx<{
  webhook_id: string; limit?: number; offset?: number;
  status?: 'pending' | 'delivered' | 'failed'; include_payload?: boolean;
}>) => {
  const { client, params } = ctx;
  const { webhook_id, ...query } = params;
  return client.webhooks.listDeliveries(webhook_id, query);
});

// ── Audit log ──────────────────────────────────────────────────

export const getAuditLog = safeFunc(async (ctx: Ctx<{
  from?: string; to?: string; action?: string; actor_key_prefix?: string; cursor?: string; limit?: number;
}>) => {
  return ctx.client.auditLog.list(ctx.params);
});

// ── Terms ──────────────────────────────────────────────────────

export const acceptTerms = safeFunc(async (ctx: Ctx<{ tos_version: string }>) => {
  return ctx.client.terms.accept(ctx.params);
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

export const subscribeICal = safeFunc(async (ctx: Ctx<{
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
