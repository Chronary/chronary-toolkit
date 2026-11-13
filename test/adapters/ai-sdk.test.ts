import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit, chronaryTools } from '../../src/adapters/ai-sdk';
import { TOOL_DEFINITIONS } from '../../src/definitions';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
  ChronaryError: class ChronaryError extends Error {},
}));

const config = { apiKey: 'chr_sk_xxx123' };

describe('AI SDK adapter', () => {
  it('returns Record<string, Tool> with all 65 tools', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(65);
  });

  it('each tool has description, inputSchema, parameters, and execute', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.description, `${name} missing description`).toBeTruthy();
      expect(tool.inputSchema, `${name} missing inputSchema`).toBeTruthy();
      expect(tool.parameters, `${name} missing parameters`).toBeTruthy();
      expect(typeof tool.execute, `${name} missing execute`).toBe('function');
    }
  });

  it('sets the definition schema as both inputSchema (AI SDK 5/6) and parameters (AI SDK 4) (#1987)', () => {
    const tools = chronaryTools(config);
    for (const def of TOOL_DEFINITIONS) {
      expect(tools[def.name].inputSchema, `${def.name} inputSchema`).toBe(def.schema);
      expect(tools[def.name].parameters, `${def.name} parameters`).toBe(def.schema);
    }
  });

  it('execute returns the result, and throws the structured error as JSON', async () => {
    const client = {
      calendars: {
        get: async (id: string) => {
          if (id === 'cal_missing') throw new Error('calendar not found');
          return { id };
        },
      },
    };
    const tools = chronaryTools({ client: client as never, tools: ['get_calendar'] });
    await expect(tools['get_calendar'].execute({ calendar_id: 'cal_1' })).resolves.toEqual({ id: 'cal_1' });
    const err = await tools['get_calendar'].execute({ calendar_id: 'cal_missing' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(JSON.parse((err as Error).message)).toEqual({ error: 'error', message: 'calendar not found' });
  });

  it('supports selective tool loading', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['create_event'] });
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(1);
    expect(tools['create_event']).toBeTruthy();
  });

  it('chronaryTools convenience function works', () => {
    const tools = chronaryTools(config);
    expect(Object.keys(tools)).toHaveLength(65);
  });
});
