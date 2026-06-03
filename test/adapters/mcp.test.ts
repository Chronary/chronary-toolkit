import { describe, it, expect, vi } from 'vitest';
import { ChronaryToolkit } from '../../src/adapters/mcp';

vi.mock('@chronary/sdk', () => ({
  Chronary: class { constructor(_config?: unknown) {} },
}));

const config = { apiKey: 'chr_sk_xxx123' };

describe('MCP adapter', () => {
  it('returns array of MCP tool definitions', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    expect(tools).toHaveLength(23);
  });

  it('each tool has name, description, inputSchema, and annotations', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.annotations).toBeTruthy();
    }
  });

  it('inputSchema is a JSON Schema object', () => {
    const toolkit = new ChronaryToolkit(config);
    const tools = toolkit.getTools();
    const createEvent = tools.find(t => t.name === 'create_event')!;
    expect(createEvent.inputSchema).toHaveProperty('type');
    expect(createEvent.inputSchema).toHaveProperty('properties');
  });

  it('registerAll calls server.registerTool() for each definition', () => {
    const toolkit = new ChronaryToolkit(config);
    const mockServer = { registerTool: vi.fn() };
    toolkit.registerAll(mockServer);
    expect(mockServer.registerTool).toHaveBeenCalledTimes(23);
    expect(mockServer.registerTool.mock.calls[0][0]).toBeTruthy(); // first arg is name
  });

  it('registerAll respects tool filtering', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['get_usage'] });
    const mockServer = { registerTool: vi.fn() };
    toolkit.registerAll(mockServer);
    expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
    expect(mockServer.registerTool.mock.calls[0][0]).toBe('get_usage');
  });

  it('registerAll passes description, Zod shape, and annotations in config', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['delete_calendar'] });
    const mockServer = { registerTool: vi.fn() };
    toolkit.registerAll(mockServer);
    const [name, registered] = mockServer.registerTool.mock.calls[0];
    expect(name).toBe('delete_calendar');
    expect(registered.description).toContain('delete');
    expect(registered.inputSchema).toBeTypeOf('object');
    expect(registered.annotations).toMatchObject({
      title: 'Delete Calendar',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  it('registerAll delivers read-only annotations for list/get tools', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['list_calendars', 'check_availability'] });
    const mockServer = { registerTool: vi.fn() };
    toolkit.registerAll(mockServer);
    for (const call of mockServer.registerTool.mock.calls) {
      const registered = call[1];
      expect(registered.annotations?.readOnlyHint).toBe(true);
      expect(registered.annotations?.destructiveHint).toBe(false);
    }
  });

});
