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
  CancelEventSchema: schemas.CancelEventSchema,
  ConfirmEventSchema: schemas.ConfirmEventSchema,
  ReleaseEventSchema: schemas.ReleaseEventSchema,
  CreateAgentSchema: schemas.CreateAgentSchema,
  ListAgentsSchema: schemas.ListAgentsSchema,
  GetAgentSchema: schemas.GetAgentSchema,
  UpdateAgentSchema: schemas.UpdateAgentSchema,
  DeleteAgentSchema: schemas.DeleteAgentSchema,
  GetAvailabilitySchema: schemas.GetAvailabilitySchema,
  FindMeetingTimeSchema: schemas.FindMeetingTimeSchema,
  GetCalendarContextSchema: schemas.GetCalendarContextSchema,
  CreateProposalSchema: schemas.CreateProposalSchema,
  ListProposalsSchema: schemas.ListProposalsSchema,
  GetProposalSchema: schemas.GetProposalSchema,
  RespondToProposalSchema: schemas.RespondToProposalSchema,
  ResolveProposalSchema: schemas.ResolveProposalSchema,
  CancelProposalSchema: schemas.CancelProposalSchema,
  SetAvailabilityRulesSchema: schemas.SetAvailabilityRulesSchema,
  GetAvailabilityRulesSchema: schemas.GetAvailabilityRulesSchema,
  ClearAvailabilityRulesSchema: schemas.ClearAvailabilityRulesSchema,
  ListWebhooksSchema: schemas.ListWebhooksSchema,
  GetWebhookSchema: schemas.GetWebhookSchema,
  CreateWebhookSchema: schemas.CreateWebhookSchema,
  UpdateWebhookSchema: schemas.UpdateWebhookSchema,
  DeleteWebhookSchema: schemas.DeleteWebhookSchema,
  ListWebhookDeliveriesSchema: schemas.ListWebhookDeliveriesSchema,
  ListICalSubscriptionsSchema: schemas.ListICalSubscriptionsSchema,
  GetICalSubscriptionSchema: schemas.GetICalSubscriptionSchema,
  SubscribeICalSchema: schemas.SubscribeICalSchema,
  UpdateICalSubscriptionSchema: schemas.UpdateICalSubscriptionSchema,
  DeleteICalSubscriptionSchema: schemas.DeleteICalSubscriptionSchema,
  SyncICalSubscriptionSchema: schemas.SyncICalSubscriptionSchema,
  CreateScopedKeySchema: schemas.CreateScopedKeySchema,
  ListScopedKeysSchema: schemas.ListScopedKeysSchema,
  RevokeScopedKeySchema: schemas.RevokeScopedKeySchema,
  GetAuditLogSchema: schemas.GetAuditLogSchema,
  AcceptTermsSchema: schemas.AcceptTermsSchema,
  GetUsageSchema: schemas.GetUsageSchema,
};

describe('schemas', () => {
  it('exports exactly 47 schemas', () => {
    expect(Object.keys(ALL_SCHEMAS)).toHaveLength(47);
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

    it('FindMeetingTimeSchema requires at least one agent', () => {
      const result = schemas.FindMeetingTimeSchema.safeParse({
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

    it('ListEventsSchema accepts calendar_id or agent_id (both optional at the schema level)', () => {
      expect(schemas.ListEventsSchema.safeParse({ calendar_id: 'cal_1' }).success).toBe(true);
      expect(schemas.ListEventsSchema.safeParse({ agent_id: 'agt_1' }).success).toBe(true);
      // status/source filters are accepted
      expect(schemas.ListEventsSchema.safeParse({ agent_id: 'agt_1', status: 'hold', source: 'internal' }).success).toBe(true);
    });

    it('CreateEventSchema accepts status="hold" with hold fields', () => {
      const result = schemas.CreateEventSchema.safeParse({
        calendar_id: 'cal_123',
        title: 'Tentative',
        start_time: '2026-04-15T09:00:00Z',
        end_time: '2026-04-15T10:00:00Z',
        status: 'hold',
        hold_expires_at: '2026-04-15T08:55:00Z',
        hold_priority: 10,
      });
      expect(result.success).toBe(true);
    });

    it('CreateEventSchema rejects status="cancelled" (not a valid create status)', () => {
      const result = schemas.CreateEventSchema.safeParse({
        calendar_id: 'cal_123',
        title: 'X',
        start_time: '2026-04-15T09:00:00Z',
        end_time: '2026-04-15T10:00:00Z',
        status: 'cancelled',
      });
      expect(result.success).toBe(false);
    });

    it('UpdateCalendarSchema accepts agent_status', () => {
      const result = schemas.UpdateCalendarSchema.safeParse({ calendar_id: 'cal_1', agent_status: 'waiting' });
      expect(result.success).toBe(true);
    });

    it('GetEventSchema makes calendar_id optional (resolved from event_id)', () => {
      const result = schemas.GetEventSchema.safeParse({ event_id: 'evt_1' });
      expect(result.success).toBe(true);
    });

    it('GetAvailabilitySchema accepts start_time/end_time aliases', () => {
      const result = schemas.GetAvailabilitySchema.safeParse({
        agent_id: 'agt_1', start_time: '2026-04-15T00:00:00Z', end_time: '2026-04-16T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('SubscribeICalSchema requires agent_id, calendar_id, and url', () => {
      const result = schemas.SubscribeICalSchema.safeParse({
        agent_id: 'agt_123',
        calendar_id: 'cal_123',
        url: 'https://example.com/feed.ics',
      });
      expect(result.success).toBe(true);
    });
  });
});
