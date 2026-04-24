import { describe, it, expect, vi } from 'vitest';
import { TOOL_DEFINITIONS } from '../src/definitions';
import { ListToolkit, MapToolkit } from '../src/base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../src/types';

// Mock @chronary/sdk to avoid needing a real API key
vi.mock('@chronary/sdk', () => ({
  Chronary: vi.fn().mockImplementation(() => ({})),
}));

class TestListToolkit extends ListToolkit<string> {
  protected buildTool(def: ToolDefinition): string { return def.name; }
}

class TestMapToolkit extends MapToolkit<string> {
  protected buildTool(def: ToolDefinition): string { return def.name; }
}

const config: ChronaryToolkitConfig = { apiKey: 'chr_sk_live_test123' };

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 23 entries', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(23);
  });

  it('every definition has required fields', () => {
    for (const def of TOOL_DEFINITIONS) {
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.schema).toBeTruthy();
      expect(def.annotations).toBeTruthy();
      expect(typeof def.execute).toBe('function');
    }
  });

  it('has unique names', () => {
    const names = TOOL_DEFINITIONS.map(d => d.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('ListToolkit', () => {
  it('returns all 23 tools as array', () => {
    const toolkit = new TestListToolkit(config);
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(23);
    expect(Array.isArray(tools)).toBe(true);
  });

  it('filters by tool names', () => {
    const toolkit = new TestListToolkit({ ...config, tools: ['create_event', 'check_availability'] });
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(2);
    expect(tools).toContain('create_event');
    expect(tools).toContain('check_availability');
  });
});

describe('MapToolkit', () => {
  it('returns all 23 tools as record', () => {
    const toolkit = new TestMapToolkit(config);
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(23);
    expect(tools['create_event']).toBe('create_event');
  });

  it('filters by tool names', () => {
    const toolkit = new TestMapToolkit({ ...config, tools: ['get_usage'] });
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(1);
    expect(tools['get_usage']).toBe('get_usage');
  });
});
