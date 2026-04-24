import { ListToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

export interface LangChainTool {
  name: string;
  description: string;
  schema: ToolDefinition['schema'];
  call: (params: Record<string, unknown>) => Promise<string>;
}

/**
 * LangChain adapter.
 *
 * Returns tools compatible with LangChain's tool interface. Each tool's `call()`
 * returns a JSON string (LangChain convention).
 *
 * For full `StructuredTool` subclass support, use `getStructuredTools()` which
 * requires `@langchain/core` as a peer dependency.
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/langchain';
 *
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * const tools = toolkit.getTools();
 * ```
 */
export class ChronaryToolkit extends ListToolkit<LangChainTool> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): LangChainTool {
    const client = this.client;
    return {
      name: def.name,
      description: def.description,
      schema: def.schema,
      call: async (params: Record<string, unknown>) => {
        const result = await def.execute(client, params);
        return JSON.stringify(result.result);
      },
    };
  }
}
