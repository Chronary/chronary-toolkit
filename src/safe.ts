import { ChronaryError } from '@chronary/sdk';
import type { ToolResult } from './types';

/**
 * Wraps an async function so SDK errors become structured ToolResult objects
 * instead of thrown exceptions. LLMs see error messages, never stack traces.
 */
export function safeFunc<TParams>(
  fn: (params: TParams) => Promise<unknown>,
): (params: TParams) => Promise<ToolResult> {
  return async (params: TParams): Promise<ToolResult> => {
    try {
      const result = await fn(params);
      return { result: result ?? { success: true }, isError: false };
    } catch (err) {
      if (err instanceof ChronaryError) {
        return { result: `${err.name}: ${err.message}`, isError: true };
      }
      return {
        result: `Error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  };
}
