/**
 * Regression test for #2683: run the LangChain adapter's tools through the
 * REAL `@langchain/core` (1.x).
 *
 * The adapter returned plain `{ name, description, schema, call }` objects:
 * not `StructuredTool`s (no `.invoke`), so `createReactAgent` / `AgentExecutor`
 * could not run them, and `convertToOpenAITool` (what `bindTools` uses) threw
 * "Transforms cannot be represented in JSON Schema" for the 11 tools whose
 * schemas use `z.preprocess` (the #2519 empty-ID hardening). A shape-only test
 * cannot see either; this one uses LangChain's own helpers.
 */
import { describe, it, expect, vi } from 'vitest';
import { isStructuredTool } from '@langchain/core/tools';
import { convertToOpenAITool } from '@langchain/core/utils/function_calling';
import { ChronaryToolkit } from '../../src/adapters/langchain';
import { TOOL_DEFINITIONS } from '../../src/definitions';

const getCalendar = vi.fn(async (id: string) => ({ id, name: 'Work' }));
const listCalendars = vi.fn((_params?: unknown) => ({
  getPage: async () => ({ data: [], total: 0, hasMore: false }),
}));

vi.mock('@chronary/sdk', () => ({
  Chronary: class {
    calendars = { get: getCalendar, list: listCalendars };
    constructor(_config?: unknown) {}
  },
  ChronaryError: class ChronaryError extends Error {},
}));

const config = { apiKey: 'chr_sk_xxx123' };

function toolNamed(name: string) {
  const found = new ChronaryToolkit(config).getTools().find((t) => t.name === name);
  if (!found) throw new Error(`no tool ${name}`);
  return found;
}

describe('LangChain adapter through the real @langchain/core (#2683)', () => {
  it('every tool is a LangChain StructuredTool', () => {
    const tools = new ChronaryToolkit(config).getTools();
    expect(tools).toHaveLength(TOOL_DEFINITIONS.length);
    for (const tool of tools) {
      expect(isStructuredTool(tool), tool.name).toBe(true);
      expect(typeof tool.invoke, tool.name).toBe('function');
    }
  });

  it('every tool converts to an OpenAI tool (what bindTools does)', () => {
    for (const tool of new ChronaryToolkit(config).getTools()) {
      const converted = convertToOpenAITool(tool);
      expect(converted.function.name).toBe(tool.name);
      expect(converted.function.parameters, tool.name).toMatchObject({ type: 'object' });
    }
  });

  it('invoke() calls Chronary and returns the result as a JSON string', async () => {
    getCalendar.mockClear();
    const out = await toolNamed('get_calendar').invoke({ calendar_id: 'cal_123' });
    expect(getCalendar).toHaveBeenCalledWith('cal_123');
    expect(JSON.parse(out as string)).toMatchObject({ id: 'cal_123' });
  });

  it('applies the Zod schema: an empty optional ID is treated as not given (#2519)', async () => {
    listCalendars.mockClear();
    await toolNamed('list_calendars').invoke({ agent_id: '' });
    expect(listCalendars).toHaveBeenCalledTimes(1);
    expect(listCalendars.mock.calls[0][0]).toMatchObject({ agentId: undefined });
  });

  it('a path-escaping ID never reaches the SDK (#2519)', async () => {
    getCalendar.mockClear();
    // LangChain checks the advertised JSON Schema (its ID pattern) first and
    // rejects with a ToolInputParsingException; agents surface that as a tool error.
    await expect(toolNamed('get_calendar').invoke({ calendar_id: '../agents/agt_main' })).rejects.toThrow(
      /did not match expected schema/,
    );
    expect(getCalendar).not.toHaveBeenCalled();
  });

  it('a rule JSON Schema cannot express (a Zod refine) is still enforced, as a validation_error result', async () => {
    const out = await toolNamed('update_ical_subscription').invoke({
      subscription_id: 'ics_1',
      url: 'http://example.com/feed.ics',
    });
    expect(JSON.parse(out as string)).toMatchObject({ error: 'validation_error', message: expect.stringContaining('HTTPS') });
  });
});
