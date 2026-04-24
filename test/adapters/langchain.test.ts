import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit } from '../../src/adapters/langchain';

vi.mock('@chronary/sdk', () => ({
  Chronary: vi.fn().mockImplementation(() => ({})),
}));

const config = { apiKey: 'chr_sk_live_test123' };

describe('LangChain adapter', () => {
  it('returns array of tools with name, description, schema, call', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(23);
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.schema).toBeTruthy();
      expect(typeof tool.call).toBe('function');
    }
  });

  it('supports selective tool loading', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['list_calendars', 'create_event'] });
    expect(toolkit.getTools()).toHaveLength(2);
  });
});
