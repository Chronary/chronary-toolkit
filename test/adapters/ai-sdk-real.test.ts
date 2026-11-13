/**
 * Regression test for #1987: run the AI SDK adapter's tools through the REAL
 * `ai` package (AI SDK 6) and check what the model receives.
 *
 * AI SDK 5 renamed a tool's `parameters` to `inputSchema` and AI SDK 6 ignores
 * `parameters`, so a tool without `inputSchema` reached the model as an empty
 * object schema. A shape-only test cannot see that; this one inspects the
 * JSON Schema the AI SDK hands to the language model.
 */
import { describe, it, expect, vi } from 'vitest';
import { generateText, stepCountIs } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import type { Chronary } from '@chronary/sdk';
import { chronaryTools } from '../../src/adapters/ai-sdk';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
  ChronaryError: class ChronaryError extends Error {},
}));

type ModelCallOptions = Parameters<MockLanguageModelV3['doGenerate']>[0];
type FunctionToolSpec = { type: 'function'; name: string; inputSchema: { type?: string; properties?: Record<string, unknown>; required?: string[] } };

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

function textResult(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    finishReason: { unified: 'stop' as const, raw: 'stop' },
    usage,
    warnings: [],
  };
}

function fakeClient(get: (id: string) => Promise<unknown>): Chronary {
  return { calendars: { get } } as unknown as Chronary;
}

function toolSpec(options: ModelCallOptions, name: string): FunctionToolSpec {
  const spec = (options.tools ?? []).find((t) => t.name === name);
  expect(spec, `${name} not sent to the model`).toBeTruthy();
  expect(spec!.type).toBe('function');
  return spec as FunctionToolSpec;
}

describe('AI SDK adapter through the real ai package (#1987)', () => {
  it('sends each tool with its real argument schema to the model', async () => {
    const calls: ModelCallOptions[] = [];
    const model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        calls.push(options);
        return textResult('ok');
      },
    });

    await generateText({
      model,
      tools: chronaryTools({ client: fakeClient(async () => ({})), tools: ['get_calendar', 'create_event'] }),
      prompt: 'What is on my calendar?',
    });

    expect(calls).toHaveLength(1);
    const getCalendar = toolSpec(calls[0], 'get_calendar');
    expect(getCalendar.inputSchema.type).toBe('object');
    expect(getCalendar.inputSchema.properties).toHaveProperty('calendar_id');
    expect(getCalendar.inputSchema.required).toContain('calendar_id');

    const createEvent = toolSpec(calls[0], 'create_event');
    expect(createEvent.inputSchema.required).toEqual(
      expect.arrayContaining(['calendar_id', 'title', 'start_time', 'end_time']),
    );
  });

  it('every one of the 65 tools reaches the model with a non-empty schema', async () => {
    const calls: ModelCallOptions[] = [];
    const model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        calls.push(options);
        return textResult('ok');
      },
    });

    await generateText({ model, tools: chronaryTools({ client: fakeClient(async () => ({})) }), prompt: 'hi' });

    const tools = calls[0].tools ?? [];
    expect(tools).toHaveLength(65);
    for (const spec of tools as FunctionToolSpec[]) {
      expect(spec.inputSchema.type, `${spec.name} schema type`).toBe('object');
      expect(spec.inputSchema.properties, `${spec.name} schema properties`).toBeDefined();
    }
    // Most tools take arguments; an empty-schema regression would zero all of these.
    const withArgs = (tools as FunctionToolSpec[]).filter((t) => Object.keys(t.inputSchema.properties ?? {}).length > 0);
    expect(withArgs.length).toBeGreaterThan(50);
  });

  it('runs a model tool call through execute with the validated arguments', async () => {
    const get = vi.fn(async (id: string) => ({ id, name: 'Work' }));
    let step = 0;
    const model = new MockLanguageModelV3({
      doGenerate: async () => {
        step += 1;
        if (step === 1) {
          return {
            content: [{
              type: 'tool-call' as const,
              toolCallId: 'call_1',
              toolName: 'get_calendar',
              input: JSON.stringify({ calendar_id: 'cal_abc123' }),
            }],
            finishReason: { unified: 'tool-calls' as const, raw: 'tool_calls' },
            usage,
            warnings: [],
          };
        }
        return textResult('done');
      },
    });

    const result = await generateText({
      model,
      tools: chronaryTools({ client: fakeClient(get), tools: ['get_calendar'] }),
      stopWhen: stepCountIs(2),
      prompt: 'Show calendar cal_abc123',
    });

    expect(get).toHaveBeenCalledWith('cal_abc123');
    const toolResults = result.steps[0].toolResults;
    expect(toolResults).toHaveLength(1);
    expect(toolResults[0].toolName).toBe('get_calendar');
    expect(toolResults[0].input).toEqual({ calendar_id: 'cal_abc123' });
    expect(toolResults[0].output).toEqual({ id: 'cal_abc123', name: 'Work' });
    // The result went back to the model and it answered in a second step.
    expect(step).toBe(2);
    expect(result.text).toBe('done');
  });

  it('surfaces a failed Chronary call as a tool error', async () => {
    const get = vi.fn(async () => {
      throw new Error('calendar not found');
    });
    const model = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [{
          type: 'tool-call' as const,
          toolCallId: 'call_1',
          toolName: 'get_calendar',
          input: JSON.stringify({ calendar_id: 'cal_missing' }),
        }],
        finishReason: { unified: 'tool-calls' as const, raw: 'tool_calls' },
        usage,
        warnings: [],
      }),
    });

    const result = await generateText({
      model,
      tools: chronaryTools({ client: fakeClient(get), tools: ['get_calendar'] }),
      prompt: 'Show calendar cal_missing',
    });

    const toolError = result.steps[0].content.find((part) => part.type === 'tool-error');
    expect(toolError).toBeTruthy();
    const error = (toolError as { error: unknown }).error;
    expect(error).toBeInstanceOf(Error);
    expect(JSON.parse((error as Error).message)).toEqual({ error: 'error', message: 'calendar not found' });
  });
});
