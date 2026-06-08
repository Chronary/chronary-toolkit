import { describe, it, expect, beforeEach } from 'vitest';
import type { Chronary } from '@chronary/sdk';
import { mockChronaryClient, FIXTURES } from './helpers';
import * as fns from '../src/functions';

describe('tool functions', () => {
  let client: ReturnType<typeof mockChronaryClient>;

  function asClient() { return client as unknown as Chronary; }

  beforeEach(() => { client = mockChronaryClient(); });

  // ── Calendars ──

  it('listCalendars calls client.calendars.list().getPage()', async () => {
    const result = await fns.listCalendars({ client: asClient(), params: { limit: 10 } });
    expect(result.isError).toBe(false);
    expect(client.calendars.list).toHaveBeenCalled();
  });

  it('getCalendar calls client.calendars.get(id)', async () => {
    const result = await fns.getCalendar({ client: asClient(), params: { calendar_id: 'cal_123' } });
    expect(result.isError).toBe(false);
    expect(client.calendars.get).toHaveBeenCalledWith('cal_123');
  });

  it('createCalendar maps agent_id to agentId', async () => {
    await fns.createCalendar({ client: asClient(), params: { name: 'Test', timezone: 'UTC', agent_id: 'agt_1' } });
    expect(client.calendars.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', timezone: 'UTC', agentId: 'agt_1' }),
    );
  });

  it('updateCalendar extracts calendar_id', async () => {
    await fns.updateCalendar({ client: asClient(), params: { calendar_id: 'cal_1', name: 'New' } });
    expect(client.calendars.update).toHaveBeenCalledWith('cal_1', expect.objectContaining({ name: 'New' }));
  });

  it('updateCalendar forwards agent_status', async () => {
    await fns.updateCalendar({ client: asClient(), params: { calendar_id: 'cal_1', agent_status: 'working' } });
    expect(client.calendars.update).toHaveBeenCalledWith('cal_1', expect.objectContaining({ agent_status: 'working' }));
  });

  it('deleteCalendar returns success', async () => {
    const result = await fns.deleteCalendar({ client: asClient(), params: { calendar_id: 'cal_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
    expect(client.calendars.delete).toHaveBeenCalledWith('cal_1');
  });

  // ── Events ──

  it('createEvent passes calendar_id as positional arg', async () => {
    await fns.createEvent({ client: asClient(), params: {
      calendar_id: 'cal_1', title: 'Meeting', start_time: '2026-04-15T09:00:00Z', end_time: '2026-04-15T10:00:00Z',
    } });
    expect(client.events.create).toHaveBeenCalledWith('cal_1', expect.objectContaining({ title: 'Meeting' }));
  });

  it('createEvent forwards hold fields (status/hold_expires_at/hold_priority)', async () => {
    await fns.createEvent({ client: asClient(), params: {
      calendar_id: 'cal_1', title: 'Hold', start_time: '2026-04-15T09:00:00Z', end_time: '2026-04-15T10:00:00Z',
      status: 'hold', hold_expires_at: '2026-04-15T08:50:00Z', hold_priority: 5,
    } });
    expect(client.events.create).toHaveBeenCalledWith('cal_1', expect.objectContaining({
      status: 'hold', hold_expires_at: '2026-04-15T08:50:00Z', hold_priority: 5,
    }));
  });

  it('listEvents passes only calendar-scoped filters to events.list', async () => {
    await fns.listEvents({ client: asClient(), params: {
      calendar_id: 'cal_1', start_after: '2026-04-15T00:00:00Z', limit: 10,
    } });
    expect(client.events.list).toHaveBeenCalledWith(expect.objectContaining({
      calendarId: 'cal_1', start_after: '2026-04-15T00:00:00Z',
    }));
  });

  it('getEvent passes calendar_id and event_id', async () => {
    await fns.getEvent({ client: asClient(), params: { calendar_id: 'cal_1', event_id: 'evt_1' } });
    expect(client.events.get).toHaveBeenCalledWith('cal_1', 'evt_1');
  });

  it('cancelEvent returns success', async () => {
    const result = await fns.cancelEvent({ client: asClient(), params: { calendar_id: 'cal_1', event_id: 'evt_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
    expect(client.events.delete).toHaveBeenCalledWith('cal_1', 'evt_1');
  });

  it('confirmEvent calls events.confirm(event_id)', async () => {
    const result = await fns.confirmEvent({ client: asClient(), params: { event_id: 'evt_1' } });
    expect(result.isError).toBe(false);
    expect(client.events.confirm).toHaveBeenCalledWith('evt_1');
  });

  it('releaseEvent calls events.release(event_id)', async () => {
    const result = await fns.releaseEvent({ client: asClient(), params: { event_id: 'evt_1' } });
    expect(result.isError).toBe(false);
    expect(client.events.release).toHaveBeenCalledWith('evt_1');
  });

  // ── Agents ──

  it('createAgent passes params through', async () => {
    await fns.createAgent({ client: asClient(), params: { name: 'Bot', type: 'ai' } });
    expect(client.agents.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bot', type: 'ai' }));
  });

  it('listAgents calls agents.list().getPage()', async () => {
    const result = await fns.listAgents({ client: asClient(), params: { limit: 10 } });
    expect(result.isError).toBe(false);
    expect(client.agents.list).toHaveBeenCalled();
  });

  it('getAgent calls agents.get(agent_id)', async () => {
    await fns.getAgent({ client: asClient(), params: { agent_id: 'agt_1' } });
    expect(client.agents.get).toHaveBeenCalledWith('agt_1');
  });

  it('updateAgent extracts agent_id', async () => {
    await fns.updateAgent({ client: asClient(), params: { agent_id: 'agt_1', name: 'New' } });
    expect(client.agents.update).toHaveBeenCalledWith('agt_1', expect.objectContaining({ name: 'New' }));
  });

  it('deleteAgent returns success', async () => {
    const result = await fns.deleteAgent({ client: asClient(), params: { agent_id: 'agt_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
    expect(client.agents.delete).toHaveBeenCalledWith('agt_1');
  });

  // ── Availability ──

  it('getAvailability calls availability.forAgent(agent_id, params)', async () => {
    await fns.getAvailability({ client: asClient(), params: {
      agent_id: 'agt_1', start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    } });
    expect(client.availability.forAgent).toHaveBeenCalledWith('agt_1', expect.objectContaining({ start: '2026-04-15T00:00:00Z' }));
  });

  it('getAvailability resolves start_time/end_time aliases to start/end', async () => {
    await fns.getAvailability({ client: asClient(), params: {
      agent_id: 'agt_1', start_time: '2026-04-15T00:00:00Z', end_time: '2026-04-16T00:00:00Z',
    } });
    expect(client.availability.forAgent).toHaveBeenCalledWith('agt_1', expect.objectContaining({
      start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    }));
  });

  it('getAvailability errors when neither start nor start_time is provided', async () => {
    const result = await fns.getAvailability({ client: asClient(), params: { agent_id: 'agt_1' } });
    expect(result.isError).toBe(true);
    expect(client.availability.forAgent).not.toHaveBeenCalled();
  });

  it('findMeetingTime passes params through', async () => {
    await fns.findMeetingTime({ client: asClient(), params: {
      agents: ['agt_1'], start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    } });
    expect(client.availability.check).toHaveBeenCalledWith(expect.objectContaining({ agents: ['agt_1'] }));
  });

  it('findMeetingTime resolves agent_ids/start_time/end_time aliases', async () => {
    await fns.findMeetingTime({ client: asClient(), params: {
      agent_ids: ['agt_1', 'agt_2'], start_time: '2026-04-15T00:00:00Z', end_time: '2026-04-16T00:00:00Z',
    } });
    expect(client.availability.check).toHaveBeenCalledWith(expect.objectContaining({
      agents: ['agt_1', 'agt_2'], start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    }));
  });

  it('findMeetingTime errors when agents/agent_ids is missing', async () => {
    const result = await fns.findMeetingTime({ client: asClient(), params: {
      start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    } });
    expect(result.isError).toBe(true);
    expect(client.availability.check).not.toHaveBeenCalled();
  });

  // ── Calendar context ──

  it('getCalendarContext calls calendars.getContext(calendar_id)', async () => {
    await fns.getCalendarContext({ client: asClient(), params: { calendar_id: 'cal_1' } });
    expect(client.calendars.getContext).toHaveBeenCalledWith('cal_1');
  });

  // ── Scheduling proposals ──

  it('createProposal passes params through', async () => {
    await fns.createProposal({ client: asClient(), params: {
      title: 'Sync', organizer_agent_id: 'agt_1', participant_agent_ids: ['agt_2'], calendar_id: 'cal_1',
      slots: [{ start_time: '2026-04-15T10:00:00Z', end_time: '2026-04-15T10:30:00Z' }],
    } });
    expect(client.scheduling.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sync' }));
  });

  it('listProposals calls scheduling.list().getPage()', async () => {
    const result = await fns.listProposals({ client: asClient(), params: { limit: 10 } });
    expect(result.isError).toBe(false);
    expect(client.scheduling.list).toHaveBeenCalled();
  });

  it('getProposal calls scheduling.get(proposal_id)', async () => {
    await fns.getProposal({ client: asClient(), params: { proposal_id: 'prop_1' } });
    expect(client.scheduling.get).toHaveBeenCalledWith('prop_1');
  });

  it('respondToProposal extracts proposal_id', async () => {
    await fns.respondToProposal({ client: asClient(), params: { proposal_id: 'prop_1', agent_id: 'agt_2', response: 'accept' } });
    expect(client.scheduling.respond).toHaveBeenCalledWith('prop_1', expect.objectContaining({ agent_id: 'agt_2', response: 'accept' }));
  });

  it('resolveProposal calls scheduling.resolve(proposal_id)', async () => {
    await fns.resolveProposal({ client: asClient(), params: { proposal_id: 'prop_1' } });
    expect(client.scheduling.resolve).toHaveBeenCalledWith('prop_1');
  });

  it('cancelProposal calls scheduling.cancel(proposal_id)', async () => {
    await fns.cancelProposal({ client: asClient(), params: { proposal_id: 'prop_1' } });
    expect(client.scheduling.cancel).toHaveBeenCalledWith('prop_1');
  });

  // ── Availability rules ──

  it('setAvailabilityRules extracts calendar_id', async () => {
    await fns.setAvailabilityRules({ client: asClient(), params: { calendar_id: 'cal_1', buffer_before_minutes: 10 } });
    expect(client.calendars.setAvailabilityRules).toHaveBeenCalledWith('cal_1', expect.objectContaining({ buffer_before_minutes: 10 }));
  });

  it('getAvailabilityRules calls calendars.getAvailabilityRules(calendar_id)', async () => {
    await fns.getAvailabilityRules({ client: asClient(), params: { calendar_id: 'cal_1' } });
    expect(client.calendars.getAvailabilityRules).toHaveBeenCalledWith('cal_1');
  });

  it('clearAvailabilityRules returns success', async () => {
    const result = await fns.clearAvailabilityRules({ client: asClient(), params: { calendar_id: 'cal_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
    expect(client.calendars.deleteAvailabilityRules).toHaveBeenCalledWith('cal_1');
  });

  // ── Scoped keys ──

  it('createScopedKey passes params through', async () => {
    await fns.createScopedKey({ client: asClient(), params: { agent_id: 'agt_1', label: 'k' } });
    expect(client.keys.create).toHaveBeenCalledWith({ agent_id: 'agt_1', label: 'k' });
  });

  it('listScopedKeys returns the array directly', async () => {
    const result = await fns.listScopedKeys({ client: asClient(), params: {} });
    expect(result.isError).toBe(false);
    expect(Array.isArray(result.result)).toBe(true);
    expect(client.keys.list).toHaveBeenCalled();
  });

  it('revokeScopedKey returns success', async () => {
    const result = await fns.revokeScopedKey({ client: asClient(), params: { key_id: 'key_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
    expect(client.keys.delete).toHaveBeenCalledWith('key_1');
  });

  // ── Audit log ──

  it('getAuditLog calls auditLog.list(params)', async () => {
    await fns.getAuditLog({ client: asClient(), params: { limit: 10 } });
    expect(client.auditLog.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  // ── Terms ──

  it('acceptTerms calls terms.accept({ tos_version })', async () => {
    await fns.acceptTerms({ client: asClient(), params: { tos_version: 'v1' } });
    expect(client.terms.accept).toHaveBeenCalledWith({ tos_version: 'v1' });
  });

  // ── Webhooks ──

  it('createWebhook passes params through', async () => {
    await fns.createWebhook({ client: asClient(), params: { url: 'https://example.com', events: ['event.created'] } });
    expect(client.webhooks.create).toHaveBeenCalledWith({ url: 'https://example.com', events: ['event.created'] });
  });

  it('deleteWebhook returns success', async () => {
    const result = await fns.deleteWebhook({ client: asClient(), params: { webhook_id: 'wh_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
  });

  it('listWebhookDeliveries extracts webhook_id', async () => {
    await fns.listWebhookDeliveries({ client: asClient(), params: { webhook_id: 'wh_1', limit: 10 } });
    expect(client.webhooks.listDeliveries).toHaveBeenCalledWith('wh_1', expect.objectContaining({ limit: 10 }));
  });

  // ── iCal Subscriptions ──

  it('subscribeICal passes agent_id as positional arg', async () => {
    await fns.subscribeICal({ client: asClient(), params: {
      agent_id: 'agt_1', calendar_id: 'cal_1', url: 'https://example.com/feed.ics',
    } });
    expect(client.icalSubscriptions.create).toHaveBeenCalledWith('agt_1', expect.objectContaining({ calendar_id: 'cal_1' }));
  });

  it('syncICalSubscription calls sync', async () => {
    const result = await fns.syncICalSubscription({ client: asClient(), params: { subscription_id: 'ics_1' } });
    expect(result.isError).toBe(false);
    expect(client.icalSubscriptions.sync).toHaveBeenCalledWith('ics_1');
  });

  // ── Usage ──

  it('getUsage calls client.usage.get()', async () => {
    const result = await fns.getUsage({ client: asClient(), params: {} });
    expect(result.isError).toBe(false);
    expect(client.usage.get).toHaveBeenCalled();
  });
});
