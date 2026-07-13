import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit } from '../../src/adapters/openai';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
}));

const config = { apiKey: 'chr_sk_xxx123' };

describe('OpenAI adapter', () => {
  it('returns ChatCompletionTool[] format', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(50);
    for (const tool of tools) {
      expect(tool.type).toBe('function');
      expect(tool.function.name).toBeTruthy();
      expect(tool.function.description).toBeTruthy();
      expect(tool.function.parameters).toHaveProperty('type');
    }
  });

  it('toResponsesTools returns flatter format', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.toResponsesTools();
    expect(tools).toHaveLength(50);
    for (const tool of tools) {
      expect(tool.type).toBe('function');
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toHaveProperty('type');
    }
  });

  it('execute throws for unknown tool', async () => {
    const toolkit = new ChronaryToolkit(config);
    await expect(toolkit.execute('nonexistent', {})).rejects.toThrow('Unknown tool: nonexistent');
  });

  it('supports selective tool loading', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['find_meeting_time'] });
    expect(toolkit.getTools()).toHaveLength(1);
    expect(toolkit.toResponsesTools()).toHaveLength(1);
  });
});
