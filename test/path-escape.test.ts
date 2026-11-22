import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Chronary } from '@chronary/sdk';
import * as schemas from '../src/schemas';
import * as fns from '../src/functions';

// #2519: an ID param used to accept any string, and the SDK put it into the
// URL path raw. A prompt-injected cancel_event with event_id
// `../agents/agt_main` sent DELETE /v1/agents/agt_main, whatever `tools`
// allowlist the host had set. The schemas now refuse anything outside the ID
// charset, and the SDK encodes the segment as a second line of defence.

// Audit-log filters are query parameters with their own limits, never path
// segments, and `actor_id` / `request_id` are not Chronary resource IDs.
const NOT_RESOURCE_IDS = new Set(['GetAuditLogSchema.actor_id', 'GetAuditLogSchema.request_id']);

function unwrap(t: z.ZodTypeAny): z.ZodTypeAny {
  let cur = t;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) cur = cur.unwrap() as z.ZodTypeAny;
    else if (cur instanceof z.ZodPipe) cur = cur.out as z.ZodTypeAny;
    else return cur;
  }
}

// [name, field schema, optional]
const idFields: Array<[string, z.ZodTypeAny, boolean]> = [];
for (const [name, value] of Object.entries(schemas)) {
  if (!(value instanceof z.ZodObject)) continue;
  for (const [field, fieldSchema] of Object.entries(value.shape as Record<string, z.ZodTypeAny>)) {
    if (field !== 'id' && !field.endsWith('_id')) continue;
    if (NOT_RESOURCE_IDS.has(`${name}.${field}`)) continue;
    if (!(unwrap(fieldSchema) instanceof z.ZodString)) continue;
    idFields.push([`${name}.${field}`, fieldSchema, fieldSchema.safeParse(undefined).success]);
  }
}

describe('toolkit ID params refuse path escapes (#2519)', () => {
  it('finds the ID fields (guards the sweep against matching nothing)', () => {
    expect(idFields.length).toBeGreaterThan(40);
    expect(idFields.map(([n]) => n)).toEqual(expect.arrayContaining([
      'CancelEventSchema.event_id',
      'CancelEventSchema.calendar_id',
      'GetEventSchema.event_id',
      'DeleteWebhookSchema.webhook_id',
      'RevokeScopedKeySchema.key_id',
      'GetUpgradeRequestSchema.id',
      'GetBookingPageSchema.booking_page_id',
      'ListEventsSchema.agent_id',
    ]));
    expect(idFields.filter(([, , optional]) => optional).length).toBeGreaterThanOrEqual(10);
  });

  it.each(idFields)('%s refuses dot segments and separators', (_name, schema) => {
    for (const bad of ['../agents/agt_1', '..', '.', 'evt_1#', 'evt_1?expand=all', 'a/b', '%2e%2e', 'evt 1']) {
      expect(schema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it.each(idFields)('%s: "" is refused when required and means "not given" when optional', (_name, schema, optional) => {
    const parsed = schema.safeParse('');
    if (optional) {
      expect(parsed.success).toBe(true);
      expect(parsed.data).toBeUndefined();
    } else {
      expect(parsed.success).toBe(false);
    }
  });

  it('an empty optional calendar_id is dropped, as before the ID check (cancel_event resolves the calendar)', async () => {
    const parsed = schemas.CancelEventSchema.safeParse({ event_id: 'evt_1', calendar_id: '' });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ event_id: 'evt_1' });
    const listed = schemas.ListEventsSchema.safeParse({ calendar_id: '', agent_id: 'agt_1' });
    expect(listed.data?.calendar_id).toBeUndefined();
    expect(listed.data?.agent_id).toBe('agt_1');
    expect(schemas.ListCalendarsSchema.safeParse({ agent_id: '' }).data?.agent_id).toBeUndefined();
    expect(schemas.ListWebhookDeliveriesSchema.safeParse({ webhook_id: 'whk_1', delivery_id: '' }).success).toBe(true);
    expect(schemas.ListWebhookDeliveriesSchema.safeParse({ webhook_id: 'whk_1', delivery_id: 'evt_1' }).success).toBe(false);

    const fetch = vi.fn(async (_u: unknown, _i?: RequestInit) => new Response(null, { status: 204 }));
    const client = new Chronary({
      apiKey: 'chr_sk_xxx1234567890',
      baseUrl: 'https://api.test.chronary.ai',
      fetch: fetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });
    await fns.cancelEvent({ client, params: parsed.data! });
    expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe('/v1/events/evt_1');
  });

  it('the JSON Schema a host sees allows "" for optional IDs but not a dot segment', () => {
    const json = z.toJSONSchema(schemas.CancelEventSchema) as { properties: Record<string, { pattern?: string; minLength?: number }>; required: string[] };
    expect(json.required).toEqual(['event_id']);
    const pattern = new RegExp(json.properties.calendar_id.pattern!);
    expect(pattern.test('')).toBe(true);
    expect(pattern.test('..')).toBe(false);
    expect(json.properties.event_id.minLength).toBe(1);
  });

  it('accepts real IDs: nanoid with _ and -, and a UUID key id', () => {
    expect(schemas.CancelEventSchema.safeParse({ event_id: 'evt_aB3-_x9Qz1Lm' }).success).toBe(true);
    expect(schemas.RevokeScopedKeySchema.safeParse({ key_id: '11111111-2222-3333-4444-555555555555' }).success).toBe(true);
    expect(schemas.GetUpgradeRequestSchema.safeParse({ id: 'upr_-a_b' }).success).toBe(true);
    expect(schemas.GetCalendarSchema.safeParse({ calendar_id: 'cal_x'.padEnd(129, 'x') }).success).toBe(false);
  });

  it('cancel_event with event_id "../agents/agt_main" never reaches /v1/agents (schema bypassed)', async () => {
    const fetch = vi.fn(async (_u: unknown, _i?: RequestInit) => new Response(null, { status: 204 }));
    const client = new Chronary({
      apiKey: 'chr_sk_xxx1234567890',
      baseUrl: 'https://api.test.chronary.ai',
      fetch: fetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });
    expect(schemas.CancelEventSchema.safeParse({ event_id: '../agents/agt_main' }).success).toBe(false);

    // Called directly, the SDK keeps the value as one encoded segment.
    await fns.cancelEvent({ client, params: { event_id: '../agents/agt_main' } });
    expect(fetch).toHaveBeenCalledTimes(1);
    const sent = new Request(String(fetch.mock.calls[0][0])).url;
    expect(new URL(sent).pathname).toBe('/v1/events/..%2Fagents%2Fagt_main');

    // A bare ".." is refused before any request.
    fetch.mockClear();
    const result = await fns.cancelEvent({ client, params: { event_id: '..' } });
    expect(result.isError).toBe(true);
    expect(result.result).toMatchObject({ error: 'validation_error' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
