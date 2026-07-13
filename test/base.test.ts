import { describe, it, expect, vi } from 'vitest';
import { HOSTED_API_MCP_TOOL_NAMES, TOOLKIT_MCP_PARITY, TOOL_DEFINITIONS } from '../src/definitions';
import { ListToolkit, MapToolkit } from '../src/base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../src/types';

// Mock @chronary/sdk to avoid needing a real API key
vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
}));

class TestListToolkit extends ListToolkit<string> {
  protected buildTool(def: ToolDefinition): string { return def.name; }
}

class TestMapToolkit extends MapToolkit<string> {
  protected buildTool(def: ToolDefinition): string { return def.name; }
}

const config: ChronaryToolkitConfig = { apiKey: 'chr_sk_xxx123' };

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 50 entries', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(50);
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

  it('has exact tool-for-tool parity with the hosted API MCP server', () => {
    expect(HOSTED_API_MCP_TOOL_NAMES).toHaveLength(50);
    expect(TOOLKIT_MCP_PARITY.missingHostedTools).toEqual([]);
    expect(TOOLKIT_MCP_PARITY.toolkitOnlyTools).toEqual([]);
  });
});

describe('ListToolkit', () => {
  it('returns all 50 tools as array', () => {
    const toolkit = new TestListToolkit(config);
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(50);
    expect(Array.isArray(tools)).toBe(true);
  });

  it('filters by tool names', () => {
    const toolkit = new TestListToolkit({ ...config, tools: ['create_event', 'find_meeting_time'] });
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(2);
    expect(tools).toContain('create_event');
    expect(tools).toContain('find_meeting_time');
  });
});

describe('MapToolkit', () => {
  it('returns all 50 tools as record', () => {
    const toolkit = new TestMapToolkit(config);
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(50);
    expect(tools['create_event']).toBe('create_event');
  });

  it('filters by tool names', () => {
    const toolkit = new TestMapToolkit({ ...config, tools: ['get_usage'] });
    const tools = toolkit.getTools();
    expect(Object.keys(tools)).toHaveLength(1);
    expect(tools['get_usage']).toBe('get_usage');
  });
});
