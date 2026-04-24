import { zodToJsonSchema } from 'zod-to-json-schema';
import { ListToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig, ToolResult } from '../types';

export interface ChatCompletionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

export interface ResponsesTool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
}

/**
 * OpenAI adapter supporting both Chat Completions and Responses API formats.
 *
 * @example Chat Completions
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/openai';
 *
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   tools: toolkit.getTools(),
 *   messages: [{ role: 'user', content: 'What meetings do I have today?' }],
 * });
 * ```
 *
 * @example Responses API (GPT-5.4+ reasoning)
 * ```ts
 * const tools = toolkit.toResponsesTools();
 * const response = await openai.responses.create({
 *   model: 'gpt-5.4',
 *   tools,
 *   input: 'Check availability tomorrow afternoon',
 * });
 * ```
 */
export class ChronaryToolkit extends ListToolkit<ChatCompletionTool> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: def.name,
        description: def.description,
        parameters: zodToJsonSchema(def.schema, { target: 'openApi3' }),
      },
    };
  }

  /** Get tools in OpenAI Responses API format (flatter structure) */
  toResponsesTools(): ResponsesTool[] {
    return this.definitions.map((def) => ({
      type: 'function' as const,
      name: def.name,
      description: def.description,
      parameters: zodToJsonSchema(def.schema, { target: 'openApi3' }),
    }));
  }

  /**
   * Execute a tool call by name. Use this to process tool_calls from either
   * Chat Completions or Responses API responses.
   */
  async execute(name: string, args: string | Record<string, unknown>): Promise<ToolResult> {
    const def = this.definitions.find((d) => d.name === name);
    if (!def) throw new Error(`Unknown tool: ${name}`);
    const params = typeof args === 'string' ? JSON.parse(args) : args;
    return def.execute(this.client, params);
  }
}
