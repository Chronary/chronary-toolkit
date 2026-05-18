import type { z } from 'zod';
import type { Chronary } from '@chronary/sdk';

/** All 23 tool names exposed by the toolkit */
export type ToolName =
  | 'list_calendars'
  | 'get_calendar'
  | 'create_calendar'
  | 'update_calendar'
  | 'delete_calendar'
  | 'list_events'
  | 'get_event'
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'check_availability'
  | 'list_webhooks'
  | 'get_webhook'
  | 'create_webhook'
  | 'update_webhook'
  | 'delete_webhook'
  | 'list_ical_subscriptions'
  | 'get_ical_subscription'
  | 'create_ical_subscription'
  | 'update_ical_subscription'
  | 'delete_ical_subscription'
  | 'sync_ical_subscription'
  | 'get_usage';

/** All tool names as a runtime array */
export const TOOL_NAMES: ToolName[] = [
  'list_calendars',
  'get_calendar',
  'create_calendar',
  'update_calendar',
  'delete_calendar',
  'list_events',
  'get_event',
  'create_event',
  'update_event',
  'delete_event',
  'check_availability',
  'list_webhooks',
  'get_webhook',
  'create_webhook',
  'update_webhook',
  'delete_webhook',
  'list_ical_subscriptions',
  'get_ical_subscription',
  'create_ical_subscription',
  'update_ical_subscription',
  'delete_ical_subscription',
  'sync_ical_subscription',
  'get_usage',
];

/** MCP-compatible tool annotations */
export interface ToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/** Normalized result every tool function returns */
export interface ToolResult {
  result: unknown;
  isError: boolean;
}

/** A single tool definition — framework-agnostic */
export interface ToolDefinition {
  name: ToolName;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  annotations: ToolAnnotations;
  execute: (client: Chronary, params: Record<string, unknown>) => Promise<ToolResult>;
}

/** Config for creating any toolkit adapter */
export type ChronaryToolkitConfig =
  | { client: Chronary; tools?: ToolName[] }
  | {
      apiKey?: string;
      baseUrl?: string;
      tools?: ToolName[];
      /**
       * Extra headers attached to every SDK request. Wrappers (e.g.
       * `chronary-mcp`) set `X-Chronary-Client` here so the API can
       * attribute the wrapper's traffic separately from the bare SDK's.
       */
      extraHeaders?: Record<string, string>;
    };
