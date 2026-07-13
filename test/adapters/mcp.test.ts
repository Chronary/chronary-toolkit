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
    expect(tools).toHaveLength(50);
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
    expect(mockServer.registerTool).toHaveBeenCalledTimes(50);
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

  // Regression: hosted MCP (apps/api) exposes `duration` (preferred) alongside the
  // deprecated `slot_duration` on the availability tools. The stdio toolkit schemas
  // must stay in parity so schema-driven clients see the same alias on both surfaces.
  it('availability tools expose the preferred `duration` field plus deprecated `slot_duration`', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['get_availability', 'find_meeting_time'] });
    const tools = toolkit.getTools();
    for (const name of ['get_availability', 'find_meeting_time']) {
      const tool = tools.find(t => t.name === name)!;
      const props = (tool.inputSchema as { properties?: Record<string, unknown> }).properties ?? {};
      expect(props).toHaveProperty('duration');
      expect(props).toHaveProperty('slot_duration');
    }
  });

  it('registerAll delivers read-only annotations for list/get tools', () => {
    const toolkit = new ChronaryToolkit({ ...config, tools: ['list_calendars', 'find_meeting_time'] });
    const mockServer = { registerTool: vi.fn() };
    toolkit.registerAll(mockServer);
    for (const call of mockServer.registerTool.mock.calls) {
      const registered = call[1];
      expect(registered.annotations?.readOnlyHint).toBe(true);
      expect(registered.annotations?.destructiveHint).toBe(false);
    }
  });

  // Parity with hosted MCP (audit #): stdio must expose the same 4 prompts and
  // 1 resource so prompts/list and resources/list don't return "Method not found".
  it('registerPrompts registers the 4 hosted prompts', () => {
    const toolkit = new ChronaryToolkit(config);
    const registerPrompt = vi.fn();
    toolkit.registerPrompts({ registerTool: vi.fn(), registerPrompt });
    expect(registerPrompt).toHaveBeenCalledTimes(4);
    expect(registerPrompt.mock.calls.map((c) => c[0])).toEqual([
      'schedule_event',
      'find_meeting_time',
      'daily_agenda',
      'new_scheduling_proposal',
    ]);
  });

  it('prompt handlers expand into a single user message referencing the args', () => {
    const toolkit = new ChronaryToolkit(config);
    const registerPrompt = vi.fn();
    toolkit.registerPrompts({ registerTool: vi.fn(), registerPrompt });
    const scheduleHandler = registerPrompt.mock.calls[0][2];
    const result = scheduleHandler({ calendar_id: 'cal_1', title: 'Sync', start_time: 'S', end_time: 'E' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.text).toContain('cal_1');
    expect(result.messages[0].content.text).toContain('Sync');
  });

  it('registerResources registers the chronary://about resource', () => {
    const toolkit = new ChronaryToolkit(config);
    const registerResource = vi.fn();
    toolkit.registerResources({ registerTool: vi.fn(), registerResource });
    expect(registerResource).toHaveBeenCalledTimes(1);
    const [name, uri, , handler] = registerResource.mock.calls[0];
    expect(name).toBe('about');
    expect(uri).toBe('chronary://about');
    expect(handler().contents[0].text).toContain('Chronary');
  });

  it('registerPrompts/registerResources are safe no-ops on a tool-only server', () => {
    const toolkit = new ChronaryToolkit(config);
    expect(() => toolkit.registerPrompts({ registerTool: vi.fn() })).not.toThrow();
    expect(() => toolkit.registerResources({ registerTool: vi.fn() })).not.toThrow();
  });

});
