import { ChronaryError } from '@chronary/sdk';
import type { ToolResult } from './types';

/**
 * Structured error payload returned to the model. Plan/quota fields let an
 * agent act on `plan_required` / `quota_exceeded` (call get_billing, then
 * request_upgrade) instead of retrying in a loop.
 */
export interface ToolErrorPayload {
  error: string;
  message: string;
  upgrade_url?: string;
  docs_url?: string;
  required_plan?: string;
  feature?: string;
  metric?: string;
  limit?: number;
}

/** Serialize a thrown value into the structured error payload (undefined fields omitted). */
export function toErrorPayload(err: unknown): ToolErrorPayload {
  if (err instanceof ChronaryError) {
    const payload: ToolErrorPayload = {
      error: err.errorType ?? err.name,
      message: err.message,
    };
    if (err.upgradeUrl !== undefined) payload.upgrade_url = err.upgradeUrl;
    if (err.docsUrl !== undefined) payload.docs_url = err.docsUrl;
    if (err.requiredPlan !== undefined) payload.required_plan = err.requiredPlan;
    if (err.feature !== undefined) payload.feature = err.feature;
    if (err.metric !== undefined) payload.metric = err.metric;
    if (err.limit !== undefined) payload.limit = err.limit;
    return payload;
  }
  return { error: 'error', message: err instanceof Error ? err.message : String(err) };
}

/**
 * Wraps an async function so SDK errors become structured ToolResult objects
 * instead of thrown exceptions. LLMs see a structured error object, never
 * stack traces.
 */
export function safeFunc<TParams>(
  fn: (params: TParams) => Promise<unknown>,
): (params: TParams) => Promise<ToolResult> {
  return async (params: TParams): Promise<ToolResult> => {
    try {
      const result = await fn(params);
      return { result: result ?? { success: true }, isError: false };
    } catch (err) {
      return { result: toErrorPayload(err), isError: true };
    }
  };
}
