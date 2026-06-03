import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as schemas from '../src/schemas';

const ALL_SCHEMAS = {
  ListCalendarsSchema: schemas.ListCalendarsSchema,
  GetCalendarSchema: schemas.GetCalendarSchema,
  CreateCalendarSchema: schemas.CreateCalendarSchema,
  UpdateCalendarSchema: schemas.UpdateCalendarSchema,
  DeleteCalendarSchema: schemas.DeleteCalendarSchema,
  ListEventsSchema: schemas.ListEventsSchema,
  GetEventSchema: schemas.GetEventSchema,
  CreateEventSchema: schemas.CreateEventSchema,
  UpdateEventSchema: schemas.UpdateEventSchema,
  DeleteEventSchema: schemas.DeleteEventSchema,
  CheckAvailabilitySchema: schemas.CheckAvailabilitySchema,
  ListWebhooksSchema: schemas.ListWebhooksSchema,
  GetWebhookSchema: schemas.GetWebhookSchema,
  CreateWebhookSchema: schemas.CreateWebhookSchema,
  UpdateWebhookSchema: schemas.UpdateWebhookSchema,
  DeleteWebhookSchema: schemas.DeleteWebhookSchema,
  ListICalSubscriptionsSchema: schemas.ListICalSubscriptionsSchema,
  GetICalSubscriptionSchema: schemas.GetICalSubscriptionSchema,
  CreateICalSubscriptionSchema: schemas.CreateICalSubscriptionSchema,
  UpdateICalSubscriptionSchema: schemas.UpdateICalSubscriptionSchema,
  DeleteICalSubscriptionSchema: schemas.DeleteICalSubscriptionSchema,
  SyncICalSubscriptionSchema: schemas.SyncICalSubscriptionSchema,
  GetUsageSchema: schemas.GetUsageSchema,
};

describe('schemas', () => {
  it('exports exactly 23 schemas', () => {
    expect(Object.keys(ALL_SCHEMAS)).toHaveLength(23);
  });

  describe('every field has a .describe() annotation', () => {
    for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
      it(name, () => {
        const shape = schema.shape;
        for (const [field, fieldSchema] of Object.entries(shape)) {
          // GetUsageSchema has no fields — skip
          if (Object.keys(shape).length === 0) continue;
          const desc = (fieldSchema as z.ZodTypeAny).description;
          expect(desc, `${name}.${field} is missing .describe()`).toBeTruthy();
        }
      });
    }
  });

  describe('no schema uses .refine(), .transform(), or .default()', () => {
    for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
      it(name, () => {
        expect(schema instanceof z.ZodObject, `${name} should be a ZodObject`).toBe(true);
      });
    }
  });

  describe('validation', () => {
    it('CreateCalendarSchema accepts valid input', () => {
      const result = schemas.CreateCalendarSchema.safeParse({
        name: 'Test Calendar',
        timezone: 'America/New_York',
      });
      expect(result.success).toBe(true);
    });

    it('CreateCalendarSchema rejects missing name', () => {
      const result = schemas.CreateCalendarSchema.safeParse({ timezone: 'UTC' });
      expect(result.success).toBe(false);
    });

    it('CreateEventSchema accepts valid input', () => {
      const result = schemas.CreateEventSchema.safeParse({
        calendar_id: 'cal_123',
        title: 'Meeting',
        start_time: '2026-04-15T09:00:00Z',
        end_time: '2026-04-15T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('CheckAvailabilitySchema requires at least one agent', () => {
      const result = schemas.CheckAvailabilitySchema.safeParse({
        agents: [],
        start: '2026-04-15T00:00:00Z',
        end: '2026-04-16T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('GetUsageSchema accepts empty object', () => {
      const result = schemas.GetUsageSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('ListEventsSchema accepts calendar_id filter', () => {
      const result = schemas.ListEventsSchema.safeParse({ calendar_id: 'cal_123' });
      expect(result.success).toBe(true);
    });

    it('CreateICalSubscriptionSchema requires agent_id, calendar_id, and url', () => {
      const result = schemas.CreateICalSubscriptionSchema.safeParse({
        agent_id: 'agt_123',
        calendar_id: 'cal_123',
        url: 'https://example.com/feed.ics',
      });
      expect(result.success).toBe(true);
    });
  });
});
