import { vi } from 'vitest';

/** Creates a mocked Chronary client with all resource methods stubbed */
export function mockChronaryClient() {
  const mockPage = (data: unknown[] = [], total = 0) => ({
    getPage: vi.fn().mockResolvedValue({ data, total, hasMore: data.length < total, limit: 50, offset: 0 }),
    [Symbol.asyncIterator]: vi.fn(),
  });

  return {
    calendars: {
      list: vi.fn().mockReturnValue(mockPage()),
      get: vi.fn().mockResolvedValue(FIXTURES.calendar),
      create: vi.fn().mockResolvedValue(FIXTURES.calendar),
      update: vi.fn().mockResolvedValue(FIXTURES.calendar),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    events: {
      list: vi.fn().mockReturnValue(mockPage()),
      get: vi.fn().mockResolvedValue(FIXTURES.event),
      create: vi.fn().mockResolvedValue(FIXTURES.event),
      update: vi.fn().mockResolvedValue(FIXTURES.event),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    availability: {
      check: vi.fn().mockResolvedValue(FIXTURES.availability),
    },
    webhooks: {
      list: vi.fn().mockReturnValue(mockPage()),
      get: vi.fn().mockResolvedValue(FIXTURES.webhook),
      create: vi.fn().mockResolvedValue(FIXTURES.webhook),
      update: vi.fn().mockResolvedValue(FIXTURES.webhook),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    icalSubscriptions: {
      list: vi.fn().mockReturnValue(mockPage()),
      get: vi.fn().mockResolvedValue(FIXTURES.icalSubscription),
      create: vi.fn().mockResolvedValue(FIXTURES.icalSubscription),
      update: vi.fn().mockResolvedValue(FIXTURES.icalSubscription),
      delete: vi.fn().mockResolvedValue(undefined),
      sync: vi.fn().mockResolvedValue({ status: 'syncing' }),
    },
    usage: {
      get: vi.fn().mockResolvedValue(FIXTURES.usage),
    },
  };
}

export const FIXTURES = {
  calendar: {
    id: 'cal_abc123',
    orgId: 'org_1',
    agentId: 'agt_abc123',
    name: 'Team Meetings',
    timezone: 'America/Los_Angeles',
    metadata: {},
    ical_url: 'https://api.chronary.ai/ical/token.ics',
    deletedAt: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  event: {
    id: 'evt_abc123',
    calendarId: 'cal_abc123',
    orgId: 'org_1',
    title: 'Standup',
    description: null,
    startTime: '2026-04-15T09:00:00Z',
    endTime: '2026-04-15T09:30:00Z',
    allDay: false,
    status: 'confirmed',
    source: 'internal',
    metadata: {},
    deletedAt: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  availability: {
    agents: ['agt_abc123'],
    slots: [{ start: '2026-04-15T10:00:00Z', end: '2026-04-15T10:30:00Z' }],
  },
  webhook: {
    id: 'wh_abc123',
    orgId: 'org_1',
    url: 'https://example.com/webhook',
    events: ['event.created'],
    active: true,
    createdAt: '2026-04-01T00:00:00Z',
  },
  icalSubscription: {
    id: 'ics_abc123',
    orgId: 'org_1',
    agentId: 'agt_abc123',
    calendarId: 'cal_abc123',
    url: 'https://example.com/feed.ics',
    label: 'External Cal',
    status: 'active',
    lastSyncedAt: null,
    lastError: null,
    createdAt: '2026-04-01T00:00:00Z',
  },
  usage: {
    period_start: '2026-04-01T00:00:00Z',
    period_end: '2026-05-01T00:00:00Z',
    plan: 'free',
    agents: { used: 2, limit: 5 },
    calendars: { used: 3, limit: 10 },
    events: { used: 15, limit: 100 },
    api_calls: { used: 150, limit: 10000 },
    webhooks: { used: 1, limit: 5 },
    availability_queries: { used: 5, limit: 1000 },
    ical_subscriptions: { used: 1, limit: 3 },
  },
};
