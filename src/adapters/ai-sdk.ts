import { MapToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

/**
 * Vercel AI SDK 6.x adapter.
 *
 * Returns tools as `Record<string, Tool>` compatible with `generateText({ tools })`.
 * Zod schemas are passed directly via `parameters` (AI SDK accepts Zod natively).
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/ai-sdk';
 * import { generateText } from 'ai';
 *
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   tools: toolkit.getTools(),
 *   prompt: 'Schedule a meeting tomorrow at 2pm',
 * });
 * ```
 */
export class ChronaryToolkit extends MapToolkit<{
  description: string;
  parameters: ToolDefinition['schema'];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition) {
    const client = this.client;
    return {
      description: def.description,
      parameters: def.schema,
      execute: async (params: Record<string, unknown>) => {
        const result = await def.execute(client, params);
        if (result.isError) throw new Error(result.result as string);
        return result.result;
      },
    };
  }
}

/** Convenience function that returns the tools map directly */
export function chronaryTools(config: ChronaryToolkitConfig) {
  return new ChronaryToolkit(config).getTools();
}
