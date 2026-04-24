import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodRawShape } from 'zod';
import { ListToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig, ToolResult, ToolAnnotations } from '../types';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: ToolAnnotations;
}

export interface McpToolRegistrationConfig {
  title?: string;
  description?: string;
  inputSchema?: ZodRawShape;
  annotations?: ToolAnnotations;
}

export type McpToolHandlerResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

/**
 * Minimal shape of the MCP SDK's `McpServer` that the toolkit depends on.
 * Matches `registerTool(name, config, handler)` from `@modelcontextprotocol/sdk` >= 1.10.
 */
export interface McpServerLike {
  registerTool(
    name: string,
    config: McpToolRegistrationConfig,
    handler: (params: Record<string, unknown>) => Promise<McpToolHandlerResult>,
  ): unknown;
}

/**
 * MCP v1.x adapter.
 *
 * Use `registerAll(server)` to register tools directly on an McpServer instance,
 * or `getTools()` to get tool metadata for custom registration.
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/mcp';
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 *
 * const server = new McpServer({ name: 'chronary', version: '1.0.0' });
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * toolkit.registerAll(server);
 * ```
 */
export class ChronaryToolkit extends ListToolkit<McpToolDefinition> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): McpToolDefinition {
    return {
      name: def.name,
      description: def.description,
      inputSchema: zodToJsonSchema(def.schema, { target: 'openApi3' }),
      annotations: { ...def.annotations },
    };
  }

  /**
   * Register all tools directly on an McpServer instance.
   * Uses `server.registerTool()` (MCP SDK v1.10+) so annotations reach the client.
   */
  registerAll(server: McpServerLike) {
    const client = this.client;
    for (const def of this.definitions) {
      server.registerTool(
        def.name,
        {
          description: def.description,
          inputSchema: def.schema.shape,
          annotations: { ...def.annotations },
        },
        async (params: Record<string, unknown>) => {
          const result: ToolResult = await def.execute(client, params);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result.result) }],
            isError: result.isError,
          };
        },
      );
    }
  }
}
