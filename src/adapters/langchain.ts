import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ListToolkit } from '../base';
import type { ToolDefinition, ChronaryToolkitConfig } from '../types';

/**
 * One Chronary tool as a LangChain `StructuredTool` (a `DynamicStructuredTool`
 * from `@langchain/core/tools`). `invoke()` resolves to the tool result as a
 * JSON string (LangChain convention); a failed call resolves to the structured
 * error payload as JSON instead of throwing, so the model can act on it.
 */
export type LangChainTool = DynamicStructuredTool;

function toValidationError(err: z.ZodError): string {
  const message = err.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ');
  return JSON.stringify({ error: 'validation_error', message });
}

/**
 * LangChain adapter (`@langchain/core` is a peer dependency of this entry).
 *
 * `getTools()` returns real LangChain `StructuredTool`s, so they work with
 * `model.bindTools(tools)`, `createReactAgent({ llm, tools })` and
 * `AgentExecutor`. Each tool advertises the INPUT side of its Zod schema as
 * JSON Schema (LangChain cannot convert the `z.preprocess` steps in the
 * schemas itself) and runs the Zod schema on every call, so the same input
 * rules apply as in the other adapters (#2683).
 *
 * @example
 * ```ts
 * import { ChronaryToolkit } from '@chronary/toolkit/langchain';
 * import { createReactAgent } from '@langchain/langgraph/prebuilt';
 *
 * const toolkit = new ChronaryToolkit({ apiKey: process.env.CHRONARY_API_KEY });
 * const agent = createReactAgent({ llm, tools: toolkit.getTools() });
 * ```
 */
export class ChronaryToolkit extends ListToolkit<LangChainTool> {
  constructor(config: ChronaryToolkitConfig) {
    super(config);
  }

  protected buildTool(def: ToolDefinition): LangChainTool {
    const client = this.client;
    return new DynamicStructuredTool({
      name: def.name,
      description: def.description,
      schema: z.toJSONSchema(def.schema, { io: 'input' }) as Record<string, unknown>,
      func: async (input: unknown) => {
        const parsed = def.schema.safeParse(input);
        if (!parsed.success) return toValidationError(parsed.error);
        const result = await def.execute(client, parsed.data);
        return JSON.stringify(result.result);
      },
    });
  }
}
