import { MapToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

export interface MastraTool {
  id: string;
  description: string;
  inputSchema: ToolDefinition['schema'];
  /**
   * Accepts both Mastra call shapes: 1.x passes the tool arguments directly
   * (`execute(args, options)`); before 1.0 they came wrapped as
   * `execute({ context: args, ... })`.
   */
  execute: (input: Record<string, unknown>, options?: unknown) => Promise<unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The tool arguments from either Mastra call shape (#2682). No Chronary tool
 * takes a top-level `context` argument (a test guards this), so an object
 * under `context` can only be the pre-1.0 wrapper.
 */
function toolArgs(input: unknown): Record<string, unknown> {
  if (!isPlainObject(input)) return {};
  return isPlainObject(input.context) ? input.context : input;
}

/**
 * Mastra adapter.
 *
 * Returns tools compatible with Mastra's tool format.
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/mastra';
 *
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * const tools = toolkit.getTools();
 * ```
 */
export class ChronaryToolkit extends MapToolkit<MastraTool> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): MastraTool {
    const client = this.client;
    return {
      id: def.name,
      description: def.description,
      inputSchema: def.schema,
      execute: async (input: Record<string, unknown>) => {
        const result = await def.execute(client, toolArgs(input));
        if (result.isError) throw new Error(typeof result.result === 'string' ? result.result : JSON.stringify(result.result));
        return result.result;
      },
    };
  }
}
