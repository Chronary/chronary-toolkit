import type { z } from 'zod';
import type { Chronary } from '@chronary/sdk';

/** All 54 tool names exposed by the toolkit (tool-for-tool parity with the hosted MCP server) */
export type ToolName =
  | 'list_calendars'
  | 'get_calendar'
  | 'create_calendar'
  | 'update_calendar'
  | 'delete_calendar'
  | 'create_booking_page'
  | 'list_booking_pages'
  | 'get_booking_page'
  | 'delete_booking_page'
  | 'list_events'
  | 'get_event'
  | 'create_event'
  | 'update_event'
  | 'cancel_event'
  | 'confirm_event'
  | 'release_event'
  | 'create_agent'
  | 'list_agents'
  | 'get_agent'
  | 'update_agent'
  | 'delete_agent'
  | 'get_availability'
  | 'find_meeting_time'
  | 'create_connection_link'
  | 'get_connection_link'
  | 'cancel_connection_link'
  | 'get_calendar_context'
  | 'create_proposal'
  | 'list_proposals'
  | 'get_proposal'
  | 'respond_to_proposal'
  | 'resolve_proposal'
  | 'cancel_proposal'
  | 'set_availability_rules'
  | 'get_availability_rules'
  | 'clear_availability_rules'
  | 'list_webhooks'
  | 'get_webhook'
  | 'create_webhook'
  | 'update_webhook'
  | 'delete_webhook'
  | 'list_webhook_deliveries'
  | 'list_ical_subscriptions'
  | 'get_ical_subscription'
  | 'subscribe_ical'
  | 'update_ical_subscription'
  | 'delete_ical_subscription'
  | 'sync_ical_subscription'
  | 'create_scoped_key'
  | 'list_scoped_keys'
  | 'revoke_scoped_key'
  | 'get_audit_log'
  | 'accept_terms'
  | 'get_usage';

/** All tool names as a runtime array */
export const TOOL_NAMES: ToolName[] = [
  'list_calendars',
  'get_calendar',
  'create_calendar',
  'update_calendar',
  'delete_calendar',
  'create_booking_page',
  'list_booking_pages',
  'get_booking_page',
  'delete_booking_page',
  'list_events',
  'get_event',
  'create_event',
  'update_event',
  'cancel_event',
  'confirm_event',
  'release_event',
  'create_agent',
  'list_agents',
  'get_agent',
  'update_agent',
  'delete_agent',
  'get_availability',
  'find_meeting_time',
  'create_connection_link',
  'get_connection_link',
  'cancel_connection_link',
  'get_calendar_context',
  'create_proposal',
  'list_proposals',
  'get_proposal',
  'respond_to_proposal',
  'resolve_proposal',
  'cancel_proposal',
  'set_availability_rules',
  'get_availability_rules',
  'clear_availability_rules',
  'list_webhooks',
  'get_webhook',
  'create_webhook',
  'update_webhook',
  'delete_webhook',
  'list_webhook_deliveries',
  'list_ical_subscriptions',
  'get_ical_subscription',
  'subscribe_ical',
  'update_ical_subscription',
  'delete_ical_subscription',
  'sync_ical_subscription',
  'create_scoped_key',
  'list_scoped_keys',
  'revoke_scoped_key',
  'get_audit_log',
  'accept_terms',
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
