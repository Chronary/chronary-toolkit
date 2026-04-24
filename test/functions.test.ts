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

  it('getEvent passes calendar_id and event_id', async () => {
    await fns.getEvent({ client: asClient(), params: { calendar_id: 'cal_1', event_id: 'evt_1' } });
    expect(client.events.get).toHaveBeenCalledWith('cal_1', 'evt_1');
  });

  it('deleteEvent returns success', async () => {
    const result = await fns.deleteEvent({ client: asClient(), params: { calendar_id: 'cal_1', event_id: 'evt_1' } });
    expect(result).toEqual({ result: { success: true }, isError: false });
  });

  // ── Availability ──

  it('checkAvailability passes params through', async () => {
    await fns.checkAvailability({ client: asClient(), params: {
      agents: ['agt_1'], start: '2026-04-15T00:00:00Z', end: '2026-04-16T00:00:00Z',
    } });
    expect(client.availability.check).toHaveBeenCalledWith(expect.objectContaining({ agents: ['agt_1'] }));
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

  // ── iCal Subscriptions ──

  it('createICalSubscription passes agent_id as positional arg', async () => {
    await fns.createICalSubscription({ client: asClient(), params: {
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
