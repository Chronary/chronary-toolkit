import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit } from '../../src/adapters/mastra';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
}));

const config = { apiKey: 'chr_sk_xxx123' };

describe('Mastra adapter', () => {
  it('returns Record<string, MastraTool> with all 23 tools', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(23);
  });

  it('each tool has id, description, inputSchema, execute', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.id, `${name} missing id`).toBeTruthy();
      expect(tool.description, `${name} missing description`).toBeTruthy();
      expect(tool.inputSchema, `${name} missing inputSchema`).toBeTruthy();
      expect(typeof tool.execute, `${name} missing execute`).toBe('function');
    }
  });

  it('supports selective tool loading', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['get_usage'] });
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(1);
  });
});
