import { describe, it, expect, vi } from 'vitest';
import { TOOL_DEFINITIONS } from '../src/definitions';
import { EVENT_UNTRUSTED_FIELDS, WEBHOOK_DELIVERY_UNTRUSTED_FIELDS, withUntrustedFields } from '../src/untrusted';
import { MCP_SERVER_INSTRUCTIONS } from '../src/instructions';
import * as root from '../src/index';
import * as mcpEntry from '../src/adapters/mcp';
import { mockChronaryClient, FIXTURES } from './helpers';
import type { Chronary } from '@chronary/sdk';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
  ChronaryError: class extends Error {},
}));

const def = (name: string) => TOOL_DEFINITIONS.find((d) => d.name === name)!;

describe('untrusted_fields marking (#1621)', () => {
  it('marks exactly the event and webhook-delivery tools', () => {
    const marked = Object.fromEntries(
      TOOL_DEFINITIONS.filter((d) => d.untrustedFields).map((d) => [d.name, [...d.untrustedFields!]]),
    );
    const ev = [...EVENT_UNTRUSTED_FIELDS];
    const wd = [...WEBHOOK_DELIVERY_UNTRUSTED_FIELDS];
    expect(marked).toEqual({
      list_events: ev,
      list_org_events: ev,
      get_event: ev,
      update_event: ev,
      cancel_event: ev,
      confirm_event: ev,
      get_calendar_context: ev,
      list_webhook_deliveries: wd,
      get_webhook_delivery: wd,
    });
  });

  it('get_event results start with untrusted_fields', async () => {
    const client = mockChronaryClient() as unknown as Chronary;
    const result = await def('get_event').execute(client, { event_id: 'evt_1' });
    expect(result.isError).toBe(false);
    const body = result.result as Record<string, unknown>;
    expect(Object.keys(body)[0]).toBe('untrusted_fields');
    expect(body).toEqual({ untrusted_fields: ['title', 'description', 'metadata'], ...FIXTURES.event });
  });

  it('error results are unchanged', async () => {
    const client = mockChronaryClient();
    client.events.getById.mockRejectedValue(new Error('down'));
    const result = await def('get_event').execute(client as unknown as Chronary, { event_id: 'evt_1' });
    expect(result.isError).toBe(true);
    expect(result.result).not.toHaveProperty('untrusted_fields');
  });

  it('tools without third-party text are unchanged', async () => {
    const client = mockChronaryClient() as unknown as Chronary;
    const result = await def('get_agent').execute(client, { agent_id: 'agt_1' });
    expect(result.result).not.toHaveProperty('untrusted_fields');
  });

  it('withUntrustedFields leaves arrays and primitives alone', () => {
    const arr = { result: [1], isError: false };
    expect(withUntrustedFields(arr, ['title'])).toBe(arr);
    const prim = { result: 'x', isError: false };
    expect(withUntrustedFields(prim, ['title'])).toBe(prim);
  });
});

describe('MCP annotations (#1662)', () => {
  // A tool that makes Chronary contact a caller-supplied URL reaches outside the org.
  it('every tool that takes a url argument has openWorldHint: true', () => {
    const urlTools = TOOL_DEFINITIONS.filter((d) => Object.keys(d.schema.shape).some((k) => k === 'url' || k.endsWith('_url')));
    expect(urlTools.map((d) => d.name).sort()).toEqual([
      'create_webhook',
      'subscribe_ical',
      'update_ical_subscription',
      'update_webhook',
    ]);
    for (const d of urlTools) expect(d.annotations.openWorldHint, d.name).toBe(true);
  });

  it('update_webhook is destructive', () => {
    expect(def('update_webhook').annotations.destructiveHint).toBe(true);
  });

  it('read-only tools are never destructive', () => {
    for (const d of TOOL_DEFINITIONS) {
      if (d.annotations.readOnlyHint) expect(d.annotations.destructiveHint, d.name).toBe(false);
    }
  });
});

describe('MCP_SERVER_INSTRUCTIONS', () => {
  it('is exported from the root and the mcp entry', () => {
    expect(root.MCP_SERVER_INSTRUCTIONS).toBe(MCP_SERVER_INSTRUCTIONS);
    expect(mcpEntry.MCP_SERVER_INSTRUCTIONS).toBe(MCP_SERVER_INSTRUCTIONS);
  });

  it('tells the model third-party text is data, not instructions', () => {
    expect(MCP_SERVER_INSTRUCTIONS).toContain('untrusted_fields');
    expect(MCP_SERVER_INSTRUCTIONS).toMatch(/never as instructions/);
  });
});
