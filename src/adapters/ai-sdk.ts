import { MapToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

/**
 * One Chronary tool in the Vercel AI SDK tool shape.
 *
 * The Zod input schema is set under both field names the AI SDK has used:
 * `inputSchema` (AI SDK 5 and 6) and `parameters` (AI SDK 4). Each version
 * reads its own field and ignores the other, so the same object works with
 * `ai` 4, 5 and 6 without importing `ai` at runtime.
 */
export interface AISDKTool {
  description: string;
  /** Tool input schema read by AI SDK 5 and 6. */
  inputSchema: ToolDefinition['schema'];
  /** Tool input schema read by AI SDK 4 (the same Zod object as `inputSchema`). */
  parameters: ToolDefinition['schema'];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Vercel AI SDK adapter (AI SDK 4, 5 and 6).
 *
 * Returns tools as a `Record<string, Tool>` that you pass straight to
 * `generateText({ tools })` or `streamText({ tools })`. The Zod schemas are
 * passed as-is (the AI SDK accepts Zod natively) under `inputSchema` and
 * `parameters`, see {@link AISDKTool}. A failed tool call throws an `Error`
 * whose message is the structured error as JSON.
 *
 * @example
 * ```ts
 * import { chronaryTools } from '@chronary/toolkit/ai-sdk';
 * import { generateText, stepCountIs } from 'ai';
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   tools: chronaryTools({ apiKey: process.env.CHRONARY_API_KEY! }),
 *   stopWhen: stepCountIs(5),
 *   prompt: 'Schedule a meeting tomorrow at 2pm',
 * });
 * ```
 */
export class ChronaryToolkit extends MapToolkit<AISDKTool> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): AISDKTool {
    const client = this.client;
    return {
      description: def.description,
      inputSchema: def.schema,
      parameters: def.schema,
      execute: async (params: Record<string, unknown>) => {
        const result = await def.execute(client, params);
        if (result.isError) throw new Error(typeof result.result === 'string' ? result.result : JSON.stringify(result.result));
        return result.result;
      },
    };
  }
}

/** Convenience function that returns the tools map directly */
export function chronaryTools(config: ChronaryToolkitConfig) {
  return new ChronaryToolkit(config).getTools();
}
