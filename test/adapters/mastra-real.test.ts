/**
 * Regression test for #2682: run the Mastra adapter's tools through the REAL
 * `@mastra/core` (1.x) tool pipeline.
 *
 * Mastra 1.x treats the toolkit's plain tool objects as Vercel-style tools and
 * calls `execute(args, execOptions)` with the arguments directly. The adapter
 * was written for the pre-1.0 `execute({ context })` contract, so `context`
 * was undefined and every call failed. A shape-only test cannot see that; this
 * one converts the tools with Mastra's own `makeCoreTool` and runs `execute`.
 */
import { describe, it, expect, vi } from 'vitest';
import { makeCoreTool } from '@mastra/core/utils';
import { RequestContext } from '@mastra/core/request-context';
import { ChronaryToolkit } from '../../src/adapters/mastra';
import { TOOL_DEFINITIONS } from '../../src/definitions';

const get = vi.fn(async (id: string) => ({ id, name: 'Work' }));

vi.mock('@chronary/sdk', () => ({
  Chronary: class {
    calendars = { get };
    constructor(_config?: unknown) {}
  },
  ChronaryError: class ChronaryError extends Error {},
}));

function coreTool(name: string) {
  const tools = new ChronaryToolkit({ apiKey: 'chr_sk_xxx123' }).getTools();
  return makeCoreTool(tools[name] as never, { name, requestContext: new RequestContext() });
}

describe('Mastra adapter through the real @mastra/core (#2682)', () => {
  it('passes the tool arguments to the Chronary call', async () => {
    get.mockClear();
    const tool = coreTool('get_calendar');
    const result = await tool.execute!({ calendar_id: 'cal_123' }, { toolCallId: 'call_1', messages: [] });
    expect(get).toHaveBeenCalledWith('cal_123');
    expect(JSON.stringify(result)).toContain('cal_123');
  });

  it('still accepts the pre-1.0 { context } call shape', async () => {
    get.mockClear();
    const tools = new ChronaryToolkit({ apiKey: 'chr_sk_xxx123' }).getTools();
    await tools.get_calendar.execute({ context: { calendar_id: 'cal_legacy' } });
    expect(get).toHaveBeenCalledWith('cal_legacy');
  });

  it('no tool takes a top-level `context` argument (the adapter reads that key as the pre-1.0 wrapper)', () => {
    for (const def of TOOL_DEFINITIONS) {
      const shape = (def.schema as { shape?: Record<string, unknown> }).shape ?? {};
      expect(Object.keys(shape), def.name).not.toContain('context');
    }
  });
});
