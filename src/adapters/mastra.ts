import { MapToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

export interface MastraTool {
  id: string;
  description: string;
  inputSchema: ToolDefinition['schema'];
  execute: (context: { context: Record<string, unknown> }) => Promise<unknown>;
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
      execute: async ({ context }: { context: Record<string, unknown> }) => {
        const result = await def.execute(client, context);
        if (result.isError) throw new Error(result.result as string);
        return result.result;
      },
    };
  }
}
