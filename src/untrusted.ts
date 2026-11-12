import type { ToolDefinition, ToolResult } from './types';

/**
 * Event fields whose text can come from outside the org: a public booking
 * page writes the booker's name into `title` and their notes into
 * `description` and `metadata.invitee_notes` (`metadata.source` is
 * `booking_page`). Kept equal to the hosted MCP server's list.
 */
export const EVENT_UNTRUSTED_FIELDS = ['title', 'description', 'metadata'] as const;

/**
 * Webhook delivery fields with third-party text: `payload` carries event text,
 * `response_body` is whatever the receiving server answered.
 */
export const WEBHOOK_DELIVERY_UNTRUSTED_FIELDS = ['payload', 'response_body'] as const;

/**
 * Prefix `untrusted_fields` to a successful JSON object result. Arrays,
 * primitives and errors are returned unchanged.
 */
export function withUntrustedFields(result: ToolResult, fields: readonly string[]): ToolResult {
  const body = result.result;
  if (result.isError || typeof body !== 'object' || body === null || Array.isArray(body)) return result;
  return { ...result, result: { untrusted_fields: [...fields], ...(body as Record<string, unknown>) } };
}

/** Wrap a definition's `execute` so its results carry `untrusted_fields`. */
export function markUntrusted(def: ToolDefinition): ToolDefinition {
  const fields = def.untrustedFields;
  if (!fields || fields.length === 0) return def;
  const execute = def.execute;
  return { ...def, execute: async (client, params) => withUntrustedFields(await execute(client, params), fields) };
}
