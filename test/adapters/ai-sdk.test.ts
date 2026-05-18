import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit, chronaryTools } from '../../src/adapters/ai-sdk';

vi.mock('@chronary/sdk', () => ({
  Chronary: vi.fn().mockImplementation(() => ({})),
}));

const config = { apiKey: 'chr_sk_test123' };

describe('AI SDK adapter', () => {
  it('returns Record<string, Tool> with all 23 tools', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(23);
  });

  it('each tool has description, parameters, and execute', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.description, `${name} missing description`).toBeTruthy();
      expect(tool.parameters, `${name} missing parameters`).toBeTruthy();
      expect(typeof tool.execute, `${name} missing execute`).toBe('function');
    }
  });

  it('supports selective tool loading', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['create_event'] });
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(1);
    expect(tools['create_event']).toBeTruthy();
  });

  it('chronaryTools convenience function works', () => {
    const tools = chronaryTools(config);
    expect(Object.keys(tools)).toHaveLength(23);
  });
});
